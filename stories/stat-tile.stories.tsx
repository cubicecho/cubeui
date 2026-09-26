import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Clock as CompiledClock } from "../compiled/icons";
import { StatTile as Compiled } from "../compiled/stat-tile";
import { StatTile as Native } from "../registry/layout/stat-tile";
import { Clock as NativeClock } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * The stat tile on both halves: a row of read-only figures, the way mcp-zeromem's overview draws
 * them, and a row of filter tiles, the way kanban_server's and task_server's status pages do. The
 * play tests hold what the hand-written copies disagreed on — a read-only tile is not a button, a
 * filter tile is one with `aria-pressed` following the caller's state, and the label, the figure
 * and the hint stack in that order at the same size on both halves.
 */
const meta = { title: "Stage 0/Stat Tile" } satisfies Meta;
export default meta;
type Story = StoryObj;

/** The compiled half speaks DOM prop names — `onClick` — so each half is handed its own. */
type Tile = (props: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  press?: (() => void) | undefined;
  selected?: boolean;
  valueClassName?: string | undefined;
}) => ReactNode;

const NativeTile: Tile = ({ press, ...props }) => <Native {...props} onPress={press} />;
const CompiledTile: Tile = ({ press, ...props }) => <Compiled {...props} onClick={press} />;

function Overview({ Tile, icon }: { Tile: Tile; icon: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Tile label="Turns" value="1,204" />
      <Tile label="Entities" value="318" hint="2,041 co-occurrence edges" />
      <Tile label="Uptime" value="3d 4h" hint="v0.9.2 · read-only" icon={icon} />
      <Tile label="Embeddings" value="" loading />
    </div>
  );
}

/** The tile's root, by either half's spelling of its test hook. */
const TILE = '[data-testid="stat-tile"], [data-slot="stat-tile"]';

const HEAPS = [
  { key: "attention", label: "Needs you", count: 3 },
  { key: "running", label: "Running", count: 5 },
  { key: "done", label: "Done", count: 12 },
] as const;

function Filters({ Tile }: { Tile: Tile }) {
  const [shown, setShown] = useState<string | null>(null);
  const [opened, setOpened] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {HEAPS.map((heap) => (
          <Tile
            key={heap.key}
            label={heap.label}
            value={heap.count}
            selected={shown === heap.key}
            press={() => setShown(shown === heap.key ? null : heap.key)}
            valueClassName={heap.key === "attention" ? "text-destructive" : undefined}
          />
        ))}
      </div>
      <Tile
        label="Archived"
        value={40}
        hint="Open the archive"
        press={() => setOpened(opened + 1)}
      />
      <p className="text-muted-foreground text-xs">
        Showing {shown ?? "everything"}, opened {opened}
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<Overview Tile={NativeTile} icon={<NativeClock />} />}
      compiled={<Overview Tile={CompiledTile} icon={<CompiledClock />} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);

    const boxes: DOMRect[] = [];
    const sizes: string[] = [];
    for (const half of halves) {
      const scope = within(half as HTMLElement);

      // Read-only tiles are not targets: no button anywhere in the row.
      await expect(scope.queryAllByRole("button")).toHaveLength(0);

      // Label, figure, hint: stacked, in that order, left-aligned.
      const label = scope.getByText("Entities").getBoundingClientRect();
      const value = scope.getByText("318");
      const valueBox = value.getBoundingClientRect();
      const hint = scope.getByText("2,041 co-occurrence edges").getBoundingClientRect();
      await expect(valueBox.top).toBeGreaterThanOrEqual(label.bottom - 1);
      await expect(hint.top).toBeGreaterThanOrEqual(valueBox.bottom - 1);
      await expect(Math.abs(valueBox.left - label.left)).toBeLessThan(1);
      sizes.push(getComputedStyle(value).fontSize, getComputedStyle(value).fontVariantNumeric);

      // The icon sits before its label, at the tile's size.
      const icon = half.querySelector("svg");
      if (!icon) throw new Error("the Uptime tile should draw its icon");
      const uptime = scope.getByText("Uptime").getBoundingClientRect();
      await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(uptime.left);
      await expect(icon.getBoundingClientRect().width).toBe(16);

      // Loading keeps the label and holds the figure's place with a bar, and says it is busy.
      const loading = scope.getByText("Embeddings").closest("[aria-busy]");
      if (!loading) throw new Error("a loading tile should be aria-busy");
      await expect(loading.getAttribute("aria-busy")).toBe("true");
      await expect(
        loading.querySelector(
          '[data-testid="stat-tile-skeleton"], [data-slot="stat-tile-skeleton"]',
        ),
      ).not.toBeNull();

      boxes.push(scope.getByText("Turns").closest(TILE)?.getBoundingClientRect() as DOMRect);
    }

    // And the two halves draw it alike: the same figure, the same tile.
    await expect(sizes[0]).toBe(sizes[2]);
    await expect(sizes[1]).toBe(sizes[3]);
    const [nativeBox, compiledBox] = boxes;
    if (!nativeBox || !compiledBox) throw new Error("both halves should draw the Turns tile");
    await expect(Math.abs(nativeBox.height - compiledBox.height)).toBeLessThanOrEqual(1);
  },
};

export const Filter: Story = {
  render: () => (
    <SideBySide native={<Filters Tile={NativeTile} />} compiled={<Filters Tile={CompiledTile} />} />
  ),
  play: async ({ canvasElement }) => {
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);

    for (const half of halves) {
      const scope = within(half as HTMLElement);

      // Every tile is a toggle button named by its figure and its label, and none is on yet.
      const needsYou = scope.getByRole("button", { name: /Needs you/ });
      const running = scope.getByRole("button", { name: /Running/ });
      await expect(needsYou).toHaveAccessibleName(/3/);
      for (const heap of HEAPS) {
        const tile = scope.getByRole("button", { name: new RegExp(heap.label) });
        await expect(tile).toHaveAttribute("aria-pressed", "false");
      }
      const idle = getComputedStyle(running).borderColor;

      // Pressing one turns it on, and draws it — the caller's state, handed back.
      await userEvent.click(needsYou);
      await expect(needsYou).toHaveAttribute("aria-pressed", "true");
      await expect(running).toHaveAttribute("aria-pressed", "false");
      await expect(scope.getByText("Showing attention, opened 0")).toBeVisible();
      // Chosen is the selection border, and only that: the fill stays the card's, so a chosen tile
      // does not look like a hovered one.
      await waitFor(() => expect(getComputedStyle(needsYou).borderColor).not.toBe(idle));

      // Another moves it; pressing that one again turns the filter off.
      await userEvent.click(running);
      await expect(running).toHaveAttribute("aria-pressed", "true");
      await expect(needsYou).toHaveAttribute("aria-pressed", "false");
      // Waited for, since the web half changes it with a transition.
      await waitFor(() => expect(getComputedStyle(running).borderColor).not.toBe(idle));
      await userEvent.click(running);
      await expect(running).toHaveAttribute("aria-pressed", "false");
      await waitFor(() => expect(getComputedStyle(running).borderColor).toBe(idle));

      // The keyboard: it is a real button, so Space presses it.
      needsYou.focus();
      await userEvent.keyboard(" ");
      await expect(needsYou).toHaveAttribute("aria-pressed", "true");

      // `onPress` without `selected` is a plain button: no pressed state to announce.
      const archived = scope.getByRole("button", { name: /Archived/ });
      await expect(archived).not.toHaveAttribute("aria-pressed");
      await userEvent.click(archived);
      await expect(scope.getByText("Showing attention, opened 1")).toBeVisible();

      // Left-aligned, as a tile, not centred as a button would be. The glyphs are measured, not
      // their box: the figure's box spans the tile either way, and the text inside it is what moves.
      const figure = within(needsYou).getByText("3");
      const glyphs = document.createRange();
      glyphs.selectNodeContents(figure);
      const ink = glyphs.getBoundingClientRect();
      const box = needsYou.getBoundingClientRect();
      await expect(ink.left - box.left).toBeLessThan(box.right - ink.right);
    }
  },
};
