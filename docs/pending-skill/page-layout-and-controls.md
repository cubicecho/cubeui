# Pending: the `PageLayout` and control sections of SKILL.md

Fold into `.claude/skills/cubeui/SKILL.md`. Written in that file's voice.

---

## 1. Add to the "Choosing" table

| The shape you are building | Use |
| --- | --- |
| A whole page — a title, buttons, and rows under them | `PageLayout` |
| An icon-only button | `ActionButton` |
| A button that deletes, discards, revokes or resets | `ConfirmButton` |

## 2. Pages

`PageLayout` is a page: a title block pinned above a body that scrolls under it.

```tsx
<PageLayout
  title="Workspaces"
  description="Each one exposes the servers you choose."
  action={<Button size="sm"><Plus /> New workspace</Button>}
  headerContent={<Input aria-label="Search workspaces" placeholder="Search workspaces" />}
  width="page"
  content={<WorkspaceList />}
/>
```

**Do not write the column yourself.** No `mx-auto max-w-3xl`, no `min-h-0 flex-1 overflow-y-auto`,
no `<header className="border-b px-6 py-4">`. `width` is the whole vocabulary:

- `page` — a list, a board, a table. The default.
- `prose` — settings, a detail page, a form. A reading column.
- `full` — a pane already inside someone else's column.

Three names because there were 51 capped page columns across these projects wearing 10 different
widths, and two apps that had each extracted a `Page` component still disagreed on what their
`wide` boolean meant. If none of the three is right, the page wants `HeaderContentFooter`
directly — not a fourth name.

`headerContent` is the row under the title: search, filters, tabs. Passing it removes the rule
under the header, which is correct — the search row is already the separator.

`loading` waits the **title**, not the body. The buttons and the search field stay usable. The
body's own loading state is the caller's, or `CardLayout`'s.

`PageLayout` does not own the sidebar, the theme toggle, or the route. That is an app shell, and
shadcn ships `sidebar` for it.

## 3. Icon buttons

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
```

`hint` replaces `label` in the tooltip; the accessible name stays `label` either way. Pass
`tooltip={false}` for a row that already explains itself.

## 4. Destructive buttons

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
