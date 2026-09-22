/**
 * Multi-line text entry on device — see `textarea-base.ts` for the contract both
 * halves implement, and `textarea.web.tsx` for the other one.
 *
 * This file used to be the whole item: a `TextInput multiline` is a real
 * `<textarea>` under react-native-web, so a web half looked like pure
 * duplication. The compiled registry is what made that false — it ships to the
 * DOM with no react-native-web underneath, so there is no longer anything to do
 * the swap. `rn2web` refused the item and said so, which is how the gap surfaced
 * rather than shipping as a `<div>` nobody could type into.
 */

import { TextInput } from "react-native";
import { TEXTAREA_CLASS, type TextareaProps } from "@/components/ui/textarea-base";
import { cn } from "@/lib/utils";

function Textarea({
  value,
  defaultValue,
  onChangeText,
  onBlur,
  placeholder,
  rows,
  maxLength,
  disabled,
  className,
  id,
}: TextareaProps) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      // Held at `""` unless the caller asked for uncontrolled by passing a `defaultValue`: a bound
      // field's value starts `undefined` more often than not.
      {...(defaultValue === undefined ? { value: value ?? "" } : { value, defaultValue })}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={placeholder}
      {...(rows !== undefined ? { numberOfLines: rows } : {})}
      {...(maxLength !== undefined ? { maxLength } : {})}
      editable={!disabled}
      id={id}
      className={cn(TEXTAREA_CLASS, disabled && "opacity-50", className)}
    />
  );
}

export type { TextareaProps } from "@/components/ui/textarea-base";
export { Textarea };
