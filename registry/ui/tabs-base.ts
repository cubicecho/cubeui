/**
 * The contract `tabs.tsx` (native) and `tabs.web.tsx` (radix) both implement.
 * Its own module because Metro resolves `./tabs` to `tabs.web.tsx` on web.
 *
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`), as
 * radix is. The web half also takes radix's own props on top of this —
 * `orientation`, `activationMode`, `forceMount`, `dir`, DOM attributes — as
 * shadcn's `tabs` does; those extras are web only.
 */
import type { ReactNode } from "react";

export type TabsProps = {
  /** The active tab, when the caller owns it. */
  value?: string | undefined;
  /** Called with the tab the user picked. */
  onValueChange?: ((value: string) => void) | undefined;
  /** The tab active at mount, when uncontrolled. */
  defaultValue?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
};

export type TabsListProps = {
  className?: string | undefined;
  children: ReactNode;
};

export type TabsTriggerProps = {
  value: string;
  /** Not selectable, and dimmed. */
  disabled?: boolean | undefined;
  className?: string | undefined;
  /**
   * The label, and optionally an icon beside it: `<Clock /> Recent`. The icon
   * takes the tab's active or inactive colour on both halves.
   */
  children: ReactNode;
};

export type TabsContentProps = {
  value: string;
  className?: string | undefined;
  children: ReactNode;
};

export const TABS_LIST_CLASS = "h-10 items-center justify-center rounded-md bg-muted p-1";
/** A row, so an icon sits beside the label. `gap-1.5` is shadcn's own. */
export const TABS_TRIGGER_CLASS =
  "flex-row items-center justify-center gap-1.5 rounded-sm px-3 py-1.5";
export const TABS_TRIGGER_TEXT_CLASS = "text-sm font-medium";
