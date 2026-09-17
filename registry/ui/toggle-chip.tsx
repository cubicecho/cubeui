/**
 * A small selectable pill — a filter chip, a day-of-week toggle, a swatch.
 *
 * Distinct from `segmented` in what the selection means: a segmented control is
 * one-of-N and its items are a closed set, a chip is on/off and stands alone.
 * Colour is split across the container and the `<Text>` for the usual reason:
 * native does not inherit it.
 */
import type { ReactNode } from "react";
import { Platform, Pressable, Text } from "react-native";
import { cn } from "@/lib/utils";

type ToggleChipProps = {
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  /**
   * Overrides the selected background with a literal colour — for a chip whose
   * own colour is the content, such as a palette swatch. Passing it also turns
   * off the selected label colour, since the caller's background is unknown and
   * `text-primary-foreground` would be a guess. Pair it with
   * `readableTextColor` if the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  size?: "sm" | "default";
  className?: string | undefined;
  accessibilityLabel?: string | undefined;
  children: ReactNode;
};

export function ToggleChip({
  selected = false,
  onPress,
  disabled = false,
  backgroundColor,
  size = "default",
  className,
  accessibilityLabel,
  children,
}: ToggleChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // A `Pressable` has no implicit role, and `selected` is the part a screen
      // reader needs — the border and fill say it to everyone else.
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      // The same two facts in the spelling the web understands. react-native-web does not read
      // `accessibilityState` — it forwards an allowlist of `aria-*` props and nothing else — so
      // without these the chip is styled but silent to a screen reader. `aria-pressed` and not
      // `aria-selected` because this is a `button`, where `aria-selected` is markup axe rejects.
      {...(Platform.OS === "web"
        ? ({ "aria-pressed": selected, "aria-disabled": disabled } as const)
        : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      className={cn(
        "rounded-md border",
        size === "sm" ? "px-2 py-1" : "px-3 py-2",
        selected ? "border-primary bg-primary" : "border-border bg-background hover:bg-muted",
        disabled && "opacity-60",
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          className={cn(
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm",
            selected && !backgroundColor ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
