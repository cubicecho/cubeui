/**
 * The web search box — see `search-input.tsx` for what it is and why, and `search-input-base.ts`
 * for what the halves share.
 *
 * It takes what the web `Input` takes, so both change handlers work: `onChangeText` hands over the
 * text, as on native, and `onChange` the DOM event, as on a shadcn input. The ✕ has to reach both,
 * and it has no event to hand `onChange`, so it makes one: it writes the empty value through the
 * element's own setter and dispatches `input`, which React reads as the user clearing the box and
 * `Input` turns into both calls. That also clears an uncontrolled box, which is why this half never
 * holds the text — only whether there is any, for the ✕.
 *
 * The ✕ is a plain `<button>` wearing `buttonVariants`, not `Button`, for the reason
 * `file-picker.web.tsx` gives: this file is also what an Expo web app runs, where `Button` is a
 * `Pressable` that takes `onPress`, while the compiled one takes `onClick`. A `<button>` is the same
 * element in both. For the same reason the body touches only what both `Input` halves type —
 * `onChange` passes through untouched rather than being read here.
 */
import { useCallback, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Search, X } from "@/components/ui/icons";
import { Input, type InputHandle, type InputProps } from "@/components/ui/input";
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_INPUT_CLASS,
  type SearchInputOwnProps,
  searchInputName,
} from "@/components/ui/search-input-base";
import { cn } from "@/lib/utils";

export type SearchInputProps = Omit<InputProps, "type" | "leading" | "trailing"> &
  SearchInputOwnProps;

export function SearchInput({
  label,
  clearLabel = SEARCH_CLEAR_LABEL,
  clearable = true,
  value,
  defaultValue,
  onChangeText,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: SearchInputProps) {
  const element = useRef<HTMLInputElement | null>(null);
  const [typed, setTyped] = useState(String(defaultValue ?? "") !== "");
  const filled = value === undefined ? typed : String(value) !== "";

  // The ref `Input` hands back is the `<input>` on the web; the caller's ref gets it too.
  const attach = useCallback(
    (node: InputHandle | null) => {
      element.current = node as HTMLInputElement | null;
      // The node is both: an `HTMLInputElement` has `focus` and `select`.
      if (typeof ref === "function") (ref as (node: InputHandle | null) => void)(node);
      else if (ref) (ref as { current: InputHandle | null }).current = node;
    },
    [ref],
  );

  const clear = () => {
    const box = element.current;
    if (!box) return;
    // The prototype's setter, not `box.value = ""`: React tracks the last value it saw on the
    // element, and a plain assignment updates that too, so the `input` event would read as no
    // change and `onChange` would never fire.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(box, "");
    box.dispatchEvent(new Event("input", { bubbles: true }));
    box.focus();
  };

  return (
    <Input
      {...props}
      ref={attach}
      type="search"
      value={value}
      defaultValue={defaultValue}
      onChangeText={(text) => {
        setTyped(text !== "");
        onChangeText?.(text);
      }}
      disabled={disabled}
      id={id}
      aria-label={searchInputName({ label, ariaLabel, ariaLabelledBy, id })}
      aria-labelledby={ariaLabelledBy}
      className={cn(SEARCH_INPUT_CLASS, className)}
      leading={<Search />}
      trailing={
        clearable && filled && !disabled ? (
          <button
            type="button"
            data-slot="search-input-clear"
            aria-label={clearLabel}
            onClick={clear}
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <X />
          </button>
        ) : undefined
      }
    />
  );
}
