/**
 * Compiled from `registry/ui/segmented.tsx` — Stage 0 spike, hand-run.
 *
 * The two class helpers compile to themselves: they are `cn()` calls over string literals with no
 * JSX in them, so the transform has nothing to do and the web item exports the identical function.
 * That is worth noting because it is the cheap half of the registry — every `*-base.ts` and every
 * class helper crosses for free.
 *
 * `SegmentedButton` is where the transform has to make a judgement:
 *
 *   accessibilityRole="button"              ->  <button type="button">
 *   accessibilityState={{ selected }}       ->  (nothing — see below)
 *   aria-pressed={active}                   ->  aria-pressed={active}
 *
 * The middle line is what the spike found, and it was a live bug in `registry/ui/segmented.tsx`
 * rather than a question about compiling. react-native-web does not read `accessibilityState` at
 * all — it forwards an allowlist of `aria-*` props and drops everything else — so the active pill
 * was styled and silent, with nothing telling a screen reader which of the set was current. The
 * fix belongs in the React Native source, and that is where it went: the source now also passes
 * `aria-pressed` under `Platform.OS === "web"`, and the compiled output is a translation of it
 * again rather than an improvement on it.
 *
 * `aria-pressed` and not `aria-selected`, which is the naive mapping of the word `selected`:
 * `aria-selected` is only defined on `option`, `tab`, `row`, `gridcell` and `treeitem`, and on a
 * button it is markup axe rejects. `stories/segmented.stories.tsx` is the evidence for all of
 * this rather than the assertion of it.
 */

import type { ReactNode } from "react";
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
 * case it is wrapped in a `<span>` carrying the active colour. On native that
 * wrapper is not optional — a bare string inside a `Pressable` throws — and on
 * the DOM it is what carries the colour the container cannot inherit down.
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
    <button
      type="button"
      onClick={onPress}
      aria-pressed={active}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "rounded-md px-3 py-1.5",
        active ? "bg-primary" : "hover:bg-muted",
        className,
      )}
    >
      {typeof children === "string" ? (
        <span className={cn("cube-rn-text", segmentedTextClass(active))}>{children}</span>
      ) : (
        children
      )}
    </button>
  );
}
