/**
 * A horizontal bar showing how much of something is done — an upload, a re-embed, a context
 * window filling up. One source for both platforms; `rn2web` compiles it for the DOM.
 *
 * It is here because six projects drew it by hand, eight times, and one of them used shadcn's
 * `Progress`. Of the seven hand-written ones exactly one — zeromem's re-embed bar — said what it
 * was to a screen reader; the rest were two coloured boxes, a width and silence.
 *
 * **`value` means what shadcn's means**: a number from 0 to `max`, and `max` is 100 unless you
 * say otherwise, so `<Progress value={job.progress * 100} />` ports unchanged. It is clamped to
 * `[0, max]` before it is drawn or announced, because a byte count that overshoots its total by
 * one chunk is ordinary and a bar at 104% is not.
 *
 * **No `value` is not an animation.** Radix's root reads a missing value as indeterminate, and so
 * does this: the bar is drawn empty and `aria-valuenow` is left off, which is what ARIA says an
 * indeterminate progress bar is. Nothing moves, because a sliding stripe is a keyframe the device
 * has no class for — a wait with no known end wants a spinner.
 *
 * The indicator's width is a style, not a class: it is the one value here that is really dynamic,
 * and a class built from a number is a class Tailwind never generates (conventions §3). `ViewProps`
 * pass through to the root, so a shadcn call site's `aria-label` still names it; `label` is the
 * same thing in the set's own word.
 */
import type * as React from "react";
import { Platform, View } from "react-native";
import { cn } from "@/lib/utils";

type ViewProps = Omit<React.ComponentProps<typeof View>, "className" | "children"> & {
  className?: string | undefined;
};

export type ProgressProps = ViewProps & {
  /**
   * How much is done, from 0 to `max`. Clamped to that range. Left out (or `null`), the bar is
   * indeterminate: drawn empty and announced with no value, as Radix's is — not animated.
   */
  value?: number | null | undefined;
  /** What `value` is out of. 100 unless given, so a percentage needs nothing. */
  max?: number | undefined;
  /** What is progressing — "Re-embedding progress". The bar's accessible name. */
  label?: string | undefined;
  /**
   * The value in words, read instead of the bare number: "1,204 of 5,880 turns". Without it a
   * screen reader says the percentage, which is right when the number means nothing else.
   */
  valueLabel?: string | undefined;
  /** The filled part: `bg-destructive` for a context window nearly full. */
  indicatorClassName?: string | undefined;
};

export function Progress({
  value,
  max = 100,
  label,
  valueLabel,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  // A zero or negative `max` has no fraction to draw; treat it as nothing done rather than NaN.
  const limit = max > 0 ? max : 100;
  const known = typeof value === "number" && Number.isFinite(value);
  const now = known ? Math.min(Math.max(value, 0), limit) : undefined;
  const percent = now === undefined ? 0 : (now / limit) * 100;

  return (
    <View
      testID="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={limit}
      {...(now === undefined ? {} : { "aria-valuenow": now })}
      {...(valueLabel ? { "aria-valuetext": valueLabel } : {})}
      {...props}
      {...(label ? { "aria-label": label } : {})}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
    >
      <View
        testID="progress-indicator"
        className={cn(
          "h-full bg-primary",
          Platform.select({ web: "transition-[width]", default: undefined }),
          indicatorClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </View>
  );
}
