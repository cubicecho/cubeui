# How a cubeui component is formed

Draft. These are the rules the first four layout components were written to; the point of
writing them down now is to argue about them once rather than per component.

## 1. Every slot is a named prop, including the body

Every part a component places is a `ReactNode` prop with a name that says where it goes, and the
body is not an exception: it is `content`, never `children`. No cubeui shell takes children.

```tsx
<CardLayout
  title="Vendors"
  action={<AddButton />}
  content={rows}
  footerActions={<SaveButton />}
/>
```

**Why the body is not `children`.** In a layout, *all* the parts are dynamic — the header is as
much a slot as the body is, and the footer as much as the header. Handing one of them the
privileged position of `children` says it is the real content and the rest are decoration, which
is exactly backwards for a component whose entire job is placing all of them. Passing them the
same way keeps them equal, keeps the call site a single self-closing element whose props read as
a list of positions, and makes an absent body as visible as an absent header: it is a prop that
is not there, not the absence of a nesting level.

It also removes the two-way question. With `children`, every shell has to decide whether it also
accepts `content`, and every call site has to be read to find out which was used.

Not compound components (`<Card><CardHeader>…`) either, because that is the shadcn primitive
underneath and re-exporting it adds nothing. The shell exists to answer "where does this go" once.

## 2. One vocabulary across the set

`content`, `title`, `description`, `icon`, `action`, `footer`, `footerActions`, `empty`,
`loading`, `className`, `<slot>ClassName`. A word means the same thing in every component. `action` is
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

1. ~~`children` vs `content` for the body.~~ **Settled: `content`, everywhere, and no shell takes
   children.** Every part of a layout is dynamic, not just the body, so no part gets the
   privileged position — see rule 1, which carries the reasoning.
2. ~~`HeaderContentFooter` and `StickyHeaderContentFooter` are one component.~~ **Settled:** one
   file, two exports. `StickyHeaderContentFooter` is a preset that adds `h-full`, which is a
   *page* concern — it needs a height to divide. Anything already inside a sized box (the
   dialog) composes the base with `scroll` instead.
3. ~~Deferred `CardLayout` props.~~ **Settled: `loading` in, `media` and `onClick`/`selected`
   out.**

   `loading` is in because it is the same move `empty` already makes — the shell substituting the
   body for a state the caller would otherwise hand-roll — and because the two interact: `loading`
   outranks `empty`, since data that has not arrived is not data that came back empty. Without
   that ordering in one place, every card re-derives it and some of them flash "nothing here"
   before the rows land. It is `loading?: boolean` with a skeleton the shell owns; a caller
   wanting its own placeholder passes it as `content`.

   `media` and `onClick`/`selected` are out for now. `media` is a slot with no ordering question
   to settle, so it buys a prop and saves nothing. `onClick`/`selected` makes the shell
   interactive — a focus ring, a role, a keyboard target — which is behaviour, and rule 5 keeps
   behaviour with the caller. Revisit either if three call sites in two projects disagree about
   the shape.
4. **Where installed files land, and how items import each other.** *Settled — and verified by
   installing into a scratch project whose aliases deliberately differ from ours.* Registry
   sources use the official template's form, `@/registry/new-york/...`, and the source tree is
   fixed to `registry/new-york/{ui,layout}/` with `components.json` aliases pointing at it. No
   `target` is set on the component items, so they land flat in the consumer's components alias.
   Installing `@cubeui/dialog-layout` into a project aliased `~/* -> ./src/*` produced:

   ```
   src/components/dialog-layout.tsx          import { HeaderContentFooter } from "~/components/header-content-footer";
   src/components/header-content-footer.tsx  import { cn } from "~/lib/utils";
   src/components/ui/dialog.tsx              (pulled in as a registryDependency)
   ```

   So the CLI rewrites both our `@/registry/...` cross-references and `@/lib/utils` against the
   consumer's own aliases, and the transitive `@cubeui/header-content-footer` dependency resolves.
   The `skill` item is the one exception: it sets `target: "~/.claude/skills/cubeui/SKILL.md"`,
   and `~` is the consumer's project root, so it lands at `.claude/skills/cubeui/SKILL.md`.
   Grouping components under `components/layout/` with a `target` stays rejected — it assumes a
   tree shape the consumer never agreed to.
5. ~~Namespace, and where the registry is served from.~~ **Settled:** `@cubeui/<item>` as the
   alias, served as static files from `https://cubeui.cubicecho.dev/r/{name}.json`. Consuming
   projects add one line to `components.json` and need no auth:

   ```json
   "registries": { "@cubeui": "https://cubeui.cubicecho.dev/r/{name}.json" }
   ```

   The host is decided; publishing `public/r` to it from CI is not built yet, so today the URL is
   the agreed target rather than a live one.
