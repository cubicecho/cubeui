/**
 * The old import path of `CollapsibleRow`, kept for one release so an app can move its call sites
 * across one at a time. Import `CollapsibleRow` from `collapsible-row`.
 *
 * @deprecated Install `@cubeui/collapsible-row`; this item goes in the next release.
 */
import { DisclosureRow } from "@/components/collapsible-row";

// Re-exported as a local binding rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export { DisclosureRow };
