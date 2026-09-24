/**
 * Copied from `registry/ui/menu.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web menu: radix `DropdownMenu`, anchored to its trigger. `menu.tsx` is the native
 * counterpart and `menu-base.ts` holds the contract they share.
 *
 * Radix is the reason this half is hand-written rather than compiled: `role="menu"` with the
 * trigger as its name, arrow keys and Home/End between the rows (skipping disabled ones),
 * typeahead on each row's label, focus moved into the menu on open and back to the trigger on
 * close (unless the row chosen is `focusesElsewhere`), and the menu closing when a row is
 * chosen. None of that is layout, so none of it could come out of the React Native source.
 *
 * Each part also takes the props of the radix part it renders — `side`, `sideOffset`, `modal`,
 * `onCloseAutoFocus` — on top of the contract. Those extras are web only.
 */

import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type * as React from "react";
import { createContext, type RefObject, useContext, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  MENU_CONTENT_CLASS,
  MENU_ITEM_CLASS,
  MENU_ITEM_TEXT_CLASS,
  MENU_SEPARATOR_CLASS,
  MENU_TRAILING_CLASS,
  type MenuContentProps,
  type MenuItemProps,
  type MenuProps,
  type MenuSeparatorProps,
  type MenuTriggerProps,
} from "@/components/ui/menu-base";
import { cn } from "@/lib/utils";

/** The shared contract, widened to what the radix part underneath accepts. */
type Wide<Base, Radix> = Base & Omit<Radix, keyof Base>;

type MenuState = {
  setOpen: (open: boolean) => void;
  /**
   * Whether the close in progress was caused by a `focusesElsewhere` row. A ref rather than state:
   * it is written when the row is chosen and read in `onCloseAutoFocus` after the close animation,
   * and nothing renders from it.
   */
  skipReturnRef: RefObject<boolean>;
};

const MenuContext = createContext<MenuState>({
  setOpen: () => {},
  skipReturnRef: { current: false },
});

function Menu({
  open,
  onOpenChange,
  defaultOpen = false,
  ...props
}: Wide<MenuProps, React.ComponentProps<typeof MenuPrimitive.Root>>) {
  // The menu holds the open state rather than leaving it to radix, the same arrangement as
  // `menu.tsx`, because a `focusesElsewhere` row has to close the menu itself before its action
  // runs — see `MenuItem`.
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };
  const skipReturnRef = useRef(false);
  return (
    <MenuContext.Provider value={{ setOpen, skipReturnRef }}>
      <MenuPrimitive.Root data-slot="menu" {...props} open={isOpen} onOpenChange={setOpen} />
    </MenuContext.Provider>
  );
}

function MenuTrigger({
  asChild,
  ...props
}: Wide<MenuTriggerProps, React.ComponentProps<typeof MenuPrimitive.Trigger>>) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" asChild={asChild ?? false} {...props} />;
}

function MenuContent({
  className,
  align = "center",
  sideOffset = 4,
  onCloseAutoFocus,
  ...props
}: Wide<MenuContentProps, React.ComponentProps<typeof MenuPrimitive.Content>>) {
  const { skipReturnRef } = useContext(MenuContext);
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="menu-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          MENU_CONTENT_CLASS,
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          // Radix focuses the trigger unless the event is prevented. A `focusesElsewhere` row
          // has already focused its target by now, and the trigger would take it back.
          if (skipReturnRef.current) event.preventDefault();
          skipReturnRef.current = false;
        }}
      />
    </MenuPrimitive.Portal>
  );
}

function MenuItem({
  icon,
  label,
  trailing,
  destructive = false,
  disabled = false,
  onSelect,
  focusesElsewhere = false,
  className,
  ...props
}: Wide<MenuItemProps, Omit<React.ComponentProps<typeof MenuPrimitive.Item>, "children">>) {
  const { setOpen, skipReturnRef } = useContext(MenuContext);
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={destructive ? "destructive" : "default"}
      disabled={disabled}
      textValue={label}
      {...props}
      onSelect={(event) => {
        skipReturnRef.current = focusesElsewhere;
        if (focusesElsewhere) {
          // Radix runs this while the menu is still open and trapping focus, so an `autoFocus`
          // the action mounts is pulled straight back into the menu. Close it first — flushed,
          // so the trap is released — and only then hand focus away.
          event.preventDefault();
          flushSync(() => setOpen(false));
        }
        onSelect?.();
      }}
      // Icons inherit `currentColor` here, so the row's text colour is the icon's too — the web
      // half of what `IconClassContext` does on native.
      className={cn(
        MENU_ITEM_CLASS,
        "relative flex cursor-default select-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        destructive
          ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
          : "text-popover-foreground focus:bg-accent focus:text-accent-foreground",
        className,
      )}
    >
      {icon}
      <span className={cn(MENU_ITEM_TEXT_CLASS, "truncate")}>{label}</span>
      {typeof trailing === "string" ? (
        <span className={cn(MENU_TRAILING_CLASS, "tracking-widest")}>{trailing}</span>
      ) : (
        trailing
      )}
    </MenuPrimitive.Item>
  );
}

function MenuSeparator({
  className,
  ...props
}: Wide<MenuSeparatorProps, React.ComponentProps<typeof MenuPrimitive.Separator>>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn(MENU_SEPARATOR_CLASS, "pointer-events-none", className)}
      {...props}
    />
  );
}

export { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger };
