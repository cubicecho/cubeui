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
import { Page } from "./page";

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
        ) : (
          <span className="cube-rn-text text-foreground/60">
            {loading ? "Loading…" : notFoundLabel}
          </span>
        )
      }
    />
  );
}
