/**
 * Compiled from `registry/layout/centered-layout.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * The old import path of `CenteredCardLayout`, kept for one release so an app can move its call
 * sites across one at a time. Import `CenteredCardLayout` from `centered-card-layout`.
 *
 * @deprecated Install `@cubeui/centered-card-layout`; this item goes in the next release.
 */
import { CenteredLayout, type CenteredLayoutProps } from "./centered-card-layout";

// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export type { CenteredLayoutProps };
export { CenteredLayout };
