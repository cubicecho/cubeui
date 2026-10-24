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
 * badge, subtitle, trailing actions.
 *
 * Distinct from `PageHeader` in `layout/page-header` by the back affordance and the
 * leading dot — a detail view is reached *from* somewhere, and a list page is
 * not.
 */
import type { ReactNode } from "react";
import type { SlotNode } from "@/lib/utils";
import { Button } from "./button";
import { ColorDot } from "./color-dot";
import { ArrowLeft } from "./icons";

type DetailHeaderProps = {
  onBack: () => void;
  /** Labels the back button for a screen reader — "Back to projects". */
  backLabel: string;
  /** Colour for the leading dot; omit to hide it. */
  color?: string | null | undefined;
  colorLabel?: string | undefined;
  title: string;
  /** Small muted line under the title. */
  subtitle?: ReactNode;
  /** Rendered next to the title — typically a `Badge`. */
  badgeSlot?: SlotNode;
  /** Trailing actions. */
  actionsSlot?: SlotNode;
};

/**
 * The header row of a detail view: back button, optional colour dot, title, badge, subtitle and
 * actions.
 */
export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  subtitle,
  badgeSlot,
  actionsSlot,
}: DetailHeaderProps) {
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
          {/* `role`/`aria-level` because an `<h1>` has no native counterpart — and they are what
              a compiled web build reads to emit one. The page's own name, so the page title's
              rank and size: PageHeader level 1's text-xl. */}
          <h1 className="cube-rn-text min-w-0 shrink font-semibold text-foreground text-xl tracking-tight">
            {title}
          </h1>
          {badgeSlot}
        </div>
        {subtitle ? (
          <span className="cube-rn-text text-sm text-foreground/60">{subtitle}</span>
        ) : null}
      </div>
      {actionsSlot}
    </div>
  );
}
