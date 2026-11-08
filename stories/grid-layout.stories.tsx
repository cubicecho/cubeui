import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "react-native";
import { expect, within } from "storybook/test";
import { GridLayout as Compiled } from "../compiled/grid-layout";
import { GridLayout as Native } from "../registry/layout/grid-layout";
import { SideBySide } from "./side-by-side";

/**
 * `GridLayout` on both halves: equal cells, one per element, whatever the elements are. A fragment
 * and an array are both opened, and the nothing values a condition leaves behind are dropped.
 */
const meta = {
  title: "RN Parity/GridLayout",
} satisfies Meta;

export default meta;
type Story = StoryObj;

const tile = (name: string) => (
  <View key={name} testID="tile" className="rounded-md border border-foreground/10 p-4">
    <Text className="text-foreground">{name}</Text>
  </View>
);

const hidden = false;

const cells = (
  <>
    {tile("Inbox")}
    {["Review", "Archive"].map(tile)}
    {hidden ? tile("Hidden") : null}
  </>
);

export const OneCellPerElement: Story = {
  render: () => (
    <SideBySide
      native={<Native contentSlot={cells} />}
      compiled={<Compiled contentSlot={cells} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Each tile sits in a cell of its own, and each half's grid holds three: the fragment and the
    // array inside it both opened, the `null` dropped.
    const tiles = canvas.getAllByTestId("tile");
    await expect(tiles).toHaveLength(6);
    const grids = new Set(tiles.map((tile) => tile.parentElement?.parentElement));
    await expect(grids.size).toBe(2);
    for (const grid of grids) {
      await expect(grid?.children).toHaveLength(3);
    }
    await expect(canvas.queryByText("Hidden")).toBeNull();
  },
};

const LONG = "a-run-of-text-with-no-room-to-break-in-it-".repeat(6);

const longCells = [tile("Inbox"), tile(LONG), tile("Review"), tile("Archive")];

/**
 * A cell that holds one long unbroken string keeps its share of the row. Every cell is floored at
 * `min-w-0` (conventions rule 4), so what is in it scrolls or wraps inside the cell rather than the
 * cell growing; and the grid and each cell are reachable from outside by their `data-slot`.
 */
export const LongContent: Story = {
  render: () => (
    <SideBySide
      native={<Native contentSlot={longCells} />}
      compiled={<Compiled contentSlot={longCells} />}
    />
  ),
  play: async ({ canvasElement }) => {
    // `data-testid` on the native half, which react-native-web draws; `data-slot` on the compiled.
    const grids = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-testid="grid-layout"], [data-slot="grid-layout"]',
      ),
    );
    await expect(grids).toHaveLength(2);
    for (const grid of grids) {
      const cellsDrawn = Array.from(
        grid.querySelectorAll<HTMLElement>(
          ':scope > [data-testid="grid-layout-cell"], :scope > [data-slot="grid-layout-cell"]',
        ),
      );
      await expect(cellsDrawn).toHaveLength(4);
      const widths = cellsDrawn.map((cell) => Math.round(cell.getBoundingClientRect().width));
      for (const cell of cellsDrawn) {
        await expect(getComputedStyle(cell).minWidth).toBe("0px");
      }
      // The long string's cell is as wide as its neighbours.
      await expect(new Set(widths).size).toBe(1);
    }
  },
};
