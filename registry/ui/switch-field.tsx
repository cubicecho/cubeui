/**
 * A switch with its caption on one row. `switch-field.web.tsx` is the DOM half and
 * `switch-field-base.ts` holds the contract they share.
 *
 * There is no label/control association off web, so here the caption is a `Pressable` that
 * toggles the switch explicitly — one row, one target. The web half cannot do the same: a
 * `Pressable` there is a `<button>`, and a `<button>` around a `<label htmlFor>` toggles the switch
 * twice per click (once for the button, once for the label's activation) and adds a tab stop with
 * no role. So the web half is a `<label htmlFor>` wrapping the row instead, which is the hit target
 * the browser already gives a labelled control.
 */
import { Pressable, View } from "react-native";
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
    <View className={cn("flex-row items-center gap-2", className)}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Pressable onPress={() => onCheckedChange(!checked)}>
        <Label htmlFor={id} className={cn(SWITCH_FIELD_LABEL_CLASS, labelClassName)}>
          {label}
        </Label>
      </Pressable>
    </View>
  );
}

export type { SwitchFieldProps };
