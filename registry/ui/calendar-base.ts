/**
 * The contract `calendar.tsx` (native) and `calendar.web.tsx` (react-day-picker)
 * both implement. Its own module because Metro resolves `./calendar` to
 * `calendar.web.tsx` on web.
 *
 * Single-date selection only. react-day-picker's `mode` is deliberately not in
 * the contract: range and multi selection have no native implementation behind
 * them, and a prop that only works on one platform is a promise half-kept.
 */
export type CalendarProps = {
  selected?: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  /** Month shown on first render; defaults to the selected date's month. */
  defaultMonth?: Date | undefined;
  className?: string | undefined;
};
