/**
 * Compiled from `registry/ui/checkbox.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { cn } from "@/lib/utils";
import { Check } from "./icons";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean | undefined;
  /**
   * Fired when the control loses focus. A bound field marks itself touched from
   * this, which is what decides whether an error is shown yet — so a checkbox
   * without one is a required field that never reports itself as unfilled.
   */
  onBlur?: (() => void) | undefined;
  /** Required: the box carries no visible label of its own. */
  "aria-label": string;
  className?: string | undefined;
};

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  onBlur,
  "aria-label": accessibilityLabel,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      // (No `useSemanticElements` suppression needed: `<input type="checkbox">` has no native
      // counterpart, and the rule does not reach a `Pressable` anyway.)
      role="checkbox"
      aria-checked={checked}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      onBlur={onBlur}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "h-4 w-4 items-center justify-center rounded border",
        checked ? "border-primary bg-primary" : "border-input bg-background",
        disabled && "opacity-50",
        className,
      )}
    >
      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
    </button>
  );
}
