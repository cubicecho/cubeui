/**
 * The native select: a trigger that opens the options in a `Modal` sheet.
 *
 * A listbox that drops open under its trigger is a pointer affordance; every
 * native platform shows the choices as a sheet instead, so that is what this
 * renders rather than trying to reproduce radix's anchored popper.
 *
 * `SelectContent` owns the `Modal`, which is why `Select` may hold both a
 * trigger and a content child in any order — the open state lives in the
 * context above them.
 */

import { createContext, useContext, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown } from "@/components/ui/icons";
import {
  SELECT_ITEM_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_LABEL_CLASS,
  SELECT_SEPARATOR_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_TEXT_CLASS,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectProps,
  type SelectSeparatorProps,
  type SelectTriggerProps,
  type SelectValueProps,
} from "@/components/ui/select-base";
import { cn } from "@/lib/utils";

type SelectState = {
  disabled: boolean;
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = createContext<SelectState>({
  value: "",
  onValueChange: () => {},
  disabled: false,
  open: false,
  setOpen: () => {},
});

function Select({
  value,
  onValueChange,
  disabled = false,
  open: openProp,
  onOpenChange,
  children,
}: SelectProps) {
  // Controlled when `open` is passed and self-driving otherwise, with `onOpenChange` reported
  // either way. The internal state is kept even while controlled rather than branched away,
  // because the branch would be two code paths through the same sheet for no gain.
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  return (
    <SelectContext.Provider
      value={{ value, onValueChange, disabled, open, setOpen: disabled ? () => {} : setOpen }}
    >
      {children}
    </SelectContext.Provider>
  );
}

function SelectTrigger({ className, onBlur, disabled, children, ...aria }: SelectTriggerProps) {
  const select = useContext(SelectContext);
  const isDisabled = disabled ?? select.disabled;
  return (
    <Pressable
      // The `role` is hand-written because a `<button>` has no native counterpart.
      role="button"
      disabled={isDisabled}
      {...aria}
      onPress={() => {
        select.setOpen(true);
        // A native sheet takes focus away from the trigger the way a blur
        // would on web, and a form depends on that to mark the field touched.
        onBlur?.();
      }}
      className={cn(SELECT_TRIGGER_CLASS, isDisabled && "opacity-50", className)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Pressable>
  );
}

/**
 * Renders whatever the caller passed, or the placeholder when nothing is
 * selected. Bare strings are wrapped for the caller — an unwrapped string
 * inside a `View` throws on native and renders fine on web, which is exactly
 * the kind of divergence a shared primitive should absorb.
 */
function SelectValue({ placeholder, children }: SelectValueProps) {
  const { value } = useContext(SelectContext);
  const content = value && children ? children : placeholder;
  return typeof content === "string" ? (
    <Text className={SELECT_TRIGGER_TEXT_CLASS}>{content}</Text>
  ) : (
    content
  );
}

function SelectContent({ className, children }: SelectContentProps) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        {/* Sibling, not parent: `Pressable` has no `stopPropagation`. */}
        <Pressable
          className="absolute inset-0"
          onPress={() => setOpen(false)}
          role="button"
          aria-label="Close"
        />
        <View
          className={cn(
            "max-h-96 w-full max-w-sm rounded-md border border-border bg-popover p-1",
            className,
          )}
        >
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SelectItem({ value, className, children }: SelectItemProps) {
  const select = useContext(SelectContext);
  const selected = select.value === value;
  return (
    <Pressable
      role="menuitem"
      onPress={() => {
        select.onValueChange(value);
        select.setOpen(false);
      }}
      className={cn(SELECT_ITEM_CLASS, selected && "bg-accent", className)}
    >
      {selected ? (
        <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </View>
      ) : null}
      {typeof children === "string" ? (
        <Text className={SELECT_ITEM_TEXT_CLASS}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/**
 * A heading and the items under it. Radix builds a real `aria-labelledby` between
 * `SelectPrimitive.Group` and its `Label`; there is no equivalent on native, so the
 * grouping is a `role="group"` container and the label is read as its first child.
 */
function SelectGroup({ children }: SelectGroupProps) {
  return <View role="group">{children}</View>;
}

function SelectLabel({ className, children }: SelectLabelProps) {
  return <Text className={cn(SELECT_LABEL_CLASS, className)}>{children}</Text>;
}

function SelectSeparator({ className }: SelectSeparatorProps) {
  return <View role="separator" className={cn(SELECT_SEPARATOR_CLASS, className)} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
