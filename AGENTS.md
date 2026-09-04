# AGENTS.md — cubeui

A custom [shadcn registry](https://ui.shadcn.com/docs/registry) of layout and form shells for the
cubicecho and simiancraft apps. Consumers install from it with the shadcn CLI:

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
   `~/code/cubicecho/*` and `~/code/simiancraft/Ultrathin/app` is where the evidence is.
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
registry/new-york/form/form-field.tsx                FormField
registry/new-york/form/field-row.tsx                 FieldRow
registry/new-york/form/app-form.tsx                  useAppForm + the TanStack-bound fields
registry/new-york/ui/*.tsx                           shadcn primitives, installed by the CLI
registry.json                                        11 items: 7 components, `layout`, `form`, `skill`
components.json                                      aliases point at `@/registry/new-york`
preview/                                             Vite demo page, `npm run dev`
stories/                                             Storybook, and the tests — every story is one
docs/component-conventions.md                        authoring rules, and the open questions
.claude/skills/cubeui/SKILL.md                       the usage skill, shipped as a registry item
```

`registry/new-york/ui/` is not ours. Every file in it arrived from `npx shadcn add` and is
overwritten by the next one, so Biome's linter is switched off for that path in `biome.json`
(the formatter stays on, so a diff of upstream's file is a diff of upstream's file). Fixing
`noArrayIndexKey` in `field.tsx` would mean fixing it again on the next upgrade, forever.

Sources import each other as `@/registry/new-york/...`; the CLI rewrites those against the
consuming project's own aliases on install. This is verified, not assumed — see open question 4
in `docs/component-conventions.md`.

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
it came from. `@cubeui/app-form` is the binding — the contexts, `useAppForm`, and `InputField`,
`TextareaField`, `SelectField`, `CheckboxField`, `SwitchField` and `SubmitButton`, each reading
the store and handing `FormField` a string. Keep new work on the right side of that line: a
component that needs the form store goes in `app-form.tsx`, and one that only needs to be told
goes below it. Presentational is what makes each bound field fifteen lines instead of a fork, and
it is what lets a field the binding does not cover yet be written by hand without leaving the set.

`app-form.tsx` is the only file in the registry allowed to import `@tanstack/react-form`.

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
| `~/code/simiancraft/Ultrathin/app/layouts/` | `header-content-footer`, `sticky-header-content-footer`, `split-pane` — the chassis this set is built on, and the best commentary on *why* a layout is a component |
| `~/code/cubicecho/ai_tools/kanban_server/web/components/` | `form-dialog`, `confirm-button`, `board-card` — a shell that already exists, and what it cost to not have one |
| `~/code/cubicecho/ai_tools/mcp/mcp-router/app/src/components/` | `workspace-dialog`, `members-card`, `connect-card` |
| `~/code/cubicecho/apps/eunomia/apps/web/src/components/` | `confirm-delete`, `rules/*-card`, `dashboard/stat-tiles` |
| `~/code/cubicecho/apps/philotes/app/src/components/layouts/` | `section`, `header`, and `dashboard/widget` |
