# cubeui layout: Page headers

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.
The page that puts this header over a scrolling body is `PageLayout`, in [pages.md](pages.md#pages).

## Page headers

`PageHeader` is the title block on its own, for when it goes in another shell's `headerSlot`.
It is not a page.

```tsx
<PageHeader
  title="Workspaces"
  description="Each one exposes the servers you choose."
  actionSlot={
    <>
      <Button size="sm" variant="outline" iconSlot={<Download />} content="Export" />
      <Button size="sm" variant="info" iconSlot={<Plus />} content="New workspace" />
    </>
  }
  contentSlot={<SearchInput label="Search workspaces" value={query} onChangeText={setQuery} />}
/>
```

<!-- props:PageHeader -->
`PageHeader`'s props, from the TSDoc in `registry/layout/page-header.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `SlotNode` |  | The row under the title block: a search field, a filter row, a set of tabs — stacked, each on its own line, in the order they are passed. |
| `title` (required) | `ReactNode` |  | What the page is called. Required, because a header with no title is a toolbar, and a toolbar is a row of nodes the caller can place without help. It is also the heading assistive technology navigates the page by. |
| `description` | `ReactNode` |  | One line on what the page is for. It wraps; it is not clipped. |
| `iconSlot` | `SlotNode` |  | Sits before the title. On the web it is sized with the title — pass a bare `<Users />`, not a sized one. On device an icon cannot be sized from outside it, so pass it at the size you want. |
| `actionSlot` | `SlotNode` |  | The header's far end: the page's buttons, a status pill, a menu. A fragment of them is fine — the shell rows and gaps them, so two pages never disagree about the space between New and Import, and a caller never has to know whether this slot wraps its children (in one app it does and in its sibling it does not, which is why their spacing differs by 4px). |
| `backSlot` | `SlotNode` |  | The way back, on the line above the title: a back link, or a breadcrumb trail, which is a back link with more steps. |
| `breadcrumbsSlot` | `SlotNode` |  | **Deprecated.** Renamed `backSlot`. Read when `backSlot` is not passed. |
| `loading` | `boolean` | `false` | Whether the title is still being fetched. On, a bar of the title's own height stands in for it — and for the description, when one was passed — so the page beneath does not jump when the name lands. |
| `level` | `1 \| 2 \| 3` | `1` | Which heading this is. `1` names a page; `2` names a section, a pane in a split, or a card that already sits under a page title; `3` goes a level below that. The size follows it unless `size` says otherwise. |
| `size` | `"lg" \| "md" \| "sm"` |  | How large the title is drawn, apart from which heading it is: `lg` (24px), `md` (20px) or `sm` (16px). Left out, it follows `level` — `lg` at 1, `md` at 2, `sm` at 3. A page whose header is mostly controls (a chat with its model picker) keeps `level={1}` and passes `size="sm"`, rather than taking a lower heading to get a smaller title. The rule under the header follows `level`, not this. |
| `className` | `string` |  | On the header's own box, which draws the rule under it: `border-b-0` takes the rule away. |
| `titleClassName` | `string` |  | On the title's own `Text`. Its size comes from `size`; this is for anything else. |
| `contentClassName` | `string` |  | On the box that holds `contentSlot`, under the title row. |
<!-- /props -->

- **The header brings its own inset, and the shell around it knows.** `HeaderContentFooter` leaves its
  `headerSlot` unpadded on purpose and gives the body `px-4` to match, so the title lands above
  the body's first column. Do not pad the header slot, and do not wrap a `PageHeader` in a `div`
  to inset it — that seam is already joined, in one file.

  Dropped into something that already pads its children (a `<main className="p-6">`), pass
  `className="px-0"` so exactly one of the two owns the inset. That is the only case that needs a
  word from you.

- **`contentSlot` here is the row under the title** — a search field, a filter row, tabs; stacked, in
  the order you pass them. (`PageLayout` calls the same slot `headerContentSlot`, because its own
  `contentSlot` is the page body.) There is no `search` prop, no `filters` prop and no `tabs` prop.

- **`actionSlot` is the far end, and it is one slot for all of them.** Pass a fragment of buttons; a
  status pill goes here too. The shell rows and gaps them, so two pages never disagree about the
  space between Export and New.

- **`backSlot` is the way back, above the title**: a back link, or a breadcrumb trail. Put a back
  button here, not in `iconSlot`: that is the page's own icon, and a back button beside the title
  takes width from the page's name. `breadcrumbsSlot` is the old name, still read when `backSlot`
  is not passed, for one release. Under it, the title row is a button's height.

- **`level` picks the heading**, `1` by default. A header inside a card, a pane of a split, or
  anything already under a page title passes `level={2}`. Do not pass `title={<h1>Workspaces</h1>}`
  and do not restyle the title — the level carries the size.
- **`size` is the title's size apart from its heading**: `lg`, `md` or `sm`, following `level` when
  left out. A page whose header is mostly controls (a chat with a model picker) stays `level={1}`
  and passes `size="sm"`; do not take `level={3}` for a small title. The rule follows `level`.
  `PageLayout` takes `size` too.

- **`loading` stands in for the title**, at the title's exact height, so the page below does not
  jump when the name lands. Everything that did not come from that request — the trail, the
  buttons, the search field — stays put and stays usable.

  ```tsx
  <PageHeader backSlot={<Link to="/workspaces">Workspaces</Link>} loading={isPending}
    title={workspace?.name} actionSlot={<Button content="Edit" />} />
  ```

- **The rule under the header is not a prop.** At level 1 it is drawn when there is no
  `contentSlot` and not drawn when there is, because a search row already separates the header from the body and a
  second divider under it is one too many. A screen that disagrees says so in one class:
  `className="border-b-0"`.

- **A long title wraps; it never truncates**, and the buttons drop to their own line before the
  title is squeezed under `10rem`. That is driven by the header's real width against the action's
  real width, not by a viewport breakpoint, so it also holds for a narrow pane on a wide screen,
  and a short title keeps its button beside it on a phone.
- **The action lines up with the title**, not with the middle of the title and description, as a
  `CardLayout`'s does. The description stops at `max-w-prose` (about 65 characters a line), however
  wide the page is.

### What it does not have

`search`, `filters`, `tabs` — pass them as `contentSlot`. A count or status badge — put it in
`actionSlot`, or compose it into the `title` node. A back button *beside* the title, or in `iconSlot` —
it goes in `backSlot`. A description that expands behind a popover — that is state, and state is the
caller's.
