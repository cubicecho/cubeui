# cubeui controls: Menus and command lists

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Menu

**A popover of actions is a `Menu`. Do not hand-build `menuitem` rows in a `Popover`.** A
`Pressable role="menuitem"` in a popover has no `role="menu"` around it, no arrow keys, does not
put focus back on the trigger, and its `onSelect` has to close the popover itself. `@cubeui/menu`,
on both platforms:

```tsx
<Menu>
  <MenuTrigger asChild>
    <Button variant="outline" content="Lane" />
  </MenuTrigger>
  <MenuContent align="end">
    <MenuItem iconSlot={<Pencil />} label="Rename" onSelect={startRename} />
    <MenuItem iconSlot={<ArrowLeft />} label="Move left" disabled={first} onSelect={moveLeft} />
    <MenuSeparator />
    <MenuItem iconSlot={<Trash2 />} label="Delete" destructive onSelect={remove} />
  </MenuContent>
</Menu>
```

<!-- props:Menu -->
`Menu`'s props, from the TSDoc in `registry/ui/menu.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `open` | `boolean` |  | Both optional, together, as on `Popover`: pass neither and the menu keeps its own state. |
| `onOpenChange` | `((open: boolean) => void)` |  |  |
| `defaultOpen` | `boolean` | `false` |  |
| `children` (required) | `ReactNode` |  |  |
<!-- /props -->

<!-- props:MenuItem -->
`MenuItem`'s props, from the TSDoc in `registry/ui/menu.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `iconSlot` | `SlotNode` |  | An icon from `@cubeui/icons`. Drawn quieter than the label, at `/60` as Command's row icons are, so the words lead; on a destructive row it is `text-negative` with the label. |
| `label` (required) | `string` |  | The row's text, and what typeahead matches on the web. |
| `trailing` | `ReactNode` |  | After the label, at the far edge: a shortcut, a count, a check. A string is drawn muted. |
| `destructive` | `boolean` | `false` | Draw the row in the destructive colour, for the action that deletes. |
| `disabled` | `boolean` | `false` |  |
| `onSelect` | `(() => void)` |  | Runs when the row is chosen. The menu closes itself afterwards; do not close it here. |
| `focusesElsewhere` | `boolean` | `false` | The row hands focus to something else — a field it reveals with `autoFocus` — so this close must not put focus back on the trigger, which would blur that target (and close it on `onBlur` before anything is typed). Only for the close this row causes: Escape, a click outside and every other row still return focus to the trigger. |
| `className` | `string` |  |  |
| `href` | `string` |  | Where the row goes, with no router: on the web the row is an `<a href>`, so it navigates, opens in a new tab and shows its URL. On device it does nothing more than `onSelect` — a native app navigates through its router, which is `linkSlot`. |
| `linkSlot` | `ReactElement` |  | The app's router link, as an element with no children — `<Link to="/x" preload="intent" />`. The row is drawn inside it, so on the web the menu item *is* the router's `<a>`, and hover and focus reach the link's own handlers (which is what lets a router preload on intent). On device it is cloned with `asChild` around the row, the `<Link asChild>` convention. Wins over `href`; a `disabled` row renders neither and does not navigate. |
<!-- /props -->

- **An icon-only trigger** is an icon `Button` with an `aria-label` (see
  [Icon buttons](buttons.md#icon-buttons)) under `MenuTrigger asChild`.
- **The menu closes itself when a row is chosen.** Do not hold `open` to close it from
  `onSelect`. `open` / `onOpenChange` / `defaultOpen` are there if you need them, as on `Popover`.
- **`MenuItem` takes props, not children**: `label` (the text, and what typeahead matches),
  `iconSlot`, `trailing` (a shortcut or a count; a string is drawn muted), `destructive`, `disabled`,
  `onSelect`, and `linkSlot` or `href` for a row that navigates. The icon is drawn quieter than the
  label, `text-foreground/60`, as `Command`'s are — `text-negative` on a destructive row. The menu is
  at least `min-w-48` wide, so a `trailing` shortcut does not crowd its label.
- **A row that goes somewhere is a link, not an `onSelect` that navigates.** Hand it the router's
  `Link` as an element with no children, `linkSlot`, and the row is drawn inside it — on the web the
  menu item *is* the router's `<a>`, so hovering or arrowing onto it reaches the link's own
  handlers and a router that preloads on intent does, and Enter or a click follows it and closes
  the menu:

  ```tsx
  import { Link } from "@tanstack/react-router";

  <MenuItem
    iconSlot={<ArrowRight />}
    label="Open"
    linkSlot={<Link to="/projects/$id" params={{ id }} preload="intent" />}
  />
  <MenuItem label="Help" href="https://example.com/help" />
  ```

  Any router's link that renders an `<a>` and forwards its ref fits: React Router's
  `<Link to prefetch="intent" />`, Next's `<Link href />`. `href` alone is a plain `<a href>`, for
  a URL no router owns. The row looks exactly like the others, `onSelect` still runs first, and a
  `disabled` row renders no link at all, so nothing follows it. It is `linkSlot={…}` and not
  `<Link asChild><MenuItem /></Link>` as for `SidebarNavItem`: a menu handed the router's click
  would see it cancel the browser's navigation and take that as "keep the menu open". On device,
  `linkSlot` takes the row `asChild` — expo-router's `<Link href="/x" />` — and navigates beside
  `onSelect`; `href` alone there only runs `onSelect`, because there is no URL to open.
- **A row that deletes is `destructive`, and still goes through a confirm** if the loss is real:
  open a `ConfirmDialog` from its `onSelect`.
- On the web it is radix `DropdownMenu`: arrow keys, Home/End, typeahead, focus back on the
  trigger. On device it is the popover's centred sheet with `role="menu"`; focus goes back to the
  trigger as an accessibility event. Pass `aria-label` on `MenuContent` when the trigger has no
  text — radix names the web menu after the trigger, native has nothing to point at.
- **A row whose action moves focus is `focusesElsewhere`** — a row that reveals a field and
  focuses it. Without it the menu hands focus back to its trigger after it closes, and the field
  loses the focus it was just given. It covers that row's close only: Escape, a click outside and
  the other rows still return focus.
  `<MenuItem label="Add note" focusesElsewhere onSelect={showNoteField} />`, on both halves.
- **A Rename row opens a form** — a `DialogLayout` with the name in a field and a Save button —
  not a text that turns into an input where it sits. See [No inline edits](../SKILL.md#no-inline-edits).
- **A toggle list is `MenuCheckboxItem`** — labels on a todo, columns shown in a table, anything
  on or off, several at once. Do not hand-build `role="checkbox"` rows in a `Popover`, and do not
  fake one with a `MenuItem` and a trailing `<Check />`:

  ```tsx
  <MenuContent>
    {labels.map((l) => (
      <MenuCheckboxItem
        key={l.id}
        iconSlot={<ColorDot color={l.color} />}
        label={l.name}
        checked={attached.has(l.id)}
        onCheckedChange={(on) => setAttached(l.id, on)}
      />
    ))}
  </MenuContent>
  ```

  It takes `MenuItem`'s row — `iconSlot`, `label`, `trailing`, `disabled` — plus `checked` and
  `onCheckedChange`, and draws the ✓ itself at the far edge. **The menu stays open** when one is
  toggled, so a list is set in one go; Escape or a press outside closes it. It has no `onSelect`
  and no `destructive`: a setting is not an action.
- **One of N is `MenuRadioGroup` and `MenuRadioItem`** — a filter, a sort order:

  ```tsx
  <MenuRadioGroup value={sort} onValueChange={setSort}>
    <MenuRadioItem value="due" label="Due date" />
    <MenuRadioItem value="created" label="Created" />
  </MenuRadioGroup>
  ```

  The group holds `value` and `onValueChange`; each row takes `value` and the same row props.
  **Choosing a radio row closes the menu**, as radix does on the web and the native half matches:
  a one-of-N choice is done once it is made. Checkbox and radio rows mix with `MenuItem`s and
  `MenuSeparator`s in one `MenuContent`; pass the group an `aria-label` when there is more than
  one.
- The toggle rows are `menuitemcheckbox` / `menuitemradio` with `aria-checked`, on the web and in
  an Expo web app. On device React Native has no such role, so they are `checkbox` / `radio`,
  which is what makes a screen reader say "checked".
- A popover that is a small form or a note, not a list of actions, stays a `Popover`. Its Done
  button is `PopoverClose asChild`, not a handler that sets `open` to `false`.
- **A `Button` under `PopoverTrigger asChild` or `DialogTrigger asChild` opens it by itself**, on
  every half, Expo web included — leave the popover uncontrolled. Do not hold `open` only so the
  button can `onPress={() => setOpen(!open)}`; the `Button` hands the trigger's click on from its
  own press. The same goes for `PopoverClose asChild` and `DialogClose asChild`.
- A value chosen from a list is `Select` or `Combobox`, not a menu. `MenuRadioGroup` is for a
  view setting that lives behind a menu button — a filter, a sort — not for a form's value.

## Command

A search box over a list of rows that filters as you type: shadcn's `Command` parts, on both
halves, at `components/ui/command`. `Combobox` is built on it, and it is what to reach for when
a picker or a palette needs a list that is not a tag picker.

```tsx
<Command label="Search projects">
  <CommandInput value={search} onValueChange={setSearch} placeholder="Search…" />
  <CommandList>
    <CommandEmpty>No projects.</CommandEmpty>
    <CommandGroup heading="Recent">
      {recent.map((p) => (
        <CommandItem key={p.id} value={p.name} keywords={[p.slug]} onSelect={() => open(p.id)}>
          {p.name}
          <CommandShortcut>{p.key}</CommandShortcut>
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</Command>
```

- **The web half is cmdk**, so it keeps a highlighted row, arrow keys and Enter, and ranks by a
  fuzzy score. **The native half is its own list**, because cmdk has no React Native build: a
  search `Input` over pressable rows, and a row is chosen by pressing it. There is no highlight on
  device, so cmdk's `value`, `onValueChange`, `loop` and `vimBindings` on `Command` are web only.
- **The native default filter wants every typed word**, in any order and any case, and keeps the
  list in the order you wrote it; cmdk's fuzzy scorer re-sorts. Pass `filter` — cmdk's
  `(value, search, keywords) => number` — and both halves give the same answer.
  `matchesEveryWord` from `@/components/ui/command-base` is the native default, to hand the web
  half too.
- **Give `CommandItem` a `value`** whenever the row holds more than its name. Without one, cmdk
  matches the row's `textContent` and native its text children, and both include a
  `CommandShortcut` or a badge in what is searched and handed to `onSelect`.
- `label` on `Command` names the search box, `label` on `CommandList` the list (default
  "Suggestions"). `forceMount` keeps a group or a row drawn through the filter — a "Create …" row.
- `CommandDialog` is the palette in a `Dialog`, on both halves; `title` and `description` name it
  and are not drawn. It takes `Command`'s `label`, `filter` and `shouldFilter` and hands them to
  the list inside, so a palette over results a server already matched passes
  `shouldFilter={false}`.
- **A search dialog is `CommandDialog`** — a ⌘K palette, "Find a todo", "Jump to project". Put
  what the title would have said in `title` (read out) and the hint in the input's `placeholder`.
  Do **not** build one as `Command` inside your own `Dialog` or `DialogLayout`: their card is
  padded, and `CommandInput` is not a field with a box of its own but a row across the top of the
  `Command`, ruled off from the list. In a padded card that rule stops short of the edges and
  floats under the title. `CommandDialog` draws the card with no padding so the row runs edge to
  edge.
- **Do not clear `Command`'s fill** (`className="bg-transparent"`). Its `bg-secondary` is what
  makes the input row and the list read as one panel wherever it is not the whole surface — on a
  page, in a card. With the fill gone only the rule is left. Do not restyle `CommandInput`'s
  height or border either; if it looks wrong, the `Command` is in the wrong container.
