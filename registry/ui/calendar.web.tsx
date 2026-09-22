/**
 * The web calendar: react-day-picker, using the library's own stylesheet so we
 * do not have to track its evolving `classNames` API across versions.
 * `calendar.tsx` is the native counterpart; `calendar-base.ts` holds the
 * contract they share.
 *
 * The contract's `DateMatcher` and `DateRange` are structurally react-day-picker's
 * own, which is why the two `mode` branches pass straight through — the types are
 * declared in `calendar-base.ts` rather than imported so the native half can share
 * them, not because they differ.
 *
 * It also takes the rest of react-day-picker's props — `captionLayout`,
 * `showOutsideDays`, `classNames`, `components`, `formatters`, `locale` — as
 * shadcn's `calendar` does, and hands them to `DayPicker` unchanged. Those
 * extras are web only.
 */
import { DayPicker, type PropsBase } from "react-day-picker";
import type { CalendarProps } from "@/components/ui/calendar-base";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

/** What `DayPicker` takes beyond the shared contract, passed through as it is. */
type DayPickerExtras = Omit<
  PropsBase,
  | "disabled"
  | "defaultMonth"
  | "numberOfMonths"
  | "startMonth"
  | "weekStartsOn"
  | "className"
  | "mode"
  | "selected"
  | "onSelect"
  | "required"
>;

export function Calendar(props: CalendarProps & DayPickerExtras) {
  const {
    mode: _mode,
    selected: _selected,
    onSelect: _onSelect,
    disabled,
    defaultMonth,
    numberOfMonths,
    startMonth,
    weekStartsOn,
    className,
    ...extras
  } = props;

  // Spread rather than passed: under `exactOptionalPropertyTypes` an explicit
  // `undefined` is not the same as an absent prop, and react-day-picker reads
  // several of these as "the caller set this".
  const shared = {
    ...extras,
    ...(disabled === undefined ? {} : { disabled }),
    ...(defaultMonth === undefined ? {} : { defaultMonth }),
    ...(numberOfMonths === undefined ? {} : { numberOfMonths }),
    ...(startMonth === undefined ? {} : { startMonth }),
    ...(weekStartsOn === undefined ? {} : { weekStartsOn }),
    className: cn("p-3", className),
  };

  if (props.mode === "range") {
    return (
      <DayPicker
        mode="range"
        {...shared}
        {...(props.selected === undefined ? {} : { selected: props.selected })}
        onSelect={props.onSelect}
      />
    );
  }

  return (
    <DayPicker
      mode="single"
      {...shared}
      {...(props.selected === undefined ? {} : { selected: props.selected })}
      onSelect={props.onSelect}
    />
  );
}
