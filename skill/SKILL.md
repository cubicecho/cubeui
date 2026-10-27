---
name: cubeui
description: How to use the cubeui components (PageLayout, HeaderContentFooter, StickyHeaderContentFooter, CardLayout, DialogLayout, PageHeader, SplitLayout, SidebarLayout, Sidebar, SidebarSection, SidebarNavItem, BarNavItem, Section, DescriptionList, PropertyRow, FormField, FieldRow, useAppForm and its bound fields, ColorPicker, Disclosure, StatTile, SettingRow, CenteredLayout, TopBarLayout, Markdown, MarkdownEditor on the web; Menu, Combobox, SegmentedGroup, SegmentedButton, ThemePicker, useThemePreference, usePalettePreference, PaletteProvider, ConfirmButton, CopyButton, DownloadButton, CodeBlock, DatePicker, DateRangePicker, DateTimeInput, SearchInput, PasswordInput, ColorDot, readableTextColor, Command and the icon set on both; Page, DetailPage, Form, ConfirmDialog, QueryState and the React Native primitives in an Expo app) in a project that installs them from the cubeui shadcn registry. Read before building a page shell, a page title block, a card, a sign-in page, a dialog, a two-pane screen, an app's navigation sidebar or top bar, a section heading, a part of a page that shows and hides, a settings row with a switch, select or button at its end, a list of read-only label and value rows, a dashboard's row of figures or the filter tiles over a list, a form, an icon-only button, a popover menu of actions or of on/off rows, or a destructive action with shadcn primitives — it says which component owns the shape and which props carry which node, so hand-written scaffolding is not re-derived per screen.
---

# cubeui

cubeui components are **shells**: they own a shape and take the parts as props. They do not
fetch, they do not hold form state, and they render no text of their own. A shell is one
self-closing element at the call site, and every slot is a named prop ending in `Slot` that takes
an element or a fragment of them.

**No cubeui component takes children.** The body is the `contentSlot` prop, exactly like the header
and the footer are props, because in a layout every part is dynamic and none of them is the
privileged one. `<CardLayout>{rows}</CardLayout>` is wrong; `<CardLayout contentSlot={rows} />` is
right. This is the mistake to check for first when reading or writing a call site.

**Contents:** [Which half you are in](#which-half-you-are-in) ·
[Choosing — on the web](#choosing--on-the-web) · [The slot vocabulary](#the-slot-vocabulary) ·
[No inline edits](#no-inline-edits). The rest of the skill is one file per component group,
linked from the choosing table: [layout/](layout/index.md), [forms/](forms/index.md),
[controls/](controls/index.md), and [native.md](native.md) for an Expo app.

## Which half you are in

One registry, two URLs. `@cubeui` points at the half that matches the platform the project is,
and the project is one or the other — a DOM app or an Expo app, never both:

```jsonc
// components.json, once per project. A DOM app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }

// An Expo app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/native/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/card-layout   # one item
npx shadcn@latest add @cubeui/layout        # or a set: layout, form-set, control, primitive
```

Install from the registry, do not copy by hand.

**On the web, import the stylesheet once.** Any item whose markup needs `@cubeui/tokens` pulls
it in, landing `cubeui-tokens.css` next to `components.json`, but nothing loads a stylesheet the
app does not import. Put `@import "../cubeui-tokens.css";` in the app's CSS entry, after
`@import "tailwindcss";` and before the app's own palette. Without it a compiled component lays
out as stacked blocks and nothing errors.

**Do not style scrollbars.** The tokens stylesheet does it on the web, on both halves: thin, the
foreground at 30%, no track, following the theme and the palette. An app's own `::-webkit-scrollbar`
or `scrollbar-color` block is a copy that drifts, so delete it when moving onto cubeui. A region
that should show none takes `[scrollbar-width:none]`.

**Most items are on both.** `button`, `card`, `input`, `select`, `dialog`, `popover`, `menu`, `command`, `tabs`,
`tooltip`, `badge`, `calendar`, `field`, `item`, `separator`, `skeleton`, `toast`, `empty`, `query-state` — same item name, same props,
one written in React Native and one compiled or hand-written for the DOM. That is the point of
the layout: a call site moves between the two halves unchanged.

**So are the layout shells.** `HeaderContentFooter`, `StickyHeaderContentFooter`, `PageHeader`,
`PageLayout`, `SplitLayout`, `SidebarLayout`, `Sidebar`, `TopBarLayout`, `CardLayout`,
`CenteredLayout`, `DialogLayout`, `Section`, `Disclosure`, `DisclosureRow`, `DescriptionList`, `List`, `ListItem`, `FileTree`, `StatTile`
and `SettingRow` are written once in
React Native and compiled to the web, so `@cubeui/page-layout` installs in an Expo project and a
Vite one alike, with the same props.

**Some web shells are still web-only.** `FormField`, the `@cubeui/app-form` fields and
the rest of the web-only controls lean on CSS grid tracks and arbitrary
variants, which Yoga and NativeWind do not have. In an Expo project those items are a 404, and
that is the registry telling you the truth rather than shipping a shell that lays out wrong. Use
the native set for those shapes instead — see [Shapes on React Native](native.md#shapes-on-react-native)
in `native.md`.

## Choosing — on the web

In an Expo app the table is [native.md](native.md).

| The shape you are building | Use | Reference |
| --- | --- | --- |
| A whole page — a title, buttons, and rows under them | `PageLayout` | [layout/pages.md](layout/pages.md#pages) |
| A page: chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` | [layout/pages.md](layout/pages.md#page-shells) |
| The same three zones, whole thing scrolls with the page | `HeaderContentFooter` | [layout/pages.md](layout/pages.md#page-shells) |
| The title block at the top of a page: name, buttons, search | `PageHeader` | [layout/pages.md](layout/pages.md#page-headers) |
| A navigation column or inspector beside a working surface | `SidebarLayout` | [layout/splits.md](layout/splits.md#splits) |
| An app shell: the sidebar on a wide screen, a bar with the brand, icon links and buttons on a narrow one | `SidebarLayout sidebarHideBelow` with `brandSlot`, `navSlot`, `status`, `actionSlot` | [layout/sidebar.md](layout/sidebar.md#on-a-phone-a-bar-instead-of-the-rail) |
| A place in that bar: an icon link with a name, a tooltip, the current-page fill, a count or a status dot | `BarNavItem` | [layout/sidebar.md](layout/sidebar.md#on-a-phone-a-bar-instead-of-the-rail) |
| The app's sidebar itself — brand, titled lists of links, settings and sign out at the bottom | `Sidebar`, `SidebarSection`, `SidebarNavItem` | [layout/sidebar.md](layout/sidebar.md#sidebar) |
| A sidebar the reader folds down to a rail of icons and opens again | `Sidebar collapsed onCollapsedChange`, `SidebarCollapseButton`, `useSidebar` | [layout/sidebar.md](layout/sidebar.md#folded-to-a-rail-of-icons) |
| An app shell with no sidebar — a bar across the top with the brand, a few links and the account, the page below | `TopBarLayout` | [layout/top-bar.md](layout/top-bar.md#top-bar) |
| Two comparable panes side by side — a diff, a form beside its preview | `SplitLayout` | [layout/splits.md](layout/splits.md#splits) |
| A list beside the detail for the selected row | `SidebarLayout`, or two routes | [layout/splits.md](layout/splits.md#list-and-detail) |
| A panel with a title, a body, and buttons at the bottom | `CardLayout` | [layout/cards.md](layout/cards.md#cards) |
| A page that is one card — a sign-in, a token gate — so its title is the page's `<h1>` | `CardLayout level={1}` | [layout/cards.md](layout/cards.md#cards) |
| A page that is one card in the middle of the screen — a sign-in, a token gate, "check your email" | `CenteredLayout` | [layout/pages.md](layout/pages.md#centered-pages) |
| A modal with a title, a body that scrolls, buttons at the bottom | `DialogLayout` | [layout/dialogs.md](layout/dialogs.md#dialogs) |
| A heading over a group of fields or rows | `Section` | [layout/cards.md](layout/cards.md#sections) |
| A settings row — a title and a line on what it does, then a switch, select or button at the far end | `SettingRow` (a lone boolean with its caption: `SwitchField`) | [layout/facts.md](layout/facts.md#setting-rows) |
| Read-only facts — a label, a value, a hint under it, a copy button (a settings or "about" page) | `DescriptionList`, `PropertyRow` | [layout/facts.md](layout/facts.md#description-lists) |
| One figure on a card — a dashboard's row of counts, or the filter tiles over a list that toggle what it shows | `StatTile` | [layout/facts.md](layout/facts.md#stat-tiles) |
| A list page's failed / loading / empty rungs | `QueryState` | [layout/lists.md](layout/lists.md#querystate) |
| The list rows sit in: the `<ul>`, the rule between rows and the padding around each — instead of a `<ul>`, `divide-y` or `role="list"` of your own | `List` | [layout/lists.md](layout/lists.md#list) |
| A list row: an avatar or checkbox, a title over a line, a date and buttons at the far end, optionally pressed to open | `ListItem` | [layout/lists.md](layout/lists.md#listitem) |
| Files and folders, nested as they are on disk: folders that fold, a selected file, a size after a name, rename and delete beside a row, a row dragged onto a folder | `FileTree` | [layout/trees-and-tables.md](layout/trees-and-tables.md#filetree) |
| What an empty list says: the centred block for a page, or `compact` — one muted line — inside a card, sidebar or popover | `EmptyState` | [layout/lists.md](layout/lists.md#empty-states) |
| A list row that opens onto detail | `DisclosureRow` | [layout/lists.md](layout/lists.md#disclosurerow) |
| A part of a page that shows and hides — "Show completed (3)", a raw payload — instead of `<details>` or a chevron `<button>` | `Disclosure` | [layout/cards.md](layout/cards.md#disclosure) |
| Rows with columns — the same facts on every row, read down as well as across (web only; on native, `ListItem` rows or a `DescriptionList`) | `Table` and its parts | [layout/trees-and-tables.md](layout/trees-and-tables.md#table) |
| A form of any size | `useAppForm` and the bound fields | [forms/app-form.md](forms/app-form.md#a-form) |
| A label, a control, a hint under it, and an error | `FormField` | [forms/form-field.md](forms/form-field.md#formfield-on-its-own) |
| Two or three fields that belong on one line | `FieldRow` | [forms/app-form.md](forms/app-form.md#fields-on-one-row) |
| A button, with a label, an icon, a link or a `loading` state | `Button` | [controls/buttons.md](controls/buttons.md#button) |
| An icon-only button | `Button` in an `icon*` size, with `aria-label` | [controls/buttons.md](controls/buttons.md#icon-buttons) |
| A button that copies a value — an endpoint, a token, a snippet — and ticks when it has | `CopyButton` | [controls/buttons.md](controls/buttons.md#copy-button) |
| A button that saves a file — an export, a note, a report — and waits while it is fetched, or a URL the browser downloads itself (`href`) | `DownloadButton` | [controls/buttons.md](controls/buttons.md#download-button) |
| A block of preformatted text — a config file, a command, a payload, a log — or one value in a box with a copy button, instead of a `<pre>` | `CodeBlock` | [controls/code-and-markdown.md](controls/code-and-markdown.md#code-block) |
| A Markdown string drawn as a document — a note, a README, a skill, a model's answer — instead of `react-markdown` and an element map of your own (web only) | `Markdown` | [controls/code-and-markdown.md](controls/code-and-markdown.md#markdown) |
| Links between an app's Markdown documents — `[[wikilinks]]`, relative links, the router's link, a link or image that is pending or broken (web only) | `Markdown` with `wikilinks`, `resolveLink`, `basePath` | [controls/code-and-markdown.md](controls/code-and-markdown.md#markdown) |
| A Markdown source to write, with its rendering beside it and an Edit / Split / Preview toggle (web only) | `MarkdownEditor` | [controls/code-and-markdown.md](controls/code-and-markdown.md#markdown-editor) |
| A Markdown file to edit as the screen's main job — syntax highlighting, undo history, a save key, your own CodeMirror extensions (web only, loaded with `lazy()`) | `MarkdownCodeEditor` | [controls/code-and-markdown.md](controls/code-and-markdown.md#markdown-code-editor) |
| A button that deletes, discards, revokes or resets — with `requireText`, only once its name is typed | `ConfirmButton` | [controls/buttons.md](controls/buttons.md#type-the-name-to-confirm) |
| A popover of actions or links — a ⋯ menu, Rename / Move / Delete on a row, Open in a router `linkSlot` | `Menu`, `MenuItem` | [controls/menus.md](controls/menus.md#menu) |
| A popover of on/off rows that stays open — labels on a todo, columns shown — or a one-of-N filter behind a button | `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem` | [controls/menus.md](controls/menus.md#menu) |
| A select, a tag picker, a date picker, a colour picker, a password box | the controls | [controls/index.md](controls/index.md) |
| A search box over rows that filter as you type — a command palette, a picker's list that is not a tag picker | `Command` and its parts | [controls/menus.md](controls/menus.md#command) |
| A search dialog — a ⌘K palette, "find a todo", "jump to a project" — rather than `Command` in a `Dialog` of your own | `CommandDialog` | [controls/menus.md](controls/menus.md#command) |
| A row of pills that switches a view or a period, one current | `SegmentedGroup`, `SegmentedButton` | [controls/combobox.md](controls/combobox.md#segmented-control) |
| A light / dark / system setting, or a palette such as Monokai, stored and applied | `ThemePicker`, `useThemePreference`, `usePalettePreference`, `PaletteProvider` | [controls/theme.md](controls/theme.md#theme) |
| A date and a time as one `Date` on both halves — or, with `clearable mode="date"`, an optional date only | `DateTimeInput` | [controls/dates.md](controls/dates.md#date-and-date-range) |
| A date, a date with its time in the popover, or a start and an end, behind one full-width trigger, on both halves | `DatePicker`, `DateRangePicker` | [controls/dates.md](controls/dates.md#date-and-date-range) |
| How much of something is done: an upload, a re-embed, a context window filling | `Progress` | [controls/display.md](controls/display.md#progress) |
| A colour-coded thing: a swatch, a card's accent stripe, legible text on a chip | `ColorDot`, `Card accentColor`, `readableTextColor` | [controls/display.md](controls/display.md#colour) |
| A text field with an icon inside it at the start, or an icon button at the end | `Input leadingSlot`, `Input trailingSlot` | [controls/inputs.md](controls/inputs.md#an-icon-in-an-input) |
| A fixed part of a field's value: a URL prefix, a domain, a unit | `Input prefixText`, `Input suffixText` | [controls/inputs.md](controls/inputs.md#fixed-text-in-an-input) |
| A search or filter box — named, with a ✕ that clears it — alone or in a filter bar | `SearchInput` | [controls/inputs.md](controls/inputs.md#search) |
| A tag or filter chip with an ✕ that takes it off | `Badge onRemove` | [controls/display.md](controls/display.md#removable-badge) |
| An upload of one file or several, dropped or picked — as text, as bytes (`read="bytes"`, for a `.zip` or an image), unread as a `Blob` with its `size` (`read="none"`, for a large upload), or a whole folder (`directory`) | `FilePicker` | [controls/inputs.md](controls/inputs.md#file-picker) |
| An Upload button in a page header or toolbar that opens the file dialog directly | `FilePickerButton` | [controls/inputs.md](controls/inputs.md#as-a-button) |
| A callout on a screen — a key shown once, a fallback in use, the last error — tinted, with an icon | `Alert` | [controls/display.md](controls/display.md#alert) |
| A loading indicator — in a button, beside a heading, in place of a value | `Spinner` | [controls/display.md](controls/display.md#spinner) |
| A pulsing block standing in for content that has not arrived, inside a part no shell's `loading` covers | `Skeleton` | [controls/display.md](controls/display.md#skeleton) |
| A one-pixel rule between groups, across or down | `Separator` | [controls/display.md](controls/display.md#separator) |
| An icon anywhere | `@cubeui/icons`, not lucide directly | [controls/icons.md](controls/icons.md#icons) |

If none of them fits, use the shadcn primitives directly — do **not** bend a shell with
`className` until it is a different component. A shape that shows up three times is a case for a
new registry item, not for a fourth variant prop.

## The slot vocabulary

The same words mean the same thing in every component, and this is the point of the set.

A prop whose name ends in `Slot` takes elements only. Its type is `SlotNode`: an element, an array
of them, `null`, `undefined` or `false` — not a string and not a number, so words handed to a slot
come inside an element of yours (`<Text>` on a device, a `<p>` or `<span>` on the web). A prop that
takes words has no `Slot` in its name (`title`, `description`, `label`), and the component puts the
`<Text>` around them. Three slots also take a function that returns the elements:
`DialogLayout`'s `footerActionsSlot` (`(close) => …`), `SettingRow`'s `actionSlot` (`(ids) => …`)
and the web `FormField`'s `controlSlot`.

**Everywhere:**

- **`contentSlot`** — the body. The one slot that grows and the one that scrolls.
- **`title`**, **`description`** — what the thing is called and one line on what it is for.
- **`iconSlot`** — sits before the title. Pass a bare `<Plus />`; the shell sizes and colors it.
- **`actionSlot`** — the far end of the *header*. One control, or a fragment of them.
- **`footerSlot`** — the start of the footer. A note, a timestamp, a destructive action held away
  from the others.
- **`footerActionsSlot`** — the end of the footer. The buttons, in reading order, primary last.
- **`emptySlot`** — what the body says when `contentSlot` comes back empty. Not a slot you place.
- **`loading`** — a boolean. On, the shell substitutes a skeleton for the part of itself that
  the request was going to fill, and `emptySlot` is not consulted.
- **`className`** — the root. Each slot has its own `<slot>ClassName` when it needs one. In a DOM
  app a bare `border` or `border-t` here draws in the app's border colour, as it does on a
  `<div>`; in an Expo app nothing sets that default, so name the colour too (`border border-foreground/10`).

**Page, split and dialog shells add:**

- **`breadcrumbsSlot`** — the line above the title. A trail, or a back link, which is a one-step
  trail. Nodes, never a route.
- **`headerContentSlot`** — the row under the title: search, filters, tabs. Stacked in the order
  you pass them.
- **`sidebarSlot`** — the second surface in a `SidebarLayout`. `contentSlot` is still the main one, so the
  pair reads the way it does everywhere else.
- **`sidebarPosition`**, **`sidebarWidth`**, **`sidebarHideBelow`**, **`sidebarClassName`** — the
  sidebar's, by prefix. A prop that belongs to a slot wears the slot's name, so it needs no word of
  its own. `sidebarHideBelow="md"` hides the sidebar under `md` and draws the bar in its place;
  `barPosition="bottom"` puts that bar's `navSlot` along the bottom of the page.
- **`brandSlot`** — the start of an app's bar: the logo and the app's name, usually a link home. On
  `TopBarLayout`, and on `SidebarLayout`'s bar, which is drawn only where the sidebar is hidden —
  so there pass what the sidebar's header shows.
- **`navSlot`** — an app bar's navigation, after the brand: the primary links on `TopBarLayout`, the
  places as icon links — `BarNavItem`s — on `SidebarLayout`'s bar. The shell draws the `<nav>` and
  `navLabel` names it, by prefix — do not wrap it in one yourself. The bar's far end is the core
  `actionSlot`.
- **`cardClassName`** — on `CenteredLayout`, the card; `className` is the page around it. Pass
  `max-w-md` here for a wider card than the default `max-w-sm`.
- **`as`** — not a slot: which landmark a part is, when it can be one. `as="nav"` on a
  `SidebarSection` makes it the navigation landmark, named by its `title` or a `label`. A value,
  never a tag you invent: a part takes only the landmarks its shape can honestly be.
- **`firstSlot`**, **`secondSlot`** — the two panes of a `SplitLayout`, as equals. Numbered rather than
  named, because a role pair lies about an even split and a side pair lies once the panes stack or
  the page is read right-to-left.
- **`firstWidth`**, **`secondWidth`** — which pane carries the width. One or the other, never both;
  the pane you do not size takes the rest.
- **`width`** — on a page shell, its column: `page`, `prose` or `full`. A named column rather than
  a number, so every page in an app is one of three widths instead of eleven.
- **`level`** — not a slot: `1 | 2 | 3`, which heading element the title is. The size follows the
  element, so you never set both.
- **`triggerSlot`** — what opens a `DialogLayout`, when the dialog owns its own open state. Passing it
  is the alternative to holding `open` yourself, not an addition to it.
- **`open`**, **`onOpenChange`** — anything that opens, and being told when it does. Filed here
  because `DialogLayout` is the first thing that takes it, not the last: `DisclosureRow` takes it,
  and so does `Combobox`, whose menu is often filled *by* the opening. Pass `onOpenChange`
  alone to be told without taking over.
- **`defaultOpen`** — where it starts, when the thing holds its own open state: `Disclosure`, and
  the `Dialog`, `Popover` and `Menu` primitives. Pass it instead of `open`, never beside it.
- **`hasUnsavedChanges`** — on `DialogLayout`. On, closing asks first. A boolean, or a function
  called at the click: `() => !form.state.isDefaultValue`. Take the function form when the answer
  is not something the caller renders.
- **`requireText`** — on `ConfirmDialog`, `confirm()` and `ConfirmButton`. The text to type
  before the destructive button unlocks: the folder's name, for a delete that is big and cannot be
  undone. Matched exactly, Enter included. Its label is `requireTextLabel`, by prefix.

**Form components add:**

- **`controlSlot`** — the field's body. The only body in the set that is not `contentSlot`, because it is
  the only one the shell *wires* rather than places.
- **`label`** — what the control is called. Rendered as a real `<Label htmlFor>`.
- **`error`** — what is wrong with the value, as a string or a node. Falsy draws nothing.
- **`orientation`** — `vertical` (default) or `horizontal`.
- **`required`** — draws the asterisk and sets `aria-required`.
- **`asGroup`** — the label names a *group* of controls rather than one.

**Controls add:**

- **`aria-label`** — on a `Button` or `ConfirmButton` in an `icon*` size it is required: the
  accessible name.
- **`hint`** — why the control is unavailable, or what it will do. Read after the name.
- **`leadingSlot`** — inside a field, at its start: an icon, the text padded past it. On `Input`.
  Pass a bare `<Search />`; the input sizes and mutes it, and it takes no press.
- **`trailing`** — the far end of a row, after its `label`: a shortcut, a count. On `MenuItem` and the menu's checkbox and radio rows. It takes a string as well as an element, so it is not a `Slot`.
- **`trailingSlot`** — on `Input`, the far end inside the field: one icon-sized control, such as a clear button. On `Button`, the far end after the label: a chevron, a count.
- **`linkSlot`** — the router's link, as an element with no children (`<Link to="/x" />`), which the
  row is drawn inside. On `MenuItem`, so the row is the router's own `<a>` and preloads on hover.
- **`value`**, **`onValueChange`** — every control that holds a value, so one control can be
  swapped for another without rewriting the call site. Never `onChange`, and never a control that
  keeps the value inside itself.
- **`clearable`** — the control can be put back to holding nothing. A button that empties it on
  `Combobox multiple`, `DateTimeInput`, `ColorPicker` and `SearchInput`; on `SelectField` and a
  single `ComboboxField` a first row for "nothing", which writes `null`.
- **`emptyLabel`** — what a `clearable` select's row for "nothing" says, and so what its trigger
  reads while nothing is chosen. Not `placeholder`, which is a prompt and not a choice.
- **`selected`** — beside a press handler, the target is a toggle and this is whether it is on:
  `aria-pressed` on the web, `selected` in the accessibility state on device. On `ToggleChip` and
  `StatTile`. Left out, the target is a plain button; with nothing to press, it is ignored.
- **`view`**, **`onViewChange`** — which of a control's named views is showing, and being told
  when its own toggle moves it. On `MarkdownEditor`: `edit`, `split` or `preview`. Pass both to
  hold the view yourself, in the URL or a preference; pass neither and the control holds it.
- **`defaultView`** — the view it starts in, when the control holds its own. Pass it instead of
  `view`, never beside it.
- **`labelHideBelow`** — under this width (`sm` / `md` / `lg` / `xl`), or `always`, a control with
  an `iconSlot` draws the icon alone. Its label is still its name. On `SegmentedGroup`, for every pill
  in the row.

**List rows and query states add:**

- **`badgesSlot`** — what a row is wearing: a status, a kind, a state. Drawn before the title.
- **`status`** — the state a thing is in, said beside it. On `SidebarSection`, a node between the
  title and the rows (a `<QueryState compact />`). On `SidebarNavItem`, `{ label, iconSlot? }` before
  the count: `label` is read as part of the row's name ("Work, MCP on, 2"), and `iconSlot`, when
  given, is what is seen instead of it — decorative, never read. On `BarNavItem`, the same object,
  drawn as a dot on the icon. On `SidebarLayout`'s bar, a node: one line of the app's own state
  ("3/5 servers running") between `navSlot` and `actionSlot`, the first part of the bar to give way.
- **`leadingSlot`** — the start of a row, before the title: an avatar, a checkbox, an icon. Placed as
  given, not sized like `iconSlot`, and never inside the row's pressed area. On `ListItem`.
- **`meta`** — the grey line of facts beside the title: a name, a time, a count. On `ListItem` it
  sits at the row's far end, before `actionSlot`. On `FileTree` it is a function of the row's
  node, as `actionSlot` and `linkSlot` are there: one prop serves every row of the tree.
- **`entries`** — the things a tree is built from: a flat list of `{ path, type }`, in any order,
  carrying whatever else the caller's rows hold. On `FileTree`, which nests and sorts them.
- **`pinned`** — the entries kept above the rest, in the order given and out of the sort: a
  folder's README. On `FileTree`.
- **`query`** — a `{ isPending, isError, error, refetch }`, taken structurally so no shell names a
  data library.
- **`what`** — what could not be fetched, in the reader's words: "your agents", "the archive".
- **`count`** — how many rows the page is *about to draw*, which is not what came back.
- **`rows`** — how many placeholder rows stand in for a list while it loads. `<Textarea rows>` is
  the DOM attribute of that name and is not this word.
- **`layout`** — on `DescriptionList`: `inline` (label beside value, stacking by itself when
  narrow) or `stacked`. Its rows reuse `label`, `hint` and `actionSlot`, and their `value` is the fact
  on display — a node, not a control's held value.

Rules that follow from the vocabulary:

- Give `footerActionsSlot` the buttons, not `footerSlot`. Passing both splits the footer to its ends;
  passing only `footerActionsSlot` right-aligns it. Passing only `footerSlot` is a footer of prose.
- Do not wrap a slot in a `<div>` to align or inset it. The shell already did.
- Do not pass a `<CardHeader>` or a `<DialogTitle>` into a slot. Slots take content; the shell
  owns the primitive.
- Adding a word to this vocabulary is a decision about the whole set, not about one component.

## No inline edits

Every edit is an explicit form: a field that always looks like a field, and a Save that says it
is saving. A value never turns into an input where it sits — no click-to-rename title, no number
on a row that becomes a box on press, no commit on blur. The set used to ship `InlineTextEdit`
and `InlineNumberEdit`; they were removed, and nothing replaces them.

- **A rename or a one-value change** is a `DialogLayout` holding a form, opened from a Rename
  row, a pencil icon `Button`, or the row itself, with the value in a bound field and Save /
  Cancel — see [forms/app-form.md](forms/app-form.md#forms-in-dialogs).
- **A settings page** is a form with its fields showing, or a `SettingRow` whose `actionSlot` is a
  real control — a `Switch`, a `Combobox` — that is always drawn as one.
- **An "Add lane" box** that appears at the end of a list is a field, not an edit: it holds
  nothing until typed into, and Enter adds it.

Do not hand-build the shape either — a `Pressable` text swapped for an `Input` on press is the
same thing without the name.
