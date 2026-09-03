import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

/**
 * The column a page's chrome and its content share.
 *
 * A header that caps itself while the table beneath it runs to the pane edge reads as two
 * screens stacked, and the mismatch is there at every width, not only past the cap: the header
 * carries its own inset and the table did not. One class, applied to every slot, is what keeps
 * the title above the first column rather than beside it.
 */
export const PAGE_COLUMN = "mx-auto w-full max-w-(--breakpoint-2xl)";

type HeaderContentFooterProps = {
  /** The body. The only slot that grows. */
  children: ReactNode;
  /** Page title, toolbar, filters — whatever stays above the body. Absent, no row is drawn. */
  header?: ReactNode;
  /** Paging, totals, a save bar. Absent, no row is drawn. */
  footer?: ReactNode;
  /**
   * Whether the body scrolls inside the chassis rather than growing it.
   *
   * On, the header and footer stay put while the body moves, which needs the chassis to have a
   * height to divide — `h-full`, or a parent that gives it one. Off, the chassis is as tall as
   * what is in it and the page scrolls as a whole.
   */
  scroll?: boolean;
  /**
   * - `full` — slots fill whatever box the chassis was given. Print sheets, dialogs, and
   *   anything already inside its own column.
   * - `page` — slots share the capped, centred {@link PAGE_COLUMN}, inset to match the header.
   *   Every list page.
   */
  width?: "full" | "page";
  /** The scrolling body, for a caller that has to reach it — restoring a scroll position. */
  contentRef?: Ref<HTMLDivElement>;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
};

/**
 * Header, body, footer, in a column.
 *
 * A flex column rather than three fixed grid rows, because the rows only line up when all three
 * slots are present: with `grid-rows-[min-content_1fr_min-content]` and no header, the body
 * auto-places into the min-content row and is squashed to its own text, and any `gap` on the
 * chassis is still spent on the slots that are not there. Flex gives the same shape — the body
 * takes the leftover, the chrome takes what it needs — and an absent slot costs nothing.
 *
 * `min-h-0` / `min-w-0` on the body is not decoration. A flex item's floor is its content, so
 * one wide child — a table, a long unbroken string — grows the chassis and pushes the chrome off
 * the screen instead of scrolling inside it, and `scroll` does nothing at all without the floor.
 */
export function HeaderContentFooter({
  children,
  header,
  footer,
  scroll = false,
  width = "full",
  contentRef,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: HeaderContentFooterProps) {
  // The header slot stays unpadded: a page header carries its own `px-4`, and the body matches
  // it so the two edges line up.
  const headerColumn = width === "page" ? PAGE_COLUMN : undefined;
  const bodyColumn = width === "page" ? cn(PAGE_COLUMN, "px-4") : undefined;

  return (
    <div
      data-slot="header-content-footer"
      className={cn("flex min-h-0 min-w-0 flex-col", className)}
    >
      {header ? (
        <div data-slot="hcf-header" className={cn("min-w-0 shrink-0", headerColumn, headerClassName)}>
          {header}
        </div>
      ) : null}

      <div
        data-slot="hcf-content"
        ref={contentRef}
        className={cn(
          "relative min-h-0 min-w-0 flex-1",
          scroll && "overflow-y-auto",
          bodyColumn,
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <div data-slot="hcf-footer" className={cn("min-w-0 shrink-0", bodyColumn, footerClassName)}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The same chassis with the body scrolling and the chrome pinned — a list page, a pane inside a
 * split, anything whose header should not leave with the rows.
 *
 * It needs a height to divide, so it defaults to filling its parent.
 */
export function StickyHeaderContentFooter({
  className,
  ...props
}: Omit<HeaderContentFooterProps, "scroll">) {
  return <HeaderContentFooter scroll {...props} className={cn("h-full", className)} />;
}
