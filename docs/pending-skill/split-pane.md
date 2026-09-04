# Pending SKILL.md section — SplitPane

Fold this into `.claude/skills/cubeui/SKILL.md` after the branch merges. Written in that file's
voice; the pieces are marked with where they go.

---

## Into the `description` in the frontmatter

Add `SplitPane` to the component list, and add "a two-pane screen" to the "Read before building"
clause:

> Read before building a page shell, a card, a dialog, a two-pane screen, or a form with shadcn
> primitives …

---

## Into the "Choosing" table

Two new rows, after the two page-shell rows:

| The shape you are building | Use |
| --- | --- |
| A nav rail or inspector beside a working surface | `SplitPane` |
| A list beside the detail for the selected row | `SplitPane`, or two routes — see below |

---

## Into "The slot vocabulary"

One new word, and it carries a prefix:

- **`rail`** — the second surface in a two-pane split: a nav rail, an inspector, a note list, an
  order panel. `content` is still the main one, so the pair reads the same way it does in every
  other shell. `railSide`, `railWidth` and `railClassName` all belong to it.

---

## New section, after "Page shells"

## Splits

```tsx
<SplitPane
  railSide="start"
  railWidth="sm"
  splitAt="md"
  divider="line"
  rail={<Nav />}
  content={<StickyHeaderContentFooter header={<PageHeader title="Servers" />} content={rows} />}
/>
```

`content` is the main surface and `rail` is the second one. Everything else is where the rail
sits, how wide it is, when it stops sitting there, and what is between them.

- **`railWidth` is a scale, not a number.** `auto` (an icon strip, as wide as its contents),
  `sm` / `md` / `lg` (an inspector, sized by what is in it), and `fifth` / `two-fifths` / `half`
  / `two-thirds` (a second working surface, sized by the window). Pick the nearest rung. A width
  that falls between two of them is a call site choosing, not a case for a ninth rung — the
  scale exists because the widths it replaced were spelled `w-56`, `w-72 lg:w-80`, `lg:w-52`,
  `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)` and `60%`, with no way to read which of those
  differences were decisions.
- **`splitAt` is where the two stop being side by side and start being stacked** — `md`, `lg`
  (the default), `xl`, or `always` to never stack. Stacking is the narrow-width answer: a phone
  has room for one pane after the other even when it has none for two abreast. Do not add
  `hidden md:block` to fight it.
- **`divider`** is `space` (a gap — two surfaces on a page, the default), `line` (flush, with a
  hairline between them — the app shell), or `none` (flush, nothing drawn). Do not draw the rule
  yourself with a `border-r` on the rail: that is a line between the panes only until the layout
  stacks, at which point it is a line down one side of the screen. `line` puts the rule in its
  own track so it turns with the panes.

### The things it deliberately does not do

- **It does not resize.** There is no draggable divider and no `railSize`, because a stored
  width is state and shells hold none. The divider is a rule, not a control: `aria-hidden`, no
  role, no tab stop. A screen that genuinely needs a drag wants shadcn's `resizable`
  (`react-resizable-panels`) — that is a different component, not a prop on this one.
- **It does not collapse, because it does not have to.** A closed sidebar is
  `rail={open ? <Nav /> : undefined}`. With no rail the split is one full-width column, no cell
  and no rule drawn and no gap spent — which is the same thing an inspector with nothing selected
  needs. The caller already holds the toggle; there is no `collapsed` prop to keep in step with it.
- **It has no `loading`.** `CardLayout` has one because a card has a single body and a precedence
  to own. A split has two panes that arrive at different times, and one boolean across both would
  either skeleton a nav rail that was never waiting or have to be told which pane it meant. Each
  pane's content owns its own loading state — and a pane that is a `CardLayout` already has the
  word for it.
- **It is horizontal only.** Two zones stacked in a column with floors between them is
  `HeaderContentFooter`, which already exists. Below `splitAt` this *is* that arrangement.
- **It does not scroll.** A pane that needs to scroll is a `StickyHeaderContentFooter` passed as
  `content` or `rail` — which is also where the tab stop that a scrolling region owes a keyboard
  user comes from. Do not put `overflow-y-auto` on a pane by hand; it will scroll without a floor
  above it and without a way to reach it.

### List-and-detail

A split is the right shape when both panes are on the screen together and the selection moves
between them. It is the wrong shape when the detail is a place you *go* — if there is a
`/things/:id` route, keep the route and let the detail be its own page. Two of the projects here
already made that call, and a `SplitPane` that has to be told to hide one of its panes on a phone
is that decision arriving late.

---

## Into "What does not belong in a shell"

No change needed — the resize decision above is an instance of the rule already stated there, and
is worth one clause in that paragraph if it reads thin:

> … not a prop on the layout. A draggable split divider is the same case: the width it drags is
> state, so it belongs to `react-resizable-panels`, not to `SplitPane`.
