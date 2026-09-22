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
import { Button } from "./button";
import { ColorDot } from "./color-dot";
import { ArrowLeft, Pencil } from "./icons";

/** The outline "Edit" action a detail header usually carries. */
export function EditButton({
  onClick: onPress,
  label = "Edit",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onPress}>
      <Pencil className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

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
  badge?: ReactNode;
  /** Trailing actions. */
  actions?: ReactNode;
};

export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  subtitle,
  badge,
  actions,
}: DetailHeaderProps) {
  return (
    <div className="cube-rn-view flex-row items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label={backLabel}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="cube-rn-view flex-1">
        <div className="cube-rn-view flex-row items-center gap-2">
          {color ? <ColorDot color={color} {...(colorLabel ? { title: colorLabel } : {})} /> : null}
          {/* `role`/`aria-level` because an `<h2>` has no native counterpart —
              and they are what a compiled web build reads to emit one. */}
          <h2 className="cube-rn-text text-2xl font-bold text-foreground">{title}</h2>
          {badge}
        </div>
        {subtitle ? (
          <span className="cube-rn-text mt-0.5 text-sm text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
