/**
 * Compiled from `registry/ui/date-picker.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A date, optionally a time, or a range, behind a popover — on both platforms.
 *
 * Written once in React Native and compiled for the web, where it used to be a hand-written DOM
 * file. Every piece it draws is already a cross-platform primitive: the trigger is `Button`, the
 * pane is `Popover` (a dropdown anchored to the trigger on the web, a centred sheet on device),
 * the grid is `Calendar` (react-day-picker on the web, a date-fns grid on device, both taking
 * `mode="range"`) and the time box is `Input type="time"`. So the web half is the one it always
 * was, down to `.rdp-root`, and the device gets the same props.
 *
 * Its own item beside `DateTimeInput` rather than a mode of it, because the two draw a different
 * field: this one is a full-width trigger that owns its time box inside the pane and stays open
 * while a time is still to come, and `DateTimeInput` puts the time beside the trigger and commits
 * a `Date` it never hands back as `null` unless asked. Folding one into the other is a follow-up
 * with a visible change on one side; porting this was not the place for it.
 */
import { format as formatDateFns } from "date-fns";
import type { AriaAttributes, ComponentProps, ReactNode } from "react";
import { useRef, useState } from "react";
// `DateRange` comes from the registry's own calendar contract, not react-day-picker: the native
// `Calendar` implements the same shape and cannot import from a web library.
import type { DateRange } from "@/components/ui/calendar-base";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Calendar as CalendarIcon, X } from "./icons";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type { DateRange };

/**
 * A `Date` with the day taken from one and the clock from another.
 *
 * Picking a day must not move the time, and setting a time must not move the day — which sounds
 * obvious and is exactly what a `new Date(picked)` loses, because the calendar hands back
 * midnight. Both of these copy rather than mutate: a `Date` from props is somebody else's state,
 * and `setHours` on it is a change nothing re-renders for.
 */
export function combineDateAndTime(day: Date, timeSource: Date): Date {
  const combined = new Date(day);
  combined.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds(),
  );
  return combined;
}

/** The same, from an `<input type="time">` value — `"14:30"`, or `"14:30:05"`. */
export function setTime(day: Date, time: string): Date {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const combined = new Date(day);
  combined.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);
  return combined;
}

function timeValue(date: Date): string {
  return formatDateFns(date, "HH:mm");
}

/**
 * The trigger every picker here draws: a full-width outline button that reads left, with the
 * value and the icon at either end.
 *
 * Three call sites had this as a copied `w-[250px] justify-between bg-input-background pl-2 pr-3
 * text-left font-normal`, and a fourth had it in React Native. The fixed `250px` is dropped —
 * width belongs to the layout the field is in, and `FormField` already gives it one.
 */
const TRIGGER = "w-full justify-between px-3 text-left font-normal";

/**
 * The value's one line. `truncate` is the ellipsis on the web; on device it is `numberOfLines`,
 * which is what `line-clamp-1` becomes and what `truncate` does not.
 */
const ONE_LINE = "truncate";

/**
 * What a field shell needs to reach through the picker onto the trigger.
 *
 * `FormField` hands back an `id` and three aria attributes, and they have to land on the element
 * the label points at — otherwise the picker is a control with a label beside it and no relation
 * between the two, which is what all three of the pickers this replaces were. React Native takes
 * `id`, `aria-label` and `aria-labelledby`; the other three are web only, on the trigger.
 */
type PickerAria = Pick<
  AriaAttributes,
  "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-invalid" | "aria-required"
> & { id?: string | undefined };

type PickerTriggerProps = PickerAria & {
  empty: boolean;
  disabled?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

function PickerTrigger({
  empty,
  disabled,
  className,
  children,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: PickerTriggerProps) {
  return (
    <PopoverTrigger asChild>
      <Button
        data-slot="date-picker-trigger"
        variant="outline"
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // What react-native has no prop for, in the spelling the web reads — the same arrangement
        // as `DateTimeInput`'s trigger. A bound field's hint and error reach the trigger this way.
        {...{
          ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
          ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
          ...(ariaRequired === undefined ? {} : { "aria-required": ariaRequired }),
        }}
        className={cn(TRIGGER, className)}
      >
        {/* The colour is on the words, not the button: native has no colour inheritance, so the
            placeholder's muted class has to be on the `Text` itself. */}
        <span
          className={cn(
            "cube-rn-text",
            "min-w-0 flex-1 text-left text-sm font-normal",
            ONE_LINE,
            empty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {children}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
      </Button>
    </PopoverTrigger>
  );
}

/**
 * The Clear row, in the popover's footer.
 *
 * Not an `X` inside the trigger, which is where all three of the pickers this replaces put it: a
 * `<button>` inside a `<button>` is invalid HTML, and the inner one is unreachable by keyboard in
 * every browser — so the affordance exists for a mouse and for nothing else. Two of the three
 * then had to render an empty `<div className="h-4 w-4" />` in its place to stop the label
 * shifting, which is the tell that the control was fighting its own markup.
 */
function ClearRow({ onClear }: { onClear: () => void }) {
  return (
    <div className="cube-rn-view flex-row justify-end border-t border-border p-1">
      <Button variant="ghost" size="sm" onClick={onClear}>
        <X className="h-4 w-4" aria-hidden />
        Clear
      </Button>
    </div>
  );
}

type CalendarProps = ComponentProps<typeof Calendar>;

type DatePickerProps = PickerAria & {
  value?: Date | null | undefined;
  onValueChange: (value: Date | null) => void;
  /** Adds a time box under the calendar and keeps the clock through a day change. */
  showTime?: boolean | undefined;
  placeholder?: string | undefined;
  /** How the chosen date reads on the trigger. Defaults to `PPP`, or `PPP p` with a time. */
  format?: string | undefined;
  /** Which days cannot be chosen — a `DateMatcher`, so `{ before: new Date() }` works. */
  disabledDates?: CalendarProps["disabled"] | undefined;
  clearable?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  contentClassName?: string | undefined;
  /** Anything else the calendar takes: `startMonth`, `numberOfMonths`, `weekStartsOn`. */
  calendarProps?: Omit<CalendarProps, "mode" | "selected" | "onSelect" | "disabled"> | undefined;
};

/**
 * A date, and optionally a time, behind a popover.
 *
 * `showTime` is a prop rather than a `DateTimePicker` because the two differ by one input and
 * one format string — a variant is not a component. The three near-identical pickers this
 * replaces were three files for that reason and drifted apart anyway: one of them still passes
 * `initialFocus`, removed in react-day-picker v9, and each carries a `<Label>` with no `htmlFor`,
 * so none of the three is actually labelled. Here the label is `FormField`'s job and the trigger
 * is a button, which is a labelable element — see `DateField`.
 */
export function DatePicker({
  value,
  onValueChange,
  showTime = false,
  placeholder = "Pick a date",
  format,
  disabledDates,
  clearable = true,
  disabled,
  className,
  contentClassName,
  calendarProps,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const pattern = format ?? (showTime ? "PPP p" : "PPP");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger {...aria} empty={!value} disabled={disabled} className={className}>
        {value ? formatDateFns(value, pattern) : placeholder}
      </PickerTrigger>
      <PopoverContent
        align="start"
        aria-label={placeholder}
        className={cn("w-auto p-0", contentClassName)}
      >
        <Calendar
          // Opening on today with a value set in March means the value is not on screen — the
          // calendar takes its first month from `defaultMonth`, never from `selected`.
          defaultMonth={value ?? undefined}
          {...calendarProps}
          mode="single"
          selected={value ?? undefined}
          disabled={disabledDates}
          onSelect={(day) => {
            if (!day) {
              onValueChange(null);
              return;
            }
            // The clock survives the day changing — the whole reason this is not `new Date(day)`.
            onValueChange(value ? combineDateAndTime(day, value) : day);
            if (!showTime) setOpen(false);
          }}
        />
        {showTime ? (
          <div className="cube-rn-view flex-row items-center gap-2 border-t border-border p-3">
            <Input
              type="time"
              // A time with no date is not a value this control can hold, so it waits.
              disabled={!value}
              aria-label="Time"
              value={value ? timeValue(value) : ""}
              onChangeText={(text) => {
                if (value && text) onValueChange(setTime(value, text));
              }}
              className="w-full"
            />
          </div>
        ) : null}
        {clearable && value ? (
          <ClearRow
            onClear={() => {
              onValueChange(null);
              setOpen(false);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

type DateRangePickerProps = Omit<
  DatePickerProps,
  "value" | "onValueChange" | "showTime" | "calendarProps"
> & {
  value?: DateRange | null | undefined;
  onValueChange: (value: DateRange | null) => void;
  /** Months side by side. Two, because a range usually crosses one. */
  numberOfMonths?: number | undefined;
  calendarProps?: Omit<CalendarProps, "mode" | "selected" | "onSelect" | "disabled"> | undefined;
};

/**
 * A start and an end, behind a popover.
 *
 * Its own component and not a `range` prop on {@link DatePicker}, because the value is a
 * different type: everything a caller does with it — the state, the validator, the submitted
 * row — is `DateRange`, not `Date`, and a prop cannot change what `onValueChange` hands back.
 *
 * It also closes. The version this replaces holds no open state at all, so choosing the end of
 * the range leaves the calendar sitting over the rest of the form until something else is
 * pressed; here the second date is the end of the interaction, which is what it means.
 */
export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Pick a date range",
  format,
  disabledDates,
  clearable = true,
  disabled,
  className,
  contentClassName,
  numberOfMonths = 2,
  calendarProps,
  ...aria
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Presses since the pane opened. The two calendars disagree on what one press makes:
  // react-day-picker answers the first with a whole one-day range (`from` and `to` the same day),
  // the native grid with a half one. Closing on "the range is complete" therefore shut the web
  // pane on the first press, before an end could be chosen; closing on the second press of the
  // visit is the same interaction on both.
  const presses = useRef(0);
  const openPane = (next: boolean) => {
    if (next) presses.current = 0;
    setOpen(next);
  };
  const pattern = format ?? "PP";

  const label = value?.from
    ? value.to
      ? `${formatDateFns(value.from, pattern)} – ${formatDateFns(value.to, pattern)}`
      : formatDateFns(value.from, pattern)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={openPane}>
      <PickerTrigger {...aria} empty={!value?.from} disabled={disabled} className={className}>
        {label}
      </PickerTrigger>
      <PopoverContent
        align="start"
        aria-label={placeholder}
        className={cn("w-auto p-0", contentClassName)}
      >
        <Calendar
          defaultMonth={value?.from}
          {...calendarProps}
          mode="range"
          numberOfMonths={numberOfMonths}
          selected={value ?? undefined}
          disabled={disabledDates}
          onSelect={(range) => {
            presses.current += 1;
            onValueChange(range ?? null);
            if (presses.current >= 2 && range?.from && range.to) setOpen(false);
          }}
        />
        {clearable && value?.from ? (
          <ClearRow
            onClear={() => {
              onValueChange(null);
              setOpen(false);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
