# Survey addendum: the rest of cubicecho

**Scope:** `notes`, `personal-dashboard`, `eunomia`, `kanban_server`, `min-agent`, `task_server`,
`rp-tools`. Both passes at once — what is hand-written and replaceable, and what was already
wrapped. Dated 2026-09-04. Companion to `hand-written-replaceable.md` and `wrapped-components.md`.

---

## 0. Stack matrix

| Project | UI | React | Tailwind | Radix | Verdict |
| --- | --- | --- | --- | --- | --- |
| **eunomia** (`apps/web`) | DOM, 47 tsx | 19.2.8 | **4.3.3** | `radix-ui` 1.6.7 | **Drop-in today** |
| **kanban_server** | DOM, 71 tsx | 19.2.8 | **4.3.3** | `radix-ui` 1.6.7 | **Drop-in — and it is the source** |
| **task_server** | DOM, 26 tsx | 19.2.8 | **4.3.3** | `radix-ui` 1.6.7 | **Drop-in — and it is the source** |
| rp-tools | DOM, 21 tsx | **18.3.1** | **3.4.14** | 8 × `@radix-ui/*` | Two upgrades away |
| notes (`app`) | React Native + NativeWind | 19.2.3 | 3.4.17 | — | Out of scope |
| min-agent (`mobile`) | React Native + NativeWind **5** | 19.2.3 | **4.3.3** | — | Out of scope (RN), but see §4 |
| eunomia (`apps/app`) | React Native / Expo | 19.2.3 | — | — | Out of scope |
| personal-dashboard | **Not React.** 445 lines of vanilla JS, 125 of hand-written CSS, zero `.tsx` | — | — | — | Nothing to survey |

So the compatible set grows from two to **five**: mcp-router, mcp-skills-manager, **eunomia**,
**kanban_server**, **task_server**.

---

## 1. The finding that matters: kanban_server ↔ task_server is a second fork pair, and it has
   drifted much worse than the mcp one

Three components exist in both, under the same names:

| Component | kanban | task_server | Diff lines |
| --- | --- | --- | --- |
| `model-select.tsx` | 123 | 106 | **43** |
| `run-stream.tsx` | 233 | 236 | **157** |
| `mcp-dialog.tsx` | 318 | 331 | **381** |

`mcp-dialog` is 381 diff lines over ~325 — the two copies now share almost nothing but their
purpose. The reason is visible in the first twenty lines of the diff:

```diff
- import { useFieldError } from "@/components/field-error";
- import { FormDialog } from "@/components/form-dialog";
- import { ProbeResult } from "@/components/probe-result";
- import { useDirty } from "@/lib/dirty";
+ import { Field } from "@/components/field";
+ import { Dialog, DialogContent, DialogDescription,
+          DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
```

**kanban extracted four helpers; task_server did not, and inlined the dialog instead.** Same
feature, same author, one fork that refactored and one that didn't. The mcp pair drifted by a
number (`85vh` vs `90vh`); this pair drifted structurally.

This is the strongest argument in any of the three surveys for a shared registry, because it is
the failure happening *between two projects that already know about each other*.

## 2. `FormDialog` — the best component in any of these repos, and it is stranded

`kanban_server/web/components/form-dialog.tsx` (103 lines). Its doc comment is the thesis:

> Every one had written out the same shell … and the thing worth noticing is what that cost. Six
> closed through `useDiscardGuard`, so Escape or a stray click on the overlay asks before it
> throws away what you typed; the seventh wired `onOpenChange` straight into its `onClose` and
> quietly lost it. That is not a bug anybody introduced, it is the one copy that was written
> before the guard existed and never caught up, and a shell is how it stops happening: the guard
> is not a thing a caller can forget, because a caller cannot see it.

auto-cal wrote its own (`ui/form-dialog.tsx`, 92 lines). Private project 1 wrote three
(`basic-edit-dialog`, `dialog`, `dialog-renderer`). That is **three projects**.

cubeui has `DialogLayout` and `app-form`, which cover the *layout* and the *fields*. Neither
covers the part kanban's comment is actually about: **the discard guard**. A dialog holding a
dirty form that closes without asking is the same defect in every app, and it is exactly the kind
of thing a caller cannot forget if the shell owns it.

**Candidate: `useDiscardGuard` + a `dirty` prop on `DialogLayout`.** It is a hook plus one prop,
not a new component. `dirty` stays *asked for* rather than computed — kanban already worked out
why: "only the caller knows what its fields are."

Worth noting for rule 5: this holds `open` state, but so does `ConfirmButton`, and for the same
reason — the state is about the shell's own interaction, not the app's data.

## 3. `ThemeToggle` — six projects, six implementations

`kanban_server/web/components/theme-toggle.tsx` + `web/lib/theme.ts`,
`philotes/hooks/use-dark-mode.ts` + `settings/index.tsx`,
`notes/src/context/ThemeContext.tsx` + `app/(app)/settings.tsx`,
`mcp-router/layouts/app-layout.tsx` (`SunIcon`/`MoonIcon` inline),
`mcp-skills-manager/layouts/app-layout.tsx` (same, inline),
`auto-cal/app/(app)/_layout.tsx`.

Six projects, and no two of them agree on where the toggle lives, whether the choice persists, or
whether "system" is a third state.

**But I would not build it**, and the reason is rule 5. A theme toggle reads and writes
`localStorage`, touches `document.documentElement`, and has to run before first paint to avoid a
flash. That is app infrastructure, not a shell — the same call cubeui already made on `token-gate`
and the query components. If it goes anywhere it is a shared *hook* package, not a registry item.

Flagging it because six is a striking number and you may disagree; it is the one candidate here
where I think the count argues one way and the rules argue the other.

## 4. Confirming three earlier "don't build" calls, with new evidence

**`EmptyState` — the call holds, and now the reason is sharper.** Two more hand-written ones:
`kanban/empty-state.tsx` (55 lines) and `eunomia/empty-state.tsx` (10). Both land on
`border-dashed` + `text-center` + `text-muted-foreground`, from opposite directions — kanban's
carries an icon, a title, a description and an action, eunomia's is a single `<p>`.

kanban's doc comment is worth quoting because it is the argument *for* shadcn's `empty`:

> There were three qualities of this in the app at once — an illustrated card on MCP servers, one
> line of muted text on Tasks, and nothing whatsoever on Roles — and an empty page that says
> nothing is indistinguishable from one that has not loaded.

Four hand-written empty states across four projects, and **not one of these projects has run
`shadcn add empty`**. The action item is a CLI command, not a component.

**`QueryState` — rule 5 confirmed, from both sides.** kanban's (36 lines) takes the query object
itself, including `refetch`. auto-cal's (29 lines) takes plain `loading`/`error` booleans. Same
name, same "return null once there is data" contract, and auto-cal's is the one that obeys rule 5.
cubeui already expresses this as `loading` and `empty` props *inside* `CardLayout` and
`PageLayout`, which is the right place for it. No new item.

**The list row — still not yet.** kanban `row-card.tsx` (51) and `disclosure-row.tsx` (79),
private project 1's `line-item-row.tsx` (158) and `card-link.tsx` (36), eunomia's six `*-card.tsx` panels.
Five implementations now. But the earlier reason still stands: shadcn ships `item`, and nobody has
installed it. Same action item as `empty`.

**min-agent's `components/ui.tsx` is 716 lines** — an entire UI kit in one file, React Native, so
out of scope. Recording it only because it is the clearest picture of what "no registry" looks
like at the end.

## 5. Ordinary ports, by project

**eunomia** — drop-in today, and the best `CardLayout` target found anywhere: **14 `CardHeader`
blocks** and six `*-card.tsx` panels (`entries-card`, `merges-card`, `categories-card`,
`category-rules-card`, `context-rules-card`, `top-apps`) that are all the same shape. Plus 4
`DialogContent`, 10 `<Label>` blocks, and `confirm-delete.tsx` → `ConfirmButton`. Small app, high
density, no blockers. **This is the cheapest complete port available.**

**task_server** — 26 files, 1 `max-h-[Nvh]` dialog, 17 icon buttons, 10 `<Label>` blocks, and
`app-shell.tsx` at 76 lines (already cited as `PageLayout` source material). Its real work is
§1: re-converging on kanban's three components.

**kanban_server** — 75 `<Label>` blocks, 26 icon buttons, 5 `AlertDialogContent`, 2 `max-h-[Nvh]`
dialogs. It is the source of `ActionButton`, `ConfirmButton` and `PageLayout`, so the port here is
mostly *deleting the originals and importing them back* — which is also the only way to find out
whether the extraction actually preserved them.

**rp-tools** — 21 files, 3 dialogs (2 with `max-h-[Nvh]`), no wrapped components at all; every
file is domain. React 18 + Tailwind 3 puts it two upgrades away, and at 21 files the port is
probably not worth the upgrade on its own.

---

## What this changes

1. **`eunomia` is the port to do first**, not mcp-router. Same zero-blocker stack, fewer files,
   and a much higher density of the one shape (`CardLayout`) that is already shipped and tested.
2. **kanban ↔ task_server needs deciding before either is ported.** Porting one and not the other
   widens a gap that is already 381 lines on one file.
3. **Run `shadcn add empty` and `shadcn add item` in the five compatible projects.** Between them
   they retire four hand-written empty states and five hand-written list rows — more markup than
   any cubeui component in these surveys — and cost nothing to build.
4. **One new candidate:** `useDiscardGuard` + `dirty` on `DialogLayout` (§2). Three projects,
   and it closes a defect class rather than just a duplication.
5. **One I am flagging but not recommending:** `ThemeToggle` (§3). Six projects, but rule 5 says
   hook, not shell. Your call.
