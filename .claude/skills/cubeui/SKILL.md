---
name: cubeui
description: How to use the cubeui layout and form components (CardLayout, DialogLayout, HeaderContentFooter, StickyHeaderContentFooter) in a project that installs them from the cubeui shadcn registry. Read before building a page shell, a card, a dialog, or a form with shadcn primitives — it says which component owns the shape and which props carry which node, so hand-written Card/Dialog scaffolding is not re-derived per screen.
---

# cubeui

cubeui components are **shells**: they own a shape and take the parts as props. They do not
fetch, they do not hold form state, and they render no text of their own. A shell is one
self-closing element at the call site, and every slot is a named `ReactNode` — a string, an
element, a fragment.

**No cubeui component takes children.** The body is the `content` prop, exactly like the header
and the footer are props, because in a layout every part is dynamic and none of them is the
privileged one. `<CardLayout>{rows}</CardLayout>` is wrong; `<CardLayout content={rows} />` is
right. This is the mistake to check for first when reading or writing a call site.

Install from the registry, do not copy by hand:

```jsonc
// components.json, once per project
"registries": { "@cubeui": "https://cubeui.cubicecho.dev/r/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/card-layout   # or @cubeui/layout for the whole set
```

## Choosing

| The shape you are building | Use |
| --- | --- |
| A page: chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` |
| The same three zones, whole thing scrolls with the page | `HeaderContentFooter` |
| A panel with a title, a body, and buttons at the bottom | `CardLayout` |
| A modal with a title, a body that scrolls, buttons at the bottom | `DialogLayout` |

If none of them fits, use the shadcn primitives directly — do **not** bend a shell with
`className` until it is a different component. A shape that shows up three times is a case for a
new registry item, not for a fourth variant prop.

## The slot vocabulary

The same words mean the same thing in every component, and this is the point of the set:

- **`content`** — the body. The one slot that grows and the one that scrolls.
- **`title`**, **`description`** — what the thing is called and one line on what it is for.
- **`icon`** — sits before the title. Pass a bare `<Plus />`; the shell sizes and colors it.
- **`action`** — the far end of the *header*. One control: an add button, a menu, a switch.
- **`footer`** — the start of the footer. A note, a timestamp, a destructive action held away
  from the others.
- **`footerActions`** — the end of the footer. The buttons, in reading order, primary last.
- **`empty`** — what the body says when `content` comes back empty. Not a slot you place.
- **`loading`** — a boolean. On, the body is a skeleton and `empty` is not consulted.
- **`className`** — the root. Each slot has its own `<slot>ClassName` when it needs one.

Rules that follow from it:

- Give `footerActions` the buttons, not `footer`. Passing both splits the footer to its ends;
  passing only `footerActions` right-aligns it. Passing only `footer` is a footer of prose.
- Do not wrap a slot in a `<div>` to align it. The shell already did.
- Do not pass a `<CardHeader>` or a `<DialogTitle>` into a slot. Slots take content; the shell
  owns the primitive.

## Page shells

```tsx
<StickyHeaderContentFooter
  width="page"
  header={<PageHeader title="Vendors" description="Suppliers inventory is purchased from." />}
  content={<DataTable columns={columns} data={rows} />}
  footer={<Pagination page={page} onPageChange={setPage} />}
/>
```

- `width="page"` caps and centres every slot on one column, so the title sits above the first
  table column rather than beside it. `width="full"` (the default) fills the box it was given —
  panes inside a split, print sheets, anything already in a column of its own.
- The sticky variant needs a **height to divide**. It defaults to `h-full`; the ancestors up to
  the viewport need to give it one, or nothing scrolls and the header does not stay.
- Scroll position lives on the body, not the window: use `contentRef` to read or restore it.

## Cards

```tsx
<CardLayout
  title="Categories"
  description="Deleting a category keeps its activities — they go back to uncategorized."
  action={<Button size="sm">Add</Button>}
  loading={isPending}
  content={categories.map((category) => (
    <CategoryRow key={category.id} category={category} />
  ))}
  empty={<p className="text-sm text-muted-foreground">No categories yet.</p>}
  footerActions={<Button onClick={save}>Save</Button>}
/>
```

`empty` replaces the body when `content` is empty — which is what `items.map(…)` returns for
empty data, so write the `map` plainly and let the shell handle the nothing case. Do not write
`{items.length === 0 ? <Empty /> : items.map(…)}`.

`loading` replaces it with a skeleton and outranks `empty`, so a card that is still fetching does
not first announce that it is empty. Pass the query's pending flag straight in; do not write
`{isPending ? <Skeleton /> : …}`. A caller that wants its own placeholder passes that as
`content` and leaves `loading` off.

## Dialogs

```tsx
<DialogLayout
  trigger={<Button>New workspace</Button>}
  title="New workspace"
  description="A workspace exposes the servers you choose at its own URL."
  size="lg"
  content={<WorkspaceFields value={draft} onChange={setDraft} />}
  footerActions={
    <>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
    </>
  }
/>
```

- `title` is **required** — it is what assistive technology announces. A design with no room for
  a heading passes `hideTitle`, which keeps the title and takes it off the screen. Never drop it.
- Give a `trigger` and no `open`, and the dialog owns its state. Pass `open`/`onOpenChange` when
  something outside the trigger opens it (a row menu, a route, a keyboard shortcut).
- The body scrolls; the header and footer do not. Do not add `max-h-*` or `overflow-y-auto` — a
  cap on the whole dialog is what takes the title off the screen on a long form.
- `dismissible={false}` refuses Escape and outside clicks. Prefer asking on the way out.

## What does not belong in a shell

Data fetching, form state, toasts, routing, permission checks. A shell is handed nodes and
places them. If a screen needs "ask before discarding" or "disable save until valid", that is
the caller's, or a form component's — not a prop on the layout.
