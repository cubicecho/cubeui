/**
 * The web implementation — see `input.tsx` for why this one is split, and
 * `input-base.ts` for the contract both sides implement.
 *
 * It keeps the DOM `<input>` so `type="time"`, `type="number"` and `min`/`max`
 * keep working, and adapts the event to the shared `onChangeText` contract so
 * no call site has to know which platform it is on.
 *
 * **It is also shadcn's `Input`, prop for prop.** This file installs at the
 * same `components/ui/input.tsx` a DOM app's shadcn primitive lives at, so the
 * first `shadcn add @cubeui/…` overwrites that primitive — and every
 * `<Input onChange={(e) => …}>`, `name`, `defaultValue`, `onKeyDown`, every DOM
 * input `type` and every `useRef<HTMLInputElement>` already in the app has to
 * keep compiling and keep working. So the props are the shared contract on top
 * of `ComponentProps<"input">`, both change handlers fire, and the ref is the
 * element (which already satisfies `InputHandle`, so shared call sites holding
 * one are served by the same object).
 */

import type { ComponentPropsWithoutRef, HTMLInputTypeAttribute, Ref } from "react";
import {
  INPUT_CLASS,
  type InputHandle,
  type InputType,
  type InputProps as SharedInputProps,
} from "@/components/ui/input-base";
import { cn } from "@/lib/utils";

/**
 * The shared contract, widened to everything a DOM `<input>` takes.
 *
 * `onBlur` and `min`/`max` take the DOM's wider types — a `() => void` is still one — and `type`
 * is every DOM input type, of which `InputType` is the cross-platform part.
 */
export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "className"> &
  Omit<SharedInputProps, "type" | "ref" | "onBlur" | "min" | "max" | "inputMode" | "value"> & {
    type?: HTMLInputTypeAttribute | undefined;
    ref?: Ref<HTMLInputElement> | Ref<InputHandle> | undefined;
  };

function Input({
  className,
  type = "text",
  onChange,
  onChangeText,
  onKeyDown,
  onSubmitEditing,
  ref,
  ...props
}: InputProps) {
  return (
    <input
      // The element is the handle: it has `focus` and `select`, which is all `InputHandle` asks.
      ref={ref as Ref<HTMLInputElement>}
      data-slot="input"
      type={type}
      onChange={(e) => {
        onChange?.(e);
        onChangeText?.(e.target.value);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Enter" && onSubmitEditing && !e.defaultPrevented) {
          e.preventDefault();
          onSubmitEditing();
        }
      }}
      {...props}
      className={cn(
        INPUT_CLASS,
        "file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
    />
  );
}

export type { InputHandle, InputType };
export { Input };
