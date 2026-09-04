# cubeui

A shadcn component registry for the cubicecho projects. Its purpose is **code reduction and
reuse**: shapes that every app was re-deriving — a card with a title and a footer of buttons, a
dialog whose body scrolls under a header that does not, a page with pinned chrome — live here
once, as components installed through the shadcn CLI.

```jsonc
// components.json, once per project
"registries": { "@cubeui": "https://cubeui.cubicecho.dev/r/{name}.json" }
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
| `@cubeui/header-content-footer` | The chassis: `HeaderContentFooter` and the `StickyHeaderContentFooter` preset |
| `@cubeui/card-layout` | `CardLayout` — icon, title, description, header action, body, split footer |
| `@cubeui/dialog-layout` | `DialogLayout` — a dialog whose body scrolls under a header that does not |
| `@cubeui/page-header` | `PageHeader` — trail, title, description, actions, and the control row |
| `@cubeui/split-pane` | `SplitPane` — a fixed rail beside a body, collapsing at a breakpoint |
| `@cubeui/page-layout` | `PageLayout` — a whole page: a pinned title block over a body that scrolls, in a named column |
| `@cubeui/form-field` | `FormField` — a label wired to its control, a description, an announced error, a skeleton |
| `@cubeui/field-row` | `FieldRow` — fields side by side, wrapping rather than squeezing |
| `@cubeui/app-form` | `useAppForm` and the TanStack-bound fields: `InputField`, `TextareaField`, `SelectField`, `CheckboxField`, `SwitchField`, `SubmitButton` |
| `@cubeui/action-button` | `ActionButton` — an icon button with a required name, and a tooltip that survives being disabled |
| `@cubeui/confirm-button` | `ConfirmButton` — a destructive button that asks first, and makes you say what is lost |
| `@cubeui/layout` | All six layout items in one install |
| `@cubeui/form` | All three form items in one install |
| `@cubeui/control` | Both control items in one install |
| `@cubeui/skill` | The agent skill, so an agent in a consuming project uses them correctly |

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
