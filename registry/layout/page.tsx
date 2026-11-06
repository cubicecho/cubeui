/**
 * The page shell every route wraps its content in — see `ui/button.tsx` for the
 * conversion rules.
 *
 * `scroll` picks the container: a `ScrollView` scrolls on both platforms, where
 * `overflow-y-auto` on a `View` only ever worked on web. The padding therefore
 * moves to `contentContainerClassName`, since padding on a `ScrollView` itself
 * is applied to the clipping box and not to the scrolled content.
 *
 * The column is PageLayout's: `PAGE_COLUMN`, or `PROSE_COLUMN` for `width="narrow"`, centred with
 * `mx-auto` and capped at one width rather than a width per breakpoint.
 */
import { ScrollView, View } from "react-native";
import { EmptyState, type EmptyStateProps } from "@/components/empty-state";
import { GridLayout } from "@/components/grid-layout";
import { PAGE_COLUMN, PROSE_COLUMN } from "@/components/header-content-footer";
import { PageHeader, type PageHeaderProps, PageInsetContext } from "@/components/page-header";
import { cn, type SlotNode } from "@/lib/utils";

type PageProps = {
  className?: string;
  /** The screen's body: the header, the grid, the rows, in the order they are drawn. */
  contentSlot: SlotNode;
  /**
   * Full-height flex column (`h-full min-h-0`) instead of the default `flex-1`.
   * For a view whose body scrolls internally rather than as a whole.
   */
  fill?: boolean;
  /** Whether the page itself scrolls. Off for views with an inner scroll area. */
  scroll?: boolean;
  /** `narrow` is the prose column (`max-w-3xl`), PageLayout's own — a settings or detail form. */
  width?: "narrow";
};

/**
 * The page shell a route wraps its content in: a padded, centred column that scrolls unless told
 * not to.
 */
export function Page({ className, contentSlot, fill = false, scroll = true, width }: PageProps) {
  // PageLayout's named columns, not `container`, whose width snapped at every breakpoint; and a
  // `gap-4` between what the page holds, which its header's doc always told callers to rely on.
  const content = cn(width === "narrow" ? PROSE_COLUMN : PAGE_COLUMN, "gap-4 px-4 py-4", className);
  const outer = fill ? "h-full min-h-0" : "flex-1";

  // The page insets its content, so a PageHeader in it does not inset itself again.
  if (scroll === false) {
    return (
      <PageInsetContext.Provider value={true}>
        <View className={cn(outer, "flex-col", content)}>{contentSlot}</View>
      </PageInsetContext.Provider>
    );
  }

  return (
    <PageInsetContext.Provider value={true}>
      <ScrollView className={outer} contentContainerClassName={content}>
        {contentSlot}
      </ScrollView>
    </PageInsetContext.Provider>
  );
}

/**
 * The title row at the top of a page. There is one `PageHeader` in this set, and it lives in
 * `page-header`; it is re-exported here so a screen importing it from its page shell keeps
 * working. It took over from the small one this file used to carry, whose props were renamed on
 * the way: `subtitle` is `description`, `actions` is `actionSlot`, the heading is an `h1` unless
 * `level` says otherwise, and the `mb-4` under it is gone — space it with the page's own gap.
 */
export { PageHeader, type PageHeaderProps };

/**
 * The grid of equal cells, which is its own item, `@cubeui/grid-layout`, and holds any content,
 * not only cards.
 *
 * @deprecated Import `GridLayout` from `@/components/grid-layout`. This name goes with `page`.
 */
const CardGrid = GridLayout;

/**
 * The empty state, which is its own item, `@cubeui/empty-state`, so an app that wants one does not
 * install the page shell for it. Re-exported here, beside the grid it is usually drawn under, so
 * a screen importing it from its page shell keeps working.
 */
export { CardGrid, EmptyState, type EmptyStateProps };
