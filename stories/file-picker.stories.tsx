import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import { FilePicker as Compiled } from "../compiled/file-picker";
import { FilePicker as Native } from "../registry/ui/file-picker.tsx";
import { SideBySide } from "./side-by-side";

/**
 * The file picker on both halves. The native half is imported by its full name because Vite
 * would otherwise resolve `file-picker.web.tsx`; it draws the zone and says on screen that it
 * cannot pick, which is the honest version of a placeholder.
 *
 * The compiled half is the hand-written web one: a drop zone over a hidden file input. A drop is
 * simulated with a real `DataTransfer`, which is what a browser hands `onDrop`.
 */
const meta = { title: "Stage 0/FilePicker" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onPick = fn();

/**
 * A `drop` carrying `files`, dispatched as the browser's own `DragEvent`. Testing Library's
 * `fireEvent.drop` copies a `DataTransfer`'s own properties onto a fresh one, and a real one has
 * none — its files live behind getters — so the drop would arrive empty.
 */
function drop(target: Element, files: File[]) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  for (const type of ["dragenter", "dragover", "drop"]) {
    target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
  }
}

/**
 * Issue #132: the zone had `flex-col`, `items-center` and `gap-2` but no `flex`, so it stayed an
 * inline block and the icon, label and hint ran along one line. The assertions are the geometry
 * the classes promise — a column, centred, with the gap between each part.
 */
export const Zone: Story = {
  render: () => (
    <SideBySide
      native={<Native label="Import a board" hint="A .json export" onPick={onPick} />}
      compiled={
        <Compiled
          label="Import a board"
          hint="A .json export"
          accept="application/json,.json"
          onPick={onPick}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onPick.mockClear();

    const zone = canvas.getByRole("button", { name: /Import a board/ });
    await expect(getComputedStyle(zone).display).toBe("flex");
    await expect(getComputedStyle(zone).flexDirection).toBe("column");

    const icon = zone.querySelector("svg");
    const label = within(zone).getByText("Import a board");
    const hint = within(zone).getByText("A .json export");
    if (!icon) throw new Error("the zone should draw its icon");
    const box = (el: Element) => el.getBoundingClientRect();

    // Stacked: each part starts below the one before it, 8px (`gap-2`) apart.
    await expect(box(label).top - box(icon).bottom).toBeCloseTo(8, 0);
    await expect(box(hint).top - box(label).bottom).toBeCloseTo(8, 0);

    // Centred: every part's midline is the zone's.
    const middle = (el: Element) => box(el).left + box(el).width / 2;
    for (const part of [icon, label, hint]) {
      await expect(middle(part)).toBeCloseTo(middle(zone), 0);
    }

    // And it still picks: a dropped file arrives as its text and its name.
    drop(zone, [new File(['{"lanes":[]}'], "board.json", { type: "application/json" })]);
    await waitFor(() => expect(onPick).toHaveBeenCalledWith('{"lanes":[]}', "board.json"));
  },
};
