/**
 * Copied from `registry/ui/input.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web implementation — see `input.tsx` for why this one is split, and
 * `input-base.ts` for the contract both sides implement.
 *
 * It keeps the DOM `<input>` so `type="time"`, `type="number"` and `min`/`max`
 * keep working, and adapts the event to the shared `onChangeText` contract so
 * no call site has to know which platform it is on.
 */

import { useImperativeHandle, useRef } from "react";
import { INPUT_CLASS, type InputHandle, type InputProps } from "@/components/ui/input-base";
import { cn } from "@/lib/utils";

function Input({
  className,
  type = "text",
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  placeholder,
  maxLength,
  disabled,
  min,
  max,
  id,
  autoFocus,
  ref,
}: InputProps) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
    select: () => inner.current?.select(),
  }));

  return (
    <input
      ref={inner}
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChangeText?.(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmitEditing) {
          e.preventDefault();
          onSubmitEditing();
        }
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      min={min}
      max={max}
      // biome-ignore lint/a11y/noAutofocus: preserves the behaviour of the call sites that ask for it
      autoFocus={autoFocus}
      className={cn(
        INPUT_CLASS,
        "file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export type {
  InputHandle,
  InputProps,
  InputType,
} from "@/components/ui/input-base";
export { Input };
