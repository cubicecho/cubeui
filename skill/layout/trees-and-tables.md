# cubeui layout: File trees and tables

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

### FileTree

Files and folders, nested as they sit on disk, from the flat list a server hands back. One source
for both platforms: `@cubeui/file-tree`, which brings `buildTree` (`@cubeui/tree`, `@/lib/tree`).

```tsx
<FileTree
  label="Skill files"
  pinned={[skillMd]}
  entries={files}                       // { path: "references/forms.md", type: "file", size: 1024 }
  selected={openPath}
  onSelect={setOpenPath}
  meta={(node) => (node.entry ? formatBytes(node.entry.size) : null)}
  actionSlot={(node) => <FileMenu node={node} />}
/>
```

<!-- props:FileTree -->
`FileTree`'s props, from the TSDoc in `registry/layout/file-tree.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the list is, for a screen reader: "Files", "Notes". Read, not drawn. |
| `entries` (required) | `readonly T[]` |  | The files, and any folders worth listing, flat and in any order. A file's missing parents are added and every level is sorted folders first, then by name — `buildTree` in `@/lib/tree`. |
| `pinned` | `readonly T[]` |  | Files drawn above the tree, in the order given, never nested or sorted: a folder's README, a skill's own Markdown. Each is called by its whole `path`, and reaches `linkSlot`, `meta` and `actionSlot` as any other file does. |
| `selected` | `string` |  | The open file: its key as `entries` listed it, which `onSelect` hands back. Its row is tinted, a step further under the pointer, and its link or button says it is the current one. The node's cleaned `path` is matched too, so `a/b.md` still finds the file listed as `a//b.md`. |
| `linkSlot` | `((node: TreeNode<T>) => ReactElement)` |  | The router's link to a file, as an element with no children — `<Link to="/notes/$" />` — which the row is drawn inside. For an app that keeps the open file in the URL, so the row is a real `<a href>` that a middle click opens. Given this, `onSelect` is not called. |
| `onSelect` | `((path: string, node: TreeNode<T>) => void)` |  | A file's row was pressed. For an app that holds the open file in state; the row is a button. `path` is the file's key exactly as `entries` listed it (`entry.path`), so an object store's `a//b.md` comes back as `a//b.md` and not as the tree's cleaned `a/b.md`. The node is the row's, for the rest of its entry. |
| `meta` | `((node: TreeNode<T>) => ReactNode)` |  | The small facts after a row's name: a size, a count, a badge. A string is drawn muted and extra small; an element is placed as it is. Inside the pressed area. Called for folders too. |
| `actionSlot` | `((node: TreeNode<T>) => SlotNode)` |  | A row's far end, **outside** the pressed area: rename and delete buttons, or one `Menu`. Where there is a pointer they are drawn on hover and on focus; on a touch screen, always. |
| `open` | `readonly string[]` |  | The paths of the open folders, when the caller holds them — to keep them across a reload, or to open the way to a file. Leave it out and the tree holds its own. |
| `onOpenChange` | `((open: string[]) => void)` |  | Told the open folders on every toggle, controlled or not. |
| `defaultOpen` | `readonly string[] \| "all"` | `"all"` | Which folders an uncontrolled tree starts with open: their paths, or every one. |
| `onMove` | `((from: string, into: string, node: TreeNode<T>) => void \| Promise<void>)` |  | A row was dropped on a folder. `from` is the dragged file's or folder's path; `into` is the folder's path, and `""` for the top level. Both are the tree's cleaned paths, so `into/name` is where the row lands. `node` is the dragged row: its `type` says whether `from` was the file or the folder when the two share a path, and its `entry.path` is the key as listed. Given this, rows can be dragged: on the web, with a pointer. The tree reorders nothing itself — move the file and hand back new `entries`. While a returned promise is pending the row is drawn muted; a rejection is the caller's to report. |
| `canMove` | `((node: TreeNode<T>, into: string) => boolean)` |  | Whether this row may be dropped there. Asked while dragging; a refused folder is not tinted. |
| `className` | `string` |  | On the tree's outer list. A dragged row can be dropped on it to move to the top level. |
<!-- /props -->

- `entries` is flat and in any order: `{ path, type: "file" | "dir" }` plus whatever else your row
  holds. A parent the list leaves out is added, and every level is sorted folders first, then by
  name. List a folder only to keep an empty one, or to give it an entry of its own.
- A **folder** is a button that folds what is under it (`aria-expanded`, a turning chevron).
  Every folder starts open. `defaultOpen={[...paths]}` starts only those open; `open` with
  `onOpenChange` hands the open paths to you — to keep them across a reload, or to open the way to
  a file. `onOpenChange` is called either way.
- A **file** is a link or a button, never both. With the open file in the URL pass
  `linkSlot={(node) => <Link to="/notes/$" params={{ _splat: node.path }} />}` — the router's link
  with no children; the row is drawn inside it, so it is a real `<a href>` and the selected one
  carries `aria-current="page"`. With the open file in state pass `onSelect`, and the row is a
  button. With neither, the row is only a row.
- `onSelect(path, node)` hands back the file's key **as `entries` listed it** (`entry.path`), so
  an object store's `a//b.md` comes back as `a//b.md`, which the store finds, and not as the tree's
  cleaned `a/b.md`. `selected` is that key; the cleaned path matches too. Its row is tinted
  `active`, a step further under the pointer, as a chosen `ListItem` is; do not hand-write that.
- `meta` is what follows a name: return a string (a size, a count) and it is drawn muted and
  `text-xs`, or return an element (a `Badge`) and it is placed as given. On the selected row
  everything in it takes the row's `foreground` ink, a string and an element's text alike. On
  device a node's own `Text` cannot be reached, so an element you return should not set a colour of
  its own: it would stay that colour on the tinted row. It is inside the pressed
  area, so nothing pressable goes there. It is called for folders too — return `null` to skip one.
- `actionSlot` is the row's far end, **outside** the pressed area: `icon-xs` outline `Button`s with an
  `aria-label`, a `ConfirmButton`, or one `Menu` behind an `Ellipsis` when there are more than two.
  Return them as one element or a fragment: `icon-xs` buttons sit 4px apart, as in every row.
  Where there is a pointer they show on hover and on keyboard focus; on a touch screen they are
  always drawn. Return `null` for a row that has none (a locked skill, a folder).
- `pinned` is drawn above the tree, in the order given, by its whole path, and is not nested or
  sorted — a skill's `SKILL.md`. Leave those entries out of `entries`.
- Every node handed to `meta`, `actionSlot` and `linkSlot` is `{ name, path, type, entry, children }`;
  `entry` is your own object, and is `undefined` on a folder the tree added.
- **Renaming a file opens a dialog or a form.** There is no rename-in-place on a row.
- **Moving is a drag onto a folder**, when you pass
  `onMove={(from, into, node) => api.move(from, into)}`. Both are the tree's cleaned paths, and
  `into` is the folder the row lands in — `""` for the top level — so the new path is yours to
  join: `into ? `${into}/${node.name}` : node.name`. `node` is the dragged row: its `type` says
  whether the file `logs` or the folder `logs` moved, and `node.entry?.path` is its key as listed. A file or a folder is dragged
  onto a folder's row, onto anything inside that folder, or onto the tree's own blank space; the
  folder it would land in is tinted, and a shut one opens when the row rests on it. The tree
  refuses a row dropped where it already is, a folder dropped into itself or into what is under
  it, and a pinned row either way — those show no tint and call nothing. The file `logs` may go
  into the folder `logs`, as `logs/logs`. For your own "Move to…" check, `isValidMove(from, into,
  node.type)` from `@/lib/tree` gives the same answer.
  `canMove={(node, into) => !isLocked(into)}` refuses more: a read-only folder, a row that must
  stay put. It is called while the row is over a target, so it is not somewhere to fetch.
- `onMove` may return a promise. The row waits where it was, muted, until it settles (only that
  row, not a file or folder of the same name); then
  `entries` says where it is. The tree moves nothing itself and shows no error: a move that fails
  rejects in your code, and the `Toast` is yours.
- **A drag needs a pointer and a browser, so it is never the only way to move a row.** There is
  no drag from the keyboard, on a touch screen or in a native build. Keep a "Move to…" item in the
  row's `actionSlot` menu that opens a dialog with a folder field, and have it call the same
  function `onMove` does.
- It is a list of lists, reached with Tab and pressed with Enter or Space. It is not a
  `role="tree"`, so do not promise arrow keys.
- A view of the same files with nothing to nest — "recently changed", search results — is not a
  tree: draw it as `ListItem`s.
- For the nodes without the look: `buildTree(entries)` returns the same sorted `TreeNode[]`.
- An object store's keys go in as listed. A leading, trailing or doubled `/` names no folder, so
  the `docs/` marker is the folder `docs`; the node's `path` is the cleaned one and `entry.path`
  the key. A file that shares its path with a folder (`logs` beside `logs/run.log`) is drawn as
  its own row after the folders, so tell the two apart by `type`, not `path`. Names sort with
  their digits as numbers: `run2` before `run10`.

### Table

When the rows have **columns** — the same four facts on every row, read down as well as across —
the list is a table, not a stack of `ListItem`s. `@cubeui/table` is shadcn's `Table`, `TableHeader`,
`TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` and `TableCaption`, installed to
`components/ui/table`, so a shadcn call site keeps compiling unchanged.

```tsx
<Table>
  <TableCaption>Servers in this workspace</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Tools</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {servers.map((s) => (
      <TableRow key={s.id}>
        <TableHead>{s.name}</TableHead>
        <TableCell className="text-right">{s.tools}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

<!-- props:Table -->
`Table`'s props, from the TSDoc in `registry/web/ui/table.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `maxHeight` | `"sm" \| "md" \| "lg"` |  | The tallest the table may get before it scrolls inside itself, with its header row pinned at the top. Left out, it is as tall as its rows and the page scrolls it. For a long table — a log, an audit trail — that would carry its column names off the screen. `sm` and `md` are twenty and thirty-two rem, `lg` is 70% of the screen's height. |
<!-- /props -->

- It is a primitive, so it takes `children` like shadcn's. The `LoadState` ladder goes above it
  exactly as it does above a list of rows.
- **`TableHead` scopes itself**: `scope="col"` inside `TableHeader`, `scope="row"` anywhere else.
  So the first cell of a body row — the thing the row is *about* — is a `TableHead`, not a
  `TableCell`, and a screen reader names the row before reading each cell of it. Pass `scope`
  to override.
- **The column names are quieter than the data**: `TableHead` in a `TableHeader` is
  `text-foreground/60`, on one line. A row's own header in the body is in the data's ink, so the
  row's subject is not its quietest text. The table sets `tabular-nums`, so a right-aligned column
  of figures lines up digit for digit. Right-align a number column yourself with
  `className="text-right"` on its head and cells. The row rules collapse into one line, with or
  without Tailwind's preflight.
- **Body cells wrap; column names don't.** A message or a title wraps at its column's width, so
  a table on a card fits the card rather than scrolling. A name stays on one line, and it is also
  the narrowest its column gets. Give a value that reads wrongly broken — a date, a time, an id, a
  person's name, a figure with its unit — `className="whitespace-nowrap"` on its cells.
- **A value with no spaces — a URL, a hash, a path — can't wrap at a word**, so it sets its
  column's width and pushes the table wide. Put `className="wrap-anywhere"` on that column's
  cells and it breaks between any two letters instead. Keep it to that column: on every cell, a
  narrow table breaks ordinary words mid-word rather than scrolling.
- **A row tints under the pointer only when it can be acted on**: it holds a checkbox, a link, a
  button or a field, or it has an `onClick`. A row of words alone stays still, and so does the
  header row. A chosen row is `data-state="selected"`, which tints it `active`, a step further
  under the pointer.
- **A `TableCaption` names the table.** Give one to every table that is not already under a
  heading saying what it is; `className="sr-only"` keeps the name without the line. Write it
  straight inside `Table`, as shadcn does: there it is drawn under the scroll box, so it stays in
  view however far the rows are scrolled, and the table is `aria-labelledby` it. A caption inside a
  fragment or a component of yours stays a `<caption>` in the table and scrolls with it. Keep it to
  words: it is read as the name, not as a line after the rows.
- Too wide for its column, it scrolls sideways inside its own container rather than widening the
  page, and the container becomes a tab stop while it does so a keyboard can scroll it too.
  The end with more columns past it fades, so it is plain there is more: the far end at first,
  both ends partway, the near end once scrolled to the last column. The fade is a mask, so it
  fades into a card or a dialog as well as the page.
  Tabbed to, its edge turns `active`, as a focused field's border does, and no ring is drawn; a
  click on it shows nothing. It keeps a transparent 1px edge for as long as it is a tab stop.
- **A long table keeps its column names in view with `maxHeight`.** The table becomes its own
  scroll box, capped at `sm` (20rem), `md` (32rem) or `lg` (70% of the screen's height), and the
  header row stays pinned at its top while the rows scroll under it. Sideways, the header moves
  with its columns. The page's own scroll can't pin it: the container that scrolls a wide table
  sideways is the box a pinned header sticks to. The cost is a second scrollbar inside the page,
  so leave it off a table short enough to read whole.

  ```tsx
  <PageLayout
    title="Run log"
    contentSlot={
      <Table maxHeight="lg">
        <TableCaption className="sr-only">Run log</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableHead>{line.time}</TableHead>
              <TableCell>{line.level}</TableCell>
              <TableCell className="whitespace-nowrap">{line.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    }
  />
  ```

  Body cells wrap, so a log's message column says `whitespace-nowrap`: one line per entry, and a
  long one scrolls the table sideways instead of making its row tall.

  The pinned header is filled with the page's `background`, so rows don't show through it. On a
  card, give it the card's fill: `<TableHeader className="bg-secondary">`.

- No sorting, filtering or pagination: nothing here uses them. Sort the array you map.
- **In a card it lines up with the card's text.** Inside `CardContent` — `CardLayout`'s body, or a
  `Card` you compose — the table reaches out by its cells' own `px-2`, so the first column's text
  starts where the card's title does and the last column ends where the card's action does, as a
  `List` there does. Its rules run nearly edge to edge, and it stays lined up while it scrolls
  sideways. A `DialogLayout`'s body counts as a card's; a dialog or popover opened from inside a
  card does not, and a table there keeps its place. Do not add a negative margin of your own.
- **Web only — no native twin.** React Native has no table element, and a phone has no width for
  columns. On native, draw the same data as rows: `ListItem`s for many records, and
  `PropertyList` / `PropertyRow` for one record's facts.
