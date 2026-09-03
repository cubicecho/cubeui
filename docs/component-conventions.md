# How a cubeui component is formed

Draft. These are the rules the first four layout components were written to; the point of
writing them down now is to argue about them once rather than per component.

## 1. Slots are named props, not children

Every part a component places is a `ReactNode` prop with a name that says where it goes. The one
exception is the body, which is `children` — it is the slot JSX syntax is for, and it is the
slot that grows.

```tsx
<CardLayout title="Vendors" action={<AddButton />} footerActions={<SaveButton />}>
  {rows}
</CardLayout>
```

Not compound components (`<Card><CardHeader>…`), because that is the shadcn primitive underneath
and re-exporting it adds nothing. The shell exists to answer "where does this go" once.

## 2. One vocabulary across the set

`title`, `description`, `icon`, `action`, `footer`, `footerActions`, `empty`, `children`,
`className`, `<slot>ClassName`. A word means the same thing in every component. `action` is
always the header's far end; `footerActions` is always the footer's, and always the buttons.

Adding a word to the vocabulary is a decision about the whole set, not about one component.

## 3. Variants are literal class maps

```tsx
const SIZES = { sm: "sm:max-w-sm", md: "sm:max-w-lg" } as const;
```

Never `` `sm:max-w-${size}` ``. Tailwind's scanner reads source text, so a composed class name is
one that is never generated. Where the template itself has to be dynamic, put the value on a CSS
custom property and let the class read `var(--…)`.

## 4. Floors on every flex and grid cell

`min-h-0` and `min-w-0` on any cell that holds content of unknown width. A cell's floor is its
content, so one table or one long unbroken string grows the track and pushes its neighbour off
the screen instead of scrolling inside itself. Nested scrolling does not work at all without it.

## 5. An absent slot draws nothing

No empty wrapper `<div>`s. An empty slot in a gapped container spends the gap; an empty slot in a
fixed grid-row chassis pushes the body into the wrong row. Conditionally render, and prefer flex
over fixed grid tracks where slots are optional.

## 6. `data-slot` on every part

Matching shadcn's own convention, so a consumer can reach a part from the outside
(`has-data-[slot=hcf-footer]:…`) without a `className` prop for every corner.

## 7. One chassis, several dressed shells

`HeaderContentFooter` is the only place "chrome that stays, a middle that moves, floors that let
it" is written. `DialogLayout` composes it; a card that scrolls its body will too. A shell that
needs that shape and reimplements it is the bug this set exists to stop — it is how the seven
dialogs in kanban ended up with seven `max-h-[85vh] overflow-y-auto`, six of which scroll the
title off the screen.

The corollary is that a shell overrides as little of its primitive as it can. `DialogLayout`
changes `display` and `overflow` on `DialogContent` and leaves the padding alone, because the
padding is style-specific (`p-6` in new-york, `p-4` in radix-nova, whose footer bleeds to the
edge with a matching negative margin) and a shell that sets its own only fits one style.

## 8. Shells hold no state and no data

No fetching, no form state, no toasts, no router. A shell takes nodes and places them. Behaviour
that needs state (ask-before-discard, disable-until-valid) belongs to a form component or the
caller. This is what keeps a component installable into any project in the registry.

Controlled/uncontrolled is the one exception, and it is delegated: pass `open`/`onOpenChange`
straight through to Radix and let `undefined` mean uncontrolled. No mirrored state.

## 9. Props carry a comment saying why, not what

`/** The footer's end. The buttons. Given alone, the footer is simply right-aligned. */` — the
second sentence is the one that earns its place.

## 10. Imports are `cn`, shadcn primitives, react, lucide, and other cubeui items

Anything else is a dependency a consuming project has to be told about. `registryDependencies`
covers both the shadcn primitives and other items in this registry; `dependencies` covers npm
packages; a fourth category means the component is doing too much.

## Open questions

1. **`children` vs `content` for the body.** The Ultrathin layouts name every slot, including the
   body (`content={…}`), which reads symmetrically at a call site where all three come from
   variables. These drafts use `children`. One or the other, everywhere.
2. ~~`HeaderContentFooter` and `StickyHeaderContentFooter` are one component.~~ **Settled:** one
   file, two exports. `StickyHeaderContentFooter` is a preset that adds `h-full`, which is a
   *page* concern — it needs a height to divide. Anything already inside a sized box (the
   dialog) composes the base with `scroll` instead.
3. **Deferred `CardLayout` props**: `media` (an image or chart above the header), `onClick` /
   `selected` (a card in a picker grid), `loading` (skeleton). Each is real in the source apps.
   In or out of the shell?
4. **Where installed files land, and how items import each other.** No `target` set, so items go
   flat into the consumer's components alias (`src/components/card-layout.tsx`). A `target` could
   group them under `components/layout/`, at the cost of assuming the consumer's tree. This also
   decides the import form inside registry sources: `DialogLayout` currently reaches its chassis
   as `@/components/header-content-footer`, which only resolves if the consumer's alias matches
   ours. The official template writes `@/registry/<style>/...` and lets the CLI rewrite it
   against the target project's aliases — the portable form, and it fixes the source tree to
   `registry/<style>/`.
5. **Namespace.** `@cubeui/card-layout` as the registry alias, served from where?
