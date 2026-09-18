/**
 * Copied from `registry/ui/calendar.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web calendar: react-day-picker, using the library's own stylesheet so we
 * do not have to track its evolving `classNames` API across versions.
 * `calendar.tsx` is the native counterpart; `calendar-base.ts` holds the
 * contract they share.
 */
import { DayPicker } from "react-day-picker";
import type { CalendarProps } from "@/components/ui/calendar-base";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

export function Calendar({ selected, onSelect, defaultMonth, className }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      {...(defaultMonth ? { defaultMonth } : {})}
      className={cn("p-3", className)}
    />
  );
}
