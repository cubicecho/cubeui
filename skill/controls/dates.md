# cubeui controls: Dates, and numbers as text

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Date and date range

```tsx
<DatePicker value={dueAt} onValueChange={setDueAt} showTime />
<DateRangePicker value={window} onValueChange={setWindow} numberOfMonths={2} />
```

<!-- props:DatePicker -->
`DatePicker`'s props, from the TSDoc in `registry/ui/date-picker.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `value` | `Date \| null` |  |  |
| `onValueChange` (required) | `(value: Date \| null) => void` |  |  |
| `showTime` | `boolean` | `false` | Adds a time box under the calendar and keeps the clock through a day change. |
| `placeholder` | `string` | `"Pick a date"` |  |
| `format` | `string` |  | How the chosen date reads on the trigger. Defaults to `PPP`, or `PPP p` with a time. |
| `disabledDates` | `CalendarProps["disabled"]` |  | Which days cannot be chosen — a `DateMatcher`, so `{ before: new Date() }` works. |
| `clearable` | `boolean` | `true` |  |
| `disabled` | `boolean` |  |  |
| `className` | `string` |  |  |
| `contentClassName` | `string` |  |  |
| `calendarProps` | `Omit<CalendarProps, "mode" \| "selected" \| "onSelect" \| "disabled">` |  | Anything else the calendar takes: `startMonth`, `numberOfMonths`, `weekStartsOn`. |
<!-- /props -->

<!-- props:DateRangePicker -->
`DateRangePicker`'s props, from the TSDoc in `registry/ui/date-picker.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `id` | `string` |  |  |
| `placeholder` | `string` | `"Pick a date range"` |  |
| `format` | `string` |  | How the chosen date reads on the trigger. Defaults to `PPP`, or `PPP p` with a time. |
| `disabledDates` | `CalendarProps["disabled"]` |  | Which days cannot be chosen — a `DateMatcher`, so `{ before: new Date() }` works. |
| `clearable` | `boolean` | `true` |  |
| `disabled` | `boolean` |  |  |
| `className` | `string` |  |  |
| `contentClassName` | `string` |  |  |
| `value` | `DateRange \| null` |  |  |
| `onValueChange` (required) | `(value: DateRange \| null) => void` |  |  |
| `numberOfMonths` | `number` | `2` | Months side by side. Two, because a range usually crosses one. |
| `calendarProps` | `Omit<CalendarProps, "mode" \| "selected" \| "onSelect" \| "disabled">` |  |  |
<!-- /props -->

<!-- props:DateTimeInput -->
`DateTimeInput`'s props, from the TSDoc in `registry/ui/date-time-input.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `mode` | `"datetime" \| "date"` |  | `"datetime"` (default) draws the time field beside the date. `"date"` drops it: a picked day is committed at local midnight, which is what a due date or a birthday is. |
| `placeholder` | `string` |  | What the trigger reads while the value is `null`. Only reachable with `clearable`. |
| `className` | `string` |  |  |
| `id` | `string` |  | The trigger's id — what a `FieldLabel htmlFor` points at on the web. React Native takes `id` as its `nativeID`, so on device it is a target for `aria-labelledby` rather than a label's. A `<label for>` names the trigger by the label alone — the date is not in the name — so pass `aria-labelledby` when the field has a label with an id. |
| `aria-label` | `string` |  | The field's name. The trigger is named by it and the date after it — `"Due"` makes it `"Due, September 15th, 2026"`, or `"Due, Pick a date"` while empty. In `"datetime"` mode the time box is named after it too — `"Due, time"` — so two of these in one form are not both "Time". |
| `aria-labelledby` | `string` |  | The field's name by reference — the id of the `Label` above it. The trigger takes it followed by a reference to its own date text, so it is named "Due September 15th, 2026". The time box takes it followed by its own id, and its own `aria-label` of "time" is what that second reference reads, so it is named "Due time". |
| `aria-describedby` | `string` |  | Web only, on the trigger: native has no description relation. A bound field's hint and error. |
| `aria-invalid` | `boolean \| "true" \| "false"` |  | Web only, on the trigger. |
| `aria-required` | `boolean \| "true" \| "false"` |  | Web only, on the trigger. |
| `clearable` | `false` |  |  |
| `value` (required) | `Date` |  |  |
| `onChange` (required) | `(next: Date) => void` |  |  |
<!-- /props -->

**On both halves**, from `@cubeui/date-picker` (it installs to `components/date-picker`). The
web half is compiled from the React Native source and draws react-day-picker, as it always did; on
device the popover is a centred sheet and the months stack.

- `showTime` adds a time input inside the popover, which stays open after a day is picked so the
  time can follow. A first pick is the day at midnight; picking a new day keeps the value's clock.
- `format` is a `date-fns` pattern for the trigger's text; `disabledDates` is passed to the
  calendar. `calendarProps` takes the calendar's shared props (`startMonth`, `weekStartsOn`,
  `defaultMonth`) on both halves, and on the web the rest of react-day-picker's too.
- `clearable` (on by default) puts a clear in the popover, and clearing sets `null`.
- The range picker closes on the second press after it opens, so the first press starts a range
  rather than ending one. Its value is a `DateRange` (`{ from, to? }`), exported beside it.
- The trigger is a button, which is labelable, so `htmlFor` works on the web — but the `aria-*`
  props still need the function form of `controlSlot`. `aria-describedby`, `aria-invalid` and
  `aria-required` are web only.
- `combineDateAndTime(day, clock)` and `setTime(day, "14:30")` are exported for the same
  arithmetic at a call site.

`DatePicker` owns a full-width trigger and puts its time box in the popover. The other date field
on both halves is `@cubeui/date-time-input` — the time box beside the trigger, and a date and a
time as one `Date` by default:

```tsx
<DateTimeInput value={startsAt} onChange={setStartsAt} />
```

The date comes from a `Calendar` in a `Popover` and the time from an `Input type="time"`, and the
two always commit one `Date` back — a caller never reassembles one. Picking a new day keeps the
clock.

Two props turn it into the optional, date-only field an Expo app needs for a due date:

```tsx
<DateTimeInput clearable mode="date" value={dueOn} onChange={setDueOn} placeholder="No due date" />
```

- `mode="date"` drops the time box, and a picked day is committed at local midnight.
- `clearable` is what lets the value be `null`: the trigger reads `placeholder` while it is, and a
  Clear row in the popover commits `null`. It is also what puts `null` in the types — without it
  `value` is `Date` and `onChange` is `(next: Date) => void`, so a caller holding `Date | null`
  has to say `clearable`. In `"datetime"` mode the time box waits, disabled, until a date is set.
- It takes `onChange`, not `onValueChange` — it predates the vocabulary, and renaming it would
  break every caller.

Name it the way a form names any control. `aria-labelledby` and `aria-label` name the trigger by
the field **and** the date, so a screen reader hears "Due, September 15th, 2026" rather than just
"Due"; in `"datetime"` mode the time box is named after the field too, so a form with a start and
an end does not have two boxes called "Time":

```tsx
<Label id="starts-label">Starts</Label>                       {/* both halves */}
<DateTimeInput aria-labelledby="starts-label" value={startsAt} onChange={setStartsAt} />
{/* trigger "Starts September 3rd, 2026", time box "Starts time" */}

<DateTimeInput aria-label="Ends" value={endsAt} onChange={setEndsAt} />
{/* trigger "Ends, September 3rd, 2026", time box "Ends, time" */}

<DateTimeInput aria-label="Due" clearable mode="date" placeholder="No due date" value={null} … />
{/* trigger "Due, No due date" — the placeholder stands in for the date */}

<FieldLabel htmlFor="due">Due</FieldLabel>                  {/* web only, and loses the date */}
<DateTimeInput id="due" clearable mode="date" value={dueOn} onChange={setDueOn} />
{/* trigger "Due" — the date is only its text */}
```

- **Prefer `aria-labelledby` to `htmlFor`.** A `<label for>` replaces a button's contents as its
  name, so the trigger is just "Due" and the date is not in it. The component cannot fix that from
  inside: it never sees the label's id, and pointing the trigger at itself puts the date in the
  name in Chromium but doubles it when no label exists, and Playwright's name engine drops the
  label instead. Give the `FieldLabel` an `id` and pass that as
  `aria-labelledby`; `id` still makes the trigger a target for a label that has nothing better.
- `htmlFor` names the trigger only — a label points at one control — so the time box stays
  "Time". Another reason a `mode="datetime"` field takes `aria-labelledby` (or `aria-label`).
- `htmlFor` is web only: the native `Label` has nothing to associate. `Label id` is on both
  halves, so `aria-labelledby` is the one that works everywhere; on device React Native takes the
  `id` as a `nativeID`, and iOS reads no reference at all, so pass `aria-label` when VoiceOver has
  to hear the name — it is composed with the date on device too.
- With no name given, the trigger is read by its text — the date or the placeholder — and the
  time box is "Time", as before.
- In a form, `DateTimeField` (`@cubeui/date-time-field`) does the `aria-labelledby` wiring for
  you — see [forms/native.md](../forms/native.md#on-react-native).

`DatePicker` is the richer one — `format`, `disabledDates`, `calendarProps`, a range picker, and
a `FormField`'s `aria-*` on the trigger — and takes `onValueChange`.

## Numbers, sizes and dates as text

`@cubeui/format` installs `@/lib/format`: plain functions, the same on both halves. Use them
where an app would otherwise write its own `lib/format.ts`.

| Call | Gives |
|---|---|
| `formatCount(1204)` | `1,204` |
| `formatCount(3, "file")`, `formatCount(2, "entry", "entries")` | `3 files`, `2 entries` |
| `formatBytes(1536)` | `1.5 KB` — B to GB, a step is 1024 |
| `formatDuration(11520)` | `3h 12m` — also `42s`, `5m`, `2d 4h`; it takes seconds |
| `formatDate(note.updatedAt)` | `Oct 3, 2026`, in the reader's locale |
| `formatDateTime(doc.addedAt)` | `Oct 3, 2026, 2:32 PM`, in the reader's locale |
| `formatAgo(note.updatedAt)` | `3 days ago`, `yesterday`, `just now` under a minute |
| `formatAgo(call.at, undefined, { style: "narrow" })` | `5m ago`, `3d ago`, `in 2h` — for a dense column |
| `joinStats(formatCount(1, "file"), formatCount(2, "chunk"), locked && "human-only")` | `1 file · 2 chunks · human-only` |

`formatDate`, `formatDateTime` and `formatAgo` take an ISO string, epoch milliseconds or a `Date`,
and return an empty string for one that does not parse, so a missing timestamp draws nothing.
`formatAgo` takes a second argument, the moment to count from, for a screen that ticks its own
clock, and a third, `{ style: "narrow" }`, for a column too tight for `5 minutes ago`. Do not keep
a `formatRelativeTime` of your own for the short form.

`joinStats` is the line of facts under a title — an `Item`'s description, a card's subtitle. It
leaves out a part that is `""`, `false`, `null` or `undefined`, so a fact that only sometimes
applies is written inline with `&&`. Do not join them by hand with `" · "` and a `filter`.
