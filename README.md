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
| `@cubeui/form-field` | `FormField` — a label wired to its control, a description, an announced error, a skeleton |
| `@cubeui/layout` | All five layout items in one install |
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

Every project installing these runs [TanStack Form](https://tanstack.com/form) —
`@tanstack/react-form`, through a `useAppForm` hook and `createFormHookContexts`, the way
`auto-cal` does. That is an assumption, deliberately, and it is the difference between a form
component and a form-shaped one: a shell hedging across react-hook-form, TanStack and a bare
`useState` can only take strings and nodes, so every call site still writes out the same
"pull the error off the field, decide whether it has been touched yet, pass it down" three lines
that were the duplication in the first place.

`FormField` itself stays presentational — it takes `error` as a node and asks nothing about where
it came from — because that is what lets a TanStack-bound wrapper be built *on* it rather than
beside it, which is exactly `auto-cal`'s split:

```tsx
<form.AppField name="title">
  {(field) => <field.InputField label="Title" placeholder="What needs to be done?" />}
</form.AppField>
```

`InputField` reads `field.state.meta.errors` and whether the field has been touched, and hands
`FormField` a string. Do not reach for a different form library in a project using these; a
second one is a second set of these wrappers.

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
