# cubeui layout: Description lists, setting rows and stat tiles

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Description lists

Read-only facts — a label, a value, a line under the value — which is most of a settings page or an
"about this server" page.

```tsx
<Section
  title="Index"
  contentSlot={
    <DescriptionList
      contentSlot={[
        <PropertyRow key="e" label="Embedder" value="bge-small" hint="Set with RAGDOWN_EMBEDDER" />,
        <PropertyRow
          key="d"
          label="Docs folder"
          value="/data/notes"
          valueClassName="font-mono"
          actionSlot={<CopyButton value="/data/notes" label="Copy docs folder" />}
        />,
        <PropertyRow key="i" label="Index" value="1,204 chunks" hint="Synced 2 minutes ago" />,
      ]}
    />
  }
/>
```

<!-- props:DescriptionList -->
`DescriptionList`'s props, from the TSDoc in `registry/layout/description-list.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `SlotNode` |  | The rows: `PropertyRow`s, as an array or a fragment. Nothing else belongs here — on the web this is a `<dl>`, which may hold only term-and-description groups. |
| `layout` | `Layout` | `"inline"` | `inline` (the default) puts each label beside its value, and falls back to `stacked` on its own when the list is too narrow for both. `stacked` puts the label above the value at every width. Not `orientation`: `inline` is not horizontal below the width it wraps at, and a word that is only true on a wide screen is the kind rule 11 renames later. |
| `className` | `string` |  |  |
<!-- /props -->

<!-- props:PropertyRow -->
`PropertyRow`'s props, from the TSDoc in `registry/layout/description-list.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What the fact is called: "Embedder", "Docs folder". A `<dt>` on the web. |
| `value` (required) | `ReactNode` |  | The fact itself: a string, or a node — a `Badge`, a relative time. Not a control: a value the user edits is a form field (`FormField`), and this row has no label for it. |
| `hint` | `ReactNode` |  | One muted line under the value, on where it comes from or what it means: "Set with `RAGDOWN_EMBEDDER`". Part of the `<dd>`, so it is read with the value rather than as a fact of its own. |
| `actionSlot` | `SlotNode` |  | The row's far end: a copy button, an edit link. Inside the `<dd>`, after the value, because a `<dl>`'s rows may hold nothing but terms and descriptions — and an action on the value is part of what is said about it. |
| `className` | `string` |  |  |
| `labelClassName` | `string` |  |  |
| `valueClassName` | `string` |  | A string or number value's own `Text`, so a path, a version or an id is `value={path} valueClassName="font-mono"` rather than a node written to carry the font. On the text and not on the wrapper around it, because on device a `Text` inherits nothing: from the wrapper a `font-mono` reached the string on the web, with the hint and the action, and none of them on a phone. |
<!-- /props -->

- One source for both platforms: `@cubeui/description-list` in `/r/web` and `/r/native`, exporting
  `DescriptionList` and `PropertyRow`.
- `DescriptionList` takes the rows as `contentSlot` — `PropertyRow`s and nothing else, as an array
  with keys or a fragment. Do not wrap a row in a `<div>`: on the web the list is a `<dl>`, which may
  hold only its term-and-description groups.
- `PropertyRow` is `label` (what the fact is called), `value` (the fact: a string, or a node such
  as a `Badge`), optional `hint` (one muted line under the value, on where it comes
  from) and optional `actionSlot` (the far end: a copy button, an edit link). `labelClassName` and
  `valueClassName` reach the two halves of the row.
- **A path, a version, a port or an id is a string with `valueClassName="font-mono"`.**
  When the value is a string or a number, `valueClassName` is the class of its text — a font, a
  size, a colour — and of nothing else, so the hint and the action keep the page font and it reads
  the same on a device, where a `Text` inherits nothing. Do not pass a raw `<code>` or a `<Code>`
  for it: `Code` is a chip for a token inside a sentence, and round a whole value it is a grey box
  on every row. A long path wraps inside the row; add `break-all` to break it at any character.
  When the value is a node, the text is yours — put the class on it — and `valueClassName` is the
  value's half of the row.
- The semantics are built in. On the web: a `<dl>`, each row a `<div>` holding a `<dt>` for the
  label and a `<dd>` holding the value, the hint and the action — the hint and the action are read
  as part of the value. On device: `role="list"` and `role="listitem"`. Add no roles of your own.
- `layout="inline"` (the default) puts each label beside its value in a column the labels line up
  in, and **falls back to stacked by itself** when the list is too narrow for both — it follows the
  width the list is given, not the window. `layout="stacked"` puts the label above the value at
  every width. There is no breakpoint prop.
- A `PropertyRow` only renders inside a `DescriptionList`. A row the user *edits* is not this — it
  is a field in a form (`FormField`, or a `DialogLayout` with a form in it, opened from the row), never a value that
  turns into an input where it sits.
- It draws no surface and no heading: put it in a `Section` (or `surface="card"`) or `CardLayout`
  `contentSlot` for those.

## Setting rows

One row of a settings page: what the setting is called and what it does at the start, the control
that changes it at the end.

```tsx
<Section
  title="Appearance"
  surface="card"
  contentSlot={
    <>
      <SettingRow
        title="Dark mode"
        description="Switch between light and dark theme."
        actionSlot={({ titleId }) => (
          <Switch aria-labelledby={titleId} checked={dark} onCheckedChange={setDark} />
        )}
      />
      <SettingRow
        title="Theme"
        actionSlot={({ titleId }) => <Select aria-labelledby={titleId} value={theme} … />}
      />
      <SettingRow
        description="Forget every turn and session. This cannot be undone."
        actionSlot={<ConfirmButton content="Clear all memory" … />}
      />
    </>
  }
/>
```

<!-- props:SettingRow -->
`SettingRow`'s props, from the TSDoc in `registry/layout/setting-row.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` | `ReactNode` |  | What the setting is called: "Dark mode", "Theme", "Auto-sync". Usually given; optional because a row whose control says what it does ("Clear all memory") only needs the line explaining it. |
| `description` | `ReactNode` |  | One line under the title on what the setting does, or what pressing the button costs. |
| `descriptionPlacement` | `DescriptionPlacement` | `"inline"` | Where the description is drawn. `inline` (the default) puts it under the title; `popover` puts it behind a small button beside the title, named "About <title>". `descriptionId` is handed to `actionSlot` either way, and on the web still resolves to the text. A row with no title has nothing to put the button beside, so its description stays inline. |
| `descriptionIconSlot` | `SlotNode` |  | The `popover` button's glyph. A question mark by default. |
| `actionSlot` | `SlotNode \| ((ids: SettingRowIds) => SlotNode)` |  | The control, at the row's far end: a switch, a select, a button, an input. A function is handed the ids of the title and description so the control can be named by the title: `actionSlot={({ titleId }) => <Switch aria-labelledby={titleId} … />}`. A plain node for a control that names itself — a button whose text is the action. |
| `className` | `string` |  |  |
| `titleClassName` | `string` |  |  |
| `descriptionClassName` | `string` |  |  |
| `actionClassName` | `string` |  |  |
<!-- /props -->

- One source for both platforms: `@cubeui/setting-row` in `/r/web` and `/r/native`.
- `title` (what the setting is called), `description` (one line on what it does), `actionSlot` (the
  control). `title` is optional for a row whose button already says what it does.
- **`actionSlot` as a function is how the title names the control.** It is handed `{ titleId,
  descriptionId }`; put `aria-labelledby={titleId}` on a switch, select or input so its name is
  the visible title rather than a second string. On the web a control that takes it can also have
  `aria-describedby={descriptionId}`. iOS does not read `aria-labelledby`, so a native call site
  that must be named on an iPhone passes `accessibilityLabel` as well. A **button** is a plain node:
  its own text is its name, and pointing it at the title would rename it.
- `descriptionPlacement="popover"` puts the description behind a small button beside the title,
  named "About <title>", with `descriptionIconSlot` for its glyph. `descriptionId` is handed to
  `actionSlot` either way and on the web still resolves, so keep the `aria-describedby`. A row
  with no `title` keeps its description inline.
- It **wraps rather than breaking at a width**: the control sits beside the text while both fit
  and drops under it, at the start, when they do not — following the width the row is given, not
  the window. A switch stays beside its title on a phone; a select or a wide button goes under.
  There is no breakpoint prop.
- It draws no surface, no border and no heading. Put the rows in a `Section` (`surface="card"`) or
  `CardLayout` `contentSlot`; the gap between them is the parent's.
- **`SwitchField` or `SettingRow`?** `SwitchField` (`@cubeui/switch-field`) is a lone boolean —
  the switch with its caption beside it, the whole row one hit target. It takes a `description`
  under the caption and `disabled`, so a switch that cannot be changed can say why. Take
  `SettingRow` for any other control — a select, a button, an input — and for a switch that
  sits at the far end of a settings card. A read-only fact is `PropertyRow`, not this; a value
  inside a form is a field (`FormField`, the bound fields).

## Stat tiles

One figure on a card — a label, the number, a line under it. A row of them is the top of a
dashboard or a status page; pressable, they are the filter over the list below.

```tsx
import { formatCount, formatDuration } from "@/lib/format";

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatTile label="Turns" value={formatCount(engine.turns)} />
  <StatTile label="Entities" value={formatCount(engine.entities)} hint={formatCount(edges, "edge")} />
  <StatTile label="Uptime" value={formatDuration(uptime)} hint={`v${version}`} iconSlot={<Clock />} />
  <StatTile label="Embeddings" value={count} loading={isPending} />
</div>

// The filter tile: a toggle, one heap shown at a time.
{HEAPS.map((heap) => (
  <StatTile
    key={heap}
    label={LABELS[heap]}
    value={counts[heap]}
    selected={shown === heap}
    onPress={() => setShown(shown === heap ? null : heap)}
    valueClassName={heap === "attention" && counts[heap] > 0 ? "text-negative" : undefined}
  />
))}
```

<!-- props:StatTile -->
`StatTile`'s props, from the TSDoc in `registry/layout/stat-tile.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What the figure is called: "Turns", "Daily average". Drawn above it, muted. |
| `value` (required) | `ReactNode` |  | The figure: a string or a number, drawn large in tabular numerals so a row of tiles lines up as it ticks. A node works too — a `ColorDot` beside a category's name — and is placed as is. |
| `hint` | `ReactNode` |  | One muted line under the figure: what it is out of, or where it comes from — "over 7 days", "schema v4". Read after the value, as part of the tile. |
| `iconSlot` | `SlotNode` |  | Before the label. A bare `<Clock />`; the tile sizes it and mutes it. |
| `loading` | `boolean` | `false` | Whether the figure is still being fetched. On, a bar stands in for the value and the label stays — the tile is as tall as it will be, so a row of them does not jump when the data lands. |
| `onPress` | `(() => void)` |  | Makes the whole tile a button: a filter to toggle, a page to open. The tile's text is its accessible name, so a count and its label are read together. |
| `selected` | `boolean` |  | With `onPress`, the tile is a toggle and this is whether it is on — the filter tile over a list. Left out, the tile is a plain button. Without `onPress` it is ignored. |
| `className` | `string` |  |  |
| `valueClassName` | `string` |  | The figure's class: the colour a count takes when it is one worth noticing. |
<!-- /props -->

- One source for both platforms: `@cubeui/stat-tile`, exporting `StatTile`. On the web the press
  prop is `onClick`, as it is on the compiled `Card`.
- `label` is what the figure is called, `value` the figure — a string or number drawn large in
  tabular numerals, or a node (a `ColorDot` beside a name) placed as is — and `hint` one muted line
  under it. The label is a muted line at normal weight, so the figure is the one bold thing on the
  tile. `iconSlot` sits before the label; pass a bare `<Clock />`, the tile sizes and mutes it.
- `onPress` makes the whole tile one button, named by its text. **Add `selected` and it is a
  toggle**: `aria-pressed` on the web, `selected` in the accessibility state on device, drawn with
  an `active` border; its fill stays the card's, so chosen does not look like hovered. Without `selected` it is a plain button (a tile that opens a
  page); without `onPress`, `selected` is ignored.
- `loading` keeps the label and holds the figure's place with a bar, so a row does not jump when
  the data lands. Drop the four `<Skeleton className="h-28" />`s that stood in for the row.
- `valueClassName` is for the figure's colour — a count worth noticing in `text-negative`.
  There is no `tone` or `size` prop.
- It lays out one tile, not the row: the grid is the caller's, since the column count is the
  page's decision. A label-over-number pair with no card around it is a `DescriptionList` with
  `layout="stacked"`, not this.
