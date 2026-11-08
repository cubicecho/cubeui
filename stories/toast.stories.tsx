import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import { ToastProvider as CompiledProvider, useToast as useCompiledToast } from "../compiled/toast";
import { ToastProvider as NativeProvider, useToast as useNativeToast } from "../registry/ui/toast";
import { tokenColor } from "./token-color";

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
    await waitFor(() => expect(canvas.getAllByRole("status")).toHaveLength(1));
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Compiled" }));
    const toast = await canvas.findByRole("status");
    const style = getComputedStyle(toast);

    await expect(style.backgroundColor).toBe(tokenColor("secondary", { inside: toast }));
    await expect(style.backgroundColor).not.toBe(tokenColor("positive", { inside: toast }));
    // "Saved." is a word wide; the toast is not.
    await expect(toast.getBoundingClientRect().width).toBeGreaterThan(300);
    await expect(toast.querySelector("svg")).not.toBeNull();

    // The ✕ draws in `currentColor`; a `<button>` left uninked hands it the UA's black, which
    // vanishes on the dark surface.
    const dismiss = within(toast).getByRole("button", { name: "Dismiss" });
    await expect(getComputedStyle(dismiss).color).not.toBe("rgb(0, 0, 0)");
    // The radius of the other floating surfaces — a popover, a menu — not the dialog's (#477).
    await expect(style.borderTopLeftRadius).toBe(
      getComputedStyle(probe(toast, "rounded-md")).borderTopLeftRadius,
    );
    await userEvent.click(dismiss);
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull());
  },
};

/** An element with `className`, beside `near`, to read what a class computes to. Removed on read. */
function probe(near: HTMLElement, className: string) {
  const element = near.ownerDocument.createElement("div");
  element.className = className;
  near.append(element);
  queueMicrotask(() => element.remove());
  return element;
}

/**
 * On a phone with `SidebarLayout`'s `barPosition="bottom"`, a toast sits above the bar rather than
 * over the places in it: the layout says it draws the bar, and the toasts rise by its height under
 * the bar's breakpoint.
 *
 * Tagged `safe-area`, so it runs again as a phone with a home indicator, where the bar is taller
 * by the inset and the stack rises by it too (#460).
 */
export const AboveBottomBar: Story = {
  tags: ["safe-area"],
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
    const toast = await canvas.findByRole("status");
    const barTop = bar?.getBoundingClientRect().top ?? 0;
    // Clear of the bar by the gap the stack keeps from a bare edge, not touching it.
    await expect(toast.getBoundingClientRect().bottom).toBeLessThanOrEqual(barTop - EDGE_GAP);
  },
};

/** The web stack's distance from the edge it is pinned to. */
const EDGE_GAP = 16;

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
 * confirmation's five seconds, so there is time to reach it.
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
    const toast = await canvas.findByRole("status");
    const link = within(toast).getByRole("link", { name: "Go to Media" });
    await expect(link).toHaveAttribute("href", "#media");
    // Under the words, not beside them.
    const message = within(toast).getByText("Moved Jellyfin to Media.");
    await expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      message.getBoundingClientRect().bottom,
    );

    // Following the link would unload the test's page; pressing what is in the slot without it
    // closing the toast is held by AnyElementInActionSlot's Undo.

    // A positive toast goes after five seconds; one with an action is still up.
    await sleep(5500);
    await expect(canvas.getByRole("status")).toBeInTheDocument();

    await userEvent.click(within(toast).getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull());
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
    await waitFor(() => expect(canvas.getAllByRole("status")).toHaveLength(2));
    for (const toast of canvas.getAllByRole("status")) {
      await expect(within(toast).getByText("2 left")).toBeInTheDocument();
      await userEvent.click(within(toast).getByRole("button", { name: "Undo" }));
    }
    // Pressing what is in the slot leaves both up.
    await expect(canvas.getAllByRole("status")).toHaveLength(2);
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
    const toast = await canvas.findByRole("status");
    await userEvent.click(within(toast).getByRole("button", { name: "Go to Media" }));
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull());
  },
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Raises one toast of each tone, and `error`, the old name of `negative`. */
function RaiseEveryTone({ useToast, label }: { useToast: typeof useNativeToast; label: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        toast("Saved.", "positive");
        toast("Two cards were skipped.", "warning");
        toast("Synced an hour ago.", "info");
        toast("Could not save the order.", "negative");
      }}
    >
      {label}
    </button>
  );
}

/**
 * Only a failure interrupts: `negative` is an `alert`, and a confirmation, a note or a warning is a
 * polite `status` (#477). The stack draws three at most, the newest, so the first of the four waits
 * until one goes; the deprecated `error` is still a failure, and the default.
 */
export const PoliteUnlessItFailed: Story = {
  render: () => (
    <div className="flex gap-3">
      <NativeProvider>
        <RaiseEveryTone useToast={useNativeToast} label="Native" />
      </NativeProvider>
      <CompiledProvider>
        <RaiseEveryTone useToast={useCompiledToast} label="Compiled" />
        <RaiseOld useToast={useCompiledToast} />
      </CompiledProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["Native", "Compiled"]) {
      await userEvent.click(canvas.getByRole("button", { name: half }));
      const stack = await waitFor(() => {
        const viewports = canvasElement.querySelectorAll<HTMLElement>(
          "[data-slot=toast-viewport], [data-testid=toast-viewport]",
        );
        const filled = Array.from(viewports).find((viewport) => viewport.childElementCount > 0);
        if (filled === undefined) {
          throw new Error(`the ${half} stack should be drawn`);
        }
        return filled;
      });
      await expect(stack).toHaveAttribute("aria-live", "polite");
      await expect(
        Array.from(stack.children).map((toast) => [toast.textContent, toast.getAttribute("role")]),
      ).toEqual([
        ["Two cards were skipped.", "status"],
        ["Synced an hour ago.", "status"],
        ["Could not save the order.", "alert"],
      ]);
      for (const dismiss of within(stack).getAllByRole("button", { name: "Dismiss" })) {
        await userEvent.click(dismiss);
      }
      // The one held back is drawn once there is room for it.
      await waitFor(() => expect(stack).toHaveTextContent(/^Saved\.$/));
      await userEvent.click(within(stack).getByRole("button", { name: "Dismiss" }));
      await waitFor(() => expect(stack.childElementCount).toBe(0));
    }

    await userEvent.click(canvas.getByRole("button", { name: "Old names" }));
    const alerts = await canvas.findAllByRole("alert");
    await expect(alerts.map((toast) => toast.textContent)).toEqual([
      "Could not move the card.",
      "Could not rename the board.",
    ]);
  },
};

/** `error` by name, and no tone at all. */
function RaiseOld({ useToast }: { useToast: typeof useNativeToast }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        toast("Could not move the card.", "error");
        toast("Could not rename the board.");
      }}
    >
      Old names
    </button>
  );
}

/**
 * A confirmation stays five seconds, and its clock stops while the pointer is over the stack or
 * focus is in it: a toast does not leave from under the reader or out of reach of a keyboard.
 */
export const PausesWhileHeld: Story = {
  render: () => (
    <CompiledProvider>
      <Raise useToast={useCompiledToast} label="Save" />
    </CompiledProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const hovered = await canvas.findByRole("status");
    await sleep(4000);
    await expect(hovered).toBeInTheDocument();
    await userEvent.hover(hovered);
    // Past its five seconds, and still up while the pointer is over it.
    await sleep(1500);
    await expect(hovered).toBeInTheDocument();
    await userEvent.unhover(hovered);
    // The second it had left.
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 2000 });

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    const focused = await canvas.findByRole("status");
    await sleep(4000);
    within(focused).getByRole("button", { name: "Dismiss" }).focus();
    await sleep(1500);
    await expect(focused).toBeInTheDocument();
    canvas.getByRole("button", { name: "Save" }).focus();
    await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 2000 });
  },
};
