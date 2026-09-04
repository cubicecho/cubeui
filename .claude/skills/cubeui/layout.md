# cubeui layout

Read [SKILL.md](SKILL.md) first — the slot vocabulary and the "no children" rule are there and
are not repeated here.

## Pages

`PageLayout` is a page: a title block pinned above a body that scrolls under it. It is
`StickyHeaderContentFooter` with a `PageHeader` already in the header slot, and it is what a
route should reach for first.

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

## Page shells

Reach for these when a page is not the shape `PageLayout` makes — a pane, a print sheet, a
dialog body.

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
- `HeaderContentFooter` is the same three zones with the whole thing scrolling with the page.
- Scroll position lives on the body, not the window: use `contentRef` to read or restore it.

## Page headers

`PageHeader` is the title block on its own, for when it goes in another shell's `header` slot.
It is not a page.

```tsx
<PageHeader
  title="Workspaces"
  description="Each one exposes the servers you choose."
  action={
    <>
      <Button size="sm" variant="outline"><Download /> Export</Button>
      <Button size="sm"><Plus /> New workspace</Button>
    </>
  }
  content={<SearchInput value={query} onChange={setQuery} />}
/>
```

- **The header brings its own inset, and the chassis knows.** `HeaderContentFooter` leaves its
  `header` slot unpadded on purpose and gives the body `px-4` to match, so the title lands above
  the body's first column. Do not pad the header slot, and do not wrap a `PageHeader` in a `div`
  to inset it — that seam is already joined, in one file.

  Dropped into something that already pads its children (a `<main className="p-6">`), pass
  `className="px-0"` so exactly one of the two owns the inset. That is the only case that needs a
  word from you.

- **`content` here is the row under the title** — a search field, a filter row, tabs; stacked, in
  the order you pass them. (`PageLayout` calls the same slot `headerContent`, because its own
  `content` is the page body.) There is no `search` prop, no `filters` prop and no `tabs` prop.

- **`action` is the far end, and it is one slot for all of them.** Pass a fragment of buttons; a
  status pill goes here too. The shell rows and gaps them, so two pages never disagree about the
  space between Export and New.

- **`breadcrumbs` is the line above the title.** Put a back link here rather than beside the
  title: beside it, it competes with `icon` for the same spot and takes width from the page's name.

- **`level` picks the heading**, `1` by default. A header inside a card, a pane of a split, or
  anything already under a page title passes `level={2}`. Do not pass `title={<h1>Workspaces</h1>}`
  and do not restyle the title — the level carries the size, which is the whole point of it.

- **`loading` stands in for the title**, at the title's exact height, so the page below does not
  jump when the name lands. Everything that did not come from that request — the trail, the
  buttons, the search field — stays put and stays usable.

  ```tsx
  <PageHeader breadcrumbs={<Link to="/workspaces">Workspaces</Link>} loading={isPending}
    title={workspace?.name} action={<EditButton />} />
  ```

- **The rule under the header is not a prop.** It is drawn when there is no `content` and not
  drawn when there is, because a search row already separates the header from the body and a
  second divider under it is one too many. A screen that disagrees says so in one class:
  `className="border-b-0"`.

- **A long title wraps; it never truncates**, and the buttons drop to their own line before the
  title is squeezed. That is driven by the header's real width against the action's real width,
  not by a viewport breakpoint, so it also holds for a narrow pane on a wide screen.

### What it does not have

`search`, `filters`, `tabs` — pass them as `content`. A count or status badge — put it in
`action`, or compose it into the `title` node. A back button *beside* the title — it goes in
`breadcrumbs`. A description that expands behind a popover — that is state, and state is the
caller's.

## Splits

```tsx
<SplitPane
  railSide="start"
  railWidth="sm"
  splitAt="md"
  divider="line"
  rail={<Nav />}
  content={<StickyHeaderContentFooter header={<PageHeader title="Servers" />} content={rows} />}
/>
```

`content` is the main surface and `rail` is the second one. Everything else is where the rail
sits, how wide it is, when it stops sitting there, and what is between them.

- **`railWidth` is a scale, not a number.** `auto` (an icon strip, as wide as its contents),
  `sm` / `md` / `lg` (an inspector, sized by what is in it), and `fifth` / `two-fifths` / `half`
  / `two-thirds` (a second working surface, sized by the window). Pick the nearest rung. A width
  that falls between two of them is a call site choosing, not a case for a ninth rung — the
  scale exists because the widths it replaced were spelled `w-56`, `w-72 lg:w-80`, `lg:w-52`,
  `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)` and `60%`, with no way to read which of those
  differences were decisions.
- **`splitAt` is where the two stop being side by side and start being stacked** — `md`, `lg`
  (the default), `xl`, or `always` to never stack. Stacking is the narrow-width answer: a phone
  has room for one pane after the other even when it has none for two abreast. Do not add
  `hidden md:block` to fight it.
- **`divider`** is `space` (a gap — two surfaces on a page, the default), `line` (flush, with a
  hairline between them — the app shell), or `none` (flush, nothing drawn). Do not draw the rule
  yourself with a `border-r` on the rail: that is a line between the panes only until the layout
  stacks, at which point it is a line down one side of the screen. `line` puts the rule in its
  own track so it turns with the panes.

### The things it deliberately does not do

- **It does not resize.** There is no draggable divider and no `railSize`, because a stored
  width is state and shells hold none. The divider is a rule, not a control: `aria-hidden`, no
  role, no tab stop. A screen that genuinely needs a drag wants shadcn's `resizable`
  (`react-resizable-panels`) — a different component, not a prop on this one.
- **It does not collapse, because it does not have to.** A closed sidebar is
  `rail={open ? <Nav /> : undefined}`. With no rail the split is one full-width column, no cell
  and no rule drawn and no gap spent — which is the same thing an inspector with nothing selected
  needs. The caller already holds the toggle; there is no `collapsed` prop to keep in step with it.
- **It has no `loading`.** A split has two panes that arrive at different times, and one boolean
  across both would either skeleton a nav rail that was never waiting or have to be told which
  pane it meant. Each pane's content owns its own loading state.
- **It is horizontal only.** Two zones stacked in a column with floors between them is
  `HeaderContentFooter`, which already exists. Below `splitAt` this *is* that arrangement.
- **It does not scroll.** A pane that needs to scroll is a `StickyHeaderContentFooter` passed as
  `content` or `rail` — which is also where the tab stop that a scrolling region owes a keyboard
  user comes from. Do not put `overflow-y-auto` on a pane by hand; it will scroll without a floor
  above it and without a way to reach it.

### List-and-detail

A split is the right shape when both panes are on the screen together and the selection moves
between them. It is the wrong shape when the detail is a place you *go* — if there is a
`/things/:id` route, keep the route and let the detail be its own page. A `SplitPane` that has to
be told to hide one of its panes on a phone is that decision arriving late.

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
- A form in a dialog is this component with a `<form>` as `content` — see [forms.md](forms.md).

## Sections

A heading over a group of fields or rows, inside a page or a card.

```tsx
<Section
  title="Danger zone"
  description="These cannot be undone."
  content={<ConfirmButton label="Delete project" … />}
/>
```

- The title is a real `<h2>`, and the level is fixed on purpose: `PageHeader` owns the `h1`, so
  this is always the one below it. There is no `level` prop, because it would be an invitation to
  get that wrong. A screen reader's heading list is how a form of thirty fields is navigated.
- It draws **no surface** — no border, no padding box. Wrapping the group in a `Card` stays a
  decision at the call site, and `CardLayout` is the component that owns a surface.
- `rule` adds a hairline under the heading. Off by default.
- It is the smallest thing in the registry and it exists because three projects wrote
  `text-xs font-semibold uppercase` plus a muted foreground from memory, and each got the sixth
  token different (`tracking-wider`, `tracking-wide`, `border-b pb-1`). A shared token has no
  answer for that, because the value being retyped *is* a class list.
