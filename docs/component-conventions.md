# How a cubeui component is formed

The rules every item in this registry is written to. The point of writing them down is to argue
about them once rather than per component. They started as the rules the first four layout
shells shared; where a later item widened one — the form layer, the controls — the rule below is
the widened version, not the original.

They came across from cubeui, where every item was a web-only shell, and they still hold for the
layout family now that it is written once in React Native and compiled (README, Stage 4). Where a
rule reads differently on this side of that move it says so. `npm run docs:check` holds rule 2 and
the skill's vocabulary section to the same list of words.

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

**Page, split and dialog shells add:**

| Word | Means |
| --- | --- |
| `breadcrumbs` | The line above the title. A trail, or a back link. Nodes, never a route. |
| `headerContent` | The row under the title: search, filters, tabs. `PageHeader` calls it `content`, because it has no body of its own. |
| `first`, `second` | The two panes of a `SplitLayout`, as equals. Numbered because a role pair lies about an even split and a side pair lies once the panes stack or the page is read right-to-left. |
| `firstWidth`, `secondWidth` | Which pane carries the width. One or the other, never both. |
| `sidebar` | The second surface in a `SidebarLayout`. `content` stays the main one. |
| `sidebarPosition`, `sidebarWidth`, `sidebarHideBelow`, `sidebarClassName` | The sidebar's, by prefix. `sidebarHideBelow` is `Sidebar`'s `hideBelow` said once on the layout, so the rail and the bar that stands in for it read one breakpoint. |
| `brand` | The start of an app's bar: the logo and the app's name. On `TopBarLayout`, where the bar has no title — an app's name is not a page's, and a `title` there would be a second `h1` on every page — and on `SidebarLayout`'s bar, drawn only where the sidebar is not, so it carries what the sidebar's header shows. |
| `nav` | An app bar's navigation: the primary links on `TopBarLayout`, the places as icon links on `SidebarLayout`'s bar. The shell draws the navigation landmark around them, for the same reason `as="nav"` exists — the hand-written one is the one that went unnamed; `navLabel` names it by prefix. |
| `sidebarPosition`, `sidebarWidth`, `sidebarClassName` | The sidebar's, by prefix. |
| `cardClassName` | On `CenteredLayout`, the card, where `className` is the page around it. The card is not a slot the caller fills, so it takes its prefix from the shell it is: the one page shell whose root is not the thing it draws. |
| `as` | Not a slot: which landmark a part is. `as="nav"` on `SidebarSection`, named by its `title` or a `label`. A prop rather than a wrapper the caller writes, because the hand-written `<nav>` is the one every app forgot. |
| `width` | `page` / `prose` / `full` — the column, not a number. |
| `level` | Not a slot: `1 \| 2 \| 3`, which heading element the title is. |
| `trigger` | What opens a dialog, when the dialog owns its own open state. |
| `open`, `onOpenChange` | Anything that opens, and being told when it does. Filed here because `DialogLayout` is the first thing that takes it, not the last: a disclosure row takes it, and so does a select whose menu is filled by the opening. |
| `defaultOpen` | Where a thing that opens starts, when it holds its own open state. The primitives' word already (`Dialog`, `Popover`, `Menu`), taken by a shell once `Disclosure` held its own: an uncontrolled shell with no starting state is a `useState` the caller writes anyway. |
| `hasUnsavedChanges` | Closing asks first. A boolean the caller is asked for, never one a shell computes — rule 8. |

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
| `leading` | Inside a field, at its start: an icon, with the text padded past it. On `Input`, where `icon` would read as the title's icon — a field has no title — and where the hand-written version was always an absolute glyph and a guessed `pl-8`. |
| `trailing` | The far end of a row, after its `label`: a shortcut, a count. On `MenuItem` and the menu's checkbox and radio rows, where `action` would read as a second button in the row. On `Input` it is the same place in a field — the far end, inside it — and holds one icon-sized control, a clear button. |
| `link` | The router's link as an element with no children, which the row is drawn inside. On `MenuItem`, where the inverted `<Link asChild>` nesting would hand radix a click the router has already cancelled, and the menu would stay open. |
| `value`, `onValueChange` | Every control that holds a value, so a control is swappable for another. |
| `selected` | Beside a press handler, the target is a toggle and this is whether it is on — `aria-pressed` on the web, `accessibilityState.selected` on device. On `ToggleChip` and `StatTile`. Left out, a plain button. |

**List rows and query states add:**

| Word | Means |
| --- | --- |
| `badges` | What a row is wearing: a status, a kind, a state. Before the title. |
| `leading` | The start of a row, before the title: an avatar, a checkbox, an icon. On `ListItem`, where `icon` would promise sizing and colouring that an avatar or a checkbox cannot take, and where `badges` would read as status. Outside the row's pressed area, so a checkbox there is its own control. |
| `meta` | The grey line of facts beside the title: a name, a time, a count. On `ListItem` it is the row's far end, before `action` — still facts about the title, placed where a list scans them. |
| `query` | A `{ isPending, isError, error, refetch }`, structural — no shell names a data library. |
| `what` | What could not be fetched, in the reader's words. |
| `count` | How many rows the page is about to draw, which is not what came back. |
| `rows` | How many placeholder rows stand in for a list while it loads. |
| `layout` | On `DescriptionList`: `inline`, label beside value until the list is too narrow, or `stacked`. |

Notes on why the layering is where it is:

- **`control` is the one exception to "the body is `content`",** and it earns it: it is the only
  body in the set the shell *wires* rather than places. Everything else that renders a body
  renders it untouched.
- **`label` means two different things,** and that is deliberate. On a field it is visible text
  pointed at a control; on an icon button it is the accessible name of a control with no visible
  text. Both answer "what is this control called", which is the test the vocabulary applies.
- **`DisclosureRow` and `ListItem` take `action`, not `actions`,** though each usually holds three buttons. The
  core word already says "one control, or a fragment of them", and a second word for the same
  place would only ever be a plural.
- **`PropertyRow` reuses `label`, `hint`, `action` and `value` rather than growing words of its
  own.** `label` is what the fact is called, `hint` the line read after it, `action` the far end —
  each what it already means. `value` is the stretch: on a control it is the held value, on a row
  it is the value on display, a node. Both answer "what is it set to", and a read-only row that
  called it anything else would be a second word for the same question.
- **`SettingRow`'s `action` may be a function,** handed `{ titleId, descriptionId }`, and that is
  not a new word. It is `footerActions`' move on `DialogLayout`: the shell has something the
  caller's node needs — there a guarded close, here the id the control's `aria-labelledby` points
  at — and a function is the one way to hand it into a node the shell did not write. A plain node
  still works, and is right for a button whose own text is its name.
- **`CopyButton` takes `value` for the string it copies,** with no `onValueChange`, because it
  never changes it. The same stretch as `PropertyRow`'s: the button is set to that string. The
  call sites it replaced said `text`, and a new word for it would have been the only one in the
  set.
- **`layout`, not `orientation`,** on `DescriptionList`. `orientation="horizontal"` on a field is
  horizontal at every width; `layout="inline"` stacks by itself once the list is too narrow for a
  label beside its value, so `horizontal` would be a lie below that width — the same reason the
  split panes are `first` and `second` rather than `left` and `right`.
- **`SidebarLayout`'s bar reuses `action` and takes `brand` and `nav`, not a `mobileNav`.** The bar
  is a header, so its far end is the core `action`; `brand` and `nav` are the words the top bar
  of an app without a sidebar takes too, so the same three parts are called the same thing
  whether a sidebar is beside them or not. `mobile` was the obvious prefix and a wrong one: the
  bar is drawn under a breakpoint, which is a narrow desktop window as often as it is a phone.
- **`StatTile` reuses `PropertyRow`'s `label`, `value` and `hint`,** because a tile is the same
  three parts on a card: what the figure is called, the figure, the line read after it. Its one
  word of its own is `selected`, which `ToggleChip` already took and the vocabulary had not yet
  written down — `pressed` is the ARIA spelling of one platform, and a prop is read on both.
- **A prefix binds a word to a slot.** `sidebarWidth` is the sidebar's width and `contentClassName` is
  the body's class, so a new prop belonging to an existing slot needs no new word at all.

## 3. Variants are literal class maps

```tsx
const SIZES = { sm: "sm:max-w-sm", md: "sm:max-w-lg" } as const;
```

Never `` `sm:max-w-${size}` ``. Tailwind's scanner reads source text, so a composed class name is
one that is never generated — and here the same is true twice over, because `rn2web` compiles a
class list it can read and refuses one it cannot. Where the value itself has to be dynamic, put it
on a style prop (on native) or a CSS custom property read by `var(--…)` (on the web, behind the
`Platform.select` the compiler folds).

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
padding is the primitive's to decide and a shell that sets its own only fits one dialog.

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

The shell guards only what it owns — and where it cannot own a path, it hands the caller the
guard rather than a second copy of it. `DialogLayout` reaches Escape (and Android back), the overlay and the
close button, because all three arrive through the `Dialog` primitive's `onOpenChange`. A Cancel button in
`footerActions` does not: it is the caller's node calling the caller's setter. So `footerActions`
takes a **function** and hands it the shell's own guarded close, which is the same close the
other three go through.

That is the smallest thing that could work, and deliberately not the shell growing its own Cancel
button. A rendered Cancel would be unforgettable — the property the paragraph above argues for —
but it would put the footer's contents, its word and its button order inside a shell whose whole
job is to place nodes it did not write, and `discardLabel` is as far into a caller's vocabulary
as this component should reach. A caller who wires Cancel to their own setter still gets today's
behaviour; the function is right there in the prop's type, which is where a caller writing that
line is already looking.

Controlled/uncontrolled is delegated where it can be: pass `open`/`onOpenChange` straight through
to the primitive and let `undefined` mean uncontrolled. `DialogLayout` is the exception it has to
be — guarding every close path means the primitive is always handed an `open`, so an uncontrolled caller's
state lives in the shell instead of the primitive. A caller who passes `open` still owns it, and
still hears every change. The two never mirror.

**A control is not a shell, and this rule is about shells.** `ColorPicker` holds a half-typed hex,
`PasswordInput` holds whether the value is showing, `MultiSelect` holds its search term — and each
of those is state that belongs to the widget, not to the screen. The line is whether the state
outlives the interaction: a draft the control throws away on blur is the control's, and a value
anything else in the app can read is the caller's. The value itself is always `value` and
`onValueChange`, never held inside; the two never mirror.

Delegation is the same here as it is above, and a control that wraps a primitive has to be told
so: `OptionSelect` passes `open`/`onOpenChange` through to its `Select` because a menu whose list is
fetched has nowhere else to learn that it opened. It shipped without them and the one picker in
task-server whose options come from the server stayed hand-assembled — a control that swallows
the primitive's own state is a control the fetching call site cannot use, and the fix is to pass
it on rather than to grow a `loading` prop and a fetch.

The form binding is the same line seen from the other side. `FormField` takes `error` as a node
and asks nothing about where it came from, which is what lets it be installed into a project with
no form library at all; `app-form.tsx` is the one file that knows about TanStack. A component
that needs the form store goes there, and one that only needs to be told goes below it.

## 9. Props carry a comment saying why, not what

`/** The footer's end. The buttons. Given alone, the footer is simply right-aligned. */` — the
second sentence is the one that earns its place.

## 10. Imports are `cn`, react, react-native, lucide, and other cubeui items

Anything else is a dependency a consuming project has to be told about. `registryDependencies`
covers other items in this registry — the primitives included, since every one a shell uses is
published from here; `dependencies` covers npm packages; a fourth category means the component is
doing too much. A web-only item (`registry/web/`) reaches `react-dom`'s world through the compiled
primitives, not through `react-native`, and `lucide-react` rather than `lucide-react-native`.
`registry:check` rule 7 holds each item's declared packages to the ones its files import.

**Re-export with `import` + `export { … }`, never `export … from`.** The shadcn CLI rewrites
*import declarations* against a consumer's aliases and leaves *re-export declarations* alone, so
`export { PageHeader } from "@/components/page-header"` ships verbatim and points at wherever
this repo keeps the file, not wherever the consumer's `components.json` does. Import the symbol at the top of
the file the way everything else is imported, and export the local binding at the bottom. Same two
lines, and the one that moves is the one the CLI knows how to move. `registry:check` rule 12
fails on the other form in anything either registry ships.

## 11. Names are plain English

No vendor jargon, no house metaphors, no initialisms. A prop and a `data-slot` are both public
API — a consumer reads them without having read the source, and reaches a slot from outside
through `has-data-[slot=…]` (rule 6). `rail` was Material Design's word, `dirty` is Formik's, and
`hcf-` was ours. All three were renamed once noticed, and every rename was breaking.

The test: would someone who has never seen this registry guess what it holds? `sidebar` passes,
`rail` does not. Internal metaphors stay internal — *chassis*, *floors* and *rungs* earn their
keep in the README and in source comments, and appear in no prop name.

A bare noun is a slot (rule 1), so a boolean never gets one: `hasUnsavedChanges`, not
`unsavedChanges`.

**No item may share a file name with a shadcn primitive**, and this is a hard rule rather than a
preference. `control/select.tsx` shipped beside `ui/select.tsx` for a day: the CLI resolves a
cross-item import by the file's *basename*, so `app-form`'s import of the control was rewritten
to the primitive on install. It resolved — to the wrong file — and failed on the members three
files from the cause. The argument for shipping it as `Select` was that a reader disambiguates
by import path, which is true and beside the point: the CLI rewrites the import path. Renaming
the item in `registry.json` is not enough either; the file is what is matched. `npm run
registry:check` now fails on it, and the component is `OptionSelect`.

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

   That happened for `onClick`/`selected`, on a narrower shell rather than on this one: the
   status pages of kanban_server and task_server both hand-wrote a pressable count tile with
   `aria-pressed` and `border-primary bg-accent`, and `StatTile` takes `onPress` and `selected`
   for them. Its press is `Card`'s own, so the focus ring, the role and the keyboard target are
   the primitive's rather than the shell's. `CardLayout` still takes neither.
4. **Where installed files land, and how items import each other.** *Settled — and verified by
   installing into a scratch project whose aliases deliberately differ from ours.* Registry
   sources import each other as a consumer would — `@/components/ui/button`,
   `@/components/header-content-footer`, `@/lib/utils` — and the two tsconfig projects resolve
   those to `registry/{ui,layout,lib}` (React Native) or `compiled/` and `registry/web/` (DOM).
   No `target` is set on the component items, so they land flat in the consumer's components
   alias. (On cubeui the sources used the official template's `@/registry/new-york/...` form;
   the finding below is from then, and is unchanged by the move.)
   Installing `@cubeui/dialog-layout` into a project aliased `~/* -> ./src/*` produced:

   ```
   src/components/dialog-layout.tsx          import { HeaderContentFooter } from "~/components/header-content-footer";
   src/components/header-content-footer.tsx  import { cn } from "~/lib/utils";
   src/components/ui/dialog.tsx              (pulled in as a registryDependency)
   ```

   So the CLI rewrites both our cross-references and `@/lib/utils` against the
   consumer's own aliases, and the transitive `@cubeui/header-content-footer` dependency resolves.

   **With one exception, found later: it rewrites imports, not re-exports.** The transform walks
   the file's import string literals, so `export { X } from "@/registry/new-york/control/x"` was
   left exactly as written and landed pointing at a `control/` directory that only existed in
   cubeui. Nothing warns; the install succeeds and `tsc` fails afterwards. Reproduced in the same
   scratch project — installing the four bound-field items from the published registry gave six
   `TS2307`s, and the same install with every re-export rewritten as an import plus a local
   `export { … }` gave none. That form is §10.
   The `skill` item is the one exception: it sets `target: "~/.claude/skills/cubeui/SKILL.md"`,
   and `~` is the consumer's project root, so it lands at `.claude/skills/cubeui/SKILL.md`. Its
   *source* is `registry/skill/`, not `.claude/` — a payload living under a directory people
   routinely gitignore is one line away from shipping empty, and the target is the only half of
   that path that has to be `.claude`.
   Grouping components under `components/layout/` with a `target` stays rejected — it assumes a
   tree shape the consumer never agreed to.
5. ~~Namespace, and where the registry is served from.~~ **Settled:** `@cubeui/<item>` as the
   alias, served as static files from `https://cubicecho.github.io/cubeui/r/{name}.json`. Consuming
   projects add one line to `components.json` and need no auth:

   ```json
   "registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
   ```

   Live: `.github/workflows/pages.yml` builds and publishes on every push to `main`. The React
   Native registry is the same host at `/r/native/{name}.json`, and the consumer's URL is what
   picks a platform. Verified end to end by
   installing three items into a project scaffolded by `shadcn init --template vite`, which
   pulled two more cubeui items and five upstream primitives transitively and typechecked clean.

   A project Pages site, so `public/` is published as-is under `/cubeui/`. Note that upstream shadcn has since moved `cn` into an npm package — their
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
