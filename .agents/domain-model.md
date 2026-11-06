# Domain model

What cubeui is made of: its concepts, who may change them, and what always holds. This file
lives at `.agents/domain-model.md` and describes the code **as it is on this branch**.
Proposed changes are `M` items in `.agents/coding-standards-todos.md` and in the pull request
that makes them; they are written in here by the commit that makes them true. Use these terms,
and only these, in code, tests, docs and reviews.

## Purpose

cubeui is a shared set of interface pieces for the cubicecho apps, web and phone alike. A piece
lives here once instead of being copied into each app, and each app installs it as its own
editable files.

## Flow

```
React Native source → compiler → web half ┐
                                          ├→ registry → install → the app's own files
palette → token build → token sheets ─────┘
```

- **Author a piece:** written once in React Native; the compiler makes its web half. A piece the
  compiler cannot translate faithfully gets a hand-written web half beside it.
- **Publish:** every push to `main` builds the registry and publishes it, one registry for web
  apps and one for phone apps.
- **Install or update:** an app asks for a piece by name; the files are copied into the app and
  rewritten to its import paths. Nothing runs from cubeui at runtime.

Dependencies point from specific to general: a shell knows the primitives it draws with; a
primitive knows no shell; a bound field knows its control and the form; nothing knows an app.

## Actors

| Actor | Is | Reaches the system through | May change |
|---|---|---|---|
| Author | a person or agent working in this repo | `registry/`, `tokens/palette.mjs`, `registry.json`, `registry.web-only.json`, `skill/` | sources, palette, item declarations, docs |
| Compiler | `scripts/rn2web` (`npm run compile`) | reads `registry/` | `compiled/` and `registry.web.json` only; refuses what it cannot translate |
| Token build | `scripts/build-tokens.mjs` (`npm run tokens:build`) | reads `tokens/palette.mjs` | `dist/tokens.web.css`, `dist/tokens.native.css`, `dist/cubeui-theme.ts` |
| Registry check | `scripts/check-registry-build.mjs` (`npm run registry:check`) and CI (`npm run check`) | reads everything | nothing; fails the build |
| shadcn CLI | the consumer's `npx shadcn add @cubeui/<item>` | the published registry JSON | files in the consumer's tree |
| Consumer app | a web (Vite) or Expo app with `@cubeui` in `components.json` | installed files | its own copies; cubeui never sees them |
| Reader | the person using a consumer app | the rendered interface | what the pieces let them change: open, close, fold, choose |

## Lifecycles

### An item

```
authored --compile--> compiled --registry:check, push to main--> published --shadcn add--> installed --edited in the app--> drifted
```

A drifted copy is still the app's; an update overwrites it. `compile:check` and `tokens:check`
fail CI when a generated file is stale, so `compiled/` and `dist/` match their sources at every
commit.

### A dialog (`DialogLayout`)

```
closed --trigger, or open set by the caller--> open --close asked, nothing unsaved--> closed
                                               open --close asked, unsaved--> asking --discard--> closed
                                                                              asking --keep--> open
```

Every close path (Escape, the backdrop, the corner X, a Cancel handed `close`) goes through one
`requestOpenChange`. `dismissible={false}` removes Escape and the backdrop.

### A leave-the-page question (`useUnsavedChangesGuard`)

```
editing --leave asked, unsaved--> asking --discard--> left
                                  asking --stay--> editing
```

On the web a browser unload also asks (`beforeunload`).

### A disclosure (`Disclosure`, `DisclosureRow`, a `FileTree` folder)

```
shut --pressed--> open --pressed--> shut
```

`Disclosure` keeps the state itself or takes it from the caller; `DisclosureRow` and `FileTree`
folders can also be controlled. A shut body is not mounted.

### A list's state (`QueryState`)

```
failed | loading | empty | has rows
```

Exactly one at a time, in that order of precedence; once there are rows, `QueryState` draws
nothing and the list draws them.

### A sidebar's fold (`Sidebar`)

```
expanded --collapse button--> rail of icons --collapse button--> expanded
```

The sidebar holds no state: the caller stores `collapsed` and passes it back.

## Invariants

| Invariant | Enforced by |
|---|---|
| Every layout ships on both platforms; the web-only tier only shrinks | `registry:check` rules 11 and 16 |
| A hand-written web half has a native file beside it with the same exports | `registry:check` rules 1 and 2 |
| `compiled/` matches what the compiler makes from `registry/` | `compile:check` |
| The token sheets match `tokens/palette.mjs` | `tokens:check` |
| A colour class names a palette token, never Tailwind's palette, black, white or a shadcn alias | `registry:check` rule 9 |
| Every border and text colour is named, on every platform | `registry:check` rule 14 |
| Every token has a dark value on native | `scripts/tokens-dark.test.mjs` |
| Text pairs reach 4.5:1 and control edges 3:1 in every palette | `scripts/palette-contrast.test.mjs` |
| An item imports only `cn`, react, react-native, lucide and other cubeui items, and declares exactly what it imports | `registry:check` rule 7 |
| No relative imports ship | `registry:check` rule 13 |
| A shell takes no `children`; its body is `contentSlot` | convention (`AGENTS.md`), not checked |
| A shell holds no app state, data, routing or toasts; it is handed nodes and places them | convention (`skill/layout/index.md`), not checked |
| A prop that takes elements ends in `Slot` | convention (`AGENTS.md`), not checked |
| Muted is one of six opacity steps (`/10`, `/40`, `/50`, `/60`, `/90`, none) | convention (`AGENTS.md`), not checked |

## Glossary

### The registry

- **Item:** one installable piece, named in the registry, with its files and the other items it
  needs. Owner: `registry.json` (native and both), `registry.web-only.json`; `registry.web.json`
  is generated.
- **Primitive:** a basic control or surface, shadcn-compatible in its API: a button, an input, a
  card, a dialog. Takes `children` where shadcn's does. Owner: `registry/ui/`.
- **Shell (layout):** an item that places nodes it is handed into a fixed shape (a page, a card,
  a dialog, a split) and holds no app state. Takes `*Slot` props, never `children`. Owner:
  `registry/layout/`. That folder also holds items that are not shells: the components
  `Combobox`, `ConfirmButton` and `useUnsavedChangesGuard`, and the bound field
  `RadioGroupField`.
- **Component:** an item built from primitives for one job, such as a picker or a button that
  asks first; neither a primitive nor a shell. Owner: `Combobox`, `ConfirmButton`,
  `useUnsavedChangesGuard` in `registry/layout/`; `DatePicker`, `PasswordInput` in
  `registry/ui/`.
- **Slot:** a prop that takes elements (`contentSlot`, `actionSlot`). A slot lays its children
  out as a column on both platforms. Owner: `SlotNode` in `registry/lib/utils.ts`.
- **Bound field:** a control already wired to a TanStack form field, with its label, description
  and error. Where a bound field ends and a small form layout begins is not sharp:
  `RadioGroupField` also lays out a title and an explanation per option. Owner: `registry/ui/form.tsx` (`useAppForm`), `registry/ui/*-field.tsx`,
  `registry/layout/radio-group-field.tsx`, and on the web `registry/web/app-form.tsx`.
- **Web half:** the DOM version of an item. Compiled from the native source, or hand-written as
  `<name>.web.tsx` with the shared part in `<name>-base.ts` (26 items). Owner: `compiled/`,
  `registry/ui/*.web.tsx`.
- **Web-only tier:** items with no native half: the web form layer, Markdown, the data table, and
  four bundles. Owner: `registry/web/`, `registry.web-only.json`.
- **Bundle:** an item with no files that installs a set of items: `control`, `form-set`, `layout`,
  `primitive`. Owner: `registry.web-only.json`.

### Colour

- **Token:** a named colour every piece draws with: `background`, `foreground`, `secondary`,
  `neutral`, the four statuses, `hover`, `active`, `overlay`, each fill with a `-foreground`.
  Owner: `tokens/palette.mjs`; emitted to `dist/` by the token build.
- **Palette:** one full set of tokens for a mode: the default light and dark, and Monokai (dark
  only). Owner: `tokens/palette.mjs`; chosen in an app by `usePalettePreference`.
- **Alias:** a shadcn token name (`muted-foreground`, `card`, `border`) written as a copy of a
  cubeui token, so a copied shadcn component keeps working. A cubeui item may not name one.
  Owner: `ALIASES` in `tokens/palette.mjs`.

### Pages

- **`PageLayout`:** a whole page: its title block pinned above a scrolling body,
  with an optional footer, at a named column width. Owner: `registry/layout/page-layout.tsx`;
  composes `HeaderContentFooter` and `PageHeader`.
- **`Page`:** a padded column that scrolls with no title block of its own; a `PageHeader`
  placed in its body scrolls away with it. Owner: `registry/layout/page.tsx`, which also holds
  `CardGrid` and re-exports `PageHeader` and `EmptyState`.
- **`DetailPage`:** a `Page` for one record that shows loading, then not found,
  before handing the loaded record to its body. Owner: `registry/layout/detail-page.tsx`.
- **`HeaderContentFooter`:** the frame most shells build on: a header
  and footer around a body, where either the whole frame or only the body scrolls. Owner:
  `registry/layout/header-content-footer.tsx`; also the column widths `PAGE_COLUMN`,
  `PROSE_COLUMN`.
- **`StickyHeaderContentFooter`:** the same frame with the body
  scrolling and the header and footer fixed. Owner: the same file; it is the frame with `scroll`
  and `h-full` set.
- **`PageHeader`:** a page's icon, title, description, actions, breadcrumb or back
  link, and a row for search, filters or tabs, at heading level 1 to 3. Owner:
  `registry/layout/page-header.tsx`.
- **`DetailHeader`:** a back button, a colour dot, a title, badges and
  actions. Owner: `registry/layout/detail-header.tsx`.
- **`SectionHeading`:** a small muted label over a block, a heading only when
  given a level. It is the title `Section` and `SidebarSection` draw. Owner:
  `registry/layout/section-heading.tsx`; takes `children`.
- **`CenteredLayout`:** a page that is one card in the middle of the screen, such
  as a sign-in. Owner: `registry/layout/centered-layout.tsx`; composes `CardLayout`.

### App frames

- **`SplitLayout`:** two panes side by side that stack below a width. Owner:
  `registry/layout/split-layout.tsx`.
- **`SidebarLayout`:** a split whose panes are the page and a sidebar; below a
  width the sidebar is replaced by an app bar at the top, with its places optionally at the
  bottom. Owner: the same file; composes `SplitLayout`.
- **`Sidebar`:** the app's navigation column, with sections of rows, that can fold to a
  rail of icons. Owner: `registry/layout/sidebar.tsx`, with `SidebarSection`, `SidebarNavItem`,
  `SidebarCollapseButton`, `useSidebar`.
- **`BarNavItem`:** a place in an app bar, drawn as its icon. Owner:
  `registry/layout/sidebar.tsx`.
- **`TopBarLayout`:** an app frame with a bar across the top (brand, places,
  actions) and no sidebar. Owner: `registry/layout/top-bar-layout.tsx`; composes
  `HeaderContentFooter`.

### Blocks on a page

- **`Card`:** a bordered, filled panel; pressable when given a press. Owner:
  `registry/ui/card.tsx`, with `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`,
  `CARD_SURFACE_CLASS`.
- **`CardLayout`:** a card with its icon, title, description, header action, body,
  empty and loading states, and footer already placed. Owner: `registry/layout/card-layout.tsx`.
- **`Section`:** an overline heading over a group of fields or rows. It draws no surface; a
  titled card is `CardLayout`. Owner: `registry/layout/section.tsx`.
- **`Disclosure`:** a titled block whose body shows and hides. Owner:
  `registry/layout/disclosure.tsx`.
- **`Dialog`:** a window over a dimmed page that holds focus until it closes. Owner:
  `registry/ui/dialog.tsx` and `dialog.web.tsx`.
- **`DialogLayout`:** a dialog with its title, description, scrolling body and
  footer placed, a size, and a discard question before unsaved work is thrown away. Owner:
  `registry/layout/dialog-layout.tsx`; composes `Dialog`, `HeaderContentFooter`, `ConfirmDialog`,
  and draws `CardLayout`'s footer rows.
- **`ConfirmDialog`:** an "are you sure?" window with Cancel and one destructive
  button. Owner: `registry/ui/confirm-dialog.tsx`; `useConfirm` in `registry/ui/confirm.tsx`.
- **`ConfirmButton`:** a destructive button that asks first. Owner:
  `registry/layout/confirm-button.tsx`.

### Lists and facts

- **`List`:** the container a page's rows sit in, with the rules between them and nesting.
  Owner: `registry/layout/list.tsx`, with `ListRow` and `hasRows`.
- **`ListItem`:** one row: leading picture or checkbox, title, description, extra info,
  actions; pressable or a link. Owner: `registry/layout/list-item.tsx`.
- **`Item`:** shadcn's row parts, for a row `ListItem` does not fit. Owner:
  `registry/ui/item.tsx`.
- **`DisclosureRow`:** a row on an outlined surface that opens onto more below
  it. Owner: `registry/layout/disclosure-row.tsx`; composes `Item`.
- **`FileTree`:** a foldable tree of folders and files built from a list of paths,
  with dragging a row onto a folder on the web. Owner: `registry/layout/file-tree.tsx`.
- **`DescriptionList`, `PropertyRow`:** read-only label-and-value facts. Owner:
  `registry/layout/description-list.tsx`.
- **`SettingRow`:** what a setting is on one side, its control on the other.
  Owner: `registry/layout/setting-row.tsx`.
- **`StatTile`:** one headline number with its label on a card, optionally a filter to
  press. Owner: `registry/layout/stat-tile.tsx`.

### States

- **`EmptyState`:** what a list says when it has nothing in it: an icon, a title,
  a line, an action, or one compact line. Owner: `registry/layout/empty-state.tsx`; composes
  `Empty` (`registry/ui/empty.tsx`).
- **`QueryState`:** the failed, loading or empty state in front of a list until it
  has rows. Owner: `registry/layout/query-state.tsx`, with `QueryError` and `RowSkeleton`.
- **`RouteError`:** the whole-screen panel shown when a page fails to draw, with
  Try again. Owner: `registry/layout/route-error.tsx`.

### Internals

- **Compiler pass:** one stage of `scripts/rn2web/compile.mjs` (elements, classes, imports, …).
  Owner: `scripts/rn2web/passes/`.
- **Prototype weights:** the proposed named-weight tokens, chart colours and `fg-` utility,
  built beside today's tokens and used by no item. Owner: `tokens/weights.mjs`,
  `tokens/series.mjs`, `scripts/build-token-weights.mjs`, `dist/prototype/`.
- **`PageInsetContext`:** tells a `PageHeader` inside a `Page` to drop its own
  padding. Owner: `registry/layout/page-header.tsx`.
- **`SidebarPositionContext`:** tells a `Sidebar` which edge its border
  is on. Owner: `registry/layout/split-layout.tsx`.

## Explain test

An author writes an item once in React Native; the compiler makes its web half, and the token
build turns the palette into the token sheets every item draws with. Each push to `main`
publishes the registry, and an app installs an item by name as its own files. Primitives are
the controls and surfaces, and components build one job from them. Shells place the nodes an app
hands them into a fixed shape: a `PageLayout` or a `Page` inside a `SidebarLayout` or a
`TopBarLayout`, and on it `CardLayout`s, `Section`s, `DialogLayout`s, `List`s of rows and facts,
each with its empty, loading and failed states. Bound fields wire a control to a form field. A shell keeps only the state of its own
interaction (a dialog's discard question, a disclosure's open body), never the app's data.
