/**
 * The web switch field: one `<label htmlFor>` wrapping the switch and its caption, so the whole row
 * is the switch's hit target and the switch is the row's only tab stop. `switch-field.tsx` is the
 * native counterpart and `switch-field-base.ts` holds the contract they share.
 *
 * It used to be compiled from the native source, whose caption is a `Pressable` that toggles the
 * switch by hand. That compiled to a `<button>` around the `<label htmlFor>`, and a click on the
 * caption then toggled twice — the button's handler, then the label's activation clicking the
 * switch — and so did nothing. It also put a second, role-less tab stop after the switch, and a
 * label inside a button is not valid HTML. The label alone is the whole mechanism here: a click on
 * the switch itself is a click on interactive content, which a label does not re-activate.
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SWITCH_FIELD_LABEL_CLASS, type SwitchFieldProps } from "@/components/ui/switch-field-base";
import { cn } from "@/lib/utils";

export function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
  className,
  labelClassName,
}: SwitchFieldProps) {
  return (
    <Label
      htmlFor={id}
      data-slot="switch-field"
      className={cn("flex cursor-pointer flex-row items-center gap-2", className)}
    >
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <span className={cn(SWITCH_FIELD_LABEL_CLASS, labelClassName)}>{label}</span>
    </Label>
  );
}

export type { SwitchFieldProps };
