# cubeui layout: App bar

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## App bar

`@cubeui/app-bar` is an app's bar across the top: the brand at the start, the app's places after
it, one line of the app's state, and its actions at the far end. It is the bar `SidebarLayout`
draws in place of the rail on a phone ([sidebar.md](sidebar.md#on-a-phone-a-bar-instead-of-the-rail)),
and the header of an app with no sidebar.

```tsx
<AppBar
  brandSlot={<Link href="/"><ClockMark /><Text>eunomia</Text></Link>}
  navSlot={places.map((p) => (
    <BarLink key={p.to} to={p.to} label={p.label} iconSlot={<p.icon />} active={isActive(p.to)} />
  ))}
  navLabel="Main"
  status={`${running}/${servers} servers running`}
  actionSlot={<Button variant="outline" size="sm" onPress={signOut} content="Sign out" />}
/>
```

<!-- props:AppBar -->
`AppBar`'s props, from the TSDoc in `registry/layout/app-bar.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `navSlot` | `SlotNode` |  | The app's places, usually `AppBarItem`s. Drawn inside a `<nav>` — `role="navigation"` on device — named by `navLabel`, which is the landmark every hand-written bar either forgot or spelled differently. Do not wrap them in one yourself. |
| `navLabel` (required with `navSlot`) | `string` |  | What the bar's navigation landmark is called — "Main". Required with `navSlot`. |
| `brandSlot` | `SlotNode` |  | The bar's start: the app's mark and name, usually a link home. It keeps its width. |
| `status` | `ReactNode` |  | One line saying what state the app is in — "3/5 servers running" — between the `navSlot` and the `actionSlot`. It gets the width the rest of the bar leaves and no more, so on a narrow bar it is the first thing to give way: a string is cut short with an ellipsis, down to nothing, before the brand, a place or an action loses a pixel. A node is clipped to the same box and truncates itself. |
| `actionSlot` | `SlotNode` |  | The bar's far end: the theme switch, account, sign out. It keeps its width. |
| `className` | `string` |  | On the bar itself: its fill, its border, its height. |
| `navClassName` | `string` |  | On the navigation landmark: `hidden md:flex`, with a menu of the places in `actionSlot`. |
<!-- /props -->

- **`brandSlot`** — the bar's start: the logo and the app's name, usually a link home. It keeps its
  width.
- **`navSlot`** — the app's places, after the brand: `AppBarItem`s, or text links. The bar draws the
  navigation landmark around them (`<nav>` on the web, `role="navigation"` on device), so do not
  hand-write a `<nav>` inside it. **`navLabel` is required with it** and names the landmark — "Main".
  Marking the current place (`active`, `aria-current`) is the link's, since only the router knows
  the route.
- **`status`** — one line saying what state the app is in, between the places and the actions. A
  string is cut short with an ellipsis; a node is clipped to the same box.
- **`actionSlot`** — the bar's far end: account, theme, sign out. It keeps its width and sits at the
  end whether or not anything is before it.

**What gives way on a narrow screen, in order.** The `status` line takes only the width left
over, so it shortens first, down to nothing. Then the places scroll sideways inside their
landmark. The brand and the actions never move, so an action is never pushed off a phone's edge
and the bar never wraps to two lines. To hide the places below a width instead, it is one class
and a `Menu` in `actionSlot`: `navClassName="hidden md:flex"` beside
`actionSlot={<><Menu …className="md:hidden" /><Account /></>}`.

`className` is on the bar itself: its fill, its border (a `/10` rule under it by default), its
height.

**The bar is the `banner` landmark** (`<header>` on the web). The page under it is yours to mark
as the `main` landmark, so a screen reader's landmark jump reaches the page past the chrome.

**The top safe area on device is the app's.** The bar is the top of the screen, and the status bar
covers it unless something insets it; wrap the app in `react-native-safe-area-context`'s
`<SafeAreaView edges={["top"]}>` (Expo ships it). The bar adds no dependency to measure insets.

### An app with no sidebar

An app with a handful of top-level pages and no sidebar is a `HeaderContentFooter` with the bar
in its header slot and the page in its body:

```tsx
<HeaderContentFooter
  className="h-full"
  headerSlot={
    <AppBar brandSlot={<Brand />} navSlot={links} navLabel="Main" actionSlot={<Account />} />
  }
  contentSlot={
    <View role="main" className="min-h-0 flex-1">
      <PageLayout title="Rules" contentSlot={rules} />
    </View>
  }
/>
```

- **The page scrolls, not the frame.** A `PageLayout` scrolls its own body under its own title,
  so the frame here leaves `scroll` off and hands the page the height under the bar. Give the
  frame the screen: `h-full` (or `h-svh` at the root of a DOM app), and `flex-1` on its parent on
  device. A body that is not a `PageLayout` — a board, a plain column — takes `scroll` on the frame
  instead.
- **Mark the page `main`**: a `View role="main"` (`<main>` in a DOM app) around it, which is the
  landmark the bar is not.
- **The bar runs the window's width.** Leave the frame's `width` at its default, `full`, and give
  the page its column (`PageLayout`'s `width`).

**Beside `SidebarLayout`.** They are the two app shells: navigation across the top here, down the
side with `Sidebar` in a `SidebarLayout`, which draws this same bar on a phone. Pick by how many
places the app has: a handful fit a bar, a list of projects needs a column.
