/**
 * Compiled from `registry/ui/password-input.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A password box with an eye on it: `Input` with `type="password"` and a named show/hide button in
 * its `trailingSlot`. The rest of the props are `Input`'s, with `wrapperClassName` for the box
 * that holds the field and the eye.
 *
 * The button's name changes with what it does ("Show password", "Hide password"), so it carries
 * no `aria-pressed`. The masking is the `type` and not a CSS trick: `type="text"` while revealed
 * is what stops Edge drawing a second eye, and on device it is `secureTextEntry`. Revealed state
 * is local and not a prop, so no form remembers to show a password.
 *
 * ```tsx
 * <PasswordInput id="token" value={token} onChangeText={setToken} />
 * ```
 */
import { useState } from "react";
import { Button } from "./button";
import { Eye, EyeOff } from "./icons";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailingSlot"> & {
  /** The reveal button's name while the value is hidden. */
  showLabel?: string | undefined;
  /** And while it is showing. Both are announced; the icon alone says nothing. */
  hideLabel?: string | undefined;
  /** Off, this is a plain `<Input type="password">` with no button. */
  revealable?: boolean | undefined;
};

/** A password box with a button that shows and hides what was typed. */
export function PasswordInput({
  showLabel = "Show password",
  hideLabel = "Hide password",
  revealable = true,
  disabled,
  ...props
}: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  const visible = revealable && shown;

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      disabled={disabled}
      trailingSlot={
        revealable ? (
          <Button
            variant="secondary"
            size="icon-xs"
            aria-label={visible ? hideLabel : showLabel}
            disabled={disabled}
            onClick={() => setShown((was) => was === false)}
            content={visible ? <EyeOff /> : <Eye />}
          />
        ) : undefined
      }
    />
  );
}
