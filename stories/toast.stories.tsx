import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
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
