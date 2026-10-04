import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PageHeader as Compiled } from "../compiled/page-header";
import { PageHeader as Native } from "../registry/layout/page-header";
import { SideBySide } from "./side-by-side";

/**
 * `PageHeader`'s title row has a floor, so a title with a tall action beside it and a title alone
 * sit at the same height. The row wraps, and what is checked here is that the floor centres its
 * one line on both halves.
 */
const meta = {
  title: "RN Parity/PageHeader",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The gap above and below `inner` inside `outer`, in pixels. */
function bands(outer: Element, inner: Element): { above: number; below: number } {
  const outerBox = outer.getBoundingClientRect();
  const innerBox = inner.getBoundingClientRect();
  return { above: innerBox.top - outerBox.top, below: outerBox.bottom - innerBox.bottom };
}

/**
 * A wrapping row packs its lines at the start under react-native-web, as Yoga does, so the title
 * sat at the top of its floor with an empty 28px band under it (#248).
 */
export const TitleOnly: Story = {
  args: { title: "Settings" },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    const pairs = [
      ["[data-testid=page-header-title-row]", "[data-testid=page-header-titles]"],
      ["[data-slot=page-header-title-row]", "[data-slot=page-header-titles]"],
    ] as const;

    for (const [rowSelector, titlesSelector] of pairs) {
      const row = canvasElement.querySelector(rowSelector);
      const titles = canvasElement.querySelector(titlesSelector);
      if (row === null || titles === null) {
        throw new Error(`No title row matches ${rowSelector}.`);
      }
      const { above, below } = bands(row, titles);
      await expect(above).toBeGreaterThan(0);
      await expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
    }
  },
};
