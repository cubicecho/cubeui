/**
 * The icon set, native implementation. `icons.web.tsx` is its web counterpart
 * and `icons-base.ts` holds what they share.
 *
 * Every icon is imported from `lucide-react-native/icons/<name>` rather than the
 * package barrel: the barrel re-exports 1600-odd separate modules and Metro does
 * not tree-shake, so a barrel import pulls the entire set into the bundle.
 *
 * Two things happen to each icon on the way out:
 *
 * - `cssInterop` teaches it `className`. `h-4 w-4` and `text-*` are lifted out of
 *   the resolved style and handed to the icon as `width` / `height` / `color`
 *   props, which is what lucide reads; everything else (margins, opacity) stays
 *   on `style`, which `Svg` accepts.
 * - The colour is resolved eagerly, because there is no `currentColor` to inherit
 *   off device. `text-foreground` is the floor, `IconClassContext` overrides it
 *   for containers that set their own colour, and the call site's own `text-*`
 *   overrides both.
 *
 * This is the set the registry's own components need, plus a short tail that no
 * component here uses and every app does: `Play`, `Pause`, `Square`, `Sun`,
 * `Moon` and `Monitor` — transport controls and a theme toggle. They are the names a consumer
 * reached for first and had to go around this module for, and an icon imported
 * straight from `lucide-react-native` is one that missed `cssInterop`, so
 * `className` does nothing to it and the sizing and colour have to be written
 * as props. A barrel that is only what this registry happens to need is a barrel
 * people route around; these six are the cheapest way to find out that is what
 * was happening.
 *
 * And seven that two apps had each wrapped for themselves with `icon` (#210):
 * `FileText`, `Folder`, `KeyRound`, `Lock`, `Plug`, `Tag` and `Ellipsis`. A
 * glyph wrapped in one app is what `icon` is for; the same line in a second
 * app's `app-icons.tsx` is the duplication this module exists to remove, so
 * that is the bar for the next one.
 *
 * And five more that an app wrapped for a file manager's rows (#232): `FilePen`
 * and `FolderPen` for a rename, `ArrowDownWideNarrow` for a sort menu, `UserRound`
 * for a thing only a person may touch, and `Library` for a collection.
 *
 * A glyph an app needs and this set does not ship belongs in the app's own
 * file, wrapped with the exported `icon` (below), rather than in this one:
 * the next `shadcn add` of this item overwrites whatever was added here.
 *
 * Adding to this set is for the registry itself, and it goes in **both files**:
 * the web counterpart must export the same names, and TypeScript will not tell
 * you it does not, because it only ever resolves the native file. `npm run
 * registry:check` is what catches a name that exists on one platform only.
 *
 * Names are lucide's canonical ones. Several are reachable under legacy aliases
 * (`AlertCircle`, `CheckCircle2`, `Loader2`, `Wand2`); those are deprecated
 * upstream, so importing through this module is also what keeps the next lucide
 * bump from being a rename sweep.
 */

import type { LucideIcon, LucideProps } from "lucide-react-native";
import ArrowDownWideNarrowSource from "lucide-react-native/icons/arrow-down-wide-narrow";
import ArrowLeftSource from "lucide-react-native/icons/arrow-left";
import ArrowRightSource from "lucide-react-native/icons/arrow-right";
import CalendarSource from "lucide-react-native/icons/calendar";
import CheckSource from "lucide-react-native/icons/check";
import ChevronDownSource from "lucide-react-native/icons/chevron-down";
import ChevronLeftSource from "lucide-react-native/icons/chevron-left";
import ChevronRightSource from "lucide-react-native/icons/chevron-right";
import ChevronUpSource from "lucide-react-native/icons/chevron-up";
import ChevronsUpDownSource from "lucide-react-native/icons/chevrons-up-down";
import CircleAlertSource from "lucide-react-native/icons/circle-alert";
import CircleCheckSource from "lucide-react-native/icons/circle-check";
import ClockSource from "lucide-react-native/icons/clock";
import CopySource from "lucide-react-native/icons/copy";
import DownloadSource from "lucide-react-native/icons/download";
import EllipsisSource from "lucide-react-native/icons/ellipsis";
import EyeSource from "lucide-react-native/icons/eye";
import EyeOffSource from "lucide-react-native/icons/eye-off";
import FilePenSource from "lucide-react-native/icons/file-pen";
import FileTextSource from "lucide-react-native/icons/file-text";
import FolderSource from "lucide-react-native/icons/folder";
import FolderPenSource from "lucide-react-native/icons/folder-pen";
import InfoSource from "lucide-react-native/icons/info";
import KeyRoundSource from "lucide-react-native/icons/key-round";
import LibrarySource from "lucide-react-native/icons/library";
import LoaderCircleSource from "lucide-react-native/icons/loader-circle";
import LockSource from "lucide-react-native/icons/lock";
import MonitorSource from "lucide-react-native/icons/monitor";
import MoonSource from "lucide-react-native/icons/moon";
import PauseSource from "lucide-react-native/icons/pause";
import PencilSource from "lucide-react-native/icons/pencil";
import PlaySource from "lucide-react-native/icons/play";
import PlugSource from "lucide-react-native/icons/plug";
import PlusSource from "lucide-react-native/icons/plus";
import RefreshCwSource from "lucide-react-native/icons/refresh-cw";
import SearchSource from "lucide-react-native/icons/search";
import SettingsSource from "lucide-react-native/icons/settings";
import SquareSource from "lucide-react-native/icons/square";
import SunSource from "lucide-react-native/icons/sun";
import TagSource from "lucide-react-native/icons/tag";
import Trash2Source from "lucide-react-native/icons/trash-2";
import TriangleAlertSource from "lucide-react-native/icons/triangle-alert";
import Undo2Source from "lucide-react-native/icons/undo-2";
import UploadSource from "lucide-react-native/icons/upload";
import UserRoundSource from "lucide-react-native/icons/user-round";
import XSource from "lucide-react-native/icons/x";
import { styled } from "nativewind";
import { useContext } from "react";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

/** What a wrapped icon takes: lucide's props, with `className` doing the styling. */
export type IconProps = Omit<LucideProps, "className"> & {
  className?: string | undefined;
};

/**
 * Wraps one lucide glyph the way every icon in this file is wrapped. Exported
 * so an app's extra glyph is one line, not a copy of this function — a copy
 * that would miss the next change to how `IconClassContext` merges:
 *
 * ```tsx
 * // app-icons.tsx
 * import ArchiveSource from "lucide-react-native/icons/archive";
 * import { icon } from "@/components/ui/icons";
 *
 * export const Archive = icon(ArchiveSource);
 * ```
 *
 * `icons.web.tsx` exports an `icon` that hands its argument back, so the
 * `app-icons.web.tsx` beside that file is the same line with the source taken
 * from `lucide-react`.
 */
export function icon(Source: LucideIcon) {
  const Styled = styled(Source, {
    className: {
      target: "style",
      nativeStyleMapping: { width: true, height: true, color: true },
    },
  });

  return function Icon({ className, ...props }: IconProps) {
    const inherited = useContext(IconClassContext);
    return <Styled className={cn("text-foreground", inherited, className)} {...props} />;
  };
}

export const ArrowDownWideNarrow = icon(ArrowDownWideNarrowSource);
export const ArrowLeft = icon(ArrowLeftSource);
export const ArrowRight = icon(ArrowRightSource);
export const Calendar = icon(CalendarSource);
export const Check = icon(CheckSource);
export const ChevronDown = icon(ChevronDownSource);
export const ChevronLeft = icon(ChevronLeftSource);
export const ChevronRight = icon(ChevronRightSource);
export const ChevronUp = icon(ChevronUpSource);
export const ChevronsUpDown = icon(ChevronsUpDownSource);
export const CircleAlert = icon(CircleAlertSource);
export const CircleCheck = icon(CircleCheckSource);
export const Clock = icon(ClockSource);
export const Copy = icon(CopySource);
export const Download = icon(DownloadSource);
export const Ellipsis = icon(EllipsisSource);
export const Eye = icon(EyeSource);
export const EyeOff = icon(EyeOffSource);
export const FilePen = icon(FilePenSource);
export const FileText = icon(FileTextSource);
export const Folder = icon(FolderSource);
export const FolderPen = icon(FolderPenSource);
export const Info = icon(InfoSource);
export const KeyRound = icon(KeyRoundSource);
export const Library = icon(LibrarySource);
export const LoaderCircle = icon(LoaderCircleSource);
export const Lock = icon(LockSource);
export const Monitor = icon(MonitorSource);
export const Moon = icon(MoonSource);
export const Pause = icon(PauseSource);
export const Pencil = icon(PencilSource);
export const Play = icon(PlaySource);
export const Plug = icon(PlugSource);
export const Plus = icon(PlusSource);
export const RefreshCw = icon(RefreshCwSource);
export const Search = icon(SearchSource);
export const Settings = icon(SettingsSource);
export const Square = icon(SquareSource);
export const Sun = icon(SunSource);
export const Tag = icon(TagSource);
export const Trash2 = icon(Trash2Source);
export const TriangleAlert = icon(TriangleAlertSource);
export const Undo2 = icon(Undo2Source);
export const Upload = icon(UploadSource);
export const UserRound = icon(UserRoundSource);
export const X = icon(XSource);
