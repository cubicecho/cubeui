# cubeui controls

Read [SKILL.md](SKILL.md) first. These are the controls, not the shells: each one is a real
control with a real accessible name, usable on its own or inside a `FormField`. Every one of them
has a bound counterpart in [forms.md](forms.md) — reach for that inside a TanStack form, and for
these in a filter bar, a toolbar, or a plain `useState` screen.

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

## Multi-select

A tag picker: a trigger showing what is chosen, a searchable list behind it.

```tsx
<MultiSelect
  options={TAGS}                       // { value, label, keywords?, color?, disabled? }[]
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

## Colour

```tsx
<ColorPicker value={color} onValueChange={setColor} />
```

- The value is a hex string, `#rgb` or `#rrggbb`. `normalizeHex` and `isHexColor` are exported
  for a caller that validates its own.
- A half-typed hex is not committed: the box holds a draft and the value changes only when what
  is in it is a colour. Emptying the box **is** an answer — it commits `""`, meaning no colour.
- `swatches` overrides the palette; the default is 16 Tailwind 500s. Each swatch is a real
  toggle with the hex as its name and `aria-pressed` for the chosen one.
- The popover carries its own accessible name inside itself, because Radix unmounts popover
  content on close and a name living outside it is unreachable.

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
