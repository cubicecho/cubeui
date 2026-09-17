/**
 * Multi-line text entry, shared by both platforms.
 *
 * A `TextInput multiline` is a real `<textarea>` on web (react-native-web
 * swaps the element when `multiline` is set), so there is nothing left for a
 * `.web.tsx` to do.
 *
 * The placeholder colour rides in `className` as a `placeholder:` variant, the
 * same way `input-base.ts` does it. NativeWind 4's `placeholderClassName` prop
 * is gone in 5; the variant compiles to `placeholderTextColor` on device and to
 * a real `::placeholder` rule on web. The props are spelled out rather than taken from
 * `TextInputProps` for the same reason `input-base.ts` does it: callers write
 * `onChangeText`, not a DOM change event.
 */

import { TextInput } from "react-native";
import { cn } from "@/lib/utils";

export type TextareaProps = {
  value?: string | undefined;
  onChangeText?: ((text: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  /** Visible lines; the box grows no further and scrolls instead. */
  rows?: number | undefined;
  maxLength?: number | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  /** Web only: ties the control to its `<label>`. */
  id?: string | undefined;
};

function Textarea({
  value,
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
      value={value ?? ""}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={placeholder}
      {...(rows !== undefined ? { numberOfLines: rows } : {})}
      {...(maxLength !== undefined ? { maxLength } : {})}
      editable={!disabled}
      id={id}
      className={cn(
        "border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled && "opacity-50",
        className,
      )}
    />
  );
}

export { Textarea };
