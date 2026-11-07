# Updating to the November 2026 layouts

What an app changes when it reinstalls its cubeui items after the layout refactor. Work through
the sections for the items your app has installed (`ls components components/ui`); a section for
an item you don't have does not apply.

**How to update.** cubeui has no version numbers: the registry published from `main` is the
newest version. Reinstall every cubeui item the app has with
`npx shadcn add @cubeui/<item> --overwrite`, then go through this list, then run the app's
typecheck, lint and tests. Files you have edited by hand are overwritten; re-apply your edits or
move them out of the cubeui file first.

- **Formatting.** The CLI rewrites import paths, so the reinstalled files can come out of your
  formatter's import order: run it over them (`biome check --write <components dir>`) before lint.
  An app that keeps cubeui's files out of its linter skips this, but has to add each file the
  reinstall writes for the first time to that list (see [New files](#new-files)).
- **npm dependencies.** The CLI adds the items' new npm dependencies, such as
  `@radix-ui/react-slot` for `button`. It puts them in `dependencies` even in an app that keeps
  its web packages in `devDependencies`. It also raises the ranges of packages the app already has
  (`radix-ui`, `lucide-react`) to the newest. Move the new ones to where the app keeps its
  packages, put back any pin you meant to keep, and commit the `package.json` and lockfile.
  An earlier reinstall added `@types/react-dom@~19.2.0` to `dependencies`
  ([#408](https://github.com/cubicecho/cubeui/issues/408)): remove it, or put the app's own entry
  back in `devDependencies`. Only an Expo app with `menu` still gets it, because `menu`'s web half
  needs React DOM's types and the CLI can't add a dev dependency to an Expo app; leave it there.
  In an Expo app, change `"nativewind": "^5.0.0-rc.0"` to `"5.0.0-rc.0"`, and pin
  `react-native-css` at `3.1.0-rc.0` the same way. npm saves both with a caret. The caret takes
  5.0.0-rc.1 the next time the lockfile is rebuilt, which needs a newer `react-native-css` than
  cubeui's patch is for, and the install fails
  ([#429](https://github.com/cubicecho/cubeui/issues/429)).
- **shadcn's own files.** `@cubeui/table` (web), `@cubeui/separator` and `@cubeui/alert-dialog`
  install to the same `components/ui/` paths as shadcn's components of those names. In an app that
  had shadcn's, cubeui's replaces it, so check the call sites.

## Removed items

| Item | Replace with |
|---|---|
| `page` (`Page`, `CardGrid`) | `PageLayout` (`@cubeui/page-layout`); for a body with no title block, `HeaderContentFooter`. `CardGrid` becomes `GridLayout` (`@cubeui/grid-layout`). `PageHeader` and `EmptyState` are imported from their own items, so install `@cubeui/page-header` and `@cubeui/empty-state` if the app does not have them. Delete `components/page.tsx`. |
| `detail-page` (`DetailPage`) | `<LoadState query={q} what="…" record={q.data} notFoundLabel="…" />` (`@cubeui/load-state`), then the page once `q.data` is there. Inside a page that already has its level-1 title, pass `level={2}`. The not-found state comes from an empty answer (`record` is `null` or `undefined`). A query that throws on a 404, as a REST fetch under TanStack Query usually does, shows the error instead: have the query function return `null` for a 404. Delete `components/detail-page.tsx`. |
| `detail-header` (`DetailHeader`) | `<PageHeader backSlot={<Button aria-label="Back" onPress={f} … />} iconSlot={<ColorDot color={c} />} title={t} description={d} actionSlot={<>{badges}{actions}</>} />`, or the same props on `PageLayout`. Delete `components/detail-header.tsx`. |
| `top-bar-layout` (`TopBarLayout`) | `<HeaderContentFooter className="h-full" headerSlot={<AppBar brandSlot={…} navSlot={…} navLabel="Main" actionSlot={…} />} contentSlot={<main>…</main>} />`, installing `@cubeui/app-bar`. Delete `components/top-bar-layout.tsx`. |
| `StickyHeaderContentFooter` (from `header-content-footer`) | `<HeaderContentFooter scroll className="h-full …" />`, or `PageLayout` when the header is a `PageHeader`. `PageLayout` lays its body out differently: it adds `gap-4 py-4`, and `width` defaults to `page`, a centred column with `px-4`, where the old body ran the full width. For the old body pass `width="full"` and `contentClassName="gap-0 py-0"`. |
| `PageInsetContext` (from `page-header`) | A `PageHeader` inside a padded column of your own takes `className="px-0 pt-0"`. |
| `form-dialog` (`FormDialog`), retired earlier (#273) | An app last updated before then still has `components/ui/form-dialog.tsx`. A form in a dialog is `DialogLayout` (`@cubeui/dialog-layout`); the skill's `forms/app-form.md` shows the shape. Delete the file. |

## Renamed items

Each old name still works for one release, in two places. The new item exports the old names as
`@deprecated` aliases, so an app that reinstalls the new item compiles before it renames anything.
The old item installs as a one-file shim that re-exports the new item under the old names, for an
app that installs by the old item name. Both go in the next release. Move to the new names now:
install the new item, change the import and the names, and delete the old file. An old item the
app has only because another item pulled it in (`query-state` under `page`) has no imports to
move: delete it.

`LoadStateProps` is now a union of the list form and the single-record form. A wrapper that
writes `Omit<LoadStateProps, "what">` collapses the union and stops compiling. Distribute the
`Omit` over the union instead:
`type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never`.

| Old item (`Old` name) | New item (`New` name) |
|---|---|
| `query-state` (`QueryState`, `QueryStateProps`, `QueryError`) | `load-state` (`LoadState`, `LoadStateProps`, `LoadError`) |
| `route-error` (`RouteError`) | `error-page` (`ErrorPage`) |
| `disclosure` (`Disclosure`, `DisclosureTrigger`) | `collapsible` (`Collapsible`, `CollapsibleTrigger`) |
| `disclosure-row` (`DisclosureRow`) | `collapsible-row` (`CollapsibleRow`) |
| `description-list` (`DescriptionList`; `PropertyRow` keeps its name) | `property-list` (`PropertyList`) |
| `centered-layout` (`CenteredLayout`, `CenteredLayoutProps`) | `centered-card-layout` (`CenteredCardLayout`, `CenteredCardLayoutProps`) |
| `SidebarNavItem`, `SidebarNavItemProps`, `SidebarNavItemStatus` (in `sidebar`) | `SidebarItem`, `SidebarItemProps`, `SidebarItemStatus` |
| `BarNavItem`, `BarNavItemProps` (in `sidebar`) | `AppBarItem`, `AppBarItemProps` |

`Collapsible` installs to `components/collapsible.tsx`. An app that also has shadcn's own
`components/ui/collapsible.tsx` has two exports by that name; import ours by its path.

The parts' `data-slot` (web) and `testID` (native) names follow the new names. Only a selector or
test that finds them by name needs changing:

| Old | New |
|---|---|
| `query-error` | `load-error` (`row-skeleton` stays) |
| `route-error`, `route-error-title`, `route-error-details` | `error-page`, `error-page-title`, `error-page-details` |
| `disclosure`, `disclosure-*` | `collapsible`, `collapsible-*` |
| `disclosure-row`, `disclosure-row-*` | `collapsible-row`, `collapsible-row-*` |
| `description-list` | `property-list` (`property-row-*` stays) |
| `centered-layout` | `centered-card-layout` |
| `sidebar-nav-item-*` | `sidebar-item-*` |
| `bar-nav-item` | `app-bar-item` |

## Changed props

| Item | Change |
|---|---|
| `Section` | `surface` is gone. Replace `<Section surface="card" …>` with `<CardLayout level={2} …>`, keeping `title`, `description`, `actionSlot` and `contentSlot`. A `divider`, or a `level` above 3, has no `CardLayout` counterpart. New: `actionPlacement`, as `CardLayout` has. |
| `PageHeader`, `PageLayout` | `breadcrumbsSlot` is now `backSlot` (the old name still works, deprecated). A back button put in `iconSlot` moves to `backSlot`; `iconSlot` is the page's own icon. New: `size` (`"lg" \| "md" \| "sm"`) sets the title size apart from `level`; `headerBarSlot` adds full-width bars under the title. |
| `PageLayout` | `headerClassName` now lands on the whole header, which runs the full width, not on the `PageHeader` inside it. The rule under the title runs the pane's width. |
| `Table` | New: `maxHeight` (`"sm" \| "md" \| "lg"`) caps the table's height and pins its header row while the rows scroll inside it ([#415](https://github.com/cubicecho/cubeui/issues/415)). An app whose own `table.tsx` had a `sticky` prop loses it on reinstall: use `maxHeight` instead, and remove the scrolling box and `max-h-*` the app put around the table for it. |
| `RouteError` | `actionsSlot` is now `actionSlot` (the old name still works, deprecated). |
| `UnsavedChangesDialog`, `useUnsavedChangesGuard` | `stayLabel` is now `keepLabel`, and the guard's `stay()` is now `keep()` (old names still work, deprecated). |
| `LoadState` (was `QueryState`) | New: `record` with `notFoundLabel` for a single record, and `level` for the not-found title. |
| `DialogLayout` | New: `iconSlot`, a header `actionSlot`, `loading` and `emptySlot`, as `CardLayout` has. New: `descriptionPlacement` and `descriptionIconSlot`, as the card and the fields take them ([#417](https://github.com/cubicecho/cubeui/issues/417)), and `actionPlacement`. |
| `CollapsibleRow` (was `DisclosureRow`) | A string `description` is drawn small and muted, as `ListItem` draws it. An element is drawn as given, so an element that was muted before now isn't: pass a string, or put the classes on the element. |
| `icons` | New: `Activity`, `ArchiveRestore`, `Bot`, `GitBranch`, `Layers`, `List`, `ListChecks`, `LogOut`, `PlugZap`, `RotateCcwClock`, `Route`, `ScanSearch`, `Server`, `SkipForward`, `Sparkles` and `Zap` ([#418](https://github.com/cubicecho/cubeui/issues/418)). Import them from `@/components/ui/icons` instead of `lucide-react`, and delete their lines from your own `app-icons` files. `History` is `RotateCcwClock`, lucide's current name for it. `Archive` is in the set too ([#435](https://github.com/cubicecho/cubeui/issues/435)). |

## Moved installs

| Item | Change |
|---|---|
| `radio-group-field` | Installs to `components/ui/radio-group-field.tsx`. Change `@/components/radio-group-field` to `@/components/ui/radio-group-field`, and delete the old `components/radio-group-field.tsx`: a reinstall writes the new file but leaves the old one in place. |
| `section` | Now installs `card-layout` too. |
| `split-layout` | Now installs `app-bar` too. |

### New files

A reinstall can write files the app has never had: `components/section-heading.tsx` (from
`section` and `sidebar`), `lib/frame-focus-guard.ts` (from `dialog`, `menu`, `popover`, `select`
and `alert-dialog`), and every new item it pulls in as a dependency, such as `card-layout`,
`app-bar`, `grid-layout` or `list`. Run `git status` after the reinstall to see them. An app
that lists cubeui's files one by one, in its Biome or lint config or in a coverage exclude, has
to add them.

## Looks that changed

- **Chosen things are tinted, not filled.** A chosen row, the current sidebar place, the active
  tab, the chosen segment, a checked checkbox, an on switch, a chosen radio, a toggle chip, the
  picked calendar day, a selected stat tile, a checked menu row and a chosen select or combobox
  option are all `bg-active/40` with normal text, and `bg-active/60` under the pointer and when
  focused. A checkbox, switch, radio or toggle chip also has an `active` edge. Anything of your own
  drawn on a chosen thing in `text-active-foreground` should now be `text-foreground`.
- **`CollapsibleRow` (was `DisclosureRow`) has no frame.** It has `ListItem`'s padding and no outline. Inside a `List`
  it now matches the rows beside it; a row standing on its own that wants the old frame passes
  `className="border border-foreground/10"`.
- **`Section`'s heading looks like a card's:** the action sits level with the top of the title,
  16px from the text.
- **`CardLayout`'s `headerClassName`** lands on the header around the title row: padding, border
  and fill classes work as before, but a flex class there no longer reaches the row. The row now
  wraps the action under the title when the title would get narrower than 10rem. The usual flex
  class was a `flex-nowrap` that kept the action on the title's line: drop it and pass
  `actionPlacement="inline"`, which keeps the action there and truncates the title instead
  ([#416](https://github.com/cubicecho/cubeui/issues/416)). `Section` and `DialogLayout` take it too.
- **`PageHeader`'s `contentSlot` (`PageLayout`'s `headerContentSlot`) no longer stretches what you
  put in it.** Each node sits at its own width from the start of the line, so a tab list is as wide as
  its tabs instead of running the page's width
  ([#414](https://github.com/cubicecho/cubeui/issues/414)). `Input` and `SearchInput` still fill
  the line. A `div` or `View` of your own that should fill it, such as a row of filters, passes
  `self-stretch`.
- **A page header with a back button is shorter.** The title row under `backSlot` is a button's
  height, with the title at its top, so a lone title no longer has an empty band above and below it
  ([#413](https://github.com/cubicecho/cubeui/issues/413)). Without a description, the header is
  20px shorter at `lg`, 12px at `md` and 4px at `sm`, and the body under it moves up by as much.
- **`SidebarLayout`'s phone bar is `AppBar`.** Its parts are `data-slot` `app-bar`,
  `app-bar-brand`, `app-bar-nav`, `app-bar-status` and `app-bar-action`. They were
  `sidebar-layout-header`, `-brand`, `-nav`, `-status` and `-action`. `sidebar-layout-main`,
  `sidebar-layout-content` and `sidebar-layout-bottom-bar` keep their names. Only a selector on the
  renamed ones needs changing.
- **Icon-only buttons show their name on hover again**
  ([#419](https://github.com/cubicecho/cubeui/issues/419)). A `Button` at an `icon*` size, and so
  `CopyButton`, `DownloadButton` and `ConfirmButton` at one, shows its `aria-label` as its tooltip,
  as `ActionButton` did. A `hint` still replaces it. Pass `tooltip={false}` to a `Button`,
  `ConfirmButton`, `CopyButton` or `DownloadButton` to turn it off
  ([#424](https://github.com/cubicecho/cubeui/issues/424)), and remove any `Tooltip` you wrapped
  around an icon button by hand, or it shows two.
- **On device a tooltip no longer wraps its trigger in a `View`**
  ([#423](https://github.com/cubicecho/cubeui/issues/423)). The classes on a button, switch or
  row with a tooltip place it in its parent again: `absolute top-2 right-2`, `ml-auto`,
  `self-end` and `flex-1` work as they do on the web. A class you moved onto a `View` of your own
  to get round the wrapper can come back to the button.
- **`Markdown` lines a toggle up with its heading, and keeps a mixed list's bullets**
  ([#412](https://github.com/cubicecho/cubeui/issues/412)). With `collapsible`, a heading's
  chevron is level with its text, not 12px above it. A list with task items and plain items
  keeps the plain items' bullets. Every task item's box now hangs in the list's indent, where a
  bullet would be, so its text lines up with the other items' text, and a nested task list is
  indented under its item.
- **A disabled link button is no longer followed**
  ([#410](https://github.com/cubicecho/cubeui/issues/410)). A `Button` with a `linkSlot` and
  `disabled` (or `loading`) is `aria-disabled` and leaves the tab order, and its click does
  nothing. It no longer writes `disabled` on the `<a>`.
- **An empty `MarkdownCodeEditor` no longer tints its line while focused**
  ([#436](https://github.com/cubicecho/cubeui/issues/436)). The placeholder sits on the page's
  background, as an input's does. On the tint it was too faint to read. The current line is
  tinted again once there is text.
- **A focused `Table` no longer draws the browser's focus ring**
  ([#445](https://github.com/cubicecho/cubeui/issues/445)). A table too wide or too tall for its
  container is a tab stop. Tabbed to, its edge turns `active`, as a focused field's border does. A
  click on it shows nothing. While it can scroll, it has a transparent 1px edge, so its rows sit
  1px further in.

## Checking the result

- Typecheck finds every removed item and prop.
- Search for `surface="card"`, `StickyHeaderContentFooter`, `breadcrumbsSlot`, `actionsSlot`,
  `stayLabel`, `text-active-foreground`, the renamed `sidebar-layout-header`, `-brand`, `-nav`,
  `-status` and `-action` slots, and the removed items' names (whole words: `DetailPage`, not
  `ServerDetailPage`).
- Run `git status` for files the reinstall wrote for the first time.
- Search for the old names in the renamed items' table, and their old `data-slot` / `testID`
  names; your editor marks each deprecated name that is left.
- Look at every screen with a chosen row, tab, checkbox or sidebar in both themes.
