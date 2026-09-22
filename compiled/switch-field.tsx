/**
 * Compiled from `registry/ui/switch-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Switch } from "./switch";

type SwitchFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string | undefined;
  labelClassName?: string | undefined;
};

export function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
  className,
  labelClassName,
}: SwitchFieldProps) {
  return (
    <div className={cn("cube-rn-view", "flex-row items-center gap-2", className)}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className="cube-rn-view cube-rn-pressable"
      >
        <Label htmlFor={id} className={cn("text-sm text-muted-foreground", labelClassName)}>
          {label}
        </Label>
      </button>
    </div>
  );
}
