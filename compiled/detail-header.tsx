/**
 * Compiled from `registry/layout/detail-header.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * The header row of a detail view: back button, optional colour dot, title,
 * badges, description, trailing actions.
 *
 * Distinct from `PageHeader` in `layout/page-header` by the back affordance and the
 * leading dot — a detail view is reached *from* somewhere, and a list page is
 * not.
 */
import type { ReactNode } from "react";
import { cn, type SlotNode } from "@/lib/utils";
import { Button } from "./button";
import { ColorDot } from "./color-dot";
import { ArrowLeft } from "./icons";

/**
 * How each heading level is drawn: `PageHeader`'s sizes, since a detail view's title is the page's
 * own name at level 1 and a pane's beside a list at 2 or 3. The size follows the level, so a caller
 * never sets both.
 */
const TITLE_SIZE = {
  1: "text-xl",
  2: "text-lg",
  3: "text-base",
} as const;

/** The heading levels a {@link DetailHeader} can be. */
export type DetailHeaderLevel = keyof typeof TITLE_SIZE;

type DetailHeaderProps = {
  onBack: () => void;
  /** Labels the back button for a screen reader — "Back to projects". */
  backLabel: string;
  /** Colour for the leading dot; omit to hide it. */
  color?: string | null | undefined;
  colorLabel?: string | undefined;
  title: string;
  /**
   * Which heading the title is: `1` (the default) for the page's own name, `2` or `3` for a detail
   * pane beside a list under a page title of its own. The size follows the level.
   */
  level?: DetailHeaderLevel | undefined;
  /** Small muted line under the title. */
  description?: ReactNode;
  /** What the record is wearing, next to the title — typically a `Badge`. */
  badgesSlot?: SlotNode;
  /** The header's far end: the record's actions. */
  actionSlot?: SlotNode;
  /** @deprecated Use `description`; this name goes in the next release. `description` wins. */
  subtitle?: ReactNode;
  /** @deprecated Use `badgesSlot`; this name goes in the next release. `badgesSlot` wins. */
  badgeSlot?: SlotNode;
  /** @deprecated Use `actionSlot`; this name goes in the next release. `actionSlot` wins. */
  actionsSlot?: SlotNode;
};

/**
 * The title, one arm per level: the compiler emits the tag from a *literal* `aria-level`, and a
 * level held in a variable would be a tag chosen at runtime, which it refuses.
 */
function Title({ level, children }: { level: DetailHeaderLevel; children: string }) {
  const className = cn(
    "min-w-0 shrink font-semibold text-foreground tracking-tight",
    TITLE_SIZE[level],
  );
  if (level === 1) {
    return <h1 className={cn("cube-rn-text", className)}>{children}</h1>;
  }
  if (level === 2) {
    return <h2 className={cn("cube-rn-text", className)}>{children}</h2>;
  }
  return <h3 className={cn("cube-rn-text", className)}>{children}</h3>;
}

/**
 * The header row of a detail view: back button, optional colour dot, title, badges, description and
 * actions. `subtitle`, `badgeSlot` and `actionsSlot` are the old names of the last three, kept for
 * one release; the new name wins when both are passed.
 */
export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  level = 1,
  description,
  badgesSlot,
  actionSlot,
  subtitle,
  badgeSlot,
  actionsSlot,
}: DetailHeaderProps) {
  const line = description ?? subtitle;
  const badges = badgesSlot ?? badgeSlot;
  const actions = actionSlot ?? actionsSlot;
  return (
    // Wraps rather than pushing the actions off a phone; `min-w-0` lets the title column shrink.
    <div className="cube-rn-view flex-row flex-wrap items-center gap-x-3 gap-y-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onBack}
        aria-label={backLabel}
        iconSlot={<ArrowLeft className="h-4 w-4" />}
      />
      <div className="cube-rn-view min-w-0 flex-1 gap-1">
        <div className="cube-rn-view min-w-0 flex-row items-center gap-2">
          {color ? <ColorDot color={color} {...(colorLabel ? { title: colorLabel } : {})} /> : null}
          {/* `role`/`aria-level` because a heading has no native counterpart — and they are what
              a compiled web build reads to emit one. */}
          <Title level={level}>{title}</Title>
          {badges}
        </div>
        {line ? <span className="cube-rn-text text-sm text-foreground/60">{line}</span> : null}
      </div>
      {actions}
    </div>
  );
}
