# cubeui layout

Read [SKILL.md](../SKILL.md) first — the slot vocabulary and the "no children" rule are there and
are not repeated here.

**Both halves, one source.** Pages, page shells, page headers, splits, cards, dialogs,
sections, disclosures, sidebars and the top bar are written once in React Native and compiled to
the web, so the same item installs in a Vite app and an Expo app with the same props. The
list-page parts ([lists.md](lists.md), [trees-and-tables.md](trees-and-tables.md)) are the exception: `Table` is web-only, and `QueryState` is its own
item on each half; `DisclosureRow`, `ListItem` and `FileTree` are on both, like the shells. On a device,
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
`HeaderContentFooter` (and so `PageLayout`), `SplitLayout`, `SidebarLayout` and `TopBarLayout`
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
| [pages.md](pages.md) | `PageLayout`, `HeaderContentFooter`, `StickyHeaderContentFooter`, `PageHeader`, `CenteredLayout` |
| [splits.md](splits.md) | `SplitLayout`, `SidebarLayout`, list-and-detail |
| [sidebar.md](sidebar.md) | `Sidebar`, `SidebarSection`, `SidebarNavItem`, the rail of icons, `SidebarLayout`'s bar and `BarNavItem` |
| [top-bar.md](top-bar.md) | `TopBarLayout` |
| [cards.md](cards.md) | `CardLayout`, `Section`, `Disclosure` |
| [facts.md](facts.md) | `DescriptionList`, `PropertyRow`, `SettingRow`, `StatTile` |
| [dialogs.md](dialogs.md) | `DialogLayout`, the unsaved-changes guard, Cmd/Ctrl+S |
| [lists.md](lists.md) | `QueryState`, `EmptyState`, `DisclosureRow`, `List`, `ListItem` |
| [trees-and-tables.md](trees-and-tables.md) | `FileTree`, `Table` |

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
