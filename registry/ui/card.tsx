/**
 * One card for both platforms — see `ui/button.tsx` for the conversion rules.
 *
 * `CardTitle` and `CardDescription` are `<Text>`, which is not optional on
 * native: a bare string inside a `<View>` throws there while rendering fine on
 * web, so the two platforms disagree silently unless the text nodes are typed.
 *
 * The `role`/`aria-level` on `CardTitle` and the `role="button"` on a pressable
 * card are not decoration. They are what a screen reader reads on device, and
 * on web react-native-web turns them into the matching ARIA attributes — which
 * is also what lets a compiled DOM version know this `<Text>` is an `<h3>`.
 */

import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { ColorBar } from "@/components/ui/color-bar";
import { cn } from "@/lib/utils";

// `className` is re-declared rather than inherited: nativewind types it as
// `className?: string`, which under `exactOptionalPropertyTypes` rejects the
// conditional `cond ? 'x' : undefined` several call sites pass.
type ViewProps = Omit<React.ComponentProps<typeof View>, "className"> & {
  className?: string | undefined;
};
type TextProps = Omit<React.ComponentProps<typeof Text>, "className"> & {
  className?: string | undefined;
};

type CardProps = ViewProps & {
  /** Renders a left-edge ColorBar along with the positioning it requires. */
  accentColor?: string | null | undefined;
  /** What the accent colour stands for, for anyone who cannot see it. */
  accentLabel?: string | undefined;
  /**
   * Makes the whole card a target. A card that takes this renders a
   * `Pressable` instead of a `View` — a `View` has no press handling on
   * native, and an `onClick` on a plain `div` is not reachable by keyboard.
   */
  onPress?: React.ComponentProps<typeof Pressable>["onPress"] | undefined;
};

const Card = React.forwardRef<React.ElementRef<typeof View>, CardProps>(
  ({ className, accentColor, accentLabel, onPress, children, ...props }, ref) => {
    const classes = cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      accentColor && "relative overflow-hidden",
      className,
    );
    const inner = (
      <>
        <ColorBar color={accentColor} label={accentLabel} />
        {children}
      </>
    );

    // The two containers are written out rather than picked with `const Container = onPress ?
    // Pressable : View`. They do not actually share a prop list — only one of them takes a press
    // handler — and `rn2web` refuses an element chosen at runtime, because the tag it emits, the
    // reset class it carries and the role it infers all follow from knowing which one it is.
    if (onPress) {
      return (
        <Pressable ref={ref} onPress={onPress} role="button" className={classes} {...props}>
          {inner}
        </Pressable>
      );
    }
    return (
      <View ref={ref} className={classes} {...props}>
        {inner}
      </View>
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight text-card-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex flex-row items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
