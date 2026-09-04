import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * How much of the split the sidebar claims.
 *
 * Fixed rungs (`sm`/`md`/`lg`) are for an inspector — a thing whose useful width is set by its
 * contents, not by the window. Proportional rungs are for a second working surface that should
 * grow with the screen. `auto` is the icon strip: as wide as what is in it.
 *
 * The scale is named rungs rather than a free number because the widths it replaces were spelled
 * every way to hand — `60%`, `320px`, `2fr`, `22rem`, `3fr/2fr`, `1fr/4fr`, `minmax(16rem,20rem)`,
 * `min-content`, `w-56`, `w-72 lg:w-80`, `w-14 lg:w-56` — with no way to read which differences
 * were decisions and which were the nearest number at the time. A width that falls between two
 * rungs is a call site choosing the nearer one, not a case for a ninth rung.
 */
export type SidebarWidth =
  | "auto"
  | "sm"
  | "md"
  | "lg"
  | "fifth"
  | "two-fifths"
  | "half"
  | "two-thirds";

/**
 * `[sidebar, main]` track sizes.
 *
 * Every track is `minmax(0,…)` rather than the `auto` a grid track floors itself at, because
 * `auto` floors it at its content: one wide table in the main pane widens its own track and
 * shoves the sidebar off the screen. This is the track-level half of rule 4 — `min-w-0` on the
 * cells is the item-level half, and both are needed, since a floored track still holds an
 * unfloored item that can overflow it.
 */
const TRACKS: Record<SidebarWidth, [string, string]> = {
  auto: ["min-content", "minmax(0,1fr)"],
  sm: ["minmax(0,20rem)", "minmax(0,1fr)"],
  md: ["minmax(16rem,22rem)", "minmax(0,1fr)"],
  lg: ["minmax(18rem,28rem)", "minmax(0,1fr)"],
  fifth: ["minmax(0,1fr)", "minmax(0,4fr)"],
  "two-fifths": ["minmax(0,2fr)", "minmax(0,3fr)"],
  half: ["minmax(0,1fr)", "minmax(0,1fr)"],
  "two-thirds": ["minmax(0,2fr)", "minmax(0,1fr)"],
};

/**
 * The width below which the sidebar stacks under the main surface instead of sitting beside it.
 *
 * Four literal classes rather than a composed one, per rule 3: Tailwind's scanner reads source
 * text, so `` `${bp}:grid-cols-…` `` names a class that is never generated. The *template* is the
 * part that is genuinely dynamic, so it rides a custom property, which CSS resolves at run time
 * and the scanner never has to see.
 */
const STACK_BELOW = {
  never: "grid-cols-[var(--cube-sidebar-cols)]",
  md: "md:grid-cols-[var(--cube-sidebar-cols)]",
  lg: "lg:grid-cols-[var(--cube-sidebar-cols)]",
  xl: "xl:grid-cols-[var(--cube-sidebar-cols)]",
} as const;

/**
 * The rule turns where the panes do: a hairline column between two panes side by side, a hairline
 * row between the same two stacked. Keyed by the same breakpoint as {@link STACK_BELOW} so the two
 * can never disagree about where the layout flips.
 */
const DIVIDER_AT: Record<keyof typeof STACK_BELOW, string> = {
  never: "h-auto w-px",
  md: "h-px w-full md:h-auto md:w-px",
  lg: "h-px w-full lg:h-auto lg:w-px",
  xl: "h-px w-full xl:h-auto xl:w-px",
};

/** What sits between the panes. A rule is drawn flush; space is drawn with nothing in it. */
const DIVIDERS = { space: "gap-4", line: "gap-0", none: "gap-0" } as const;

type SidebarLayoutProps = {
  /**
   * The main surface — the one the screen is about. Alone, it is the whole width, so a caller
   * never has to special-case the un-split state.
   */
  content: ReactNode;
  /**
   * The second surface: a navigation column, an inspector, a note list, an order panel.
   *
   * Absent, the pane is one full-width column and neither a sidebar cell nor a divider is drawn.
   * That absence is also how a pane collapses — see the component note — which is why there is no
   * `collapsed` prop and no state held here.
   */
  sidebar?: ReactNode;
  /** Which side the sidebar sits on. Stacked, it keeps this reading order rather than jumping. */
  sidebarPosition?: "start" | "end";
  /** {@link SidebarWidth}. Naming the width is what stops eight call sites each inventing one. */
  sidebarWidth?: SidebarWidth;
  /**
   * Below this width the two stack rather than sit side by side. `never` keeps them side by side
   * at every width — an icon strip, a kiosk, a pane already inside a media query the caller owns.
   *
   * Stacking, not hiding, is the narrow-width answer: a phone has no room for two panes, but it
   * has room for one after the other. A screen where the sidebar is genuinely meaningless on a phone
   * wants a separate route for it, not a pane that is present and off-screen.
   */
  stackBelow?: keyof typeof STACK_BELOW;
  /**
   * What separates the panes.
   *
   * - `space` — a gap. Two surfaces on a page, which is what most content splits are.
   * - `line` — flush, with a hairline rule between them. The app shell: a navigation column against a
   *   working surface. Every hand-written one draws this as a `border-r` on the sidebar, which is
   *   right until the layout stacks and the border becomes a line down one side of the screen
   *   instead of a line between the two panes.
   * - `none` — flush, nothing drawn. The panes carry their own edges.
   *
   * One prop rather than a `gap` and a `bordered`, because they are the same decision: a rule
   * with a gap on both sides is a line floating in the middle of nothing.
   */
  divider?: keyof typeof DIVIDERS;
  className?: string;
  contentClassName?: string;
  sidebarClassName?: string;
};

/**
 * Two surfaces side by side: a main one and a sidebar.
 *
 * The floors are the reason this is a component rather than a class string. A grid cell's
 * `min-width` is `auto`, so one wide child — a table, a long unbroken string — grows its track
 * and pushes the other pane off the screen instead of scrolling inside its own. `min-h-0` /
 * `min-w-0` on both cells is what makes a nested scroll container work at all, and it is the same
 * failure `HeaderContentFooter` guards in the other axis: there a wide child pushes the
 * chrome out of the column, here it pushes the neighbouring pane out of the row. Half the panes
 * this replaces are missing one or both.
 *
 * **It is not resizable, and that is a decision rather than a gap.** A draggable divider needs a
 * pointer handler and a stored width, and a stored width is state, which rule 8 keeps out of a
 * shell. The two ways to keep it out both fail on their own terms: expressing the drag in CSS
 * (`resize: horizontal`) gives a handle only a mouse can reach, and lifting the width out to
 * `sidebarWidth`/`onSidebarWidthChange` still leaves the drag itself — behaviour — in here, to be
 * re-derived worse than `react-resizable-panels`, which shadcn already ships as `resizable`.
 * Rule 3 says do not wrap what shadcn ships; this is its other half, do not rebuild it either. A
 * screen that genuinely needs a draggable split is a screen for that primitive. None of the call
 * sites this replaces has one.
 *
 * Because nothing drags, the divider is a rule and not a control: `aria-hidden`, no role, no tab
 * stop. A focus stop that does nothing when you press an arrow key is worse than no focus stop —
 * axe is satisfied and the keyboard user is standing in a dead end. The contrast is
 * `HeaderContentFooter`'s scrolling body, which takes a tab stop precisely because it
 * *does* something once you are there. Scrolling stays there too: a pane that needs to scroll is
 * a `StickyHeaderContentFooter` passed as `content` or `sidebar`, so this shell adds no scroll
 * container of its own and no keyboard trap to go with it.
 *
 * **A collapsed pane is an absent one.** Every sidebar eventually wants to close, and the whole
 * of that is `sidebar={open ? nav : undefined}` — the caller already holds the toggle, and the
 * un-split layout is the full-width column that was needed anyway for the inspector with nothing
 * selected. A `collapsed` prop would buy a second way to say it and a piece of state to keep in
 * step with the first.
 *
 * **No `loading`.** `CardLayout` has one because a card has a single body and a precedence to
 * own (`loading` outranks `empty`). A split has neither: it has two panes that arrive at
 * different times, and one boolean across both has to either skeleton a navigation column that was never
 * waiting or pick a pane, which is a second prop. The prior art shows the failure directly — the
 * layout this is drawn from had a `loading` that replaced the entire chassis with a bare
 * skeleton, so chrome already on the screen blinked out and came back. Each pane's content owns
 * its own loading state, and a pane that is a `CardLayout` already has the word for it.
 *
 * **Horizontal only.** Stacking below `stackBelow` is the vertical arrangement, and a split that is
 * vertical at every width is two zones in a column with floors between them — which is
 * `HeaderContentFooter`, already. A vertical orientation here would be rule 7's exact bug:
 * a second implementation of a shape another shell owns.
 */
export function SidebarLayout({
  content,
  sidebar,
  sidebarPosition = "end",
  sidebarWidth = "sm",
  stackBelow = "lg",
  divider = "space",
  className,
  contentClassName,
  sidebarClassName,
}: SidebarLayoutProps) {
  const main = (
    <div data-slot="sidebar-layout-content" className={cn("min-h-0 min-w-0", contentClassName)}>
      {content}
    </div>
  );

  // Rule 5 — an absent slot draws nothing. Not an empty cell, and not a track whose gap is still
  // spent: with no sidebar there is one column and the main pane has the whole width.
  if (!sidebar) {
    return (
      <div data-slot="sidebar-layout" className={cn("grid min-h-0 min-w-0 grid-cols-1", className)}>
        {main}
      </div>
    );
  }

  const [sidebarTrack, mainTrack] = TRACKS[sidebarWidth];
  const tracks =
    sidebarPosition === "start" ? [sidebarTrack, mainTrack] : [mainTrack, sidebarTrack];
  // The rule gets a track of its own rather than a border on a cell, so that when the panes stack
  // it becomes a row between them instead of a line down one side of the screen.
  const columns = divider === "line" ? [tracks[0], "1px", tracks[1]] : tracks;

  const sidebarCell = (
    <div data-slot="sidebar-layout-sidebar" className={cn("min-h-0 min-w-0", sidebarClassName)}>
      {sidebar}
    </div>
  );

  return (
    <div
      data-slot="sidebar-layout"
      className={cn(
        "grid min-h-0 min-w-0 grid-cols-1",
        DIVIDERS[divider],
        STACK_BELOW[stackBelow],
        className,
      )}
      style={{ "--cube-sidebar-cols": columns.join(" ") } as CSSProperties}
    >
      {sidebarPosition === "start" ? sidebarCell : main}
      {divider === "line" ? (
        <div
          data-slot="sidebar-layout-divider"
          aria-hidden
          className={cn("self-stretch bg-border", DIVIDER_AT[stackBelow])}
        />
      ) : null}
      {sidebarPosition === "start" ? main : sidebarCell}
    </div>
  );
}
