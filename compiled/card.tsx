/**
 * Compiled from `registry/ui/card.tsx` — Stage 0 spike, hand-run.
 *
 * The interesting one. Three things happened here that a rename could not do:
 *
 * 1. **`CardTitle` became an `<h3>`.** The source says `role="heading" aria-level={3}` because
 *    that is what a screen reader reads on device. On the DOM those two attributes *are* an
 *    `<h3>`, so the element map reads them and emits one — and then drops them, because
 *    `role="heading" aria-level="3"` on an `<h3>` is the same thing said twice. This is level 2
 *    of the plan's four: the semantics were already in the React Native source, and the compiler
 *    only had to notice.
 *
 * 2. **A pressable `Card` became a real `<button>`.** The source already switches its container
 *    on `onPress` and adds `role="button"`, for the reason its own comment gives: an `onClick` on
 *    a plain `div` is not reachable by keyboard. Emitting `<button>` is what makes that true
 *    rather than merely announced — focus, Enter, Space and the focus ring all arrive with the
 *    element. `role="button"` is dropped for the same reason `aria-level` was.
 *
 *    Worth being precise about, because it is the spike's main result: react-native-web *already*
 *    emits a `<button>` here, `type="button"` included. `stories/card.stories.tsx` asserts that on
 *    both halves. So this inference is not a bet the compiler is taking — it is the behaviour the
 *    web target has today, and compiling only drops the runtime that was performing it.
 *
 * 3. **The class list grew a reset.** See `cube-rn-reset.css`: without `.cube-rn-view` these
 *    `<div>`s are `display: block`, and `CardFooter`'s `flex-row items-center` silently stops
 *    meaning anything.
 *
 * What did **not** survive, and is the first honest cost of compiling: the props type. The source
 * spreads `React.ComponentProps<typeof View>`, so a caller can pass `onLayout` or `pointerEvents`;
 * the compiled one spreads `React.ComponentPropsWithoutRef<"div">`, so a caller can pass `title`
 * or `onMouseEnter`. The overlap is large and the *component's own* props are identical, but the
 * escape hatch is a different escape hatch on each platform. A single shared `.d.ts` cannot
 * describe both, so this is something the compiler has to state, not something it can hide.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ColorBar } from "./color-bar";

type ViewProps = Omit<React.ComponentPropsWithoutRef<"div">, "className"> & {
  className?: string | undefined;
};
type TextProps = Omit<React.ComponentPropsWithoutRef<"span">, "className"> & {
  className?: string | undefined;
};

type CardProps = ViewProps & {
  /** Renders a left-edge ColorBar along with the positioning it requires. */
  accentColor?: string | null | undefined;
  /** What the accent colour stands for, for anyone who cannot see it. */
  accentLabel?: string | undefined;
  /**
   * Makes the whole card a target. A card that takes this renders a `<button>` instead of a
   * `<div>` — an `onClick` on a plain `div` is not reachable by keyboard.
   */
  onPress?: (() => void) | undefined;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accentColor, accentLabel, onPress, children, ...props }, ref) => {
    const classes = cn(
      "cube-rn-view",
      onPress && "cube-rn-pressable",
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

    if (onPress) {
      return (
        // `type="button"` is not in the source and has no React Native counterpart: a `<button>`
        // with no type submits the form it happens to be inside, which a `Pressable` never does.
        // react-native-web emits it for that same reason, so this is the compiler matching the
        // web target's existing behaviour rather than inventing a rule.
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={onPress}
          className={classes}
          {...(props as React.ComponentPropsWithoutRef<"button">)}
        >
          {inner}
        </button>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {inner}
      </div>
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("cube-rn-view", "flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, TextProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "cube-rn-text",
        "text-2xl font-semibold leading-none tracking-tight text-card-foreground",
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<"h3">)}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("cube-rn-text", "text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("cube-rn-view", "p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("cube-rn-view", "flex flex-row items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
