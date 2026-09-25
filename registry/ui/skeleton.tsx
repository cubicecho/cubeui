/**
 * A block standing in for content that has not arrived: shadcn's `Skeleton`, on both halves.
 * `skeleton.web.tsx` is the web counterpart and `skeleton-base.ts` holds what they share.
 *
 * The web half pulses with `animate-pulse`, and a CSS keyframe is a class NativeWind resolves to
 * nothing on device without Reanimated, which this registry does not ask a consumer to install.
 * So the pulse here is `Animated` on the native driver — the same opacity curve, the same two
 * seconds — which is also why the web half is hand-written: the compiler refuses `Animated`.
 *
 * The animated view is `View` wrapped by `createAnimatedComponent` rather than `Animated.View`,
 * because `View` is the one NativeWind hands a `className` to; `Animated.View` would drop the
 * caller's size, and a skeleton is nothing but its size.
 *
 * It says nothing to assistive tech by itself, as shadcn's does not: a placeholder is the caller's
 * to hide (`aria-hidden`) or to put inside a `role="status"` that says what is loading.
 */
import type * as React from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { PULSE_DURATION, PULSE_LOW, skeletonClass } from "@/components/ui/skeleton-base";
import { cn } from "@/lib/utils";

type SkeletonProps = Omit<React.ComponentProps<typeof View>, "className"> & {
  /** Its size, and anything else about its box: `h-4 w-1/3`. Rounded and `bg-accent` already. */
  className?: string | undefined;
};

const PulsingView = Animated.createAnimatedComponent(View);

function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const half = {
      duration: PULSE_DURATION / 2,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
      useNativeDriver: true,
    };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: PULSE_LOW, ...half }),
        Animated.timing(opacity, { toValue: 1, ...half }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <PulsingView
      testID="skeleton"
      {...props}
      className={cn(skeletonClass, className)}
      style={[style, { opacity }]}
    />
  );
}

export type { SkeletonProps };
export { Skeleton };
