/**
 * The old import path of `LoadState`, kept for one release so an app can move its call sites
 * across one at a time. Import `LoadState`, `LoadError` and `RowSkeleton` from `load-state`.
 *
 * @deprecated Install `@cubeui/load-state`; this item goes in the next release.
 */
import { QueryError, QueryState, type QueryStateProps, RowSkeleton } from "@/components/load-state";

export type { QueryStateProps };
// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export { QueryError, QueryState, RowSkeleton };
