/**
 * Compiled from `registry/ui/color-dot.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const SIZES = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
} as const;

type ColorDotProps = {
  color: string;
  size?: keyof typeof SIZES;
  className?: string | undefined;
  /**
   * What the colour stands for: the accessible name, and on the web the tooltip under the pointer.
   * Without it the dot is decoration.
   */
  label?: string | undefined;
};

/**
 * A small round colour swatch standing in for a category, status or tag.
 *
 * A `View` rather than a `<span>`: react-native-web renders it as a `<div>` with
 * the same box, so one file serves both platforms. Without a `label` it is
 * decoration and is hidden from assistive tech rather than announced as an
 * unnamed image.
 *
 * With one, the web shows it under the pointer (#479): a colour is all a sighted
 * reader has otherwise, and two hues can be one colour to a reader with a
 * colour-vision deficiency. Not on device, where there is no hover and a dot is
 * too small to long-press.
 */
export function ColorDot({ color, size = "md", className, label }: ColorDotProps) {
  const named = label !== undefined && label !== "";
  const dot = (
    <div
      className={cn("cube-rn-view", "shrink-0 rounded-full", SIZES[size], className)}
      style={{ backgroundColor: color }}
      // `aria-describedby` is passed even when empty: radix points its trigger at the open bubble,
      // `Slot` lets the child's value win, and describing the dot with its own name reads it twice.
      {...(named
        ? ({ role: "img", "aria-label": label, "aria-describedby": undefined } as const)
        : ({ "aria-hidden": true } as const))}
    />
  );
  if (named === false) {
    return dot;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{dot}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
