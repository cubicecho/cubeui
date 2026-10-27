# cubeui layout: Cards, sections and disclosures

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

<!-- props:CardLayout -->
`CardLayout`'s props, from the TSDoc in `registry/layout/card-layout.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `SlotNode` |  | The body. |
| `title` | `ReactNode` |  | A string, a heading, whatever names the card. Absent, no header row is drawn. On device it is rendered inside a `Text`, so pass text or inline text nodes. |
| `level` | `1 \| 2 \| 3` | `3` | Which heading the title is, `1 \| 2 \| 3` — 3 by default, a card under a page title. A card that *is* the page (a sign-in, a token gate, a lone settings panel) passes `1`, so the page has an `<h1>`. The title is the same size at every level: pick the rank by where it sits. |
| `description` | `ReactNode` |  | One line on what the card holds, or what changing it costs. |
| `descriptionPlacement` | `DescriptionPlacement` | `"inline"` | Where the description is drawn. `inline` (the default) puts it under the title; `popover` puts it behind a small button after the title, named "About <title>", and on the web a screen reader still reads it under the title. It stays inline on a card with no title, which has nothing to put the button beside, and on a card with no body and no footer, where the description is all the card says. |
| `descriptionIconSlot` | `SlotNode` |  | The `popover` button's glyph. A question mark by default. |
| `iconSlot` | `SlotNode` |  | Sits before the title. On the web it is sized to the text — pass a bare `<Plus />`. On device an icon cannot be sized from outside it, so pass it at the size you want. |
| `actionSlot` | `SlotNode` |  | The header's far end: an add button, a menu, a switch. |
| `emptySlot` | `SlotNode` |  | Shown instead of `contentSlot` when there is nothing in it: no element (`[]`, `null`, `false`), or a `List` with no rows. A body of any other element is drawn as it is, even one that turns out to render nothing — pass `emptySlot` the case, or decide it yourself. |
| `loading` | `boolean` | `false` | Whether the body is still being fetched. On, a skeleton stands in for it and `emptySlot` is not consulted — data that has not arrived is not data that came back empty, and a card that says "no members yet" for half a second before showing four of them is worse than one that waits. |
| `footerSlot` | `SlotNode` |  | The footer's start. A timestamp, a note, a destructive action held away from the rest. Words come in a `<Text>` of the caller's, as in every slot. |
| `footerActionsSlot` | `SlotNode` |  | The footer's end. The buttons. Given alone, the footer is simply right-aligned. |
| `className` | `string` |  |  |
| `headerClassName` | `string` |  |  |
| `titleClassName` | `string` |  | On the title itself: its size, a `line-through`. |
| `contentClassName` | `string` |  |  |
| `footerClassName` | `string` |  |  |
<!-- /props -->

`emptySlot` replaces the body when `contentSlot` is empty — which is what `items.map(…)` returns for
empty data, so write the `map` plainly and let the shell handle the nothing case. Do not write
`{items.length === 0 ? <Empty /> : items.map(…)}`.

Empty means no element (`[]`, `null`, `false`), or a `List` with no rows —
`contentSlot={<List contentSlot={items.map(…)} />}` reaches `emptySlot` too, on both halves. Any
other element is drawn as it is, even one that renders nothing, so a body wrapped in a `View` or a
component of your own decides the empty case itself.

**`false` counts as empty.** The test keeps only elements, so `contentSlot={hasStats && <DescriptionList … />}`
shows `emptySlot` while `hasStats` is false, the same as `[]` or `null`. When `hasStats` is true
the `DescriptionList` is an element and is drawn, even with no rows: only a `List` is looked
inside. So pass the condition that means "nothing to show", not a component that happens to draw
nothing.

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

**A card's status goes in `actionSlot` too.** `CardLayout` has no `badgesSlot` (that word is a
list row's), and does not need one: the header's far end takes any element, a `Badge` as well as
a control, and a fragment of both is laid out as one row with a gap, wrapping as above. Put the
status first and the controls after it, and do not wrap them in a `<div className="flex gap-2">`
of your own: the row already is one.

```tsx
<CardLayout
  title={project.name}
  iconSlot={<Folder />}
  actionSlot={
    <>
      <Badge variant={project.archived ? "default" : "positive"} label={project.archived ? "Archived" : "Active"} />
      <Button size="icon-sm" variant="outline" aria-label="Edit project" iconSlot={<Pencil />} onPress={edit} />
    </>
  }
  …
/>
```

The `footerActionsSlot` row **wraps when the card is narrow**: three buttons in a phone-width card
put the last one on a second line, still against the right edge, rather than running the first
out past the card's left edge. `CenteredLayout` and `DialogLayout` draw the same row. Do not
reach into it with `footerClassName="[&>div]:flex-wrap …"`, and do not wrap the buttons in a
`<div>` of your own to get it.

**`footerSlot` is for one thing.** Its elements are placed straight into the footer, which is a
row (`flex-row items-center`) with no gap: each at its own width, none stretched, a button
included. With `footerActionsSlot` beside it the footer is `justify-between` across *every*
child, so a second `footerSlot` element lands in the middle of the footer rather than beside the
first. Two things that belong together at the start — a "Read only" note and a delete
`ConfirmButton` — go in one row of your own, `<View className="flex-row items-center gap-2">` on
a device and `<div className="flex items-center gap-2">` on the web. That groups them, which the
shell cannot know to do; it is not the wrapping-to-align the slot rule forbids.

**A small muted note has no component of its own.** Words in a slot are a `<Text>` (a `<p>` or
`<span>`) of yours, and secondary text is `text-foreground/60` at `text-sm`, the step every
muted line in the set uses: `footerSlot={<Text className="text-foreground/60 text-sm">Last synced
an hour ago</Text>}`. The rule against a hand-written muted `<p>` is about `emptySlot` alone, where
`<EmptyState compact />` is the component. A *state* rather than a sentence — "Read only",
"Archived" — is a `Badge`, and goes in `actionSlot` with the card's other status.

## Sections

A heading over a group of fields or rows, inside a page or a card.

```tsx
<Section
  title="Danger zone"
  description="These cannot be undone."
  contentSlot={<ConfirmButton content="Delete project" … />}
/>
```

<!-- props:Section -->
`Section`'s props, from the TSDoc in `registry/layout/section.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` | `SlotNode` |  | The body: the fields, the rows, whatever the heading is over. |
| `title` | `ReactNode` |  | The overline. A short noun phrase — "Pomodoro", "Danger zone", "Notifications". |
| `description` | `ReactNode` |  | One line under the title, in sentence case, on what the group is for. |
| `descriptionPlacement` | `DescriptionPlacement` | `"inline"` | Where the description is drawn. `inline` (the default) puts it under the title; `popover` puts it behind a small button beside the title, named "About <title>", and on the web the section is still described by it. A section with no title has nothing to put the button beside, so its description stays inline. |
| `descriptionIconSlot` | `SlotNode` |  | The `popover` button's glyph. A question mark by default. |
| `actionSlot` | `SlotNode` |  | The heading row's far end: an add button, a count, a switch that disables the group. |
| `divider` | `boolean` | `false` | A hairline under the heading. Off by default; on, the group reads as one block. |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | The title's heading rank. `2` by default, because a page's `PageHeader` owns the one `h1` and these are the sections under it. A section nested in a section is `3`; a section in a dialog whose title is the `h2` is `3` as well. Pick it by where the section sits, never by how big the text should look — the text is the same size at every level. |
| `surface` | `"none" \| "card"` | `"none"` | `card` draws the group on a card: the border and background `Card` has, with the padding inside it. `none` (the default) is a label and a gap and nothing else. |
| `className` | `string` |  |  |
| `titleClassName` | `string` |  |  |
| `contentClassName` | `string` |  |  |
<!-- /props -->

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

<!-- props:Disclosure -->
`Disclosure`'s props, from the TSDoc in `registry/layout/disclosure.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | What the button says: "Completed (3)", "Raw output". It is the button's accessible name. A string is drawn as the title; an element is placed as it is and styles itself. |
| `description` | `ReactNode` |  | One line under the title, inside the button, drawn whether open or shut. |
| `actionSlot` | `SlotNode` |  | The header's far end, **outside** the button: a copy button, a count, a clear-all. A control nested in a button is invalid HTML and, in practice, a click that also toggles the section. |
| `contentSlot` | `SlotNode` |  | What opening shows. Not mounted while shut, so a long list behind it costs nothing. |
| `open` | `boolean` |  | Whether it is open, when the caller holds that — a deep link, a "show the failure" button elsewhere, a title that reads "Hide" once open. Leave it out and the disclosure holds its own. |
| `onOpenChange` | `((open: boolean) => void)` |  | Told on every toggle, controlled or not. Given alone, it listens without taking over. |
| `defaultOpen` | `boolean` | `false` | Where an uncontrolled disclosure starts. Shut by default, the way `<details>` is. |
| `className` | `string` |  |  |
| `headerClassName` | `string` |  |  |
| `titleClassName` | `string` |  |  |
| `contentClassName` | `string` |  |  |
<!-- /props -->

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
