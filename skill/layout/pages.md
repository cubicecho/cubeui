# cubeui layout: Pages, page shells and grids

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.
The title block on its own is in [page-headers.md](page-headers.md#page-headers), and a page that is
one card in the middle of the screen is in [centered-pages.md](centered-pages.md#centered-pages).

**Contents**

- [Pages](#pages)
- [Page shells](#page-shells)
- [Grids](#grids)

## Pages

`PageLayout` is a page: a title block pinned above a body that scrolls under it. It is
`HeaderContentFooter scroll` with a `PageHeader` already in the header slot, and it is what a
route should reach for first.

```tsx
<PageLayout
  title="Workspaces"
  description="Each one exposes the servers you choose."
  actionSlot={<Button size="sm" variant="info" iconSlot={<Plus />} content="New workspace" />}
  headerContentSlot={<Input aria-label="Search workspaces" placeholder="Search workspaces" />}
  width="page"
  contentSlot={<WorkspaceList />}
/>
```

<!-- props:PageLayout -->
`PageLayout`'s props, from the TSDoc in `registry/layout/page-layout.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` (required) | `SlotNode` |  | The page. The only slot that scrolls, unless `scroll` is off. |
| `title` (required) | `ReactNode` |  | What the page is called. Required for the same reason it is on `PageHeader`. |
| `description` | `ReactNode` |  | One line on what the page is for. |
| `iconSlot` | `SlotNode` |  | Sits before the title, sized with it. Pass a bare `<Users />`. |
| `actionSlot` | `SlotNode` |  | The header's far end: the page's buttons, a status pill, a menu. |
| `backSlot` | `SlotNode` |  | The way back, above the title: a back link, or a breadcrumb trail. |
| `breadcrumbsSlot` | `SlotNode` |  | **Deprecated.** Renamed `backSlot`. Read when `backSlot` is not passed. |
| `headerContentSlot` | `SlotNode` |  | The row under the title: a search field, a filter row, tabs. It is `PageHeader`'s `contentSlot` slot, named for the part it belongs to because this component's own `contentSlot` is the page. |
| `headerBarSlot` | `SlotNode` |  | Bars under the title that run the full width while the title keeps its column: a second toolbar, a notice pinned with the header, a strip of the page's state. Stacked in the order passed, each as wide as the page; a bar draws its own fill and inset (`px-4`). Pinned with the title, so it is there wherever the body has scrolled to. Tabs that should line up with the title go in `headerContentSlot` instead. |
| `loading` | `boolean` | `false` | Whether the *title* is still being fetched. The body is the caller's to place. |
| `level` | `PageHeaderLevel` | `1` | Which heading the title is. `1` unless this page is nested inside another's chrome. |
| `size` | `PageHeaderSize` |  | How large the title is drawn, apart from `level`: `lg`, `md` or `sm`, following `level` when left out. `size="sm"` is a compact title on a page that is still the `h1`. |
| `footerSlot` | `SlotNode` |  | Pinned under the body: paging, totals, a save bar. Absent, no row is drawn. |
| `width` | `"full" \| "page" \| "prose"` | `"page"` | The column the header and body share. `page` for a list or a board, `prose` for settings, a detail page or a form, `full` for a pane that is already inside someone else's column. |
| `scroll` | `boolean` | `true` | Whether the body scrolls. On unless the page fills the height and scrolls its own parts: a chat's message list over a pinned composer, a framed app, tab panels that each keep their place. Off, the body is the height left under the header and `contentSlot` divides it. |
| `contentRef` | `Ref<ScrollView>` |  | The scrolling body, for a caller that has to reach it — restoring a scroll position. |
| `scrollRef` | `Ref<ScrollHandle>` |  | A handle that moves the body: `scrollToEnd()`, the same on both halves. |
| `onScroll` | `((position: ScrollPosition) => void)` |  | Called as the body scrolls, with where it now is. Never called while `scroll` is off. |
| `className` | `string` |  |  |
| `headerClassName` | `string` |  | On the whole header — the title block and `headerBarSlot` — which runs the full width. The rule under it is here: `border-b-0` removes it, and `border-b border-foreground/10` draws it under a `headerContentSlot`, which otherwise has none. |
| `contentClassName` | `string` |  | Merged after the body's own `gap-4 py-4`, so `py-0` or `gap-6` replaces just that half. The body's `px-4` comes with `width` and is not here. |
| `footerClassName` | `string` |  |  |
<!-- /props -->

**Do not write the column yourself.** No `mx-auto max-w-3xl`, no `min-h-0 flex-1 overflow-y-auto`,
no `<header className="border-b px-6 py-4">`. `width` is the whole vocabulary:

- `page` — a list, a board, a table. The default.
- `prose` — settings, a detail page, a form. A reading column.
- `full` — a pane already inside someone else's column.

Three names because there were 51 capped page columns across these projects wearing 10 different
widths, and two apps that had each extracted a `Page` component still disagreed on what their
`wide` boolean meant. If none of the three is right, the page wants `HeaderContentFooter`
directly — not a fourth name.

The body is spaced already: `gap-4 py-4` on every width, so the first block sits 16px under the
header and the blocks a page stacks sit 16px apart. Do not add `contentClassName="gap-4 py-4"` or
wrap `contentSlot` in a `<div className="space-y-4 py-4">`. `contentClassName` is merged after it,
so a page whose rows run flush to the rule passes `py-0` (or `gap-0`) and changes only that half.

`headerContentSlot` is the row under the title: search, filters, tabs. It keeps the title's
column. Passing it removes the rule under the header, which is correct — the search row is already
the separator. Each node keeps its own width (a search field fills the line); a filter row of
your own passes `self-stretch`.

**The header runs the full width; the title keeps the column.** The rule under the header is drawn
on the whole header, so it runs the width of the page whatever `width` is, while the title, its
buttons and `headerContentSlot` sit over the body's column. `headerClassName` is on that whole
header: `border-b-0` removes the rule, and `border-b border-foreground/10` draws it under tabs in
`headerContentSlot`, which otherwise have none.

`headerBarSlot` is for bars under the title that run the full width: a second toolbar, a notice
pinned with the header, a strip of the page's state. They stack in the order passed, above the
rule, and each draws its own fill and inset (`px-4`). Like the title, they stay while the body
scrolls. Do not write the page out as `HeaderContentFooter` with a `PageHeader` and a bar in its
header for this:

```tsx
<PageLayout
  title={project.name}
  actionSlot={<ProjectMenu />}
  headerBarSlot={
    <>
      <ProjectBar project={project} />
      {notice ? <Text className="px-4 pt-3 text-foreground/60 text-sm">{notice}</Text> : null}
    </>
  }
  contentSlot={board}
/>
```

`footerSlot` is pinned under the body, and is drawn as the header is: a `border-foreground/10` rule
above it and `py-3` round it, so a count or a "Last saved" line does not read as one more row of
the list. `footerClassName` is merged after, for the footer that wants no rule (`border-t-0`).

Tabs whose list is in the header and whose panels are in the body are one set of tabs with one
root around the whole page. Give the root `h-full`, so the page still fills what it is in:

```tsx
<Tabs value={tab} onValueChange={setTab} className="h-full">
  <PageLayout
    title="Settings"
    headerContentSlot={
      <TabsList aria-label="Settings">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="agents">Agents</TabsTrigger>
      </TabsList>
    }
    contentSlot={
      <>
        <TabsContent value="general"><GeneralSettings /></TabsContent>
        <TabsContent value="agents"><AgentSettings /></TabsContent>
      </>
    }
  />
</Tabs>
```

Not two `Tabs` roots sharing a `value`: each root names its own tabs and panels, so a panel in the
body would no longer be named by its tab. Not a `className="contents"` wrapper either. For tabs
that are routes, the triggers take `linkSlot` and the body is one `TabsContent` holding the route
(see the tabs notes under [controls/icons.md](../controls/icons.md#icons)).

`scroll={false}` is for a page that fills the height and scrolls its own parts: a chat's message
list over a pinned composer, a framed app, tab panels that each keep their place. The body is
then the height left under the header, and `contentSlot` divides it (`h-full`, or `flex-1` on
device). It is still a `PageLayout` — do not drop to `HeaderContentFooter` for this.

`loading` waits the **title**, not the body. The buttons and the search field stay usable. The
body's own loading state is the caller's, or `CardLayout`'s.

`PageLayout` does not own the sidebar, the theme toggle, or the route. That is an app shell: put
a [`Sidebar`](sidebar.md#sidebar) and the page side by side in a `SidebarLayout`.

## Page shells

Reach for these when a page is not the shape `PageLayout` makes — a pane, a print sheet, a
dialog body.

```tsx
<HeaderContentFooter
  scroll
  className="h-full"
  width="page"
  headerSlot={<PageHeader title="Vendors" description="Suppliers inventory is purchased from." />}
  contentSlot={<DataTable columns={columns} data={rows} />}
  footerSlot={<Pagination page={page} onPageChange={setPage} />}
/>
```

<!-- props:HeaderContentFooter -->
`HeaderContentFooter`'s props, from the TSDoc in `registry/layout/header-content-footer.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` (required) | `SlotNode` |  | The body. The only slot that grows. |
| `headerSlot` | `SlotNode` |  | Page title, toolbar, filters — whatever stays above the body. Absent, no row is drawn. |
| `footerSlot` | `SlotNode` |  | Paging, totals, a save bar. Absent, no row is drawn. |
| `scroll` | `boolean` | `false` | Whether the body scrolls inside the chassis rather than growing it. |
| `width` | `HeaderContentFooterWidth` | `"full"` | - `full` — slots fill whatever box the chassis was given. Print sheets, dialogs, and anything already inside its own column. - `page` — slots share the capped, centred `PAGE_COLUMN`, inset to match the header. Every list page, every board. - `prose` — the narrower `PROSE_COLUMN`. Settings, a detail page, a form. |
| `headerWidth` | `HeaderContentFooterWidth` |  | The header's own column, when it is not the body's: `full` lets a rule under the header, and a bar in it, run the full width over a body held to `page` or `prose`. What in the header should still sit over the body's column holds itself to it, with `COLUMNS[width]`. Absent, the header shares `width`. |
| `contentRef` | `Ref<ElementRef<typeof ScrollView>>` |  | The scrolling body, for a caller that has to reach it — restoring a scroll position. A `<div>` on the web and, while `scroll` is on, the `ScrollView` on device. |
| `scrollRef` | `Ref<ScrollHandle>` |  | A handle that moves the body: `scrollRef.current?.scrollToEnd()`, the same on both halves. It does nothing while `scroll` is off, when there is no scrolling body to move. |
| `onScroll` | `((position: ScrollPosition) => void)` |  | Called as the body scrolls, with where it now is — the same three numbers on the web and on device, so a list that follows its newest row can tell whether the reader is still at the end. Only a body that scrolls reports: with `scroll` off it is never called. |
| `className` | `string` |  |  |
| `headerClassName` | `string` |  |  |
| `contentClassName` | `string` |  | On the box that holds `contentSlot`. With `scroll` and a `page` or `prose` width, that is the column inside the scroller, which runs the full width so its scrollbar is at the edge. On device, while `scroll` is on, it is the `ScrollView`'s content. Otherwise the body is one box. |
| `footerClassName` | `string` |  |  |
<!-- /props -->

- `width="page"` caps and centres every slot on one column, so the title sits above the first
  table column rather than beside it. `width="full"` (the default) fills the box it was given —
  panes inside a split, print sheets, anything already in a column of its own.
- `headerWidth` gives the header a column of its own: `headerWidth="full"` over a `page` or `prose`
  body lets a rule on `headerClassName`, or a bar in the header, run the full width. What in the
  header should stay over the body holds itself to `COLUMNS[width]`, exported beside the shell.
  `PageLayout` is built this way; reach for it first.
- **`scroll` needs a height to divide.** Give the frame one (`className="h-full"`, or `flex-1` in
  a column), and the ancestors up to the viewport theirs, or nothing scrolls and the header does
  not stay. `StickyHeaderContentFooter`, the preset that set `scroll` and `h-full`, is gone; write
  the two out.
- Without `scroll` it is the same three zones with the whole thing scrolling with the page.
- With `scroll` and a `page` or `prose` width, the body that scrolls runs the full width of the
  chassis and the column is inside it, so the scrollbar is at the edge of the area. The column is
  `data-slot="header-content-footer-column"`, and `contentClassName` is on it: on the column, as
  on device, where it is the `ScrollView`'s content. `data-slot="header-content-footer-content"`
  and `contentRef` are the scroller. Without a column, or without `scroll`, the body is one box.
- On the web a scrolling body is a tab stop while it has something to scroll, so a keyboard can
  scroll it, and a body that fits is not a stop of its own. Tabbed to, a 1px `active` line is drawn
  inside its edge, as a focused field's border is, and no ring; a click on it shows nothing. The
  line takes no room, but something with a fill laid against the edge covers it there.
- Scroll position lives on the body, not the window: use `contentRef` to read or restore it.
- `onScroll` reports where the body is as it moves: `{ offset, contentHeight, viewportHeight }`, in
  pixels, the same on both halves. A list that follows its newest row is at the end when
  `offset + viewportHeight >= contentHeight - 1`; keep that in state, scroll to the end when a row
  arrives and it is true, and show "Jump to latest" when it is not. It is on `PageLayout` too, and
  is never called while `scroll` is off.
- `scrollRef` moves the body, with one call on both halves:
  `scrollRef.current?.scrollToEnd()`. It glides unless told `{ animated: false }`, which is what a
  list following a row that is still streaming in wants. It is on `PageLayout` too. Do not reach
  through `contentRef` for this: that is the element itself, a `<div>` on the web and a
  `ScrollView` on a device, and the two share no method.

  ```tsx
  const scrollRef = useRef<ScrollHandle>(null);
  const [atEnd, setAtEnd] = useState(true);

  <PageLayout
    scrollRef={scrollRef}
    onScroll={(p) => setAtEnd(p.offset + p.viewportHeight >= p.contentHeight - 1)}
    …
  />
  {atEnd ? null : (
    <Button variant="outline" content="Jump to latest" onPress={() => scrollRef.current?.scrollToEnd()} />
  )}
  ```

## Grids

`GridLayout` (`@cubeui/grid-layout`) lays out equal cells in rows: one to a row on a phone, two
from `sm`, three from `lg`, four from `xl`. Each element of `contentSlot` is one cell, so pass the
cards as an array or a fragment; both are opened, and a `null` left by a condition is dropped.

```tsx
<GridLayout contentSlot={projects.map((project) => <ProjectCard key={project.id} project={project} />)} />
```

- The cells hold anything of one kind: cards, stat tiles, a gallery of images. The width is on the
  cell `GridLayout` draws, so a card in it carries no width of its own.
- It has no empty or loading state. `LoadState` goes above it, as it does above a list.
- It was `CardGrid` in `@cubeui/page`, an item that is gone; only the import and the name change.

<!-- props:GridLayout -->
`GridLayout`'s props, from the TSDoc in `registry/layout/grid-layout.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` (required) | `SlotNode` |  | The cells, as an array or a fragment: cards, tiles, anything of one kind. Both are opened, so a fragment of three cards is three cells and not one. |
| `className` | `string` |  |  |
<!-- /props -->
