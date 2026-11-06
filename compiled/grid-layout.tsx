/**
 * Compiled from `registry/layout/grid-layout.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * Equal cells in rows: one column on a phone, then two, three and four as the window widens.
 *
 * `grid` has no native equivalent, so the columns come from flex wrapping and a percentage width
 * on each cell. The width sits on a cell this shell draws round each element, rather than on the
 * elements themselves: a `Card` that carried it would only be the right width inside a grid.
 */
import { Children, Fragment, isValidElement, type ReactElement } from "react";
import { cn, type SlotNode } from "@/lib/utils";

export type GridLayoutProps = {
  /**
   * The cells, as an array or a fragment: cards, tiles, anything of one kind. Both are opened, so
   * a fragment of three cards is three cells and not one.
   */
  contentSlot: SlotNode;
  className?: string | undefined;
};

/** Lays `contentSlot` out as equal cells, 1 to 4 to a row by the window's width. */
export function GridLayout({ contentSlot, className }: GridLayoutProps) {
  return (
    <div className={cn("cube-rn-view", "flex-row flex-wrap gap-4", className)}>
      {cells(contentSlot).map(({ key, cell }) => (
        // A fraction of the row minus its share of the `gap-4`, which a percentage width does not
        // account for.
        <div
          key={key}
          className="cube-rn-view w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]"
        >
          {cell}
        </div>
      ))}
    </div>
  );
}

/**
 * A slot's elements, one per cell: arrays and fragments opened, the nothing values dropped. A
 * cell's key is prefixed with its fragment's, since two opened fragments number their cells alike.
 */
function cells(slot: SlotNode, prefix = ""): { key: string; cell: ReactElement }[] {
  return Children.toArray(slot).flatMap((child) => {
    if (isValidElement<{ children?: SlotNode }>(child) === false) {
      return [];
    }
    const key = `${prefix}${child.key}`;
    return child.type === Fragment ? cells(child.props.children, key) : [{ key, cell: child }];
  });
}
