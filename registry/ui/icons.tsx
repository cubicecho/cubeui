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
 * component here uses and every app does: `Play`, `Pause`, `Square`, `Sun` and
 * `Moon` — transport controls and a theme toggle. They are the names a consumer
 * reached for first and had to go around this module for, and an icon imported
 * straight from `lucide-react-native` is one that missed `cssInterop`, so
 * `className` does nothing to it and the sizing and colour have to be written
 * as props. A barrel that is only what this registry happens to need is a barrel
 * people route around; these five are the cheapest way to find out that is what
 * was happening.
 *
 * It is copied into your tree, so add to it — but **add to both files**: the web
 * counterpart must export the same names, and TypeScript will not tell you it
 * does not, because it only ever resolves the native file. `npm run
 * registry:check` is what catches a name that exists on one platform only.
 *
 * Names are lucide's canonical ones. Several are reachable under legacy aliases
 * (`AlertCircle`, `CheckCircle2`, `Loader2`, `Wand2`); those are deprecated
 * upstream, so importing through this module is also what keeps the next lucide
 * bump from being a rename sweep.
 */

import type { LucideIcon, LucideProps } from "lucide-react-native";
import ArrowLeftSource from "lucide-react-native/icons/arrow-left";
import ArrowRightSource from "lucide-react-native/icons/arrow-right";
import CalendarSource from "lucide-react-native/icons/calendar";
import CheckSource from "lucide-react-native/icons/check";
import ChevronDownSource from "lucide-react-native/icons/chevron-down";
import ChevronLeftSource from "lucide-react-native/icons/chevron-left";
import ChevronRightSource from "lucide-react-native/icons/chevron-right";
import ChevronUpSource from "lucide-react-native/icons/chevron-up";
import CircleAlertSource from "lucide-react-native/icons/circle-alert";
import CircleCheckSource from "lucide-react-native/icons/circle-check";
import ClockSource from "lucide-react-native/icons/clock";
import CopySource from "lucide-react-native/icons/copy";
import DownloadSource from "lucide-react-native/icons/download";
import LoaderCircleSource from "lucide-react-native/icons/loader-circle";
import MoonSource from "lucide-react-native/icons/moon";
import PauseSource from "lucide-react-native/icons/pause";
import PencilSource from "lucide-react-native/icons/pencil";
import PlaySource from "lucide-react-native/icons/play";
import PlusSource from "lucide-react-native/icons/plus";
import RefreshCwSource from "lucide-react-native/icons/refresh-cw";
import SearchSource from "lucide-react-native/icons/search";
import SettingsSource from "lucide-react-native/icons/settings";
import SquareSource from "lucide-react-native/icons/square";
import SunSource from "lucide-react-native/icons/sun";
import Trash2Source from "lucide-react-native/icons/trash-2";
import TriangleAlertSource from "lucide-react-native/icons/triangle-alert";
import Undo2Source from "lucide-react-native/icons/undo-2";
import UploadSource from "lucide-react-native/icons/upload";
import XSource from "lucide-react-native/icons/x";
import { styled } from "nativewind";
import { useContext } from "react";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

type IconProps = Omit<LucideProps, "className"> & {
  className?: string | undefined;
};

function icon(Source: LucideIcon) {
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

export const ArrowLeft = icon(ArrowLeftSource);
export const ArrowRight = icon(ArrowRightSource);
export const Calendar = icon(CalendarSource);
export const Check = icon(CheckSource);
export const ChevronDown = icon(ChevronDownSource);
export const ChevronLeft = icon(ChevronLeftSource);
export const ChevronRight = icon(ChevronRightSource);
export const ChevronUp = icon(ChevronUpSource);
export const CircleAlert = icon(CircleAlertSource);
export const CircleCheck = icon(CircleCheckSource);
export const Clock = icon(ClockSource);
export const Copy = icon(CopySource);
export const Download = icon(DownloadSource);
export const LoaderCircle = icon(LoaderCircleSource);
export const Moon = icon(MoonSource);
export const Pause = icon(PauseSource);
export const Pencil = icon(PencilSource);
export const Play = icon(PlaySource);
export const Plus = icon(PlusSource);
export const RefreshCw = icon(RefreshCwSource);
export const Search = icon(SearchSource);
export const Settings = icon(SettingsSource);
export const Square = icon(SquareSource);
export const Sun = icon(SunSource);
export const Trash2 = icon(Trash2Source);
export const TriangleAlert = icon(TriangleAlertSource);
export const Undo2 = icon(Undo2Source);
export const Upload = icon(UploadSource);
export const X = icon(XSource);
