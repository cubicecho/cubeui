/**
 * The native implementation. `input.web.tsx` is its web counterpart, and
 * `input-base.ts` holds the contract they share.
 *
 * This is the plainest primitive that genuinely needs the split:
 * `type="time"` and `type="number"` (with `min`/`max`) are real DOM input
 * behaviour that `TextInput` cannot reproduce, and react-native-web offers no
 * way to reach them. Because both files export the
 * same `InputProps`, call sites never branch — the only rules are that they
 * speak `onChangeText` rather than `onChange`, and reach the element through
 * `InputHandle` rather than an `HTMLInputElement` ref.
 */

import { useImperativeHandle, useRef } from "react";
import { TextInput } from "react-native";
import { INPUT_CLASS, type InputHandle, type InputProps } from "@/components/ui/input-base";
import { cn } from "@/lib/utils";

function Input({
  className,
  type = "text",
  inputMode,
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  placeholder,
  maxLength,
  disabled,
  autoFocus,
  ref,
}: InputProps) {
  const inner = useRef<TextInput>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
  }));

  return (
    <TextInput
      ref={inner}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      maxLength={maxLength}
      editable={!disabled}
      autoFocus={autoFocus}
      inputMode={inputMode ?? (type === "number" ? "numeric" : "text")}
      secureTextEntry={type === "password"}
      className={cn(INPUT_CLASS, disabled && "opacity-50", className)}
    />
  );
}

export type {
  InputHandle,
  InputProps,
  InputType,
} from "@/components/ui/input-base";
export { Input };
