/**
 * Compiled from `registry/ui/button.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

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
 * - `asChild` is gone. It existed to hand the button's styling to a link, and
 *   the routers that needed it (expo-router, react-router) have their own
 *   `asChild`, so the nesting inverts: `<Link asChild><Button/></Link>` works on
 *   both platforms where `<Button asChild><Link/></Button>` works on neither.
 *
 * `type="submit"` is gone too — a Pressable is not a form control. A submit
 * button calls the form's submit handler on press instead; on web the `<form>`
 * element is still there, so Enter-to-submit is unaffected.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /** A destructive action that is not the emphasis of its row. */
        "destructive-outline":
          "border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        /** Small enough to sit inline in a list row without setting its height. */
        xs: "h-7 rounded-lg px-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
    },
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      "destructive-outline": "text-destructive",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-muted-foreground",
      link: "text-primary underline",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "className" | "style"
> &
  VariantProps<typeof buttonVariants> & {
    // Re-declared rather than inherited: nativewind types it as
    // `className?: string`, which under `exactOptionalPropertyTypes` rejects the
    // conditional `cond ? 'x' : undefined` that call sites pass.
    className?: string | undefined;
    children?: React.ReactNode;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, children, ...props }, ref) => (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        buttonVariants({ variant, size, className }),
        // `disabled:` has no pseudo-class to hang off a Pressable on either
        // platform, so the disabled look is applied directly.
        disabled && "opacity-50",
      )}
      {...(props as React.ComponentPropsWithoutRef<"button">)}
    >
      {/* Icons inside a button take the variant's text colour. On web they
          already inherit it, so `icons.web.tsx` ignores this; native has no
          inheritance and this is where the colour comes from. */}
      <IconClassContext.Provider value={buttonTextVariants({ variant, size })}>
        {React.Children.map(children, (child) =>
          typeof child === "string" || typeof child === "number" ? (
            <span className={cn("cube-rn-text", buttonTextVariants({ variant, size }))}>
              {child}
            </span>
          ) : (
            child
          ),
        )}
      </IconClassContext.Provider>
    </button>
  ),
);
Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
