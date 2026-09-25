/**
 * A search box: `Input` with a `Search` icon at its start, `type="search"`, a name, and a ✕ that
 * clears it. `search-input.web.tsx` is the web counterpart and `search-input-base.ts` holds what
 * they share.
 *
 * Thirteen search boxes across eight projects are this written by hand — a `relative` wrapper, an
 * absolute glyph, a `pl-8` — and most of them have no accessible name beyond a placeholder and no
 * way to clear but backspace. This is those, with the three details in the box:
 *
 * - **It is a search field.** `type="search"` raises the search keyboard on device and, through
 *   `Input`, is `role="searchbox"`, so a screen reader says what the box is for.
 * - **It is named.** `label`, default "Search", unless something else already names it.
 * - **The ✕ shows only with text in the box,** is a named button, and puts focus back in the
 *   field, so clearing and typing again is one motion.
 *
 * The text is `onChangeText`, as on every native input. The box keeps its own copy only when the
 * caller does not hold `value`, which is what lets the ✕ clear an uncontrolled box and still know
 * when to show itself.
 */
import { useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, X } from "@/components/ui/icons";
import { Input, type InputHandle, type InputProps } from "@/components/ui/input";
import {
  SEARCH_CLEAR_LABEL,
  type SearchInputOwnProps,
  searchInputName,
} from "@/components/ui/search-input-base";

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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: SearchInputProps) {
  const [draft, setDraft] = useState(defaultValue ?? "");
  const text = value ?? draft;
  const inner = useRef<InputHandle>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
  }));

  const change = (next: string) => {
    if (value === undefined) setDraft(next);
    onChangeText?.(next);
  };

  return (
    <Input
      {...props}
      ref={inner}
      type="search"
      value={text}
      onChangeText={change}
      disabled={disabled}
      id={id}
      aria-label={searchInputName({ label, ariaLabel, ariaLabelledBy, id })}
      aria-labelledby={ariaLabelledBy}
      leading={<Search />}
      trailing={
        clearable && text !== "" && !disabled ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            onPress={() => {
              change("");
              inner.current?.focus();
            }}
          >
            <X />
          </Button>
        ) : undefined
      }
    />
  );
}
