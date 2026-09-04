import type { ComponentProps } from "react";
import { MultiSelect } from "@/registry/new-york/control/multi-select";
import {
  bindToForm,
  type FieldProps,
  splitProps,
  useFieldContext,
  useFieldError,
} from "@/registry/new-york/form/app-form";
import { FormField } from "@/registry/new-york/form/form-field";

type MultiSelectFieldProps = FieldProps &
  Omit<
    ComponentProps<typeof MultiSelect>,
    "id" | "value" | "onValueChange" | "aria-describedby" | "aria-invalid" | "aria-required"
  >;

function BoundMultiSelectField(props: MultiSelectFieldProps) {
  const [fieldProps, control] = splitProps(props);
  const field = useFieldContext<string[] | null>();
  const error = useFieldError();

  return (
    <FormField
      {...fieldProps}
      error={error}
      // The function form, because `MultiSelect`'s root renders a `Popover` and the id has to
      // land on the trigger — the same reason `SelectField` uses it.
      control={(wired) => (
        <MultiSelect
          {...control}
          {...wired}
          value={field.state.value ?? []}
          onValueChange={(next) => {
            field.handleChange(next);
            // A popover control has no blur that means "done with this field": focus goes into
            // the portal and comes back. Choosing is the interaction, so choosing marks it
            // touched — otherwise a required-and-empty message can never appear before submit.
            field.handleBlur();
          }}
        />
      )}
    />
  );
}

/**
 * A multi-select, as one line, over a field that holds a list of strings.
 *
 * ```tsx
 * <MultiSelectField form={form} name="tags" label="Tags" options={tags} onCreateOption={create} />
 * ```
 *
 * Its own file rather than another export from `app-form` so that a form of plain inputs does not
 * pull in cmdk. See {@link MultiSelect} for what the control fixes.
 */
export const MultiSelectField = bindToForm<MultiSelectFieldProps, readonly string[]>(
  BoundMultiSelectField,
  "MultiSelectField",
);

export type { MultiSelectOption } from "@/registry/new-york/control/multi-select";
export { MultiSelect } from "@/registry/new-york/control/multi-select";
