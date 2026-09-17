/**
 * A pill in a segmented control — a row of mutually exclusive options.
 *
 * Ships a component *and* two class helpers, which is unusual and deliberate.
 * The same pill is often a router link rather than a button (a nav bar is a
 * segmented control whose items navigate), and a link is a host component the
 * app owns — expo-router's `<Link>`, react-router's `<NavLink>`. Those cannot
 * take a `Pressable` wrapper without losing the router's press handling, so
 * they take the class instead and render their own element.
 */
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

/**
 * The container class, for a pill the caller renders itself.
 *
 * `hover:` and `transition-colors` are no-ops on device and real on web, which
 * is the intended asymmetry: a pointer exists on one platform and not the other.
 */
export function segmentedItemClass(active: boolean, className?: string) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    className,
  );
}

/**
 * The `<Text>` half of the pill. Native does not inherit colour, so a pill
 * built from a `Pressable` needs the colour on its label, not on its container.
 * A pill built from a router `<Link>` does not need this — a link renders a
 * `Text` and text-in-text does inherit.
 */
export function segmentedTextClass(active: boolean, className?: string) {
  return cn(
    "text-sm font-medium",
    active ? "text-primary-foreground" : "text-muted-foreground",
    className,
  );
}

/**
 * A pressable pill.
 *
 * `children` is passed through untouched unless it is a bare string, in which
 * case it is wrapped in a `<Text>` carrying the active colour — the common case,
 * and the one where forgetting the wrapper is a runtime error on native.
 */
export function SegmentedButton({
  active,
  onPress,
  className,
  children,
}: {
  active: boolean;
  onPress: () => void;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      // Hand-written because a `Pressable` has no implicit role, and `selected`
      // is what tells a screen reader which pill of the set is the current one.
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn("rounded-md px-3 py-1.5", active ? "bg-primary" : "hover:bg-muted", className)}
    >
      {typeof children === "string" ? (
        <Text className={segmentedTextClass(active)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
