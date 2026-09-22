/**
 * The web implementation — see `textarea.tsx` for why this one is split, and
 * `textarea-base.ts` for the contract both sides implement.
 *
 * It is hand-written rather than compiled because nothing `TextInput` does here
 * survives a rename table: `editable={!disabled}` inverts, `onChangeText(text)`
 * and `onChange(event)` are different signatures, and the element itself depends
 * on the value of `multiline`. Each of those is the compiler guessing at
 * semantics the source never stated, which is the one thing it is built not to
 * do — so it refuses, and this file is the answer it asks for.
 *
 * **It is also shadcn's `Textarea`.** It installs over a DOM app's own
 * `components/ui/textarea.tsx`, so it takes everything a `<textarea>` does —
 * `onChange(event)` beside `onChangeText`, `name`, `defaultValue`, the key and
 * focus handlers, a `ref` to the element — and a `value` left out is left
 * uncontrolled, as it is on the DOM. (The native half holds a missing value at
 * `""`; a bound field passes one either way.)
 */

import type { ComponentPropsWithRef } from "react";
import {
  type TextareaProps as SharedTextareaProps,
  TEXTAREA_CLASS,
} from "@/components/ui/textarea-base";
import { cn } from "@/lib/utils";

/** The shared contract, widened to everything a DOM `<textarea>` takes. */
export type TextareaProps = Omit<ComponentPropsWithRef<"textarea">, "className"> &
  Omit<SharedTextareaProps, "onBlur" | "value"> & {
    value?: ComponentPropsWithRef<"textarea">["value"];
  };

function Textarea({ onChange, onChangeText, className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      onChange={(e) => {
        onChange?.(e);
        onChangeText?.(e.target.value);
      }}
      {...props}
      className={cn(
        TEXTAREA_CLASS,
        // `resize-y` is the browser's own affordance and has no native
        // counterpart; `disabled:` is the DOM attribute doing what the native
        // half spells out as `disabled && "opacity-50"`.
        "resize-y disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
    />
  );
}

export { Textarea };
