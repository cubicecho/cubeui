/**
 * Copied from `registry/web/date-field.tsx` by `scripts/rn2web`.
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
import {
  combineDateAndTime,
  DatePicker,
  type DateRange,
  DateRangePicker,
  setTime,
} from "@/components/date-picker";
import { FormField } from "@/components/form-field";

type WiredAway =
  | "id"
  | "value"
  | "onValueChange"
  | "aria-describedby"
  | "aria-invalid"
  | "aria-required";

type DateFieldProps = FieldProps & Omit<ComponentProps<typeof DatePicker>, WiredAway>;

function BoundDateField(props: DateFieldProps) {
  const [fieldProps, control] = splitProps(props);
  const field = useFieldContext<Date | null>();
  const error = useFieldError();

  return (
    <FormField
      {...fieldProps}
      error={error}
      control={(wired) => (
        <DatePicker
          {...control}
          {...wired}
          value={field.state.value ?? null}
          onValueChange={(next) => {
            field.handleChange(next);
            field.handleBlur();
          }}
        />
      )}
    />
  );
}

type DateRangeFieldProps = FieldProps & Omit<ComponentProps<typeof DateRangePicker>, WiredAway>;

function BoundDateRangeField(props: DateRangeFieldProps) {
  const [fieldProps, control] = splitProps(props);
  const field = useFieldContext<DateRange | null>();
  const error = useFieldError();

  return (
    <FormField
      {...fieldProps}
      error={error}
      control={(wired) => (
        <DateRangePicker
          {...control}
          {...wired}
          value={field.state.value ?? null}
          onValueChange={(next) => {
            field.handleChange(next);
            field.handleBlur();
          }}
        />
      )}
    />
  );
}

/**
 * A date, as one line, over a field that holds a `Date`.
 *
 * ```tsx
 * <DateField form={form} name="dueAt" label="Due" showTime />
 * ```
 *
 * `showTime` is the whole of the difference between this and a `DateTimeField`, which is why
 * there is no `DateTimeField`.
 */
export const DateField = bindToForm<DateFieldProps, Date>(BoundDateField, "DateField");

/**
 * A start and an end, as one line, over a field that holds a `DateRange`.
 *
 * The narrowing is the point of the split: `<DateField name="window">` over a range field, or
 * `<DateRangeField name="dueAt">` over a `Date`, are both type errors rather than a control that
 * writes the wrong shape into the store and a submit that fails at the API.
 */
export const DateRangeField = bindToForm<DateRangeFieldProps, DateRange>(
  BoundDateRangeField,
  "DateRangeField",
);

export type { DateRange };
// Local bindings rather than `export … from`: the shadcn CLI rewrites import declarations on
// install and leaves re-export declarations alone, so the `from` form would ship a path into
// `control/` that does not exist in a consumer's tree. See AGENTS.md.
export { combineDateAndTime, DatePicker, DateRangePicker, setTime };
