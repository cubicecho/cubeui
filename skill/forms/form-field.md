# cubeui forms: `FormField` on its own

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every form here shares.

## `FormField` on its own

The presentational half: a label, a control, a hint, an error. It binds to no form library, so it
is what a filter, a search box, or a field in a `useState` form uses.

```tsx
<FormField
  label="Email"
  required
  description="We only use it to send the sign-in link."
  error={errors.email?.message}
  controlSlot={<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
/>
```

<!-- props:FormField -->
`FormField`'s props, from the TSDoc in `registry/web/form-field.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `controlSlot` (required) | `SlotNode \| ((props: ControlProps, parts: FieldParts) => SlotNode)` |  | The control itself — one `<Input>`, `<Textarea>`, `<Checkbox>`, `<Switch>`. |
| `label` | `ReactNode` |  | What the control is called, as a real `<FieldLabel htmlFor>`. Most of why this component exists: a placeholder is not a label — it leaves at the first keystroke, and a field wearing one is a field a screen reader announces as "edit text". |
| `description` | `ReactNode` |  | What to put in the field, or what changing it costs. |
| `descriptionPlacement` | `"inline" \| "popover"` | `"inline"` | Where the description is drawn. `inline` puts it under the control; `popover` puts it behind a small button beside the label. |
| `descriptionIconSlot` | `SlotNode` |  | The `popover` trigger's glyph. Defaults to a question mark; an `Info` reads as less of a plea. |
| `error` | `ReactNode` |  | What is wrong with the value, as a node or a string. Falsy — `undefined`, `""`, whatever a validator holds for a field that passed — draws nothing and leaves the control unmarked, so a call site passes `errors.email?.message` straight in rather than branching around it. |
| `required` | `boolean` | `false` | Whether a value is needed. Draws the asterisk, and says so to assistive technology as `aria-required`; the asterisk itself is decoration and stays out of the accessibility tree, so the label still reads "Email" rather than "Email star". |
| `actionSlot` | `SlotNode` |  | The label row's far end. "Forgot password?", a character count, a reveal toggle. |
| `loading` | `boolean` | `false` | Whether the value is still being fetched. On, a skeleton stands in for the control and `error` is not consulted — a value that has not arrived is not a value that came back wrong. The same ordering `CardLayout` makes between `loading` and `emptySlot`, one level down. |
| `htmlFor` | `string` |  | The control's `id`, for a caller that already owns one — something else on the page points at this control, or a form library minted it. Left off, the shell generates one, which is what makes the same field safe to render twice on a page. A control the shell cannot reach wants the function form of `controlSlot`, not this: an `htmlFor` alone points the label at the right element and leaves the description and the error pointing at nothing. |
| `asGroup` | `boolean` | `false` | Whether the control is a *group* of controls rather than one. |
| `orientation` | `keyof typeof LOADING_BOX` | `"vertical"` | `horizontal` puts the control first and the label beside it, for the controls whose label is part of the hit target: a checkbox, a switch. Stacked, a 16px box sits on a line of its own above its own caption, which is the shape every app that hand-wrote one worked around differently. |
| `className` | `string` |  |  |
| `labelClassName` | `string` |  |  |
| `descriptionClassName` | `string` |  |  |
| `errorClassName` | `string` |  |  |
| `loadingClassName` | `string` |  | Sizes the loading box for a control that is not input-height — a `<Textarea rows={6}>`. |
<!-- /props -->

`FormField` does the **wiring**, not only the spacing. It mints an id, points the label at the
control, and gives the control an `aria-describedby` that reaches whichever of the description
and the error are on screen. Do not write any of that at the call site:

- Do not pass `id` or `htmlFor` unless you need the id yourself — the shell generates one, which
  is what makes a field safe to render twice on a page.
- Do not set `aria-invalid`, `aria-describedby` or `aria-required` on the control. The shell sets
  all three, and it only fills a gap: a value you set yourself wins.
- Do not put the error in a `<p>` beside the field. Pass it as `error`, and it is announced,
  linked, and drawn in the one voice the set uses.
- Do not use a placeholder as a label. A placeholder leaves at the first keystroke, and a field
  wearing one is announced as "edit text".

Falsy `error` draws nothing, so write `error={errors.email?.message}` plainly. Never
`{errors.email && <p …>}`.

`loading` swaps the control for a skeleton **and keeps the label and the description**, drawn for
real: they are literals the form already knows, not data it is waiting for, so a field that hides
them makes its column of labels appear out of nowhere when the values land. `loading` outranks `error`
— a value that has not arrived is not one that came back wrong.

### A description that came out of a schema

`description` takes a `ReactNode` so a form can pass `schema.fields[k].description` straight
through — a GraphQL description, a JSON-schema `description`, a docstring off a generated type.
Those strings have two readers, and they are marked up for the one that reads markdown:

```
Whether tool definitions are sent up front (`eager`) or loaded as the run asks for
them (`ondemand`). `inherit` takes the server's answer.
```

A model needs the backticks — they are the only thing saying `ondemand` is a value and not a
word. A person reads them as punctuation. **Wrap the string in `ticks`**, exported beside
`FormField`, and the marker is spent on a `<code>` instead of printed:

```tsx
<FormField label="Tool discovery" description={ticks(describe("Agent", "toolDiscovery"))} … />
```

Do not fix this by rewriting the description without backticks — the other reader is the one that
loses. Do not fix it by keeping a second, human copy of the sentence beside the schema's; two
sentences that mean the same thing are two sentences that drift.

`ticks` is backticks and nothing else, it leaves a string with none alone, and an unpaired one
stays the character it is. Anything more is a markdown renderer and belongs behind a library.

A schema writes a paragraph per field, and fifteen paragraphs down a form bury it.
**`descriptionPlacement="popover"` puts the sentence behind a small button beside the label**,
named "About <label>" (and "About this field" when the label is not a string):

```tsx
<FormField label="Tool discovery" description={…} descriptionPlacement="popover" … />
<field.InputField label="Display name" description={…} descriptionPlacement="popover" />
```

`FormField`, the web bound fields and the native ones (`FieldWrapper`, every field on `field.*`)
all take it, with `descriptionIconSlot` for another glyph than the question mark. On the web the
control is still described by the sentence with the pane shut: it stays on the page, off screen,
for `aria-describedby`. `CardLayout`, `Section` and `SettingRow` take the same two props — see
[layout/cards.md](../layout/cards.md#cards). Do not build this at the call site with a `Popover` and an icon
button: the button ends up inside the label, and the control loses its description.

### Checkboxes and switches

```tsx
<FormField
  orientation="horizontal"
  label="Email me about releases"
  description="About one a month."
  controlSlot={<Checkbox checked={subscribed} onCheckedChange={setSubscribed} />}
/>
```

`horizontal` puts the control first and the label beside it — the arrangement whose label is part
of the control's hit target. Stacked, a 16px box sits on a line of its own above its own caption.

A **settings row** — a title and a paragraph on the left, a switch, select or button pushed to
the far right — is not this. That is a row, not a field: use `SettingRow`
([layout/facts.md](../layout/facts.md#setting-rows)), inside a `Section` or `CardLayout`. A lone boolean with its
caption beside it is `SwitchField` (`@cubeui/switch-field`). It takes a `description` — a line
under the caption, wired with `aria-describedby` — and `disabled`, which is how a switch that
cannot be changed says why: `<SwitchField … disabled description="ocrmypdf is not installed." />`.
Another control, or the switch at the far end of a row, is `SettingRow`.

`Switch` and `SwitchField` take `hint`, the one tooltip, as `Button` does: shown on hover and focus
(a long press on device) and the switch's description. With `disabled` it keeps the switch
focusable (`aria-disabled`) and still refuses the press, so the reason can be hovered and tabbed
to: `<Switch aria-label="Arm the trigger" disabled hint="Turn the task on first" … />`. Do not
put the sentence in a `title`, which touch and keyboard never show.

### When the props belong on something nested

A control whose root renders no DOM — shadcn's `Select` primitive, anything built on `Popover` —
swallows the `id`, the `aria-describedby` and the `aria-invalid` when the shell clones it, and
the field ends up wired to nothing, with no warning and nothing visibly wrong. Pass a **function**
and put the props where they go:

```tsx
<FormField
  label="Plan"
  error={errors.plan?.message}
  controlSlot={(props) => (
    <Select value={plan} onValueChange={setPlan}>
      <SelectTrigger {...props} className="w-full">
        <SelectValue placeholder="Choose one" />
      </SelectTrigger>
      <SelectContent>…</SelectContent>
    </Select>
  )}
/>
```

Everything whose root *is* the control — `Input`, `Textarea`, `Checkbox`, `Switch` — passes the
element itself and needs none of this. An `Input` with a `leadingSlot` icon or a `trailingSlot` button is
still one of them: its root becomes a box around the field, but `id` and every `aria-*` land on the
field itself, where the label points.

Every cubeui picker already knows where its own trigger is: `Combobox` and
`DatePicker` take the rest of a `<button>`'s props and put them there, so the function form
spreads onto the control and stops — `controlSlot={(props) => <Combobox {...props} options={LISTS} … />}`.
`ColorPicker` has no trigger — it is the swatch row and the hex field, drawn inline — so it splits
the same props: `id` goes to the hex field, and `aria-label`, `aria-labelledby`,
`aria-describedby`, `aria-invalid` and `aria-required` go to the swatch row's `radiogroup`.
The primitive version above is what that saves.

The props are `ControlProps` and the second argument is `FieldParts` (the label's `labelId`), both
exported from `@/components/form-field`. A helper that takes the wiring on, such as a row of inputs
where one carries the field's id and error, types its prop with them rather than a copy of its own:
`import type { ControlProps } from "@/components/form-field"`.

`htmlFor` is **not** the answer here, even though it looks like it: it points the label at the
trigger and leaves the description and the error describing nothing. Use `htmlFor` only when you
own the id for a separate reason.

### A group of controls is still one field

`asGroup` swaps the `<label htmlFor>` for a title plus an `aria-labelledby` on the control,
because HTML will not let a `<label>` name a `<div role="radiogroup">` — the browser drops the
association silently, so the default wiring produces a field that looks wired in the source and
is not. Any grouped control needs it: a radio group, a segmented control, a swatch grid used as
the field itself.

`RadioGroupField` already names its group that way. You only reach for `asGroup` when writing a
new grouped control by hand. A segmented control's group is `SegmentedGroup`, which takes the
`aria-labelledby` and the rest of the control props on its `role="group"` row:

```tsx
<FormField
  label="Scale view"
  asGroup
  controlSlot={(props) => (
    <SegmentedGroup {...props} value={view} onValueChange={setView}>
      <SegmentedButton value="relative">Relative</SegmentedButton>
      <SegmentedButton value="parallel">Parallel</SegmentedButton>
    </SegmentedGroup>
  )}
/>
```

```tsx
<RadioGroupField
  form={form}
  name="visibility"
  label="Visibility"
  required
  options={[
    { value: "private", label: "Private", description: "Only you." },
    { value: "team", label: "Team", description: "Anyone in the workspace." },
  ]}
/>
```

Each option is one control — the circle, the label and the description are all inside the
`role="radio"` — so clicking the option's text chooses it, and the description describes that
option only. The keyboard is done: one tab stop (the checked option, or the first), arrow keys
that move and select. Do not add an `onKeyDown`.

`variant="card"` draws the options as tiles across a row, each with an `iconSlot` over its label and a
`hint` for the hover title — a theme picker, a layout choice:

```tsx
<RadioGroupField
  form={form}
  name="theme"
  label="Theme"
  variant="card"
  options={[
    { value: "light", label: "Light", iconSlot: <Sun />, hint: "Always light" },
    { value: "dark", label: "Dark", iconSlot: <Moon />, hint: "Always dark" },
    { value: "system", label: "System", iconSlot: <Monitor />, hint: "Follow the device" },
  ]}
/>
```

`variant="segmented"` draws the options as one framed, input-height row of equal segments
across the container's width, like `SegmentedGroup` but still radios, with one tab stop and arrow
keys. A segment shows its `iconSlot`, its `label` or both, and draws no `description`. For an
icon-only segment, leave `label` out and pass `aria-label` on `RadioGroupItem`. That becomes the
radio's name and, when no `hint` is given, its web tooltip. On device, give the icon its colour
yourself (`text-active-foreground` when checked, `text-foreground/60` otherwise), because a
native icon has no `currentColor` to inherit.

Outside a form, the same thing is `RadioGroup` and `RadioGroupItem` from `@cubeui/radio-group`,
controlled with `value` / `onValueChange`.
