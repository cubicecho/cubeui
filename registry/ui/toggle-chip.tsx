/**
 * A small selectable pill — a filter chip, a day-of-week toggle, a swatch.
 *
 * Distinct from `segmented` in what the selection means: a segmented control is
 * one-of-N and its items are a closed set, a chip is on/off and stands alone.
 * Colour is split across the container and the `<Text>` for the usual reason:
 * native does not inherit it.
 *
 * **Takes the rest of a `Pressable`'s props and forwards a ref**, the same
 * contract `button.tsx` has. It did not, and the closed prop set is what a
 * caller hits first: a chip explaining why it is off wants a tooltip, and
 * `<TooltipTrigger asChild>` clones its child with a ref and a handful of
 * `aria-*` and pointer props. A component that declares neither drops all of
 * them — silently, since the props go nowhere rather than erroring — so the
 * tooltip never opens and the chip never gets the description. The same is
 * true of `onLongPress`, `testID`, and every other prop the platform has and
 * this file had not thought to list.
 */
import * as React from "react";
import { Platform, Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

export type ToggleChipProps = Omit<
  React.ComponentProps<typeof Pressable>,
  "children" | "className" | "style"
> & {
  selected?: boolean | undefined;
  /**
   * Overrides the selected background with a literal colour — for a chip whose
   * own colour is the content, such as a palette swatch. Passing it also turns
   * off the selected label colour, since the caller's background is unknown and
   * `text-selection-foreground` would be a guess. Pair it with
   * `readableTextColor` if the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  size?: "sm" | "default" | undefined;
  // Re-declared rather than inherited, for the reason `button.tsx` gives:
  // nativewind types it as `className?: string`, which under
  // `exactOptionalPropertyTypes` rejects the `cond ? "x" : undefined` that call
  // sites pass.
  className?: string | undefined;
  children: React.ReactNode;
};

const ToggleChip = React.forwardRef<React.ElementRef<typeof Pressable>, ToggleChipProps>(
  (
    {
      selected = false,
      disabled = false,
      backgroundColor,
      size = "default",
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <Pressable
      ref={ref}
      disabled={disabled}
      // A `Pressable` has no implicit role, and `selected` is the part a screen
      // reader needs — the border and fill say it to everyone else.
      accessibilityRole="button"
      // `?? false` because a `Pressable`'s own `disabled` is `boolean | null`, and
      // `AccessibilityState` has no null. The one line where inheriting the platform's
      // prop type rather than declaring a narrower one shows through.
      accessibilityState={{ selected, disabled: disabled ?? false }}
      // The same two facts in the spelling the web understands. react-native-web does not read
      // `accessibilityState` — it forwards an allowlist of `aria-*` props and nothing else — so
      // without these the chip is styled but silent to a screen reader. `aria-pressed` and not
      // `aria-selected` because this is a `button`, where `aria-selected` is markup axe rejects.
      {...(Platform.OS === "web"
        ? ({ "aria-pressed": selected, "aria-disabled": disabled ?? false } as const)
        : {})}
      className={cn(
        "rounded-md border",
        size === "sm" ? "px-2 py-1" : "px-3 py-2",
        selected ? "border-selection bg-selection" : "border-border bg-background hover:bg-accent",
        // The label colour on the container as well as on the `<Text>` below,
        // and that is not a duplicate. The `<Text>` is the only one native
        // reads, and it is only ever reached by a bare string; an element
        // child — an icon, a `<Badge>`, anything with its own markup — passes
        // through untouched and on web takes its colour by inheriting from
        // here. Without this line a selected chip holding markup drew
        // `text-foreground` on `bg-primary`, which is near-black on near-black.
        selected && !backgroundColor ? "text-selection-foreground" : "text-foreground",
        disabled && "opacity-60",
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm",
            selected && !backgroundColor ? "text-selection-foreground" : "text-foreground",
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  ),
);
ToggleChip.displayName = "ToggleChip";

export { ToggleChip };
