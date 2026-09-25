import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Spinner as Compiled } from "../compiled/spinner";
import { Spinner as Native } from "../registry/ui/spinner";
import { SideBySide } from "./side-by-side";

/**
 * The spinner on both halves: one `status` each, named `Loading` or the caller's `label`, the same
 * glyph at the same size, turning.
 */
const meta = { title: "Stage 0/Spinner" } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row items-center gap-4">
          <Native />
          <Native label="Loading servers" className="size-6 text-muted-foreground" />
        </div>
      }
      compiled={
        <div className="flex flex-row items-center gap-4">
          <Compiled />
          <Compiled label="Loading servers" className="size-6 text-muted-foreground" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole("status")).toHaveLength(4);
    const [nativeDefault, compiledDefault] = canvas.getAllByRole("status", { name: "Loading" });
    const [nativeLabelled, compiledLabelled] = canvas.getAllByRole("status", {
      name: "Loading servers",
    });
    if (!nativeDefault || !compiledDefault || !nativeLabelled || !compiledLabelled) {
      throw new Error("both halves should render both spinners");
    }

    // The same glyph at the same size: 16px by default, and the caller's class wins.
    const size = (el: Element) => {
      const svg = el.tagName.toLowerCase() === "svg" ? el : el.querySelector("svg");
      if (!svg) throw new Error("a spinner should draw an svg");
      return svg.getBoundingClientRect().width;
    };
    await expect(size(nativeDefault)).toBe(16);
    await expect(size(compiledDefault)).toBe(16);
    await expect(size(nativeLabelled)).toBe(24);
    await expect(size(compiledLabelled)).toBe(24);

    // Both turn: the compiled one by CSS animation, the native one by a transform Animated drives.
    await expect(getComputedStyle(compiledDefault).animationName).not.toBe("none");
    await expect(
      nativeDefault.style.transform || getComputedStyle(nativeDefault).transform,
    ).toMatch(/rotate|matrix/);
  },
};
