/**
 * Compiled from `registry/layout/detail-page.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import type { SlotNode } from "@/lib/utils";
/**
 * The `<Page>` shell plus the loading / not-found guard a detail route repeats.
 *
 * `contentSlot` is a function so the entity is non-null inside it — the guard and
 * the narrowing are the same act, and a render prop is what makes the type
 * system agree. A detail route's body then never writes `entity!` or an
 * early return of its own.
 */
import { EmptyState } from "./empty-state";
import { Search } from "./icons";
import { Page } from "./page";
import { RowSkeleton } from "./query-state";

type DetailPageProps<T> = {
  /** The loaded entity, or null/undefined while loading or when missing. */
  entity: T | null | undefined;
  loading?: boolean;
  /** Shown when the entity is absent and not loading. */
  notFoundLabel: string;
  className?: string;
  /** Rendered only once the entity is present, so it is non-null inside. */
  contentSlot: (entity: T) => SlotNode;
};

/**
 * A `Page` that shows loading or not-found until the entity is there, then hands it to
 * `contentSlot`.
 */
export function DetailPage<T>({
  entity,
  loading,
  notFoundLabel,
  className,
  contentSlot,
}: DetailPageProps<T>) {
  return (
    <Page
      {...(className ? { className } : {})}
      contentSlot={
        entity ? (
          contentSlot(entity)
        ) : // Designed states, not a lone grey line at the top left: rows that pulse where the
        // record will be, or the centred empty block naming what is missing — the whole
        // screen is that state, so its title is the page's h1.
        loading ? (
          <RowSkeleton />
        ) : (
          <EmptyState icon={Search} title={notFoundLabel} level={1} />
        )
      }
    />
  );
}
