# cubeui forms: Forms

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every form here shares.

**Contents**

- [A form](#a-form)
  - [When you need the `field` object](#when-you-need-the-field-object)
  - [A form value that contains itself](#a-form-value-that-contains-itself)
  - [Loading](#loading)
- [Fields on one row](#fields-on-one-row)
- [Forms in dialogs](#forms-in-dialogs)
- [Writing a field the registry does not ship](#writing-a-field-the-registry-does-not-ship)

## A form

A field is one line: the form, the name, and the label.

```tsx
import { useAppForm, InputField, SelectField, SubmitButton } from "@/components/app-form";

const form = useAppForm({
  defaultValues: { title: "", list: "", priority: "2" },
  onSubmit: ({ value }) => createTodo({ variables: { input: value } }),
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-4">
  <InputField
    form={form}
    name="title"
    label="Title"
    required
    placeholder="What needs to be done?"
    validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
  />
  <SelectField form={form} name="list" label="List" options={LISTS} />

  <form.AppForm>
    <form.SubmitButton variant="info" content="Create Todo" />
  </form.AppForm>
</form>
```

The bound fields:

| Field | Writes | Comes from |
| --- | --- | --- |
| `InputField` | `string` | `@cubeui/app-form` |
| `NumberField` | `number \| null` | `@cubeui/app-form` |
| `TextareaField` | `string` | `@cubeui/app-form` |
| `SelectField` | `string`, or `string \| null` with `clearable` | `@cubeui/app-form` |
| `CheckboxField`, `SwitchField` | `boolean` | `@cubeui/app-form` |
| `ComboboxField` | `string`, or `string \| null` with `clearable`; `string[]` with `multiple` | `@cubeui/app-form` |
| `DateField` | `Date \| null` | `@cubeui/date-field` |
| `DateRangeField` | `DateRange \| null` | `@cubeui/date-field` |
| `RadioGroupField` | `string` | `@cubeui/radio-group-field` |
| `ColorField` | `string` | `@cubeui/color-field` |
| `PasswordField` | `string` | `@cubeui/app-form` (also `@cubeui/password-field`, the old path) |

Each one takes everything `FormField` takes — `label`, `description`, `required`, `actionSlot`,
`loading`, `orientation`, the `*ClassName` props — plus the props of the control it wraps, plus
`validators`, `listeners` and `asyncDebounceMs`, in one flat list.

`PasswordField` names its reveal button from a string `label`: `label="API key"` gives "Show API
key" and "Hide API key". Pass `showLabel` and `hideLabel` for other words.

`RadioGroupField` is the exception to "everything `FormField` takes": it is not built on
`FormField`, because it has a React Native half and `FormField` does not. It takes `label`,
`description`, `required`, `actionSlot`, `loading` and the `*ClassName` props (`labelClassName`,
`descriptionClassName`, `errorClassName`, `loadingClassName`, `groupClassName`), plus the group's
own `variant`, `orientation`, `disabled` and `loop`. There is no `descriptionPlacement`,
`descriptionIconSlot`, `htmlFor` or `asGroup`: the description is always inline under the options, and
the group is always named by its title.

The four in their own files are there for the weight of what they import: a form of plain inputs
installs `@cubeui/app-form` and pulls in no cmdk, no `react-day-picker`.

**A field's `name` is checked against the form's values, and against their type.**
`<NumberField name="title">` over a string field and `<DateField name="window">` over a
`DateRange` are both build errors. This is why `NumberField` is a component rather than a
`type="number"` prop on `InputField`, and why `DateRangeField` is not a `range` prop on
`DateField` — a prop cannot narrow `name`, because the constraint on `name` is fixed before the
props are read.

What you do **not** write, at any field, ever:

- `id`, `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required`
- `value`, `onChange`, `onBlur` — the field owns all three
- Anything reading `field.state.meta.errors`, and any test of whether the field has been touched
- `disabled={!canSubmit || isSubmitting}` on the submit — `SubmitButton` has both

If you find yourself writing one of those, you are rebuilding the layer.

**A third reason not to submit goes on `SubmitButton`'s own `disabled`.** It is OR-ed with the
two the store knows, so it only ever tightens — `disabled={false}` says the caller has no
objection, not that an invalid form may go. Use it for what the store cannot see, such as a
mutation in flight elsewhere on the screen. Do not drop back to a hand-written
`<Button type="submit">` to get it.

**An edit form whose Save means nothing until something changes takes `requireChanges`.** It
keeps the submit disabled while every value is still its default. It reads the store's
`isDefaultValue`, not `isDirty`, so a value typed and typed back disables it again. Leave it off
for a create form, which is right to submit untouched.

**Errors wait.** A message appears once the field has been touched or the form has been submitted
at least once, never before, so a form does not open covered in red. That rule lives in one hook
and applies to every field; do not re-implement it per field, and do not pass `error` yourself.

**`SelectField` is the one that used to be broken.** Radix's `Select` root renders no DOM, so a
select field assembled out of the shadcn primitives leaves the trigger with no `aria-invalid` and
an error message nothing points at. `SelectField` routes through `FormField`'s function form and
wires the trigger. Use it rather than assembling `SelectTrigger` and `SelectContent` inside a
`FormField`. The same is true of every picker here.

Outside a form the answer is the control it renders — `Combobox` from `@cubeui/combobox`, in
[controls/combobox.md](../controls/combobox.md#combobox), taking the same `options` array. Do not hand-write the primitives
there either.

**A field whose list is fetched takes `onOpenChange`.** Pair it with `enabled:` on the query and
the server is asked when the menu opens, not when the form mounts — a form of twenty fields
otherwise asks for eighteen lists nobody looks at. While it waits, a `{ note }` entry is the row
that says so; it is not a disabled option, and [controls/combobox.md](../controls/combobox.md#a-menu-that-fills-when-it-opens) says why.

**An option that is not a peer says so in the options array.** `group` puts a heading over the
rows that share it, and a `{ separator: true }` entry draws a rule between them:

```tsx
<SelectField
  form={form}
  name="onSuccess"
  label="On success"
  options={[
    { value: "stay", label: "Stay here" },
    ...lanes.map((lane) => ({ value: lane.id, label: lane.name, group: "Lanes" })),
    { separator: true },
    { value: "archive", label: "Archive it" },
  ]}
/>
```

Groups are drawn in the order given, not sorted — a board's lanes are ordered and alphabetical
would be wrong. A flat `{ value, label }[]` still draws flat, so nothing is written until an
option is not a peer. Do not put the distinction in the label instead: `"Archive it — off the
board"` is a sentence doing a divider's job, and it does not survive a long list.

**A choice that may be left unmade takes `clearable`.** It adds a first row for "nothing",
saying `emptyLabel` (`"None"` by default), and choosing that row writes `null`:

```tsx
const form = useAppForm({ defaultValues: { ownerId: null as string | null } });

<SelectField form={form} name="ownerId" label="Owner" options={PEOPLE} clearable emptyLabel="Nobody" />
```

- The field holds `string | null`. `clearable` over a field typed plain `string` is a type error
  on the one-line form; `field.SelectField` inside `form.AppField` cannot check it, so type the
  default value as above there too.
- `null`, `undefined` and `""` all read as the empty row, and the trigger then says `emptyLabel`,
  not `placeholder`.
- Do not add a `{ value: "__none__", label: "None" }` option and translate it in `onSubmit`. That
  is what `clearable` replaces: no stand-in value reaches the store or a validator.
- The same two props are on the native `SelectField` and on a single `ComboboxField`.

**A field that has to *do* something on change takes `listeners`.** Same place as `validators`,
same shape — `onChange`, `onBlur`, `onMount`, `onUnmount`, `onSubmit`, and the two `*DebounceMs`
numbers — and it is for the side effect, not the verdict: naming a lane after the kind you picked
for it, filling a description from a template, clearing the fields the other transport owned.

```tsx
<SelectField
  form={form}
  name="roleId"
  label="Kind"
  options={KINDS}
  listeners={{
    onChange: ({ value }) => {
      if (form.state.values.name.trim()) return;
      form.setFieldValue("name", KINDS.find((kind) => kind.value === value)?.label ?? "");
    },
  }}
/>
```

The guard is yours, and it is the part worth writing: a listener that overwrites what somebody
already chose is the form arguing back. Check `form.state.fieldMeta.<name>?.isTouched`, or the
value itself, before you write to a sibling.

**A field checked against another takes `onChangeListenTo`.** It goes in `validators`, beside
`onChange`, and names the fields whose change runs this field's `onChange` again — so a
"Password, again" is marked as differing the moment the first password changes, not only when it
is typed in itself. `onBlurListenTo` is the same for `onBlur`. Read the other value off
`fieldApi.form`:

```tsx
<PasswordField form={form} name="password" label="Password" autoComplete="new-password" />
<PasswordField
  form={form}
  name="again"
  label="Password, again"
  autoComplete="new-password"
  validators={{
    onChangeListenTo: ["password"],
    onChange: ({ value, fieldApi }) =>
      value === fieldApi.form.getFieldValue("password") ? undefined : "The passwords differ",
  }}
/>
```

`PasswordField` is on `field.*` too (`<field.PasswordField label="Password" />`), with the other
light fields.

### When you need the `field` object

`form.AppField` is still there, and it is the escape hatch for a field that has to read a
sibling's value, render a list, or do something no prop covers:

```tsx
<form.AppField name="title">
  {(field) => <field.InputField label="Title" required />}
</form.AppField>
```

Use the one-line form everywhere else. It is the same component with the render prop already
written.

### A form value that contains itself

```
web/routes/task-edit.tsx(240,11): error TS2589: Type instantiation is excessively deep and
possibly infinite.
```

**Line 240 is the first field in the form, and it is not the field at fault.** `DeepKeys` is
computed once for the whole store and reported at the first position that asks for it, so a
`<InputField name="name">` over a `string` is where a recursive value three fields down surfaces.
Do not go looking at the field the error names.

The cause is a default value whose type contains itself — a flow of steps where a step has
branches and a branch has steps, a comment tree, a nested menu:

```ts
interface DraftStep { …; branches: DraftBranch[] }
interface DraftBranch { case: string; steps: DraftStep[] }
```

`DeepKeysAndValuesImpl` in `@tanstack/form-core` walks objects and arrays structurally with no
depth limiter and no seen-set, so a type that contains itself does not terminate. This is not
about the bound fields: `form.AppField` with a render prop fails identically, because both ask
`DeepKeys` the same question.

**Hold the recursive value opaquely and cast at the one place it is read.** `unknown` is the
first branch of that walk, so it stops there and every other field keeps its checked name:

```ts
interface Form {
  name: string;
  …
  /** `unknown`, not `DraftStep[]`: a step contains steps, and `DeepKeys` cannot walk that. */
  steps: unknown;
}

// Annotated, not `satisfies` — see below.
const defaults: Form = { …, steps: toDraft(task?.steps ?? []) };
const form = useAppForm({ defaultValues: defaults, … });

<form.Field name="steps">
  {(field) => <StepList steps={field.state.value as DraftStep[]} onChange={field.handleChange} />}
</form.Field>
```

**`satisfies Form` does not do this.** It checks the literal and then infers from the literal, so
the form's values are still the recursive type however `Form` declares the field — the error does
not move. The declaration only takes effect when the object is *annotated*.

Do not answer this by splitting the recursive part into a second form. One form, one `isDirty`,
one submit; the subtree keeps its real type everywhere it is actually edited, and the cost is one
cast with a comment on it.

### Loading

`TextareaField` sizes its own loading skeleton from `rows`. Every other bound field is
input-height, which is right. Pass `loadingClassName` only for a control that is neither.

## Fields on one row

```tsx
<FieldRow
  contentSlot={
    <>
      <SelectField form={form} name="priority" label="Priority" options={PRIORITIES} />
      <SelectField form={form} name="minutes" label="Duration" options={DURATIONS} />
    </>
  }
/>
```

<!-- props:FieldRow -->
`FieldRow`'s props, from the TSDoc in `registry/ui/form.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `ReactNode` |  | The fields, as the web `FieldRow` takes them. Each gets a cell of its own, and one that renders nothing (`{isEdit && <field.InputField … />}`) leaves no empty cell behind. |
| `perRow` | `keyof typeof CELL_SIZE` | `2` | How many fit on a line before the row wraps. |
| `className` | `string` |  |  |
| `cellClassName` | `string` |  |  |
<!-- /props -->

Do not write `grid grid-cols-2 gap-4` for this. A grid keeps its columns at every width, so the
row that reads well on a settings page becomes two 140px fields inside a dialog and the values in
them are clipped. `FieldRow` gives each cell a minimum width, so the row **wraps** instead — the third
field drops to its own line at full width rather than three of them sharing one at a third each.

- `contentSlot` takes a fragment. A field that renders nothing leaves no cell behind, so
  `{isEdit && <InputField … />}` is safe to put in the middle of one.
- That is the web item, `@cubeui/field-row`. In an Expo app `FieldRow` comes from `@cubeui/form`
  and takes the same props; only the fields in it are spelled the native way:

  ```tsx
  import { FieldRow } from "@/components/ui/form";

  <FieldRow
    contentSlot={
      <>
        <form.AppField name="first">{(field) => <field.InputField label="First name" />}</form.AppField>
        <form.AppField name="last">{(field) => <field.InputField label="Last name" />}</form.AppField>
      </>
    }
  />
  ```
- `perRow` is `2` (the default) or `3`: at most that many on a line. A cell is never narrower than
  `12rem` (`10rem` at three), so the row stacks on a phone or in a narrow dialog by real width,
  not at a breakpoint.
- The cells are equal width. A field that should be wider is not this component — put it on its
  own line.

## Forms in dialogs

A form in a dialog is `DialogLayout`, on both halves: the fields in `contentSlot`, the submit in
`footerActionsSlot`, and the `<form>` around all of it in `wrapperSlot`. There is no `FormDialog`: the registry shipped one that took
children and closed without asking, and it was removed. An app that vendored it moves to this.

```tsx
<DialogLayout
  open={open}
  onOpenChange={onOpenChange}
  title={isEdit ? "Edit todo" : "New todo"}
  hasUnsavedChanges={() => !form.state.isDefaultValue}
  wrapperSlot={(parts, { className }) => (
    <form.AppForm>
      <FormElement onSubmit={() => form.handleSubmit()} className={className}>
        {parts}
      </FormElement>
    </form.AppForm>
  )}
  contentSlot={<div className="grid gap-4">…fields…</div>}
  footerActionsSlot={(close) => (
    <>
      <Button variant="outline" onClick={close} content="Cancel" />
      <form.SubmitButton requireChanges={isEdit} content={isEdit ? "Save changes" : "Create"} />
    </>
  )}
/>
```

- **Put the `<form>` in `wrapperSlot`, not in `contentSlot`.** `wrapperSlot` wraps the header, the
  body and the footer together, so the footer's `SubmitButton` is inside the form it submits. A
  browser submits on Enter through a submit button the form owns — with one text field it needs
  none, with two it does — so a `FormElement` in `contentSlot` alone, the button left outside it
  in the footer, ignores Enter in any form of two fields or more. It looks right and the button
  works, which is why it goes unnoticed.
- **Pass `className` on.** It is what keeps the body scrolling under the header and above the
  footer; without it the form is a box of its content's height.
- **`wrapperSlot` is a function, not a component.** It is called, so the fields keep their state
  across renders; `wrapperSlot={MyForm}` or a component defined inline would remount them.
- **`<form.AppForm>` goes in the wrapper too**, once, so the footer's `form.SubmitButton` has the
  form from context without a second `<form.AppForm>` around it.
- Cancel and every other `Button` are `type="button"`, so they sit in the form without
  submitting it. A hand-written `<button>` in the footer needs `type="button"` said.
- `CardLayout` and `CenteredLayout` take the same `wrapperSlot` — a sign-in card, a settings card
  with Save in its footer.

- Without a wrapper or a named form the submit lives outside the `<form>` and a click still
  submits — a `SubmitButton` that no form owns calls `form.handleSubmit()` itself — but Enter
  does nothing in a form of two fields. A footer written for an
  earlier install, `<form.SubmitButton onClick={() => form.handleSubmit()} />`, now submits
  **twice**: drop the `onClick`. The same holds in a
  `CardLayout` footer. `FormElement` (`@cubeui/form-element`) is the `<form>` with the
  `preventDefault` already in it. It is a `gap-4` column, so the
  fields in it need no spacing of their own; to lay a field and its button in a row, pass
  `className="flex-row items-end gap-3"`.
- **`SubmitButton` is coloured by what it does.** On the web it is `positive` (it keeps the work:
  Save) unless you pass `variant="info"` for one that adds something (Create, Add). The native
  one knows which it is: `positive` when editing, `info` when creating. A `variant` you pass wins.
- A submit that has to sit somewhere no wrapper reaches names the form instead:
  `<FormElement id="todo" …>` and `<form.SubmitButton form="todo" … />`. A hand-written
  `<form id="todo">` works the same way.
- `hasUnsavedChanges` makes Escape, the overlay and the close button ask before the work is
  thrown away, and Cancel asks too because it calls the `close` it was handed, not a
  `setOpen(false)` of its own. See [layout/dialogs.md](../layout/dialogs.md#dialogs) for the rest of the dialog.
- What only the server knows (a delete the database refused) is an `Alert` in `contentSlot`,
  under the fields. Validation stays under its own field.

In an Expo app it is the same shell with the native form in it. `form.SubmitButton` submits by
itself there, so it needs no `form` attribute:

```tsx
<DialogLayout
  open={open}
  onOpenChange={onOpenChange}
  title="Rename project"
  hasUnsavedChanges={() => !form.state.isDefaultValue}
  contentSlot={
    <form.AppForm>
      <Form>
        <form.AppField name="name">{(field) => <field.InputField label="Name" />}</form.AppField>
      </Form>
    </form.AppForm>
  }
  footerActionsSlot={(close) => (
    <>
      <Button variant="outline" onPress={close} content="Cancel" />
      <form.AppForm>
        <form.SubmitButton createLabel="Rename" />
      </form.AppForm>
    </>
  )}
/>
```

## Writing a field the registry does not ship

`bindToForm`, `splitProps` and `useFieldError` are exported so a currency box or a rating control
is written the way the ones here are, without a second copy of the render prop and without an
opinion about the form library:

```tsx
function BoundCurrencyField(props: CurrencyFieldProps) {
  const [fieldProps, control] = splitProps(props);
  const field = useFieldContext<number | null>();
  return <FormField {...fieldProps} error={useFieldError()} controlSlot={<CurrencyInput {...control} …/>} />;
}

export const CurrencyField = bindToForm<CurrencyFieldProps, number>(BoundCurrencyField, "CurrencyField");
```

`app-form.tsx` is the only file allowed to import `@tanstack/react-form`. A field it does not
hold is still bound through it.
