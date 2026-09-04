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
| `first`, `second` | The two panes of a `SplitLayout`, as equals. Numbered because a role pair lies about an even split and a side pair lies once the panes stack or the page is read right-to-left. |
| `firstWidth`, `secondWidth` | Which pane carries the width. One or the other, never both. |
| `sidebar` | The second surface in a `SidebarLayout`. `content` stays the main one. |
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

No fetching, no form state, no toasts, no router. A shell takes nodes and places them. This is
what keeps a component installable into any project in the registry.

**The line is who owns the state, not how much the shell does.** State about the shell's own
interaction is the shell's; state about the app's data is the caller's. `ConfirmButton` holds
whether its question is up. `DialogLayout` holds the same thing for `hasUnsavedChanges` — but
*whether* there are unsaved changes is a boolean it is handed, because only the caller knows what
its fields are. A shell that computed dirtiness would be reading the form, and that is the side of
the line this rule is about.

`hasUnsavedChanges` is also the case for putting behaviour in a shell rather than a hook. Three
projects wrote a `FormDialog`; kanban_server wrote the guard as `useDiscardGuard`, and six of its
seven dialogs called it. The seventh wired `onOpenChange` straight into `onClose` and silently
threw away what had been typed. A hook is a thing a caller can forget. **Where a defect class can
be closed by making the behaviour unforgettable, prefer the prop to the hook** — the guard the
caller cannot see is the guard the caller cannot skip.

The shell guards only what it owns. `DialogLayout` reaches Escape, the overlay and the close
button; a Cancel button in `footerActions` calls the caller's own setter and is out of reach. A
prop that closes three of four doors is still worth having, and the fourth is documented rather
than hidden.

Controlled/uncontrolled is delegated where it can be: pass `open`/`onOpenChange` straight through
to Radix and let `undefined` mean uncontrolled. `DialogLayout` is the exception it has to be —
guarding every close path means Radix is always handed an `open`, so an uncontrolled caller's
state lives in the shell instead of the primitive. A caller who passes `open` still owns it, and
still hears every change. The two never mirror.

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

## 11. Names are plain English

No vendor jargon, no house metaphors, no initialisms. A prop and a `data-slot` are both public
API — a consumer reads them without having read the source, and reaches a slot from outside
through `has-data-[slot=…]` (rule 6). `rail` was Material Design's word, `dirty` is Formik's, and
`hcf-` was ours. All three were renamed once noticed, and every rename was breaking.

The test: would someone who has never seen this registry guess what it holds? `sidebar` passes,
`rail` does not. Internal metaphors stay internal — *chassis*, *floors* and *rungs* earn their
keep in AGENTS.md and in source comments, and appear in no prop name.

A bare noun is a slot (rule 1), so a boolean never gets one: `hasUnsavedChanges`, not
`unsavedChanges`.

Words for slots the set does not have yet — a toolbar, a status bar, an aside — get decided when
the component that needs one arrives. Adding a word is a decision about the whole set (rule 2),
not about the component that happened to need it first.

## 12. A component is a domain object; a layout places it

A component names something in the app's domain: a Task, an Invoice, a ServerRow. A layout names
an arrangement and knows nothing about what it is arranging. That is the test for whether
something belongs in this registry at all — **the registry ships layouts and controls, and the
domain objects stay in the app.**

It holds about nine times in ten. `Section` is the smallest layout that is still a layout. The
standing exception is the controls: a `DatePicker` is not a domain object, but it is not placing
anything either — it is a widget, and rule 8's note is where that line is drawn.

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
   alias, served as static files from `https://cubicecho.github.io/cubeui/r/{name}.json`. Consuming
   projects add one line to `components.json` and need no auth:

   ```json
   "registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
   ```

   Live: `.github/workflows/pages.yml` builds and publishes on every push to `main`, and the
   deploy refuses to ship a tree missing anything `registry.json` names. Verified end to end by
   installing three items into a project scaffolded by `shadcn init --template vite`, which
   pulled two more cubeui items and five upstream primitives transitively and typechecked clean.

   A project Pages site, so `vite.config.ts` sets `base: "/cubeui/"` and `public/r` rides along
   under it. Note that upstream shadcn has since moved `cn` into an npm package — their
   primitives import `from "cn"` and `lib/utils.ts` is now a shim that re-exports it. Our items
   still import `@/lib/utils`, which `shadcn init` still creates, so this resolves. We do *not*
   declare `utils` as a registryDependency: `shadcn add utils` prompts to overwrite an existing
   file even under `--yes`, which would hang every install in CI.

6. ~~What a slot is *for*, and what fills it.~~ **Settled**, and the answers are rules 11 and 12
   plus the notes below. Original discussion in
   [#1](https://github.com/cubicecho/cubeui/issues/1).

   **Slots take nodes so the node can own its own async.** The working assumption is that
   consuming apps run GraphQL. A slot holds a component; that component holds its own loading and
   error state; the layout places it and knows nothing about either. Layouts nest, so a page runs
   several queries at once and each region fills in as its own request lands, rather than the page
   holding one `isLoading` across all of them.

   ```tsx
   function MyPage() {
     return (
       <PageLayout
         title="Some title"
         content={
           <SidebarLayout
             content={<MyComponent {...dataFromQuery} />}
             sidebar={<MyOtherComponent {...dataFromQuery2} />}
           />
         }
       />
     );
   }
   ```

   **Most slot-filling components take their data as props; some may own a query.** Props are the
   default and the query is the exception. The consequence for this registry: **it ships no
   suspense or error boundary.** A component that owns a query brings its own, and a page that
   owns the data holds its own — either way that is the app's, not a shell's, which is rule 8.

   This is consistent with every `loading` prop already shipped. A shell's `loading` is for the
   part *the shell itself* would have drawn — a title, a control — never for the caller's data,
   which is why `SplitLayout` has no `loading` at all.

   **Nesting depth is not this library's concern.** How deep a page nests before it should be
   split by route is an app decision; the shells nest as far as the app wants. The
   list-and-detail note in `layout.md` stays a suggestion rather than a limit.

   **Settled, and this is the last of it:** the symmetric split is `SplitLayout`, and
   `SidebarLayout` is a preset of it — the same shape as `StickyHeaderContentFooter` over
   `HeaderContentFooter`, and settled the same way. The evidence was already in the component:
   `sidebarWidth` accepted `half` and `two-thirds` because four of the eleven call sites it
   replaced were `60%`, `2fr`, `3fr/2fr` and `1fr/4fr` — comparable columns, not sidebars. It had
   been doing two jobs since it shipped; only its name was single-purpose.

   The two neutral slots are **`first` and `second`**. Numbered rather than named, because neither
   alternative survives what the component already does: a role pair (`content`/`sidebar`) is a
   lie about a genuinely even split, and a side pair (`left`/`right`) is a lie below `stackBelow`,
   where the panes are one above the other, and again under RTL. `first` and `second` are true in
   all of those — first in reading order, wherever reading is going. `section_1`/`section_2` was
   the instinct behind them and was right about the equality; the numbering survived, the
   snake_case did not (nothing else in the API has it) and neither did the word `section` (rule 2
   — it is already the `Section` component).

   The preset emits the base's `data-slot` values, exactly as `StickyHeaderContentFooter` emits
   `header-content-footer-*`. A preset is a set of defaults, not a second component, so it does
   not get a second set of public slot names to keep in step.
