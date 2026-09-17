/**
 * A checkbox built from a `Pressable`, not radix's. Radix would buy a
 * `.web.tsx` pair for a box with a tick in it; the role and `aria-checked`
 * below are the part that actually matters, and they cost nothing.
 *
 * `role="checkbox"` plus `aria-checked` is what makes it a real checkbox to a
 * screen reader on both platforms; without the role react-native-web renders a
 * plain `<div>`.
 */

import { Pressable } from "react-native";
import { Check } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Required: the box carries no visible label of its own. */
  accessibilityLabel: string;
  className?: string | undefined;
};

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  accessibilityLabel,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      // (No `useSemanticElements` suppression needed: `<input type="checkbox">` has no native
      // counterpart, and the rule does not reach a `Pressable` anyway.)
      role="checkbox"
      aria-checked={checked}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        "h-4 w-4 items-center justify-center rounded border",
        checked ? "border-primary bg-primary" : "border-input bg-background",
        disabled && "opacity-50",
        className,
      )}
    >
      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
    </Pressable>
  );
}
