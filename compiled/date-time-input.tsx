/**
 * Compiled from `registry/ui/date-time-input.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * Combined date + time picker.
 *
 * - Date is chosen from a `Calendar` in a `Popover` — a dropdown anchored to the
 *   trigger on web, a sheet on native.
 * - Time is an `Input type="time"`: a real `<input type="time">` on web, a plain
 *   HH:mm text field on native, which is the split `input` exists for.
 *
 * Shared by both platforms with no `.web.tsx`: every piece it composes is
 * already a cross-platform primitive. The two halves always commit a single
 * `Date` back through `onChange`, so a caller never has to reassemble one.
 */
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Calendar as CalendarIcon } from "./icons";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type DateTimeInputProps = {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
};

export function DateTimeInput({ value, onChange, className }: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const timeStr = format(value, "HH:mm");

  function handleDateSelect(picked: Date | undefined) {
    if (!picked) return;
    // The calendar only knows a day, so the time is carried over rather than
    // reset to midnight — picking a new date must not silently move the time.
    const next = new Date(picked);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
    setOpen(false);
  }

  function handleTimeChange(text: string) {
    const parts = text.split(":").map(Number);
    const hh = parts[0];
    const mm = parts[1];
    if (hh === undefined || mm === undefined) return;
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = new Date(value);
    next.setHours(hh, mm, 0, 0);
    onChange(next);
  }

  return (
    <div className={cn("cube-rn-view", "flex-row items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar selected={value} onSelect={handleDateSelect} defaultMonth={value} />
        </PopoverContent>
      </Popover>
      <Input type="time" value={timeStr} onChangeText={handleTimeChange} className="w-[120px]" />
    </div>
  );
}
