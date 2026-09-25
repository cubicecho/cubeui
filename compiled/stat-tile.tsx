/**
 * Compiled from `registry/layout/stat-tile.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * One number on a card: a label, the figure under it, and a line under that — "Turns · 1,204",
 * "Tracked · 6h 12m · over 7 days". A row of them is the top of every dashboard and status page
 * here. One source for both platforms; `rn2web` compiles it for the DOM.
 *
 * It is here because the same card was written ten times across seven projects, and no two agreed:
 * mcp-zeromem has it twice (`StatCard` on the overview, `Stat` over the health charts) at two value
 * sizes, eunomia's `StatTiles` uppercases its label and zeromem's does not, auto-cal's `ScoreCard`
 * is the native one, and telos and ethos draw the label-over-figure pair with no card at all. The
 * other half of the evidence is the *filter* tile: kanban_server's status page and task_server's
 * both draw a `<button aria-pressed>` of a count and a label, highlighted when
 * its heap is the one shown below — the same tile, pressable.
 *
 * So the one thing it adds to a card is that press, and it is `Card`'s own: given `onPress`, the
 * card is a `Pressable` (a `<button>` in the DOM), reached by Tab and pressed by Enter and Space.
 * Given `selected` beside it, the tile is a toggle — `aria-pressed` on the web, `selected` in the
 * device's accessibility state — and draws itself the way the two status pages did. `selected`
 * without `onPress` is ignored: `aria-pressed` on something that cannot be pressed is markup axe
 * rejects, and a highlight nothing can change is decoration the caller can put in `className`.
 *
 * The parts reuse `PropertyRow`'s words, because they are the same parts: `label` is what the
 * figure is called, `value` the figure, `hint` the line read after it. `icon` sits before the
 * label, as it sits before a title everywhere else.
 *
 * Native inherits nothing, so every `Text` names its colour, and the icon takes its size and ink
 * through `IconClassContext`; on the web the icon is sized from its box with `[&_svg]`.
 */
import type { ReactNode } from "react";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type StatTileProps = {
  /** What the figure is called: "Turns", "Daily average". Drawn above it, muted. */
  label: ReactNode;
  /**
   * The figure: a string or a number, drawn large in tabular numerals so a row of tiles lines up
   * as it ticks. A node works too — a `ColorDot` beside a category's name — and is placed as is.
   */
  value: ReactNode;
  /**
   * One muted line under the figure: what it is out of, or where it comes from — "over 7 days",
   * "schema v4". Read after the value, as part of the tile.
   */
  hint?: ReactNode | undefined;
  /** Before the label. A bare `<Clock />`; the tile sizes it and mutes it. */
  icon?: ReactNode | undefined;
  /**
   * Whether the figure is still being fetched. On, a bar stands in for the value and the label
   * stays — the tile is as tall as it will be, so a row of them does not jump when the data lands.
   */
  loading?: boolean | undefined;
  /**
   * Makes the whole tile a button: a filter to toggle, a page to open. The tile's text is its
   * accessible name, so a count and its label are read together.
   */
  onClick?: (() => void) | undefined;
  /**
   * With `onPress`, the tile is a toggle and this is whether it is on — the filter tile over a
   * list. Left out, the tile is a plain button. Without `onPress` it is ignored.
   */
  selected?: boolean | undefined;
  className?: string | undefined;
  /** The figure's class: the colour a count takes when it is one worth noticing. */
  valueClassName?: string | undefined;
};

/** The icon's box: sized from outside on the web, and by `IconClassContext` on device. */
const ICON_BOX = cn("shrink-0", "[&_svg]:size-4 [&_svg]:shrink-0");

/** A bar standing in for the figure — `Skeleton`'s look, on both platforms, at one line of it. */
const BAR = cn("h-8 w-20 rounded-md bg-accent", "animate-pulse");

/**
 * What a pressable tile adds on the web: a compiled `Pressable` is a `<button>`, which centres its
 * text and draws no focus ring of its own. None of it is a class the device can read.
 */
const PRESSABLE =
  "text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * A wrapper around a caller's node, not layout of its own: a block box on the web, where a compiled
 * view would otherwise be a flex column and lay a dot and a name out as two rows.
 */
const SLOT = "block";

export function StatTile({
  label,
  value,
  hint,
  icon,
  loading = false,
  onClick: onPress,
  selected,
  className,
  valueClassName,
}: StatTileProps) {
  const toggle = onPress !== undefined && selected !== undefined;
  // The pressed state in each platform's spelling. react-native-web forwards `aria-*` and drops
  // `accessibilityState`; the device reads `accessibilityState` and has no `aria-pressed`.
  const pressed = toggle ? { "aria-pressed": selected } : {};

  // The label, hint and icon. A selected tile keeps its card fill and is marked by its border
  // alone, so this ink is the same whether or not it is chosen.
  const ink = "text-muted-foreground";
  const classes = cn(
    "min-w-0 gap-1 p-4",
    onPress !== undefined && PRESSABLE,
    toggle && selected && "border-selection",
    className,
  );

  const body = (
    <>
      <div
        data-slot="stat-tile-label-row"
        className="cube-rn-view min-w-0 flex-row items-center gap-2"
      >
        {icon ? (
          <div data-slot="stat-tile-icon" aria-hidden className={cn("cube-rn-view", ICON_BOX, ink)}>
            <IconClassContext.Provider value={cn("size-4 shrink-0", ink)}>
              {icon}
            </IconClassContext.Provider>
          </div>
        ) : null}
        <span
          data-slot="stat-tile-label"
          className={cn("cube-rn-text", "min-w-0 flex-1 truncate font-medium text-sm", ink)}
        >
          {label}
        </span>
      </div>
      {loading ? (
        <div data-slot="stat-tile-skeleton" aria-hidden className={cn("cube-rn-view", BAR)} />
      ) : typeof value === "string" || typeof value === "number" ? (
        <span
          data-slot="stat-tile-value"
          className={cn(
            "cube-rn-text",
            "font-semibold text-2xl text-card-foreground tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </span>
      ) : (
        <div
          data-slot="stat-tile-value"
          className={cn("cube-rn-view", SLOT, "min-w-0", valueClassName)}
        >
          {value}
        </div>
      )}
      {hint ? (
        <span data-slot="stat-tile-hint" className={cn("cube-rn-text", "text-xs", ink)}>
          {hint}
        </span>
      ) : null}
    </>
  );

  // `Card` is the one that turns into a `Pressable` when it is handed `onPress`, and stays a view
  // when it is handed `undefined` — so a tile nobody can press is not a button.
  return (
    <Card
      data-slot="stat-tile"
      onClick={onPress}
      aria-busy={loading || undefined}
      className={classes}
      {...pressed}
    >
      {body}
    </Card>
  );
}
