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
 *
 * `leading` and `trailing` are the one place the root changes. Without them the
 * root is the `<input>`, exactly shadcn's; with one, the input sits in a
 * `relative` box beside an absolutely placed slot, which is where `PasswordInput` puts its
 * eye. `className` and every DOM prop still land on the `<input>`, so `id`,
 * `aria-*` and the ref reach the control a `<label>` points at.
 */

import type {
  ComponentPropsWithoutRef,
  HTMLInputTypeAttribute,
  KeyboardEventHandler,
  Ref,
} from "react";
import {
  INPUT_CLASS,
  INPUT_LEADING_CLASS,
  INPUT_LEADING_PAD_CLASS,
  INPUT_TRAILING_CLASS,
  INPUT_TRAILING_PAD_CLASS,
  INPUT_WRAPPER_CLASS,
  type InputHandle,
  type InputKeyPressEvent,
  type InputKeyPressHandler,
  type InputType,
  type InputProps as SharedInputProps,
} from "@/components/ui/input-base";
import { cn } from "@/lib/utils";

/**
 * The shared contract, widened to everything a DOM `<input>` takes.
 *
 * `onBlur`, `min`/`max`, `value` and `defaultValue` take the DOM's wider types — a `() => void` is
 * still one, and a `string` is still a `string | number | readonly string[]` — and `type` is every
 * DOM input type, of which `InputType` is the cross-platform part. `onKeyPress` hands over the
 * React keyboard event, which is a shared handler's `{ nativeEvent: { key } }` and a shadcn call
 * site's `e.key` at once.
 */
export type InputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "className" | "onKeyPress"
> &
  Omit<
    SharedInputProps,
    | "type"
    | "ref"
    | "onBlur"
    | "min"
    | "max"
    | "inputMode"
    | "value"
    | "defaultValue"
    | "onKeyPress"
    | "aria-describedby"
    | "aria-invalid"
  > & {
    type?: HTMLInputTypeAttribute | undefined;
    ref?: Ref<HTMLInputElement> | Ref<InputHandle> | undefined;
    onKeyPress?: KeyboardEventHandler<HTMLInputElement> | undefined;
  };

function Input({
  className,
  type = "text",
  onChange,
  onChangeText,
  onKeyDown,
  onKeyPress,
  onSubmitEditing,
  onEscape,
  leading,
  trailing,
  wrapperClassName,
  ref,
  ...props
}: InputProps) {
  const field = (
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
        // `keydown`, not the DOM's `keypress`: that one is deprecated and never fires for Escape,
        // the key `onKeyPress` is most often passed to hear. react-native-web makes the same swap.
        onKeyPress?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" && onSubmitEditing) {
          e.preventDefault();
          onSubmitEditing();
        } else if (e.key === "Escape" && onEscape) {
          // Held back from the browser, which would otherwise clear a `type="search"` box under
          // a caller that is putting the old value back.
          e.preventDefault();
          onEscape();
        }
      }}
      {...props}
      className={cn(
        INPUT_CLASS,
        "file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        leading != null && INPUT_LEADING_PAD_CLASS,
        trailing != null && INPUT_TRAILING_PAD_CLASS,
        className,
      )}
    />
  );

  if (leading == null && trailing == null) return field;

  return (
    <div data-slot="input-wrapper" className={cn(INPUT_WRAPPER_CLASS, wrapperClassName)}>
      {leading != null ? (
        <span data-slot="input-leading" className={cn(INPUT_LEADING_CLASS, SLOT_ICON)}>
          {leading}
        </span>
      ) : null}
      {field}
      {trailing != null ? (
        <span data-slot="input-trailing" className={cn(INPUT_TRAILING_CLASS, SLOT_ICON)}>
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

/**
 * On the web an `<svg>` takes `currentColor`, so the slot carries the ink and the icon only needs
 * its size — pinned to the child rather than set on it, so a bare `<Search />` fits. A trailing
 * button's own `hover:text-*` still wins, being on the button.
 */
const SLOT_ICON = "text-muted-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export type { InputHandle, InputKeyPressEvent, InputKeyPressHandler, InputType };
export { Input };
