/**
 * The native menu: the popover's centred sheet with a `role="menu"` inside it and a
 * `role="menuitem"` per row. `menu.web.tsx` is the counterpart and `menu-base.ts` the contract.
 *
 * Built on `Popover` rather than beside it, so the sheet, its backdrop and the back button are
 * the popover's and are not written twice. The menu keeps the open state itself and hands it to
 * the popover controlled, because a row has to close the sheet it sits in and the popover's own
 * context is not exported.
 *
 * What radix does on the web and this does not: arrow keys and typeahead. A touch screen has
 * neither, and the screen reader walks the rows by swipe. Focus does go back to the trigger when
 * the sheet shuts — by `focus()` under react-native-web, and on device as an accessibility focus
 * event, which is the only focus a `View` has there — unless the row chosen was
 * `focusesElsewhere`, whose target keeps it.
 */

import {
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type Ref,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";
import { IconClassContext } from "@/components/ui/icons-base";
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
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MenuState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<View | null>;
  /** Set by a `focusesElsewhere` row, read and cleared on the close edge. */
  skipReturnRef: RefObject<boolean>;
};

const MenuContext = createContext<MenuState>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  skipReturnRef: { current: false },
});

/** Put focus back on the trigger, in whichever sense of focus the platform has. */
function returnFocus(node: View | null) {
  if (!node) return;
  if (Platform.OS === "web") {
    (node as unknown as { focus?: () => void }).focus?.();
  } else {
    AccessibilityInfo.sendAccessibilityEvent(node, "focus");
  }
}

function Menu({ open, onOpenChange, defaultOpen = false, children }: MenuProps) {
  // Uncontrolled state kept unconditionally and read only when the caller passed no `open`, the
  // same arrangement as `popover.tsx`.
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const triggerRef = useRef<View | null>(null);
  const skipReturnRef = useRef(false);
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    // On the close edge only, however it closed: a row, the backdrop or the back button. A
    // `focusesElsewhere` row has already moved focus to where it belongs, so leave it there.
    if (wasOpen.current && !isOpen) {
      if (!skipReturnRef.current) returnFocus(triggerRef.current);
      skipReturnRef.current = false;
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  return (
    <MenuContext.Provider value={{ open: isOpen, setOpen, triggerRef, skipReturnRef }}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        {children}
      </Popover>
    </MenuContext.Provider>
  );
}

function MenuTrigger({ asChild, children }: MenuTriggerProps) {
  const { open, setOpen, triggerRef } = useContext(MenuContext);
  if (asChild && isValidElement(children)) {
    // The child's own ref still gets the node; the menu only needs to read it too.
    const own = (children.props as { ref?: Ref<View> }).ref;
    return cloneElement(
      children as ReactElement<{
        onPress?: () => void;
        ref?: Ref<View>;
        "aria-expanded"?: boolean;
      }>,
      {
        onPress: () => setOpen(true),
        "aria-expanded": open,
        ref: (node: View | null) => {
          triggerRef.current = node;
          if (typeof own === "function") own(node);
          else if (own) own.current = node;
        },
      },
    );
  }
  return (
    // The `role` is hand-written because a `<button>` has no native counterpart.
    <Pressable role="button" aria-expanded={open} ref={triggerRef} onPress={() => setOpen(true)}>
      {children}
    </Pressable>
  );
}

function MenuContent({ className, "aria-label": ariaLabel, children }: MenuContentProps) {
  return (
    <PopoverContent className={cn(MENU_CONTENT_CLASS, "w-64", className)}>
      <View role="menu" aria-label={ariaLabel}>
        {children}
      </View>
    </PopoverContent>
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
}: MenuItemProps) {
  const { setOpen, skipReturnRef } = useContext(MenuContext);
  const ink = destructive ? "text-destructive" : "text-popover-foreground";
  return (
    <Pressable
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled}
      onPress={() => {
        skipReturnRef.current = focusesElsewhere;
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        MENU_ITEM_CLASS,
        destructive ? "active:bg-destructive/10" : "active:bg-accent",
        disabled && "opacity-50",
        className,
      )}
    >
      {/* Colour does not inherit on native, so the row's ink reaches the icon through the
          context and the label through its own class. */}
      <IconClassContext.Provider value={cn("size-4 shrink-0", ink)}>
        {icon}
        <Text numberOfLines={1} className={cn(MENU_ITEM_TEXT_CLASS, ink)}>
          {label}
        </Text>
        {typeof trailing === "string" ? (
          <Text className={MENU_TRAILING_CLASS}>{trailing}</Text>
        ) : (
          trailing
        )}
      </IconClassContext.Provider>
    </Pressable>
  );
}

function MenuSeparator({ className }: MenuSeparatorProps) {
  return <View role="separator" className={cn(MENU_SEPARATOR_CLASS, className)} />;
}

export { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger };
