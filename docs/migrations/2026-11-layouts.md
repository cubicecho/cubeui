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
| `detail-page` (`DetailPage`) | A `PageLayout` that is always drawn, with `title={q.data?.name ?? "Project"}` and `loading={q.isPending}`, and in its body `<LoadState query={q} what="…" record={q.data} notFoundLabel="…" description="…" actionSlot={<Button content="Back to projects" … />} level={2} />` (`@cubeui/load-state`), then the record's body once `q.data` is there ([#476](https://github.com/cubicecho/cubeui/issues/476)). The title's bar is the only loading state: `LoadState` draws no rows inside a loading `PageLayout`. The not-found state comes from an empty answer (`record` is `null` or `undefined`). A query that throws on a 404, as a REST fetch under TanStack Query usually does, shows the error instead: have the query function return `null` for a 404. Delete `components/detail-page.tsx`. |
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
| `ErrorPage`, `LoadError` | Without `describe`, the line under the title is `describeError`'s, from `@cubeui/error-message`. A `describe` that returns `""` hands the error to it. To add your own failures, answer those and return `describeError(error)` for the rest ([#482](https://github.com/cubicecho/cubeui/issues/482)). |
| `EmptyTitle` | New: `level` (`1 \| 2 \| 3`) makes it a heading of that rank, at the same size. It replaces passing `role="heading"` and `aria-level` yourself, which still works ([#482](https://github.com/cubicecho/cubeui/issues/482)). |
| `useToast` | The tone `"error"` is now `"negative"`, the colour token's name (the old name still works, deprecated). It is still the default ([#477](https://github.com/cubicecho/cubeui/issues/477)). |
| `UnsavedChangesDialog`, `useUnsavedChangesGuard` | `stayLabel` is now `keepLabel`, and the guard's `stay()` is now `keep()` (old names still work, deprecated). |
| `LoadState` (was `QueryState`) | New: `record` with `notFoundLabel` for a single record, and `level` for the not-found title. New with `record`: `description` and `actionSlot` on the not-found block, for what happened and the way back ([#476](https://github.com/cubicecho/cubeui/issues/476)). Inside a `PageLayout` whose `loading` is on, the loading rung draws nothing. A detail screen that drew `LoadState` in front of its page moves it into the page's body: see the `DetailPage` row above. |
| `DialogLayout` | New: `iconSlot`, a header `actionSlot`, `loading` and `emptySlot`, as `CardLayout` has. New: `descriptionPlacement` and `descriptionIconSlot`, as the card and the fields take them ([#417](https://github.com/cubicecho/cubeui/issues/417)), and `actionPlacement`. |
| `CollapsibleRow` (was `DisclosureRow`) | A string `description` is drawn small and muted, as `ListItem` draws it. An element is drawn as given, so an element that was muted before now isn't: pass a string, or put the classes on the element. |
| `ItemSeparator` | It is `Separator` with shadcn's `my-0`, and takes `Separator`'s props: `orientation`, `decorative` and `className`. Radix's `asChild` is gone ([#475](https://github.com/cubicecho/cubeui/issues/475)). |
| `list-item` | `LIST_ITEM_CLASS` is gone. A row of your own that used it for `ListItem`'s box is `<Item size="sm">` ([#475](https://github.com/cubicecho/cubeui/issues/475)). |
| `FormField`, `Field`, the bound fields | New: `disabled` on `FormField` and `Field`, and as a field prop on every bound field on both halves, fades the label and the description with the control ([#466](https://github.com/cubicecho/cubeui/issues/466)). On a bound field it was already passed to the control, and still is. |
| `DateTimeInput`, `DateTimeField` | New: `disabled`, on the trigger and the time box ([#466](https://github.com/cubicecho/cubeui/issues/466)). |
| `SubmitButton` (`app-form`, `form`) | One API on both halves ([#478](https://github.com/cubicecho/cubeui/issues/478)): `isEdit` picks `createLabel` or `editLabel`, and `loadingLabel` is what it says while it runs. On the web, `content` is now `createLabel` and `pendingLabel` is now `loadingLabel`; in `form`, `savingLabel` is now `loadingLabel`. The old names still work, deprecated. `content={isEdit ? "Save changes" : "Create pool"}` becomes `isEdit={isEdit} createLabel="Create pool"`. In `form` it is now `positive` on a create form too, where it was `info`, and with no `isEdit` and no `createLabel` it says "Save", where it said "Create". The web one already said "Save" and was already `positive`. A web `variant="info"` on a create form's submit can go. |
| `Checkbox`, `Switch` | The device halves take `aria-invalid`, and draw it ([#467](https://github.com/cubicecho/cubeui/issues/467)). |
| `CodeBlock` | New: `jumpLabel`, the words of the "Jump to latest" button on a `follow` block, for your translation. That button is now an outline `Button`, so `code` installs `button` ([#469](https://github.com/cubicecho/cubeui/issues/469)). |
| `RadioGroupItem` | `hint` is a `Tooltip` and the option's description, on both halves, where it was the web's `title` attribute ([#472](https://github.com/cubicecho/cubeui/issues/472)). A test that read the `title` reads the description instead. `radio-group` now installs `tooltip`. |
| `PopoverTrigger`, `PopoverClose`, `MenuTrigger` | On device, an `asChild` child's own `onPress` now runs as well as the trigger's, as it does on the web ([#461](https://github.com/cubicecho/cubeui/issues/461)). A Done button under `PopoverClose asChild` can do its work in its own `onPress`: a popover made controlled only to run it can go back to uncontrolled. |
| `color` | `hexToHsl` and `hexToAccent` read `#rgb` and a hex with no `#`, and return `undefined` for a value that is not hex, where they returned NaN. `hexToDesaturated` is gone; nothing called it ([#462](https://github.com/cubicecho/cubeui/issues/462)). |
| `format` | `formatAgo` writes `now` under a minute, in the reader's language, where it wrote `just now`. A count that rounds up to the next unit is written in it: `yesterday`, not `24 hours ago`, and `last week`, not `7 days ago`. `formatBytes` picks the unit after rounding: `1.0 MB`, not `1024.0 KB` ([#468](https://github.com/cubicecho/cubeui/issues/468)). A test that expects `just now` expects `now`. |
| `tree`, `FileTree` | `buildTree` sorts `file2` before `file10`, and drops empty path segments, so an object store's `docs/` key is the folder `docs` and not an unnamed folder inside it. A file that shares its path with a folder is kept as its own row, after the folders, and the folder is drawn too; before, nothing under the folder was drawn ([#468](https://github.com/cubicecho/cubeui/issues/468)). Tell a file from a folder by `type`, not `path`. |
| `ConfirmDialog` | `confirmLabel` defaults to "Delete", as on `ConfirmButton` and `confirm()`. It was "Confirm", which names no act. A `ConfirmDialog` with no `confirmLabel` now says Delete: pass the verb if it does something else, such as Discard or Revoke ([#486](https://github.com/cubicecho/cubeui/issues/486)). |
| `DownloadButton` | New: `hint`, as on `CopyButton`. With `disabled`, it says why the button is off and keeps it focusable ([#486](https://github.com/cubicecho/cubeui/issues/486)). |
| `dialog` | New: `holdOpen`, from `@/components/ui/dialog-base`. `onInteractOutside={holdOpen}` keeps a dialog open through a press beside it, as a `preventDefault` of your own does, and on device the backdrop is then not read out as a Close button. Swap it in for a handler of yours that only calls `preventDefault` ([#486](https://github.com/cubicecho/cubeui/issues/486)). |
| `SectionHeading` | Its words are `title` now, as every shell's are: `<SectionHeading>Upcoming</SectionHeading>` becomes `<SectionHeading title="Upcoming" />`. `children` still works, deprecated, and `title` wins over it ([#484](https://github.com/cubicecho/cubeui/issues/484)). |
| `icons` | New: `Activity`, `ArchiveRestore`, `Bot`, `GitBranch`, `Layers`, `List`, `ListChecks`, `LogOut`, `PlugZap`, `RotateCcwClock`, `Route`, `ScanSearch`, `Server`, `SkipForward`, `Sparkles` and `Zap` ([#418](https://github.com/cubicecho/cubeui/issues/418)). Import them from `@/components/ui/icons` instead of `lucide-react`, and delete their lines from your own `app-icons` files. `History` is `RotateCcwClock`, lucide's current name for it. `Archive` is in the set too ([#435](https://github.com/cubicecho/cubeui/issues/435)). |

## Moved installs

| Item | Change |
|---|---|
| `radio-group-field` | Installs to `components/ui/radio-group-field.tsx`. Change `@/components/radio-group-field` to `@/components/ui/radio-group-field`, and delete the old `components/radio-group-field.tsx`: a reinstall writes the new file but leaves the old one in place. |
| `section` | Now installs `card-layout` too. |
| `split-layout` | Now installs `app-bar` too. |
| `item` | Now installs `separator` too. |
| `list-item` | Now installs `item` too, and so `collapsible-row` does. |

### New files

A reinstall can write files the app has never had: `components/section-heading.tsx` (from
`section` and `sidebar`), `lib/frame-focus-guard.ts` (from `dialog`, `menu`, `popover`, `select`
and `alert-dialog`), `lib/readable-text-color.ts` (from `color`, and so from `card` and
`color-bar`), `components/ui/overflows.tsx` (from `header-content-footer`, `split-layout`
and `table`; an Expo app also gets `overflows.web.tsx`), `lib/roving-focus.ts` (from
`radio-group`, `color-picker` and `tabs`), and every new item it pulls in as a dependency, such as `card-layout`,
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
  around an icon button by hand, or it shows two. `PasswordInput`'s eye, `SearchInput`'s ✕ and
  the button `descriptionPlacement="popover"` draws show none
  ([#425](https://github.com/cubicecho/cubeui/issues/425)).
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
  shaded again once there is text, in `hover` now (see #471 below).
- **Nothing moves for a reader who asked for reduced motion**
  ([#441](https://github.com/cubicecho/cubeui/issues/441)). Dialogs, menus, popovers, selects and
  tooltips fade without zooming or sliding, skeletons and a pulsing badge dot hold still, and
  `scrollToEnd()` jumps. The spinner still turns. The rule for `animate-in` and `animate-out` is in
  the tokens stylesheet, so it reaches the app's own uses of them too. A reinstall also writes
  `components/ui/reduced-motion.tsx`, which `useReducedMotion()` comes from.
- **`LoadError`'s full alert is capped and centred** ([#476](https://github.com/cubicecho/cubeui/issues/476)). It is at most
  `max-w-xl` wide, in the middle of what it sits in, like the empty and not-found blocks. On a
  wide page Try again is beside its words, not at the far edge.
- **The compact failure has no side inset, and is `text-sm`** ([#476](https://github.com/cubicecho/cubeui/issues/476)). `LoadError compact`
  and `LoadState compact`'s failure lost their own `px-2`, and their `text-xs`, to match
  `EmptyState compact`. In a card they now line up with the card's text. In a sidebar, pass
  `className="px-2"` to the `LoadState`, as its `EmptyState` already takes.
- **The loading bars of `CardLayout`, `PageHeader`, `StatTile` and `LoadState` pulse on device**
  ([#449](https://github.com/cubicecho/cubeui/issues/449)). They are `Skeleton` now, and held
  still there before. On the web they look the same. A reinstall of any of the four also writes
  `components/ui/skeleton.tsx` and `skeleton-base.ts`.
- **A focused `Table` no longer draws the browser's focus ring**
  ([#445](https://github.com/cubicecho/cubeui/issues/445)). A table too wide or too tall for its
  container is a tab stop. Tabbed to, its edge turns `active`, as a focused field's border does. A
  click on it shows nothing. While it can scroll, it has a transparent 1px edge, so its rows sit
  1px further in.
- **A focused `CodeBlock` or scrolling page body no longer draws the browser's focus ring**
  ([#448](https://github.com/cubicecho/cubeui/issues/448)). Both look as a focused `Table` does:
  tabbed to, the edge turns `active`, and a click shows nothing. That covers the body of a
  `HeaderContentFooter` with `scroll`, so `PageLayout`, `DialogLayout` and `Sidebar` too. The body's
  line is drawn inside it and takes no room. A block that scrolls has a transparent 1px edge, so
  its text sits 1px further in, and one that does not wrap and has no `maxHeight` is 2px taller.
- **A page's scrollbar is at the edge of the page**
  ([#451](https://github.com/cubicecho/cubeui/issues/451)). With `scroll` and `width="page"` or
  `"prose"`, so on every `PageLayout`, `HeaderContentFooter`'s body runs the full width and the
  column sits inside it. On a wide screen the scrollbar is at the window's edge and the focus line
  goes round the whole body, not round the column. Nothing in the column moves. The column is a
  new part, `data-slot="header-content-footer-column"`, and `contentClassName` lands on it. A
  selector of yours on `header-content-footer-content` that meant the column, such as its width,
  now finds the full-width scroller: point it at the column.
- **A scrolling body, table or stacked split is a tab stop only while it can scroll**
  ([#451](https://github.com/cubicecho/cubeui/issues/451)). A `HeaderContentFooter` or
  `PageLayout` body that fits is no longer a stop of its own, so a `DialogLayout` that fits opens
  with focus on its first field or button rather than on its body. A stacked `SplitLayout` taller
  than the screen is a tab stop itself, with the same inset line.
- **A `CodeBlock` is a tab stop only while its text overflows**
  ([#455](https://github.com/cubicecho/cubeui/issues/455)). A short block with `maxHeight`, or a
  short line that does not wrap, is no longer a stop, and has no 1px edge, so it is 2px shorter.
  A log that grows past its cap becomes one. A reinstall of `code` also writes
  `components/ui/overflows.tsx`.
- **`SidebarLayout`'s bar along the bottom reaches the bottom of the screen**
  ([#341](https://github.com/cubicecho/cubeui/issues/341)). With `barPosition="bottom"` the bar
  takes the bottom safe-area inset itself: its places sit above a phone's home indicator and its
  fill runs under it, so there is no strip of page background below the bar. Take `"bottom"` out
  of the `SafeAreaView` around the layout (`edges={["top", "left", "right"]}`), or the inset is
  counted twice, and remove a `pb-safe-offset-2` or `env(safe-area-inset-bottom)` class you put in
  `bottomBarClassName` for it.
- **`DialogLayout`'s footer stacks full width on a phone**
  ([#465](https://github.com/cubicecho/cubeui/issues/465)). Below `sm` its buttons are a column,
  each the footer's width, with the main one on top, as `ConfirmDialog`'s are. Before, they kept
  their labels' width at the right. A `footerSlot` given alone sits at the footer's start, not its
  end. Buttons you wrapped in a `div` or `View` in `footerActionsSlot` keep that wrapper's layout:
  pass them as a fragment.
- **Toasts stay up longer, and wait while you read them**
  ([#477](https://github.com/cubicecho/cubeui/issues/477)). A confirmation or a note stays five
  seconds, not three, and no toast goes while the pointer is over the stack or focus is in it.
  Only a `negative` toast is an `alert` now; the rest are a polite `status`, so a test of yours
  that found a confirmation by `role="alert"` finds it by `status`. Three are drawn at most. The
  corners are `rounded-md`, as a popover's and a menu's are.
- **On the web a toast is drawn over an open dialog**
  ([#477](https://github.com/cubicecho/cubeui/issues/477)). It is announced, its Undo and ✕ can
  be pressed, and pressing them leaves the dialog open. The stack is in the page while it is
  empty, as `data-slot="toast-viewport"`, and is drawn at `z-index` 60, over the dialog's 50.
- **A toast clears a bottom bar on a phone with a home indicator**
  ([#460](https://github.com/cubicecho/cubeui/issues/460)). Over `SidebarLayout`'s
  `barPosition="bottom"` the stack rises by the bottom safe-area inset as well as the bar.
- **A disabled field fades its label and its description**
  ([#466](https://github.com/cubicecho/cubeui/issues/466)). They used to stay at full ink over a faded
  control. `FormField` reads the control's own `disabled` too, so a
  `controlSlot={<Input disabled />}` fades its field with no change at the call site.
  `SwitchField` now fades its description with its caption. A `labelClassName="opacity-50"` you
  added to get this can go.
- **The date triggers look like fields**
  ([#464](https://github.com/cubicecho/cubeui/issues/464)). `DatePicker`, `DateRangePicker` and
  `DateTimeInput` stay on the page background under the pointer and under focus, where they used
  to fill grey, and focus turns the edge `active`. A refused one is edged in `negative`, on both
  halves. A searchable or `multiple` `Combobox` now draws its refused edge on device too.
- **The palettes are retuned** ([#479](https://github.com/cubicecho/cubeui/issues/479)), so each
  theme draws the same steps and the status colours differ in lightness, not only in hue.
  - Default light: a card, popover or dialog (`secondary`) is `#F5F5F5`, a step greyer, and
    `hover` is a step darker. `warning` is a darker burnt orange, `#742C02`. `negative` is
    `#B02B26`, `info` `#0863A6` and `positive` `#196635`.
  - Default dark: `secondary` is `#171717`, closer to the page than the `#262626` it was, and
    `hover` is `#142A30`. `positive` is a lighter green, `#4ADE80`.
  - Monokai: `secondary` is `#2E2F28`, `positive` `#2BCA63`, `warning` `#FD9D16` and `negative`
    `#FF74A0`.
  - shadcn's `sidebar` alias is now `background`, so a copied shadcn sidebar is drawn as the page,
    as cubeui's own `Sidebar` is, and not as a card.
  - A `Badge` dot or a `ColorDot` with a `label` shows it as a tooltip on the web. A `Tooltip` you
    wrapped around one by hand can go.
- **A refused checkbox or switch is red when checked**
  ([#467](https://github.com/cubicecho/cubeui/issues/467)). The `negative` edge wins over a checked
  box's or an on switch's `active` one, and the device halves draw it.
- **`Item` at `size="sm"` is `ListItem`'s row**
  ([#475](https://github.com/cubicecho/cubeui/issues/475)). `ListItem` is now built from `Item`'s
  parts at that size, so the two line up. The row is 12px from its edge across and 8px down, with
  12px between its parts. Its title, description and buttons follow the heading rhythm below.
  `ItemMedia` stays centred when there is a description. The row no longer sets `text-sm` on what
  is inside it, so give a bare word in `ItemActions` its own size. The `default` size is
  unchanged.
- **`CollapsibleRow`'s `meta` is at the far end of the heading**
  ([#475](https://github.com/cubicecho/cubeui/issues/475)), where `ListItem` puts it, and no
  longer straight after the title. Its `data-slot` (`testID` on device) is `list-item-meta`, where
  it was `collapsible-row-meta`.
- **Cards, sections and rows share one heading rhythm**
  ([#473](https://github.com/cubicecho/cubeui/issues/473)). `Card` and `CardLayout`, `Section`,
  `SettingRow`, `Item` at `sm`, `ListItem`, `CollapsibleRow` and `Collapsible` draw a 14px semibold
  title in full ink, a 14px description in the `/60` grey, 4px between them, and the action level
  with the top of the title. What moves:
  - **Card titles get smaller.** A `CardTitle` and a `CardLayout` title are 14px, where they were
    16px, on a 20px line. A card that should keep a bigger title passes `titleClassName="text-base"`;
    `CenteredCardLayout`'s title is still 20px. A `-my-1 py-1` you added to stop a truncated title
    losing its descenders can go.
  - **`Section`'s title is a title, not an overline.** It is 14px and in sentence case, where it
    was 12px in capitals. Write the title as you want it read; one written in capitals stays in
    capitals. `SectionHeading`'s `overline` is unchanged.
  - **Rows get taller.** On `ListItem`, `CollapsibleRow` and `Item size="sm"` the description is
    14px, where it was 12px, and 4px under the title, where it was 2px. A row with a one-line
    description is 6px taller. `meta` stays 12px.
  - **`Collapsible`'s title is in full ink**, where it was grey, and its description is 14px, 4px
    under it. A `titleClassName="text-foreground"` you added can go.
  - **Actions sit level with the title's top** on `SettingRow`, `ListItem` and `CollapsibleRow`,
    where they were centred on the text. Two actions are 8px apart, or 4px when both are `icon-xs`
    buttons: `ListItem`'s and `CollapsibleRow`'s were 4px, `FileTree`'s 2px and `PropertyRow`'s
    4px.
  - **A heading wraps at one width.** Beside an action, the text keeps 10rem or the action drops
    under it. `SettingRow` kept 12rem, so its control stays beside a little longer. `ListItem` and
    `CollapsibleRow` now wrap too, where their middle squeezed to nothing: below 10rem the
    actions go to a line of their own at the far end. `Collapsible`'s action wraps the same way.
- **A card's body spaces what it holds**
  ([#474](https://github.com/cubicecho/cubeui/issues/474)). `CardLayout`'s body has `gap-4`, as
  `Section`'s has, so rows, fields or blocks handed to it sit 16px apart, where they touched.
  `contentClassName="gap-4"` can go. A card whose children should touch passes
  `contentClassName="gap-0"`; a body that is one element (a `List`, a `form`) does not change.
- **`ErrorPage` is drawn as an empty state with a red bubble**
  ([#482](https://github.com/cubicecho/cubeui/issues/482)). It is `Empty`'s block now, so it matches an empty or not-found
  screen: a 48px bubble with a 24px icon (it was 60px and 28px), 12px between its parts (16px),
  `py-10` (`py-20`) and a `px-4` side inset (`px-8`). The title is 16px on both halves, where it was
  14px on device. The line under it, the details and the buttons are capped at 384px (448px). Its
  `data-slot`s keep their names, and the parts inside it carry `Empty`'s.
- **`LoadError` and `ErrorPage` word a failure the same way**
  ([#482](https://github.com/cubicecho/cubeui/issues/482)). Both use `describeError`, from `@cubeui/error-message`, unless
  given a `describe`. A failed fetch now reads "Could not reach the server. Check your connection
  and try again." on `LoadError` too, where it showed the browser's "Failed to fetch". "Not
  authenticated" reads "Your session has expired. Please sign in again." A failure with no message
  reads "An unexpected error occurred.", where `LoadError` said "The server did not answer." A test
  that expects the raw wording expects the new line. `ErrorPage` now also knows React Native's
  "Network request failed" and Safari's "Load failed". A reinstall of `load-state` or
  `error-page` also writes `lib/error-message.ts`.
- **An empty state's title is centred, with a gap under it**
  ([#482](https://github.com/cubicecho/cubeui/issues/482)). A title that wraps stays centred over the bubble. The line under it
  starts 4px lower and is capped at 384px, so on a wide page it wraps rather than running across
  it. A link in that line is `text-info` at rest, not only under the pointer. The bubble's 12px is
  unchanged: `EmptyHeader` has a 4px gap now and `EmptyMedia`'s margin went from 12px to 8px, so
  an `EmptyMedia` of yours outside an `EmptyHeader` sits 4px closer to what follows.
- **`EmptyState`'s heading is a real heading element on the web**
  ([#482](https://github.com/cubicecho/cubeui/issues/482)). With `level`, its title is an `<h1>`–`<h3>`, where it was a `<span>`
  with `role="heading"`. The compact line now carries `data-slot` `empty`, `empty-icon` and
  `empty-title`, like the block, so a selector of yours on `[data-slot=empty]` finds it too.
- **Every `Table` looks different: body cells wrap**
  ([#481](https://github.com/cubicecho/cubeui/issues/481)). A `TableCell`, and a row's own
  `TableHead` in the body, is no longer `whitespace-nowrap`, so a long message or title wraps at
  its column's width, and a table on a card that used to scroll sideways now fits it. Its rows get
  taller instead. The column names in `TableHeader` stay on one line. A cell that must not break —
  a date, a time, an id, a name — takes `className="whitespace-nowrap"`; a `whitespace-normal` you
  added to make a cell wrap can go. A URL or a hash still pushes the table wide: give its cells
  `wrap-anywhere`.
- **A `Table`'s caption is drawn under the scroll box**
  ([#481](https://github.com/cubicecho/cubeui/issues/481)). A `TableCaption` written straight
  inside `Table` stays in view while the rows scroll. It is a `div` now, inside a new wrapper,
  `data-slot="table-frame"`, and the table is `aria-labelledby` it, so the table's name is
  unchanged. A test that found the caption as `caption` finds it by `data-slot="table-caption"`.
  A table with no caption has no wrapper.
- **A `Table` that scrolls sideways fades the end with more columns past it**
  ([#481](https://github.com/cubicecho/cubeui/issues/481)). The far end at first, the near end once
  scrolled to the last column. Nothing moves. `useOverflows` hands back which ends have more as a
  third value, `{ start, end }`.
- **A `Table` row tints under the pointer only when it can be acted on**
  ([#481](https://github.com/cubicecho/cubeui/issues/481)). A row that holds a checkbox, a link,
  a button or a field, or has an `onClick`, turns `bg-hover` as before. A row of words alone, the
  header row and the footer stay still. A selected row is unchanged.
- **A row's own header is in the data's ink**
  ([#481](https://github.com/cubicecho/cubeui/issues/481)). A `TableHead` in the body is
  `text-foreground`, where it was `text-foreground/60` like the column names. A `text-foreground`
  you put on it, or on a `span` inside it, to undo the grey can go.
- **The two halves agree** ([#472](https://github.com/cubicecho/cubeui/issues/472)).
  - A `Button`'s icon is 14px at `xs` (it was 16px on the web) and 20px at `icon-lg` (it was
    16px), on both halves. On device every size now sizes its icon: it was lucide's own 24px. A
    `className="size-4"` you put on an icon in a button to fix that can go.
  - A segmented `RadioGroup`'s icons take the segment's ink and size on device, as
    `SegmentedButton`'s do. A `text-foreground` or `text-foreground/60` you put on them can go.
  - A `TabsList` on device is as wide as its tabs, at the start of its column, as on the web. It
    used to fill the column with its tabs centred: pass `className="self-stretch"` for that. In an
    Expo web app it is one tab stop with the arrow keys between tabs, as on the web.
  - `ColorPicker`'s swatch row is one tab stop, with the arrow keys between swatches, as
    `RadioGroup` is. A test that tabbed from swatch to swatch uses the arrows.
  - `AlertDialog size="sm"` stacks its buttons full width below `sm`, the answer on top, as every
    dialog footer does. On the web it set them side by side in two columns at every width.
  - A dialog keeps 16px from each side of the screen on device, where it kept 24px, and a `full`
    `DialogLayout` on the web keeps 16px past `sm`, where it kept 32px.
  - `AppBarItem`'s tooltip opens above it in `SidebarLayout`'s bar along the bottom.
  - On device a tooltip stays longer for a longer hint, counted from when the finger lifts. It
    closed 2.5s after it opened, whatever it said.
- **Marks that were faint, or shown only by colour, are clearer**
  ([#471](https://github.com/cubicecho/cubeui/issues/471)).
  - `MarkdownCodeEditor` shades the line the cursor is on in `hover`, not the `active` tint. A
    link, code or markup on that line was too faint on the tint.
  - A chosen `StatTile` draws its figure in `foreground`, as its label is, even with a
    `valueClassName` such as `text-negative`. An unchosen tile keeps the colour. If the colour was
    how a tile said "this needs you", add an `iconSlot` or a `hint` that says it too.
  - A `Markdown` task box is drawn at full strength, in a checkbox's colours. A ticked box and an
    empty one are now easy to tell apart. It is no longer a disabled `<button>`: it is a read-only
    `checkbox` role, out of the tab order, read as checked or not checked. A test that looked for a
    disabled checkbox there should look for `aria-readonly` instead.
  - `Card accentColor` (and `ColorBar`) keeps the hue you pick but makes it light or dark enough to
    be 3:1 from the page and the card in every theme. Pale picks get darker and deep ones lighter:
    a yellow is drawn olive, a navy mid blue. `hexToAccent` now returns `#rrggbb`, not `hsl()`.
  - A folded sidebar row's tooltip, and an `AppBarItem`'s, shows the whole name: "Servers, 2
    failing, 5", not only "Servers". The count and the status dot are on screen in words too.
- **Focus shows on everything, and nothing draws the browser's ring**
  ([#469](https://github.com/cubicecho/cubeui/issues/469)). A focused thing looks as it does under
  the pointer.
  - `SegmentedButton`'s pills, `ColorPicker`'s swatches, a pressable `Card`, `Tabs` under Expo web
    and `CodeBlock`'s "Jump to latest" drew the browser's ring. They draw none now. A pill that is
    not the current one turns grey when focused; it showed nothing.
  - A swatch is ringed in grey under the pointer and focused, and the chosen one's ring thickens.
  - A `Card` with `onPress` turns grey under the pointer, focused and pressed. `StatTile` looks as
    it did. A `hover:` or `focus-visible:` class you put on a pressable card can go.
  - A tab on device darkens while it is pressed.
  - A `ListItem`, `CollapsibleRow` or `FileTree` row lights up only when its own middle is focused.
    A focused action button or leading checkbox shows its own look and leaves the row alone.
  - An `outline` button's edge darkens under the pointer, focused and pressed, as its fill turns
    grey. A `destructive-outline`, `positive-outline` or `info-outline` edge is a little stronger
    at rest, and turns the full colour.
  - An off switch keeps its grey track and gets an `active` edge under the pointer and focused. It
    turned pale when focused. An empty checkbox turns grey under the pointer, as it did focused.
  - A dialog with nothing to type in focuses its own panel when it opens, not its first button, and
    the panel shows nothing for it. A dialog with a field focuses the first field. A test that
    expected the first button to have focus on open should expect the dialog. `ConfirmDialog` and
    `AlertDialog` still focus Cancel.
  - A `Collapsible`'s header turns grey under the pointer, as it did focused.
  - A `RadioGroup` row's grey reaches 8px past the circle and the words, where it sat on the
    circle's edge, and it shows under the pointer too. The row lines up where it did.
  - `FilePicker`'s zone darkens its edge and turns grey under the pointer and focused. A file held
    over `FilePickerButton` tints it as it tints the zone, where it drew a ring.

- **Alerts, Markdown headings, progress bars and dots are tidier**
  ([#487](https://github.com/cubicecho/cubeui/issues/487)).
  - An `Alert`'s description is `text-foreground/60` in every variant. On `info`, `warning` and
    `destructive` it was full ink, so the title and the line under it differed only by weight.
  - An `info` alert with no `iconSlot` keeps an empty icon column, so its words line up with the
    alerts above and below it. It still draws no ⓘ. Pass an icon that says what the highlight is,
    or `iconSlot={null}` to put the words at the edge as before.
  - `Markdown` draws each heading level differently: `#####` is 12px, a step under `####`, and
    `######` is 12px in secondary ink. Headings at 14px and under are no longer `tracking-tight`.
    `markdown` now installs `@cubeui/icons`.
  - A `Progress` with no `value` draws a third of its track sweeping across it, not an empty bar.
    Under reduced motion it holds still in the middle. Every track has a `border-foreground/50`
    edge, so its whole length shows; it is still 8px tall, and the fill sits inside the edge.
    `progress` now has a web half and installs `@cubeui/reduced-motion`.
  - Dots come in two sizes. `ColorDot` is 8px at `sm` and 10px at `md` (it was 10px and 12px),
    and a soft badge's dot is 8px (it was 6px), the size of a bare badge's dot. `ColorDot` moves
    a hex into the lightness band `ColorBar` uses, so a navy tag shows in dark mode and a yellow
    one on white, and it now installs `@cubeui/color`.

- **Overlays and menus** ([#486](https://github.com/cubicecho/cubeui/issues/486)).
  - In a menu where some rows have an icon and some don't, every label starts in one column: a
    row with no icon keeps the icon's room. A menu with no icons is unchanged. Padding or a blank
    icon you added to line the labels up can go.
  - A tooltip wraps at `max-w-xs`, on both halves. On the web its lines are evened out and it
    keeps 8px from the window's edge.
  - On the web a `Popover` grows out of its trigger when it opens, as `Menu` does, not out of
    its own centre.
  - On the web `CommandDialog`'s hidden title and description are inside its card, as on device.
    They were in the page beside the dialog, and there even while it was shut. A test that found
    them in the page finds them inside the dialog.
  - `MarkdownCodeEditor`'s completion and lint popovers draw a popover's shadow.
  - On device, the backdrop of a dialog that a press beside it does not close — `ConfirmDialog`,
    `AlertDialog`, `DialogLayout` with `dismissible={false}` — is no longer a button named Close
    for a screen reader.

- **Rows, cards and facts** ([#484](https://github.com/cubicecho/cubeui/issues/484)).
  - A `PropertyRow` with an action keeps its value on the label's line, or right under the label
    when stacked. The action is level with the value's top. A 36px button used to push the value
    8px down. A row with no action is unchanged.
  - A link in an `ItemDescription` is `text-info` at rest, not only under the pointer. On a
    `selected` row it is `foreground`. It is underlined either way.
  - `CardLayout`'s `loading` skeleton is a `role="status"` named "Loading", as `RowSkeleton` is. It
    said nothing to a screen reader. A test that found the skeleton by `aria-hidden` finds it by
    its role, or by `data-slot="card-layout-skeleton"`.

## Checking the result

- Typecheck finds every removed item and prop.
- Search for `surface="card"`, `StickyHeaderContentFooter`, `breadcrumbsSlot`, `actionsSlot`,
  `stayLabel`, `text-active-foreground`, the renamed `sidebar-layout-header`, `-brand`, `-nav`,
  `-status` and `-action` slots, `collapsible-row-meta`, and the removed items' names (whole words:
  `DetailPage`, not `ServerDetailPage`).
- Run `git status` for files the reinstall wrote for the first time.
- Search for the old names in the renamed items' table, and their old `data-slot` / `testID`
  names; your editor marks each deprecated name that is left.
- Look at every screen with a chosen row, tab, checkbox or sidebar in both themes.
- Search for `size="sm"` on `Item`, and look at those rows.
- Look at your cards, sections, setting rows and list rows: titles are smaller, rows are taller and
  a card's body has gaps.
