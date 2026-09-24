import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Badge as Compiled } from "../compiled/badge";
import { Badge as Native } from "../registry/ui/badge";
import { SideBySide } from "./side-by-side";

/**
 * A removable badge on both halves: the ✕ is a button of its own, named `Remove <text>`, drawn in
 * the label's colour and inside the pill's height. The published story covers the web half's
 * extras — the form it must not submit, the `onClick` it must not fire.
 */
const meta = { title: "Stage 0/Badge" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onRemove = fn();

export const Removable: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Native onRemove={onRemove}>Urgent</Native>
          <Native backgroundColor="#1d4ed8" textColor="#ffffff" onRemove={onRemove}>
            Design
          </Native>
          <Native>Plain</Native>
          <Native variant="secondary" label="Paused" onRemove={onRemove} />
        </div>
      }
      compiled={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Compiled onRemove={onRemove}>Urgent</Compiled>
          <Compiled backgroundColor="#1d4ed8" textColor="#ffffff" onRemove={onRemove}>
            Design
          </Compiled>
          <Compiled>Plain</Compiled>
          <Compiled variant="secondary" label="Paused" onRemove={onRemove} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onRemove.mockClear();

    // Two removable pills per half, and no ✕ on either dot.
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
    const [nativeUrgent, compiledUrgent] = canvas.getAllByRole("button", { name: "Remove Urgent" });
    const [nativeDesign, compiledDesign] = canvas.getAllByRole("button", { name: "Remove Design" });
    if (!nativeUrgent || !compiledUrgent || !nativeDesign || !compiledDesign) {
      throw new Error("both halves should render both remove buttons");
    }

    await userEvent.click(nativeUrgent);
    await expect(onRemove).toHaveBeenCalledTimes(1);
    await userEvent.click(compiledUrgent);
    await expect(onRemove).toHaveBeenCalledTimes(2);

    // The glyph's stroke is the label's colour: the variant's ink where nothing overrides it, and
    // the caller's `textColor` where something does.
    const stroke = (button: HTMLElement) => {
      const svg = button.querySelector("svg");
      if (!svg) throw new Error("the remove button should draw an icon");
      return getComputedStyle(svg).stroke;
    };
    const [nativeUrgentText] = canvas.getAllByText("Urgent");
    if (!nativeUrgentText) throw new Error("the native label should render");
    await expect(stroke(nativeUrgent)).toBe(getComputedStyle(nativeUrgentText).color);
    await expect(stroke(compiledUrgent)).toBe(getComputedStyle(nativeUrgentText).color);
    await expect(stroke(nativeDesign)).toBe("rgb(255, 255, 255)");
    await expect(stroke(compiledDesign)).toBe("rgb(255, 255, 255)");

    // The ✕ is shorter than the label's line, so the pill is the height of one without it.
    const [nativePlain, compiledPlain] = canvas.getAllByText("Plain");
    const height = (el: Element | null | undefined) => el?.getBoundingClientRect().height;
    await expect(height(nativeUrgent.parentElement)).toBe(height(nativePlain?.parentElement));
    await expect(height(compiledUrgent.parentElement)).toBe(height(compiledPlain));
  },
};
