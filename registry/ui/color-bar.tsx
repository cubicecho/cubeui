import { View } from "react-native";
import { hexToAccent } from "@/lib/color";
import { cn } from "@/lib/utils";

type ColorBarProps = {
  /** Nullable so callers can pass an optional field; renders nothing without it. */
  color?: string | null | undefined;
  /** What the colour stands for, exposed as the bar's accessible name. */
  label?: string | undefined;
  className?: string | undefined;
};

/**
 * A full-height accent bar pinned to the left edge of a card.
 *
 * The colour is normalised through `hexToAccent`, which keeps its hue and moves
 * its lightness into a band that is 3:1 from the page and from a card in every
 * theme `@cubeui/tokens` ships, so the stripe stays visible without knowing which
 * theme is on: a yellow is drawn as an olive, a navy as a mid blue. `label` is
 * the accessible name only — a `title` tooltip has no native counterpart, so it
 * was dropped rather than made web-only.
 *
 * Prefer `<Card accentColor accentLabel>`, which owns the positioning this
 * needs. Used directly, the parent must be `relative` and `overflow-hidden` so
 * the bar follows the rounded corners.
 */
export function ColorBar({ color, label, className }: ColorBarProps) {
  if (!color) {
    return null;
  }
  return (
    <View
      className={cn("absolute inset-y-0 left-0 w-2.5", className)}
      style={{ backgroundColor: hexToAccent(color) }}
      {...(label
        ? ({ role: "img", "aria-label": label } as const)
        : ({ "aria-hidden": true } as const))}
    />
  );
}
