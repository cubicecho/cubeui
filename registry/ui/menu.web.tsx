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
import { Check } from "@/components/ui/icons";
import {
  MENU_CONTENT_CLASS,
  MENU_INDICATOR_CLASS,
  MENU_ITEM_CLASS,
  MENU_ITEM_TEXT_CLASS,
  MENU_ITEM_WEB_CLASS,
  MENU_SEPARATOR_CLASS,
  MENU_TRAILING_CLASS,
  type MenuCheckboxItemProps,
  type MenuContentProps,
  type MenuItemProps,
  type MenuProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
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
  ...props
}: Wide<MenuItemProps, Omit<React.ComponentProps<typeof MenuPrimitive.Item>, "children">>) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={destructive ? "destructive" : "default"}
      disabled={disabled}
      textValue={label}
      {...props}
      onSelect={() => onSelect?.()}
      // Icons inherit `currentColor` here, so the row's text colour is the icon's too — the web
      // half of what `IconClassContext` does on native.
      className={cn(
        MENU_ITEM_CLASS,
        MENU_ITEM_WEB_CLASS,
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

/**
 * A toggle row's inside: `MenuItem`'s icon, label and trailing node, then the ✓ slot at the far
 * edge. `ItemIndicator` renders only while its row is on; the slot around it stays.
 */
function ToggleRowBody({
  icon,
  label,
  trailing,
}: Pick<MenuCheckboxItemProps, "icon" | "label" | "trailing">) {
  return (
    <>
      {icon}
      <span className={cn(MENU_ITEM_TEXT_CLASS, "truncate")}>{label}</span>
      {typeof trailing === "string" ? (
        <span className={cn(MENU_TRAILING_CLASS, "tracking-widest")}>{trailing}</span>
      ) : (
        trailing
      )}
      <span className={cn(MENU_INDICATOR_CLASS, "flex")}>
        <MenuPrimitive.ItemIndicator>
          <Check />
        </MenuPrimitive.ItemIndicator>
      </span>
    </>
  );
}

const TOGGLE_ROW_CLASS = cn(
  MENU_ITEM_CLASS,
  MENU_ITEM_WEB_CLASS,
  "text-popover-foreground focus:bg-accent focus:text-accent-foreground",
);

function MenuCheckboxItem({
  icon,
  label,
  trailing,
  checked,
  onCheckedChange,
  disabled = false,
  onSelect,
  className,
  ...props
}: Wide<
  MenuCheckboxItemProps,
  Omit<React.ComponentProps<typeof MenuPrimitive.CheckboxItem>, "children">
>) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      disabled={disabled}
      textValue={label}
      {...props}
      checked={checked}
      onCheckedChange={(next) => onCheckedChange?.(next)}
      // Radix closes the menu on every select; a toggle list stays open between presses.
      onSelect={(event) => {
        onSelect?.(event);
        event.preventDefault();
      }}
      className={cn(TOGGLE_ROW_CLASS, className)}
    >
      <ToggleRowBody icon={icon} label={label} trailing={trailing} />
    </MenuPrimitive.CheckboxItem>
  );
}

function MenuRadioGroup({
  value,
  onValueChange,
  ...props
}: Wide<MenuRadioGroupProps, React.ComponentProps<typeof MenuPrimitive.RadioGroup>>) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="menu-radio-group"
      value={value}
      onValueChange={(next) => onValueChange?.(next)}
      {...props}
    />
  );
}

/** Choosing one closes the menu — radix's default, kept: a one-of-N choice is done once made. */
function MenuRadioItem({
  icon,
  label,
  trailing,
  disabled = false,
  className,
  ...props
}: Wide<
  MenuRadioItemProps,
  Omit<React.ComponentProps<typeof MenuPrimitive.RadioItem>, "children">
>) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      disabled={disabled}
      textValue={label}
      {...props}
      className={cn(TOGGLE_ROW_CLASS, className)}
    >
      <ToggleRowBody icon={icon} label={label} trailing={trailing} />
    </MenuPrimitive.RadioItem>
  );
}

export {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
};
