/**
 * Compiled from `registry/layout/page.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * The page shell every route wraps its content in — see `ui/button.tsx` for the
 * conversion rules.
 *
 * `scroll` picks the container: a `ScrollView` scrolls on both platforms, where
 * `overflow-y-auto` on a `View` only ever worked on web. The padding therefore
 * moves to `contentContainerClassName`, since padding on a `ScrollView` itself
 * is applied to the clipping box and not to the scrolled content.
 *
 * `container mx-auto` stays in the class list even though nativewind resolves it
 * to nothing on device: the breakpoint max-widths it carries are what keeps the
 * web layout centred, and a phone is narrower than the first breakpoint anyway.
 */
import { Children, type ReactNode } from "react";
import { PageHeader, type PageHeaderProps } from "@/components/page-header";
import type { IconComponent } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

type PageProps = {
  className?: string;
  children: ReactNode;
  /**
   * Full-height flex column (`h-full min-h-0`) instead of the default `flex-1`.
   * For a view whose body scrolls internally rather than as a whole.
   */
  fill?: boolean;
  /** Whether the page itself scrolls. Off for views with an inner scroll area. */
  scroll?: boolean;
  /** `narrow` constrains content to `max-w-2xl` — a settings or detail form. */
  width?: "narrow";
};

export function Page({ className, children, fill = false, scroll = true, width }: PageProps) {
  const content = cn("container mx-auto px-4 py-6", width === "narrow" && "max-w-2xl", className);
  const outer = fill ? "h-full min-h-0" : "flex-1";

  if (!scroll) {
    return <div className={cn("cube-rn-view", outer, "flex-col", content)}>{children}</div>;
  }

  return (
    <div className={cn("cube-rn-view overflow-auto", outer)}>
      <div className={cn("cube-rn-view", content)}>{children}</div>
    </div>
  );
}

/**
 * The title row at the top of a page. There is one `PageHeader` in this set, and it lives in
 * `page-header`; it is re-exported here so a screen importing it from its page shell keeps
 * working. It took over from the small one this file used to carry, whose props were renamed on
 * the way: `subtitle` is `description`, `actions` is `action`, the heading is an `h1` unless
 * `level` says otherwise, and the `mb-4` under it is gone — space it with the page's own gap.
 */
export { PageHeader, type PageHeaderProps };

/**
 * The responsive card grid shared by list pages.
 *
 * `grid` has no native equivalent, so the columns come from flex wrapping plus
 * a percentage width on each cell. Each child is wrapped here rather than at the
 * call sites: the width has to sit on the cell, and a `Card` that carried it
 * would then only be layout-correct inside a grid.
 */
export function CardGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("cube-rn-view", "flex-row flex-wrap gap-4", className)}>
      {Children.map(children, (child) =>
        child == null || child === false ? null : (
          // The basis is a fraction of the row minus its share of the `gap-4`
          // above, which flex-basis percentages do not account for.
          <div className="cube-rn-view w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]">
            {child}
          </div>
        ),
      )}
    </div>
  );
}

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /**
   * Makes the title a heading of this rank. Leave it off for an empty list inside a page that
   * already has its heading. Set it when the empty state *is* the page — a first run, a record
   * that was not found, a link that did not work — so a screen reader has a heading to land on:
   * `1` for a whole screen, `2` or `3` under a title that is already there. The text is the same
   * size at every level, as on `Section`: pick the rank by where it sits, not by how it looks.
   */
  level?: 1 | 2 | 3 | undefined;
};

const EMPTY_STATE_TITLE = "font-medium text-sm text-foreground";

/**
 * The centred icon / title / description / action shown when a list is empty.
 *
 * The heading is `role="heading"` + `aria-level`, the same as `Section`'s: a heading on device,
 * where VoiceOver and TalkBack navigate by it, and on the web a `<span>` carrying the rank, since
 * the rank is a prop and the compiler writes the tag once. Two arms rather than a spread `role`,
 * so a title with no `level` stays plain text on both platforms.
 */
export function EmptyState({ icon: Icon, title, description, action, level }: EmptyStateProps) {
  return (
    <div className="cube-rn-view w-full items-center gap-3 py-10">
      <div className="cube-rn-view rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="cube-rn-view items-center">
        {level === undefined ? (
          <span className={cn("cube-rn-text", EMPTY_STATE_TITLE)}>{title}</span>
        ) : (
          <span role="heading" aria-level={level} className={cn("cube-rn-text", EMPTY_STATE_TITLE)}>
            {title}
          </span>
        )}
        {description ? (
          <span className="cube-rn-text text-center text-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}
