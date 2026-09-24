/**
 * Light, Dark and System as three tiles — a `RadioGroup variant="card"`, so one tab stop and arrow
 * keys that move and choose come with it. One source for both platforms, compiled to the web item.
 *
 * Every app wrote this, and wrote the storage and the `<html>` class beside it: the control is the
 * small part. So by default the picker is **bound** — it reads and writes `useThemePreference()`,
 * which stores the choice and applies it, and there is nothing to wire. Pass `value` and it is
 * **controlled** instead: it only reports the choice through `onValueChange`, for an app that keeps
 * the preference somewhere of its own (on the account, in a settings form), and the hook is not
 * called at all, so nothing here paints over the app's own choice.
 *
 * `variant="compact"` is the same three choices where tiles do not fit — a sidebar footer, a phone
 * header bar: one row of icon-only segments (`RadioGroup variant="segmented"`) that fills its
 * container, so the caller sizes it. It is still a radiogroup of three radios, and each caption
 * ("Light", "Dark", "System") is the radio's accessible name. On the web the caption is also the
 * hover tooltip (`title`); device has no hover, so there the caption is what VoiceOver and TalkBack
 * read and nothing is shown.
 */

import { Monitor, Moon, Sun } from "@/components/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useThemePreference } from "@/components/ui/theme-preference";
import { isThemePreference, type ThemePreference } from "@/components/ui/theme-preference-base";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  /**
   * `card` (the default): three tiles, icon over caption, for a settings page. `compact`: one
   * full-width row of icon-only segments, the caption as the name and (on the web) the tooltip.
   */
  variant?: "card" | "compact" | undefined;
  /** The checked choice, for a controlled picker. Left out, the picker is bound to the hook. */
  value?: ThemePreference | undefined;
  /** Told of every choice — the only way a controlled picker changes; a bound one also stores it. */
  onValueChange?: ((value: ThemePreference) => void) | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  /** The group's name. Defaults to "Theme"; pass `aria-labelledby` instead when a heading names it. */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-describedby"?: string | undefined;
};

const OPTIONS = [
  { value: "light", label: "Light", hint: "Always light", Icon: Sun },
  { value: "dark", label: "Dark", hint: "Always dark", Icon: Moon },
  { value: "system", label: "System", hint: "Follow the device", Icon: Monitor },
] as const;

function ThemeOptions({
  variant = "card",
  value,
  onValueChange,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: ThemePickerProps) {
  const compact = variant === "compact";
  return (
    <RadioGroup
      variant={compact ? "segmented" : "card"}
      value={value}
      onValueChange={(next) => {
        if (isThemePreference(next)) onValueChange?.(next);
      }}
      disabled={disabled}
      id={id}
      className={className}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? "Theme")}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {OPTIONS.map(({ value: option, label, hint, Icon }) =>
        compact ? (
          // No `hint`: the segment's web tooltip is then its name, the caption a tile would show.
          <RadioGroupItem
            key={option}
            value={option}
            aria-label={label}
            icon={
              <Icon
                aria-hidden
                className={cn(
                  "h-4 w-4",
                  // Named, because a native icon has no `currentColor` to inherit from the segment.
                  value === option ? "text-primary-foreground" : "text-muted-foreground",
                )}
              />
            }
          />
        ) : (
          <RadioGroupItem
            key={option}
            value={option}
            label={label}
            hint={hint}
            icon={<Icon className="h-5 w-5" />}
          />
        ),
      )}
    </RadioGroup>
  );
}

function BoundThemePicker({ onValueChange, ...props }: ThemePickerProps) {
  const [preference, setPreference] = useThemePreference();
  return (
    <ThemeOptions
      {...props}
      value={preference}
      onValueChange={(next) => {
        setPreference(next);
        onValueChange?.(next);
      }}
    />
  );
}

function ThemePicker(props: ThemePickerProps) {
  return props.value === undefined ? <BoundThemePicker {...props} /> : <ThemeOptions {...props} />;
}

export type { ThemePickerProps };
export { ThemePicker };
