/**
 * `OptionSelect`, bound to a form field holding one of the options' values.
 *
 * For the choice `SelectField` cannot draw: a list long enough to need `searchable`, one that
 * fills when it opens (`onOpenChange`), or one with a note in it. Its own item rather than more
 * props on `SelectField`, so a form of plain inputs does not pull in the popover and the command
 * list. That is the split `multi-select-form-field` makes.
 *
 * The field is `asGroup`: the search menu's trigger is a pressable and not a form control, which
 * a label's `htmlFor` cannot name on device, so it points back at the label by `aria-labelledby`.
 *
 * ```tsx
 * <form.AppField name="model">
 *   {() => <OptionSelectField label="Model" options={models} searchable />}
 * </form.AppField>
 * ```
 *
 * Or on `field.*`, with `createAppForm({ OptionSelectField })`.
 */
import type { ComponentProps } from "react";
import { OptionSelect } from "@/components/option-select";
import { type FieldProps, FieldWrapper, splitProps, useFieldContext } from "@/components/ui/form";
import type {
  SelectEntry,
  SelectNoteEntry,
  SelectOption,
  SelectSeparatorEntry,
} from "@/lib/select-options";

type OptionSelectFieldProps = FieldProps &
  Omit<
    ComponentProps<typeof OptionSelect>,
    | "id"
    | "value"
    | "onValueChange"
    | "onBlur"
    | "className"
    | "aria-describedby"
    | "aria-invalid"
    | "aria-required"
  > & {
    /** The trigger's class. `className` is the field's, as on every bound field. */
    triggerClassName?: string | undefined;
  };

/** The control, as one element for `FieldControl` to hand the `id` and the `aria-*` props to. */
function OptionSelectFieldControl({
  triggerClassName,
  ...control
}: Omit<OptionSelectFieldProps, keyof FieldProps>) {
  const field = useFieldContext<string | null>();
  return (
    <OptionSelect
      {...control}
      className={triggerClassName}
      value={field.state.value ?? ""}
      onValueChange={(next) => {
        field.handleChange(next);
        // A popover control has no blur that means "done with this field": focus goes into the
        // menu and comes back. Choosing is the interaction, so choosing marks it touched.
        field.handleBlur();
      }}
    />
  );
}

/** An `OptionSelect` bound to a form field holding one of the options' values. */
export function OptionSelectField(props: OptionSelectFieldProps) {
  const [fieldProps, control] = splitProps(props);
  return (
    <FieldWrapper asGroup {...fieldProps} controlSlot={<OptionSelectFieldControl {...control} />} />
  );
}

export type {
  OptionSelectFieldProps,
  SelectEntry,
  SelectNoteEntry,
  SelectOption,
  SelectSeparatorEntry,
};
