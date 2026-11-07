/**
 * The old import path of `PropertyList`, kept for one release so an app can move its call sites
 * across one at a time. Import `PropertyList` and `PropertyRow` from `property-list`.
 *
 * @deprecated Install `@cubeui/property-list`; this item goes in the next release.
 */
import { DescriptionList, PropertyRow } from "@/components/property-list";

// Re-exported as local bindings rather than `export … from`: the shadcn CLI rewrites import
// declarations on install and leaves re-export declarations alone. See AGENTS.md.
export { DescriptionList, PropertyRow };
