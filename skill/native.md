# cubeui on React Native

Part of the cubeui skill, for an Expo app. Read [SKILL.md](SKILL.md) first: the slot vocabulary and the "no children" rule are there. Each item's import line is in [install-paths.md](install-paths.md).

## Shapes on React Native

The native half is its own set: fewer shells, because a phone screen has fewer shapes in it. They
take their body as `contentSlot` like every other shell: `<Page contentSlot={…} />`, and
`<CardGrid contentSlot={cards} />`, where the cards are an array or a fragment and each one gets a
cell. `DetailPage`'s `contentSlot` is a function, called with the record once it has loaded.

`Page` lays its body on the same column as `PageLayout` (`PAGE_COLUMN`, or the prose column at
`width="narrow"`), with `gap-4` between what it stacks, and its `PageHeader` shares the body's one inset,
so the title sits over the first card rather than indented past it. `DetailPage` draws its own
waiting and missing states: placeholder rows (`RowSkeleton`) while it loads and an `EmptyState`
when the record is not found, so it installs `@cubeui/query-state` and `@cubeui/empty-state`.
`DetailHeader` is the page's title, an `h1` (`aria-level` 1) at `text-xl`; its text column
shrinks (`min-w-0`) and the row wraps, so a long name never pushes the actions off a phone.

| The shape you are building | Use | Item |
| --- | --- | --- |
| A screen — a title, actions, a body that scrolls | `Page` | `@cubeui/page` |
| The same screen with the web's props, on both halves | `PageLayout` | `@cubeui/page-layout` |
| Chrome above, a body that scrolls, chrome below | `StickyHeaderContentFooter` | `@cubeui/header-content-footer` |
| The title block at the top of a screen | `PageHeader` | `@cubeui/page-header` |
| Two panes side by side, stacked when narrow | `SplitLayout`, `SidebarLayout` | `@cubeui/split-layout` |
| The app's sidebar on a tablet, a bar with the brand and icon links on a phone — see [layout/sidebar.md](layout/sidebar.md#on-a-phone-a-bar-instead-of-the-rail) | `SidebarLayout sidebarHideBelow` | `@cubeui/split-layout` |
| A place in that bar: an icon link named by `label`, with a count badge or a status dot | `BarNavItem` | `@cubeui/sidebar` |
| An app's navigation sidebar: a header, titled lists of link rows, a footer of link or button rows | `Sidebar`, `SidebarSection`, `SidebarNavItem` | `@cubeui/sidebar` |
| An app with no sidebar: a bar across the top — brand, links, actions — over a screen that scrolls — see [layout/top-bar.md](layout/top-bar.md#top-bar) | `TopBarLayout` | `@cubeui/top-bar-layout` |
| A card with a title, actions and a footer | `CardLayout` | `@cubeui/card-layout` |
| A screen that is one card — a sign-in, a token gate — so its title is the heading: `level` 1–3, same size | `CardLayout level={1}` | `@cubeui/card-layout` |
| A sign-in or token screen: one card centred on the screen, scrolling above the keyboard — see [layout/pages.md](layout/pages.md#centered-pages) | `CenteredLayout` | `@cubeui/centered-layout` |
| A dialog with a scrolling body and a discard guard | `DialogLayout` | `@cubeui/dialog-layout` |
| A detail screen for one record: its loading and not-found branches around the body | `DetailPage` | `@cubeui/detail-page` |
| The header of that screen: a back button, the record's name (`title`, a heading `level` 1–3, 1 by default), a `description` under it, `badgesSlot` and `actionSlot`. Its own item, so it is its own import (`@/components/detail-header`). `subtitle`, `badgeSlot` and `actionsSlot` are the old names, deprecated | `DetailHeader` | `@cubeui/detail-header` |
| A heading over a group of fields or rows, optionally on a card | `Section` | `@cubeui/section` |
| Just the small muted label, with an optional heading `level` | `SectionHeading` | `@cubeui/section-heading` |
| A settings row: a title and a line on what it does, a switch, select or button at the end — see [layout/facts.md](layout/facts.md#setting-rows). A lone boolean with its caption is `SwitchField` | `SettingRow` | `@cubeui/setting-row` |
| A part of a screen that shows and hides — "Show completed (3)", a raw payload — see [layout/cards.md](layout/cards.md#disclosure) | `Disclosure` | `@cubeui/disclosure` |
| Read-only facts: a label, a value, a hint under it, an action beside it — see [layout/facts.md](layout/facts.md#description-lists) | `DescriptionList`, `PropertyRow` | `@cubeui/description-list` |
| One figure on a card, or a pressable filter tile with a pressed state — see [layout/facts.md](layout/facts.md#stat-tiles) | `StatTile` | `@cubeui/stat-tile` |
| A grid of cards | `CardGrid` | `@cubeui/page` |
| What an empty list says (also re-exported by `@cubeui/page`) | `EmptyState` | `@cubeui/empty-state` |
| A screen that *is* its empty state — a first run, a record not found, a dead link — so its title is the heading: `level` 1–3, same size | `EmptyState level={1}` | `@cubeui/empty-state` |
| An empty list *inside* something — a card, a sidebar section, a popover: one muted line, optional small icon and action, never a heading — see [layout/lists.md](layout/lists.md#empty-states) | `EmptyState compact` | `@cubeui/empty-state` |
| A form of any size — see [forms/native.md](forms/native.md#on-react-native) | `useAppForm`, `Form` and its bound fields | `@cubeui/form` |
| A date or date and time, bound to a form field | `DateTimeField` | `@cubeui/date-time-field` |
| A colour, bound to a form field | `ColorField` | `@cubeui/color-picker-field` |
| Several of a list, bound to a form field | `ComboboxField multiple` | `@cubeui/combobox-field` |
| One of a long, fetched or annotated list, bound to a form field — searchable, and `clearable` for a choice that may be left unmade | `ComboboxField` | `@cubeui/combobox-field` |
| One of a few short choices as pills, bound to a form field | `SegmentedField` | `@cubeui/segmented-field` |
| A label, a control, a hint under it, and an error | `Field` and its parts | `@cubeui/field` |
| A row of pills that switches a view or a period — see [controls/combobox.md](controls/combobox.md#segmented-control) | `SegmentedGroup`, `SegmentedButton` | `@cubeui/segmented` |
| Three or four exclusive choices, all on screen (a visibility, a plan) | `RadioGroup`, `RadioGroupItem` | `@cubeui/radio-group` |
| One value from a longer list, in a sheet — options as an array, with groups, rules and notes — see [controls/combobox.md](controls/combobox.md#combobox) | `Combobox` | `@cubeui/combobox` |
| The app's light / dark / system setting and its palette, stored and applied — see [controls/theme.md](controls/theme.md#theme) | `ThemePicker`, `useThemePreference`, `usePalettePreference`, `PaletteProvider` | `@cubeui/theme-picker` |
| The same, bound to a form field | `RadioGroupField` | `@cubeui/radio-group-field` |
| A date and a time as one `Date`, or an optional date only (`clearable mode="date"`) — see [controls/dates.md](controls/dates.md#date-and-date-range) | `DateTimeInput` | `@cubeui/date-time-input` |
| A date, a date and time, or a date range, behind one trigger — see [controls/dates.md](controls/dates.md#date-and-date-range) | `DatePicker`, `DateRangePicker` | `@cubeui/date-picker` |
| How much of something is done — an upload, a context window — see [controls/display.md](controls/display.md#progress) | `Progress` | `@cubeui/progress` |
| A colour-coded thing — see [controls/display.md](controls/display.md#colour) | `ColorDot`, `Card accentColor`, `readableTextColor` | `@cubeui/color-dot`, `@cubeui/card`, `@cubeui/readable-text-color` |
| A count, a file size, a duration, a date or "3 days ago" as text, and a row of them joined with ` · ` — see [controls/dates.md](controls/dates.md#numbers-sizes-and-dates-as-text) | `formatCount`, `formatBytes`, `formatDuration`, `formatDate`, `formatDateTime`, `formatAgo`, `joinStats` | `@cubeui/format` |
| A text field with an icon inside it — see [controls/inputs.md](controls/inputs.md#an-icon-in-an-input) | `Input leadingSlot`, `Input trailingSlot` | `@cubeui/input` |
| A tag picker: chips on a trigger, a searchable list in a sheet, each chip removable — see [controls/combobox.md](controls/combobox.md#several-at-once) | `Combobox multiple` | `@cubeui/combobox` |
| A search or filter box — see [controls/inputs.md](controls/inputs.md#search) | `SearchInput` | `@cubeui/search-input` |
| A search box over rows that filter as you type, each chosen by a press — see [controls/menus.md](controls/menus.md#command) | `Command` and its parts | `@cubeui/command` |
| A tag or filter chip the user can take off — see [controls/display.md](controls/display.md#removable-badge) | `Badge onRemove` | `@cubeui/badge` |
| An icon-only button, with a `hint` tooltip and a reason that survives `disabled` — see [controls/buttons.md](controls/buttons.md#icon-buttons) | `Button` in an `icon*` size | `@cubeui/button` |
| A button that deletes, discards, revokes or resets and asks first — see [controls/buttons.md](controls/buttons.md#destructive-buttons) | `ConfirmButton` | `@cubeui/confirm-button` |
| A button that copies a value and ticks when it has — see [controls/buttons.md](controls/buttons.md#copy-button) | `CopyButton` | `@cubeui/copy-button` |
| A button that saves a file, `downloadBlob()` and `downloadUrl()` — see [controls/buttons.md](controls/buttons.md#download-button) | `DownloadButton` | `@cubeui/download-button` |
| A block of preformatted text — a config file, a command, a payload, a log — or one value in a box with a copy button — see [controls/code-and-markdown.md](controls/code-and-markdown.md#code-block) | `CodeBlock` | `@cubeui/code` |
| A callout — a warning, a note, the last error — see [controls/display.md](controls/display.md#alert) | `Alert` | `@cubeui/alert` |
| A loading indicator — see [controls/display.md](controls/display.md#spinner) | `Spinner` | `@cubeui/spinner` |
| A pulsing placeholder block — see [controls/display.md](controls/display.md#skeleton) | `Skeleton` | `@cubeui/skeleton` |
| A one-pixel rule between groups — see [controls/display.md](controls/display.md#separator) | `Separator` | `@cubeui/separator` |
| An icon — see [controls/icons.md](controls/icons.md#icons) | the lucide names | `@cubeui/icons` |
| A form in a modal, with the unsaved-changes guard — see [forms/app-form.md](forms/app-form.md#forms-in-dialogs) | `DialogLayout hasUnsavedChanges` | `@cubeui/dialog-layout` |
| A page that asks before it is left with unsaved edits — see [layout/dialogs.md](layout/dialogs.md#a-page-with-unsaved-edits) | `useUnsavedChangesGuard`, `UnsavedChangesDialog` | `@cubeui/unsaved-changes-guard` |
| An action that deletes, discards, revokes or resets — `requireText` to ask for its name first, see [controls/buttons.md](controls/buttons.md#type-the-name-to-confirm) | `ConfirmDialog` | `@cubeui/confirm-dialog` |
| A popover of actions — a ⋯ menu, Rename / Move / Delete on a row — see [controls/menus.md](controls/menus.md#menu) | `Menu`, `MenuItem` | `@cubeui/menu` |
| A popover of on/off rows that stays open, or a one-of-N filter behind a button — see [controls/menus.md](controls/menus.md#menu) | `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem` | `@cubeui/menu` |
| The list rows sit in: a `<ul>` with a rule between rows and the padding around each — see [layout/lists.md](layout/lists.md#list) | `List` | `@cubeui/list` |
| A list row: an avatar or checkbox, a title over a line, a date and buttons at the far end, optionally pressable — see [layout/lists.md](layout/lists.md#listitem) | `ListItem` | `@cubeui/list-item` |
| Files and folders nested from a flat list of paths, with folding folders, a selected file, row actions and a drag onto a folder — see [layout/trees-and-tables.md](layout/trees-and-tables.md#filetree) | `FileTree` (and `buildTree` from `@/lib/tree`) | `@cubeui/file-tree` |
| A list row that opens onto detail: badges, a title, a line of facts, a body under it — see [layout/lists.md](layout/lists.md#disclosurerow) | `DisclosureRow` | `@cubeui/disclosure-row` |
| A list screen's failed / loading / empty rungs | `QueryState` | `@cubeui/query-state` |
| A route that threw — render it as the whole error boundary: `role="alert"`, `title` (the screen's heading), `details` (the raw message, for a bug report), `actionsSlot` (a Reload beside Try again), all in one `max-w-md` column | `RouteError` | `@cubeui/route-error` |

One name means different things across the halves, and it is worth knowing before you grep:

- **`Form`.** On the web `@cubeui/form-set` is the eight bound-field items and the form component
  is `useAppForm`; on native `@cubeui/form` is one file exporting `Form`, `useAppForm` and its bound
  fields. The item is called `form-set` on the web because `form` is the native component's
  name, and the shadcn CLI resolves a cross-item import by basename — the two cannot share it.

`PageHeader` is one component on both halves: `@cubeui/page-header`. `@cubeui/page` re-exports
it, so `Page` and `PageLayout` draw the same title block — `title`, `description`, `actionSlot`,
`iconSlot`, `breadcrumbsSlot`, `loading`, and a `level` (default 1) for the heading's rank.

Everything else in the native set is the primitive of the same name: `Button`, `Card`, `Input`,
`Label`, `Checkbox`, `Switch`, `Textarea`, `Select`, `Dialog`, `Popover`, `Menu`, `Tabs`, `Tooltip`,
`Command`, `Calendar`, `Badge`, `Segmented`, `ToggleChip`, `ColorPicker`, `Toast`, `Code`. They
take the props the web ones take, with four conversions that are the same everywhere:

- **`onPress` on a device, `onClick` on the web.** Every pressable in the native set takes
  `onPress`; its compiled web half renders a real `<button>` and takes `onClick`, with the rest of
  the `<button>` props. So a DOM app writes `onClick` on `Button`, `Card`, `ListItem`, `StatTile`,
  `SidebarNavItem` and the rest, and the examples in these files that say `onPress` read as
  `onClick` there. Code shared between the halves has no one name to write; keep the handler and
  pass it under each half's name.
- **`onChangeText`, not `onChange`.** An RN `TextInput` hands you the string, not an event.
  The compiled web `Input` and `Textarea` take both, so a DOM call site written against shadcn
  still compiles — but shared code should use `onChangeText`, the one that exists on device.
- **`onSubmitEditing` and `onEscape`, not `onKeyDown`.** `Input` answers Enter with
  `onSubmitEditing` and Escape with `onEscape` on both halves, which is all an "Add lane" field
  needs: `onEscape={() => { setDraft(""); setAdding(false); }}`.
  For any other key, `onKeyPress` is React Native's, reading `e.nativeEvent.key`; the web half
  fires it from `keydown`, so it hears Escape and the arrows too. Do not drop to a raw
  `TextInput` for a key. `Textarea` takes the same three, with one difference: its
  `onSubmitEditing` is Enter **without Shift**, since Shift+Enter is a new line, and only on the
  web. On a device the return key adds a line and a send button is the way out. A `ref` on either
  gives `focus()`, for putting the caret back after a send.
- **`maxRows` on `Textarea`, not `onContentSizeChange` and a height in state.** With it the box
  grows with its text from `rows` (one line when left out) to `maxRows`, scrolls past that, and
  shrinks again when the text goes. A chat composer is
  `<Textarea rows={1} maxRows={6} onSubmitEditing={send} ref={box} />` on both halves. Without
  `maxRows`, `rows` is a fixed height as before. The rows are counted at the box's own `text-sm`
  line; a `className` that changes the text size changes what a row is.
- **`selection` and `onSelectionChange` on `Textarea`, not a ref and `selectionStart`.** Both
  halves report the caret as `{ start, end }` and hold it when `selection` is passed, which is
  what an `@mention` menu needs: find the word under `selection.start`, insert the name, then set
  `selection` to just after it. Keep `selection` in step from `onSelectionChange`, or it pins the
  caret. `autoFocus` is there too, as on `Input`.
- **No children and no `asChild` on `Button`.** The label is `content`, the icon is `iconSlot`, and a
  button that navigates takes the link as `linkSlot={<Link href="/docs" />}` — see
  [controls/buttons.md](controls/buttons.md#button). `loading` is the state for "pressed, still working".

The web halves go the other way too: `Button`, `Dialog`, `Popover`, `Tooltip`, `Tabs`, `Label`
and `Badge` are a **superset of shadcn's own** there. Every part also takes the props of the radix
part or DOM element it renders, and shadcn's extra parts and sizes exist — `DialogClose`,
`DialogPortal`, `DialogOverlay`, `PopoverAnchor`, `PopoverClose`, `PopoverHeader`, controlled `Tabs`,
`TooltipContent sideOffset`, `Badge asChild`, `size="icon-sm"`. So a shadcn call site compiles
unchanged — except a `Button`'s inside, which is `iconSlot` and `content` rather than children. The new parts and sizes exist on native too; the radix and DOM passthrough props are
web only, and a native call site keeps to the shared contract.

`file-picker` is the one item whose native half does not do the job: it draws the zone and says
so on screen, and `FilePickerButton` draws a disabled button that says so as its hint, because picking a file needs `expo-document-picker` and a permission flow that is
the app's choice. The contract is there, including `multiple`, `read` and `onPickMany`. The
picking is not, and `directory` is web only.
