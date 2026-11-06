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
