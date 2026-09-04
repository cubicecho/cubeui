# How a cubeui component is formed

The rules every item in this registry is written to. The point of writing them down is to argue
about them once rather than per component. They started as the rules the first four layout
shells shared; where a later item widened one — the form layer, the controls — the rule below is
the widened version, not the original.

## 1. Every slot is a named prop, including the body

Every part a component places is a `ReactNode` prop with a name that says where it goes, and the
body is not an exception: it is `content`, never `children`. No cubeui shell takes children.

```tsx
<CardLayout
  title="Workspaces"
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

A word means the same thing in every component, and adding one is a decision about the whole set
rather than about the component that wanted it. The vocabulary is layered: the core words are in
everything that has the part, and each layer below adds only what its shape actually needs.

**Core — every shell.**

| Word | Means |
| --- | --- |
| `content` | The body. The one slot that grows, and the one that scrolls. |
| `title` | What the thing is called. |
| `description` | One line, sentence case, on what it is for. |
| `icon` | Before the title. A bare `<Plus />`; the shell sizes and colours it. |
| `action` | The **header's** far end. One control, or a fragment of them. |
| `footer` | The footer's start. Prose, a timestamp, a destructive action held apart. |
| `footerActions` | The footer's end. The buttons, reading order, primary last. |
| `empty` | What the body says when `content` is empty. Not a slot the caller places. |
| `loading` | A boolean. The shell substitutes a skeleton for the part the request fills. |
| `className` | The root. Every other slot is `<slot>ClassName`. |

`loading` keeps its meaning while changing its target, and the target is always *the part that
came from the request*: on `CardLayout` the body, on `PageHeader` and `PageLayout` the title, on
`FormField` the control. It outranks whatever it competes with — `empty` on a card, `error` on a
field — because data that has not arrived is not data that came back empty or wrong.

**Page and split shells add:**

| Word | Means |
| --- | --- |
| `breadcrumbs` | The line above the title. A trail, or a back link. Nodes, never a route. |
| `headerContent` | The row under the title: search, filters, tabs. `PageHeader` calls it `content`, because it has no body of its own. |
| `sidebar` | The second surface in a split. `content` stays the main one. |
| `sidebarPosition`, `sidebarWidth`, `sidebarClassName` | The sidebar's, by prefix. |
| `width` | `page` / `prose` / `full` — the column, not a number. |
| `level` | Not a slot: `1 \| 2 \| 3`, which heading element the title is. |
| `trigger` | What opens a dialog, when the dialog owns its own open state. |

**Form components add:**

| Word | Means |
| --- | --- |
| `control` | The field's body — the one body in the set that is not `content`. |
| `label` | What the control is called. A real `<label htmlFor>`. |
| `error` | What is wrong with the value. Falsy draws nothing. |
| `required` | The asterisk, and `aria-required`. |
| `orientation` | `vertical` (default) or `horizontal`. |
| `asGroup` | The label names a group of controls rather than one. |

**Controls add:**

| Word | Means |
| --- | --- |
| `label` | On `ActionButton` and `ConfirmButton`, the required accessible name — not a caption. |
| `hint` | Why the control is unavailable, or what it will do. Read after the name. |
| `value`, `onValueChange` | Every control that holds a value, so a control is swappable for another. |

Three notes on why the layering is where it is:

- **`control` is the one exception to "the body is `content`",** and it earns it: it is the only
  body in the set the shell *wires* rather than places. Everything else that renders a body
  renders it untouched.
- **`label` means two different things,** and that is deliberate. On a field it is visible text
  pointed at a control; on an icon button it is the accessible name of a control with no visible
  text. Both answer "what is this control called", which is the test the vocabulary applies.
- **A prefix binds a word to a slot.** `sidebarWidth` is the sidebar's width and `contentClassName` is
  the body's class, so a new prop belonging to an existing slot needs no new word at all.

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
(`has-data-[slot=header-content-footer-footer]:…`) without a `className` prop for every corner.

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

**A control is not a shell, and this rule is about shells.** `ColorPicker` holds a half-typed hex,
`PasswordInput` holds whether the value is showing, `MultiSelect` holds its search term — and each
of those is state that belongs to the widget, not to the screen. The line is whether the state
outlives the interaction: a draft the control throws away on blur is the control's, and a value
anything else in the app can read is the caller's. The value itself is always `value` and
`onValueChange`, never held inside; the two never mirror.

The form binding is the same line seen from the other side. `FormField` takes `error` as a node
and asks nothing about where it came from, which is what lets it be installed into a project with
no form library at all; `app-form.tsx` is the one file that knows about TanStack. A component
that needs the form store goes there, and one that only needs to be told goes below it.

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

6. **What a slot is *for*, and what fills it.** Open, and the thing to nail down next.

   The working assumption is that consuming apps run GraphQL, and that the reason slots take
   nodes rather than data is so the node itself can own a query. A slot holds a component; that
   component holds its own loading and error state; the layout places it and knows nothing about
   any of it. Layouts nest, so a page runs several queries at once and each region fills in as
   its own request comes back, rather than the page holding one `isLoading` over all of them.

   The composition that follows:

   ```tsx
   function MyComponent(props) { … }        // owns a query, or takes the data
   function MyOtherComponent(props) { … }

   function MyPage() {
     // queries / loaders here
     return (
       <MyLayout
         header="Some title"
         content={
           <SomeNestedLayout
             leftSide={<MyComponent {...dataFromQuery} />}
             rightSide={<MyOtherComponent {...dataFromQuery2} />}
           />
         }
       />
     );
   }
   ```

   This is consistent with rule 8 and with every `loading` prop already shipped — a shell's
   `loading` is for the part *the shell itself* would have drawn (a title, a control), never for
   the caller's data, which is why `SidebarLayout` has no `loading` at all. What is *not* settled is
   the naming that falls out of it: whether a two-surface slot pair is `content`/`sidebar` or
   `leftSide`/`rightSide`, when a region deserves a layout of its own versus a component, and
   how deep nesting is expected to go before a page should be split by route instead. Tracked in
   [#1](https://github.com/cubicecho/cubeui/issues/1); do not add a component whose slot names
   depend on the answer until it is settled.
