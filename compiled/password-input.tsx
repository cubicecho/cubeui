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
 * its `trailing` slot. Written once, in React Native, and compiled for the web — the web half is a
 * real `<input>` whose `type` flips, the native one a `TextInput` whose `secureTextEntry` does.
 *
 * Nine call sites across six projects write `<Input type="password">`, and not one of them can be
 * un-masked. Five of those are token gates — a pasted bearer token, a server's start-up secret —
 * where the only failure mode is a character that went in wrong and the only diagnosis is
 * "Unlock" not working. The other four are a change-password form, which asks for the same secret
 * twice precisely because it cannot be read back.
 *
 * So the control is the toggle, and everything else is `Input` unchanged. Three details are the
 * ones a hand-written eye gets wrong, every time:
 *
 * - **The button does not submit.** A `<button>` in a `<form>` submits by default, so a reveal
 *   written without `type="button"` submits the login form on the way to reading the password.
 *   `Button` is `type="button"` on the web unless told otherwise, and on device nothing submits.
 * - **The button is named, and the name changes.** An icon-only button with no `aria-label` is an
 *   axe failure and a screen reader saying "button"; one whose label stays "Show password" after
 *   it has shown it is worse, because it is confidently wrong. Not `aria-pressed` either: the name
 *   already carries the state, and a button announced as "Hide password, pressed" says it twice
 *   and disagrees with itself once.
 * - **The masking is the `type`, not a CSS trick.** `type="text"` while revealed is what stops
 *   the password manager from filling the field a second time and what keeps the value out of the
 *   browser's own "reveal" chrome on Edge, which would otherwise draw a second eye beside this
 *   one. On device the same `type` is `secureTextEntry`, which also keeps the secret out of
 *   autocorrect and the suggestion strip while it is masked.
 *
 * Revealed state is deliberately local and deliberately not a prop. Nothing above this needs to
 * know, and a form that persisted it would be a form that remembers to show a password.
 *
 * The rest of the props are `Input`'s, on each half, so the web half still takes `onChange`,
 * `name`, `autoComplete` and the ref to the `<input>`. `className` goes to the field, as on any
 * input, and `wrapperClassName` to the box that holds the field and the eye.
 *
 * ```tsx
 * <PasswordInput id="token" value={token} onChangeText={setToken} />
 * ```
 */
import { useState } from "react";
import { Button } from "./button";
import { Eye, EyeOff } from "./icons";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailing"> & {
  /** The reveal button's name while the value is hidden. */
  showLabel?: string | undefined;
  /** And while it is showing. Both are announced; the icon alone says nothing. */
  hideLabel?: string | undefined;
  /** Off, this is a plain `<Input type="password">` with no button. */
  revealable?: boolean | undefined;
};

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
      trailing={
        revealable ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={visible ? hideLabel : showLabel}
            disabled={disabled}
            onClick={() => setShown((was) => !was)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        ) : undefined
      }
    />
  );
}
