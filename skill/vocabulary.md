# The slot vocabulary

Part of the cubeui skill. Read [SKILL.md](SKILL.md) first for which half you are in and which
component owns the shape; read this before writing any slot prop — anything ending in `Slot` —
or any of the words below on a cubeui component.

The same words mean the same thing in every component, and this is the point of the set.

A prop whose name ends in `Slot` takes elements only. Its type is `SlotNode`: an element, an array
of them, `null`, `undefined` or `false` — not a string and not a number, so words handed to a slot
come inside an element of yours (`<Text>` on a device, a `<p>` or `<span>` on the web). A prop that
takes words has no `Slot` in its name (`title`, `description`, `label`), and the component puts the
`<Text>` around them. Three slots also take a function that returns the elements:
`DialogLayout`'s `footerActionsSlot` (`(close) => …`), `SettingRow`'s `actionSlot` (`(ids) => …`)
and the web `FormField`'s `controlSlot`. A fourth is only a function: `wrapperSlot`
(`(parts, { className }) => …`).

**Everywhere:**

- **`contentSlot`** — the body. The one slot that grows and the one that scrolls.
- **`title`**, **`description`** — what the thing is called and one line on what it is for.
- **`iconSlot`** — sits before the title. Pass a bare `<Plus />`; the shell sizes and colors it.
- **`actionSlot`** — the far end of the *header*. One control, or a fragment of them.
- **`footerSlot`** — the start of the footer. A note, a timestamp, a destructive action held away
  from the others.
- **`footerActionsSlot`** — the end of the footer. The buttons, in reading order, primary last.
- **`wrapperSlot`** — a function `(parts, { className }) => …` that wraps the header, body and
  footer together, inside the shell: a `<form>`, so the submit in `footerActionsSlot` is in the form
  it submits and Enter in a field submits it. The element it returns takes `className`. On
  `DialogLayout`, `CardLayout` and `CenteredCardLayout`.
- **`emptySlot`** — what the body says when `contentSlot` comes back empty. Not a slot you place.
- **`loading`** — a boolean. On, the shell substitutes a skeleton for the part of itself that
  the request was going to fill, and `emptySlot` is not consulted.
- **`className`** — the root. Each slot has its own `<slot>ClassName` when it needs one. In a DOM
  app a bare `border` or `border-t` here draws in the app's border colour, as it does on a
  `<div>`; in an Expo app nothing sets that default, so name the colour too (`border border-foreground/10`).

**Page, split and dialog shells add:**

- **`backSlot`** — the way back, on the line above the title: a back link, or a breadcrumb trail.
  Nodes, never a route. `breadcrumbsSlot` is its old name, still read for one release.
- **`headerContentSlot`** — the row under the title: search, filters, tabs. Stacked in the order
  you pass them, in the title's column, each at its own width; a row that fills the line passes
  `self-stretch`.
- **`headerBarSlot`** — bars under the title that run the full width of the page while the title
  keeps its column: a second toolbar, a pinned notice. On `PageLayout`; each bar draws its own fill
  and inset.
- **`sidebarSlot`** — the second surface in a `SidebarLayout`. `contentSlot` is still the main one, so the
  pair reads the way it does everywhere else.
- **`sidebarPosition`**, **`sidebarWidth`**, **`sidebarHideBelow`**, **`sidebarClassName`** — the
  sidebar's, by prefix. A prop that belongs to a slot wears the slot's name, so it needs no word of
  its own. `sidebarHideBelow="md"` hides the sidebar under `md` and draws the bar in its place;
  `barPosition="bottom"` puts that bar's `navSlot` along the bottom of the page.
- **`brandSlot`** — the start of an app's bar: the logo and the app's name, usually a link home. On
  `AppBar`, and on `SidebarLayout`, whose `AppBar` is drawn only where the sidebar
  is hidden — so there pass what the sidebar's header shows.
- **`navSlot`** — an app bar's navigation, after the brand: the places as icon links — `AppBarItem`s —
  or text links, on `AppBar` and so on `SidebarLayout`'s bar. The shell draws the `<nav>` and
  `navLabel` names it, by prefix — do not wrap it in one yourself. The bar's far end is the core
  `actionSlot`.
- **`cardClassName`** — on `CenteredCardLayout`, the card; `className` is the page around it. Pass
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
  element unless `size` says otherwise.
- **`size`** — on `PageHeader` and `PageLayout`, how large the title is drawn apart from its
  `level`: `lg`, `md` or `sm`. For a compact title on a page that is still the `h1`.
- **`triggerSlot`** — what opens a `DialogLayout`, when the dialog owns its own open state. Passing it
  is the alternative to holding `open` yourself, not an addition to it.
- **`open`**, **`onOpenChange`** — anything that opens, and being told when it does. Filed here
  because `DialogLayout` is the first thing that takes it, not the last: `CollapsibleRow` takes it,
  and so does `Combobox`, whose menu is often filled *by* the opening. Pass `onOpenChange`
  alone to be told without taking over.
- **`defaultOpen`** — where it starts, when the thing holds its own open state: `Collapsible`, and
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
  `StatTile`. Left out, the target is a plain button; with nothing to press, it is ignored. On a
  row it means the current one instead; see the list rows below.
- **`view`**, **`onViewChange`** — which of a control's named views is showing, and being told
  when its own toggle moves it. On `MarkdownEditor`: `edit`, `split` or `preview`. Pass both to
  hold the view yourself, in the URL or a preference; pass neither and the control holds it.
- **`defaultView`** — the view it starts in, when the control holds its own. Pass it instead of
  `view`, never beside it.
- **`labelHideBelow`** — under this width (`sm` / `md` / `lg` / `xl`), or `always`, a control with
  an `iconSlot` draws the icon alone. Its label is still its name. On `SegmentedGroup`, for every pill
  in the row.

**List rows and load states add:**

- **`badgesSlot`** — what a row is wearing: a status, a kind, a state. Drawn before the title.
- **`selected`** — on a row, the current one: the record open beside the list. Tinted in `active`,
  and `aria-current` on the row's link or button (`selected` in the accessibility state on
  device), never `aria-pressed`: a row is current, not on. On `ListItem` and `Item`; on `FileTree`
  it is the open file's path. A `ListItem` with nothing to press has nothing to carry
  `aria-current`, so say it in the row's words as well, and on `Item` put `aria-current` on the
  link yourself.
- **`status`** — the state a thing is in, said beside it. On `SidebarSection`, a node between the
  title and the rows (a `<LoadState compact />`). On `SidebarItem`, `{ label, iconSlot? }` before
  the count: `label` is read as part of the row's name ("Work, MCP on, 2"), and `iconSlot`, when
  given, is what is seen instead of it — decorative, never read. On `AppBarItem`, the same object,
  drawn as a dot on the icon. On `AppBar` (and so `SidebarLayout`'s bar), a node: one line of the app's own state
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
- **`record`** — the one record a detail screen asked for, once its query has answered; `null` or
  `undefined` is one that is not there. On `LoadState`, in place of `count`.
- **`notFoundLabel`** — what a detail screen says when its `record` is not there: "Project not
  found". Drawn as a heading, at `level`: `2` in a detail page's body, under the page's title,
  where `description` and `actionSlot` go with it.
- **`rows`** — how many placeholder rows stand in for a list while it loads. `<Textarea rows>` is
  the DOM attribute of that name and is not this word.
- **`layout`** — on `PropertyList`: `inline` (label beside value, stacking by itself when
  narrow) or `stacked`. Its rows reuse `label`, `hint` and `actionSlot`, and their `value` is the fact
  on display — a node, not a control's held value.

Rules that follow from the vocabulary:

- Give `footerActionsSlot` the buttons, not `footerSlot`. Passing both splits the footer to its ends;
  passing only `footerActionsSlot` right-aligns it. Passing only `footerSlot` is a footer of prose.
- Do not wrap a slot in a `<div>` to align or inset it. The shell already did.
- Do not pass a `<CardHeader>` or a `<DialogTitle>` into a slot. Slots take content; the shell
  owns the primitive.
- Adding a word to this vocabulary is a decision about the whole set, not about one component.
