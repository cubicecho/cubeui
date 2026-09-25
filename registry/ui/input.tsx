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
 * `InputHandle` rather than an `HTMLInputElement` ref. (The web half takes both
 * of those as well, as shadcn's `Input` does; shared code should not.)
 *
 * `leading` and `trailing` put an icon, or an icon-sized button, inside the
 * field. Without either, the root is the `TextInput` and nothing else, so no
 * existing call site gains a view. With one, the field sits in a `relative`
 * box and each slot is positioned over it, drawn after the `TextInput` so it
 * paints on top; the icon's size and ink come through `IconClassContext`,
 * because an icon on device inherits nothing from the view around it.
 */

import { useImperativeHandle, useRef } from "react";
import { TextInput, View } from "react-native";
import { IconClassContext } from "@/components/ui/icons-base";
import {
  INPUT_CLASS,
  INPUT_LEADING_CLASS,
  INPUT_LEADING_PAD_CLASS,
  INPUT_SLOT_ICON_CLASS,
  INPUT_TRAILING_CLASS,
  INPUT_TRAILING_PAD_CLASS,
  INPUT_WRAPPER_CLASS,
  type InputHandle,
  type InputKeyPressEvent,
  type InputKeyPressHandler,
  type InputProps,
  type InputType,
  NATIVE_INPUT_MODE,
} from "@/components/ui/input-base";
import { cn } from "@/lib/utils";

function Input({
  className,
  type = "text",
  inputMode,
  value,
  defaultValue,
  onChangeText,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  onEscape,
  placeholder,
  maxLength,
  disabled,
  autoFocus,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  leading,
  trailing,
  wrapperClassName,
  ref,
}: InputProps) {
  const inner = useRef<TextInput>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
  }));

  const field = (
    <TextInput
      ref={inner}
      value={value}
      defaultValue={defaultValue}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      onKeyPress={(event: InputKeyPressEvent) => {
        onKeyPress?.(event);
        if (event.nativeEvent.key === "Escape") onEscape?.();
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      editable={!disabled}
      autoFocus={autoFocus}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      inputMode={inputMode ?? NATIVE_INPUT_MODE[type] ?? "text"}
      secureTextEntry={type === "password"}
      // What a DOM `type="search"` is without being told, so a screen reader on device says
      // "search field" too.
      role={type === "search" ? "searchbox" : undefined}
      className={cn(
        INPUT_CLASS,
        leading != null && INPUT_LEADING_PAD_CLASS,
        trailing != null && INPUT_TRAILING_PAD_CLASS,
        disabled && "opacity-50",
        className,
      )}
    />
  );

  if (leading == null && trailing == null) return field;

  return (
    <View className={cn(INPUT_WRAPPER_CLASS, wrapperClassName)}>
      {field}
      <IconClassContext.Provider value={INPUT_SLOT_ICON_CLASS}>
        {leading != null ? <View className={INPUT_LEADING_CLASS}>{leading}</View> : null}
        {trailing != null ? <View className={INPUT_TRAILING_CLASS}>{trailing}</View> : null}
      </IconClassContext.Provider>
    </View>
  );
}

export type { InputHandle, InputKeyPressEvent, InputKeyPressHandler, InputProps, InputType };
export { Input };
