/**
 * One button for both platforms, and the file every other converted primitive
 * is modelled on. Its header is the conversion rules written out.
 *
 * Built on `Pressable` rather than `<button>`: nativewind emits real CSS for
 * `className` on web, so the same file styles a DOM node there and a native
 * view on device. Three things had to change to make that work:
 *
 * - `onClick` → `onPress`.
 * - Text colour cannot be inherited on native, so the variants split into
 *   container classes and text classes. Bare string children are wrapped in a
 *   `<Text>` automatically; elements (icons) pass through untouched, and the
 *   container keeps its `text-*` class so web icons still inherit `currentColor`.
 * - `asChild` is radix's `Slot` on both platforms (see the prop below). On native
 *   the nesting usually inverts anyway — `<Link asChild><Button/></Link>` — because
 *   expo-router's `Link` has its own `asChild`.
 *
 * On device `type` means nothing — a Pressable is not a form control, so a submit
 * button calls the form's submit handler on press. The compiled web half is a real
 * `<button>` and takes the whole of `<button>`'s props — `type="submit"`, `onClick`,
 * `form`, `aria-*`, `data-*` — which is what makes it a drop-in for shadcn's. Its
 * sizes and variants are a superset of shadcn's too, `xs` and the `icon-*` ladder
 * included, so `buttonVariants({ variant: "ghost", size: "icon-sm" })` ports as is.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { Pressable, Text } from "react-native";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-neutral text-neutral-foreground hover:bg-neutral/90 focus-visible:bg-neutral/90",
        destructive:
          "bg-negative text-negative-foreground hover:bg-negative/90 focus-visible:bg-negative/90",
        /** A destructive action that is not the emphasis of its row. */
        "destructive-outline":
          "border border-negative/40 bg-transparent text-negative hover:bg-negative/10 focus-visible:bg-negative/10",
        /** The action that keeps the work: save, confirm, create. */
        positive:
          "bg-positive text-positive-foreground hover:bg-positive/90 focus-visible:bg-positive/90",
        "positive-outline":
          "border border-positive/40 bg-transparent text-positive hover:bg-positive/10 focus-visible:bg-positive/10",
        /** The action that adds something: add, new, create. */
        info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:bg-info/90",
        "info-outline":
          "border border-info/40 bg-transparent text-info hover:bg-info/10 focus-visible:bg-info/10",
        outline:
          "border border-foreground/15 bg-background text-foreground hover:bg-hover focus-visible:bg-hover",
        secondary: "bg-foreground/10 text-foreground hover:bg-hover focus-visible:bg-hover",
        ghost:
          "text-foreground/60 hover:bg-hover hover:text-foreground focus-visible:bg-hover focus-visible:text-foreground",
        link: "text-info underline-offset-4 hover:underline focus-visible:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        /** Small enough to sit inline in a list row without setting its height. */
        xs: "h-7 rounded-lg px-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // shadcn's icon ladder, on this file's own heights: each square is the height of the
        // text size it is named after, so an icon button sits flush in a row of text buttons.
        "icon-xs": "h-7 w-7 rounded-lg [&_svg]:size-3.5",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * The half of each variant that has to live on the `<Text>` for native.
 *
 * Not a duplicate of the container's `text-*` classes — both are needed. Web
 * reads the container's (and hands it to the icons through `currentColor`);
 * native reads this one, because a `<Text>` inherits nothing from the `View`
 * above it.
 */
const buttonTextVariants = cva("font-medium", {
  variants: {
    size: {
      default: "text-sm",
      xs: "text-xs",
      sm: "text-sm",
      lg: "text-sm",
      icon: "text-sm",
      "icon-xs": "text-xs",
      "icon-sm": "text-sm",
      "icon-lg": "text-sm",
    },
    variant: {
      default: "text-neutral-foreground",
      destructive: "text-negative-foreground",
      "destructive-outline": "text-negative",
      positive: "text-positive-foreground",
      "positive-outline": "text-positive",
      info: "text-info-foreground",
      "info-outline": "text-info",
      outline: "text-foreground",
      secondary: "text-foreground",
      ghost: "text-foreground/60",
      link: "text-info underline",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, "children" | "className"> &
  VariantProps<typeof buttonVariants> & {
    // Re-declared rather than inherited: nativewind types it as
    // `className?: string`, which under `exactOptionalPropertyTypes` rejects the
    // conditional `cond ? 'x' : undefined` that call sites pass.
    className?: string | undefined;
    /**
     * Render the single child with the button's look and behaviour instead of a
     * `Pressable` around it.
     *
     * radix's `Slot` on both platforms, for the reason `ui/form.tsx` gives: it only
     * clones its child with merged props, so there is no DOM in it and it works under
     * React Native unchanged. Upstream shadcn components that wrap this Button — the
     * `alert-dialog` action and cancel buttons — are written against it.
     */
    asChild?: boolean | undefined;
    children?: React.ReactNode;
  };

/**
 * The `onClick` a radix trigger merges onto its child through `Slot` — `<PopoverTrigger asChild>`
 * over a `Button`. Not a prop anyone passes here; it arrives at run time, so it is typed only as far
 * as this file uses it.
 */
type MergedClick = { onClick?: ((event: unknown) => void) | undefined };

/**
 * The press, then the click a trigger merged in — in that order, so a caller's `onPress` runs
 * first, as the child's own handler does under `Slot` on the DOM.
 *
 * Needed on Expo web, where this is react-native-web's `Pressable`: it puts its own `onClick` on
 * the DOM node (the one that calls `onPress`) and drops the one it was handed. So a radix popover
 * or dialog, which opens from `onClick`, never heard the press and never opened; the menu opens on
 * `pointerdown` and was fine. Keyboard activation reaches `onPress` too, on keyup, so Enter and
 * Space open it as well. On device nothing merges an `onClick`, and this is `onPress` unchanged.
 */
function pressThenClick<Press extends ((event: never) => void) | null | undefined>(
  onPress: Press,
  onClick: MergedClick["onClick"],
): Press {
  if (!onClick) return onPress;
  const both = (event: never) => {
    onPress?.(event);
    onClick(event);
  };
  return both as Press;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, disabled, asChild, children, onPress, ...props }, ref) => {
    const styling = cn(
      buttonVariants({ variant, size, className }),
      // `disabled:` has no pseudo-class to hang off a Pressable on either
      // platform, so the disabled look is applied directly.
      disabled && "opacity-50",
    );

    // Labels and icons inside a button take the variant's text colour. On web they
    // already inherit it, so `icons.web.tsx` ignores this; native has no
    // inheritance and this is where the colour comes from.
    const labelClass = buttonTextVariants({ variant, size });

    // Two returns rather than one variable element: `Slot.Root` is typed for the DOM
    // and `Pressable` for a `View`, and a union of the two types nothing usefully —
    // every prop below would have to satisfy both. Written out, each branch is checked
    // against the element it actually renders.
    if (asChild) {
      return (
        // The provider goes *outside* the `Slot`, and the caller's element is the Slot's
        // one child. Inside, the provider was the child: `Slot` merged the classes and
        // the press onto it, it dropped them, and the caller's `<a>` or radix `Action`
        // rendered unstyled (#156). No string wrapping here either — an `asChild` child
        // is an element by definition, and wrapping it would hand `Slot` the wrong one.
        <IconClassContext.Provider value={labelClass}>
          {/* `Slot.Root` is declared over `HTMLAttributes<HTMLElement>` because radix ships
              for the DOM, but it renders nothing itself — it clones its child with these
              props merged in. The element that receives them is the caller's, so the DOM
              typing describes neither side, and the cast is the honest way to say so. */}
          <Slot.Root
            className={styling}
            {...({ ...props, onPress, disabled } as unknown as React.HTMLAttributes<HTMLElement>)}
            ref={ref as unknown as React.Ref<HTMLElement>}
          >
            {children}
          </Slot.Root>
        </IconClassContext.Provider>
      );
    }

    return (
      <Pressable
        ref={ref}
        // A `Pressable` is a plain `<div>` on web unless it is given a role. This
        // is what gets the tab stop, the Enter/Space activation and the screen
        // reader announcement back that the `<button>` element gave for free.
        // (No `useSemanticElements` suppression needed: a `<button>` has no native counterpart,
        // and the rule does not reach a `Pressable` anyway.)
        role="button"
        disabled={disabled}
        className={styling}
        {...props}
        onPress={pressThenClick(onPress, (props as MergedClick).onClick)}
      >
        <IconClassContext.Provider value={labelClass}>
          {React.Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? (
              <Text className={labelClass}>{child}</Text>
            ) : (
              child
            ),
          )}
        </IconClassContext.Provider>
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
