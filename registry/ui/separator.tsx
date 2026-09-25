/**
 * A one-pixel rule between groups: shadcn's `Separator`, on both halves. `rn2web` compiles the web
 * half from this file; it is no longer Radix's, because all Radix added was the role and the
 * `data-orientation`, and both are written here.
 *
 * **`decorative` is shadcn's, and its default.** A rule that only divides what is visibly divided
 * already says nothing to a screen reader, so it is hidden from assistive tech on both platforms
 * (`aria-hidden`, which React Native reads as `accessibilityElementsHidden` and
 * `importantForAccessibility="no-hide-descendants"`). `decorative={false}` makes it a
 * `role="separator"` — the one to use when the rule is the only thing marking a boundary, as
 * between two lists in a menu.
 *
 * The size is a plain class per orientation, not Radix's `data-[orientation=…]:h-px` variants.
 * react-native-web does not forward a `data-*` prop, so under an Expo web build those variants
 * would match nothing and the rule would have no size. The compiled half still carries
 * `data-orientation`, so a shadcn call site's `data-[orientation=vertical]:h-4` keeps working, and a plain
 * `h-4` now wins over the default where shadcn's variant used to outrank it.
 *
 * Vertical is `self-stretch` on device rather than `h-full`: a percentage of a row whose height
 * is its content is nothing in Yoga, and the rule would be zero tall. On the web it stays shadcn's
 * `h-full`, which a flex row that stretches its children already resolves.
 */
import type * as React from "react";
import { Platform, View } from "react-native";
import { cn } from "@/lib/utils";

const ORIENTATIONS = {
  horizontal: "h-px w-full",
  vertical: Platform.select({ web: "h-full w-px", default: "w-px self-stretch" }),
} as const;

type SeparatorProps = Omit<React.ComponentProps<typeof View>, "className" | "children"> & {
  className?: string | undefined;
  /** Which way the rule runs. `horizontal` divides stacked groups, `vertical` side-by-side ones. */
  orientation?: keyof typeof ORIENTATIONS | undefined;
  /**
   * Hidden from assistive tech, the default. `false` makes it a `role="separator"` a screen
   * reader announces — for a boundary nothing else on the screen says.
   */
  decorative?: boolean | undefined;
};

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <View
      testID="separator"
      {...(decorative
        ? ({ "aria-hidden": true } as const)
        : ({
            role: "separator",
            // Radix's: said only when it is not the default. React Native has no such prop and
            // ignores it; react-native-web and the compiled half write it.
            "aria-orientation": orientation === "vertical" ? "vertical" : undefined,
          } as const))}
      {...(Platform.OS === "web" ? ({ "data-orientation": orientation } as const) : {})}
      className={cn("shrink-0 bg-border", ORIENTATIONS[orientation], className)}
      {...props}
    />
  );
}

export type { SeparatorProps };
export { Separator };
