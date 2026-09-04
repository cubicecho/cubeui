---
name: cubeui
description: How to use the cubeui components (PageLayout, HeaderContentFooter, StickyHeaderContentFooter, CardLayout, DialogLayout, PageHeader, SidebarLayout, Section, FormField, FieldRow, useAppForm and its bound fields, ActionButton, ConfirmButton, MultiSelect, DatePicker, ColorPicker, PasswordInput) in a project that installs them from the cubeui shadcn registry. Read before building a page shell, a page title block, a card, a dialog, a two-pane screen, a section heading, a form, an icon-only button, or a destructive action with shadcn primitives — it says which component owns the shape and which props carry which node, so hand-written scaffolding is not re-derived per screen.
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
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/card-layout   # one item
npx shadcn@latest add @cubeui/layout        # or a set: layout, form, control
```

## Choosing

| The shape you are building | Use | Reference |
| --- | --- | --- |
| A whole page — a title, buttons, and rows under them | `PageLayout` | [layout.md](layout.md) |
| A page: chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` | [layout.md](layout.md) |
| The same three zones, whole thing scrolls with the page | `HeaderContentFooter` | [layout.md](layout.md) |
| The title block at the top of a page: name, buttons, search | `PageHeader` | [layout.md](layout.md) |
| A navigation column or inspector beside a working surface | `SidebarLayout` | [layout.md](layout.md) |
| A list beside the detail for the selected row | `SidebarLayout`, or two routes | [layout.md](layout.md) |
| A panel with a title, a body, and buttons at the bottom | `CardLayout` | [layout.md](layout.md) |
| A modal with a title, a body that scrolls, buttons at the bottom | `DialogLayout` | [layout.md](layout.md) |
| A heading over a group of fields or rows | `Section` | [layout.md](layout.md) |
| A form of any size | `useAppForm` and the bound fields | [forms.md](forms.md) |
| A label, a control, a hint under it, and an error | `FormField` | [forms.md](forms.md) |
| Two or three fields that belong on one line | `FieldRow` | [forms.md](forms.md) |
| An icon-only button | `ActionButton` | [controls.md](controls.md) |
| A button that deletes, discards, revokes or resets | `ConfirmButton` | [controls.md](controls.md) |
| A tag picker, a date picker, a colour picker, a password box | the controls | [controls.md](controls.md) |

If none of them fits, use the shadcn primitives directly — do **not** bend a shell with
`className` until it is a different component. A shape that shows up three times is a case for a
new registry item, not for a fourth variant prop.

## The slot vocabulary

The same words mean the same thing in every component, and this is the point of the set.

**Everywhere:**

- **`content`** — the body. The one slot that grows and the one that scrolls.
- **`title`**, **`description`** — what the thing is called and one line on what it is for.
- **`icon`** — sits before the title. Pass a bare `<Plus />`; the shell sizes and colors it.
- **`action`** — the far end of the *header*. One control, or a fragment of them.
- **`footer`** — the start of the footer. A note, a timestamp, a destructive action held away
  from the others.
- **`footerActions`** — the end of the footer. The buttons, in reading order, primary last.
- **`empty`** — what the body says when `content` comes back empty. Not a slot you place.
- **`loading`** — a boolean. On, the shell substitutes a skeleton for the part of itself that
  the request was going to fill, and `empty` is not consulted.
- **`hasUnsavedChanges`** — a boolean, on `DialogLayout`. On, closing asks first. Pass
  `form.state.isDirty`.
- **`className`** — the root. Each slot has its own `<slot>ClassName` when it needs one.

**Page and split shells add:**

- **`breadcrumbs`** — the line above the title. A trail, or a back link, which is a one-step
  trail. Nodes, never a route.
- **`headerContent`** — the row under the title: search, filters, tabs. Stacked in the order
  you pass them.
- **`sidebar`** — the second surface in a two-pane split. `content` is still the main one, so the
  pair reads the way it does everywhere else. `sidebarPosition`, `sidebarWidth` and `sidebarClassName` are its.
- **`level`** — not a slot: `1 | 2 | 3`, which heading element the title is. The size follows the
  element, so you never set both.

**Form components add:**

- **`control`** — the field's body. The only body in the set that is not `content`, because it is
  the only one the shell *wires* rather than places.
- **`label`** — what the control is called. Rendered as a real `<Label htmlFor>`.
- **`error`** — what is wrong with the value, as a string or a node. Falsy draws nothing.
- **`orientation`** — `vertical` (default) or `horizontal`.
- **`required`** — draws the asterisk and sets `aria-required`.
- **`asGroup`** — the label names a *group* of controls rather than one.

**Controls add:**

- **`label`** — on `ActionButton` and `ConfirmButton` it is required, and it is the accessible
  name, not a caption.
- **`hint`** — why the control is unavailable, or what it will do. Read after the name.

Rules that follow from the vocabulary:

- Give `footerActions` the buttons, not `footer`. Passing both splits the footer to its ends;
  passing only `footerActions` right-aligns it. Passing only `footer` is a footer of prose.
- Do not wrap a slot in a `<div>` to align or inset it. The shell already did.
- Do not pass a `<CardHeader>` or a `<DialogTitle>` into a slot. Slots take content; the shell
  owns the primitive.
- Adding a word to this vocabulary is a decision about the whole set, not about one component.

## What does not belong in a shell

Data fetching, form state, toasts, routing, permission checks. A shell is handed nodes and
places them. If a screen needs "disable save until valid", that is the caller's, or a form
component's — not a prop on the layout.

The line is *who owns the state*, not *how much the shell does*. `DialogLayout` asks before
closing on unsaved work (`hasUnsavedChanges`) because the state it holds — is the question up? —
is about the dialog's own interaction, not the app's data. Whether the work *is* unsaved is still
asked for, never computed: only the caller knows what its fields are.

A draggable split divider is the same case: the width it drags is state, so it belongs to
`react-resizable-panels`, not to `SidebarLayout`. A stored sidebar collapse is the same case again —
`sidebar={open ? <Nav /> : undefined}` is the whole feature, and the caller already holds `open`.
