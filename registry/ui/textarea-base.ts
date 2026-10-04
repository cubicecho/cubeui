/**
 * The contract both `textarea.tsx` (native) and `textarea.web.tsx` implement.
 *
 * It lives in its own module for the same reason `input-base.ts` does: Metro
 * resolves `./textarea` to `textarea.web.tsx` on web, so the web file importing
 * the shared pieces from `./textarea` would be importing itself.
 *
 * The props are spelled out rather than taken from `TextInputProps` because
 * callers write `onChangeText`, not a DOM change event — the same contract
 * `input-base.ts` holds, so a bound field looks identical whichever it wraps.
 */

import type { Ref } from "react";

/**
 * What a caller may do to the box imperatively: put the caret back after a send. On the web the
 * ref is the `<textarea>` itself, which has `focus`, as `InputHandle` is the `<input>` there.
 */
export type TextareaHandle = { focus: () => void };

/**
 * What `onKeyPress` hands over, as on `Input`: the key, as `nativeEvent.key`. The other two are
 * what Enter-to-send reads, and only a keyboard with a Shift to hold reports them, so they are
 * there on the web and absent on a device. Declared here and not taken from `input-base.ts`, so
 * this item installs without that one.
 */
export type TextareaKeyPressEvent = {
  nativeEvent: {
    key: string;
    shiftKey?: boolean | undefined;
    isComposing?: boolean | undefined;
  };
};

/** A handler of that event, as a method so a narrower native handler is still accepted. */
export type TextareaKeyPressHandler = {
  bivarianceHack(event: TextareaKeyPressEvent): void;
}["bivarianceHack"];

/**
 * Whether a key sends. Enter alone: Shift+Enter is a new line, and an Enter that only accepts
 * an input method's suggestion is still someone part-way through a word.
 */
export function isSubmitKey({
  key,
  shiftKey,
  isComposing,
}: TextareaKeyPressEvent["nativeEvent"]): boolean {
  return key === "Enter" && !shiftKey && !isComposing;
}

export type TextareaProps = {
  value?: string | undefined;
  /** Uncontrolled: where the text starts, when nothing above is holding `value`. */
  defaultValue?: string | undefined;
  onChangeText?: ((text: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  /**
   * Enter without Shift, which is what sends a chat message; Shift+Enter is still a new line.
   * Where there is a Shift to hold, that is: the web, an Expo app's web build included. On a
   * device the return key adds a line, as it does in every messaging app, and a send button is
   * the way out.
   */
  onSubmitEditing?: (() => void) | undefined;
  /** Every key as it goes down, as on `Input`. */
  onKeyPress?: TextareaKeyPressHandler | undefined;
  /** Escape, after any `onKeyPress`. A soft keyboard has no such key. */
  onEscape?: (() => void) | undefined;
  placeholder?: string | undefined;
  /** Visible lines; the box grows no further and scrolls instead. */
  rows?: number | undefined;
  maxLength?: number | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  /** Web only: ties the control to its `<label>`. */
  id?: string | undefined;
  ref?: Ref<TextareaHandle> | undefined;
};

/**
 * The placeholder colour rides here as a `placeholder:` variant, the same way
 * `INPUT_CLASS` does it. NativeWind 4's `placeholderClassName` prop is gone in
 * 5; the variant compiles to `placeholderTextColor` on device and to a real
 * `::placeholder` rule on web.
 */
export const TEXTAREA_CLASS =
  "border-foreground/15 bg-background text-foreground placeholder:text-foreground/60 focus:border-active min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none";
