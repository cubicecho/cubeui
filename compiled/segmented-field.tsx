/**
 * Compiled from `registry/ui/segmented-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A `SegmentedGroup`, bound to a form field holding one of a few strings.
 *
 * For the choice that is two to five short words and belongs on the page: a channel, a sentiment,
 * a priority. More than fit on a line is a `SelectField`; choices that each need a sentence of
 * their own are a `RadioGroupField`.
 *
 * The field is `asGroup`: the pills' row is a `group`, which a `<label>` cannot name, so it points
 * back at the label by `aria-labelledby`. The pills come from `options` and not from children,
 * because the field is what knows which one is current.
 *
 * ```tsx
 * <form.AppField name="channel">
 *   {() => <SegmentedField label="Channel" options={CHANNELS} />}
 * </form.AppField>
 * ```
 *
 * Or on `field.*`, with `createAppForm({ SegmentedField })`.
 */
import type { ComponentProps } from "react";
import type { SlotNode } from "@/lib/utils";
import { type FieldProps, FieldWrapper, splitProps, useFieldContext } from "./form";
import { SegmentedButton, SegmentedGroup } from "./segmented";

/** One pill. `iconSlot` is drawn before the label, and alone under `labelHideBelow`. */
type SegmentedOption = {
  value: string;
  label: string;
  iconSlot?: SlotNode | undefined;
  disabled?: boolean | undefined;
};

type SegmentedFieldProps = FieldProps &
  Pick<ComponentProps<typeof SegmentedGroup>, "variant" | "labelHideBelow"> & {
    options: readonly SegmentedOption[];
    /** Every pill is drawn and none can be pressed. */
    disabled?: boolean | undefined;
  };

/** The row, as one element for `FieldControl` to hand the `id` and the `aria-*` props to. */
function SegmentedFieldControl({
  options,
  disabled = false,
  ...group
}: Omit<SegmentedFieldProps, keyof FieldProps>) {
  const field = useFieldContext<string | null>();
  return (
    <SegmentedGroup
      {...group}
      value={field.state.value ?? ""}
      onValueChange={(next) => {
        field.handleChange(next);
        // Pressing a pill is the whole interaction, so it is also what marks the field touched.
        field.handleBlur();
      }}
    >
      {options.map((option) => (
        <SegmentedButton
          key={option.value}
          value={option.value}
          iconSlot={option.iconSlot}
          disabled={disabled || option.disabled}
        >
          {option.label}
        </SegmentedButton>
      ))}
    </SegmentedGroup>
  );
}

export function SegmentedField(props: SegmentedFieldProps) {
  const [fieldProps, control] = splitProps(props);
  return (
    <FieldWrapper asGroup {...fieldProps} controlSlot={<SegmentedFieldControl {...control} />} />
  );
}

export type { SegmentedFieldProps, SegmentedOption };
