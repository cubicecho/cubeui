# cubeui controls

Read [SKILL.md](SKILL.md) first. These are the controls, not the shells: each one is a real
control with a real accessible name, usable on its own or inside a `FormField`. Every one of them
has a bound counterpart in [forms.md](forms.md) — reach for that inside a TanStack form, and for
these in a filter bar, a toolbar, or a plain `useState` screen.

**Web only**, except the icons, `DateTimeInput`, `InlineNumberEdit`, `ColorPicker` and the
colour display parts, and the theme picker, which each say so. Everything else here is a DOM
component with no React Native half, so it does not install in an Expo project. `SKILL.md`'s last
section is the native set.

## Icons

Import icons from `@/components/ui/icons` (`@cubeui/icons`), not from `lucide-react` or
`lucide-react-native` directly. It is the same lucide names on both halves: a plain re-export on
the web, where an `<svg>` takes `currentColor` from its container, and styled wrappers on native,
where nothing inherits and a container like `Button` publishes its text colour for the icons
below it. A component that takes an icon as a prop types it as `IconComponent`.

**A glyph the set does not ship is wrapped in the app, with the exported `icon`.** Do not copy the
native wrapper, and do not add to `icons.tsx` — the next `shadcn add` of `@cubeui/icons`
overwrites it. Write the app's own pair of files, one line per glyph, beside each other so Metro
picks the `.web.tsx` on web the same way it does for `icons`:

```tsx
// components/app-icons.tsx — native: the per-icon path, since Metro does not tree-shake
import TagSource from "lucide-react-native/icons/tag";
import { icon } from "@/components/ui/icons";

export const Tag = icon(TagSource);
```

```tsx
// components/app-icons.web.tsx — web: the barrel, from lucide-react
import { Tag as TagSource } from "lucide-react";
import { icon } from "@/components/ui/icons";

export const Tag = icon(TagSource);
```

On native `icon` is the same wrapper every icon in the set goes through — `className` sizing, the
`text-foreground` floor and `IconClassContext` — so the app's glyph follows a `Button`'s colour
like the rest. On web it hands the glyph back unchanged, since an `<svg>` already inherits
`currentColor`; it exists so both files read the same. Keep the two files' names in step, as
`icons` does: TypeScript only resolves the native one. A DOM-only app needs only the second file,
or can import the glyph from `lucide-react` directly. `IconProps` is exported beside `icon` for a
component that forwards an icon's props.

A tab can carry an icon too: `<TabsTrigger value="board"><Calendar /> Board</TabsTrigger>`.
The trigger lays its children out in a row, puts only the text in a `<Text>`, and hands the icon
the tab's active or inactive colour on both halves — do not colour it yourself, and do not build a
segmented control to get one.

Name the tablist when no visible heading does: `<TabsList aria-label="Project view">`, or
`aria-labelledby` pointed at the heading's id (`nativeID` on device). It is on the shared contract, so one call site names
it on both halves; a screen reader announces it on entering the tabs.

## Icon buttons

**Every icon-only button is an `ActionButton`.** Not a `Button` with an SVG in it.

```tsx
<ActionButton label="Delete workspace" variant="ghost" size="icon" onClick={remove}>
  <Trash2 />
</ActionButton>
```

`label` is required and is the accessible name. `title` is not a name — it is a hint, it is not
read in place of one, and it never appears on a touch device. Across these projects 78 of 134
icon buttons announce as "button".

**`disabled` here is not the HTML attribute.** It becomes `aria-disabled`, so the control keeps
its focus ring, its hover and its tooltip and refuses the press in the handler. That is
deliberate: `disabled:pointer-events-none` is why every `title="Empty the lane first"` in these
apps was unreadable on exactly the control it was explaining. Pass `hint` with the reason:

```tsx
<ActionButton label="Delete lane" hint="Empty the lane first" disabled={cards.length > 0}>
  <Trash2 />
</ActionButton>
```

`hint` replaces `label` in the tooltip; the accessible name stays `label` either way, and the
hint is read after it whether or not the tooltip is open — it is also an always-mounted
`sr-only` span, because a tooltip's text is in the DOM only while it is showing. Pass
`tooltip={false}` for a row that already explains itself, and `side` to move the tooltip.

**A root `TooltipProvider` does not reach these buttons.** `ActionButton` renders its own, and
a nested provider replaces the one above it rather than merging with it — so an app with
`<TooltipProvider delayDuration={300}>` at its root gets 300ms everywhere except here, where
the tooltip opens the instant the pointer crosses. Pass `delayDuration` (and
`skipDelayDuration`, which is what makes a toolbar of them feel like one control) to match it.
Radix offers no way to read the outer provider, so the number has to be said twice; a project
that minds should say it once in a wrapper.

**Both of these are `type="button"`, so neither submits the form it sits in.** You do not need
to write it at the call site, and you should not go back to a bare `<Button>` to avoid it. A
`<button>` with no type is a submit button, which is why an icon button beside a field used to
save the form as well as do its own job — and why Enter in that field pressed the trash, since
implicit submission goes to the first submit button in tree order and never through a click.
A form's real submit is `SubmitButton`. If you want one of these to submit, say `type="submit"`.

## Destructive buttons

```tsx
<ConfirmButton
  label="Delete lane"
  variant="ghost"
  size="icon"
  title="Delete this lane?"
  description="The lane takes its cards with it."
  onConfirm={() => deleteLane(id)}
>
  <Trash2 />
</ConfirmButton>
```

Do not build the `AlertDialog` by hand. There are 22 hand-written ones across these projects and
they disagree about the button order, the confirm's variant, and what Cancel is called.

**`description` is required, and it is not "This cannot be undone."** The dialog already implies
that, and it teaches nothing. Say what is lost: *the lane takes its cards with it*, *anything
using this key stops working, including the nightly sync*, *the members lose access to every
server in it*. If you cannot write that sentence, the confirm is probably not warranted.

`confirmLabel` names the verb — Delete (the default), Discard, Revoke, Remove, Reset. The action
is always destructive; a confirm that is *not* destructive is a question, and a question is
`DialogLayout`.

Everything `ActionButton` takes, `ConfirmButton` takes: `hint`, `disabled`, `variant`, `size`. A
disabled `ConfirmButton` does not open the dialog.

## Option select

```tsx
<OptionSelect options={LISTS} value={list} onValueChange={setList} placeholder="Choose one" />
```

`options` is `{ value, label, group?, className? }[]`, plus `{ separator: true }` for a rule and
`{ note }` for a row that is not a choice — the same array
`SelectField` takes, because `SelectField` renders this. Reach for it in a filter bar, a toolbar,
or a `useState` screen; inside a TanStack form use `SelectField` and never wire this by hand.

**It is not shadcn's `Select`, and it is not called that.** The primitive at
`@/components/ui/select` takes children; this takes `options`. It shipped as `Select` for one
day and could not keep the name: the shadcn CLI resolves a cross-item import by the source
file's basename, so two files called `select.tsx` in one install sent `app-form`'s import to the
primitive and broke the install.

- The trigger is what carries the wiring. Radix's `Select` root renders no DOM, so an `id` or an
  `aria-invalid` put on it goes nowhere — this takes the rest of a `<button>`'s props and spreads
  them on the trigger, which is why it drops straight into `FormField`'s **function form**:
  `control={(wired) => <OptionSelect {...wired} options={…} … />}`.
- Full width by default, because a column of selects that each shrink to their longest option is
  ragged. Pass `className="w-40"` for a toolbar; the later width wins.
- `contentClassName` is the dropdown's class. `className` is the trigger's, which is the control.
- `className` **on an option** is the row's, on the `SelectItem`. Reach for it when the values are
  identifiers rather than prose — model ids, SHA prefixes, file paths are `font-mono`. Wrapping
  the label in a `<span className="font-mono">` styles the text and leaves the row's padding,
  tick and highlight in the body face.

An option that is not a peer of the others says so in the array rather than in its own label:

```tsx
<OptionSelect
  options={[
    { value: "stay", label: "Stay here" },
    ...lanes.map((lane) => ({ value: lane.id, label: lane.name, group: "Lanes" })),
    { separator: true },
    { value: "archive", label: "Archive it" },
  ]}
  value={destination}
  onValueChange={setDestination}
/>
```

Drawn in the order given, never sorted — a board's lanes are ordered and alphabetical would be
wrong. A flat `{ value, label }[]` draws flat.

### A menu that fills when it opens

A list the server owns should not be fetched on mount: a form of twenty fields would ask for
eighteen lists nobody opens. `onOpenChange` is what makes that possible, and `{ note }` is where
the menu says it is still working.

```tsx
const [opened, setOpened] = useState(false);
const models = useQuery({ queryKey: ["models", endpoint], queryFn: fetchModels, enabled: opened });

<OptionSelect
  value={model}
  onValueChange={setModel}
  onOpenChange={setOpened}
  placeholder="Choose a model"
  options={[
    ...(models.data ?? []).map((m) => ({ value: m.id, label: m.id, className: "font-mono" })),
    ...(models.isFetching && !models.data ? [{ note: "Loading…" }] : []),
    ...(models.error ? [{ note: models.error.message, className: "text-destructive" }] : []),
  ]}
/>
```

- `onOpenChange` is the root's, so it is a prop here rather than something spread on the trigger.
  Pass it alone to be told; pass `open` with it to drive the menu yourself. The `select` primitive
  underneath takes the same pair, on both platforms.
- **A note is not a disabled option.** That is the workaround every hand-written version reaches
  for, and it is a row the keyboard walks onto and a reader hears as a choice they may not have.
  The row is `aria-hidden` and the words are announced from a `role="status"` region beside the
  control — unreachable, and read out when it appears, which is the case exactly, since the menu
  opens before the list exists.
- `SelectField` takes `onOpenChange` too, so a fetched list inside a form does not have to drop
  to `FormField`'s function form to get one word through.

## Multi-select

A tag picker: a trigger showing what is chosen, a searchable list behind it.

```tsx
<MultiSelect
  options={TAGS}          // { value, label, keywords?, color?, disabled?, hint?, meta?, group? }[]
  value={tags}
  onValueChange={setTags}
  placeholder="No tags"
  onCreateOption={(name) => createTag(name)}
/>
```

- `searchable` is on by default and `keywords` widen what a search matches beyond the label.
- `onCreateOption` is what turns it into a combobox: given it, a search that matches nothing
  offers to create. Without it, a search that matches nothing says `emptyMessage`.
- `maxDisplay` caps the chips on the trigger and the rest become a count.
- `color` on an option draws a dot, and the tick on a chosen swatch picks its own contrast.
- **`hint` on an option says why it is the way it is** — most often why it is `disabled`. Drawn
  under the label and read after it, never as part of the name. A disabled row fires no hover,
  so a tooltip there is text nobody can reach, and greyed out on its own reads as a bug in the
  picker: "waiting on this would close a loop", "already applied by a rule", "not on your plan".
  Same argument as `ActionButton`'s `hint`.
- **`meta` on an option is the end of the row** — a status badge, a count, a date. Read after the
  name, never as part of it, and never on the chip: the chip is the label and stays a string. Do
  not reach for `color` for this. That is the chip's colour, and pointing it at a status mints a
  second colour vocabulary beside the app's own.
- **`group` on an option is a heading over the rows that share it.** Drawn in the order given,
  not sorted — a board's lanes are ordered and alphabetical would be wrong. The heading is
  searched along with the row, so typing a lane's name still finds the cards in it, and a group
  whose rows are all filtered out hides itself.

`label` is still the row, the chip and what the search matches, so anything that is not the name
goes in one of those three rather than into the label. `"Fix billing (archived)"` is a row saying
its status by having it typed into its name, and it says it on the chip too.

Its trigger is a real control that takes an `id` and the `aria-*` props, which is why it works
inside a `FormField` — but pass them through the **function form** of `control`, since its root
is a `Popover`. `MultiSelectField` already does.

## Date and date range

```tsx
<DatePicker value={dueAt} onValueChange={setDueAt} showTime />
<DateRangePicker value={window} onValueChange={setWindow} numberOfMonths={2} />
```

- `showTime` adds a time input inside the popover; without it the value is the date at midnight.
- `format` is a `date-fns` pattern for the trigger's text; `disabledDates` is passed to the
  calendar; `calendarProps` reaches the rest of `react-day-picker` without a prop per feature.
- `clearable` (on by default) puts a clear in the popover, and clearing sets `null`.
- The trigger is a `<button>`, which is labelable, so `htmlFor` works — but the `aria-*` props
  still need the function form of `control`.

`DatePicker` is web-only. On both halves, `@cubeui/date-time-input` is the date field — a date
and a time as one `Date` by default:

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

On the web, `DatePicker` is still the richer one — `format`, `disabledDates`, `calendarProps` and
a `FormField`'s `aria-*` on the trigger.

## A number edited in place

```tsx
<InlineNumberEdit
  value={task.estimate}
  min={0}
  format={(n) => `${n} min`}
  accessibilityLabel="Estimate"
  saving={update.isPending}
  onSave={(estimate) => update.mutate({ estimate })}
/>
```

`@cubeui/inline-number-edit`, on both halves, for a number read far more often than it is changed
— a quantity on a row, an estimate on a card — that does not deserve a form. It shows the number
as text and becomes an input when pressed.

- It commits on blur and on submit; there is no save button. The draft is clamped to
  `min`/`max`, an unparseable one falls back to `min`, and an unchanged value does not call
  `onSave` at all.
- `accessibilityLabel` is required, because the press target's text is a bare number.
- Inside a pressable row the row's own press fires too. Stopping it is the caller's call, since
  only the caller knows which press should win.

## Colour

```tsx
<ColorPicker value={color} onValueChange={setColor} clearable />
```

- It is drawn inline, not in a popover: a row of swatches over a hex field, one source for both
  platforms. `<input type="color">` has no native counterpart, so there is no OS colour well.
- The value is a hex string, `#rgb` or `#rrggbb`; `null` and `""` both mean no colour.
  `normalizeHex` and `isHexColor` are exported for a caller that validates its own — the hex
  field reports what is typed as it is typed, so validating is the caller's.
- `onValueChange` and `onChange` are the same callback under two names, and `swatches` and
  `colors` the same list; the default is 16 Tailwind 500s. The swatch row is a `radiogroup` of
  radios, each named by its hex, with a tick drawn in `readableTextColor` of the swatch.
- `clearable` (off by default) draws a Clear button, labelled `clearLabel`, that commits `""`.
- `placeholder` is the hex field's; `hexLabel` names the hex field for a screen reader (web
  only); `swatchesLabel` or `aria-label` names the swatch row. `disabled` blocks all of it, and
  `contentClassName` reaches the swatch row.
- `popoverLabel` and `customLabel` are accepted from the popover picker's API and ignored —
  there is no popover to name and no colour well to label.
- `id` goes to the hex field and the `aria-*` props to the swatch row, so a field's function-form
  `control` can spread onto it.

Showing a colour the user picked is three small items, all on both halves:

```tsx
<ColorDot color={tag.color} label={tag.name} size="sm" />
<Card accentColor={project.color} accentLabel={project.name}>…</Card>
<span style={{ background: tag.color, color: readableTextColor(tag.color) }}>{tag.name}</span>
```

- **`ColorDot`** (`@cubeui/color-dot`) — a round swatch standing in for a category, status or
  tag in a list; `size` is `sm` or `md`. Without `label` it is decoration and hidden from
  assistive tech; with one, the label is its accessible name.
- **`accentColor`** on `Card` draws a left-edge stripe (`@cubeui/color-bar`), normalised so it
  stays visible in both themes, and `accentLabel` names it. Pass it on `Card` rather than placing
  a `ColorBar` yourself — the card owns the `relative overflow-hidden` the stripe needs.
- **`readableTextColor(color)`** (`@cubeui/readable-text-color`) — black or white ink for text on
  a user-chosen backdrop, by WCAG contrast. It does not flip with the theme, because the backdrop
  does not. It returns `undefined` for anything that is not hex, so the text falls back to the
  inherited foreground. Do not hardcode white on a chip: it fails AA on about half of any palette.

## Password

```tsx
<PasswordInput value={token} onChange={(e) => setToken(e.target.value)} />
```

The reveal toggle is behaviour, not a variant, which is why this is a component and not a
`type="password"` prop. Three things a hand-written eye gets wrong, and this gets right:

- The toggle is `type="button"`. A bare `<button>` inside a `<form>` submits it, so the usual
  hand-rolled version submits the login form when you ask to see what you typed.
- Its accessible name changes with its state — "Show password" / "Hide password" — rather than
  being a fixed "Toggle" that tells a screen reader nothing about what will happen.
- It swaps the input's real `type`, not a CSS mask, so a password manager and the browser's own
  autofill still see a password field.

`revealable={false}` drops the toggle for a field that should never be shown.

## Theme

```tsx
// Web: nothing to pass. The picker stores the choice and applies it.
<ThemePicker />

// Device: pass storage once, where the app starts. The picker writes through it too.
import AsyncStorage from "@react-native-async-storage/async-storage";
useThemePreference({ storage: AsyncStorage });
```

`@cubeui/theme-picker` works on both platforms. `ThemePicker` is a `RadioGroup variant="card"`
with Light, Dark and System. Do not hand-roll it from `RadioGroup`. The control is the easy part,
and the storage, the class and the first paint are what hand-rolled versions get wrong.

- **Bound by default.** Without `value`, the picker reads and writes `useThemePreference()`.
  Pass `value` and it is controlled. It then only calls `onValueChange` and never touches storage,
  the class or `Appearance`. Use that when the preference lives on the account or in a settings
  form.
- **Call `useThemePreference()` at the app's root as well**, not only on the settings screen. That
  way the choice is applied on every screen, and System keeps following the device. It returns
  `[preference, setPreference]`, the same state the picker shows.
- **Web:** the choice goes in `localStorage` under `THEME_STORAGE_KEY` (`"cubeui-theme"`). It is
  applied as a class on `<html>`: `dark` for Dark, `light` for Light, and for System `dark` only
  while the device is dark. A DOM app's `tokens.web.css` has only `.dark`, which is why System
  still sets it. The hook reads nothing at import, so it renders on a server.
- **Device:** the choice is applied with `Appearance.setColorScheme`, with `"unspecified"` for System. That
  is the spelling React Native 0.82+ requires, and 0.81 treats it the same way.
  `storage` is any `{ getItem, setItem }`, sync or async. Wrap MMKV or `expo-secure-store` in two
  lambdas. Without `storage` the choice lasts until the app closes. The stored value is read
  asynchronously, so hold the splash screen if a flash of the system theme matters.
- `aria-label` defaults to "Theme". Pass `aria-labelledby` when a heading names the group.

**Paint the stored theme before React mounts**, or a reload flashes the other palette. Put this in
`<head>`, before any stylesheet:

```html
<script>(function(){try{var p=localStorage.getItem("cubeui-theme");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",p==="light")}catch(e){}})();</script>
```

Where the head is React, as in Expo's `app/+html.tsx` or a Next layout, render the export rather
than pasting it:

```tsx
import { THEME_PRE_PAINT_SCRIPT } from "@/components/ui/theme-preference-base";

<script dangerouslySetInnerHTML={{ __html: THEME_PRE_PAINT_SCRIPT }} />
```
