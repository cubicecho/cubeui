/**
 * Copied from `registry/ui/icons.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The icon set, web implementation — see `icons.tsx` for the native one and why
 * this module exists at all.
 *
 * Web needs no wrapper: an `<svg>` already takes `className`, and its colour
 * comes from `currentColor` on the container, hover states included. Pinning a
 * colour here — the way the native file has to — would break exactly that. So
 * this is a plain re-export (and an `icon` that wraps nothing), and the barrel is fine because the web bundler does
 * tree-shake.
 *
 * The exported names must stay in step with `icons.tsx`. TypeScript will not
 * check it, because it only ever resolves the native file; `scripts/check-registry-build.mjs`
 * does.
 */
import type { LucideIcon, LucideProps } from "lucide-react";

/** What an icon takes — the name `icons.tsx` exports for its wrapped icons. */
export type IconProps = LucideProps;

/**
 * The web half of `icons.tsx`'s `icon`: there is nothing to wrap, so it hands
 * the glyph back. It exists so an app's extra glyph is the same line on both
 * platforms — `export const Tag = icon(TagSource)` — in an `app-icons.tsx` that
 * imports the source from `lucide-react-native/icons/tag` and an
 * `app-icons.web.tsx` beside it that imports it from `lucide-react`.
 */
export function icon(Source: LucideIcon): LucideIcon {
  return Source;
}

export {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Monitor,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Square,
  Sun,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from "lucide-react";
