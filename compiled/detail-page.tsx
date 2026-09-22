/**
 * Compiled from `registry/layout/detail-page.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * The `<Page>` shell plus the loading / not-found guard a detail route repeats.
 *
 * `children` is a function so the entity is non-null inside it — the guard and
 * the narrowing are the same act, and a render prop is what makes the type
 * system agree. A detail route's body then never writes `entity!` or an
 * early return of its own.
 */
import type { ReactNode } from "react";
import { Page } from "@/components/page";

type DetailPageProps<T> = {
  /** The loaded entity, or null/undefined while loading or when missing. */
  entity: T | null | undefined;
  loading?: boolean;
  /** Shown when the entity is absent and not loading. */
  notFoundLabel: string;
  className?: string;
  /** Rendered only once the entity is present, so it is non-null inside. */
  children: (entity: T) => ReactNode;
};

export function DetailPage<T>({
  entity,
  loading,
  notFoundLabel,
  className,
  children,
}: DetailPageProps<T>) {
  return (
    <Page {...(className ? { className } : {})}>
      {entity ? (
        children(entity)
      ) : (
        <span className="cube-rn-text text-muted-foreground">
          {loading ? "Loading…" : notFoundLabel}
        </span>
      )}
    </Page>
  );
}
