/**
 * Swatches plus a hex field, replacing `<input type="color">`.
 *
 * The DOM colour input has no native counterpart — react-native-web renders it
 * as a plain text box and a `TextInput` cannot open a picker — so an app with
 * both targets ends up with two different colour controls. This is the one that
 * works on both: the swatch row is what a native sheet would offer anyway, and
 * the hex field is still the way to enter a colour that is not on the list.
 */
import { Pressable, Text, View } from "react-native";
import { Input } from "@/components/ui/input";
import { readableTextColor } from "@/lib/readable-text-color";
import { cn } from "@/lib/utils";

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
    <View className={cn("gap-3", className)}>
      <View className="flex-row flex-wrap gap-2">
        {colors.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              // A swatch row is a radio group: one of the set is current, and
              // the label is the colour itself, which nothing else conveys.
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={color}
              className={cn(
                "h-9 w-9 items-center justify-center rounded-full border-2",
                selected ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            >
              {selected ? (
                // The tick has to be legible on whatever the caller passed, and
                // a caller's palette is not known here — a hardcoded white one
                // disappears on `#eab308`.
                <Text
                  className="text-base leading-none"
                  style={{ color: readableTextColor(color) ?? "#ffffff" }}
                >
                  ✓
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
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
    </View>
  );
}
