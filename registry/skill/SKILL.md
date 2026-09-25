---
name: cubeui
description: How to use the cubeui components (PageLayout, HeaderContentFooter, StickyHeaderContentFooter, CardLayout, DialogLayout, PageHeader, SplitLayout, SidebarLayout, Sidebar, SidebarSection, SidebarNavItem, TopBarLayout, Section, DescriptionList, PropertyRow, FormField, FieldRow, useAppForm and its bound fields, ActionButton, ConfirmButton, OptionSelect, MultiSelect, DatePicker, ColorPicker, PasswordInput on the web; Menu, SegmentedGroup, SegmentedButton, ThemePicker, useThemePreference, DateTimeInput, InlineNumberEdit, ColorDot, readableTextColor and the icon set on both; Page, DetailPage, Form, FormDialog, ConfirmDialog, QueryState and the React Native primitives in an Expo app) in a project that installs them from the cubeui shadcn registry. Read before building a page shell, a page title block, a card, a dialog, a two-pane screen, an app's navigation sidebar or top bar, a section heading, a list of read-only label and value rows, a form, an icon-only button, a popover menu of actions or of on/off rows, or a destructive action with shadcn primitives — it says which component owns the shape and which props carry which node, so hand-written scaffolding is not re-derived per screen.
---

# cubeui

cubeui components are **shells**: they own a shape and take the parts as props. They do not
fetch, they do not hold form state, and they render no text of their own. A shell is one
self-closing element at the call site, and every slot is a named `ReactNode` — a string, an
element, a fragment.

**No cubeui component takes children.** The body is the `content` prop, exactly like the header
and the footer are props, because in a layout every part is dynamic and none of them is the
privileged one. `<CardLayout>{rows}</CardLayout>` is wrong; `<CardLayout content={rows} />` is
right. This is the mistake to check for first when reading or writing a call site.

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

**Most items are on both.** `button`, `card`, `input`, `select`, `dialog`, `popover`, `menu`, `tabs`,
`tooltip`, `badge`, `calendar`, `field`, `toast`, `query-state` — same item name, same props,
one written in React Native and one compiled or hand-written for the DOM. That is the point of
the layout: a call site moves between the two halves unchanged.

**So are the layout shells.** `HeaderContentFooter`, `StickyHeaderContentFooter`, `PageHeader`,
`PageLayout`, `SplitLayout`, `SidebarLayout`, `Sidebar`, `TopBarLayout`, `CardLayout`, `DialogLayout`, `Section` and
`DescriptionList` are written once in
React Native and compiled to the web, so `@cubeui/page-layout` installs in an Expo project and a
Vite one alike, with the same props.

**Some web shells are still web-only.** `FormField`, the `@cubeui/app-form` fields,
`ActionButton`, `MultiSelect` and the rest of the controls lean on CSS grid tracks and arbitrary
variants, which Yoga and NativeWind do not have. In an Expo project those items are a 404, and
that is the registry telling you the truth rather than shipping a shell that lays out wrong. Use
the native set for those shapes instead — see [Shapes on React Native](#shapes-on-react-native)
at the end.

## Choosing — on the web

| The shape you are building | Use | Reference |
| --- | --- | --- |
| A whole page — a title, buttons, and rows under them | `PageLayout` | [layout.md](layout.md) |
| A page: chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` | [layout.md](layout.md) |
| The same three zones, whole thing scrolls with the page | `HeaderContentFooter` | [layout.md](layout.md) |
| The title block at the top of a page: name, buttons, search | `PageHeader` | [layout.md](layout.md) |
| A navigation column or inspector beside a working surface | `SidebarLayout` | [layout.md](layout.md) |
| The app's sidebar itself — brand, titled lists of links, settings and sign out at the bottom | `Sidebar`, `SidebarSection`, `SidebarNavItem` | [layout.md](layout.md) |
| An app shell with no sidebar — a bar across the top with the brand, a few links and the account, the page below | `TopBarLayout` | [layout.md](layout.md#top-bar) |
| Two comparable panes side by side — a diff, a form beside its preview | `SplitLayout` | [layout.md](layout.md) |
| A list beside the detail for the selected row | `SidebarLayout`, or two routes | [layout.md](layout.md) |
| A panel with a title, a body, and buttons at the bottom | `CardLayout` | [layout.md](layout.md) |
| A modal with a title, a body that scrolls, buttons at the bottom | `DialogLayout` | [layout.md](layout.md) |
| A heading over a group of fields or rows | `Section` | [layout.md](layout.md) |
| Read-only facts — a label, a value, a hint under it, a copy button (a settings or "about" page) | `DescriptionList`, `PropertyRow` | [layout.md](layout.md#description-lists) |
| A list page's failed / loading / empty rungs | `QueryState` | [layout.md](layout.md) |
| A list row that opens onto detail | `DisclosureRow` | [layout.md](layout.md) |
| A form of any size | `useAppForm` and the bound fields | [forms.md](forms.md) |
| A label, a control, a hint under it, and an error | `FormField` | [forms.md](forms.md) |
| Two or three fields that belong on one line | `FieldRow` | [forms.md](forms.md) |
| An icon-only button | `ActionButton` | [controls.md](controls.md) |
| A button that deletes, discards, revokes or resets | `ConfirmButton` | [controls.md](controls.md) |
| A popover of actions or links — a ⋯ menu, Rename / Move / Delete on a row, Open in a router `link` | `Menu`, `MenuItem` | [controls.md](controls.md#menu) |
| A popover of on/off rows that stays open — labels on a todo, columns shown — or a one-of-N filter behind a button | `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem` | [controls.md](controls.md#menu) |
| A select, a tag picker, a date picker, a colour picker, a password box | the controls | [controls.md](controls.md) |
| A row of pills that switches a view or a period, one current | `SegmentedGroup`, `SegmentedButton` | [controls.md](controls.md#segmented-control) |
| A light / dark / system setting, stored and applied | `ThemePicker`, `useThemePreference` | [controls.md](controls.md#theme) |
| A date and a time as one `Date` on both halves — or, with `clearable mode="date"`, an optional date only | `DateTimeInput` | [controls.md](controls.md#date-and-date-range) |
| A number on a row or card, edited in place without a form | `InlineNumberEdit` | [controls.md](controls.md#a-number-edited-in-place) |
| A colour-coded thing: a swatch, a card's accent stripe, legible text on a chip | `ColorDot`, `Card accentColor`, `readableTextColor` | [controls.md](controls.md#colour) |
| A tag or filter chip with an ✕ that takes it off | `Badge onRemove` | [controls.md](controls.md#removable-badge) |
| An upload of one text file or several, dropped or picked | `FilePicker` | [controls.md](controls.md#file-picker) |
| An Upload button in a page header or toolbar that opens the file dialog directly | `FilePickerButton` | [controls.md](controls.md#as-a-button) |
| An icon anywhere | `@cubeui/icons`, not lucide directly | [controls.md](controls.md#icons) |

If none of them fits, use the shadcn primitives directly — do **not** bend a shell with
`className` until it is a different component. A shape that shows up three times is a case for a
new registry item, not for a fourth variant prop.

## The slot vocabulary

The same words mean the same thing in every component, and this is the point of the set.

**Everywhere:**

- **`content`** — the body. The one slot that grows and the one that scrolls.
- **`title`**, **`description`** — what the thing is called and one line on what it is for.
- **`icon`** — sits before the title. Pass a bare `<Plus />`; the shell sizes and colors it.
- **`action`** — the far end of the *header*. One control, or a fragment of them.
- **`footer`** — the start of the footer. A note, a timestamp, a destructive action held away
  from the others.
- **`footerActions`** — the end of the footer. The buttons, in reading order, primary last.
- **`empty`** — what the body says when `content` comes back empty. Not a slot you place.
- **`loading`** — a boolean. On, the shell substitutes a skeleton for the part of itself that
  the request was going to fill, and `empty` is not consulted.
- **`className`** — the root. Each slot has its own `<slot>ClassName` when it needs one.

**Page, split and dialog shells add:**

- **`breadcrumbs`** — the line above the title. A trail, or a back link, which is a one-step
  trail. Nodes, never a route.
- **`headerContent`** — the row under the title: search, filters, tabs. Stacked in the order
  you pass them.
- **`sidebar`** — the second surface in a `SidebarLayout`. `content` is still the main one, so the
  pair reads the way it does everywhere else.
- **`brand`** — the start of an app's top bar: the logo and the app's name, usually a link home.
  On `TopBarLayout`; a sidebar's brand is its `header`.
- **`nav`** — the primary links in a `TopBarLayout`'s bar, after the brand. Pass the links; the
  shell draws the navigation landmark around them. `navLabel` names it, by prefix.
- **`sidebarPosition`**, **`sidebarWidth`**, **`sidebarClassName`** — the sidebar's, by prefix. A prop
  that belongs to a slot wears the slot's name, so it needs no word of its own.
- **`as`** — not a slot: which landmark a part is, when it can be one. `as="nav"` on a
  `SidebarSection` makes it the navigation landmark, named by its `title` or a `label`. A value,
  never a tag you invent: a part takes only the landmarks its shape can honestly be.
- **`first`**, **`second`** — the two panes of a `SplitLayout`, as equals. Numbered rather than
  named, because a role pair lies about an even split and a side pair lies once the panes stack or
  the page is read right-to-left.
- **`firstWidth`**, **`secondWidth`** — which pane carries the width. One or the other, never both;
  the pane you do not size takes the rest.
- **`width`** — on a page shell, its column: `page`, `prose` or `full`. A named column rather than
  a number, so every page in an app is one of three widths instead of eleven.
- **`level`** — not a slot: `1 | 2 | 3`, which heading element the title is. The size follows the
  element, so you never set both.
- **`trigger`** — what opens a `DialogLayout`, when the dialog owns its own open state. Passing it
  is the alternative to holding `open` yourself, not an addition to it.
- **`open`**, **`onOpenChange`** — anything that opens, and being told when it does. Filed here
  because `DialogLayout` is the first thing that takes it, not the last: `DisclosureRow` takes it,
  and so does `OptionSelect`, whose menu is often filled *by* the opening. Pass `onOpenChange`
  alone to be told without taking over.
- **`hasUnsavedChanges`** — on `DialogLayout`. On, closing asks first. A boolean, or a function
  called at the click: `() => !form.state.isDefaultValue`. Take the function form when the answer
  is not something the caller renders.

**Form components add:**

- **`control`** — the field's body. The only body in the set that is not `content`, because it is
  the only one the shell *wires* rather than places.
- **`label`** — what the control is called. Rendered as a real `<Label htmlFor>`.
- **`error`** — what is wrong with the value, as a string or a node. Falsy draws nothing.
- **`orientation`** — `vertical` (default) or `horizontal`.
- **`required`** — draws the asterisk and sets `aria-required`.
- **`asGroup`** — the label names a *group* of controls rather than one.

**Controls add:**

- **`label`** — on `ActionButton` and `ConfirmButton` it is required, and it is the accessible
  name, not a caption.
- **`hint`** — why the control is unavailable, or what it will do. Read after the name.
- **`trailing`** — the far end of a row, after its `label`: a shortcut, a count. On `MenuItem` and the menu's checkbox and radio rows.
- **`link`** — the router's link, as an element with no children (`<Link to="/x" />`), which the
  row is drawn inside. On `MenuItem`, so the row is the router's own `<a>` and preloads on hover.
- **`value`**, **`onValueChange`** — every control that holds a value, so one control can be
  swapped for another without rewriting the call site. Never `onChange`, and never a control that
  keeps the value inside itself.

**List rows and query states add:**

- **`badges`** — what a row is wearing: a status, a kind, a state. Drawn before the title.
- **`meta`** — the grey line of facts beside the title: a name, a time, a count.
- **`query`** — a `{ isPending, isError, error, refetch }`, taken structurally so no shell names a
  data library.
- **`what`** — what could not be fetched, in the reader's words: "your agents", "the archive".
- **`count`** — how many rows the page is *about to draw*, which is not what came back.
- **`rows`** — how many placeholder rows stand in for a list while it loads. `<Textarea rows>` is
  the DOM attribute of that name and is not this word.
- **`layout`** — on `DescriptionList`: `inline` (label beside value, stacking by itself when
  narrow) or `stacked`. Its rows reuse `label`, `hint` and `action`, and their `value` is the fact
  on display — a node, not a control's held value.

Rules that follow from the vocabulary:

- Give `footerActions` the buttons, not `footer`. Passing both splits the footer to its ends;
  passing only `footerActions` right-aligns it. Passing only `footer` is a footer of prose.
- Do not wrap a slot in a `<div>` to align or inset it. The shell already did.
- Do not pass a `<CardHeader>` or a `<DialogTitle>` into a slot. Slots take content; the shell
  owns the primitive.
- Adding a word to this vocabulary is a decision about the whole set, not about one component.

## What does not belong in a shell

Data fetching, form state, toasts, routing, permission checks. A shell is handed nodes and
places them. If a screen needs "disable save until valid", that is the caller's, or a form
component's — not a prop on the layout.

The line is *who owns the state*, not *how much the shell does*. `DialogLayout` asks before
closing on unsaved work (`hasUnsavedChanges`) because the state it holds — is the question up? —
is about the dialog's own interaction, not the app's data. Whether the work *is* unsaved is still
asked for, never computed: only the caller knows what its fields are.

A draggable split divider is the same case: the width it drags is state, so it belongs to
`react-resizable-panels`, not to `SplitLayout`. A stored sidebar collapse is the same case again —
`sidebar={open ? <Nav /> : undefined}` is the whole feature, and the caller already holds `open`.

## Shapes on React Native

The native half is its own set: fewer shells, because a phone screen has fewer shapes in it, and
the ones it has take `children` rather than a `content` prop — a React Native tree is a tree of
views and there is no shell wrapping to hide.

| The shape you are building | Use | Item |
| --- | --- | --- |
| A screen — a title, actions, a body that scrolls | `Page` | `@cubeui/page` |
| The same screen with the web's props, on both halves | `PageLayout` | `@cubeui/page-layout` |
| Chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` | `@cubeui/header-content-footer` |
| The title block at the top of a screen | `PageHeader` | `@cubeui/page-header` |
| Two panes side by side, stacked when narrow | `SplitLayout`, `SidebarLayout` | `@cubeui/split-layout` |
| An app's navigation sidebar: a header, titled lists of link rows, a footer of link or button rows | `Sidebar`, `SidebarSection`, `SidebarNavItem` | `@cubeui/sidebar` |
| An app with no sidebar: a bar across the top — brand, links, actions — over a screen that scrolls — see [layout.md](layout.md#top-bar) | `TopBarLayout` | `@cubeui/top-bar-layout` |
| A card with a title, actions and a footer | `CardLayout` | `@cubeui/card-layout` |
| A dialog with a scrolling body and a discard guard | `DialogLayout` | `@cubeui/dialog-layout` |
| A detail screen for one record | `DetailPage`, `DetailHeader` | `@cubeui/detail-page` |
| A heading over a group of fields or rows, optionally on a card | `Section` | `@cubeui/section` |
| Just the small muted label, with an optional heading `level` | `SectionHeading` | `@cubeui/section-heading` |
| Read-only facts: a label, a value, a hint under it, an action beside it — see [layout.md](layout.md#description-lists) | `DescriptionList`, `PropertyRow` | `@cubeui/description-list` |
| A grid of cards, or the empty state under one | `CardGrid`, `EmptyState` | `@cubeui/page` |
| A screen that *is* its empty state — a first run, a record not found, a dead link — so its title is the heading: `level` 1–3, same size | `EmptyState level={1}` | `@cubeui/page` |
| A form of any size — see [forms.md](forms.md#on-react-native) | `useAppForm`, `Form` and its bound fields | `@cubeui/form` |
| A date or date and time, bound to a form field | `DateTimeField` | `@cubeui/date-time-field` |
| A colour, bound to a form field | `ColorField` | `@cubeui/color-picker-field` |
| A label, a control, a hint under it, and an error | `Field` and its parts | `@cubeui/field` |
| A row of pills that switches a view or a period — see [controls.md](controls.md#segmented-control) | `SegmentedGroup`, `SegmentedButton` | `@cubeui/segmented` |
| Three or four exclusive choices, all on screen (a visibility, a plan) | `RadioGroup`, `RadioGroupItem` | `@cubeui/radio-group` |
| The app's light / dark / system setting, stored and applied — see [controls.md](controls.md#theme) | `ThemePicker`, `useThemePreference` | `@cubeui/theme-picker` |
| The same, bound to a form field | `RadioGroupField` | `@cubeui/radio-group-field` |
| A date and a time as one `Date`, or an optional date only (`clearable mode="date"`) — see [controls.md](controls.md#date-and-date-range) | `DateTimeInput` | `@cubeui/date-time-input` |
| A number on a row or card, edited in place — see [controls.md](controls.md#a-number-edited-in-place) | `InlineNumberEdit` | `@cubeui/inline-number-edit` |
| A colour-coded thing — see [controls.md](controls.md#colour) | `ColorDot`, `Card accentColor`, `readableTextColor` | `@cubeui/color-dot`, `@cubeui/card`, `@cubeui/readable-text-color` |
| A tag or filter chip the user can take off — see [controls.md](controls.md#removable-badge) | `Badge onRemove` | `@cubeui/badge` |
| An icon — see [controls.md](controls.md#icons) | the lucide names | `@cubeui/icons` |
| A form in a modal | `FormDialog` | `@cubeui/form-dialog` |
| An action that deletes, discards, revokes or resets | `ConfirmDialog` | `@cubeui/confirm-dialog` |
| A popover of actions — a ⋯ menu, Rename / Move / Delete on a row — see [controls.md](controls.md#menu) | `Menu`, `MenuItem` | `@cubeui/menu` |
| A popover of on/off rows that stays open, or a one-of-N filter behind a button — see [controls.md](controls.md#menu) | `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem` | `@cubeui/menu` |
| A list screen's failed / loading / empty rungs | `QueryState` | `@cubeui/query-state` |
| A route that threw — render it as the whole error boundary: `role="alert"`, `title`, `details` (the raw message, for a bug report), `actions` (a Reload beside Try again) | `RouteError` | `@cubeui/route-error` |

One name means different things across the halves, and it is worth knowing before you grep:

- **`Form`.** On the web `@cubeui/form-set` is the eight bound-field items and the form component
  is `useAppForm`; on native `@cubeui/form` is one file exporting `Form`, `useAppForm` and its bound
  fields. The item is called `form-set` on the web because `form` is the native component's
  name, and the shadcn CLI resolves a cross-item import by basename — the two cannot share it.

`PageHeader` is one component on both halves: `@cubeui/page-header`. `@cubeui/page` re-exports
it, so `Page` and `PageLayout` draw the same title block — `title`, `description`, `action`,
`icon`, `breadcrumbs`, `loading`, and a `level` (default 1) for the heading's rank.

Everything else in the native set is the primitive of the same name: `Button`, `Card`, `Input`,
`Label`, `Checkbox`, `Switch`, `Textarea`, `Select`, `Dialog`, `Popover`, `Menu`, `Tabs`, `Tooltip`,
`Calendar`, `Badge`, `Segmented`, `ToggleChip`, `ColorPicker`, `Toast`, `Code`. They take the props the
web ones take, with four conversions that are the same everywhere:

- **`onPress`, not `onClick`.** Every pressable in the set, on both halves — the compiled web
  output takes `onPress` too, so a call site does not change when it moves.
- **`onChangeText`, not `onChange`.** An RN `TextInput` hands you the string, not an event.
  The compiled web `Input` and `Textarea` take both, so a DOM call site written against shadcn
  still compiles — but shared code should use `onChangeText`, the one that exists on device.
- **`onSubmitEditing` and `onEscape`, not `onKeyDown`.** `Input` answers Enter with
  `onSubmitEditing` and Escape with `onEscape` on both halves, which is all an inline edit — a
  rename, an "Add lane" field — needs: `onEscape={() => { setDraft(name); setEditing(false); }}`.
  For any other key, `onKeyPress` is React Native's, reading `e.nativeEvent.key`; the web half
  fires it from `keydown`, so it hears Escape and the arrows too. Do not drop to a raw
  `TextInput` for a key. (`Textarea` has none of these yet.)
- **No `asChild` on `Button`.** It exists for handing a button's look to a link, and the routers
  that need it have their own, so the nesting inverts: `<Link asChild><Button /></Link>`.

The web halves go the other way too: `Button`, `Dialog`, `Popover`, `Tooltip`, `Tabs`, `Label`
and `Badge` are a **superset of shadcn's own** there. Every part also takes the props of the radix
part or DOM element it renders, and shadcn's extra parts and sizes exist — `DialogClose`,
`DialogPortal`, `DialogOverlay`, `PopoverAnchor`, `PopoverClose`, `PopoverHeader`, controlled `Tabs`,
`TooltipContent sideOffset`, `Badge asChild`, `size="icon-sm"`. So a shadcn call site compiles
unchanged. The new parts and sizes exist on native too; the radix and DOM passthrough props are
web only, and a native call site keeps to the shared contract.

`file-picker` is the one item whose native half does not do the job: it draws the zone and says
so on screen, and `FilePickerButton` draws a disabled button that says so as its hint, because picking a file needs `expo-document-picker` and a permission flow that is
the app's choice. The contract is there, including `multiple` and `onPickMany`. The picking is
not.
