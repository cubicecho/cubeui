# Pending SKILL.md section — `PageHeader`

To be folded into `.claude/skills/cubeui/SKILL.md` after this branch merges. Written in that
file's voice so it can be moved across mostly as-is. Three edits, in the order they appear there.

---

## 1. In the frontmatter `description`

Add `PageHeader` to the component list, and add "a page title block" to the list of shapes worth
reading this before building.

## 2. In **Choosing**, one new row

| The shape you are building | Use |
| --- | --- |
| The title block at the top of a page: name, buttons, search | `PageHeader` |

It goes in another shell's `header` slot. It is not a page on its own.

## 3. In **The slot vocabulary**, two words and one clarification

- **`breadcrumbs`** — the line above the title. A trail, or a back link, which is a one-step
  trail. Nodes, never a route.
- **`level`** — not a slot: `1 | 2 | 3`, which heading element the title is. The size follows the
  element, so you never set both.

And `loading` keeps its meaning while changing its target. On a card it replaces the body and
leaves the title alone. On a page header it replaces the **title**, because on a page the title
is usually the thing the request returned.

## 4. A new section, after **Page shells**

## Page headers

```tsx
<StickyHeaderContentFooter
  width="page"
  header={
    <PageHeader
      title="Vendors"
      description="Suppliers inventory is purchased from."
      action={
        <>
          <Button size="sm" variant="outline"><Download /> Export</Button>
          <Button size="sm"><Plus /> New vendor</Button>
        </>
      }
      content={<SearchInput value={query} onChange={setQuery} />}
    />
  }
  content={<DataTable columns={columns} data={rows} />}
/>
```

- **The header brings its own inset, and the chassis knows.** `HeaderContentFooter` leaves its
  `header` slot unpadded on purpose and gives the body `px-4` to match, so the title lands above
  the body's first column. Do not pad the header slot, and do not wrap a `PageHeader` in a `div`
  to inset it — that seam is already joined, in one file.

  Dropped into something that already pads its children (a `<main className="p-6">`), pass
  `className="px-0"` so exactly one of the two owns the inset. That is the only case that needs a
  word from you.

- **`content` here is the row under the title**: a search field, a filter row, tabs — stacked, in
  the order you pass them. There is no `search` prop, no `filters` prop and no `tabs` prop; there
  is one slot and the order you write.

- **`action` is the far end, and it is one slot for all of them.** Pass a fragment of buttons; a
  status pill goes here too. The shell rows and gaps them, so two pages never disagree about the
  space between Export and New.

- **`breadcrumbs` is the line above the title.** Put a back link here rather than beside the
  title: beside it, it competes with `icon` for the same spot and takes width from the page's
  name.

- **`level` picks the heading**, `1` by default. A header inside a card, a pane of a split, or
  anything already under a page title passes `level={2}`. Do not pass `title={<h1>Vendors</h1>}`
  and do not restyle the title — the level carries the size, which is the whole point of it.

- **`loading` stands in for the title**, at the title's exact height, so the page below does not
  jump when the name lands. Pass the query's pending flag. Everything that did not come from that
  request — the trail, the buttons, the search field — stays put and stays usable.

  ```tsx
  <PageHeader
    breadcrumbs={<Link to="/vendors">Vendors</Link>}
    loading={isPending}
    title={vendor?.name}
    action={<EditButton />}
  />
  ```

- **The rule under the header is not a prop.** It is drawn when there is no `content` and not
  drawn when there is, because a search row already separates the header from the body and a
  second divider under it is one too many. A screen that disagrees says so in one class:
  `className="border-b-0"`.

- **A long title wraps; it never truncates**, and the buttons drop to their own line before the
  title is squeezed. That is driven by the header's real width against the action's real width,
  not by a viewport breakpoint, so it also holds for a narrow pane on a wide screen. None of it is
  yours to configure.

### What it does not have

`search`, `filters`, `tabs` — pass them as `content`. A count or status badge — put it in
`action`, or compose it into the `title` node. A back button *beside* the title — it goes in
`breadcrumbs`. A description that expands behind a popover — that is state, and state is the
caller's.
