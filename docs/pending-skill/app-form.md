# Pending: the `useAppForm` and `FieldRow` sections of SKILL.md

Fold this into `.claude/skills/cubeui/SKILL.md` alongside the `FormField` section it depends on.
Written in that file's voice, and in the order it should land there.

---

## 1. Add to the "Choosing" table

| The shape you are building | Use |
| --- | --- |
| A form of any size | `useAppForm` and `form.AppField` |
| Two or three fields that belong on one line | `FieldRow` |
| A single field outside a form — a filter, a search box | `FormField` on its own |

## 2. The section itself

### Forms

**Every project using these runs TanStack Form.** Do not introduce a second form library, and do
not write a form with `useState` and hand-rolled validation beside one written with these.

```tsx
import { useAppForm } from "@/components/form/app-form";

const form = useAppForm({
  defaultValues: { title: "", list: "", priority: "2" },
  onSubmit: ({ value }) => createTodo({ variables: { input: value } }),
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-4">
  <form.AppField
    name="title"
    validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
  >
    {(field) => <field.InputField label="Title" required placeholder="What needs to be done?" />}
  </form.AppField>

  <form.AppForm>
    <form.SubmitButton>Create Todo</form.SubmitButton>
  </form.AppForm>
</form>
```

The bound fields are `InputField`, `TextareaField`, `SelectField`, `CheckboxField` and
`SwitchField`. Each one takes everything `FormField` takes — `label`, `description`, `required`,
`action`, `loading`, `orientation`, the `*ClassName` props — plus the props of the control it
wraps, in one flat list.

What you do **not** write, at any field, ever:

- `id`, `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required`
- `value`, `onChange`, `onBlur` — the field owns all three
- Anything reading `field.state.meta.errors`, and any test of whether the field has been touched
- `disabled={!canSubmit || isSubmitting}` on the submit — `SubmitButton` has both

If you find yourself writing one of those, you are rebuilding the layer.

**Errors wait.** A message appears once the field has been touched or the form has been submitted
at least once, never before, so a form does not open covered in red. That rule lives in one hook
and applies to every field; do not re-implement it per field, and do not pass `error` yourself.

**`SelectField` is the one that used to be broken.** A `<Select>`'s root renders no DOM, so a
hand-written select field leaves the trigger with no `aria-invalid` and an error message nothing
points at. `SelectField` routes through `FormField`'s function form and wires the trigger. Use it
rather than a `Select` inside a `FormField`.

### `field.TextareaField` and loading

`TextareaField` sizes its own loading skeleton from `rows`. Every other bound field is
input-height, which is right. Pass `loadingClassName` only for a control that is neither.

### Fields on one row

```tsx
<FieldRow
  content={
    <>
      <form.AppField name="priority">
        {(field) => <field.SelectField label="Priority" options={PRIORITIES} />}
      </form.AppField>
      <form.AppField name="minutes">
        {(field) => <field.SelectField label="Duration" options={DURATIONS} />}
      </form.AppField>
    </>
  }
/>
```

Do not write `grid grid-cols-2 gap-4` for this. A grid keeps its columns at every width, so the
row that reads well on a settings page becomes two 140px fields inside a dialog and the values in
them are clipped. `FieldRow` gives each cell a floor, so the row **wraps** instead — the third
field drops to its own line at full width rather than three of them sharing one at a third each.

- `content` takes a fragment. A field that renders nothing leaves no cell behind, so
  `{isEdit && <form.AppField …>}` is safe to put in the middle of one.
- `perRow` is `2` (the default) or `3`, and it only moves the floor.
- The cells are equal width. A field that should be wider is not this component — put it on its
  own line.

### Forms in dialogs

There is no `FormDialog`. A form in a dialog is `DialogLayout` with a `<form>` as its `content`
and the submit in `footerActions`:

```tsx
<DialogLayout
  open={open}
  onOpenChange={onOpenChange}
  title={isEdit ? "Edit todo" : "New todo"}
  content={<form id="todo" onSubmit={…}>…</form>}
  footerActions={
    <form.AppForm>
      <form.SubmitButton form="todo">{isEdit ? "Save changes" : "Create"}</form.SubmitButton>
    </form.AppForm>
  }
/>
```

The `form="todo"` attribute is what lets the submit live outside the `<form>` in the dialog's
footer while still submitting it.
