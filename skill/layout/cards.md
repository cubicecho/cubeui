# Cards, sections and disclosures

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Cards

```tsx
<CardLayout
  title="Categories"
  description="Deleting a category keeps its activities — they go back to uncategorized."
  actionSlot={<Button size="sm" variant="info" content="Add" />}
  loading={isPending}
  contentSlot={categories.map((category) => (
    <CategoryRow key={category.id} category={category} />
  ))}
  emptySlot={<EmptyState compact title="No categories yet." />}
  footerActionsSlot={<Button variant="positive" onClick={save} content="Save" />}
/>
```

`emptySlot` replaces the body when `contentSlot` is empty — which is what `items.map(…)` returns for
empty data, so write the `map` plainly and let the shell handle the nothing case. Do not write
`{items.length === 0 ? <Empty /> : items.map(…)}`.

Empty means no element (`[]`, `null`, `false`), or a `List` with no rows —
`contentSlot={<List contentSlot={items.map(…)} />}` reaches `emptySlot` too, on both halves. Any
other element is drawn as it is, even one that renders nothing, so a body wrapped in a `View` or a
component of your own decides the empty case itself.

What goes in `emptySlot` inside a card is one muted line, `<EmptyState compact … />` — see
[Empty states](lists.md#empty-states) — not a hand-written `<p className="text-sm text-foreground/60">`.

`loading` replaces it with a skeleton and outranks `emptySlot`, so a card that is still fetching does
not first announce that it is empty. Pass the query's pending flag straight in; do not write
`{isPending ? <Skeleton /> : …}`. A caller that wants its own placeholder passes that as
`contentSlot` and leaves `loading` off.

A card with no `title`, `description` or `actionSlot` draws no header, and its body starts 16px
down from the card's top edge like its other three sides. Do not add `contentClassName="pt-4"`.

A card in the page pads `p-4`: `Card`, `CardLayout`, `Section surface="card"` and `StatTile` share
that one inset. A dialog keeps `p-6`, because it is the only thing on the screen. Do not pass
`className="p-6"` to make a card match a dialog. Neither draws a shadow in the page's flow: only a
thing that floats does.

`level` is which heading the title is, `1 | 2 | 3`, and it defaults to 3 — right for a card on a
page that already has a title. When the card **is** the page — a sign-in, a token gate, a lone
settings panel with nothing above it — pass `level={1}`, so the page's only heading is its `<h1>`.
The title is the same size at every level; the rank says where the card sits, not how it looks.
`CardTitle` takes the same `level` if you are composing `Card` by hand.

The title is `text-base` on both halves, never larger than the page's own title.
`titleClassName` is on the title itself, for the card that wants another size or a `line-through`.

`descriptionPlacement="popover"` takes the description out from under the title and puts it behind
a small button after the title, named "About <title>" — for a page of cards whose descriptions
are each a paragraph. `descriptionIconSlot` is the button's glyph, a question mark by default. On
the web a screen reader still reads the sentence under the title. It stays inline on a card with
no `title`, and on a card with no body and no footer, where the description is all the card says —
so pass the prop on every card of a page and leave that case alone. `Section`, `SettingRow` and the
form fields take the same two props. Do not wrap the title in a `Popover` of your own.

The header `actionSlot` **is in the header's flow, and wraps**. It sits at the far end, level with the
title, while the title has room beside it; the title truncates short of it rather than running
underneath; and when the card is too narrow for both, the action goes on a line of its own under
the title. One control or a fragment of them — `actionSlot={<><ViewToggle /><Button content="Save" /></>}`
is laid out as a row. So a long title with two controls is still a `CardLayout`: do not switch to
`Section surface="card"` to get a header that holds both, and do not compose `Card` by hand with
`CardAction`, which is absolute and reserves no room.

The `footerActionsSlot` row **wraps when the card is narrow**: three buttons in a phone-width card
put the last one on a second line, still against the right edge, rather than running the first
out past the card's left edge. `CenteredLayout` and `DialogLayout` draw the same row. Do not
reach into it with `footerClassName="[&>div]:flex-wrap …"`, and do not wrap the buttons in a
`<div>` of your own to get it.

## Sections

A heading over a group of fields or rows, inside a page or a card.

```tsx
<Section
  title="Danger zone"
  description="These cannot be undone."
  contentSlot={<ConfirmButton content="Delete project" … />}
/>
```

- One source for both platforms: the same item is `@cubeui/section` in `/r/web` and `/r/native`.
- The title is a heading of rank `level`, **2 by default**: `PageHeader` owns the `h1`, so a
  section on a page is the one below it. Nested in another section, or in a dialog whose title is
  the `h2`, pass `level={3}`. Choose it by where the section sits, never by how big the text should
  look — the text is the same size at every level. On the web it is `role="heading"` +
  `aria-level` rather than an `<hN>` element (same heading to a screen reader; style it by
  `data-slot="section-title"`, not by `h2`).
- The root is a `<section>` on the web, named by its title, so a titled section is a `region`
  landmark. There is nothing to add for that — do not wrap it in another `role="region"`.
- The title is a small uppercase overline in full `foreground`, so it leads the muted, larger
  description under it by ink and weight rather than size.
- It draws **no surface** by default. `surface="card"` puts the whole group on a card (border,
  background, `p-4`) drawn from `Card`'s own classes, so the item installs `@cubeui/card` — use that
  instead of wrapping it in a `Card` yourself. `CardLayout` is still
  the component for a card with a header and footer of its own.
- `divider` adds a hairline under the heading. Off by default.
- `descriptionPlacement="popover"` puts the description behind a small button beside the title,
  named "About <title>", with `descriptionIconSlot` for its glyph. The heading keeps its name and
  rank, and on the web the region is still described by the sentence. A section with no `title`
  keeps its description inline.
- The heading row **wraps**. An `actionSlot` sits at the far end while the title and description have
  room beside it, and drops under them — at the start, as `SettingRow`'s does — when they do not.
  So a toolbar is an `actionSlot` even on a phone: pass the buttons as a fragment and they are rowed
  and wrap inside the section. Do not move a wide toolbar into the top of `contentSlot` to keep the
  description readable, and do not wrap it in a `flex flex-wrap` `<div>` of your own.
- It is the smallest thing in the registry and it exists because three projects wrote
  `text-xs font-semibold uppercase` plus a muted foreground from memory, and each got the sixth
  token different (`tracking-wider`, `tracking-wide`, `border-b pb-1`). A shared token has no
  answer for that, because the value being retyped *is* a class list.

## Disclosure

A part of a page whose body shows and hides — "Show completed (3)" under a list, "Raw output"
over a payload nobody reads in passing. Use it instead of a `<details>`, which has no React Native
counterpart, and instead of a chevron `<button>` or a `Button` with a `useState` beside it.

```tsx
<Disclosure
  title="Raw output"
  actionSlot={<Button size="sm" variant="outline" onPress={copy} content="Copy" />}
  contentSlot={<CodeBlock content={json} />}
/>

<Disclosure
  title={`${showCompleted ? "Hide" : "Show"} completed (${completed.length})`}
  open={showCompleted}
  onOpenChange={setShowCompleted}
  contentSlot={completed.map((todo) => <TodoRow key={todo.id} todo={todo} />)}
/>
```

- One source for both platforms: `@cubeui/disclosure` in `/r` and `/r/native`.
- The **whole header is one button** with a chevron that turns, so it is reached by Tab and
  toggled by Enter and Space. `aria-expanded` is on it, and on the web `aria-controls` names the
  body while the body is there.
- **`actionSlot` sits beside the button, not inside it**, so pressing it does not toggle the section.
  Do not put a control in `title`.
- `contentSlot` is **not mounted while shut** — a long list behind it costs nothing, and anything that
  must survive closing (a draft, a scroll position) belongs to the caller.
- Uncontrolled by default, shut: pass `defaultOpen` to start open. Pass `open` and `onOpenChange`
  when the caller needs the state — a title that says Hide once open, a deep link, a "show the
  failure" button elsewhere on the page. `onOpenChange` alone listens without taking over.
- The look is compact: a muted `text-sm` title after the chevron, `description` a smaller line
  under it, the body underneath with no inset. `titleClassName="text-foreground"` when the
  disclosure is the heading of its part of the page; `contentClassName` to indent the body.
  An element as `title` or `description` is placed as it is and styles itself.
- A row in a list that opens onto its detail is `DisclosureRow`, which adds the row's `badgesSlot`,
  `meta` and surface.
