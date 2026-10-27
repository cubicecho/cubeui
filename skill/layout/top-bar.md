# Top bar

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Top bar

```tsx
<TopBarLayout
  brandSlot={<Link href="/"><ClockMark /><Text>eunomia</Text></Link>}
  navSlot={views.map((v) => (
    <Link key={v.href} href={v.href} aria-current={v.href === path ? "page" : undefined}>
      {v.label}
    </Link>
  ))}
  actionSlot={<Button variant="outline" size="sm" onPress={signOut} content="Sign out" />}
  contentSlot={<Outlet />}
/>
```

`@cubeui/top-bar-layout` is the app shell for an app with a handful of top-level pages and **no
sidebar**: a bar across the top, the page below it. Three slots in the bar, one under it:

- **`brandSlot`** — the bar's start: the logo and the app's name, usually a link home. It keeps its
  width.
- **`navSlot`** — the primary links, after the brand. Pass the links themselves; the shell draws the
  navigation landmark around them (`<nav>` on the web, `role="navigation"` on device), so do not
  hand-write a `<nav>` inside it. `navLabel` names the landmark — "Main" — when the page has a
  second one to tell it from. Marking the current page (`aria-current`, an active fill) is the
  link's, since only the router knows the route.
- **`actionSlot`** — the bar's far end: account, theme, sign out. The same word as every header's far
  end. It keeps its width and sits at the end whether or not there is a `navSlot`.
- **`contentSlot`** — the page. It is wrapped in the `main` landmark (`<main>` on the web), and the bar
  is the `banner` landmark (`<header>`), so a screen reader's landmark jump reaches the page past
  the chrome. Pass a `PageLayout` here — it carries its own title and column.

**On the web the bar is `sticky top-0` and the document scrolls.** It needs no height from its
ancestors, unlike a `StickyHeaderContentFooter`: the bar sticks to the top of whatever scrolls it —
the window, or a pane you already made scrollable. **On device** there is no sticky, so the shell
divides the height it is given: the bar stays and the page is a `ScrollView`, as in
`StickyHeaderContentFooter`. Give it the screen (`flex-1` on the parent).

**On a narrow screen the links scroll sideways** inside their landmark while the brand and the
actions keep their place, so six links on a phone move rather than wrap the bar to two lines. To
hide them instead below a width and offer a menu, it is one class and a `Menu` in `actionSlot`:
`navClassName="hidden md:flex"` beside `actionSlot={<><Menu …className="md:hidden" /><Account /></>}`.

`width` holds the bar's row to a column — `page` (default), `prose` or `full` for a board that
runs to the window's edge — so the brand lines up with the page under it. The border and fill are
always full-bleed. `headerClassName` is on the bar itself (its fill, its border), `contentClassName`
on the `<main>`.

**The top safe area on device is the app's.** The bar is the top of the screen, and the status bar
covers it unless something insets it; wrap the app in `react-native-safe-area-context`'s
`<SafeAreaView edges={["top"]}>` (Expo ships it). The shell adds no dependency to measure insets.

**Beside `SidebarLayout`.** They are the two app shells: navigation across the top here, down the
side with `Sidebar` in a `SidebarLayout`. Pick by how many places the app has — a handful fit a
bar, a list of projects needs a column. An app with both is a `SidebarLayout`, and the phone-width
bar in its `contentSlot` (the `md:hidden` header above) is still hand-written; `TopBarLayout` is not a
second wrapper around a sidebar.
