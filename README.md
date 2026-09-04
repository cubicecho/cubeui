# cubeui

A shadcn component registry for the cubicecho projects. Its purpose is **code reduction and
reuse**: shapes that every app was re-deriving — a card with a title and a footer of buttons, a
dialog whose body scrolls under a header that does not, a page with pinned chrome — live here
once, as components installed through the shadcn CLI.

```jsonc
// components.json, once per project
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/layout   # or a single item: @cubeui/card-layout
npx shadcn@latest add @cubeui/skill    # the agent skill, into .claude/skills/
```

Components are copied into your tree and rewritten against your own path aliases; there is no
runtime dependency on this package.

## What is here

| Item | What it is |
| --- | --- |
| `@cubeui/header-content-footer` | `HeaderContentFooter` and the `StickyHeaderContentFooter` preset — chrome that stays, a body that scrolls |
| `@cubeui/card-layout` | `CardLayout` — icon, title, description, header action, body, split footer, and the loading/empty ordering |
| `@cubeui/dialog-layout` | `DialogLayout` — a dialog whose body scrolls under a header that does not, and which asks before closing on unsaved work |
| `@cubeui/page-header` | `PageHeader` — trail, title at a chosen heading level, description, actions, and the control row |
| `@cubeui/split-layout` | `SplitLayout` — two panes side by side on a named width scale, stacking at a breakpoint, and the `SidebarLayout` preset for when one of them is the screen |
| `@cubeui/page-layout` | `PageLayout` — a whole page: a pinned title block over a body that scrolls, in a named column |
| `@cubeui/section` | `Section` — a heading over a group of fields or rows, with an action at the far end |
| `@cubeui/form-field` | `FormField` — a label wired to its control, a description inline or behind a help icon, an announced error, a skeleton, and `asGroup` for controls a `<label>` cannot name |
| `@cubeui/field-row` | `FieldRow` — fields side by side, wrapping rather than squeezing |
| `@cubeui/app-form` | `useAppForm` and the TanStack-bound fields: `InputField`, `NumberField`, `TextareaField`, `SelectField`, `CheckboxField`, `SwitchField`, `SubmitButton` |
| `@cubeui/multi-select-field` | `MultiSelectField` — over a field the compiler checked holds a list of strings |
| `@cubeui/date-field` | `DateField` and `DateRangeField` — over fields checked to hold a `Date` and a `DateRange` |
| `@cubeui/color-field` | `ColorField` — over a field checked to hold a hex string |
| `@cubeui/radio-group-field` | `RadioGroupField` — exclusive choices with the options on the page, each able to carry a line saying what it means |
| `@cubeui/password-field` | `PasswordField` — a password with a reveal button |
| `@cubeui/action-button` | `ActionButton` — an icon button with a required name, and a tooltip that survives being disabled |
| `@cubeui/confirm-button` | `ConfirmButton` — a destructive button that asks first, and makes you say what is lost |
| `@cubeui/multi-select` | `MultiSelect` — portalled, keyboard-operable, searchable on every word, and able to create as you type |
| `@cubeui/date-picker` | `DatePicker` and `DateRangePicker` — optionally with a time, and clearing is a real button |
| `@cubeui/color-picker` | `ColorPicker` — a palette, the OS picker or a hex box, with a tick drawn in an ink that can be read on the swatch |
| `@cubeui/password-input` | `PasswordInput` — the reveal button, unbound, for the gates that are not forms |
| `@cubeui/readable-text-color` | `readableTextColor` — black or white ink for text on a colour the user picked, whichever has more WCAG contrast |
| `@cubeui/empty` | shadcn's `empty`, re-published so the voice every project uses for "there is nothing yet" is edited in one place |
| `@cubeui/item` | shadcn's `item`, re-published so the row shared by every list is edited in one place |
| `@cubeui/layout` | All seven layout items in one install |
| `@cubeui/form` | All eight form items in one install |
| `@cubeui/control` | All six controls in one install |
| `@cubeui/primitive` | Both re-published shadcn primitives |
| `@cubeui/skill` | The agent skill — a router plus layout, form and control references — so an agent in a consuming project uses them correctly |

## Every slot is a prop, including the body

cubeui components take no children. The body is `content`, exactly like `header` and `footer`
are props:

```tsx
<StickyHeaderContentFooter
  width="page"
  header={<PageHeader title="Workspaces" />}
  content={<DataTable columns={columns} data={rows} />}
  footer={<Pagination page={page} onPageChange={setPage} />}
/>
```

In a layout **all** the parts are dynamic. Giving one of them the privileged position of
`children` says it is the real content and the others are decoration, which is backwards for a
component whose whole job is placing all of them. Passing them the same way keeps them equal,
keeps a call site to a single self-closing element whose props read as a list of positions, and
makes an absent body as visible as an absent header — a prop that is not there, rather than the
absence of a nesting level. It also removes the "does this one take `content` or children?"
question that a mixed convention forces on every call site.

## The forms assume TanStack Form

Every project installing these runs [TanStack Form](https://tanstack.com/form), so the registry
does too: `@cubeui/app-form` ships the `createFormHookContexts` / `createFormHook` wiring and the
field components bound to it. Installing it pulls `@tanstack/react-form` in.

```tsx
const form = useAppForm({
  defaultValues: { title: "", list: "", priority: "2" },
  onSubmit: ({ value }) => createTodo({ variables: { input: value } }),
});

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
  <form.AppField
    name="title"
    validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
  >
    {(field) => <field.InputField label="Title" required />}
  </form.AppField>

  <FieldRow content={
    <>
      <form.AppField name="priority">
        {(field) => <field.SelectField label="Priority" options={PRIORITIES} />}
      </form.AppField>
      <form.AppField name="minutes">
        {(field) => <field.SelectField label="Duration" options={DURATIONS} />}
      </form.AppField>
    </>
  } />

  <form.AppForm><form.SubmitButton>Create Todo</form.SubmitButton></form.AppForm>
</form>
```

There is no id in there, no `aria-describedby`, no `aria-invalid`, no "has this field been
touched yet", and no `disabled={!canSubmit || isSubmitting}`. That is four to six lines per field
that every form was writing out, and half of them were getting one of them wrong.

The layering is deliberate and worth keeping. `FormField` is presentational — it takes `error` as
a node and asks nothing about where it came from — and the bound fields are a thin layer on top
that read the store and hand it a string. That is what makes each of them fifteen lines rather
than a fork, and it is why a field the binding does not cover yet can still be written by hand
against `FormField` without leaving the set.

Do not reach for a second form library in a project using these. A second one is a second copy of
`app-form.tsx`.

## Working on it

```bash
npm install
npm run dev             # preview site
npm run build           # typecheck, build the registry into public/r, build the preview
npm run lint            # biome
```

[`AGENTS.md`](./AGENTS.md) is the guidance for anyone — human or agent — adding to this registry,
and [`docs/component-conventions.md`](./docs/component-conventions.md) holds the authoring rules
and the decisions behind them.

## Licence

[MIT](./LICENSE). Components are copied into your tree, so what you install is yours.
