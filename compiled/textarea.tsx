/**
 * Copied from `registry/ui/textarea.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

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
 */

import { TEXTAREA_CLASS, type TextareaProps } from "@/components/ui/textarea-base";
import { cn } from "@/lib/utils";

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
    <textarea
      id={id}
      value={value ?? ""}
      onChange={(e) => onChangeText?.(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      disabled={disabled}
      className={cn(
        TEXTAREA_CLASS,
        // `resize-y` is the browser's own affordance and has no native
        // counterpart; `disabled:` is the DOM attribute doing what the native
        // half spells out as `disabled && "opacity-50"`.
        "resize-y disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

export type { TextareaProps } from "@/components/ui/textarea-base";
export { Textarea };
