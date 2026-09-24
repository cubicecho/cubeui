# cubeui layout

Read [SKILL.md](SKILL.md) first — the slot vocabulary and the "no children" rule are there and
are not repeated here.

**Both halves, one source.** Pages, page shells, page headers, splits, cards, dialogs,
sections and sidebars are written once in React Native and compiled to the web, so the same item
installs in a Vite app and an Expo app with the same props. The list-page parts at the end are
the exception: `DisclosureRow` is web-only, and `QueryState` is its own item on each half. On a
device, four things differ, and none of them changes a call site:

- `HeaderContentFooter`'s body is a `ScrollView` when it scrolls, so `contentRef` is the
  `ScrollView` there (a `<div>` on the web), and `contentClassName` styles its content container.
- An `icon` is not sized for you on a device — there is no `[&_svg]` selector — so pass it at
  `size-4` yourself (`size-5` in a level 1 or 2 `PageHeader`).
- A split's two panes are a flex row, not grid tracks. The widths and `stackBelow` read the same.
- A string or number passed to a slot is wrapped in a `Text` for you, so a bare `"Save"` does not
  crash a `View`. A node you build yourself still needs its own `Text`.

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

`PageLayout` does not own the sidebar, the theme toggle, or the route. That is an app shell: put
a [`Sidebar`](#sidebar) and the page side by side in a `SidebarLayout`.

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

- **The header brings its own inset, and the shell around it knows.** `HeaderContentFooter` leaves its
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
<SidebarLayout
  sidebarPosition="start"
  sidebarWidth="sm"
  stackBelow="md"
  divider="line"
  sidebar={<Nav />}
  content={<StickyHeaderContentFooter header={<PageHeader title="Servers" />} content={rows} />}
/>
```

`content` is the main surface and `sidebar` is the second one. Everything else is where the sidebar
sits, how wide it is, when it stops sitting there, and what is between them.

**`SidebarLayout` is a preset of `SplitLayout`**, which is the same shape with the roles taken out:

```tsx
<SplitLayout
  first={<Original />}
  second={<Translation />}
  stackBelow="md"
  firstWidth="two-thirds"
/>
```

Reach for the base when the two panes are genuinely comparable — a diff, two lists abreast, a form
beside its preview. Its slots are numbered because neither alternative stays true: `content` /
`sidebar` claims a ranking an even split does not have, and `left` / `right` is wrong below
`stackBelow`, where the panes are one above the other, and wrong again right-to-left. `first` is
first in reading order, wherever reading is going.

Either pane can carry the width — `firstWidth` **or** `secondWidth`, the same scale, never both.
Neither set is an even split. Everything below applies to both, and every prop but the widths and
the slots is spelled the same on each.

- **`sidebarWidth` is a scale, not a number.** `auto` (an icon strip, as wide as its contents),
  `sm` / `md` / `lg` (an inspector, sized by what is in it), and `fifth` / `two-fifths` / `half`
  / `two-thirds` (a second working surface, sized by the window). Pick the nearest one. A width
  that falls between two of them is a call site choosing, not a case for a ninth step — the
  scale exists because the widths it replaced were spelled `w-56`, `w-72 lg:w-80`, `lg:w-52`,
  `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)` and `60%`, with no way to read which of those
  differences were decisions.
- **`stackBelow` is the width under which the two stop sitting side by side and stack instead**
  — `md`, `lg` (the default), `xl`, or `never` to keep them side by side at every width. Stacking is the narrow-width answer: a phone
  has room for one pane after the other even when it has none for two abreast. Do not add
  `hidden md:block` to fight it.
- **`divider`** is `space` (a gap — two surfaces on a page, the default), `line` (flush, with a
  hairline between them — the app shell), or `none` (flush, nothing drawn). Do not draw the rule
  yourself with a `border-r` on the sidebar: that is a line between the panes only until the layout
  stacks, at which point it is a line down one side of the screen. `line` draws the rule as its
  own element between the panes, so it turns with them.

### The things it deliberately does not do

- **It does not resize.** There is no draggable divider and no `onWidthChange`, because a stored
  width is state and shells hold none. The divider is a rule, not a control: `aria-hidden`, no
  role, no tab stop. A screen that genuinely needs a drag wants shadcn's `resizable`
  (`react-resizable-panels`) — a different component, not a prop on this one.
- **It does not collapse, because it does not have to.** A closed sidebar is
  `sidebar={open ? <Nav /> : undefined}`. With no sidebar it is one full-width column, no cell
  and no rule drawn and no gap spent — which is the same thing an inspector with nothing selected
  needs. The caller already holds the toggle; there is no `collapsed` prop to keep in step with it.
- **It has no `loading`.** A split has two panes that arrive at different times, and one boolean
  across both would either skeleton a navigation column that was never waiting or have to be told which
  pane it meant. Each pane's content owns its own loading state.
- **It is horizontal only.** Two zones stacked in a column, each able to scroll, is
  `HeaderContentFooter`, which already exists. Below `stackBelow` this *is* that arrangement.
- **It does not scroll.** A pane that needs to scroll is a `StickyHeaderContentFooter` passed as
  `content` or `sidebar` — which is also where the tab stop that a scrolling region owes a keyboard
  user comes from. Do not put `overflow-y-auto` on a pane by hand; without a height above it to
  divide, it will not scroll, and it gives a keyboard user no way in.

### List-and-detail

A split is the right shape when both panes are on the screen together and the selection moves
between them. It is the wrong shape when the detail is a place you *go* — if there is a
`/things/:id` route, keep the route and let the detail be its own page. A `SidebarLayout` that has to
be told to hide one of its panes on a phone is that decision arriving late.

## Sidebar

```tsx
<SidebarLayout
  sidebarWidth="auto"
  stackBelow="never"
  divider="none"
  sidebar={
    <Sidebar
      label="Main"
      header={<Brand />}
      content={
        <SidebarSection
          as="nav"
          title="Projects"
          action={<Button variant="ghost" size="xs" aria-label="New project"><Plus /></Button>}
          status={<QueryState compact query={projects} what="projects" count={rows.length} />}
          content={rows.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} asChild>
              <SidebarNavItem
                href={`/projects/${p.id}`}
                label={p.name}
                icon={<Folder />}
                count={p.open}
                active={p.id === current}
              />
            </Link>
          ))}
        />
      }
      footer={<SidebarNavItem href="/settings" label="Settings" icon={<Settings />} />}
    />
  }
  content={page}
/>
```

`@cubeui/sidebar` is the navigation column itself, where `SidebarLayout` is only where it sits.
Three parts, and only `Sidebar` is required:

- **`Sidebar`** — the frame: `header`, a `content` that scrolls, `footer`, on `bg-sidebar` at a
  fixed `w-64` with a `border-sidebar-border` rule on the edge facing the page (`side="end"` moves
  it). It is a `StickyHeaderContentFooter` inside, so it needs a height from above, like any
  sticky chassis. `label` names it — an `<aside>` on the web, a complementary landmark. Put it in a
  `SidebarLayout` with `sidebarWidth="auto"`, and `divider="none"` because it draws its own rule; a
  different width is one `w-*` in `className`.
- **`SidebarSection`** — an overline `title` over a real list: `role="list"` and one
  `role="listitem"` per row, named by the title. Pass the rows as an **array** (`rows.map(…)`,
  keyed); each element becomes one item, so a fragment or a wrapper around them is one item
  holding everything. `status` sits between the title and the list and is where a
  `<QueryState compact …/>` goes; no list is drawn while there are no rows. `level` is the
  title's heading rank, 2 by default. **`as="nav"` makes the section a navigation landmark** — a
  `<nav>` on the web, `role="navigation"` on device — named by its `title`, or by `label` when it
  has none or two would share one. `Sidebar` is a complementary `<aside>`, so without it the rows
  are in no navigation landmark at all; do not wrap the section in a hand-written
  `<nav aria-label>`. Leave it off the sections that are not navigation — recent items, pinned
  searches — so the landmark holds only the app's own places. `label` without `as="nav"` is a
  type error.
- **`SidebarNavItem`** — the row: `href`, `label` (one line, truncated), `icon?`, `count?`,
  `active`. It is `role="link"` — an `<a href>` on the web — and `active` fills it from
  `sidebar-accent` and sets `aria-current="page"`. Hover fills it the same way.

**Routing is the app's.** The row names no router. Wrap it in your router's link with `asChild`
(expo-router's `Link`), which hands it the press handling; it forwards its ref and every prop it
does not name. A DOM router with no `asChild` passes its click handler as `onClick` instead —
react-router's `useLinkClickHandler`, TanStack's `createLink`. With neither, the `<a href>` still
navigates. `active` is yours to compute from the current route.

Do not pass an icon a size or a colour: the row sizes it to `size-4` and colours it with the label.
A row in the footer takes no `SidebarSection` — a list item with no list around it is invalid.

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
  footerActions={(close) => (
    <>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
    </>
  )}
/>
```

- `title` is **required** — it is what assistive technology announces. A design with no room for
  a heading passes `hideTitle`, which keeps the title and takes it off the screen. Never drop it.
- Give a `trigger` and no `open`, and the dialog owns its state. Pass `open`/`onOpenChange` when
  something outside the trigger opens it (a row menu, a route, a keyboard shortcut).
- The body scrolls; the header and footer do not. Do not add `max-h-*` or `overflow-y-auto` — a
  cap on the whole dialog is what takes the title off the screen on a long form.
- **`hasUnsavedChanges` is the one to remember.** On, Escape, a click on the overlay and the
  close button all ask before throwing the work away, and the dialog is still there behind the
  question. It is asked for, never computed, because only the caller knows what its fields are.
  `discardTitle`, `discardDescription`, `discardLabel` and `keepLabel` reword the question when
  the dialog knows what is lost.
- **Pass it as a function when the answer is not something you render.** The question is asked
  once, at a click — nothing in the dialog draws the answer — so a boolean makes you keep a value
  in render that only a handler reads, and work held outside the form's fields has to be lifted
  into state to answer at all. `hasUnsavedChanges={() => !form.state.isDefaultValue ||
  picker.hasEdits()}` runs at the click and subscribes to nothing. `isDefaultValue` and not
  `isDirty`: `isDirty` stays true for a field typed into and then back out of, so the dialog asks
  about a form identical to how it opened.
- **Take `close` from `footerActions` rather than closing the dialog yourself.** Pass a function
  and it is handed the dialog's own close — the same one Escape, the overlay and the close button
  go through, so `hasUnsavedChanges` asks on the way through Cancel too. A Cancel wired to your
  own `setOpen(false)` goes around the shell, and that is the door people actually click:

  ```tsx
  footerActions={(close) => (
    <>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </>
  )}
  ```

  The node form still works and is right for a footer that closes nothing. Only `footerActions`
  takes the function; `footer` is the other end of the row.
- `dismissible={false}` refuses Escape and outside clicks outright. Prefer `hasUnsavedChanges`,
  which asks on the way out rather than refusing to leave.
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

- One source for both platforms: the same item is `@cubeui/section` in `/r/web` and `/r/native`.
- The title is a heading of rank `level`, **2 by default**: `PageHeader` owns the `h1`, so a
  section on a page is the one below it. Nested in another section, or in a dialog whose title is
  the `h2`, pass `level={3}`. Choose it by where the section sits, never by how big the text should
  look — the text is the same size at every level. On the web it is `role="heading"` +
  `aria-level` rather than an `<hN>` element (same heading to a screen reader; style it by
  `data-slot="section-title"`, not by `h2`).
- The root is a `<section>` on the web, named by its title, so a titled section is a `region`
  landmark. There is nothing to add for that — do not wrap it in another `role="region"`.
- It draws **no surface** by default. `surface="card"` puts the whole group on a card (border,
  background, padding) — use that instead of wrapping it in a `Card` yourself. `CardLayout` is still
  the component for a card with a header and footer of its own.
- `divider` adds a hairline under the heading. Off by default.
- It is the smallest thing in the registry and it exists because three projects wrote
  `text-xs font-semibold uppercase` plus a muted foreground from memory, and each got the sixth
  token different (`tracking-wider`, `tracking-wide`, `border-b pb-1`). A shared token has no
  answer for that, because the value being retyped *is* a class list.

## List pages

Two shells for the shape every list route is: a ladder of states, then rows.

```tsx
<QueryState query={roles} what="your roles" count={shown.length} empty={<Empty … />} />
{shown.map((role) => (
  <DisclosureRow
    key={role.id}
    open={open === role.id}
    onOpenChange={(next) => setOpen(next ? role.id : null)}
    badges={<Badge>{role.contract}</Badge>}
    title={role.name}
    meta={<span className="text-muted-foreground text-xs">{role.lanes} lanes</span>}
    description={role.prompt}
    action={<ActionButton label="Delete" … />}
    content={<RolePrompt role={role} />}
  />
))}
```

### QueryState

- The three rungs a list climbs before it is a list: the request **failed**, it has **not
  landed**, it landed **empty**. Once there are rows it renders `null`, so the page reads as the
  ladder and then the list rather than a nest of ternaries.
- `count` is what the page is **about to draw**, not what came back. A search matching nothing is
  an empty *view* over a full result, and only the page knows which of the two it is showing — so
  pass the length of the rows you are mapping, and let `empty` say which emptiness it is.
- `query` is structural: anything with `isPending`, `isError`, `error` and `refetch` fits, so the
  shell names no data library. The same line `FormField` holds against form libraries.
  `error` is `unknown` — an Apollo error, a TanStack `Error | null` and a thrown string all fit.
- **`describe`** — `(error: unknown) => string` — is what the failure means in the app's words.
  Without it the line under the heading is the error's own `message`, which is the transport's
  wording ("Failed to fetch", "Received status code 401"), or "The server did not answer." when
  there is none. An app with a `describeError` helper passes it here instead of keeping its own
  failure card: `<QueryState describe={describeError} … />`. `QueryError` takes it too.
- **Try again awaits the retry.** When `onRetry` (on `QueryState`, the query's `refetch`) returns a
  promise, the button is disabled and reads "Retrying…" until it settles, so a second press does
  not stack requests. A rejected retry is caught — Apollo's `refetch` rejects when it fails again
  — so it never surfaces as an unhandled rejection; the query's own error is what gets shown.
- It ships `QueryError` and `RowSkeleton` alongside it. Reach for `QueryError` on a page that
  draws one object rather than a list — it is the rung most often left out, and a page that draws
  a failure as an absence tells somebody whose server went away that they have no data.
  `<QueryError error={error} onRetry={refetch} what="this invoice" describe={describeError} />`.
  Its root is `role="alert"`, card and `compact` alike, because it replaces what the reader was
  waiting for — so do not wrap it in another alert.
- `RowSkeleton` draws `rows` bordered `Card`s — the shape a row is — so the page does not change
  shape when the answer lands. `rows` is 3 by default and `QueryState` passes it through. Use it on
  `isPending` only: behind `isFetching` it flashes a skeleton over a list that is perfectly good.
  The placeholders are `aria-hidden` inside one `role="status"` wrapper announcing "Loading", so
  three cards of placeholder text are not three cards of nothing to read out.
- **`compact`** draws the rungs small enough for a sidebar: the failure as two lines of text and a
  small "Try again" instead of a card, and the placeholders as bars the height of a nav row. Use
  it in a `SidebarSection`'s `status`; `QueryError` and `RowSkeleton` take it too.

### DisclosureRow

- The **whole heading is the button**, so a row is never opened by hitting a 16-pixel chevron and
  is operable with Space. `aria-expanded` is on it, and `aria-controls` while the body is there.
- **`action` sits outside that button.** A control nested inside a button is invalid HTML and, in
  practice, a delete that cannot be clicked.
- `description` shows whether the row is open or shut; `content` is what it opens onto.
- Open is controlled — a row is often opened from elsewhere on the page, or by a deep link.
- It is built on `Item`, so a row that opens lines up with one that does not down to the padding.
  A list of rows that do **not** open needs no shell at all: use `Item`, `ItemContent`,
  `ItemTitle`, `ItemDescription` and `ItemActions` directly.
