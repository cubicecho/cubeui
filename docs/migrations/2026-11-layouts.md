# Updating to the November 2026 layouts

What an app changes when it reinstalls its cubeui items after the layout refactor. Work through
the sections for the items your app has installed (`ls components components/ui`); a section for
an item you don't have does not apply.

**How to update.** cubeui has no version numbers: the registry published from `main` is the
newest version. Reinstall every cubeui item the app has with
`npx shadcn add @cubeui/<item> --overwrite`, then go through this list, then run the app's
typecheck, lint and tests. Files you have edited by hand are overwritten; re-apply your edits or
move them out of the cubeui file first.

## Removed items

| Item | Replace with |
|---|---|
| `page` (`Page`, `CardGrid`) | `PageLayout` (`@cubeui/page-layout`); for a body with no title block, `HeaderContentFooter`. `CardGrid` becomes `GridLayout` (`@cubeui/grid-layout`). `PageHeader` and `EmptyState` are imported from their own items. Delete `components/page.tsx`. |
| `detail-page` (`DetailPage`) | `<QueryState query={q} what="…" record={q.data} notFoundLabel="…" />`, then the page once `q.data` is there. Inside a page that already has its level-1 title, pass `level={2}`. Delete `components/detail-page.tsx`. |
| `detail-header` (`DetailHeader`) | `<PageHeader backSlot={<Button aria-label="Back" onPress={f} … />} iconSlot={<ColorDot color={c} />} title={t} description={d} actionSlot={<>{badges}{actions}</>} />`, or the same props on `PageLayout`. Delete `components/detail-header.tsx`. |
| `top-bar-layout` (`TopBarLayout`) | `<HeaderContentFooter className="h-full" headerSlot={<AppBar brandSlot={…} navSlot={…} navLabel="Main" actionSlot={…} />} contentSlot={<main>…</main>} />`, installing `@cubeui/app-bar`. Delete `components/top-bar-layout.tsx`. |
| `StickyHeaderContentFooter` (from `header-content-footer`) | `<HeaderContentFooter scroll className="h-full …" />`, or `PageLayout` when the header is a `PageHeader`. |
| `PageInsetContext` (from `page-header`) | A `PageHeader` inside a padded column of your own takes `className="px-0 pt-0"`. |

## Changed props

| Item | Change |
|---|---|
| `Section` | `surface` is gone. Replace `<Section surface="card" …>` with `<CardLayout level={2} …>`, keeping `title`, `description`, `actionSlot` and `contentSlot`. A `divider`, or a `level` above 3, has no `CardLayout` counterpart. |
| `PageHeader`, `PageLayout` | `breadcrumbsSlot` is now `backSlot` (the old name still works, deprecated). A back button put in `iconSlot` moves to `backSlot`; `iconSlot` is the page's own icon. New: `size` (`"lg" \| "md" \| "sm"`) sets the title size apart from `level`; `headerBarSlot` adds full-width bars under the title. |
| `PageLayout` | `headerClassName` now lands on the whole header, which runs the full width, not on the `PageHeader` inside it. The rule under the title runs the pane's width. |
| `RouteError` | `actionsSlot` is now `actionSlot` (the old name still works, deprecated). |
| `UnsavedChangesDialog`, `useUnsavedChangesGuard` | `stayLabel` is now `keepLabel`, and the guard's `stay()` is now `keep()` (old names still work, deprecated). |
| `QueryState` | New: `record` with `notFoundLabel` for a single record, and `level` for the not-found title. |
| `DialogLayout` | New: `iconSlot`, a header `actionSlot`, `loading` and `emptySlot`, as `CardLayout` has. |

## Moved installs

| Item | Change |
|---|---|
| `radio-group-field` | Installs to `components/ui/radio-group-field.tsx`. Change `@/components/radio-group-field` to `@/components/ui/radio-group-field`, and delete the old `components/radio-group-field.tsx`. |
| `section` | Now installs `card-layout` too. |
| `split-layout` | Now installs `app-bar` too. |

## Looks that changed

- **Chosen things are tinted, not filled.** A chosen row, the current sidebar place, the active
  tab, the chosen segment, a checked checkbox, an on switch, a chosen radio, a toggle chip, the
  picked calendar day, a selected stat tile, a checked menu row and a chosen select or combobox
  option are all `bg-active/40` with normal text, and `bg-active/60` under the pointer and when
  focused. A checkbox, switch, radio or toggle chip also has an `active` edge. Anything of your own
  drawn on a chosen thing in `text-active-foreground` should now be `text-foreground`.
- **`DisclosureRow` has no frame.** It has `ListItem`'s padding and no outline. Inside a `List`
  it now matches the rows beside it; a row standing on its own that wants the old frame passes
  `className="border border-foreground/10"`.
- **`Section`'s heading looks like a card's:** the action sits level with the top of the title,
  16px from the text.
- **`CardLayout`'s `headerClassName`** lands on the header around the title row: padding, border
  and fill classes work as before, but a flex class there no longer reaches the row.
- **`SidebarLayout`'s phone bar is `AppBar`.** Its parts are `data-slot` `app-bar`,
  `app-bar-brand`, `app-bar-nav`, `app-bar-status` and `app-bar-action` (they were
  `sidebar-layout-*`). Only a selector on those names needs changing.

## Checking the result

- Typecheck finds every removed item and prop.
- Search for `surface="card"`, `StickyHeaderContentFooter`, `breadcrumbsSlot`, `actionsSlot`,
  `stayLabel`, `text-active-foreground`, `sidebar-layout-` and the removed items' names.
- Look at every screen with a chosen row, tab, checkbox or sidebar in both themes.
