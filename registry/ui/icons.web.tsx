/**
 * The icon set, web implementation — see `icons.tsx` for the native one and why
 * this module exists at all.
 *
 * Web needs no wrapper: an `<svg>` already takes `className`, and its colour
 * comes from `currentColor` on the container, hover states included. Pinning a
 * colour here — the way the native file has to — would break exactly that. So
 * this is a plain re-export, and the barrel is fine because the web bundler does
 * tree-shake.
 *
 * The exported names must stay in step with `icons.tsx`. TypeScript will not
 * check it, because it only ever resolves the native file; `scripts/check-registry-build.mjs`
 * does.
 */
export {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from "lucide-react";
