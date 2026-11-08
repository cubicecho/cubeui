# cubeui layout

Read [SKILL.md](../SKILL.md) first for the "no children" rule, and
[vocabulary.md](../vocabulary.md) for the slot vocabulary. Neither is repeated here.

**Both halves, one source.** Pages, page shells, page headers, splits, cards, dialogs,
sections, disclosures, sidebars and the app bar are written once in React Native and compiled to
the web, so the same item installs in a Vite app and an Expo app with the same props. So are the
list-page parts ([lists.md](lists.md), [list-rows.md](list-rows.md), [trees-and-tables.md](trees-and-tables.md)) —
`LoadState`, `List`, `CollapsibleRow`, `ListItem` and `FileTree` — with one exception: `Table` is
web-only, and on a device the rows are `ListItem`s. On a device,
four things differ, and none of them changes a call site:

- `HeaderContentFooter`'s body is a `ScrollView` when it scrolls, so `contentRef` is the
  `ScrollView` there (a `<div>` on the web), and `contentClassName` styles its content container.
- An `iconSlot` is not sized for you on a device — there is no `[&_svg]` selector — so pass it at
  `size-4` yourself (`size-5` in a level 1 or 2 `PageHeader`).
- A split's two panes are a flex row, not grid tracks. The widths and `stackBelow` read the same.
- A slot takes elements, not a string or a number: words handed to one come in a `Text` of your
  own, since a bare `"Save"` in a `View` crashes. Only the props that take words (`title`,
  `description`, `label`) are wrapped in a `Text` for you.

**A slot is a flex column, on the web and on a device.** The body slots of `CardLayout`,
`HeaderContentFooter` (and so `PageLayout`), `SplitLayout` and `SidebarLayout`
lay their children out the same way on both halves, so one class list is right for both:

- **`gap-*` on a slot spaces its children**: `contentClassName="gap-4"`, with no `flex flex-col`
  beside it.
- **A child with `flex-1` fills its slot.** Give it `min-h-0 min-w-0` so it can also shrink. No
  `Platform.select` is needed for it.
- **A child is as wide as the slot.** A button handed straight to a slot stretches; wrap it in a
  row, or give it `self-start`, to keep it at its own width.
- **Text and a link beside it go in one paragraph.** Two inline nodes handed to a slot as
  siblings stack, as they do on a device; a `<p>` (a `Text` on a device) around them keeps them
  on a line.

**The layout files.** Each holds one group; [SKILL.md](../SKILL.md)'s choosing table links straight to the section you need.

| File | What is in it |
| --- | --- |
| [pages.md](pages.md) | `PageLayout`, `HeaderContentFooter`, `GridLayout` |
| [page-headers.md](page-headers.md) | `PageHeader` |
| [centered-pages.md](centered-pages.md) | `CenteredCardLayout` |
| [splits.md](splits.md) | `SplitLayout`, `SidebarLayout`, list-and-detail |
| [sidebar.md](sidebar.md) | `Sidebar`, `SidebarSection`, `SidebarItem`, the rail of icons, `SidebarLayout`'s bar and `AppBarItem` |
| [app-bar.md](app-bar.md) | `AppBar`, and the app with no sidebar |
| [cards.md](cards.md) | `CardLayout`, `Section`, `Collapsible` |
| [facts.md](facts.md) | `PropertyList`, `PropertyRow`, `SettingRow`, `StatTile` |
| [dialogs.md](dialogs.md) | `DialogLayout`, the unsaved-changes guard, Cmd/Ctrl+S |
| [lists.md](lists.md) | `LoadState`, `EmptyState`, `ErrorPage` |
| [list-rows.md](list-rows.md) | `List`, `ListItem`, `CollapsibleRow` |
| [trees-and-tables.md](trees-and-tables.md) | `FileTree`, `Table` |

## One heading rhythm

Every block and row with a title lays it out one way, on both halves: `CardLayout` (and `Card`'s
own parts), `Section`, `SettingRow`, `Item` at `size="sm"`, `ListItem`, `CollapsibleRow` and
`Collapsible`.

- The **title** is 14px semibold in full ink, and the **description** 14px in the `/60` grey,
  4px under it. They are the same size: the title leads by weight and ink, so a card of rows
  reads as one type scale. A `meta` line stays 12px.
- The **action** is level with the title's top, never centred on the text, so a second line of
  description does not move it. Two actions are 8px apart, or 4px when every one of them is an
  `icon-xs` button — the shell reads that off their `size`, so pass the buttons straight in, as
  one element or a fragment.
- Beside an action the text keeps **10rem**, or the action goes under it, 8px down: a block's to
  the start of the line, a row's to the far end, clear of its `leadingSlot`.

A block or row of your own takes the same classes from `@/lib/utils` rather than spelling them
again: `HEADING_TITLE`, `HEADING_DESCRIPTION`, `HEADING_GAP`, `HEADING_WRAP_FLOOR`,
`HEADING_WRAP_GAP` and `actionGap(actions)`. `Item`'s `default` size is shadcn's and is not part
of it; nor is `SectionHeading`, which is a small label over a group, not a block's title.

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
`sidebarSlot={open ? <Nav /> : undefined}` is the whole feature, and the caller already holds `open`.
