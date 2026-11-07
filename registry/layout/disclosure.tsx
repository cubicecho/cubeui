/**
 * The old import path of `Collapsible`, kept for one release so an app can move its call sites
 * across one at a time. Import `Collapsible` and `CollapsibleTrigger` from `collapsible`.
 *
 * @deprecated Install `@cubeui/collapsible`; this item goes in the next release.
 */
import { Disclosure, DisclosureTrigger } from "@/components/collapsible";

// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export { Disclosure, DisclosureTrigger };
