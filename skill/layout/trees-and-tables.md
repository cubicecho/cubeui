# File trees and tables

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
- `selected` is the open file's **path**. Its row is filled `active`; do not hand-write that.
- `meta` is what follows a name: return a string (a size, a count) and it is drawn muted and
  `text-xs`, or return an element (a `Badge`) and it is placed as given. On the selected row
  everything in it takes the row's `active-foreground` ink, a string and an element's text alike. On
  device a node's own `Text` cannot be reached, so an element you return should not set a colour of
  its own: it would stay that colour on the filled row. It is inside the pressed
  area, so nothing pressable goes there. It is called for folders too — return `null` to skip one.
- `actionSlot` is the row's far end, **outside** the pressed area: `icon-xs` outline `Button`s with an
  `aria-label`, a `ConfirmButton`, or one `Menu` behind an `Ellipsis` when there are more than two.
  Where there is a pointer they show on hover and on keyboard focus; on a touch screen they are
  always drawn. Return `null` for a row that has none (a locked skill, a folder).
- `pinned` is drawn above the tree, in the order given, by its whole path, and is not nested or
  sorted — a skill's `SKILL.md`. Leave those entries out of `entries`.
- Every node handed to `meta`, `actionSlot` and `linkSlot` is `{ name, path, type, entry, children }`;
  `entry` is your own object, and is `undefined` on a folder the tree added.
- **Renaming a file opens a dialog or a form.** There is no rename-in-place on a row.
- **Moving is a drag onto a folder**, when you pass `onMove={(from, into) => api.move(from, into)}`.
  Both are paths, and `into` is the folder the row lands in — `""` for the top level — so the new
  path is yours to join: `into ? `${into}/${node.name}` : node.name`. A file or a folder is dragged
  onto a folder's row, onto anything inside that folder, or onto the tree's own blank space; the
  folder it would land in is tinted, and a shut one opens when the row rests on it. The tree
  refuses a row dropped where it already is, a folder dropped into itself or into what is under
  it, and a pinned row either way — those show no tint and call nothing.
  `canMove={(node, into) => !isLocked(into)}` refuses more: a read-only folder, a row that must
  stay put. It is called while the row is over a target, so it is not somewhere to fetch.
- `onMove` may return a promise. The row waits where it was, muted, until it settles; then
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

- It is a primitive, so it takes `children` like shadcn's. The `QueryState` ladder goes above it
  exactly as it does above a list of rows.
- **`TableHead` scopes itself**: `scope="col"` inside `TableHeader`, `scope="row"` anywhere else.
  So the first cell of a body row — the thing the row is *about* — is a `TableHead`, not a
  `TableCell`, and a screen reader names the row before reading each cell of it. Pass `scope`
  to override.
- **The header row is quieter than the data**: `TableHead` in a `TableHeader` is `text-foreground/60`,
  and the table sets `tabular-nums`, so a right-aligned column of figures lines up digit for digit.
  Right-align a number column yourself with `className="text-right"` on its head and cells. The row
  rules collapse into one line, with or without Tailwind's preflight.
- **A `TableCaption` names the table.** Give one to every table that is not already under a
  heading saying what it is; `className="sr-only"` keeps the name without the line.
- Too wide for its column, it scrolls sideways inside its own container rather than widening the
  page, and the container becomes a tab stop while it does so a keyboard can scroll it too.
- No sorting, filtering or pagination: nothing here uses them. Sort the array you map.
- **Web only — no native twin.** React Native has no table element, and a phone has no width for
  columns. On native, draw the same data as rows: `ListItem`s for many records, and
  `DescriptionList` / `PropertyRow` for one record's facts.
