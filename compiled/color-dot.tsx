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

const SIZES = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
} as const;

type ColorDotProps = {
  color: string;
  size?: keyof typeof SIZES;
  className?: string | undefined;
  /** What the colour stands for, exposed as the accessible name. */
  label?: string | undefined;
};

/**
 * A small round colour swatch standing in for a category, status or tag.
 *
 * A `View` rather than a `<span>`: react-native-web renders it as a `<div>` with
 * the same box, so one file serves both platforms. Without a `label` it is
 * decoration and is hidden from assistive tech rather than announced as an
 * unnamed image.
 */
export function ColorDot({ color, size = "md", className, label }: ColorDotProps) {
  return (
    <div
      className={cn("cube-rn-view", "shrink-0 rounded-full", SIZES[size], className)}
      style={{ backgroundColor: color }}
      {...(label
        ? ({ role: "img", "aria-label": label } as const)
        : ({ "aria-hidden": true } as const))}
    />
  );
}
