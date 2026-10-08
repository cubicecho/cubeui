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
import {
  SWITCH_FIELD_DESCRIPTION_CLASS,
  SWITCH_FIELD_LABEL_CLASS,
  type SwitchFieldProps,
  switchFieldIds,
} from "@/components/ui/switch-field-base";
import { cn } from "@/lib/utils";

/** A switch with its caption on one row, where pressing the caption toggles it. */
export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
  labelClassName,
}: SwitchFieldProps) {
  const { labelId, descriptionId } = switchFieldIds(id);
  const caption = cn(SWITCH_FIELD_LABEL_CLASS, disabled && "opacity-50", labelClassName);
  return (
    <Label
      htmlFor={id}
      data-slot="switch-field"
      className={cn(
        "flex flex-row gap-2",
        description ? "items-start" : "items-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        // The description sits inside the `<label>` so the whole row stays the hit target, and a
        // label names its control with everything in it. Naming the switch by the caption alone
        // keeps the description out of the name and leaves it to be the description.
        aria-labelledby={description ? labelId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      />
      {description ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span id={labelId} className={caption}>
            {label}
          </span>
          <span id={descriptionId} className={SWITCH_FIELD_DESCRIPTION_CLASS}>
            {description}
          </span>
        </span>
      ) : (
        <span className={caption}>{label}</span>
      )}
    </Label>
  );
}

export type { SwitchFieldProps };
