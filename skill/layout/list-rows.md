# cubeui layout: List rows

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares. A list page's states — failed, loading, empty — are [lists.md](lists.md)'s `LoadState` and `EmptyState`; this file is the rows they stand in for.

**Contents**

- [CollapsibleRow](#collapsiblerow)
- [List](#list)
- [ListItem](#listitem)

## CollapsibleRow

- **It was `DisclosureRow`.** `DisclosureRow`, and the `@cubeui/disclosure-row` item that
  re-exports it, stay for one release as deprecated aliases; import `CollapsibleRow` from
  `@/components/collapsible-row` in new code.
- The **whole heading is the button**, so a row is never opened by hitting a 16-pixel chevron and
  is operable with Space. `aria-expanded` is on it, and `aria-controls` while the body is there.
- **`actionSlot` sits outside that button.** A control nested inside a button is invalid HTML and, in
  practice, a delete that cannot be clicked.
- `description` shows whether the row is open or shut; `contentSlot` is what it opens onto.
- Open is controlled — a row is often opened from elsewhere on the page, or by a deep link.
- It is a `ListItem` that opens: the same `Item` parts at `size="sm"`, title, description, `meta`
  at the far end and hover as the `ListItem` rows beside it, so the two line up down to the
  padding, and like `ListItem` it draws **no surface**. Put the rows in a `List` or a
  `CardLayout`; a row standing on its own that wants a frame takes
  `className="border border-foreground/10"`. A row that does **not** open onto a body
  is `ListItem`, below.
- One source for both halves: `@cubeui/collapsible-row`. On a device the heading is a
  `role="button"` `Pressable` with `aria-expanded`, the title is one line (`numberOfLines`), and a
  string `meta` is drawn muted and extra small in a `Text` for you; pass the badges, the action
  and the body as native elements, `onPress` where the web takes `onClick`.


<!-- props:CollapsibleRow -->
`CollapsibleRow`'s props, from the TSDoc in `registry/layout/collapsible-row.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `open` (required) | `boolean` |  | Whether the row is open. The caller holds it: a list usually opens one row at a time, or opens the one a link points at. |
| `onOpenChange` (required) | `((open: boolean) => void)` |  | Told the state the reader asked for when the heading is pressed; set `open` from it. |
| `title` (required) | `ReactNode` |  | The row's name, and the button that opens it. A string is drawn in the row's title style. |
| `badgesSlot` | `SlotNode` |  | Whatever the row is wearing: a status, a kind, a state. Drawn before the title. |
| `meta` | `ReactNode` |  | The small grey facts at the heading's far end, as on `ListItem`: a name, a time, a count. A string is drawn muted and extra small; an element is placed as it is. Inside the button. |
| `description` | `ReactNode` |  | Two clipped lines of what the thing said, drawn under the title whether open or not. |
| `actionSlot` | `SlotNode` |  | Buttons, outside the collapsible: a row is opened by its heading and acted on by these. |
| `contentSlot` | `SlotNode` |  | What the row opens onto. |
| `className` | `string` |  | On the whole row, the heading and what it opens onto together. |
| `contentClassName` | `string` |  | On the box that holds `contentSlot` while the row is open. |
<!-- /props -->
## List

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

<!-- props:List -->
`List`'s props, from the TSDoc in `registry/layout/list.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `SlotNode` |  | The rows: `ListItem`s, `CollapsibleRow`s, an array of them or a fragment. One cell each. Wrap a row in `ListRow` to give it a `depth`. |
| `label` | `string` |  | What the list is a list of, in the reader's words: "Workspaces". Its accessible name. |
| `divided` | `boolean` | `true` | A rule between rows. On unless turned off, for rows that are cards of their own. |
| `className` | `string` |  | On the list itself, the box its rows are drawn in. |
<!-- /props -->

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
- It takes any row: `ListItem`, `CollapsibleRow`, composed `Item` parts, a row of your own.
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
- **No `emptySlot` and no `loading`.** Those rungs are `LoadState`'s, drawn above the list. With no
  rows the list draws nothing at all, rather than an empty `<ul>` read as "list, 0 items" — and a
  `CardLayout` whose `contentSlot` is that list shows its `emptySlot`.
- It draws no surface. Put it in a `Section` or a `CardLayout` `contentSlot`, or pass a border in
  `className`.

## ListItem

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

<!-- props:ListItem -->
`ListItem`'s props, from the TSDoc in `registry/layout/list-item.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | What the row is: a person's name, a todo's text. A string is one line, truncated when it runs long; an element — a name with a badge beside it — is placed as it is and styles itself. |
| `description` | `ReactNode` |  | The line under the title — an email, the first line of the notes. A string is two lines at most; an element is placed as it is. |
| `leadingSlot` | `SlotNode` |  | The start of the row, before the title: an avatar, a checkbox, an icon. Placed as given — not sized or recoloured the way `iconSlot` is, because a checkbox or an avatar is not a glyph. It sits **outside** the pressed area, so a checkbox here stays its own control. |
| `meta` | `ReactNode` |  | The small grey facts at the row's far end, before `actionSlot`: "2 days ago", "12", a badge. A string is drawn muted and extra small; an element is placed as it is. Inside the pressed area. |
| `actionSlot` | `SlotNode` |  | The row's far end, **outside** the pressed area: an edit button, a menu, a delete. One control or a fragment of them. A control nested in a button is invalid HTML and, in practice, a click that also opens the row. |
| `onPress` | `(() => void)` |  | Makes the row something you press — open the person, edit the todo. The title, description and `meta` become one button between `leadingSlot` and `actionSlot`, so neither of those is nested in it. |
| `href` | `string` |  | Where the row goes, for a URL no router owns. The middle is a link — an `<a href>` on the web, so it opens in a new tab and shows its URL on hover — and `onPress` still runs beside it. On device there is no URL to open, so `onPress` is what navigates. |
| `linkSlot` | `ReactElement` |  | The router's link the row is, as an element with no children — `<Link href="/people/1" />` — which the middle is drawn inside, as `Button`'s and `FileTree`'s is. On the web that element *is* the middle, so it stays the router's own `<a>`; on device it is expo-router's `Link`, which takes the middle `asChild`. Given this, `href` and `onPress` are the link's to say. |
| `selected` | `boolean` | `false` | The chosen row: the one open beside the list, the current one. Tinted in `active`, a step further under the pointer, and a pressable row says so with `aria-current`. A row with nothing to press has no element to carry that, so the tint is all it shows: say it in the row's words as well — a "Current" badge in `meta` — for a reader who cannot see the colour. |
| `className` | `string` |  | On the row, the box around its leading slot, words, meta and action. |
| `titleClassName` | `string` |  | On the title's own `Text`, as `CardLayout`'s is: a `line-through`, a weight. |
<!-- /props -->

- `leadingSlot` is the start of the row: an avatar, a checkbox, an icon, placed as given. It is not
  sized the way `iconSlot` is, so size an icon yourself (`size-4`), and it is **outside** the pressed
  area — a `Checkbox` there is its own control (telos' todo row).
- `title` is one line and truncates; `description` is the muted line under it, two lines at most.
  They are the heading rhythm every block and row shares ([index.md](index.md#one-heading-rhythm)):
  a 14px semibold title over a 14px description in the `/60` grey, 4px apart, the same type as a
  card's heading, so a list on a card reads as one scale.
  `titleClassName` reaches the title (a done todo's `line-through`). Both are for words. An
  element given to either — a name with a badge beside it — is placed as it is, with none of
  that styling or truncation, so it styles its own text; in an Expo app its words need a `Text`.
- `meta` is the small grey facts at the far end — a date, a count, a badge. A string is drawn
  `text-xs` muted for you. It is inside the pressed area.
- `actionSlot` is the far end, **outside** the pressed area: one button or a fragment of them. Pass
  outline `Button`s; the row adds the gap — 8px, or 4px when they are all `icon-xs` — and holds them
  level with the title's top, not centred on the row.
- **The row wraps rather than squeezing its middle to nothing.** The title truncates first; once
  the middle would be narrower than 10rem, the actions go to a line of their own, 8px under the
  words, at the row's far end. `CollapsibleRow` does the same.
- `onPress` (`onClick` on the web) makes the middle — `title`, `description`, `meta` — one button
  (a real `<button>` on the web, named by its text) between `leadingSlot` and `actionSlot`. Every control in the row is pressed,
  focused and announced on its own; do **not** wrap the row in a `Pressable`, a `Link` or an
  `<a>`, which is the button-in-a-button this avoids. The row lights up when its middle is focused,
  and only then: a focused action or leading checkbox shows its own look alone.
- **A row that goes somewhere is a link, not an `onPress` that calls the router.** Hand it the
  router's link as an element with no children, `linkSlot={<Link href={`/persons/${p.id}`} />}`,
  and the middle is drawn inside it: the router's own `<a href>` on the web — a new tab, a middle
  click, the URL on hover, "link" to a screen reader — and expo-router's `Link asChild` on device.
  `href="https://…"` alone is a plain `<a href>` for a URL no router owns; on device it only runs
  `onPress`. A `selected` link carries `aria-current="page"`. Keep `onPress` on its own for a row
  that opens something on the page it is on: a dialog, a pane.
- `selected` is the current row — the one open beside the list. It is tinted in `active`, a step
  further under the pointer, and a pressable row carries `aria-current` (not `aria-pressed`: a row
  is current, not on). A row with nothing to press has nothing to carry it, so the tint is all it
  shows: say it in the row's words too, such as a "Current" badge in `meta`. `Item` takes
  `selected` too; there, put `aria-current` on the link yourself. **Do not hand-write it** with
  `bg-hover` or a grey fill: that is a hover that stuck.
- No surface and no list role: the row is `rounded-md px-3 py-2` and nothing else. Put rows in a
  `List` (above), which is the `<ul>`, the rule and the row padding; for a bordered card per row pass
  `divided={false}` to the list and give each row
  `className="rounded-lg border border-foreground/10 bg-secondary"`.
- `ListItem` is the row with its decisions made; prefer it in new code. For one it does not fit — a header or footer
  line, a whole row that is one link, actions and all — compose shadcn's `Item` parts
  (`@cubeui/item`, installed to `components/ui/item`), which are on both halves now with shadcn's
  names and props. `ListItem` is built from them at `size="sm"`: `Item` is its box, `ItemMedia`
  its `leadingSlot`, `ItemContent` the middle, `ItemTitle` and `ItemDescription` the two lines,
  `ItemActions` the `actionSlot`. So a row you compose at `size="sm"` lines up with the `ListItem`s
  beside it; `size="default"` is shadcn's roomier row. On a device a string in a part is
  wrapped in a `Text` for you, an icon in `ItemMedia` is not sized (pass `size-4`), and `asChild`
  hands the row to a `Pressable` the way it hands it to an `<a>` on the web.
- A link in an `ItemDescription` is `text-info` and underlined on the web, and `foreground` on a
  `selected` row, where `info` is too faint on the tint. On device, give the link's `Text` the
  class yourself.
