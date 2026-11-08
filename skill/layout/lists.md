# cubeui layout: List pages

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

**Contents**

- [List pages](#list-pages)
  - [LoadState](#loadstate)
  - [Detail pages](#detail-pages)
  - [Empty states](#empty-states)

## List pages

The shells for the shape every list route is: a ladder of states, then a list of rows.

```tsx
<LoadState
  query={roles}
  what="your roles"
  count={shown.length}
  emptySlot={<EmptyState iconSlot={<Users />} title="No roles yet" description="A role is a prompt and its lanes." />}
/>
<List
  label="Roles"
  contentSlot={shown.map((role) => (
  <CollapsibleRow
    key={role.id}
    open={open === role.id}
    onOpenChange={(next) => setOpen(next ? role.id : null)}
    badgesSlot={<Badge>{role.contract}</Badge>}
    title={role.name}
    meta={`${role.lanes} lanes`}
    description={role.prompt}
    actionSlot={<Button aria-label="Delete" size="icon" … />}
    contentSlot={<RolePrompt role={role} />}
  />
  ))}
/>
```

### LoadState

- **It was `QueryState`.** `QueryState` and `QueryError`, and the `@cubeui/query-state` item that
  re-exports them, stay for one release as deprecated aliases; import `LoadState` and `LoadError`
  from `@/components/load-state` in new code.
- **`emptySlot` takes an `EmptyState`** (`@cubeui/empty-state`): the centred block when the list is
  the page, `compact` when it sits inside a card. Not the `@cubeui/empty` parts assembled by hand.
- The three rungs a list climbs before it is a list: the request **failed**, it has **not
  landed**, it landed **empty**. Once there are rows it renders `null`, so the page reads as the
  ladder and then the list rather than a nest of ternaries.
- `count` is what the page is **about to draw**, not what came back. A search matching nothing is
  an empty *view* over a full result, and only the page knows which of the two it is showing — so
  pass the length of the rows you are mapping, and let `emptySlot` say which emptiness it is.
- `query` is structural: anything with `isPending`, `isError`, `error` and `refetch` fits, so the
  shell names no data library. The same line `FormField` holds against form libraries.
  `error` is `unknown` — an Apollo error, a TanStack `Error | null` and a thrown string all fit.
- **`describe`** — `(error: unknown) => string` — is what the failure means in the app's words.
  Without it the line under the heading is the error's own `message`, which is the transport's
  wording ("Failed to fetch", "Received status code 401"), or "The server did not answer." when
  there is none. An app with a `describeError` helper passes it here instead of keeping its own
  failure card: `<LoadState describe={describeError} … />`. `LoadError` takes it too.
- **Try again awaits the retry.** When `onRetry` (on `LoadState`, the query's `refetch`) returns a
  promise, the button is disabled and reads "Retrying…" until it settles, so a second press does
  not stack requests. A rejected retry is caught — Apollo's `refetch` rejects when it fails again
  — so it never surfaces as an unhandled rejection; the query's own error is what gets shown.
- **A detail page passes `record` instead of `count`.** The ladder is then failed, loading, **not
  found**: `record` is what the query returned (`null` or `undefined` is not there), and
  `notFoundLabel` is what the page says then, drawn as an `EmptyState` with the Search icon.
  Once the record is there it renders `null`, as it does for rows. Pass one of `count` and
  `record`, never both; `emptySlot` goes with `count`. The page around it is
  [Detail pages](#detail-pages) below.
- It ships `LoadError` and `RowSkeleton` alongside it. Reach for `LoadError` on a page that
  draws one object rather than a list — it is the rung most often left out, and a page that draws
  a failure as an absence tells somebody whose server went away that they have no data.
  `<LoadError error={error} onRetry={refetch} what="this invoice" describe={describeError} />`.
  It is an `Alert variant="destructive"` with Try again as its action (so the item installs
  `@cubeui/alert`), not a card of its own. Its root is `role="alert"`, full and `compact` alike,
  because it replaces what the reader was waiting for — so do not wrap it in another alert.
- `RowSkeleton` draws `rows` placeholder rows — a title bar over a shorter line, no card round
  them — the shape a list row is, so the page does not change shape when the answer lands. `rows` is 3 by default and `LoadState` passes it through. Use it on
  `isPending` only: behind `isFetching` it flashes a skeleton over a list that is perfectly good.
  The placeholders are `aria-hidden` inside one `role="status"` wrapper announcing "Loading", so
  three placeholder rows are not three rows of nothing to read out.
- **`compact`** draws the rungs small enough for a sidebar or a card: the failure as two lines of
  text and a small "Try again" instead of an alert box, and the placeholders as bars the height of
  a nav row. Use it in a `SidebarSection`'s `status` and inside a card; `LoadError` and
  `RowSkeleton` take it too. **A compact rung has no side inset**, like `EmptyState`'s `compact`
  line: both are `text-sm` with `py-2`, and keep the left edge of what they sit in, so in a card
  they line up with the card's text. In a sidebar, pass `className="px-2"` to both the
  `LoadState` and its `emptySlot`'s `EmptyState`, to line them up with the rows' labels.
- **The full failure is capped and centred** (`max-w-xl`), as the empty and not-found blocks are
  centred: on a wide page, Try again stays beside the words it answers.


<!-- props:LoadState -->
`LoadState`'s props, from the TSDoc in `registry/layout/load-state.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `query` (required) | `QueryLike` |  |  |
| `what` (required) | `string` |  | What could not be fetched, in the reader's words: "your agents", "the archive". |
| `rows` | `number` | `3` | How many placeholder rows stand in for the list while it loads. |
| `compact` | `boolean` | `false` | The rungs drawn small enough for a rail or a card: the failure as two lines and a text-sized retry, and the placeholders as bars the height of a nav row. For a list that lives in a sidebar or inside a card, where an alert box would be taller than the list it replaced. Like `EmptyState`'s `compact` line, each rung keeps the left edge of what it sits in; in a sidebar, pass `className="px-2"` to line it up with the rows' text. |
| `describe` | `((error: unknown) => string)` |  | What the failure means, in the app's words — handed through to `LoadError`. |
| `className` | `string` |  |  |
| `count` (instead of `record`) | `number` |  | How many rows the screen is about to draw. Pass this or `record`. |
| `emptySlot` (with `count`) | `SlotNode` |  | What to say when there are none — whatever invites the first one. |
| `record` (instead of `count`) | `unknown` |  | The one record the screen asked for, once the query has answered. `null` or `undefined` is a record that is not there. Pass this or `count`. |
| `notFoundLabel` (required with `record`) | `string` |  | What the screen says when `record` is not there: "Project not found". It is drawn as the screen's heading — an `EmptyState` with the Search icon, at `level` — because the whole screen is that state. |
| `level` (with `record`) | `1 \| 2 \| 3` | `1` | Which heading `notFoundLabel` is. `2` in a detail page's body, under the `PageLayout` title that is already its `h1`, so the page does not have two. `1`, the default, is for a guard that is the whole screen, with no page around it. The size is the same at every level. |
| `description` (with `record`) | `ReactNode` |  | One line under `notFoundLabel` on what probably happened: "It may have been archived, or the link is old." Not drawn at `compact`, which is one line. |
| `actionSlot` (with `record`) | `SlotNode` |  | The way on from a record that is not there: a "Back to projects" button. Under the words, as on `EmptyState`; a screen that is only "not found" is otherwise a dead end. |
<!-- /props -->
### Detail pages

A page that shows one record is a `PageLayout` that is always drawn, and a `LoadState` in its
body. The page owns the loading: its header's `loading` puts a bar where the title will be, and
the back button and the page's frame stay where they are. The title falls back to the kind of
thing while there is no record, so the page is never headless when the record failed or is gone:

```tsx
const p = project.data;

<PageLayout
  backSlot={<Button variant="outline" size="icon" aria-label="Back to projects" iconSlot={<ArrowLeft />} … />}
  title={p?.name ?? "Project"}
  loading={project.isPending}
  actionSlot={p ? <ProjectActions project={p} /> : null}
  contentSlot={
    <>
      <LoadState
        query={project}
        what="this project"
        record={p}
        notFoundLabel="Project not found"
        description="It may have been archived, or the link is old."
        actionSlot={<Button variant="outline" content="Back to projects" … />}
        level={2}
      />
      {p ? <ProjectBody project={p} /> : null}
    </>
  }
/>
```

- **Loading is the title's bar, and only that.** Inside a `PageLayout` whose `loading` is on,
  `LoadState` draws no placeholder rows: rows shaped like a list's under a title bar are a second
  loading state, in a shape the page will not have. Nothing to pass; `PageLayout` tells it.
- **Failed** is the page's title (the fallback) over the `LoadError` in the body, with Try again.
- **Not found** is the page's title over the not-found block: `level={2}`, since the page's title
  is the `h1`, with `description` saying what probably happened and `actionSlot` the way on —
  "Back to projects" — so the screen is not a dead end. At `compact` the action is drawn after the
  one line and `description` is not drawn.
- Do not put the `LoadState` in front of the page, with the `PageLayout` drawn only once the
  record is there. That screen has no title while it loads or fails, and its list-row placeholders
  give way to a page of another shape when the record lands.
- A page whose title does not come from the record ("Pool settings") leaves `loading` off, and
  `LoadState` draws its rows in the body as it does on a list page.

### Empty states

`EmptyState` (`@cubeui/empty-state`, on both halves) is what an
empty list says. Install `empty-state` for it; it does not need the page shell. It comes in two shapes,
and which one is a question of **where the list is**, not how much there is to say:

```tsx
// The list is the page, or the page's main region: the centred block.
<EmptyState
  iconSlot={<Inbox />}
  title="No agents yet"
  description="An agent runs the lanes you give it."
  actionSlot={<Button variant="info" onPress={create} content="New agent" />}
/>

// The list is inside something — a card, a sidebar section, a popover, a dialog: one line.
<EmptyState
  compact
  title="No labels yet."
  actionSlot={<Button variant="outline" size="xs" onPress={create} content="Add one" />}
/>
```

<!-- props:EmptyState -->
`EmptyState`'s props, from the TSDoc in `registry/layout/empty-state.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `iconSlot` | `SlotNode` |  | The glyph over the title, as an element: `iconSlot={<Inbox />}`. The shell draws it in a muted bubble and sizes and inks it, so pass a bare icon. Required for the centred block; at `compact` it is optional, and drawn inline before the text. |
| `icon` | `IconComponent` |  | **Deprecated.** Pass the element as `iconSlot={<Plug />}`. |
| `title` (required) | `string` |  | What there is none of, as the reader would say it: "No agents yet". At `compact` it is the whole line, so it can run on into what to do: "No servers yet. Add one to give the agent some tools." |
| `actionSlot` | `SlotNode` |  | What makes the first one: a New or an Add button. Under the text in the centred block, and after it on the same line at `compact`. |
| `className` | `string` |  | The root. Mostly for an inset: `px-2` lines the `compact` line up with a sidebar's rows. |
| `compact` | `boolean` |  | The one muted line that stands in for a short list *inside* something else — a card, a sidebar section, a popover: "No labels yet." Off, it is the centred block that stands in for a whole list or page. On, it keeps the left edge of what it sits in, draws no icon bubble and no padding past a `py-2`, and takes no `description` and no `level`: a line inside a region that already has its heading is never what a screen reader lands on. The same word, for the same place, as `LoadState`'s `compact` — whose `emptySlot` it usually is. |
| `description` (without `compact`) | `ReactNode` |  | One line under the title on what the list is for, or how it fills: "An agent runs the lanes you give it." |
| `level` (without `compact`) | `1 \| 2 \| 3` |  | Makes the title a heading of this rank. Leave it off for an empty list inside a page that already has its heading. Set it when the empty state *is* the page — a first run, a record that was not found, a link that did not work — so a screen reader has a heading to land on: `1` for a whole screen, `2` or `3` under a title that is already there. The text is the same size at every level, as on `Section`: pick the rank by where it sits, not by how it looks. |
<!-- /props -->

- **Default** — an icon in a muted bubble, the `title`, an optional `description`, the `actionSlot`
  under them, centred, with `py-10` around it and no edge. The title is `text-base`, a step over
  the description, so it is what the eye lands on. The icon is required: an element in `iconSlot`
  (`iconSlot={<Inbox />}`), as on every other shell, and the shell sizes and inks it. `icon`, a
  component (`icon={Inbox}`), is the older spelling and is deprecated; pass one or the other.
- **`level`** (1–3) makes the title a heading of that rank, at the same size. Set it only when the
  empty state *is* the screen — a first run, a record not found, a dead link — so a screen reader
  has a heading to land on. Otherwise leave it off; the page already has its heading.
- **`compact`** is one muted `text-sm` line: an optional small `iconSlot` inline before the words, the
  `title`, then the `actionSlot` on the same line (it wraps under on a narrow column). No bubble, no
  centring, nothing but a `py-2` — it keeps the left edge of what it sits in. It is plain text,
  never a heading, so `level` is a **type error** with `compact`, and so is `description`: the
  whole sentence goes in `title` ("No servers yet. Add one to give the agent some tools.").
  Use it for `CardLayout`'s `emptySlot`, a compact `LoadState`'s `emptySlot`, and the empty body of a
  popover or picker. In a `Sidebar`, `className="px-2"` lines it up with the rows.
- Do not hand-write either: not `<Text className="text-foreground/60 text-sm">No labels
  yet.</Text>`, and not an `Empty` helper in the app. Four apps wrote that line with as many
  paddings and alignments; the shell is the one place it is decided.
- **shadcn's compound form is `@cubeui/empty`, on both halves.** `Empty`, `EmptyHeader`,
  `EmptyMedia` (`variant="icon"` for the bubble), `EmptyTitle`, `EmptyDescription` and
  `EmptyContent`, with shadcn's names and props, installed to `components/ui/empty`. The block
  above is built on them, so they draw the same thing — which is not shadcn's look: the title is
  `text-base`, not `text-lg`, and there is no `flex-1` or `p-6 md:p-12` unless a `className` asks.
  Write `EmptyState` in new code; the parts are there so a shadcn call site ports unchanged, and
  for the rare empty state that needs a second button or an image where the icon goes.
  `EmptyTitle` is plain text: give it `role="heading"` and `aria-level` yourself when it is the
  screen.
