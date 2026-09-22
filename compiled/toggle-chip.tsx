/**
 * Compiled from `registry/ui/toggle-chip.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A small selectable pill — a filter chip, a day-of-week toggle, a swatch.
 *
 * Distinct from `segmented` in what the selection means: a segmented control is
 * one-of-N and its items are a closed set, a chip is on/off and stands alone.
 * Colour is split across the container and the `<Text>` for the usual reason:
 * native does not inherit it.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToggleChipProps = {
  selected?: boolean;
  onClick: () => void;
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
  "aria-label"?: string | undefined;
  children: ReactNode;
};

export function ToggleChip({
  selected = false,
  onClick: onPress,
  disabled = false,
  backgroundColor,
  size = "default",
  className,
  "aria-label": accessibilityLabel,
  children,
}: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      // The same two facts in the spelling the web understands. react-native-web does not read
      // `accessibilityState` — it forwards an allowlist of `aria-*` props and nothing else — so
      // without these the chip is styled but silent to a screen reader. `aria-pressed` and not
      // `aria-selected` because this is a `button`, where `aria-selected` is markup axe rejects.
      aria-pressed={selected}
      aria-disabled={disabled}
      {...(accessibilityLabel ? { "aria-label": accessibilityLabel } : {})}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "rounded-md border",
        size === "sm" ? "px-2 py-1" : "px-3 py-2",
        selected ? "border-primary bg-primary" : "border-border bg-background hover:bg-muted",
        disabled && "opacity-60",
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <span
          className={cn(
            "cube-rn-text",
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm",
            selected && !backgroundColor ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
