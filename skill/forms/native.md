# cubeui forms: Forms on React Native

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every form here shares.

## On React Native

`@cubeui/form` is the native form: one file with `Form`, `Field` and its parts, and `useAppForm`
built with TanStack `createFormHook` — the web hook's name and shape. Fields are components on
`field.*` inside `form.AppField`; `SubmitButton` is on the form.

```tsx
import { createAppForm, Form } from "@/components/ui/form";
import { DateTimeField } from "@/components/ui/date-time-field";
import { ColorField } from "@/components/ui/color-picker-field";

// Once, in a module of its own: the two heavy fields join the light ones on `field.*`.
export const { useAppForm, withForm } = createAppForm({ DateTimeField, ColorField });

const form = useAppForm({ defaultValues: { title: "", done: false, due: null, color: "" }, onSubmit });

<form.AppForm>
  <Form>
    <form.AppField name="title" validators={{ onChange: required }}>
      {(field) => <field.InputField label="Title" />}
    </form.AppField>
    <form.AppField name="due">
      {(field) => <field.DateTimeField label="Due" mode="date" clearable />}
    </form.AppField>
    <form.SubmitButton createLabel="Save" disabled={saving} />
  </Form>
</form.AppForm>
```

| Field | Writes | Comes from |
| --- | --- | --- |
| `InputField`, `PasswordField`, `TextAreaField` (`TextareaField`), `SelectField` | `string` | `@cubeui/form` |
| `NumberField` | `number \| null` | `@cubeui/form` |
| `CheckboxField`, `SwitchField` | `boolean` | `@cubeui/form` |
| `DateTimeField` | `Date \| null` | `@cubeui/date-time-field` |
| `ColorField` | `string` | `@cubeui/color-picker-field` |
| `ComboboxField` | `string`, or `string \| null` with `clearable`; `string[]` with `multiple` | `@cubeui/combobox-field` |
| `SegmentedField` | `string` | `@cubeui/segmented-field` |
| `RadioGroupField` | `string` | `@cubeui/radio-group-field` |

`useAppForm` from `@cubeui/form` has the first six. `DateTimeField` and `ColorField` are their
own items for the weight of the calendar and the picker, as on the web; add them with
`createAppForm`, or render them inside `form.AppField` as they are. `color-picker-field` is not
`color-field` because that is the web item's name.

`ComboboxField` and `SegmentedField` join the same way —
`createAppForm({ ComboboxField, SegmentedField })` — and replace a `FieldWrapper` around a bare
`Combobox` or `SegmentedGroup`. `SegmentedField` takes
`options` of `{ value, label, iconSlot?, disabled? }` and draws the pills itself, plus `variant`,
`labelHideBelow` and `disabled`. It is for two to five short choices; more is a `SelectField`,
and choices that each need a sentence are a `RadioGroupField`.

`ComboboxField` is the select `SelectField` cannot draw: a list long enough to need
`searchable`, one fetched when it opens (`onOpenChange`), one with a `{ note }` row, one that can
create an option, or one that holds several. It takes `Combobox`'s props (`options`,
`placeholder`, `disabled`, `searchable`, `searchPlaceholder`, `onOpenChange`, `onCreateOption`,
`freeText`, `createLabel`, `contentClassName`), with the trigger's class as `triggerClassName`. Choosing marks the field
touched, since a popover has no blur that means "done". Do not wrap a bare `Combobox` in
`form.Field` by hand.

```tsx
<form.AppField name="model">
  {(field) => <field.ComboboxField label="Model" options={MODELS} searchable />}
</form.AppField>
<form.AppField name="labels">
  {(field) => <field.ComboboxField multiple label="Labels" options={LABELS} />}
</form.AppField>
```

- Without `multiple` the field holds a `string`. `clearable` adds the row for "nothing" and
  writes `null`, with `emptyLabel` as its text, exactly as on `SelectField`.
- With `multiple` it holds a `string[]`, and takes `maxDisplay` and the control's own `clearable`
  — there it is the Clear button under the list, on by default, and it writes `[]`.
- `freeText`, `createLabel` and `duplicateMessage` pass through to `Combobox`. Single, the field
  holds whatever was typed. Multiple, each typed value is a chip, and a duplicate (ignoring case)
  is the field's error until the search changes — marked touched so it shows, and cleared without
  touching a validator's own message. Rules on the values themselves are still `validators`.

The web one-line form is the same field from `@cubeui/app-form`:
`<ComboboxField form={form} name="labels" label="Labels" options={LABELS} multiple />`. The name
is checked against the form: `multiple` takes only a field that holds a list of strings, and
without it only one that holds a string.

Every bound field takes `label`, `description`, `descriptionPlacement`, `descriptionIconSlot`,
`required`, `orientation`, `asGroup` and the `*ClassName` props, plus the control's own.
`descriptionPlacement="popover"` folds the description behind a button beside the label, as on
the web — see [A description that came out of a schema](form-field.md#a-description-that-came-out-of-a-schema). `className` is the field's, not the control's.
`DateTimeField` passes `mode`, `clearable` and `placeholder` through. `SelectField` takes
`options`, `placeholder`, `disabled` — a list with nothing in it yet — and `clearable` with
`emptyLabel`. Its `options` are the web `SelectField`'s: an option's `group` is a heading over
it and `{ separator: true }` is a rule, so one list serves both halves. Only a `{ note }` row
needs `ComboboxField`.

**A number is `NumberField`, not `InputField type="number"`.** It takes `Input`'s props and
writes `number | null`: an empty box is `null`, never `0`, and so is a lone `-` or `1e` while it
is being typed. The text settles to the stored number on blur. Do not parse the text yourself in
an `onChangeText`: on device the box is redrawn from the store on every key, so `0.` becomes `0`
and `4.05` cannot be typed. It raises the decimal keypad; pass `inputMode` for another.

```tsx
<form.AppField
  name="amount"
  validators={{ onChange: ({ value }) => (value === null ? "Amount is required" : undefined) }}
>
  {(field) => <field.NumberField label="Amount" required />}
</form.AppField>
```

`field.InputField type="number"` still works and is the same field. `min`, `max` and `step` only
constrain the web's box, so check the range in a validator.

`integer` takes whole numbers: the digits keypad on device, `step` 1 on the web unless you pass
one, and a fraction such as `1.5` stores `null` (it is not rounded), so a required validator
reports it. Neither iOS number keypad has a minus key; pass `signed` for a field that takes
negatives, and iOS raises the numbers-and-punctuation keyboard instead. The same three props are
on the web `NumberField` in `@cubeui/app-form`.

```tsx
{(field) => <field.NumberField label="Offset" integer signed />}
```

How each is named:

- **`DateTimeField`** is `asGroup`: the trigger is `aria-labelledby` the label and then its own
  date text — "Due September 15th, 2026". The time box is "Due time".
- **`ColorField`**: the label is `htmlFor` the hex box; the swatch row is a `radiogroup`, which a
  label cannot name, so it takes `aria-labelledby` the label's id.
- **`ComboboxField`, `SegmentedField`** are `asGroup`: the trigger and
  the pills' row are `aria-labelledby` the label.
- **`PasswordField`** is `PasswordInput` in the field, with its props (`autoComplete`,
  `revealable`, `leadingSlot`). The label names the box, and a string `label` names the reveal
  button too: `label="API key"` gives "Show API key" and "Hide API key". `showLabel` and
  `hideLabel` replace them. It is not `InputField type="password"`, which has no button.
- **`CheckboxField`, `SwitchField`**: `label` is also the control's `accessibilityLabel`. Device
  has no `htmlFor`.
- **`SelectField`**: the `id` and the `aria-*` wiring go on the trigger, not on the `Select` root,
  which renders no element. Wiring a `Select` by hand inside `FieldControl` puts them on the root
  and loses them: spread what the control is handed onto `SelectTrigger`.

A `SelectField` keeps a value its `options` do not hold yet, so a dialog that creates an option
can `form.setFieldValue` to it before the refetch lands. The trigger shows the placeholder until
the option arrives. The same holds for a bare `Select` inside a `<form>` on the web.

`Field asGroup` is the same switch as `FormField`'s: `FieldLabel` gets an id and `FieldControl`
puts `aria-labelledby` on the control in place of `htmlFor`. Use it for a trigger or a group.
`useFieldIds()` gives `labelId` to a control nested too deep for `FieldControl` to reach.

`SubmitButton`'s `disabled` is OR-ed with `!canSubmit || isSubmitting`. `disabled={false}` never
enables an invalid form. The label props are `createLabel`, `editLabel` with `isEdit`, and
`savingLabel`.

`useFieldError`, `splitProps`, `FieldWrapper` and `bindToForm` are exported for a field the
registry does not ship, as on the web. `bindToForm` makes the one-line `form`/`name` spelling.
