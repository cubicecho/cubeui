import type { ComponentProps } from "react";
import {
  DatePicker,
  type DateRange,
  DateRangePicker,
} from "@/registry/new-york/control/date-picker";
import {
  bindToForm,
  type FieldProps,
  splitProps,
  useFieldContext,
  useFieldError,
} from "@/registry/new-york/form/app-form";
import { FormField } from "@/registry/new-york/form/form-field";

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

export type { DateRange } from "@/registry/new-york/control/date-picker";
export {
  combineDateAndTime,
  DatePicker,
  DateRangePicker,
  setTime,
} from "@/registry/new-york/control/date-picker";
