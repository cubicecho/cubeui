/**
 * The contract `select.tsx` (native) and `select.web.tsx` (radix) both
 * implement. Its own module because Metro resolves `./select` to
 * `select.web.tsx` on web.
 *
 * Narrower than radix's surface. `Group`, `Label`, `Separator` and the two
 * scroll buttons are left out: each would need a native implementation written
 * only so the two halves export the same names, and a sheet has nothing to
 * scroll-button against. Add one when something needs it, on both sides.
 */
import type { ReactNode } from "react";

export type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
};

export type SelectTriggerProps = {
  className?: string | undefined;
  onBlur?: (() => void) | undefined;
  children: ReactNode;
};

export type SelectValueProps = {
  placeholder?: string | undefined;
  children?: ReactNode;
};

export type SelectContentProps = {
  className?: string | undefined;
  children: ReactNode;
};

export type SelectItemProps = {
  value: string;
  className?: string | undefined;
  children: ReactNode;
};

export const SELECT_TRIGGER_CLASS =
  "border-input bg-background h-10 w-full flex-row items-center justify-between rounded-md border px-3 py-2";
export const SELECT_TRIGGER_TEXT_CLASS = "text-foreground text-sm";
export const SELECT_ITEM_CLASS = "w-full flex-row items-center rounded-sm py-1.5 pl-8 pr-2";
export const SELECT_ITEM_TEXT_CLASS = "text-sm text-popover-foreground";
