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
 * close, and the menu closing when a row is chosen. None of that is layout, so none of it could
 * come out of the React Native source.
 *
 * Each part also takes the props of the radix part it renders — `side`, `sideOffset`, `modal`,
 * `onCloseAutoFocus` — on top of the contract. Those extras are web only.
 */

import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cloneElement } from "react";
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

function Menu({
  open,
  onOpenChange,
  defaultOpen,
  ...props
}: Wide<MenuProps, React.ComponentProps<typeof MenuPrimitive.Root>>) {
  // Spread rather than passed: radix switches to uncontrolled only when `open` is absent, and an
  // explicit `undefined` is not absent.
  return (
    <MenuPrimitive.Root
      data-slot="menu"
      {...props}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
    />
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
  ...props
}: Wide<MenuContentProps, React.ComponentProps<typeof MenuPrimitive.Content>>) {
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
  className,
  href,
  link,
  ...props
}: Wide<MenuItemProps, Omit<React.ComponentProps<typeof MenuPrimitive.Item>, "children">>) {
  const row = (
    <>
      {icon}
      <span className={cn(MENU_ITEM_TEXT_CLASS, "truncate")}>{label}</span>
      {typeof trailing === "string" ? (
        <span className={cn(MENU_TRAILING_CLASS, "tracking-widest")}>{trailing}</span>
      ) : (
        trailing
      )}
    </>
  );
  // A link row is radix's item rendered *as* the anchor, not an anchor inside the item: the `<a>`
  // takes `role="menuitem"`, the roving focus and the keys, and the router's link keeps its own
  // hover and focus handlers. The nesting is not `<Link asChild>` because radix composes its
  // select after the item's own `onClick` and skips it once that has called `preventDefault` —
  // which every router's click does — so a menu handed the router's click would never close.
  // Cloned the other way, the router link is handed radix's click and runs it first. A disabled
  // row is no link at all, so nothing can follow it.
  const anchor = disabled ? undefined : link ? (
    cloneElement(link, undefined, row)
  ) : href !== undefined ? (
    <a href={href}>{row}</a>
  ) : undefined;
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={destructive ? "destructive" : "default"}
      disabled={disabled}
      textValue={label}
      {...props}
      asChild={anchor !== undefined}
      onSelect={() => onSelect?.()}
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
      {anchor ?? row}
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
