/**
 * Compiled from `registry/ui/multi-select-form-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * `MultiSelect`, bound to a form field holding a list of strings.
 *
 * Its own item rather than another export of `@cubeui/form`, so a form of plain inputs does not
 * pull in the popover and the command list — the split the web `multi-select-field` makes. Named
 * `multi-select-form-field` because `multi-select-field` is that web-only item, and one name
 * cannot be two items on the web.
 *
 * The field is `asGroup`: a device has no `htmlFor`, so the trigger points back at the label by
 * `aria-labelledby`. The wiring lands on the trigger and not on the `Popover` root, because
 * `MultiSelect` takes the `id` and the `aria-*` props itself and puts them there.
 *
 * ```tsx
 * <form.AppField name="labelIds">
 *   {() => <MultiSelectField label="Labels" options={labels} />}
 * </form.AppField>
 * ```
 *
 * Or on `field.*`, with `createAppForm({ MultiSelectField })`.
 */
import type { ComponentProps } from "react";
import { type FieldProps, FieldWrapper, splitProps, useFieldContext } from "./form";
import { MultiSelect, type MultiSelectOption } from "./multi-select";

type MultiSelectFieldProps = FieldProps &
  Omit<
    ComponentProps<typeof MultiSelect>,
    | "id"
    | "value"
    | "onValueChange"
    | "className"
    | "aria-describedby"
    | "aria-invalid"
    | "aria-required"
  >;

/** The control, as one element for `FieldControl` to hand the `id` and the `aria-*` props to. */
function MultiSelectFieldControl(control: Omit<MultiSelectFieldProps, keyof FieldProps>) {
  const field = useFieldContext<readonly string[] | null>();
  return (
    <MultiSelect
      {...control}
      value={field.state.value ?? []}
      onValueChange={(next) => {
        field.handleChange(next);
        // A popover control has no blur that means "done with this field": focus goes into the
        // sheet and comes back. Choosing is the interaction, so choosing marks it touched.
        field.handleBlur();
      }}
    />
  );
}

/** A `MultiSelect` bound to a form field holding a list of values. */
export function MultiSelectField(props: MultiSelectFieldProps) {
  const [fieldProps, control] = splitProps(props);
  return (
    <FieldWrapper asGroup {...fieldProps} controlSlot={<MultiSelectFieldControl {...control} />} />
  );
}

export type { MultiSelectFieldProps, MultiSelectOption };
