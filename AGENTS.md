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
3. **Do not wrap what shadcn already ships.** Re-exporting `Card` with a `cn` around it adds a
   file and removes nothing. The shell exists to answer "where does this node go", once.
4. **Compose, do not re-derive.** `HeaderContentFooter` is the only implementation of "chrome
   that stays, a middle that moves". `DialogLayout` composes it. A shell that reimplements a
   shape another shell already owns is the exact bug this registry is against.
5. **Shells hold no state, no data, no routing, no toasts.** They take nodes and place them.
   Behaviour that needs state belongs to the caller or to a form component.
6. **Port the call sites.** A component landing here without at least one app updated to use it
   is a component nobody has proven. Say which app, in the PR.

## Status

Early. What exists today:

```
registry/layout/header-content-footer.tsx   HeaderContentFooter, StickyHeaderContentFooter
registry/layout/card-layout.tsx             CardLayout
registry/layout/dialog-layout.tsx           DialogLayout
docs/component-conventions.md               authoring rules, and the open questions
.claude/skills/cubeui/SKILL.md              the usage skill, shipped as a registry item
```

`registry.json`, `components.json`, the preview site and the tooling are **not scaffolded yet**,
and the open questions at the bottom of `docs/component-conventions.md` are unsettled — most of
all where installed files land and how registry items import each other. Do not add a build step
that assumes an answer to those without settling it.

## Stack

- **TypeScript 5**, strict, ESM only
- **React 19**, **Tailwind v4**, **radix-ui** (the unified package), **lucide-react**
- **shadcn** CLI for `build`; new-york is the reference style, but components must survive being
  installed into any of them
- **Biome** for lint and format
- **Vite** for the preview site (planned)

Registry sources import `cn`, shadcn primitives, react, lucide, and other cubeui items — nothing
else. Anything further is a dependency every consuming project has to be told about.

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
The slot vocabulary (`title`, `description`, `icon`, `action`, `footer`, `footerActions`,
`empty`, `children`, `<slot>ClassName`) is the part to know before writing a prop.

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
