# Survey: hand-written components that cubeui already replaces

**Scope:** `auto-cal`, `philotes`, `mcp-router`, `mcp-skills-manager`. 146 source files (tests
and stories excluded). Dated 2026-09-04, against registry v15-items.

This is the "port the call sites" list rule 6 asks for. It says what to delete, not what to build.

**Extended by [`remaining-cubicecho-projects.md`](./remaining-cubicecho-projects.md)**, which covers
`notes`, `personal-dashboard`, `eunomia`, `kanban_server`, `min-agent`, `task_server` and `rp-tools`.
It moves the compatible set from two projects to five, and changes the suggested order below —
`eunomia` is the cheaper first port.

---

## 0. Read this first: only two of the four can install cubeui

| Project | Renderer | Tailwind | Radix | Verdict |
| --- | --- | --- | --- | --- |
| **mcp-router** | DOM | **4.3.2** | `radix-ui` 1.6.1 | **Drop-in today** |
| **mcp-skills-manager** | DOM | **4.3.2** | `radix-ui` 1.6.1 | **Drop-in today** |
| philotes | DOM (Expo Router, but 254 `<div>`, 10 `<h1>`, and only 3 files import `react-native` — `lib/auth.ts`, `hooks/use-dark-mode.ts`, `app/_layout.tsx`) | **3.4.17** | individual `@radix-ui/*` | **After a Tailwind v4 upgrade** |
| auto-cal | **React Native + NativeWind**, 78 files import `react-native` | 3.4.17 | individual | **Out of scope** |

**auto-cal cannot take these components and should not be asked to.** It runs a
platform-split UI layer — `input.tsx` beside `input.web.tsx`, and the same for dialog, select,
switch, tabs, popover, label, calendar, tooltip, icons — so its screens render `<View>` and
`<Text>`, not `<div>` and `<h1>`. cubeui is DOM-only. Its role in this registry is the one it
already has: it is the **source** of `@cubeui/app-form`, not a consumer of it. Nothing below is
addressed to auto-cal except §6.

philotes is a real consumer wearing the wrong Tailwind. cubeui uses v4-only syntax
(`max-w-(--breakpoint-2xl)`), so the port is blocked behind one upgrade, not behind any
component work.

---

## 1. `PageLayout` — 19 hand-written page shells

Every one is some spelling of `overflow-y-auto` + `mx-auto max-w-*` + an `<h1>` + a button row.

**mcp-router** (7) — `routes/workspaces.tsx:60`, `browse.tsx:120`, `registries.tsx:109`,
`index.tsx:24`, `workspaces_.$slug.tsx:95`, `settings.tsx:87`, `servers.$name.tsx:118`

**mcp-skills-manager** (4) — `routes/workspaces.tsx:92`, `index.tsx:156`, `settings.tsx:155`,
`domain/skill/markdown-preview.tsx:19`

**philotes** (8) — `app/login.tsx:38`, `app/(app)/index.tsx:290`,
`app/(app)/settings/index.tsx:62`, `app/(app)/persons/[id]/index.tsx:517`,
`persons/[id]/timeline.tsx:102`, `persons/[id]/dates/[dateId].tsx:92`,
`domain/label/list.tsx:92`, `domain/person/list.tsx:252`

**The drift, measured.** philotes writes its page title eight times as `text-2xl` and three times
as `text-3xl`; within those, `person/list.tsx:252` is `font-bold text-2xl` and
`settings/index.tsx:62` is `text-2xl font-semibold` — the same heading, two weights, one app. The
mcp apps agree on `text-2xl`, which is a *fourth* answer from `PageHeader`'s `text-xl` at level 1
and worth knowing before the port.

The columns disagree too: philotes settings caps at `max-w-2xl`, its person detail does not cap
at all, mcp-router's routes have no column and run to the pane edge.

**Port:** `PageLayout` with `width="prose"` for settings/detail/login, `width="page"` for the
lists. `headerContent` takes the search field and the tab bar.

## 2. `CardLayout` — 45 hand-written card headers

`<CardHeader><CardTitle>…</CardTitle><CardDescription>…</CardDescription></CardHeader>` written
out in full: **mcp-router 14**, **mcp-skills-manager 7**, **philotes 6**, auto-cal 18 (native,
out of scope).

The ones worth doing first are the ones that also hand-draw an empty state or a loading state,
because that is the part `CardLayout` actually decides:

- `mcp-router/routes/workspaces.tsx:75-90` — a whole `<Card>` built by hand to say "No workspaces
  yet", with the New-workspace button repeated inside it. This is the `empty` slot.
- `mcp-router/routes/workspaces.tsx:71` — `{isPending && <Skeleton className="h-32 w-full" />}`
  above the card rather than inside it, so the layout jumps when the data lands. This is
  `loading`.
- `mcp-router/components/layouts/token-gate.tsx:*` and its mcp-skills twin — the same card, 4
  lines apart across the fork.
- `philotes/components/settings/{export-calendar-card,export-people-card,google-csv-import-card}.tsx`
  — three cards, one shape.

## 3. `DialogLayout` — 4 dialogs with the exact bug AGENTS.md was written about

```
mcp-router/.../browse/install-dialog.tsx:140      max-h-[85vh] overflow-y-auto sm:max-w-lg
mcp-router/.../workspace/workspace-dialog.tsx:201  max-h-[85vh] overflow-y-auto sm:max-w-2xl
mcp-router/.../server/add-server-dialog.tsx:249    max-h-[85vh] overflow-y-auto sm:max-w-lg
mcp-skills/.../workspace/workspace-dialog.tsx:83   max-h-[90vh] overflow-y-auto sm:max-w-lg
```

`overflow-y-auto` on `DialogContent` scrolls the *whole* dialog, so on a long form the title
leaves the screen first and Save is somewhere past the end of the fields. All four are that bug.
And the fork proves the prediction: mcp-skills-manager says **90vh** where its parent says 85vh —
nobody decided that.

philotes has 18 `<DialogContent>` and mcp 5 more without the cap; those are ordinary ports.

## 4. `ConfirmButton` — 9 inline confirms

`mcp-router`: `routes/workspaces.tsx:147`, `registries.tsx:144`, `servers.$name.tsx:145`,
`workspaces_.$slug.tsx:119`, `domain/server/list.tsx:162`.
`mcp-skills-manager`: `routes/index.tsx:83`, `routes/workspaces.tsx:61`.
`philotes`: `domain/person/list.tsx:131`, `app/(app)/persons/[id]/index.tsx:559`.

**Two are live defects, not just duplication.** `mcp-router/routes/workspaces.tsx:158` and its
sibling render `<AlertDialogAction>` with no `variant`, so the button that deletes a workspace is
the default primary colour while the trash icon that opened it is `text-destructive`. The
descriptions here are mostly good — "The workspace's endpoint stops responding. The underlying
servers and their global configuration are not affected." is exactly what the required
`description` prop is asking for — so this port is nearly free.

## 5. `ActionButton` — 62 icon buttons

mcp-router 20, mcp-skills-manager 13, philotes 9, auto-cal 20 (out of scope). The mcp apps label
most of theirs (`aria-label={`Edit ${workspace.name}`}`) and philotes labels its call/mail/delete
row, so the *name* half of the win is smaller here than in kanban. The `aria-disabled` half is
not: every disabled icon button in these four is `disabled`, so every tooltip on one is dead.

Lowest priority of the five. Port opportunistically, with the file you are already in.

## 6. `FormField` / `FieldRow` / `useAppForm` — 57 hand-written field blocks

mcp-router 26, philotes 14, mcp-skills-manager 13, auto-cal 4.

The mcp apps are the awkward case and should be read before anyone starts: **neither has
TanStack Form**, and both drive their forms with `useState` per field —
`workspace-dialog.tsx:210-232` is `const [name, setName]`, `const [description, setDescription]`,
`onChange={(event) => setName(event.target.value)}`, and no validation or error display at all.
So the port is not "swap the markup", it is "adopt TanStack Form", which is a real change and a
new dependency. Worth it — they have 39 field blocks between them and no error handling — but it
is a project, not a sweep.

Their markup drift is already visible: `workspace-dialog.tsx:218` gives a field description
`font-mono text-xs text-muted-foreground` and `:337` gives a field label `text-xs`, against
`FieldDescription`'s `text-sm`. Two type scales inside one dialog.

philotes **already has** `@tanstack/react-form@^1.28.0`, so its 14 field blocks are a direct
`app-form` port once Tailwind v4 lands.

`FieldRow` targets: `philotes/domain/person/form.tsx`, `philotes/app/(app)/index.tsx`,
`mcp-router/routes/browse.tsx`, `mcp-skills/domain/skill/{new-skill,upload-skill}-dialog.tsx`.

---

## Suggested order

1. **mcp-router** — the only project where every item lands unmodified. 7 pages, 14 cards,
   3 dialogs, 5 confirms. Do it first and it becomes the reference port AGENTS.md rule 6 wants.
2. **mcp-skills-manager** — same work, smaller, and porting both is what stops the fork drifting
   further (it is already at 90vh vs 85vh).
3. **philotes** — after the Tailwind v4 upgrade. Then it is the best `app-form` consumer, since
   it already has the dependency.
4. **auto-cal** — nothing to port. Keep reading it as the source for form design.

## Not cubeui's job, found on the way

- Nobody here has shadcn's `item` or `empty` installed; both would delete more markup than any
  cubeui component in this survey.
- philotes `app/(app)/settings/index.tsx:66-80` hand-rolls a tab bar. shadcn ships `tabs`.
- `mcp-router` and `mcp-skills-manager` share `token-gate.tsx` at a 4-line diff over 67 lines.
  That is auth, not layout — it wants a shared package, not a registry item.
