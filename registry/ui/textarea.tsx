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

import { useImperativeHandle, useRef } from "react";
import { Platform, TextInput } from "react-native";
import {
  isSubmitKey,
  TEXTAREA_CLASS,
  type TextareaHandle,
  type TextareaKeyPressEvent,
  type TextareaKeyPressHandler,
  type TextareaProps,
} from "@/components/ui/textarea-base";
import { cn } from "@/lib/utils";

function Textarea({
  value,
  defaultValue,
  onChangeText,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  onEscape,
  placeholder,
  rows,
  maxLength,
  disabled,
  className,
  id,
  ref,
}: TextareaProps) {
  const inner = useRef<TextInput>(null);
  useImperativeHandle<TextareaHandle, TextareaHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
  }));

  return (
    <TextInput
      ref={inner}
      multiline
      textAlignVertical="top"
      // Held at `""` unless the caller asked for uncontrolled by passing a `defaultValue`: a bound
      // field's value starts `undefined` more often than not.
      {...(defaultValue === undefined ? { value: value ?? "" } : { value, defaultValue })}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onKeyPress={(event) => {
        onKeyPress?.(event);
        if (event.nativeEvent.key === "Escape") onEscape?.();
        // Only where the key reports its Shift. A device's return key does not, and taking it
        // would leave a message with no way to hold a second line.
        if (Platform.OS === "web" && onSubmitEditing && isSubmitKey(event.nativeEvent)) {
          // Held back, or the Enter that sent the message would also add a line to the next.
          event.preventDefault();
          onSubmitEditing();
        }
      }}
      placeholder={placeholder}
      {...(rows !== undefined ? { numberOfLines: rows } : {})}
      {...(maxLength !== undefined ? { maxLength } : {})}
      editable={!disabled}
      id={id}
      className={cn(TEXTAREA_CLASS, disabled && "opacity-50", className)}
    />
  );
}

export type { TextareaHandle, TextareaKeyPressEvent, TextareaKeyPressHandler, TextareaProps };
export { Textarea };
