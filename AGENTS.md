# AGENTS.md — cubeui

A custom [shadcn registry](https://ui.shadcn.com/docs/registry) of layout and form shells for the
cubicecho apps and private project 1. Consumers install from it with the shadcn CLI:

```bash
npx shadcn@latest add @cubeui/dialog-layout
```

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
code from real screens, it does not belong here yet.

## Staying on task

Read this before adding anything:

1. **Show the duplication first.** Name the call sites — file and line — that the component
   replaces. Three or more, in at least two projects, or it is premature. `git grep` across
   `~/code/cubicecho/*` and private project 1 is where the evidence is.
2. **A variant prop is not a component.** When a shell needs a fourth boolean to fit a screen,
   the screen wanted a different shell. Adding `compact`, `bare`, `variant="alt"` to make one
   more call site fit is how a library becomes a worse version of the primitive underneath.
3. **Do not wrap — or redraw — what shadcn already ships.** Re-exporting `Card` with a `cn`
   around it adds a file and removes nothing. The shell exists to answer "where does this node
   go", once.

   Wrapping is the obvious version of this and it is not the one that happens. The one that
   happens is *redrawing*: writing `<p className="text-muted-foreground text-sm">` for a field's
   description when `FieldDescription` is one `npx shadcn add field` away, and now the registry
   owns a second set of type scales to keep in step with a first. `FormField` shipped that way
   and was rewritten to compose `Field`, `FieldLabel`, `FieldContent`, `FieldDescription` and
   `FieldError` — which also handed it `orientation` and the horizontal arrangement for free.

   **So check the index before you write markup:** `curl -s https://ui.shadcn.com/r/index.json`.
   As of this writing it has 63 items, and the ones a layout or form shell is most likely to
   redraw by accident are `field`, `empty`, `item`, `input-group`, `button-group`, `spinner`,
   `breadcrumb` and `separator`. If a primitive covers the *drawing*, install it and add the
   *wiring* — that is where the duplication actually was.

   The converse holds too: if a primitive covers the whole job, there is no component to write.
   `SplitPane` is not resizable partly because dragging is `resizable`, which shadcn ships.

   **Re-publishing is not wrapping.** A few of shadcn's own files ship from this registry
   unchanged, as `registry:ui` items — `empty` and `item` today. Nothing is added and nothing is
   redrawn; the file is shadcn's, byte for byte, until someone here changes it. The point is the
   *distribution*: a project installing `@cubeui/item` takes its list row from here, so a change
   made once reaches all of them, where `npx shadcn add item` in eight repos is eight copies that
   drift the moment one of them is edited. That is the same duplication rule 1 is about, one
   level down.

   The test for adding one is whether you would ever want to change it centrally. If the answer
   is no, depend on the shadcn name and leave it alone — `popover` and `separator` are installed
   as plain dependencies for exactly that reason. Re-publishing everything would make this
   registry a fork of shadcn, which is a maintenance burden nobody asked for.
4. **Compose, do not re-derive.** `HeaderContentFooter` is the only implementation of "chrome
   that stays, a middle that moves". `DialogLayout` composes it. A shell that reimplements a
   shape another shell already owns is the exact bug this registry is against.
5. **Shells hold no state, no data, no routing, no toasts.** They take nodes and place them.
   Behaviour that needs state belongs to the caller or to a form component.
6. **Port the call sites.** A component landing here without at least one app updated to use it
   is a component nobody has proven. Say which app, in the PR.

## Status

Early, but scaffolded and installable. What exists today:

```
registry/new-york/layout/header-content-footer.tsx   HeaderContentFooter, StickyHeaderContentFooter
registry/new-york/layout/card-layout.tsx             CardLayout
registry/new-york/layout/dialog-layout.tsx           DialogLayout
registry/new-york/layout/page-header.tsx             PageHeader
registry/new-york/layout/split-pane.tsx              SplitPane
registry/new-york/layout/page-layout.tsx             PageLayout
registry/new-york/layout/section.tsx                 Section
registry/new-york/form/form-field.tsx                FormField
registry/new-york/form/field-row.tsx                 FieldRow
registry/new-york/form/app-form.tsx                  useAppForm + the TanStack-bound fields
registry/new-york/form/multi-select-field.tsx        MultiSelectField
registry/new-york/form/date-field.tsx                DateField, DateRangeField
registry/new-york/form/color-field.tsx               ColorField
registry/new-york/form/radio-group-field.tsx         RadioGroupField
registry/new-york/form/password-field.tsx            PasswordField
registry/new-york/control/action-button.tsx          ActionButton
registry/new-york/control/confirm-button.tsx         ConfirmButton
registry/new-york/control/multi-select.tsx           MultiSelect + its two helpers
registry/new-york/control/date-picker.tsx            DatePicker, DateRangePicker
registry/new-york/control/color-picker.tsx           ColorPicker + its two helpers
registry/new-york/control/password-input.tsx         PasswordInput
registry/new-york/lib/readable-text-color.ts         readableTextColor
registry/new-york/ui/*.tsx                           shadcn primitives, installed by the CLI
registry.json                                        29 items: 21 components, a lib, two re-published
                                                     primitives, `layout`, `form`, `control`,
                                                     `primitive`, `skill`
components.json                                      aliases point at `@/registry/new-york`
preview/                                             Vite demo page, `npm run dev`
stories/                                             Storybook, and the tests — every story is one
docs/component-conventions.md                        authoring rules, and the open questions
.claude/skills/cubeui/SKILL.md                       the usage skill: install, choosing, vocabulary
.claude/skills/cubeui/{layout,forms,controls}.md     its references, shipped by the same item
```

`registry/new-york/ui/` is not ours. Every file in it arrived from `npx shadcn add` and is
overwritten by the next one, so Biome's linter is switched off for that path in `biome.json`
(the formatter stays on, so a diff of upstream's file is a diff of upstream's file). Fixing
`noArrayIndexKey` in `field.tsx` would mean fixing it again on the next upgrade, forever.

Sources import each other as `@/registry/new-york/...`; the CLI rewrites those against the
consuming project's own aliases on install. This is verified, not assumed — see open question 4
in `docs/component-conventions.md`.

`registry/new-york/control/` is the third folder. A control is not a shell — it holds its own
open state and it draws a button — so rule 5 does not reach it, but rules 1 and 3 still do:
`ActionButton` and `ConfirmButton` are there because 78 unlabelled icon buttons and 22
hand-written confirm dialogs are, not because a set ought to have buttons in it. `MultiSelect` and
`DatePicker` join them on the same evidence: three multi-selects that are not the same shape, one
of which is not keyboard-operable at all, and three date pickers that are one file copied twice
and then drifted.

Still unsettled: whether the form half needs anything beyond `FormField`, `FieldRow` and the
bound layer — `FormDialog` was
written and then removed, because a form in a dialog is `DialogLayout` with a `<form>` in its
`content` and the shell around that was carrying a `useState` and two booleans to save nobody
four lines. Also open questions 1, 3 and 5 in the conventions doc. Do not answer those
unilaterally in code.

## Stack

- **TypeScript 5**, strict, ESM only
- **React 19**, **Tailwind v4**, **radix-ui** (the unified package), **lucide-react**
- **shadcn** CLI for `build`; new-york is the reference style, but components must survive being
  installed into any of them
- **Biome** for lint and format
- **Vite** for the preview site (`npm run dev`)

Registry sources import `cn`, shadcn primitives, react, lucide, and other cubeui items — nothing
else. Anything further is a dependency every consuming project has to be told about. The one
sanctioned exception is `@tanstack/react-form`, and only in a form item that binds to it.

`cmdk`, `date-fns` and `react-day-picker` do not count against that rule: they are what
shadcn's own `command` and `calendar` are written on, so they arrive with the primitive rather
than because of us. They are still the reason `multi-select` and `date-picker` are separate
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

The split to preserve is `auto-cal`'s, and it is now in the registry as two items.
`@cubeui/form-field` is presentational: it takes `error` as a node and asks nothing about where
it came from. `@cubeui/app-form` is the binding — the contexts, `useAppForm`, and `InputField`, `NumberField`,
`TextareaField`, `SelectField`, `CheckboxField`, `SwitchField` and `SubmitButton`, each reading
the store and handing `FormField` a string. `@cubeui/multi-select-field`, `@cubeui/date-field`,
`@cubeui/color-field`, `@cubeui/radio-group-field` and `@cubeui/password-field`
are the same layer in their own files, for the weight of what they import. Keep new work on the right side of that line: a
component that needs the form store goes in `app-form.tsx`, and one that only needs to be told
goes below it. Presentational is what makes each bound field fifteen lines instead of a fork, and
it is what lets a field the binding does not cover yet be written by hand without leaving the set.

`app-form.tsx` is the only file in the registry allowed to import `@tanstack/react-form`. A field
it does not hold is still bound through it: `bindToForm`, `splitProps` and `useFieldError` are
exported for exactly that, so `date-field.tsx` needs no second copy of the render prop and no
opinion about the form library.

**A field's `name` is checked against the form's values, and against their type.** `bindToForm`
takes the value type the control writes, so `<NumberField name="title">` over a string field and
`<DateField name="window">` over a `DateRange` are both build errors. This is the reason
`NumberField` is a component rather than a `type="number"` prop, and the reason `DateRangeField`
is not a `range` prop on `DateField` — rule 2 is about props that only change how something
looks, and neither of these does. A prop cannot narrow `name`, because the constraint on `name`
is fixed before the props are read.

**`FormField` can name a group as well as a control.** `asGroup` swaps the `<label htmlFor>` for
a `FieldTitle` plus an `aria-labelledby` on the control. It exists because HTML will not let a
`<label>` name a `<div role="radiogroup">` — the browser drops the association silently, so the
default wiring produces a field that looks wired in the source and is not. Any grouped control
needs it: a radio group, a segmented control, a swatch grid used as the field itself.
`RadioGroupField` is the one that forced it and is currently the only user.

## Code style

- Biome-enforced: double quotes, semicolons, trailing commas, 2-space indent, 100 line width,
  `import type` for type-only imports, imports organised on save
- Files `kebab-case.tsx`; components `PascalCase`; vars and functions `camelCase`; true
  constants `SCREAMING_SNAKE_CASE`
- Prefix an unused parameter with `_`; `unknown` over `any`, which is an error
- Comments explain **why**, not what. A comment that restates the line below it is noise. The
  comments worth writing here are the ones that say what went wrong without the line
- Tailwind variants are literal class maps (`const SIZES = { sm: "sm:max-w-sm" }`), never
  composed strings — the scanner reads source text, so a built class name is never generated

The full authoring rules are [`docs/component-conventions.md`](docs/component-conventions.md).
The slot vocabulary (`content`, `title`, `description`, `icon`, `action`, `footer`,
`footerActions`, `empty`, `loading`, `<slot>ClassName`) is the part to know before writing a prop.

**No shell takes `children`.** The body is `content`, a prop like every other slot, because in a
layout every part is dynamic and none of them earns the privileged position. A component that
accepts children is a component that has to answer "and what if both were passed?" — see rule 1
of the conventions doc.

## Keep the skill in sync

[`.claude/skills/cubeui/SKILL.md`](.claude/skills/cubeui/SKILL.md) is how an agent in a
*consuming* project learns these components. A new component, a renamed prop or a changed
default is not finished until it is in there. It ships as a registry item, so a stale skill is a
stale skill in every project that installed it.

It is four files, and the split is load-bearing. `SKILL.md` is the router — the install line, the
choosing table, the slot vocabulary, and the rule that no component takes children — and it is
short because it is the part that is always in context. [`layout.md`](.claude/skills/cubeui/layout.md),
[`forms.md`](.claude/skills/cubeui/forms.md) and [`controls.md`](.claude/skills/cubeui/controls.md)
are read when the table sends the agent to one of them. A new item goes in its reference **and**
gets a row in the choosing table; a new slot word goes in `SKILL.md`'s vocabulary and in rule 2
of the conventions doc, because those two are the same list and they are checked against each
other. All four are listed in the `skill` item's `files`, so adding a fifth means editing
`registry.json` too.

## Git

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, with an
  optional scope (`feat(layout): …`). Subject in the imperative, lowercase after the colon, no
  trailing period. The body says why, wrapped at 80
- Run lint, typecheck and the tests before every commit
- Branch for the work; `main` is what CI watches
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

## Surveyed and deliberately not built

Recorded so the next pass does not re-derive them:

- **`AppShell`** (sidebar + header + main). Five apps hand-roll it — kanban, task_server,
  mcp-router, mcp-skills-manager, notes — and the two mcp apps are near-forks (their
  `token-gate.tsx` differs by 4 lines out of 67). Not built: shadcn ships `sidebar`, private project 1
  already uses it, and the answer is four `npx shadcn add sidebar` calls. The genuinely shared
  part between the mcp apps is auth, which is rule 5.
- **The list row** (`badges`, `title`, `meta`, `actions`, `dim`). 99 instances of
  `flex items-start justify-between` across 8 projects, and kanban has already extracted
  `row-card.tsx`. Not built *yet*: nobody has shadcn's `item` installed, and `item` is the
  drawing. Revisit once a project has it — the leftover wiring may be one prop (`dim`) or none.
- **`EmptyState`**. ~30 files hand-roll "no results". shadcn ships `empty`; `CardLayout`
  already has the slot. Install the primitive.
- **`FactGrid`** (private project 1's is excellent — it replaced 10 hand-rolled `<dl>`s and 5 copies of a
  `Fact` helper, one of which had lost its `<dt>`/`<dd>`). Fails rule 1's two-project bar:
  cubicecho has 4 `<dl>` files and they are all in one app.
- **`FormButtons`**. Too bound to private project 1's `isNew`/`isDeleted`/restore vocabulary to port.
- **`SliderField` / a slider control.** Asked for and not built, and the grep that suggested it
  was wrong. Of the eight files matching `<Slider`, three are `rc-slider` — a different library
  with a `Slider.Handle`/`Slider.Range` compound API — three more are a theme demo and a story,
  and exactly one is a real shadcn `Slider`: private project 1's `ut-ui/icon/icon-picker.tsx`, unbound,
  in one project. One call site in one project fails rule 1 twice over. There is also a
  blocker worth writing down: Radix names a thumb only when there are two or more of them
  (`getLabel` returns `undefined` for a single thumb), and shadcn's `Slider` renders its thumbs
  itself and forwards nothing to them — so a single-thumb shadcn slider has an unnamed
  `role="slider"`, which axe reports. Naming it would mean redrawing the primitive, which is
  rule 3. Fix it at the call site with a patched local `slider.tsx` if it ever matters.
- **`RadioGroupField` was built on the shell, not on the evidence.** All 20 `<RadioGroup` uses
  are private project 1's `theme-demo/kitchen-sink.tsx`, `theme-demo/forms-interactions.tsx`, its story
  and the primitive itself; raw `type="radio"` appears once, in kanban's `theme-toggle.tsx`.
  It ships because `asGroup` had to be built anyway and this is what proves it works. Do not cite
  it as precedent for skipping rule 1.
