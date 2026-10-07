# Coding standards ledger

Findings from the `coding-standards` skill's refactor workflow. This file lives at
`.agents/coding-standards-todos.md`. IDs are stable — don't renumber when items are removed.
`(unverified)` marks items inferred from a count or a pattern rather than confirmed hit by hit.
Nothing here is implemented until approved.

Surveyed 2026-10-07 at `7b36eb2`: `registry/` (26,020 lines), `scripts/`, `tokens/`,
`.storybook/` (6,319 lines) and `stories/` (102 files). Baseline: `npm run build` and
`biome check .` clean, 48 node tests and 507 story tests passing. Duplication is 0.27% of
lines (jscpd, five clones), so the reuse items below are the whole list.

No model changes are proposed. The concepts (primitive, shell, bound field, the native
source and its compiled web half, the web-only tier) each have one name and one owner in
`AGENTS.md` and `docs/component-conventions.md`, and the survey found nothing that argues
with them.

## Summary

| Prefix | Kind |
|---|---|
| `R` | Refactor: same behavior, better shape |
| `D` | Comment or doc that no longer matches the code, or runs longer than it needs to |
| `B` | Bug, or near copies that behave differently |
| `A` | Public API change; needs a decision |
| `T` | Test work |

| ID | Kind | What it does | Buys | Needs | Status |
|---|---|---|---|---|---|
| R1 | Refactor [sweep] | Holds `scripts/`, `tokens/` and `.storybook/` to the braces, negation and magic-number rules the registry already passes: 199 unbraced bodies, 82 `!` on logic checks, 64 bare numbers. | The two most-changed code files in the repo (`check-registry-build.mjs`, `compile.mjs`) are in it, and one rule set replaces two. | — | done |
| R2 | Refactor [sweep] | Holds `stories/` to the braces and negation rules (185 unbraced bodies, 10 negations), leaving bare numbers allowed there as in any test. | Stories are what an author copies from when writing a new one; the whole repo then lints one way. | — | done |
| R3 | Refactor [sweep] | Rewrites the `!` on logic checks the plugin cannot see in the registry because the name has no `is`/`has` prefix (`!open`, `!disabled`, `!checked`, `!ok`): about 45 hits in about 30 files. | Finishes P20 in the files apps vendor; #286 only did what the plugin reports. | — | done |
| R4 | Refactor [reuse] | Merges the three identical `messageOf(error)` helpers (native form, web form, radio group field) into one shared module. | Three copies of "what text does a validator's error show" that must change together. | B1 | open |
| B1 | Question | `QueryState`'s `messageOf` is a near copy that answers differently: a non-string `message` and any other value give `""`, where the form copies give `String(error)`. Is that intended? | Decides whether R4 merges three copies or four. | — | open |
| R5 | Refactor [reuse] | Gives the form-binding props type one declaration: `RadioGroupFieldProps` repeats 27 lines of `FormBinding` from the native form. (unverified that the item can import it) | A validator or listener kind added to one is silently missing from the other. | — | open |
| R6 | Refactor [reuse] | Gives the bound-field wrapper one body: the 27-line `FormBoundField` in the native form and in the web `app-form` are the same, cast and comment included. (unverified that the two tiers can share a module) | The one place the form's generic `Field` is cast exists twice. | — | open |
| R7 | Refactor [reuse] | Moves the `CopyButton` component into one place, leaving only `write(text)` split by platform; today both halves carry the same 20-line component. | A prop added to one half and not the other is a native/web drift nothing checks. | — | open |
| R8 | Refactor [readability] | Reads the 12 `as unknown as` casts in the registry and replaces the type-level ones (the two `rest as unknown as TProps`, the focus and document-position probes) with a guard or a typed helper; the React Native to DOM bridges stay, each with its reason. (unverified which are fixable) | These are the casts that switch checking off altogether (P17, worst first). | — | open |
| R9 | Refactor [readability] | Turns the 12 nested ternaries in the registry into an `if` block or a small named function. | P15: a ternary inside a ternary is always an `if`. | — | done |
| D1 | Docs [sweep] | Shortens doc blocks over four sentences: 205 in the registry (112 files), 42 in scripts, 42 in stories. 50 of the registry's run past ten sentences, the longest 48. | P19. Much of the length is history ("what went wrong before"), which belongs to the commit. | — | open |
| D2 | Docs [sweep] | Shortens `//` comments inside bodies that run past two lines: 95 in the registry, 32 in scripts, 17 in stories. | P19. | — | open |
| D3 | Docs [sweep] | Adds the missing doc blocks in the registry: about 44 exported functions, 118 exported types and 23 exported constants have none, plus about 150 internal functions and component parts. (unverified, counted by pattern) | P4. The exported ones are what an app's editor shows on hover. | — | open |
| R10 | Refactor [simplify] | Splits `scripts/rn2web/compile.mjs` (1,026 lines) into one module per pass, along the five numbered divider comments it already has, and removes the 15 dividers. | P5: a file that needs dividers is doing several jobs. It is the third most-changed code file. | — | open |
| A1 | API change | Moves the registry's seven timing and threshold constants (`COPIED_MS`, `SEARCH_DEBOUNCE_MS`, `VISIBLE_MS`, `SPRING_OPEN_MS`, `SPIN_DURATION`, `PULSE_DURATION`, the accent lightness bounds) into one defaults module. Every item that reads one gains a file dependency. | P22: one place answers "what can be tuned". | — | open |
| A2 | API change | Renames the exported `SPIN_DURATION` and `PULSE_DURATION` so the unit is in the name (`…_MS`), as the other timing constants have it. Breaks an app that imports either. | P4: a number says its unit. | — | open |
| R11 | Refactor [sweep] · low value | Names the 191 conditions in the registry that test a comparison or an `&&`/`||` inline, where they do not already read as English. (unverified: the count includes ones that do) | P1. Large diff across files apps diff on update. | — | open |
| T1 | Test [readability] · low value | Replaces the 297 type assertions in stories (50 in `as-child-trigger.stories.tsx`) with typed queries or a small helper. | P17, in test code. | — | open |

## Conventions

The canonical way this codebase does things. New code and refactors follow these.

- A registry item installs as its own files. Sharing code between two items means a
  `registryDependencies` entry, so a merge (P6) costs the consumer a file.
- `registry/ui`, `registry/layout`, `registry/lib` are the shadcn registry's own folder
  names and are public install paths; P21's by-concept folders do not apply to them.
- The shadcn-compatible compound primitives (`Card`, `Dialog`, `Tabs`, …) take `children`,
  by `AGENTS.md`. No shell does. P23 is already met.
- In `.mjs` files a JSDoc `{type}` is the only type there is, so `@param {string} x` stays.
- Context hooks throw with the provider's name (`useToast must be used inside
  <ToastProvider>`), which meets P3.
- Generated and committed: `compiled/`, `public/r/`, `public/index.html`, `dist/`,
  `registry.web.json` → `npm run build`.
- Strict lint rules apply to `registry/**` and `compiled/**` only (`biome.json` override).

## Refactoring

### R1 [sweep] — apply P15, P20 and P16 (numbers) across `scripts/`, `tokens/`, `.storybook/`

**Hits:** `useBlockStatements` 201 (199 scripts, 2 `.storybook`), negation plugin 82 (78
scripts, 4 `.storybook`), `noMagicNumbers` 64 (59 scripts, 5 tokens). Most are in
`scripts/rn2web/compile.mjs` and `scripts/check-registry-build.mjs`. The project's rules
(`AGENTS.md`, README "The cubicecho rules") scope the strict rules to what apps vendor; they
do not ask for the looser style elsewhere. Target: widen the `biome.json` override's
`includes`, braces by `--unsafe` fix in a commit of their own, negations and numbers by
hand. Test files keep `noMagicNumbers` off.

### R2 [sweep] — apply P15 and P20 across `stories/`

**Hits:** `useBlockStatements` 185, negation plugin 10. `noMagicNumbers` would report 264
and stays off: stories are the tests.

### R3 [sweep] — apply P20 to logic checks the plugin misses in `registry/`

**Hits:** about 45 in about 30 files. By name: `open` 7, `disabled` 7, `checked` 6,
`collapsed` 3, `dragged` 3, `event.defaultPrevented` 3, `segmented` 2, `grows` 2, and one
each of `ok`, `dirty`, `droppable`, `shown`, `sameColor`, `forceMount`, `alwaysRender`.
Each is read: a prop typed `boolean | undefined` becomes `!== true`, not `=== false`, and a
toggle (`onOpenChange(!open)`) is a value, not a branch. A rewrite that changes which
branch runs is a `B` item.

### R4 [reuse] — Extract function: one `messageOf`

**File:** `registry/ui/form.tsx:66-80`, `registry/web/app-form.tsx:64-76`,
`registry/layout/radio-group-field.tsx:105-117`. Identical bodies. Target: one function in
`registry/lib/`, read by all three; each item gains the dependency. Needs: B1.

### R5 [reuse] — one declaration of the form-binding props

**File:** `registry/layout/radio-group-field.tsx:54-80`, `registry/ui/form.tsx:700-726`.
`RadioGroupFieldProps` restates `FormBinding`'s `form`, `name`, `validators`,
`asyncDebounceMs` and `listeners`. Target: `FormBinding` exported from the form item and
intersected. (unverified)

### R6 [reuse] — one `FormBoundField`

**File:** `registry/ui/form.tsx:755-781`, `registry/web/app-form.tsx:613-639`. Target: the
wrapper in one module both read. (unverified)

### R7 [reuse] — one `CopyButton` component

**File:** `registry/ui/copy-button.tsx:27-49`, `registry/ui/copy-button.web.tsx:40-62`.

### R8 [readability] — review the twelve `as unknown as`

**File:** `header-content-footer.tsx:221`, `unsaved-changes-guard.tsx:86`, `button.tsx:300-301`,
`form.tsx:771`, `item.tsx:136`, `menu.tsx:72`, `radio-group.tsx:74`, `textarea.tsx:62`,
`theme-preference.tsx:63`, `toast.tsx:65`, `web/app-form.tsx:630`. A further 58 plain `as T`
in 28 files were counted and not filed.

### R9 [readability] — nested ternaries

**File:** `card-layout.tsx:159`, `radio-group-field.tsx:155`, `sidebar.tsx:298,358`,
`alert.tsx:178`, `command.tsx:279`, `date-time-input.tsx:227`, `menu.web.tsx:155`,
`radio-group.tsx:195,197`, `web/form-field.tsx:350`, `web/markdown.tsx:137`.

**Done:** the count above came from a text search and was low. A syntax-tree scan for a
ternary sitting directly in another's test or branch found 28 in 20 files, and all 28 are
rewritten: the inner choice gets a name, or a chain of three or more arms becomes a function
with early returns. `radio-group-field.tsx:155` and `web/markdown.tsx:137` were false hits.

### R10 [simplify] — Split module: `scripts/rn2web/compile.mjs`

**File:** `scripts/rn2web/compile.mjs:56,115,230,279,757` (the dividers: imports, platform,
spreads, elements, types).

---

## Docs

### D1 [sweep] — doc blocks over four sentences

**Hits:** registry 205 in 112 files (5 sentences: 60, 6: 40, 7–10: 64, over 10: 41). Worst:
`action-button.tsx:1` (48), `split-layout.tsx:191` (33), `alert.tsx:1` and `icons.tsx:1`
(31), `badge.tsx:1` (22). Scripts 42 in 14 files, stories 42 in 32. `AGENTS.md` asks that
comments say why and "what went wrong without the line"; it sets no length.

### D2 [sweep] — body comments over two lines

**Hits:** registry 95 in 48 files, scripts 32 in 10, stories 17 in 13.

### D3 [sweep] — missing doc blocks in `registry/`

**Hits:** (unverified) about 44 exported functions, 118 exported types, 23 exported
constants; about 150 internal functions, most of them the parts of the shadcn-compatible
primitives (`DialogHeader`, `SelectItem`, …). `icons.tsx` (47) is excluded.

---

## Bugs

### B1 — `QueryState`'s `messageOf` answers differently

**File:** `registry/layout/query-state.tsx:52-66` against the three in R4. Is the
difference intended?

---

## API changes (need a decision)

### A1 — a defaults module for the registry's tunables

`registry/layout/file-tree.tsx:80`, `registry/lib/color.ts:29-30`,
`registry/ui/spinner-base.ts:20`, `copy-button-base.ts:43`, `tooltip.tsx:79`,
`search-input-base.ts:41`, `skeleton-base.ts:13`.

### A2 — units in `SPIN_DURATION` and `PULSE_DURATION`

`registry/ui/spinner-base.ts:20`, `registry/ui/skeleton-base.ts:13`.

---

## Low value

### R11 [sweep] — apply P1 across `registry/`

**Hits:** 191 of 326 `if`/`while` conditions (unverified).

### T1 [readability] — type assertions in stories

**Hits:** 297 plain, 12 `as unknown as`, in 53 files.
