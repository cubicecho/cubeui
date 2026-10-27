# cubeui layout: Sidebar

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

**Contents**

- [Sidebar](#sidebar)
  - [Folded to a rail of icons](#folded-to-a-rail-of-icons)
  - [On a phone, a bar instead of the rail](#on-a-phone-a-bar-instead-of-the-rail)

## Sidebar

```tsx
<SidebarLayout
  sidebarWidth="auto"
  stackBelow="never"
  divider="none"
  sidebarSlot={
    <Sidebar
      label="Main"
      headerSlot={<Brand />}
      contentSlot={
        <SidebarSection
          as="nav"
          title="Projects"
          actionSlot={<Button variant="outline" size="xs" aria-label="New project" iconSlot={<Plus />} />}
          status={
            <QueryState
              compact
              query={projects}
              what="projects"
              count={rows.length}
              emptySlot={<EmptyState compact title="No projects yet." className="px-2" />}
            />
          }
          contentSlot={rows.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} asChild>
              <SidebarNavItem
                label={p.name}
                iconSlot={<Folder />}
                count={p.open}
                status={p.shared ? { label: "Shared", iconSlot: <Users /> } : undefined}
                active={p.id === current}
              />
            </Link>
          ))}
        />
      }
      footerSlot={
        <>
          <SidebarNavItem href="/settings" label="Settings" iconSlot={<Settings />} />
          <SidebarNavItem label="Sign out" iconSlot={<LogOut />} onPress={signOut} />
        </>
      }
    />
  }
  contentSlot={page}
/>
```

<!-- props:Sidebar -->
`Sidebar`'s props, from the TSDoc in `registry/layout/sidebar.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` (required) | `SlotNode` |  | The body: sections, rows, whatever the rail lists. The only part that scrolls. |
| `headerSlot` | `SlotNode` |  | The brand, a primary action. Stays put while the body scrolls. Absent, no row is drawn. |
| `footerSlot` | `SlotNode` |  | Quiet rows — settings, sign out, the account. Drawn over a hairline. |
| `label` | `string` |  | What the sidebar is called — "Main", "Projects". It names the `<aside>` on the web, which is what tells a screen reader's landmark list one complementary region from another. |
| `side` | `"start" \| "end"` |  | Which edge of the screen the sidebar sits against, which decides the edge its border is on. `start` draws it on the right, facing the content. Inside a `SidebarLayout` it defaults to the layout's `sidebarPosition`, and to `start` anywhere else. |
| `hideBelow` | `keyof typeof HIDE_BELOW` |  | Under this width the sidebar is not drawn at all; from it up, it is. For a rail that has no room on a phone, where the page puts its furniture in a bar of its own instead. Absent, it is drawn at every width. |
| `collapsed` | `boolean` | `false` | Folded down to a rail of icons: every row is its icon, named and tooltipped by its label, and a section's title is read but not drawn. Controlled — the sidebar keeps no state, so where the choice is remembered is the app's. |
| `onCollapsedChange` | `((collapsed: boolean) => void)` |  | Called with the state the reader asked for, by a `SidebarCollapseButton` anywhere inside. Left out, that button does nothing. |
| `contentRef` | `HeaderContentFooterProps["contentRef"]` |  | The scrolling body, for restoring a scroll position — see `HeaderContentFooter`. |
| `className` | `string` |  | On the root. A different width is a `w-*` here. |
| `headerClassName` | `string` |  |  |
| `contentClassName` | `string` |  |  |
| `footerClassName` | `string` |  |  |
<!-- /props -->

<!-- props:SidebarSection -->
`SidebarSection`'s props, from the TSDoc in `registry/layout/sidebar.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `as` | `"nav"` |  | `nav` makes the section a navigation landmark — `<nav>` on the web, `role="navigation"` on device — so a screen reader's landmark jump reaches its rows. For the sections that are the app's navigation; a list of recent items or pinned searches stays out of it. |
| `label` | `string` |  | What the landmark is called — "Main", "Projects". Absent, the `title` names it; give one when there is no title, or when two navigation sections would otherwise share a name. |
| `title` | `ReactNode` |  | The overline over the rows. A short noun — "Projects", "Pinned". |
| `contentSlot` | `SlotNode` |  | The rows, as an array — `projects.map(…)`, each with its `key`. Each one becomes an item of the list, so pass the rows themselves rather than a fragment or a wrapper around them: a wrapper would be one item holding every row. |
| `status` | `ReactNode` |  | What the section says instead of rows, or before them: failed, loading, empty. Drawn between the title and the list, so it is the place for a `<QueryState compact … />`, which renders nothing once there are rows. |
| `actionSlot` | `SlotNode` |  | The title row's far end: an add button, a filter. |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | The title's heading rank. `2` by default — the sidebar sits beside the page, not under its `h1`. Pick it by structure, never by size; the text is the same at every level. |
| `className` | `string` |  |  |
| `contentClassName` | `string` |  | On the list the rows are items of. |
<!-- /props -->

<!-- props:SidebarNavItem -->
`SidebarNavItem`'s props, from the TSDoc in `registry/layout/sidebar.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the row is called. Truncated to one line, never wrapped. |
| `iconSlot` | `SlotNode` |  | Before the label. Pass a bare `<Folder />`; the row sizes and colours it. |
| `count` | `number \| string` |  | At the far end: how many things are behind the row. |
| `status` | `SidebarNavItemStatus` |  | What state the row's thing is in — "MCP on", "offline", "draft" — drawn before the `count`. `label` is required because it is what is read: the row's name becomes "Work, MCP on, 2". With an `iconSlot` the icon is what is seen and the label is read only; without one the label is drawn, small and muted. `SidebarSection`'s `status` is the same word for the section's own state. |
| `className` | `string` |  |  |
| `href` | `string` |  | Where the row goes. The `<a href>` on the web. |
| `active` | `boolean` | `false` | The row for the page on screen — filled, and `aria-current="page"`. |
<!-- /props -->

`@cubeui/sidebar` is the navigation column itself, where `SidebarLayout` is only where it sits.
Three parts, and only `Sidebar` is required (a fourth, `BarNavItem`, is the row drawn for the bar
that replaces the rail on a phone, and a fifth, `SidebarCollapseButton`, folds the sidebar to a
rail of icons — both below):

- **`Sidebar`** — the frame: `headerSlot`, a `contentSlot` that scrolls, `footerSlot`, on the page's
  own `bg-background` at a fixed `w-64`, set apart by a `border-foreground/10` rule on the edge
  facing the page, as a top bar is (`side="end"` moves it; `SidebarLayout` passes its own side). It is a `StickyHeaderContentFooter` inside, so it needs a height from above, like any
  sticky chassis. `label` names it — an `<aside>` on the web, a complementary landmark. Put it in a
  `SidebarLayout` with `sidebarWidth="auto"`, and `divider="none"` because it draws its own rule; a
  different width is one `w-*` in `className`. `sidebarHideBelow` on the layout removes it
  under a width and draws a bar in its place (see below).
- **`SidebarSection`** — an overline `title` over a real list: `role="list"` and one
  `role="listitem"` per row, named by the title. Pass the rows as an **array** (`rows.map(…)`,
  keyed); each element becomes one item, so a fragment or a wrapper around them is one item
  holding everything. `status` sits between the title and the list and is where a
  `<QueryState compact …/>` goes; no list is drawn while there are no rows. `level` is the
  title's heading rank, 2 by default. **`as="nav"` makes the section a navigation landmark** — a
  `<nav>` on the web, `role="navigation"` on device — named by its `title`, or by `label` when it
  has none or two would share one. `Sidebar` is a complementary `<aside>`, so without it the rows
  are in no navigation landmark at all; do not wrap the section in a hand-written
  `<nav aria-label>`. Leave it off the sections that are not navigation — recent items, pinned
  searches — so the landmark holds only the app's own places. `label` without `as="nav"` is a
  type error.
- **`SidebarNavItem`** — the row: `href` (left off when a router link supplies it), `label` (one
  line, truncated), `iconSlot?`, `count?`, `status?`, `active`. It is `role="link"` — an `<a href>` on
  the web — and `active` fills it with `active` and sets `aria-current="page"`. Hover fills it
  with `hover`, so the current page never looks like the row under the pointer. **`status={{ label, iconSlot? }}` marks the row's state** — "MCP on", "offline",
  "draft" — before the count, and the row is named "Work, MCP on, 2": clipped text inside the row
  on the web, part of its `accessibilityLabel` on device. With an `iconSlot` the icon is what is seen
  and is decorative; without one the label is drawn, small and muted. Do not put a status in the
  leading `iconSlot` or hand-write the row's `aria-label` to say it — a caller's `aria-label` replaces
  the whole name the row builds. **With `onPress` and no `href` it is a button** — `onClick` on the web, and no
  `active`: `role="button"`, a `<button type="button">` on the web, never `aria-current`, drawn
  exactly like the links beside it. That is the footer's Sign out; do not hand-draw it with a
  `Pressable` and copied classes. The props are a union, so `active` on a button is a type error.

**Routing is the app's.** The row names no router. Wrap it in your router's link and **leave
`href` off the row** — the router supplies it, so the destination is written once:

```tsx
<Link href="/settings" asChild>                 {/* expo-router */}
  <SidebarNavItem label="Settings" active={isSettings} />
</Link>

const SidebarLink = createLink(SidebarNavItem); // TanStack Router
<SidebarLink to="/settings" label="Settings" active={isSettings} />
```

Both render the row with the `href` they built and their own press handler, so it is still a
real `<a href>` that middle-click and "copy link" read; the row forwards its ref and every prop it
does not name. Passing `href` beside `to` is the same place written twice, and the two drift. A
router that hands out only a click handler — react-router's `useLinkClickHandler` — passes it as
`onClick` beside the row's own `href`. With no router at all, the `<a href>` still navigates.
`active` is yours to compute from the current route. A row with no `href`, no `onPress` and no
router around it goes nowhere and does nothing — it is drawn as an inert button.

Do not pass an icon a size or a colour: the row sizes it to `size-4` and colours it with the label.
A row in the footer takes no `SidebarSection` — a list item with no list around it is invalid.

### Folded to a rail of icons

```tsx
const [collapsed, setCollapsed] = useState(false); // or wherever the app remembers it

<Sidebar
  label="Main"
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
  headerSlot={<Brand />}
  contentSlot={sections}
  footerSlot={
    <>
      <SidebarNavItem href="/settings" label="Settings" iconSlot={<Settings />} />
      <SidebarCollapseButton />
    </>
  }
/>

function Brand() {
  const { collapsed } = useSidebar();
  return collapsed ? <Mark /> : <Wordmark />;
}
```

- **`collapsed` and `onCollapsedChange` are on `Sidebar`**, not on `SidebarLayout`: a layout only
  places panes. With `sidebarWidth="auto"` the pane follows the sidebar from `w-64` to `w-14`
  with nothing passed to the layout. It is controlled and keeps no state; store the choice where
  the app stores preferences.
- **The rows and sections fold themselves.** Do not pass them anything and do not branch on the
  state to draw a second set of rows. A `SidebarNavItem` becomes its icon, with its label as the
  accessible name and a tooltip, its `count` a badge on the icon and its `status` a dot — all
  three still in the name. Give every row in a sidebar that folds an `iconSlot`; one without is
  drawn as its first letter. A `SidebarSection` keeps its `title` for screen readers and draws
  neither it, its `actionSlot` nor its `status`.
- **`SidebarCollapseButton`** is the fold button, drawn as a row: put it in `footerSlot` or
  `headerSlot`. It calls `onCollapsedChange` with the other state and carries `aria-expanded`.
  `collapseLabel` and `expandLabel` rename it. Do not hand-draw a toggle.
- **`useSidebar()`** returns `{ collapsed, onCollapsedChange, side }` to anything inside the
  sidebar — for a header or footer that is a different thing folded: a brand that becomes a
  mark, a "New chat" button that becomes an icon button. Outside a `Sidebar` it says
  `collapsed: false`.
- This is not `SplitLayout`'s collapsed pane, which is an absent one: a folded sidebar still shows
  every destination. And it is not `sidebarHideBelow`, which still swaps the rail for a bar on a
  phone, folded or not.

### On a phone, a bar instead of the rail

A rail does not stack; under a narrow width it goes, and a bar over the page stands in for it.
That is `SidebarLayout`'s `sidebarHideBelow`, and the bar is four slots:

```tsx
<SidebarLayout
  className="h-svh"
  sidebarPosition="start"
  sidebarWidth="auto"
  divider="none"
  sidebarHideBelow="md"
  sidebarSlot={<Sidebar label="Main" headerSlot={<Brand />} contentSlot={nav} footerSlot={<Settings />} />}
  brandSlot={<Brand />}
  navSlot={NAV_ITEMS.map(({ to, label, icon: Icon, count }) => (
    <BarLink key={to} to={to} label={label} iconSlot={<Icon />} count={count} active={isActive(to)} />
  ))}
  navLabel="Main"
  status={`${running}/${servers} servers running`}
  actionSlot={<><LockButton /><ThemeToggle /></>}
  contentSlot={<main className="min-h-0 flex-1 overflow-auto">{page}</main>}
/>

const BarLink = createLink(BarNavItem);         // beside createLink(SidebarNavItem)
```

<!-- props:BarNavItem -->
`BarNavItem`'s props, from the TSDoc in `registry/layout/sidebar.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the place is called. Nothing draws it, so it is the link's accessible name — an icon with no name is announced as "link" — and the tooltip a pointer or a long press brings up. |
| `iconSlot` (required) | `SlotNode` |  | The whole of what is drawn. Pass a bare `<Folder />`; the item sizes and colours it. |
| `href` | `string` |  | Where it goes — the `<a href>` on the web. Left out when a router's link names it: TanStack's `createLink`, or expo-router's `<Link href asChild>`, both of which hand it the `href`. |
| `active` | `boolean` | `false` | The item for the page on screen — filled, and `aria-current="page"`. |
| `count` | `number \| string` |  | How many things are behind the place, as a small badge on the icon's corner and in the name: "Skills, 12". The badge has a corner to fit in, so cap a long one where it is passed — `"99+"`. |
| `status` | `SidebarNavItemStatus` |  | What state the place's thing is in, as a dot on the icon's other corner and in the name: "Servers, 2 failing". The same object `SidebarNavItem` takes, so one array feeds both; the bar has room for neither its words nor its `iconSlot`, so the dot is all that is drawn and the `label` is what is read. |
| `className` | `string` |  |  |
<!-- /props -->

**`BarNavItem` is the bar's link** — `SidebarNavItem` with only the icon drawn, from
`@cubeui/sidebar`. Do not hand-write the bar's links as router `<Link>`s with a class string: that
is the copy this replaces.

- **The same props as the row** — `label`, `iconSlot`, `active`, `count?`, `status?`, `href?` — so the
  app's list of places is one array, mapped once into `SidebarSection` with `SidebarNavItem` and
  once into `navSlot` with `BarNavItem`. A count on a sidebar row is then on the bar too.
- **`label` is required** and nothing draws it: it is the link's accessible name and its tooltip
  (hover or focus on the web, a long press on device). **`iconSlot` is required** too — it is all that
  is drawn. Pass it bare; the item sizes and colours it.
- **`active`** fills it with the `active` colour and sets `aria-current="page"`; hover is grey. Compute it
  from the route, as for the row.
- **`count`** is a small badge on the icon's corner and **`status={{ label }}`** a dot on the other;
  both are in the name the way the row builds it — "Skills, MCP on, 12". The badge has a corner to
  fit in, so pass a long count already capped (`"99+"`). The status's `iconSlot` is not drawn here.
- **It binds to a router as the row does**: `createLink(BarNavItem)`, `<Link href asChild>` around
  it with `href` left off, or `href` with react-router's `useLinkClickHandler` as `onClick`.
- **It is always a link.** A button in the bar is an icon `Button` in `actionSlot`.
- **Size the list to the bar.** Each item is 32px and the `navSlot` neither scrolls nor wraps; a phone
  fits about five beside a brand mark and two actions. An app with more places than that picks the
  ones the bar shows.

**`status` is one line saying what state the app is in** — "3/5 servers running", "128 turns in 9
sessions" — drawn between the `navSlot` and the `actionSlot`, against the action. It takes the width the
rest of the bar leaves and nothing more, so it is the first thing to give way: a string is cut
short with an ellipsis, then gone, before the brand, a place or an action moves. Pass a string
where you can; a node (a `Skeleton` while it loads, a figure in bold) is clipped to the same box
and lays itself out. Do not put the line in `actionSlot` — that slot never shrinks, and a long status
there pushes the buttons off the screen.

- **Under `md`** the sidebar pane is `display: none` — off the screen and out of the accessibility
  tree — and the bar is drawn over `contentSlot`: a `<header>` (the banner) with `brandSlot` at the start,
  `navSlot` inside a `<nav>` named by `navLabel`, `status` after it, and `actionSlot` at the far end. **From `md` up** it is
  the other way round. `sm`, `lg` and `xl` move the switch.
- **One breakpoint, said once.** Leave `Sidebar`'s own `hideBelow` off; the layout hides the rail
  and shows the bar from the same value, so the two cannot disagree. Do not hand-write the
  `md:hidden` header in `contentSlot` — that is the copy this replaces, and its `<nav>` was the one
  that went unnamed.
- **`navSlot` requires `navLabel`**, and the bar's slots require `sidebarHideBelow` — both type errors
  otherwise. `stackBelow` is not taken with it (a rail that hides does not stack) and neither is
  `divider="line"` (with the rail gone the rule would be a line down the edge of the screen);
  `divider="none"` is right for a `Sidebar`, which draws its own border.
- **The bar holds what the rail's header and footer hold** — the brand, the places, the theme and
  sign-out buttons — because on a narrow screen it is the only place they are. Anything that
  should show at every width belongs in the page, not the bar.
- **No state.** Which of the two is drawn is a media query in the stylesheet, so the first paint is
  right and nothing opens or closes. A drawer that slides the rail over the page is a different
  component; this is not it.
- **On device** NativeWind reads the same breakpoint off the window: a phone draws the bar and a
  tablet the rail, which is what `Sidebar`'s `hideBelow` already does there.
- `headerClassName` is on the bar. With no `brandSlot`, `navSlot`, `status` or `actionSlot`,
  `sidebarHideBelow` still hides the rail and draws nothing in its place.
- **`barPosition="bottom"` draws the places along the bottom**, where a phone's thumb is and where
  Android and iOS apps put them. The `navSlot` leaves the top bar for a bar of its own under
  `contentSlot`: that bar is the `<nav>` named by `navLabel`, the same `BarNavItem`s spread evenly
  across it, and each still `aria-current` on its own page. `brandSlot`, `status` and `actionSlot`
  stay in the bar at the top; with none of them, no top bar is drawn. The default is `"top"`, and
  from `sidebarHideBelow` up neither bar is drawn either way.

  ```tsx
  <SidebarLayout
    sidebarHideBelow="md"
    barPosition="bottom"
    brandSlot={<Brand />}
    navSlot={places}
    navLabel="Main"
    actionSlot={<ThemeButton />}
    sidebarSlot={<AppSidebar />}
    contentSlot={<Outlet />}
  />
  ```

  - **The bottom safe-area inset is the app's**, as the top one is; the layout adds no dependency
    to measure insets. For the bar's fill to run under the home indicator, leave `"bottom"` out of
    the app's `react-native-safe-area-context` `<SafeAreaView edges={["top"]}>` and pad the bar by
    the inset through `bottomBarClassName`, which is on the bottom bar itself (its fill, its
    border, its padding):

    ```tsx
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <SidebarLayout barPosition="bottom" bottomBarClassName="pb-safe-offset-2" … />
    </SafeAreaView>
    ```

    `pb-safe-offset-2` is NativeWind's: the inset plus the bar's own 8px. A DOM app (with
    `viewport-fit=cover`) writes `pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`. Keeping
    `"bottom"` in `edges` instead stops the bar above the indicator, with a strip under it in the
    `SafeAreaView`'s fill, not the bar's.
  - **`contentSlot` scrolls between the bars.** Neither bar is fixed or overlaid, so nothing in the
    page is hidden behind one, and the layout needs a height to divide (`h-full`, `flex-1`).
  - **About five places**, as at the top: each item is 32px and the bar neither scrolls nor wraps.
  - **A toast sits above the bar.** The layout tells `@cubeui/toast` it draws one, and under
    `sidebarHideBelow` the stack rises by the bar's height instead of covering the places. Do not
    offset the `ToastProvider` yourself. A bar of your own that does the same calls
    `useReportBottomBar("md")` from `@/lib/bottom-bar` (`"always"` for one at every width).

`Sidebar`'s `hideBelow` (`sm` / `md` / `lg` / `xl`) is the same switch for a sidebar that is not
in a `SidebarLayout`. Do not write `hidden md:flex` in `className` for either: that works only
while the root's own display class happens to merge first.
