# Splits

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Splits

```tsx
<SidebarLayout
  sidebarPosition="start"
  sidebarWidth="sm"
  stackBelow="md"
  divider="line"
  sidebarSlot={<Nav />}
  contentSlot={<StickyHeaderContentFooter headerSlot={<PageHeader title="Servers" />} contentSlot={rows} />}
/>
```

`contentSlot` is the main surface and `sidebarSlot` is the second one. Everything else is where the sidebar
sits, how wide it is, when it stops sitting there, and what is between them.

**`SidebarLayout` is a preset of `SplitLayout`**, which is the same shape with the roles taken out:

```tsx
<SplitLayout
  firstSlot={<Original />}
  secondSlot={<Translation />}
  stackBelow="md"
  firstWidth="two-thirds"
/>
```

Reach for the base when the two panes are genuinely comparable — a diff, two lists abreast, a form
beside its preview. Its slots are numbered because neither alternative stays true: `contentSlot` /
`sidebarSlot` claims a ranking an even split does not have, and `left` / `right` is wrong below
`stackBelow`, where the panes are one above the other, and wrong again right-to-left. `firstSlot` is
first in reading order, wherever reading is going.

Either pane can carry the width — `firstWidth` **or** `secondWidth`, the same scale, never both.
Neither set is an even split. Everything below applies to both, and every prop but the widths and
the slots is spelled the same on each.

- **`sidebarWidth` is a scale, not a number.** `auto` (an icon strip, as wide as its contents),
  `sm` / `md` / `lg` (an inspector, sized by what is in it), and `fifth` / `two-fifths` / `half`
  / `two-thirds` (a second working surface, sized by the window). Pick the nearest one. A width
  that falls between two of them is a call site choosing, not a case for a ninth step — the
  scale exists because the widths it replaced were spelled `w-56`, `w-72 lg:w-80`, `lg:w-52`,
  `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)` and `60%`, with no way to read which of those
  differences were decisions.
- **`stackBelow` is the width under which the two stop sitting side by side and stack instead**
  — `md`, `lg` (the default), `xl`, or `never` to keep them side by side at every width. Stacking is the narrow-width answer: a phone
  has room for one pane after the other even when it has none for two abreast. Do not add
  `hidden md:block` to fight it; a navigation rail that should go rather than stack is
  `sidebarHideBelow` (see [Sidebar](sidebar.md#on-a-phone-a-bar-instead-of-the-rail)).
  Stacked, the split scrolls the two panes as one column — a `ScrollView` on device, a scrolling
  `<div>` on the web — so two `StickyHeaderContentFooter` panes taller than the screen together
  can still be read to the end. Give the split a height (`className="h-full"`, `flex-1`) and it
  keeps it at every width; do not cap it with `lg:h-full` to dodge the overflow.
- **`divider`** is `space` (a gap — two surfaces on a page, the default), `line` (flush, with a
  hairline between them — the app shell), or `none` (flush, nothing drawn). Do not draw the rule
  yourself with a `border-r` on the sidebar: that is a line between the panes only until the layout
  stacks, at which point it is a line down one side of the screen. `line` draws the rule as its
  own element between the panes, so it turns with them.

### The things it deliberately does not do

- **It does not resize.** There is no draggable divider and no `onWidthChange`, because a stored
  width is state and shells hold none. The divider is a rule, not a control: `aria-hidden`, no
  role, no tab stop. A screen that genuinely needs a drag wants shadcn's `resizable`
  (`react-resizable-panels`) — a different component, not a prop on this one.
- **It does not collapse, because it does not have to.** A closed sidebar is
  `sidebarSlot={open ? <Nav /> : undefined}`. With no sidebar it is one full-width column, no cell
  and no rule drawn and no gap spent — which is the same thing an inspector with nothing selected
  needs. The caller already holds the toggle; there is no `collapsed` prop to keep in step with it.
- **It has no `loading`.** A split has two panes that arrive at different times, and one boolean
  across both would either skeleton a navigation column that was never waiting or have to be told which
  pane it meant. Each pane's content owns its own loading state.
- **It is horizontal only.** Two zones stacked in a column, each able to scroll, is
  `HeaderContentFooter`, which already exists. Below `stackBelow` this *is* that arrangement.
- **It does not scroll.** A pane that needs to scroll is a `StickyHeaderContentFooter` passed as
  `contentSlot` or `sidebarSlot` — which is also where the tab stop that a scrolling region owes a keyboard
  user comes from. Do not put `overflow-y-auto` on a pane by hand; without a height above it to
  divide, it will not scroll, and it gives a keyboard user no way in.

### List-and-detail

A split is the right shape when both panes are on the screen together and the selection moves
between them. It is the wrong shape when the detail is a place you *go* — if there is a
`/things/:id` route, keep the route and let the detail be its own page. A `SidebarLayout` that has to
be told to hide a *detail* pane on a phone is that decision arriving late — `sidebarHideBelow` is
for the app's navigation rail, which has a bar to stand in for it.
