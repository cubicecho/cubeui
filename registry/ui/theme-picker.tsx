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
 */

import { Monitor, Moon, Sun } from "@/components/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useThemePreference } from "@/components/ui/theme-preference";
import { isThemePreference, type ThemePreference } from "@/components/ui/theme-preference-base";

type ThemePickerProps = {
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

function ThemeOptions({
  value,
  onValueChange,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: ThemePickerProps) {
  return (
    <RadioGroup
      variant="card"
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
      <RadioGroupItem
        value="light"
        label="Light"
        hint="Always light"
        icon={<Sun className="h-5 w-5" />}
      />
      <RadioGroupItem
        value="dark"
        label="Dark"
        hint="Always dark"
        icon={<Moon className="h-5 w-5" />}
      />
      <RadioGroupItem
        value="system"
        label="System"
        hint="Follow the device"
        icon={<Monitor className="h-5 w-5" />}
      />
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
