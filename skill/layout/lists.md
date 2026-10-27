# List pages

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## List pages

The shells for the shape every list route is: a ladder of states, then a list of rows.

```tsx
<QueryState
  query={roles}
  what="your roles"
  count={shown.length}
  emptySlot={<EmptyState iconSlot={<Users />} title="No roles yet" description="A role is a prompt and its lanes." />}
/>
<List
  label="Roles"
  contentSlot={shown.map((role) => (
  <DisclosureRow
    key={role.id}
    open={open === role.id}
    onOpenChange={(next) => setOpen(next ? role.id : null)}
    badgesSlot={<Badge>{role.contract}</Badge>}
    title={role.name}
    meta={<span className="text-foreground/60 text-xs">{role.lanes} lanes</span>}
    description={role.prompt}
    actionSlot={<Button aria-label="Delete" size="icon" … />}
    contentSlot={<RolePrompt role={role} />}
  />
  ))}
/>
```

### QueryState

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
  failure card: `<QueryState describe={describeError} … />`. `QueryError` takes it too.
- **Try again awaits the retry.** When `onRetry` (on `QueryState`, the query's `refetch`) returns a
  promise, the button is disabled and reads "Retrying…" until it settles, so a second press does
  not stack requests. A rejected retry is caught — Apollo's `refetch` rejects when it fails again
  — so it never surfaces as an unhandled rejection; the query's own error is what gets shown.
- It ships `QueryError` and `RowSkeleton` alongside it. Reach for `QueryError` on a page that
  draws one object rather than a list — it is the rung most often left out, and a page that draws
  a failure as an absence tells somebody whose server went away that they have no data.
  `<QueryError error={error} onRetry={refetch} what="this invoice" describe={describeError} />`.
  It is an `Alert variant="destructive"` with Try again as its action (so the item installs
  `@cubeui/alert`), not a card of its own. Its root is `role="alert"`, full and `compact` alike,
  because it replaces what the reader was waiting for — so do not wrap it in another alert.
- `RowSkeleton` draws `rows` placeholder rows — a title bar over a shorter line, no card round
  them — the shape a list row is, so the page does not change shape when the answer lands. `rows` is 3 by default and `QueryState` passes it through. Use it on
  `isPending` only: behind `isFetching` it flashes a skeleton over a list that is perfectly good.
  The placeholders are `aria-hidden` inside one `role="status"` wrapper announcing "Loading", so
  three placeholder rows are not three rows of nothing to read out.
- **`compact`** draws the rungs small enough for a sidebar: the failure as two lines of text and a
  small "Try again" instead of a card, and the placeholders as bars the height of a nav row. Use
  it in a `SidebarSection`'s `status`; `QueryError` and `RowSkeleton` take it too.

### Empty states

`EmptyState` (`@cubeui/empty-state`, on both halves, and re-exported by `@cubeui/page`) is what an
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
  Use it for `CardLayout`'s `emptySlot`, a compact `QueryState`'s `emptySlot`, and the empty body of a
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

### DisclosureRow

- The **whole heading is the button**, so a row is never opened by hitting a 16-pixel chevron and
  is operable with Space. `aria-expanded` is on it, and `aria-controls` while the body is there.
- **`actionSlot` sits outside that button.** A control nested inside a button is invalid HTML and, in
  practice, a delete that cannot be clicked.
- `description` shows whether the row is open or shut; `contentSlot` is what it opens onto.
- Open is controlled — a row is often opened from elsewhere on the page, or by a deep link.
- It is built on `Item`, so a row that opens lines up with one that does not down to the padding.
  A row that does **not** open onto a body is `ListItem`, below.
- One source for both halves: `@cubeui/disclosure-row`. On a device the heading is a
  `role="button"` `Pressable` with `aria-expanded`, the title is one line (`numberOfLines`), and a
  string `meta` is wrapped in a `Text` for you; pass the badges, the action
  and the body as native elements, `onPress` where the web takes `onClick`.

### List

The list rows sit in: the `<ul>`, the rule between rows and the padding around each, so a page
writes none of the three. One source for both platforms: `@cubeui/list`.

```tsx
<List
  label="People"
  contentSlot={people.map((p) => (
    <ListItem key={p.id} title={p.name} description={p.email} />
  ))}
/>
```

- **Each element of `contentSlot` is one row**, and the list writes the `<li>` around it. An array
  or a fragment is opened first, so `rows.map(...)` beside a fixed last row is that many rows. Give
  each row its `key` as you would in any `map`. Do **not** write `<li>` or `role="listitem"`
  yourself.
- On the web it is a real `<ul>` of `<li>`s; on a device `role="list"` and `role="listitem"`, so a
  screen reader says "list, 4 items" and "2 of 4" on both.
- `label` is the list's accessible name, in the reader's words ("Workspaces"). Leave it out when a
  heading right above already says it.
- `divided` draws a `border-foreground/10` rule over every row but the first. It is on unless you
  pass `divided={false}`, for rows that are cards of their own.
- The padding around a row (`py-1`) is the list's. Do not add a `<div className="py-…">` around a
  row, or `divide-y` on a parent.
- It takes any row: `ListItem`, `DisclosureRow`, composed `Item` parts, a row of your own.
- **Rows that nest** — a run's steps, a decision's arms — go in a `ListRow` with a `depth`, which is
  exported beside `List`. Depth 0 is the top. The list indents each level a `ml-4` step (up to six
  steps; deeper rows stay at the sixth), draws a `border-foreground/10` guide rule down the start edge
  of every nested row, and puts `aria-level` (`depth + 1`) on its item, so a screen reader hears the
  nesting:

  ```tsx
  <List
    label="Steps"
    contentSlot={steps.map((s) => (
      <ListRow key={s.id} depth={s.depth}>
        <ListItem title={s.name} />
      </ListRow>
    ))}
  />
  ```

  Do **not** write `marginLeft`, `pl-…` or `border-l` on a row yourself. It is still a list, not
  `role="tree"`: nothing here opens, closes or takes arrow keys, which is what a tree promises. A
  tree of paths is `FileTree`. A row with no `ListRow` around it is a plain row with no level.
- **No `emptySlot` and no `loading`.** Those rungs are `QueryState`'s, drawn above the list. With no
  rows the list draws nothing at all, rather than an empty `<ul>` read as "list, 0 items" — and a
  `CardLayout` whose `contentSlot` is that list shows its `emptySlot`.
- It draws no surface. Put it in a `Section` or a `CardLayout` `contentSlot`, or pass a border in
  `className`.

### ListItem

One row of a list — an avatar or a checkbox, a name over a line, a date and a few buttons at the
far end — optionally pressable. One source for both platforms: `@cubeui/list-item`.

```tsx
<List
  label="People"
  contentSlot={people.map((p) => (
    <ListItem
      key={p.id}
      leadingSlot={<Avatar person={p} />}
      title={`${p.firstName} ${p.lastName}`}
      description={p.email}
      meta={relativeTime(p.lastContactedAt)}
      linkSlot={<Link href={`/persons/${p.id}`} />}
      actionSlot={<Button size="sm" variant="outline" onPress={() => remove(p.id)} content="Delete" />}
    />
  ))}
/>
```

- `leadingSlot` is the start of the row: an avatar, a checkbox, an icon, placed as given. It is not
  sized the way `iconSlot` is, so size an icon yourself (`size-4`), and it is **outside** the pressed
  area — a `Checkbox` there is its own control (telos' todo row).
- `title` is one line and truncates; `description` is the muted line under it, two lines at most.
  `titleClassName` reaches the title (a done todo's `line-through`). Both are for words. An
  element given to either — a name with a badge beside it — is placed as it is, with none of
  that styling or truncation, so it styles its own text; in an Expo app its words need a `Text`.
- `meta` is the small grey facts at the far end — a date, a count, a badge. A string is drawn
  `text-xs` muted for you. It is inside the pressed area.
- `actionSlot` is the far end, **outside** the pressed area: one button or a fragment of them. Pass
  outline `Button`s; the row adds the gap.
- `onPress` (`onClick` on the web) makes the middle — `title`, `description`, `meta` — one button
  (a real `<button>` on the web, named by its text) between `leadingSlot` and `actionSlot`. Every control in the row is pressed,
  focused and announced on its own; do **not** wrap the row in a `Pressable`, a `Link` or an
  `<a>`, which is the button-in-a-button this avoids.
- **A row that goes somewhere is a link, not an `onPress` that calls the router.** Hand it the
  router's link as an element with no children, `linkSlot={<Link href={`/persons/${p.id}`} />}`,
  and the middle is drawn inside it: the router's own `<a href>` on the web — a new tab, a middle
  click, the URL on hover, "link" to a screen reader — and expo-router's `Link asChild` on device.
  `href="https://…"` alone is a plain `<a href>` for a URL no router owns; on device it only runs
  `onPress`. A `selected` link carries `aria-current="page"`. Keep `onPress` on its own for a row
  that opens something on the page it is on: a dialog, a pane.
- `selected` is the chosen row — the one open beside the list. It is tinted in `active`, stays
  that under the pointer, and a pressable row carries `aria-current`. `Item` takes `selected` too;
  there, put `aria-current` on the link yourself. **Do not hand-write it** with `bg-hover` or a
  grey fill: that is a hover that stuck.
- No surface and no list role: the row is `rounded-md px-3 py-2` and nothing else. Put rows in a
  `List` (above), which is the `<ul>`, the rule and the row padding; for a bordered card per row pass
  `divided={false}` to the list and give each row
  `className="rounded-lg border border-foreground/10 bg-secondary"`.
- `ListItem` is the row with its decisions made; prefer it in new code. For one it does not fit — a header or footer
  line, a whole row that is one link, actions and all — compose shadcn's `Item` parts
  (`@cubeui/item`, installed to `components/ui/item`), which are on both halves now with shadcn's
  names, props and metrics: `ItemMedia` is `leadingSlot`, `ItemContent` the middle, `ItemTitle` and
  `ItemDescription` the two lines, `ItemActions` the `actionSlot`. On a device a string in a part is
  wrapped in a `Text` for you, an icon in `ItemMedia` is not sized (pass `size-4`), and `asChild`
  hands the row to a `Pressable` the way it hands it to an `<a>` on the web.

