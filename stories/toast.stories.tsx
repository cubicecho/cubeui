import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import { ToastProvider as CompiledProvider, useToast as useCompiledToast } from "../compiled/toast";
import { ToastProvider as NativeProvider, useToast as useNativeToast } from "../registry/ui/toast";

/**
 * The toast, raised from the compiled half — the one a DOM app draws. The play test is what says a
 * toast is not drawn as a button: it sits on the raised surface rather than a block of the tone's
 * colour, it is a set width rather than its message's, and the tone is a glyph as well as a hue.
 * The native source is mounted too, so a provider that stops rendering on either half fails here.
 */
const meta = { title: "RN Parity/Toast" } satisfies Meta;
export default meta;
type Story = StoryObj;

function Raise({ useToast, label }: { useToast: typeof useNativeToast; label: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast("Saved.", "positive")}>
      {label}
    </button>
  );
}

/** A token as the browser resolves it, so an assertion compares like with like. */
function resolved(token: string, inside: Element) {
  const probe = document.createElement("span");
  probe.style.backgroundColor = `var(--${token})`;
  inside.appendChild(probe);
  try {
    return getComputedStyle(probe).backgroundColor;
  } finally {
    probe.remove();
  }
}

export const NotAButton: Story = {
  render: () => (
    <div className="flex gap-3">
      <NativeProvider>
        <Raise useToast={useNativeToast} label="Native" />
      </NativeProvider>
      <CompiledProvider>
        <Raise useToast={useCompiledToast} label="Compiled" />
      </CompiledProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Native" }));
    await waitFor(() => expect(canvas.getAllByRole("alert")).toHaveLength(1));
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Compiled" }));
    const toast = await canvas.findByRole("alert");
    const style = getComputedStyle(toast);

    await expect(style.backgroundColor).toBe(resolved("secondary", toast));
    await expect(style.backgroundColor).not.toBe(resolved("positive", toast));
    // "Saved." is a word wide; the toast is not.
    await expect(toast.getBoundingClientRect().width).toBeGreaterThan(300);
    await expect(toast.querySelector("svg")).not.toBeNull();

    // The ✕ draws in `currentColor`; a `<button>` left uninked hands it the UA's black, which
    // vanishes on the dark surface.
    const dismiss = within(toast).getByRole("button", { name: "Dismiss" });
    await expect(getComputedStyle(dismiss).color).not.toBe("rgb(0, 0, 0)");
    await userEvent.click(dismiss);
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
  },
};

/**
 * On a phone with `SidebarLayout`'s `barPosition="bottom"`, a toast sits above the bar rather than
 * over the places in it: the layout says it draws the bar, and the toasts rise by its height under
 * the bar's breakpoint.
 */
export const AboveBottomBar: Story = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile2", isRotated: false } },
  render: () => (
    <CompiledProvider>
      <div className="h-screen">
        <CompiledLayout
          className="h-full"
          sidebarHideBelow="md"
          barPosition="bottom"
          navLabel="Main"
          navSlot={<span className="text-sm">Places</span>}
          sidebarSlot={<span>Rail</span>}
          contentSlot={<Raise useToast={useCompiledToast} label="Save" />}
        />
      </div>
    </CompiledProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(window.matchMedia("(min-width: 48rem)").matches).toBe(false);
    const bar = canvasElement.querySelector<HTMLElement>("[data-slot=sidebar-layout-bottom-bar]");
    expect(bar).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const toast = await canvas.findByRole("alert");
    const barTop = bar?.getBoundingClientRect().top ?? 0;
    await expect(toast.getBoundingClientRect().bottom).toBeLessThanOrEqual(barTop);
  },
};

/** What `show` takes as its options, from whichever half's hook raised it. */
type RaiseOptions = Parameters<ReturnType<typeof useNativeToast>>[2];

function RaiseWith({
  useToast,
  label,
  message,
  options,
}: {
  useToast: typeof useNativeToast;
  label: string;
  message: string;
  options: RaiseOptions;
}) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast(message, "positive", options)}>
      {label}
    </button>
  );
}

/**
 * A link in the slot: elements of the caller's, under the message. The toast stays past a
 * confirmation's three seconds, so there is time to reach it.
 */
export const LinkInActionSlot: Story = {
  render: () => (
    <CompiledProvider>
      <RaiseWith
        useToast={useCompiledToast}
        label="Move"
        message="Moved Jellyfin to Media."
        options={{
          actionSlot: (
            <CompiledButton
              variant="link"
              size="sm"
              linkSlot={<a href="#media" />}
              content="Go to Media"
              className="h-auto px-0"
            />
          ),
        }}
      />
    </CompiledProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Move" }));
    const toast = await canvas.findByRole("alert");
    const link = within(toast).getByRole("link", { name: "Go to Media" });
    await expect(link).toHaveAttribute("href", "#media");
    // Under the words, not beside them.
    const message = within(toast).getByText("Moved Jellyfin to Media.");
    await expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      message.getBoundingClientRect().bottom,
    );

    // Following the link would unload the test's page; pressing what is in the slot without it
    // closing the toast is held by AnyElementInActionSlot's Undo.

    // A positive toast goes after three seconds; one with an action is still up.
    await new Promise((resolve) => setTimeout(resolve, 3500));
    await expect(canvas.getByRole("alert")).toBeInTheDocument();

    await userEvent.click(within(toast).getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
  },
};

/** Anything in the slot: here a note and a button of the caller's own, on both halves. */
export const AnyElementInActionSlot: Story = {
  render: () => {
    const actionSlot = (
      <>
        <span className="text-xs text-foreground/60">2 left</span>
        <button type="button" className="text-sm text-info underline">
          Undo
        </button>
      </>
    );
    return (
      <div className="flex gap-3">
        <NativeProvider>
          <RaiseWith
            useToast={useNativeToast}
            label="Native"
            message="Archived."
            options={{ actionSlot }}
          />
        </NativeProvider>
        <CompiledProvider>
          <RaiseWith
            useToast={useCompiledToast}
            label="Compiled"
            message="Archived."
            options={{ actionSlot }}
          />
        </CompiledProvider>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Native" }));
    await userEvent.click(canvas.getByRole("button", { name: "Compiled" }));
    await waitFor(() => expect(canvas.getAllByRole("alert")).toHaveLength(2));
    for (const toast of canvas.getAllByRole("alert")) {
      await expect(within(toast).getByText("2 left")).toBeInTheDocument();
      await userEvent.click(within(toast).getByRole("button", { name: "Undo" }));
    }
    // Pressing what is in the slot leaves both up.
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
  },
};

/** A function slot is handed the toast's `dismiss`, for content that should close it. */
export const DismissFromActionSlot: Story = {
  render: () => (
    <CompiledProvider>
      <RaiseWith
        useToast={useCompiledToast}
        label="Move"
        message="Moved Jellyfin to Media."
        options={{
          actionSlot: (dismiss) => (
            <CompiledButton
              variant="link"
              size="sm"
              content="Go to Media"
              className="h-auto px-0"
              onClick={dismiss}
            />
          ),
        }}
      />
    </CompiledProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Move" }));
    const toast = await canvas.findByRole("alert");
    await userEvent.click(within(toast).getByRole("button", { name: "Go to Media" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
  },
};
