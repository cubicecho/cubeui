# Icons

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Icons

Import icons from `@/components/ui/icons` (`@cubeui/icons`), not from `lucide-react` or
`lucide-react-native` directly. It is the same lucide names on both halves: a plain re-export on
the web, where an `<svg>` takes `currentColor` from its container, and styled wrappers on native,
where nothing inherits and a container like `Button` publishes its text colour for the icons
below it. A component that takes an icon as a prop types it as `IconComponent`.

The set, on both halves — check it before wrapping a glyph in the app:

- **Arrows and chevrons:** `ArrowLeft`, `ArrowRight`, `ChevronDown`, `ChevronLeft`,
  `ChevronRight`, `ChevronUp`, `ChevronsUpDown`, `ArrowDownWideNarrow` (a sort menu's trigger)
- **Actions:** `Plus`, `Pencil`, `Trash2`, `Copy`, `Download`, `Upload`, `RefreshCw`, `Undo2`,
  `Search`, `Settings`, `Ellipsis` (a ⋯ menu's trigger), `X`
- **Status:** `Check`, `CircleCheck`, `CircleAlert`, `TriangleAlert`, `Info`, `CircleQuestionMark`
  (the button a folded description sits behind), `LoaderCircle`
- **Files and labels:** `File`, `FileText`, `Folder`, `Tag`, `Library`, `FilePen` and `FolderPen` (rename
  or move a file, a folder)
- **Access:** `KeyRound`, `Lock`, `Plug`, `Eye`, `EyeOff`, `UserRound`
- **Time:** `Calendar`, `Clock`
- **Transport and theme:** `Play`, `Pause`, `Square`, `Sun`, `Moon`, `Monitor`

**A glyph the set does not ship is the app's, and that is the settled answer (#251), not a gap
to report.** The set is curated: what the registry's own components draw, plus the glyphs two
apps had each wrapped. Do not open an issue for a glyph one app wants, do not copy the native
wrapper, and do not add to `icons.tsx` — the next `shadcn add` of `@cubeui/icons` overwrites it.

- **A DOM app imports it from `lucide-react`**, as it is. There is nothing to wrap: an `<svg>`
  takes `className` and `currentColor` already, and it is an `IconComponent` as it stands.
- **An Expo app wraps it with the exported `icon`, one line per glyph.** The line is not
  ceremony: off the web nothing inherits a colour and lucide's component does not take
  `className`, so a glyph imported straight from `lucide-react-native` ignores `size-4` and stays
  black inside a destructive `Button`.

For the Expo app, write the app's own pair of files, one line per glyph, beside each other so Metro
picks the `.web.tsx` on web the same way it does for `icons`:

```tsx
// components/app-icons.tsx — native: the per-icon path, since Metro does not tree-shake
import ArchiveSource from "lucide-react-native/icons/archive";
import { icon } from "@/components/ui/icons";

export const Archive = icon(ArchiveSource);
```

```tsx
// components/app-icons.web.tsx — web: the barrel, from lucide-react
import { Archive as ArchiveSource } from "lucide-react";
import { icon } from "@/components/ui/icons";

export const Archive = icon(ArchiveSource);
```

On native `icon` is the same wrapper every icon in the set goes through — `className` sizing, the
`text-foreground` floor and `IconClassContext` — so the app's glyph follows a `Button`'s colour
like the rest. On web it hands the glyph back unchanged, since an `<svg>` already inherits
`currentColor`; it exists so both files read the same. Keep the two files' names in step, as
`icons` does: TypeScript only resolves the native one. `IconProps` is exported beside `icon` for a
component that forwards an icon's props.

The other ways to get there were weighed and left. A barrel regenerated from the names an app
imports is a build step every app has to run and a file `shadcn add` and the script both write. A
lazy `<Icon name>` paints a placeholder first and makes a glyph a string the compiler cannot
check. An item per glyph is 1600 items for one line each. Re-exporting all of lucide on the web
only makes the two halves export different names, which is the one thing `registry:check` holds
them to. Each of them trades the one line above for machinery, and none removes a glyph from a
device bundle that the line would have put there. **A glyph joins the set when a second app has
wrapped it** — that duplication is what the set exists to remove.

A tab can carry an icon too: `<TabsTrigger value="board"><Calendar /> Board</TabsTrigger>`.
The trigger lays its children out in a row, puts only the text in a `<Text>`, and hands the icon
the tab's active or inactive colour on both halves — do not colour it yourself, and do not build a
segmented control to get one.

A dot or a count on a tab goes in `trailingSlot`, the far end of the tab, on both halves:

```tsx
<TabsTrigger
  value="device"
  trailingSlot={<Badge variant="destructive" label="Server error" />}
>
  Device
</TabsTrigger>
```

A `Badge` with no children is a dot, and its `label` becomes part of the tab's name: "Device,
Server error". Do not pass a bare coloured `View` or `<span>`, which a screen reader skips.

Name the tablist when no visible heading does: `<TabsList aria-label="Project view">`, or
`aria-labelledby` pointed at the heading's id (`nativeID` on device). It is on the shared contract, so one call site names
it on both halves; a screen reader announces it on entering the tabs.

A `TabsList` with more tabs than fit scrolls sideways inside its own box and brings the selected
tab into view, at mount and whenever it changes, on both halves. Do not wrap `Tabs` in a
horizontal `ScrollView` to fit a phone: the scroller would be outside the tablist, and a tab
chosen by a link would stay off screen. Tabs that fit are centred in the list as before.

A tab that is a route takes the link as `linkSlot`, as `Button` does: an element with no
children. Do not navigate from `onValueChange` — such a tab has no `href`, so it cannot be
middle-clicked, opened in a new tab or read as a link.

```tsx
<Tabs value={section}>
  <TabsList aria-label="Settings">
    <TabsTrigger value="general" linkSlot={<Link to="/settings" />}>General</TabsTrigger>
    <TabsTrigger value="agents" linkSlot={<Link to="/settings/agents" />}>Agents</TabsTrigger>
  </TabsList>
  <TabsContent value={section}><Outlet /></TabsContent>
</Tabs>
```

- On the web the tab is drawn *as* the link and keeps `role="tab"`, `aria-selected` and the
  tablist's arrow keys. A press follows the link and selects the tab.
- On device the link wraps the tab (expo-router's `Link` takes it `asChild`).
- `value` comes from the route, so the page you are on is the selected tab. Leave
  `onValueChange` off: the route is what changes it. One `TabsContent` whose `value` is the
  current section holds the route's body, so the panel is named by its tab.
- With the list in a page header, see [layout/pages.md](../layout/pages.md#pages) for one root around the
  page.
