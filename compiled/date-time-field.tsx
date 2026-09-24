/**
 * Compiled from `registry/ui/date-time-field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * `DateTimeInput`, bound to a form field holding a `Date | null`.
 *
 * Its own item rather than another export of `@cubeui/form`, for the weight of what it imports: a
 * calendar and `date-fns` on device, `react-day-picker` in the compiled half. A form of plain
 * inputs installs `@cubeui/form` and pulls in none of it — the split the web `date-field` makes.
 *
 * The field is `asGroup`: the label names the trigger by `aria-labelledby`, and `DateTimeInput`
 * follows the label's id with its own value text's, so the trigger is "Due September 15th, 2026".
 * A `<label htmlFor>` would name it "Due" and drop the date — the part of the field that changes.
 *
 * ```tsx
 * <form.AppField name="dueAt">
 *   {() => <DateTimeField label="Due" mode="date" clearable />}
 * </form.AppField>
 * ```
 *
 * Or on `field.*`, with `createAppForm({ DateTimeField })`, or as one line with `bindToForm`.
 */
import { DateTimeInput } from "./date-time-input";
import { type FieldProps, FieldWrapper, splitProps, useFieldContext } from "./form";

type DateTimeFieldProps = FieldProps & {
  /** `"datetime"` (default) draws the time box beside the date; `"date"` is a day at midnight. */
  mode?: "datetime" | "date" | undefined;
  /** Draws a Clear row in the popover, which writes `null`. */
  clearable?: boolean | undefined;
  /** What the trigger reads while the value is `null`. */
  placeholder?: string | undefined;
};

export function DateTimeField(props: DateTimeFieldProps) {
  const [fieldProps, { mode, clearable = false, placeholder }] = splitProps(props);
  const field = useFieldContext<Date | null>();
  const value = field.state.value ?? null;

  function commit(next: Date | null) {
    field.handleChange(next);
    // Picking a day is the whole interaction, and it happens in a popover, so nothing blurs the
    // trigger on the way — this is what marks the field touched.
    field.handleBlur();
  }

  // `DateTimeInput` only takes `null` when it is `clearable`. An empty field that did not ask for
  // Clear still has to show its placeholder, so it goes through the clearable branch while it is
  // empty — which draws no Clear row, because there is nothing to clear.
  const control =
    clearable || value === null ? (
      <DateTimeInput
        mode={mode}
        placeholder={placeholder}
        clearable
        value={value}
        onChange={commit}
      />
    ) : (
      <DateTimeInput mode={mode} placeholder={placeholder} value={value} onChange={commit} />
    );

  return <FieldWrapper asGroup {...fieldProps} control={control} />;
}

export type { DateTimeFieldProps };
