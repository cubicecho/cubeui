/**
 * The old import path of `CenteredCardLayout`, kept for one release so an app can move its call
 * sites across one at a time. Import `CenteredCardLayout` from `centered-card-layout`.
 *
 * @deprecated Install `@cubeui/centered-card-layout`; this item goes in the next release.
 */
import { CenteredLayout, type CenteredLayoutProps } from "@/components/centered-card-layout";

// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export type { CenteredLayoutProps };
export { CenteredLayout };
