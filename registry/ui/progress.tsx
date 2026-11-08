/**
 * A horizontal bar showing how much of something is done. `value` means what shadcn's means, a
 * number from 0 to `max` (100 unless said otherwise), and it is clamped before it is drawn or
 * announced. `progress.web.tsx` is the web counterpart and `progress-base.ts` holds what they
 * share.
 *
 * With no `value` the bar is indeterminate: announced with no `aria-valuenow`, and drawn as a third
 * of the track sweeping across it, so it never looks like 0% (#487). The sweep is `Animated` on the
 * native driver, measured from the track's own width, and the compiler refuses `Animated`, which
 * is why the web half is hand-written. Under Reduce Motion the segment holds still in the middle
 * third: a sweep is a slide, which reduced motion stops, and a segment off the start is not an
 * amount. The determinate indicator's width is a style, since a class built from a number is one
 * Tailwind never generates. `label` names the bar, as an `aria-label` does.
 *
 * The segment is `View` wrapped by `createAnimatedComponent` rather than `Animated.View`, because
 * `View` is the one NativeWind hands a `className` to, and `indicatorClassName` has to reach it.
 */
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, type LayoutChangeEvent, Platform, View } from "react-native";
import {
  DEFAULT_MAX,
  type ProgressBaseProps,
  progressIndicatorClass,
  progressState,
  progressTrackClass,
  SWEEP_DURATION_MS,
  SWEEP_FROM,
  SWEEP_REST,
  SWEEP_TO,
  SWEEP_WIDTH,
} from "@/components/ui/progress-base";
import { useReducedMotion } from "@/components/ui/reduced-motion";
import { cn } from "@/lib/utils";

export type ProgressProps = Omit<React.ComponentProps<typeof View>, "className" | "children"> &
  ProgressBaseProps;

/** The segment is a third of the track, so one of its widths is the track's over this. */
const SEGMENTS_PER_TRACK = 3;

const SweepingView = Animated.createAnimatedComponent(View);

/** A third of the track, sweeping from before its start to past its end. */
function Sweep({ className }: { className?: string | undefined }) {
  const reducedMotion = useReducedMotion();
  const [segment, setSegment] = useState(0);
  const sweep = useRef(new Animated.Value(SWEEP_REST)).current;

  useEffect(() => {
    // Nothing to sweep until the track has a width, and nothing moves under Reduce Motion.
    if (reducedMotion || segment === 0) {
      sweep.setValue(SWEEP_REST);
      return;
    }
    sweep.setValue(SWEEP_FROM);
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: SWEEP_TO,
        duration: SWEEP_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, reducedMotion, segment]);

  const measure = (event: LayoutChangeEvent) =>
    setSegment(event.nativeEvent.layout.width / SEGMENTS_PER_TRACK);
  const translateX = sweep.interpolate({
    inputRange: [SWEEP_FROM, SWEEP_TO],
    outputRange: [SWEEP_FROM * segment, SWEEP_TO * segment],
  });

  return (
    <View className="h-full w-full" onLayout={measure}>
      <SweepingView
        testID="progress-indicator"
        className={cn(progressIndicatorClass, className)}
        style={{ width: SWEEP_WIDTH, transform: [{ translateX }] }}
      />
    </View>
  );
}

/** A horizontal bar showing how much of something is done. */
export function Progress({
  value,
  max = DEFAULT_MAX,
  label,
  valueLabel,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const { limit, now, percent } = progressState(value, max);

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
      className={cn(progressTrackClass, className)}
    >
      {now === undefined ? (
        <Sweep className={indicatorClassName} />
      ) : (
        <View
          testID="progress-indicator"
          className={cn(
            progressIndicatorClass,
            Platform.select({
              web: "transition-[width] motion-reduce:transition-none",
              default: undefined,
            }),
            indicatorClassName,
          )}
          style={{ width: `${percent}%` }}
        />
      )}
    </View>
  );
}
