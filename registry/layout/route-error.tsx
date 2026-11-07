/**
 * The old import path of `ErrorPage`, kept for one release so an app can move its call sites
 * across one at a time. Import `ErrorPage` from `error-page`.
 *
 * @deprecated Install `@cubeui/error-page`; this item goes in the next release.
 */
import { RouteError } from "@/components/error-page";

// Re-exported as a local binding rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export { RouteError };
