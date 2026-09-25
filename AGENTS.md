# AGENTS.md — cubeui

A custom [shadcn registry](https://ui.shadcn.com/docs/registry) of primitives, layout shells,
form fields and controls for the cubicecho apps and private project 1 — React Native and the DOM
from one set of sources. Consumers install from it with the shadcn CLI, pointing `@cubeui` at the
half that matches their platform:

```jsonc
// components.json — a DOM app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
// an Expo app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/native/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/tokens @cubeui/dialog-layout
```

The [README](./README.md) is how the registry is built and why, stage by stage. This file is the
guidance for adding to it.

## Why this exists

**Code reduction and reuse.** Every app here reaches the same handful of shapes — a page with
chrome above and below a scrolling body, a card with a title and a footer of buttons, a dialog
with a form in it — and writes each one out again. The cost is not the typing. It is that ten
hand-written copies of a shape are ten places for it to drift, and the drift is invisible until
someone reads them side by side.

The dialogs are the example to keep in mind. Seven dialogs in `ai_tools/kanban_server` share one
shell; six of them close through a discard guard and the seventh, written before the guard
existed, silently throws away what you typed. Across the wider set, every one caps itself with
`max-h-[85vh] overflow-y-auto` on `DialogContent`, which scrolls the *whole* dialog — so on a
long form the title leaves the screen first and Save is somewhere past the end of the fields.
Nobody decided that. It is what a copied snippet does.

A component in this registry earns its place by **deleting** that. If adding it does not remove
code from real screens, it does not belong here yet. The same holds across platforms: an Expo app
and a DOM app drawing the same card from two hand-kept copies is the same drift, one level up,
which is why most items are written once and compiled.

## Staying on task

Read this before adding anything:

1. **Show the duplication first.** Name the call sites — file and line — that the component
   replaces. Three or more, in at least two projects, or it is premature. `git grep` across
   `~/code/cubicecho/*` and private project 1 is where the evidence is.
2. **A variant prop is not a component.** When a shell needs a fourth boolean to fit a screen,
   the screen wanted a different shell. Adding `compact`, `bare`, `variant="alt"` to make one
   more call site fit is how a library becomes a worse version of the primitive underneath.
3. **Do not wrap — or redraw — a primitive that already exists.** Re-exporting `Card` with a `cn`
   around it adds a file and removes nothing. The shell exists to answer "where does this node
   go", once.

   Wrapping is the obvious version of this and it is not the one that happens. The one that
   happens is *redrawing*: writing `<Text className="text-muted-foreground text-sm">` for a
   field's description when `FieldDescription` exists, and now the registry owns a second set of
   type scales to keep in step with a first. `FormField` shipped that way once and was rewritten
   to compose `Field`, `FieldLabel`, `FieldContent`, `FieldDescription` and `FieldError` — which
   also handed it `orientation` and the horizontal arrangement for free.

   **This registry now publishes its own primitives**, so "what shadcn ships" is two lists. The
   first is this repo's: `registry/ui/` holds a native-first `button`, `card`, `dialog`, `field`,
   `input`, `select`, `separator`, `skeleton`, `tabs`, `command` and the rest, and each one's web half is a **superset of shadcn's
   API** — installed over a DOM app's own `components/ui/`, so a shadcn call site keeps compiling
   (README, "The web halves are now a superset of shadcn's"). `registry/web/ui/` re-publishes the
   upstream primitives the web tier needs — `table` (`alert-dialog`, `command`, `empty` and `item`
   were four, and are native-first now). **Check those two directories before you write markup**; a shell
   composes what is there. The second list is upstream's —
   `curl -s https://ui.shadcn.com/r/index.json` — and it is where to look before inventing a
   primitive this registry does not have yet.

   **Widening a primitive is not redrawing it.** When a shell needs something a primitive here
   lacks, the fix is on the primitive, on both halves where both can honour it: the port of the
   pre-native items added `SelectGroup`, `CardAction`, `DialogTrigger`, a native range calendar
   and more that way (README, Stage 4). Keep shadcn's API as the floor of every web half — a prop
   dropped from one is a DOM app that stops compiling, and
   `stories/web/shadcn-superset.type-assertions.tsx` is where that is proved.

   **Re-publishing is not wrapping** either. A file in `registry/web/ui/` is shadcn's, adapted
   only to import `cn` from `@/lib/utils` like everything else here. The point is the
   *distribution*: a project installing `@cubeui/alert-dialog` takes its confirm from here, so a change
   made once reaches all of them. The cost is owning shadcn's update cadence for those files, so
   the test for adding one is whether you would ever want to change it centrally — and whether a
   shell here imports it, since a bare upstream `registryDependencies` name splits a consumer's
   `cn` in two (README, "The five upstream primitives").

   The converse holds too: if a primitive covers the whole job, there is no component to write.
   `SplitLayout` is not resizable partly because dragging is `resizable`, which shadcn ships.
4. **Compose, do not re-derive.** `HeaderContentFooter` is the only implementation of "chrome
   that stays, a middle that moves". `DialogLayout` composes it. A shell that reimplements a
   shape another shell already owns is the exact bug this registry is against.
5. **Shells hold no state, no data, no routing, no toasts.** They take nodes and place them.
   The line is *who owns the state*: state about the shell's own interaction is the shell's, and
   state about the app's data is the caller's. `DialogLayout` holds whether its discard question
   is up, and is *handed* `hasUnsavedChanges` rather than reading the form. See conventions §8.
6. **Port the call sites.** A component landing here without at least one app updated to use it
   is a component nobody has proven. Say which app, in the PR.
7. **A component is a domain object; a layout places it.** A component names a thing in the app's
   domain — a Task, an Invoice, a ServerRow — and belongs in the app. A layout names an
   arrangement and knows nothing about what it arranges. That is the test for whether something
   belongs in this registry at all. It holds about nine times in ten; the controls are the
   standing exception. See conventions §12.
8. **Names are plain English.** No vendor jargon, no house metaphors, no initialisms — a prop and
   a `data-slot` are both public API, and every rename of one has been breaking. `rail` was
   Material's, `dirty` is Formik's, `hcf-` was ours. Internal metaphors (*chassis*, *floors*,
   *rungs*) stay in this file and in source comments, never in a prop name. See conventions §11.

## Author native-first

**Write it once, in React Native, and let the compiler make the web half.** An item in
`registry/ui/` (primitives) or `registry/layout/` (shells) is React Native source: `View`,
`Text`, `Pressable`, NativeWind classes. `npm run compile` runs `scripts/rn2web`, which rewrites
each one into a plain DOM component in `compiled/` — no react-native-web — and the web registry
ships `compiled/`, not the source. The rules that make that work:

- **The compiler refuses; it never guesses.** A construct it cannot translate faithfully is an
  error naming the file and line, not a best effort. When it refuses, change the source, or give
  the item a hand-written web half (below) — do not teach the compiler a guess.
- **`compiled/` is generated.** Every file there opens with a header naming its source. Edit the
  source and re-run `npm run compile`; `compile:check` fails CI on a `compiled/` file that no
  longer matches.
- **A primitive the DOM does differently gets a hand-written half.** `button.tsx` +
  `button.web.tsx`, with what both halves share (the `cva` variants, the prop types) in
  `button-base.ts`. The `.web.tsx` is copied into `compiled/` rather than compiled. A `.web.tsx`
  must have a `.tsx` beside it, and the two must export the same names — `registry:check` rules 1
  and 2.
- **Web-only classes go behind `Platform.select`.** A class Yoga cannot read (grid, arbitrary
  variants, `max-w-(--breakpoint-2xl)`) sits in `Platform.select({ web: …, default: … })`, which
  the compiler folds to its web branch. That is how the layout family is on both platforms.
- **But `web` is not only the compiled half.** An Expo web app runs the native source under
  react-native-web, where `Platform.OS === "web"` too and nothing is inherited: a bare `border`
  is black and a `Text` with no colour class is black. Name a border colour beside every border
  width (`border border-border`) and a text colour on every platform, never
  `Platform.select({ web: undefined, default: "text-foreground" })` — `registry:check` rule 14.
- **Declare the item in `registry.json`.** It is the native registry, and the web registry
  (`registry.web.json`) is generated from it plus `registry.web-only.json` — never edit
  `registry.web.json` by hand.

**The web-only tier is `registry/web/`.** Hand-written DOM components with no React Native half:
`FormField`, `app-form` and the bound fields, `table`, and the
rest. They are declared in `registry.web-only.json`, and the directory *is* the declaration — every
file there is web-only because of where it is. `registry/web/ui/` is the same tier for the
re-published primitives, so they still install to `components/ui/`. Put an item here only when an
RN source is genuinely impossible or unwanted (a Radix popover, a `<table>`), not
because the compiler refused once; and a layout does not go here at all — `registry:check`
rule 11 holds the layout family on both platforms, with no exceptions. The
tier only shrinks: rule 16 fails on a web-only item that `WEB_ONLY` in the script does not name with
its reason, and on a line left behind after its item gained a native half. Adding a line is a case
to make in the PR, not a way round the rule.

**Tokens are `tokens/palette.mjs`**, and nowhere else. `npm run tokens:build` emits the web
stylesheet (`oklch()`), the native one (hex, because React Native cannot parse `oklch()`) and
`cubeui-theme.ts` into `dist/`, which is committed. A colour class names a token
(`bg-primary`, never `bg-blue-500`) — `registry:check` rule 9.

## Status

Published to <https://cubicecho.github.io/cubeui/> by `.github/workflows/pages.yml` on every push
to `main`; the registry is the `r/` directory of that site, the native half `r/native/`, and the
Storybook `storybook/`. The landing page lists every item and which platforms it is on.

```
tokens/palette.mjs                    the one colour source; `tokens:build` emits dist/
registry/ui/                          primitives, React Native, some with a .web.tsx half
registry/layout/                      the shells, React Native, compiled for the web
registry/lib/                         `cn`, readableTextColor, the colour helpers
registry/web/                         the web-only tier, hand-written DOM
registry/web/ui/                      upstream shadcn primitives, re-published from here
registry/skill/                       the usage skill: SKILL.md and its three references
compiled/                             generated by rn2web; what the web registry ships
registry.json                         the native registry, and the source of the web one
registry.web-only.json                the web-only tier's items
registry.web.json                     generated — do not edit
stories/                              Storybook, and the tests: every story is one
docs/component-conventions.md         authoring rules, and the open questions
.claude/skills/cubeui/SKILL.md        a pointer at registry/skill/, so this repo's own agent
                                      reads the copy that ships
scripts/rn2web/                       the compiler
scripts/build-tokens.mjs              the token emitter
scripts/check-registry-build.mjs      `registry:check`: sixteen rules over what ships
scripts/install-test.mjs              `install-test`: `shadcn add` every item into scratch apps, `tsc`
scripts/check-vocabulary.mjs          `docs:check`: rule 2 and the skill hold the same words
scripts/build-page.mjs                the landing page, public/index.html
.github/workflows/ci.yml              `npm run check` and the Storybook tests
.github/workflows/pages.yml           builds and publishes the registry on `main`
```

Sources import each other as `@/components/ui/...`, `@/components/...` and `@/lib/...`; the CLI
rewrites those against the consuming project's own aliases on install. Pick the prefix by where the
*imported* file installs — its type, not its directory here: `registry:ui` is `@/components/ui/`,
`registry:component` is `@/components/`. A relative import never ships: the CLI does not rewrite
one, and `registry:check` rule 13 fails on it. `compiled/` uses `./x` internally and
`registry:build` puts the alias back.

Still unsettled: the open decisions at the end of the README, and the open questions in
`docs/component-conventions.md`. Do not answer those unilaterally in code.

## Stack

- **TypeScript 5**, strict, ESM only; two tsconfig projects split by platform —
  `tsconfig.json` is React Native, `tsconfig.web.json` is `compiled/`, `registry/web/` and
  `stories/web/`
- **React 19**; **React Native** with **NativeWind 5** on the native side; **Tailwind v4**,
  **radix-ui** (the unified package) and **lucide-react** on the web side
- **shadcn** CLI for `build`
- **Biome** for lint and format
- **Storybook** (on Vite) for the stories and, through vitest, the tests

Registry sources import `cn`, react, react-native, lucide, and other cubeui items — nothing else
(conventions §10). Anything further is a dependency every consuming project has to be told about,
and `registry:check` rule 7 holds each item's declared packages to the ones its files import. The
sanctioned exception is `@tanstack/react-form`, in the form items that bind to it.

`cmdk`, `date-fns` and `react-day-picker` do not count against that rule on the web: they are
what `command` and `calendar` are written on, so they arrive with the primitive rather than
because of a shell. They are still the reason `multi-select` and `date-picker` are separate
registry items — a form of plain inputs installs `@cubeui/app-form` and pulls in none of them.

## The forms assume TanStack Form

**Every project these components are installed into runs [TanStack Form](https://tanstack.com/form).**
Assume it. `auto-cal` is the reference — `createFormHookContexts`, a `useAppForm` hook, and
`<form.AppField name="title">{(field) => <field.InputField label="Title" />}</form.AppField>` at
the call site — and its `client/src/components/ui/form.tsx` is the file to read before adding
anything here.

This is a decision, not an observation, and it is the one that lets a form component be worth
installing. A shell hedging across react-hook-form, TanStack and a bare `useState` can only
accept strings and nodes, so every call site keeps writing the three lines that pull the error
off the field, decide whether it has been touched yet, and pass it down — which is the
duplication. Do not add a prop, a branch or a doc sentence accommodating another form library.

The binding lives in two places, one per tier:

- **`registry/ui/form.tsx`** (`@cubeui/form`) is the universal one: `Form`, `useAppForm`,
  `InputField` and the rest, written in React Native and compiled like any primitive.
  `registry/ui/date-time-field.tsx` and `registry/ui/color-picker-field.tsx` are its heavy fields,
  added to `field.*` with `createAppForm`. `registry/layout/radio-group-field.tsx`
  binds the same way beside it.
- **`registry/web/app-form.tsx`** (`@cubeui/app-form`) is the web-only one: the contexts,
  `useAppForm`, and `InputField`, `NumberField`, `TextareaField`, `SelectField`, `CheckboxField`,
  `SwitchField` and `SubmitButton`, each reading the store and handing `FormField` a string.
  `@cubeui/multi-select-field`, `@cubeui/date-field`, `@cubeui/color-field` and
  `@cubeui/password-field` are the same layer in their own files, for the weight of what they
  import, and `@cubeui/form-set` installs all of them.

Those three are the only files in the registry that import `@tanstack/react-form`. A web-only
field `app-form.tsx` does not hold is still bound through it: `bindToForm`, `splitProps` and
`useFieldError` are exported for exactly that, so `date-field.tsx` needs no second copy of the
render prop and no opinion about the form library.

The split to preserve is `auto-cal`'s. `FormField` is presentational: it takes `error` as a node
and asks nothing about where it came from. The bound fields read the store and hand it a string.
Keep new work on the right side of that line: a component that needs the form store is bound, and
one that only needs to be told goes below it. Presentational is what makes each bound field
fifteen lines instead of a fork, and it is what lets a field the binding does not cover yet be
written by hand without leaving the set.

**A field's `name` is checked against the form's values, and against their type.** `bindToForm`
takes the value type the control writes, so `<NumberField name="title">` over a string field and
`<DateField name="window">` over a `DateRange` are both build errors. This is the reason
`NumberField` is a component rather than a `type="number"` prop, and the reason `DateRangeField`
is not a `range` prop on `DateField` — rule 2 is about props that only change how something
looks, and neither of these does.

**`FormField` can name a group as well as a control.** `asGroup` swaps the `<label htmlFor>` for
a `FieldTitle` plus an `aria-labelledby` on the control, because HTML will not let a `<label>`
name a `<div role="radiogroup">` — the browser drops the association silently. Any grouped
control needs it: a segmented control, a swatch grid used as the field itself. `RadioGroupField`
does the same thing itself now that it is native-first.

## Code style

- Biome-enforced: double quotes, semicolons, trailing commas, 2-space indent, 100 line width,
  `import type` for type-only imports, imports organised on save
- Files `kebab-case.tsx`; components `PascalCase`; vars and functions `camelCase`; true
  constants `SCREAMING_SNAKE_CASE`
- Prefix an unused parameter with `_`; `unknown` over `any`, which is an error
- Comments explain **why**, not what. A comment that restates the line below it is noise. The
  comments worth writing here are the ones that say what went wrong without the line
- Re-export with `import` + `export { … }`, never `export … from` — the shadcn CLI rewrites
  import declarations against a consumer's aliases and leaves re-export declarations alone, so
  the `from` form installs pointing at a directory the consumer does not have. `registry:check`
  rule 12
- Tailwind variants are literal class maps (`const SIZES = { sm: "sm:max-w-sm" }`), never
  composed strings — the scanner reads source text, so a built class name is never generated.
  A class-map constant is applied by the file that owns it — `registry:check` rule 8
- Colour classes name tokens, never Tailwind's palette — `registry:check` rule 9

The full authoring rules are [`docs/component-conventions.md`](docs/component-conventions.md).
The slot vocabulary (`content`, `title`, `description`, `icon`, `action`, `footer`,
`footerActions`, `empty`, `loading`, `<slot>ClassName`) is the part to know before writing a prop.

**No shell takes `children`.** The body is `content`, a prop like every other slot, because in a
layout every part is dynamic and none of them earns the privileged position. A component that
accepts children is a component that has to answer "and what if both were passed?" — see rule 1
of the conventions doc. Primitives are the exception, as they are in shadcn: a `Button` takes
its label as children.

## Before you commit

```bash
npm run build     # tokens → compile → typecheck → registry:build → page:build → registry:check
npm run check     # the same, read-only: what CI runs
```

A change to how files are placed, imported or depended on also gets `npm run install-test`, which
`shadcn add`s every item into scratch web and native apps and runs their `tsc`. It needs the
network, so it is not in `check`.

`npm run check` is `tokens:check`, `compile:check`, both typechecks, `registry:check`,
`page:check`, `docs:check`, Biome and the tests. It is read-only, so a failure in it is either a
real fault or a generated file (`dist/`, `compiled/`, `public/r/`, `public/index.html`) that
`npm run build` has not been re-run for. Commit the regenerated files with the change that made
them.

## Keep the skill in sync

[`registry/skill/SKILL.md`](registry/skill/SKILL.md) is how an agent in a *consuming* project
learns these components. A new component, a renamed prop or a changed default is not finished
until it is in there. It ships as a registry item, so a stale skill is a stale skill in every
project that installed it.

**Edit it in `registry/skill/`, never in `.claude/`.** That directory is a tool's working
directory, not a source directory — this repo ignores `.claude/worktrees/` and most projects
ignore the whole thing, and a registry payload one `.gitignore` line away from disappearing is not
a payload. `.claude/skills/cubeui/SKILL.md` is a pointer at these four files so that this repo's
own agent reads the copy that ships, rather than a second copy that drifts from it.

It is four files, and the split is load-bearing. `SKILL.md` is the router — which platform half
you are in, the install line, the choosing table, the slot vocabulary, and the rule that no
shell takes children — and it is short because it is the part that is always in context.
[`layout.md`](registry/skill/layout.md), [`forms.md`](registry/skill/forms.md) and
[`controls.md`](registry/skill/controls.md) are read when the table sends the agent to one of
them. A new item goes in its reference **and** gets a row in the choosing table; a new slot word
goes in `SKILL.md`'s vocabulary and in rule 2 of the conventions doc, because those two are the
same list. `npm run docs:check` is what makes that true rather than intended — it compares the
words layer by layer and fails CI on a word written into one of them and not the other. Say it in
both voices: the conventions doc argues the word, the skill hands it to an agent. All four are
listed in the `skill` item's `files`, so adding a fifth means editing `registry.json` too — and
`npm run registry:check` is what notices if one of them ships empty.

## Git

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, with an
  optional scope (`feat(layout): …`). Subject in the imperative, lowercase after the colon, no
  trailing period. The body says why, wrapped at 80
- Run `npm run check` before every commit
- Branch for the work; `main` is what CI and Pages watch
- **Never rebase — merge.** `git merge origin/main` to bring main into a branch

## Where the source material is

The duplication these components replace, and the prior art worth reading before writing a new
one:

| Path | What is there |
| --- | --- |
| private project 1, `app/layouts/` | `header-content-footer`, `sticky-header-content-footer`, `split-pane` — the chassis this set is built on, and the best commentary on *why* a layout is a component |
| `~/code/cubicecho/ai_tools/kanban_server/web/components/` | `form-dialog`, `confirm-button`, `board-card` — a shell that already exists, and what it cost to not have one |
| `~/code/cubicecho/ai_tools/mcp/mcp-router/app/src/components/` | `workspace-dialog`, `members-card`, `connect-card` |
| `~/code/cubicecho/apps/eunomia/apps/web/src/components/` | `confirm-delete`, `rules/*-card`, `dashboard/stat-tiles` |
| `~/code/cubicecho/apps/philotes/app/src/components/layouts/` | `section`, `header`, and `dashboard/widget` |
| `~/code/cubicecho/ai_tools/task_server/web/components/app-shell.tsx` | `Page` — the same forty lines as kanban's, and the reason `PageLayout` exists |
| private project 1, `app/components/shared/` | the most mature version of this idea anywhere here: `fact-grid`, `list-page-header`, `field-section`, `tooltip-icon`, `confirm` |
| `~/code/cubicecho/ai_tools/min-agent/mobile/` | the Expo app whose hand-converted palette is why `tokens/` exists |

## Surveyed and deliberately not built

Recorded so the next pass does not re-derive them:

- **`AppShell`** (sidebar + header + main). Five apps hand-roll it — kanban, task_server,
  mcp-router, mcp-skills-manager, notes — and the two mcp apps are near-forks (their
  `token-gate.tsx` differs by 4 lines out of 67). Not built as a shell: the layout half is
  `@cubeui/sidebar`, and the genuinely shared part between the mcp apps is auth, which is rule 5.
  The one layout piece still hand-written in six of them — the `md:hidden` bar with the brand and
  icon nav over a rail hidden below `md` — is `SidebarLayout`'s `sidebarHideBelow` with `brand`,
  `nav` and `action`, a widening rather than a new `app-shell` item, which would also have
  collided with mcp-ragdown's own `components/app-shell.tsx` on install.
- **The list row** (`badges`, `title`, `meta`, `actions`, `dim`). 99 instances of
  `flex items-start justify-between` across 8 projects. Settled: once kanban installed
  `@cubeui/item`, the plain row *was* `Item` and its `row-card.tsx` was deleted rather than
  upstreamed — `dim` is one `className` on `ItemContent`, which is not a component. What `Item`
  had no answer for was the row that **opens**, so `DisclosureRow` is what shipped.
  `Item` had no answer for a React Native app either, and five Expo apps drew the row by hand,
  so `ListItem` (`registry/layout/list-item.tsx`) is that row on both halves — `leading`,
  `title`, `description`, `meta`, `action`, and an optional pressable middle. `Item` itself now
  has a native half (`registry/ui/item.tsx`, its parts drawn as `ListItem`'s regions, classes
  shared through `item-base.ts`), and `DisclosureRow` is rebuilt on it in `registry/layout/`,
  so the row that opens is on both halves too.
- **`EmptyState`**. ~30 files hand-roll "no results". `@cubeui/empty` is the primitive, and
  `CardLayout` already has the slot. `EmptyState` did ship later, in `@cubeui/page`, and `empty`
  is now shadcn's parts on both halves drawn the same way — `EmptyState` is built on them.
- **`FactGrid`** (private project 1's is excellent — it replaced 10 hand-rolled `<dl>`s and 5
  copies of a `Fact` helper, one of which had lost its `<dt>`/`<dd>`). Fails rule 1's two-project
  bar: cubicecho has 4 `<dl>` files and they are all in one app. Superseded by
  `@cubeui/description-list` (#135), once mcp-ragdown's settings page became the second app with a
  hand-built label / value / hint row — as a list of rows rather than a grid, because the rows
  are what those settings pages are made of.
- **`FormButtons`**. Too bound to private project 1's `isNew`/`isDeleted`/restore vocabulary to
  port.
- **`SliderField` / a slider control.** Asked for and not built, and the grep that suggested it
  was wrong. Of the eight files matching `<Slider`, three are `rc-slider`, three more are a theme
  demo and a story, and exactly one is a real shadcn `Slider`: private project 1's
  `ut-ui/icon/icon-picker.tsx`, unbound, in one project. One call site in one project fails
  rule 1 twice over. There is also a blocker: Radix names a thumb only when there are two or more
  of them, and shadcn's `Slider` forwards nothing to its thumbs — so a single-thumb shadcn slider
  has an unnamed `role="slider"`, which axe reports.
- **`RadioGroupField` was built on the shell, not on the evidence.** All 20 `<RadioGroup` uses
  were private project 1's theme demos, its story and the primitive itself. It shipped because
  `asGroup` had to be built anyway and this is what proved it worked, and it is on both platforms
  now because a React Native app needed a radio group. Do not cite it as precedent for skipping
  rule 1.
