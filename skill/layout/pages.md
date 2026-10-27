# Pages, page shells and page headers

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Pages

`PageLayout` is a page: a title block pinned above a body that scrolls under it. It is
`StickyHeaderContentFooter` with a `PageHeader` already in the header slot, and it is what a
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

`headerContentSlot` is the row under the title: search, filters, tabs. Passing it removes the rule
under the header, which is correct — the search row is already the separator.

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
<StickyHeaderContentFooter
  width="page"
  headerSlot={<PageHeader title="Vendors" description="Suppliers inventory is purchased from." />}
  contentSlot={<DataTable columns={columns} data={rows} />}
  footerSlot={<Pagination page={page} onPageChange={setPage} />}
/>
```

- `width="page"` caps and centres every slot on one column, so the title sits above the first
  table column rather than beside it. `width="full"` (the default) fills the box it was given —
  panes inside a split, print sheets, anything already in a column of its own.
- The sticky variant needs a **height to divide**. It defaults to `h-full`; the ancestors up to
  the viewport need to give it one, or nothing scrolls and the header does not stay.
- `HeaderContentFooter` is the same three zones with the whole thing scrolling with the page.
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
  contentSlot={<SearchInput value={query} onChange={setQuery} />}
/>
```

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

- **`breadcrumbsSlot` is the line above the title.** Put a back link here rather than beside the
  title: beside it, it competes with `iconSlot` for the same spot and takes width from the page's name.

- **`level` picks the heading**, `1` by default. A header inside a card, a pane of a split, or
  anything already under a page title passes `level={2}`. Do not pass `title={<h1>Workspaces</h1>}`
  and do not restyle the title — the level carries the size, which is the whole point of it.

- **`loading` stands in for the title**, at the title's exact height, so the page below does not
  jump when the name lands. Everything that did not come from that request — the trail, the
  buttons, the search field — stays put and stays usable.

  ```tsx
  <PageHeader breadcrumbsSlot={<Link to="/workspaces">Workspaces</Link>} loading={isPending}
    title={workspace?.name} actionSlot={<Button content="Edit" />} />
  ```

- **The rule under the header is not a prop.** It is drawn when there is no `contentSlot` and not
  drawn when there is, because a search row already separates the header from the body and a
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
`actionSlot`, or compose it into the `title` node. A back button *beside* the title — it goes in
`breadcrumbsSlot`. A description that expands behind a popover — that is state, and state is the
caller's.

## Centered pages

The sign-in page, the token gate, the "check your email" screen: one card in the middle of a page
of its own. `CenteredLayout` is that page — full height, centred both ways, `p-4` off the edges —
around a `max-w-sm` `CardLayout`, and it takes every slot the card takes, under the same names.
The card is the page here, so its title is the page's: an `h1` at `text-xl`, as `PageHeader`'s
level 1, not a card title. `level` and `titleClassName` still override it.

```tsx
<CenteredLayout
  iconSlot={<KeyRound />}
  title="Authentication required"
  description="Enter the router token from settings.json."
  contentSlot={
    <form id="token" onSubmit={submit}>
      <FormField label="Token" controlSlot={<Input type="password" value={token} onChangeText={setToken} />} />
    </form>
  }
  footerActionsSlot={
    <Button type="submit" form="token" disabled={!token.trim()} content="Unlock" />
  }
/>
```

Render it *instead of* the app shell, not inside it: on the web its root is the page's `<main>`,
and `min-h-svh` tall. `className` is that page — a `bg-background`, a different padding.
`cardClassName` is the card: `cardClassName="max-w-md"` for a wider one, which replaces the cap.

On device the root is a `ScrollView` filling the screen, so a form in the card stays reachable
when the keyboard comes up, and a tap on the submit button is not spent dismissing the keyboard.
Do not wrap it in a `KeyboardAvoidingView` or a `ScrollView` of your own.

A sign-in with no card — a heading and a form on the bare background — is not this shape; lay
that out with `Page` or by hand rather than stripping the card with `cardClassName`.
