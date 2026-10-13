/**
 * Compiled from `registry/ui/option-select-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

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
import { type ComponentProps, useMemo } from "react";
import {
  menuValueOf,
  type SelectEntry,
  type SelectNoteEntry,
  type SelectOption,
  type SelectSeparatorEntry,
  storedValueOf,
  withEmptyOption,
} from "@/lib/select-options";
import { type FieldProps, FieldWrapper, splitProps, useFieldContext } from "./form";
import { OptionSelect } from "./option-select";

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
    /**
     * Adds a first row for "nothing", which writes `null`. The field then holds `string | null`,
     * and reads `null`, `undefined` and `""` as that row.
     */
    clearable?: boolean | undefined;
    /**
     * What the row for "nothing" says. Read only when `clearable`.
     *
     * @defaultValue `"None"`
     */
    emptyLabel?: string | undefined;
  };

/** The control, as one element for `FieldControl` to hand the `id` and the `aria-*` props to. */
function OptionSelectFieldControl({
  triggerClassName,
  options,
  clearable = false,
  emptyLabel = "None",
  ...control
}: Omit<OptionSelectFieldProps, keyof FieldProps>) {
  const field = useFieldContext<string | null>();
  const entries = useMemo(
    () => (clearable ? withEmptyOption(options, emptyLabel) : options),
    [options, clearable, emptyLabel],
  );
  return (
    <OptionSelect
      {...control}
      options={entries}
      className={triggerClassName}
      value={clearable ? menuValueOf(field.state.value) : (field.state.value ?? "")}
      onValueChange={(next) => {
        field.handleChange(clearable ? storedValueOf(next) : next);
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
