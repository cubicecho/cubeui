/**
 * Copied from `registry/web/multi-select-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

import type { ComponentProps } from "react";
import {
  bindToForm,
  type FieldProps,
  splitProps,
  useFieldContext,
  useFieldError,
} from "@/components/app-form";
import { FormField } from "@/components/form-field";
import { MultiSelect, type MultiSelectOption } from "@/components/multi-select";

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

export type { MultiSelectOption };
// Local bindings rather than `export … from`: the shadcn CLI rewrites import declarations on
// install and leaves re-export declarations alone, so the `from` form would ship a path into
// `control/` that does not exist in a consumer's tree. See AGENTS.md.
export { MultiSelect };
