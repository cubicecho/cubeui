/**
 * Compiled from `registry/ui/color-picker.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { readableTextColor } from "@/lib/readable-text-color";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/**
 * A palette wide enough to look chosen from rather than settled for.
 *
 * These are Tailwind's 500s. They are only a default: an app whose colours mean
 * something — a calendar's activity types, a tag taxonomy — passes its own list,
 * and that is the common case.
 */
export const COLOR_SWATCHES = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
] as const;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * A typed colour with its `#` put back, and nothing else changed.
 *
 * People paste `2563eb` out of a design tool and type `#2563EB` from memory, and both are
 * the colour they meant. Case is left alone on purpose: the value goes to a database, and a
 * picker that silently rewrites `#2563EB` to `#2563eb` shows up as a dirty form and an
 * audit-log entry for an edit nobody made.
 */
export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/** Whether a string is a `#rgb` or `#rrggbb` colour. */
export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  onBlur?: (() => void) | undefined;
  /** Swatches to offer. Defaults to `COLOR_SWATCHES`. */
  colors?: readonly string[];
  className?: string | undefined;
};

export function ColorPicker({
  value,
  onChange,
  onBlur,
  colors = COLOR_SWATCHES,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("cube-rn-view", "gap-3", className)}>
      {/*
        The group the swatches are radios *of*. A `radio` with no `radiogroup` around it is an
        incomplete control to an assistive technology and an axe violation on web, and the role
        is the same word on both platforms.
      */}
      <div role="radiogroup" className="cube-rn-view flex-row flex-wrap gap-2">
        {colors.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              type="button"
              key={color}
              onClick={() => onChange(color)}
              // A swatch row is a radio group: one of the set is current, and
              // the label is the colour itself, which nothing else conveys.
              role="radio"
              // The same fact in the spelling the web understands — react-native-web forwards an
              // allowlist of `aria-*` props and ignores `accessibilityState` entirely. A radio
              // says its state with `aria-checked`, not `aria-selected`.
              aria-checked={selected}
              aria-label={color}
              className={cn(
                "cube-rn-view cube-rn-pressable",
                "h-9 w-9 items-center justify-center rounded-full border-2",
                selected ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            >
              {selected ? (
                // The tick has to be legible on whatever the caller passed, and
                // a caller's palette is not known here — a hardcoded white one
                // disappears on `#eab308`.
                <span
                  className="cube-rn-text text-base leading-none"
                  style={{ color: readableTextColor(color) ?? "#ffffff" }}
                >
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <Input
        // A format hint rather than a colour: the field's job is the colour that
        // is *not* in the row above, so showing one of them would mislead.
        placeholder="#rrggbb"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        maxLength={7}
        className="font-mono"
      />
    </div>
  );
}
