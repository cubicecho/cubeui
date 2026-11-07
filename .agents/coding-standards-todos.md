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

Surveyed again 2026-11-06 at `d786929` (branch `refactor/layouts`): the 29 files of
`registry/layout/` (7,359 lines), the primitives they build on, and how the 19 apps that
install cubeui use them. Baseline: `npm run check` green, 656 tests in 122 files. The model is
`.agents/domain-model.md`.

## Model changes

Approved at Gate 1 on 2026-11-06. Each is written into `.agents/domain-model.md` by the commit
that makes it true.

| ID | Change | Why it is simpler | Status |
|---|---|---|---|
| M1 | One page shell, `PageLayout`. `Page` and `DetailPage` go, with `PageInsetContext`; `CardGrid` becomes its own item. | Two shells did one job, and `Page`'s docs defer to `PageLayout`. `PageLayout` has 93 app sites in 16 apps, `Page` 1, `DetailPage` 0. | approved |
| M2 | A record that is not found is a `QueryState` step, so the guard works inside any shell. | `DetailPage` owned it but nobody used it; philotes, telos and llm-router build it by hand six times. | approved |
| M3 | `StickyHeaderContentFooter` is `HeaderContentFooter` with `scroll`. | A six-line preset of one prop and one class, which apps already write out. | approved |
| M4 | One title block, `PageHeader`. `DetailHeader` goes. The back link and the breadcrumb trail share one slot, `backSlot`; `iconSlot` stays the page's own icon. | `DetailHeader` has no users, and `PageHeader` already documents both its extras. Apps split today between `iconSlot` and `breadcrumbsSlot` for a back link. | approved |
| M5 | One app bar, `AppBar`, which `SidebarLayout` draws on a phone. `TopBarLayout` goes; a top-bar app is `HeaderContentFooter` with an `AppBar` in its header. | The bar existed twice and had drifted. `TopBarLayout` has no users. | approved |
| M6 | `DialogLayout` is a `CardLayout` on the floating surface: the modal, plus the card's parts at the dialog's inset, with the title naming the dialog, the body scrolling and the footer stacking on a phone. | Six shared props and a footer row copied word for word. `CenteredLayout` already places a `CardLayout`. | approved |
| M7 | `Section` is a heading over a group. Its `surface="card"` goes; a titled card is `CardLayout`. | Two ways to draw a titled card; apps pick one family each. | approved |
| M8 | One row, `ListItem`. `DisclosureRow` is a `ListItem` that opens, with `Disclosure`'s toggle, which `FileTree`'s folders share. `Item` stays as shadcn's parts only. | Two parallel row systems and three copies of the toggle. | approved |
| M9 | `SectionHeading` is the small heading that `Section` and `SidebarSection` draw. | Its classes are re-spelled in both. | approved |
| M10 | `ConfirmButton`, `Combobox` and `useUnsavedChangesGuard` are components, and `RadioGroupField` is a bound field; none lives in `registry/layout/`. | They are not shells. | approved |
| M11 | Layout names say more plainly what each one places. | Proposed after the merges, so each item is named once. | approved; names to propose |

## Summary

| Prefix | Kind |
|---|---|
| `R` | Refactor: same behavior, better shape |
| `D` | Comment or doc that no longer matches the code, or runs longer than it needs to |
| `B` | Bug, or near copies that behave differently |
| `A` | Public API change; needs a decision |
| `T` | Test work |
| `M` | Model change |
| `F` | Feature work the model makes room for |

| ID | Kind | What it does | Buys | Needs | Status |
|---|---|---|---|---|---|
| R1 | Refactor [sweep] | Holds `scripts/`, `tokens/` and `.storybook/` to the braces, negation and magic-number rules the registry already passes: 199 unbraced bodies, 82 `!` on logic checks, 64 bare numbers. | The two most-changed code files in the repo (`check-registry-build.mjs`, `compile.mjs`) are in it, and one rule set replaces two. | — | done |
| R2 | Refactor [sweep] | Holds `stories/` to the braces and negation rules (185 unbraced bodies, 10 negations), leaving bare numbers allowed there as in any test. | Stories are what an author copies from when writing a new one; the whole repo then lints one way. | — | done |
| R3 | Refactor [sweep] | Rewrites the `!` on logic checks the plugin cannot see in the registry because the name has no `is`/`has` prefix (`!open`, `!disabled`, `!checked`, `!ok`): about 45 hits in about 30 files. | Finishes P20 in the files apps vendor; #286 only did what the plugin reports. | — | done |
| R4 | Refactor [reuse] | Merges the three identical `messageOf(error)` helpers (native form, web form, radio group field) into one shared module. | Three copies of "what text does a validator's error show" that must change together. | B1 | done |
| B1 | Question | `QueryState`'s `messageOf` is a near copy that answers differently: a non-string `message` and any other value give `""`, where the form copies give `String(error)`. Is that intended? | Decides whether R4 merges three copies or four. | — |done |
| R5 | Refactor [reuse] | Gives the form-binding props type one declaration: `RadioGroupFieldProps` repeats 27 lines of `FormBinding` from the native form. (unverified that the item can import it) | A validator or listener kind added to one is silently missing from the other. | — |done |
| R6 | Refactor [reuse] | Gives the bound-field wrapper one body: the 27-line `FormBoundField` in the native form and in the web `app-form` are the same, cast and comment included. (unverified that the two tiers can share a module) | The one place the form's generic `Field` is cast exists twice. | — |done |
| R7 | Refactor [reuse] | Moves the `CopyButton` component into one place, leaving only `write(text)` split by platform; today both halves carry the same 20-line component. | A prop added to one half and not the other is a native/web drift nothing checks. | — | done |
| R8 | Refactor [readability] | Reads the 12 `as unknown as` casts in the registry and replaces the type-level ones (the two `rest as unknown as TProps`, the focus and document-position probes) with a guard or a typed helper; the React Native to DOM bridges stay, each with its reason. (unverified which are fixable) | These are the casts that switch checking off altogether (P17, worst first). | — | done |
| R9 | Refactor [readability] | Turns the 12 nested ternaries in the registry into an `if` block or a small named function. | P15: a ternary inside a ternary is always an `if`. | — | done |
| D1 | Docs [sweep] | Shortens doc blocks over four sentences: 205 in the registry (112 files), 42 in scripts, 42 in stories. 50 of the registry's run past ten sentences, the longest 48. | P19. Much of the length is history ("what went wrong before"), which belongs to the commit. | — | partly done |
| D2 | Docs [sweep] | Shortens `//` comments inside bodies that run past two lines: 95 in the registry, 32 in scripts, 17 in stories. | P19. | — | open |
| D3 | Docs [sweep] | Adds the missing doc blocks in the registry: about 44 exported functions, 118 exported types and 23 exported constants have none, plus about 150 internal functions and component parts. (unverified, counted by pattern) | P4. The exported ones are what an app's editor shows on hover. | — | partly done |
| R10 | Refactor [simplify] | Splits `scripts/rn2web/compile.mjs` (1,026 lines) into one module per pass, along the five numbered divider comments it already has, and removes the 15 dividers. | P5: a file that needs dividers is doing several jobs. It is the third most-changed code file. | — | done |
| A1 | API change | Moves the registry's seven timing and threshold constants (`COPIED_MS`, `SEARCH_DEBOUNCE_MS`, `VISIBLE_MS`, `SPRING_OPEN_MS`, `SPIN_DURATION`, `PULSE_DURATION`, the accent lightness bounds) into one defaults module. Every item that reads one gains a file dependency. | P22: one place answers "what can be tuned". | — | open |
| A2 | API change | Renames the exported `SPIN_DURATION` and `PULSE_DURATION` so the unit is in the name (`…_MS`), as the other timing constants have it. Breaks an app that imports either. | P4: a number says its unit. | — |done |
| R11 | Refactor [sweep] · low value | Names the 191 conditions in the registry that test a comparison or an `&&`/`||` inline, where they do not already read as English. (unverified: the count includes ones that do) | P1. Large diff across files apps diff on update. | — | open |
| T1 | Test [readability] · low value | Replaces the 297 type assertions in stories (50 in `as-child-trigger.stories.tsx`) with typed queries or a small helper. | P17, in test code. | — | open |
| R12 | Refactor [sweep] | Rewrites the `!` on a plain identifier that the lint plugin cannot see in `scripts/` (`if (!classes)` in `passes/elements.mjs` is one). (unverified count) | Finishes P20 in scripts, as R3 did in the registry. | — | open |
| R13 | Refactor [simplify] | Splits `transformElement` in `scripts/rn2web/passes/elements.mjs`, which is about 205 of that file's 559 lines. | The pass R10 left largest. | — | open |
| B2 | Bug | A `Button` with a DOM element as its `linkSlot` handed it `onPress` on the react-native-web half, which React drops: the press never ran, and the story run logged `Unknown event handler property onPress`. Fixed: a DOM link takes the press as `onClick`. `button-as-child.stories.tsx` pins it. | A press handler the web silently dropped. | — | done |
| T2 | Test [pin] | Pins `DialogLayout` and `CardLayout` before M6: the title names the dialog, the header, body and footer placement, the footer stacking below `sm`, only the dialog body scrolling, the discard question; the card's empty, loading and footer groups. (unverified how much the stories already hold) | M6 rebuilds both; 104 and 185 app sites. | — | done (`f8d5db2`) |
| T3 | Test [pin] | Pins the toggle of `Disclosure`, `DisclosureRow` and a `FileTree` folder: `aria-expanded`, `aria-controls` only while open, the body not mounted while shut. | R15 merges the three. | — | done (`3bbb342`) |
| R14 | Refactor [reuse] | `Section`'s and `SidebarSection`'s titles draw `SectionHeading variant="overline"` instead of re-spelling its classes. | M9. | — | done (`22bb4a2`) |
| R15 | Refactor [reuse] | One disclosure trigger, from `Disclosure`, used by `DisclosureRow` and `FileTree`'s folder rows. | M8: three copies of the same press, chevron and ARIA. | T3 | done (`b32252d`) |
| R16 | Refactor [reuse] | One router-link helper for `ListItem` and `FileTree`, which copy it almost line for line. | Two copies of how a row becomes a link. | — | done (`e5cf5f4`) |
| A3 | API change | `DisclosureRow` becomes a `ListItem` that opens, built on `ListItem` and R15's trigger instead of `Item`; its padding and surface follow `ListItem`. | M8. 8 app sites in 5 apps change look slightly. | R15 | done (`00f89af`) |
| B3 | Question | A chosen `ListItem` is `bg-active/40`, a chosen `FileTree` row `bg-active`. First answered as "tinted" (done in `50ed231`); then reversed by B8: every chosen row is solid `bg-active`, and `bg-active/90` under the pointer. | One chosen-row look. | — | done (`50ed231`) |
| R17 | Refactor [reuse] | `DialogLayout` imports `CardLayout`'s footer row and footer-start grouping instead of copying them. | M6's first, behaviour-preserving step. | T2 | done (`7d77733`) |
| R18 | Refactor [reuse] | One folded-description part for `CardLayout`, `Section` and `SettingRow`. | Three copies of the same fold into a popover. | — | done (`4190de8`) |
| F1 | Feature | `DialogLayout` renders `CardLayout` on the floating surface; dialogs gain `iconSlot`, a header action, `loading` and `emptySlot`. | M6. | T2, R17, R18 | done (`2fb6fdd`) |
| A4 | API change | Removes `Section`'s `surface` prop. Its 53 app sites (philotes 24, glances 14, heautou 8, others) move to `CardLayout`. | M7. | — | done (`3010aaa`) |
| R19 | Refactor [reuse] | `Section` and `CardLayout` share one heading row, keeping their different text-column floors as a parameter. | Two near-identical heading rows. | A4, T2 | done (`e61dc46`) |
| F2 | Feature | `QueryState` takes a record that is not found, drawn as `DetailPage` draws it today. | M2; replaces six hand-built guards. | — | done (`e587cc3`) |
| A5 | API change | Removes the `page` and `detail-page` items and `PageInsetContext`; stories move to `PageLayout`. | M1. | F2, A6 | done (`62b2c87`) |
| A6 | API change | `CardGrid` becomes its own item, `GridLayout` (`grid-layout`): equal cells in 1 to 4 columns by width, for any content, not only cards. 5 app sites in 3 apps change their import and name. | M1: it has to leave `page`. | — | done (`86f0c2f`) |
| A7 | API change | Removes `StickyHeaderContentFooter`; `Sidebar` and 14 app sites in 4 apps pass `scroll` instead. | M3. | — | done (`a9ef8ea`) |
| B4 | Question | Why do min-agent, ragdown, telos and zeromem build a `PageLayout` by hand from `HeaderContentFooter` and `PageHeader`? If `PageLayout` lacks something they need, a feature item follows. (unverified) | Finishes M1 and M3: one page shell that every app can use. | — | answered: F4, F5 |
| A8 | API change | `PageHeader`'s `breadcrumbsSlot` becomes `backSlot`, with the old name kept for one release. Apps' back buttons in `iconSlot` (llm-router 3, mcp-router 2) move to it. | M4. | — | done (`5371142`) |
| A9 | API change | Removes the `detail-header` item; stories use `PageHeader`. | M4; no app installs it. | A8 | done (`09f88d3`) |
| F3 | Feature | `AppBar`: one bar item (brand, places, status, actions) from `SidebarLayout`'s phone bar, with `TopBarLayout`'s sideways-scrolling places. `SidebarLayout` draws it. | M5. | — | done (`e0d0c13`) |
| A10 | API change | Removes the `top-bar-layout` item. | M5; no app uses it. | F3 | done (`2b4ff2e`) |
| R20 | Refactor [consistency] | Moves `confirm-button`, `combobox`, `unsaved-changes-guard` and `radio-group-field` from `registry/layout/` to `registry/ui/`. Their type decides where they install, so apps are unaffected. | M10. | — | done (`98e0aaa`) |
| A11 | API change | Retypes `radio-group-field` as `registry:ui`, like the other bound fields. Moves it from `components/` to `components/ui/`: 12 app sites in 5 apps. | M10, fully: the bound fields install in one place. | R20 | done (`90e4337`) |
| A12 | API change | `RouteError`'s `actionsSlot` becomes `actionSlot`, the name every other item uses. | One name for one slot. | — | done (`28580df`) |
| A13 | API change | The discard question's "keep" button is `keepLabel` in `DialogLayout` and `stayLabel` in `UnsavedChangesDialog`; one name, and the default words in one place. | Two copies of one question. | — | done (`e336f61`) |
| B5 | Question | The `layout` bundle leaves out `list`, `file-tree`, `page` and `route-error`, among others. Answered: the bundle lists every layout. | Decides what "every layout" installs. | — | done (`1a43836`) |
| D4 | Docs | The convention "`registry/ui`, `registry/layout`, `registry/lib` … are public install paths" is wrong: an item's type decides where it installs (min-agent has `password-input` from `registry/ui/` and `confirm-button` from `registry/layout/` side by side in `components/`). | A wrong rule would have made R20 look breaking. | — | done |
| D5 | Docs | Stale comments in `query-state.tsx`: line 76 names a `contentSlot` it does not have; lines 250-251 call `Item` DOM-only. | Comments that describe code that is not there. | — | done (`81903da`) |
| D6 | Docs | Stale README facts: the item counts (lines 312-313, 728), `skill` listed as an item (467), `file-picker` called web-only (475). | The README is what a new consumer reads. | — | done (`2bb8969`) |
| F2b | Feature | `QueryState`'s not-found title takes a heading `level`, default 1, as `EmptyState` does, so a guard inside a titled page is not a second `h1`. | Decided after F2 found two `h1`s in llm-router's pattern. | F2 | done (`6d1ed68`) |
| F4 | Feature | `PageLayout` takes full-width rows under the title (a second bar, a notice, tabs) and a header rule that runs the full width while the title stays in its column. | B4: telos `project-page.tsx:116` and min-agent `settings.tsx:141` build pages by hand for this. | — | done (`8fbc1f1`) |
| F5 | Feature | `PageHeader`'s title size can be chosen apart from its heading level, so a top-level page can have a compact title. | B4: min-agent `chat-view.tsx:194` uses level 3 only to get a small title. | — | done (`da3bc5a`) |
| R22 | Refactor | `CardLayout` no longer imports `dialog`: `DialogLayout` hands its title, description and footer parts to the card through `FloatingSurfaceContext`. | F1 made every card install pull in `dialog`. (unverified) | F1 | done (`d75195b`) |
| B6 | Bug | `DialogContent` (`registry/ui/dialog.web.tsx`) always passes `aria-describedby`, so an `undefined` overrides radix's own link and no web dialog is described by its description. | Found by T2; every web dialog. | — | done (`d6d904e`) |
| B7 | Bug | `rn2web` crashes on `cond && Platform.select({ web: a ? b : c })`: it folds to `cond && a ? b : c` without parentheses. | A compiler crash a valid source triggers; worked around in `rowFillClass`. | — | done (`6aba270`) |
| A14 | API change | `useUnsavedChangesGuard` answers `stay()` while its label is now `keepLabel`; one word for both. | A13 left the two names disagreeing. | A13 | done (`2bea003`) |
| D7 | Docs | The props tables show a deprecated prop (`breadcrumbsSlot`, `actionsSlot`, `stayLabel`) as an empty row; it should say what replaces it. | The tables are what an app developer reads. | — | done (`d5337d9`) |
| D8 | Docs | The README's "React Native set" table (about `README.md:458-466`) is out of date: it lists none of `list`, `list-item`, `file-tree`, `disclosure`. | The README is what a new consumer reads. | — | done (`d971822`) |
| B8 | Question | Sidebar rows (`SidebarNavItem`, `BarNavItem`) stay solid when current: AGENTS.md files the current sidebar row with the controls, "the one of its group", not with rows among many. Tint them too? | Finishes B3 or confirms the exception. | — | done: tinted everywhere (option C), in `2942f56` and `d8e2751`; the comparison story served its purpose and was removed (`3f8d0d0`). |
| R21 | Refactor [reuse] · low value | `RouteError`'s `friendlyMessage` may be able to share `lib/error-message`. (unverified) | A third error-to-text helper. | — | open |
| M11 | Model | Proposes plainer layout names once the A and F items above land, each with what it says that the old name did not. | M11. | the A and F items | approved: `QueryState` → `LoadState`, `RouteError` → `ErrorPage`, `Disclosure` / `DisclosureRow` → `Collapsible` / `CollapsibleRow`, `DescriptionList` → `PropertyList`, `CenteredLayout` → `CenteredCardLayout`, `SidebarNavItem` / `BarNavItem` → `SidebarItem` / `AppBarItem`; each old name a deprecated alias for one release. After `layouts/tint` merges. |

## Conventions

The canonical way this codebase does things. New code and refactors follow these.

- A registry item installs as its own files. Sharing code between two items means a
  `registryDependencies` entry, so a merge (P6) costs the consumer a file.
- An item's `type` decides where it installs in an app (`registry:ui` in `components/ui/`,
  `registry:component` in `components/`, `registry:lib` in `lib/`), not its folder here:
  `password-input`, from `registry/ui/`, and `confirm-button`, from `registry/layout/`, both
  land in `components/`. Moving a file between `registry/ui`, `registry/layout` and
  `registry/lib` is internal; changing its type moves it in every app.
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

**Done:** the types live in a new lib item, `form-binding`, which the native `form`, the web
`app-form` and `radio-group-field` all depend on. The three had already drifted: the web's
listeners took `onChangeDebounceMs` and `onBlurDebounceMs` and the other two did not. All three
take the web's shape now.

### R6 [reuse] — one `FormBoundField`

**File:** `registry/ui/form.tsx:755-781`, `registry/web/app-form.tsx:613-639`. Target: the
wrapper in one module both read. (unverified)

**Done, more narrowly:** the cast of `form.Field` is `fieldOf(form)` in `form-binding`, read by
all three files. The fifteen lines of render prop round it stay in each, because each provides
its own `fieldContext` and the web's props type differs.

### R7 [reuse] — one `CopyButton` component

**File:** `registry/ui/copy-button.tsx:27-49`, `registry/ui/copy-button.web.tsx:40-62`.

**Done:** the component is `registry/ui/copy-button-view.tsx`, which takes `write` as a prop and
is compiled like any other file; each half is now its writer and a three-line `CopyButton` that
hands it over. A `.ts`/`.web.ts` pair for the writer alone was the other shape, and the compiler
knows no such pair.

### R8 [readability] — review the twelve `as unknown as`

**File:** `header-content-footer.tsx:221`, `unsaved-changes-guard.tsx:86`, `button.tsx:300-301`,
`form.tsx:771`, `item.tsx:136`, `menu.tsx:72`, `radio-group.tsx:74`, `textarea.tsx:62`,
`theme-preference.tsx:63`, `toast.tsx:65`, `web/app-form.tsx:630`. A further 58 plain `as T`
in 28 files were counted and not filed.

**Done:** seven of the twelve are gone. `rest as TProps` (both forms), the content ref, and
the toast viewport style pass as a single `as`, which the compiler checks for overlap. The
document-position probe is a type guard, and `node.focus()` needs no cast at all: `View`
declares it. Five stay doubled on purpose, because the registry is vendored into apps whose
React Native and DOM typings differ from this repo's: `button.tsx` (two), `item.tsx`,
`textarea.tsx`, `theme-preference.tsx`, `unsaved-changes-guard.tsx`. Each carries its reason.

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

**Done:** one module per pass in `scripts/rn2web/passes/` (`imports`, `platform`, `spreads`,
`elements`, `types`, `specifiers`, and `refuse` for the diagnostic they share); `compile.mjs` keeps
the header and the driver, 148 lines of the 1169. The seven dividers are gone and `compiled/` is
byte-for-byte what it was. `elements.mjs` is 559 lines, most of it `transformElement`.

---

## Docs

### D1 [sweep] — doc blocks over four sentences

**Hits:** registry 205 in 112 files (5 sentences: 60, 6: 40, 7–10: 64, over 10: 41). Worst:
`split-layout.tsx:191` (33), `alert.tsx:1` and `icons.tsx:1`
(31), `badge.tsx:1` (22). Scripts 42 in 14 files, stories 42 in 32. `AGENTS.md` asks that
comments say why and "what went wrong without the line"; it sets no length.

**Partly done:** the 41 registry blocks over ten sentences are now five to nine each, 1305 lines
down to about 430. What went was the history (which apps wrote it by hand, and how the copies
disagreed) and the argued rationale; what stayed is the decision and the one reason that stops a
reader undoing it. Still open: the 202 registry blocks of five to ten sentences, and `scripts/`
and `stories/`.

### D2 [sweep] — body comments over two lines

**Hits:** registry 95 in 48 files, scripts 32 in 10, stories 17 in 13.

### D3 [sweep] — missing doc blocks in `registry/`

**Hits:** (unverified) about 44 exported functions, 118 exported types, 23 exported
constants; about 150 internal functions, most of them the parts of the shadcn-compatible
primitives (`DialogHeader`, `SelectItem`, …). `icons.tsx` (47) is excluded.

**Partly done:** a syntax-tree scan put the exported count at 390, not 185: 205 functions, 97
types and 88 constants in 120 files. 259 of them now have a summary, the same line on both
halves of a platform pair, and `cn`, `isThemePreference` and `isPalettePreference` have
`@param` and `@returns` as well. Left out on purpose: the 47 icons in `icons.tsx` and the 83
`*Props` types, whose names say all a summary would. Still open: the internal functions and
parts, which the scan did not count.

---

## Bugs

### B1 — `QueryState`'s `messageOf` answers differently

**File:** `registry/layout/query-state.tsx:52-66` against the three in R4. Is the
difference intended?

**Done:** intended. `QueryError` reads `messageOf(error) || FALLBACK`, so the empty string is
what lets "The server did not answer." show where a form would print the raw value. The
helper's doc block now says so; the code is unchanged.

---

## API changes (need a decision)

### A1 — a defaults module for the registry's tunables

`registry/layout/file-tree.tsx:80`, `registry/lib/color.ts:29-30`,
`registry/ui/spinner-base.ts:20`, `copy-button-base.ts:43`, `tooltip.tsx:79`,
`search-input-base.ts:41`, `skeleton-base.ts:13`.

### A2 — units in `SPIN_DURATION` and `PULSE_DURATION`

`registry/ui/spinner-base.ts:20`, `registry/ui/skeleton-base.ts:13`.

**Done:** now `SPIN_DURATION_MS` and `PULSE_DURATION_MS`. No story, script or skill page named
either, so only an app that imported one has anything to change.

## Layouts (2026-11-06)

Every item below names the model change it implements. Each removal or rename also updates
`skill/layout/*.md`, `skill/native.md`, `skill/install-paths.md` and `AGENTS.md` in the same
commit, and the release notes say what an app changes.

### T2 [pin] — `DialogLayout` and `CardLayout` before M6

**Files:** `stories/dialog-layout.stories.tsx`, `stories/card-layout.stories.tsx` (and the web
twins under `stories/web/`). Read what the plays already assert, then add what M6 could break.

### T3 [pin] — the disclosure toggle

**Files:** `stories/disclosure.stories.tsx`, `stories/disclosure-row.stories.tsx`,
`stories/file-tree.stories.tsx`.

### R14 [reuse] — Inline: `SectionHeading` in `Section` and `SidebarSection` (M9)

**Files:** `registry/layout/section.tsx:110`, `registry/layout/sidebar.tsx:284`,
`registry/layout/section-heading.tsx`. Both add `section-heading` to their dependencies.
(unverified that the classes match exactly: the sidebar's title also truncates)

### R15 [reuse] — Extract component: the disclosure trigger (M8)

**Files:** `registry/layout/disclosure.tsx:92-116`, `registry/layout/disclosure-row.tsx:59-84`,
`registry/layout/file-tree.tsx:295-303,348-359`. `disclosure-row` and `file-tree` gain a
dependency on `disclosure`.

### R16 [reuse] — Extract function: a row's router link

**Files:** `registry/layout/list-item.tsx:91-117`, `registry/layout/file-tree.tsx:483-518`.

### A3 — `DisclosureRow` on `ListItem` (M8)

**File:** `registry/layout/disclosure-row.tsx`. Keeps `badgesSlot`, `meta`, `description`,
`actionSlot`, `contentSlot`; drops the `Item` dependency.

### B3 — the chosen row's fill

`registry/layout/list-item.tsx:218` (`bg-active/40`) against
`registry/layout/file-tree.tsx:393` (`bg-active`).

### R17 [reuse] — Extract constant: the card's footer row (M6)

**Files:** `registry/layout/card-layout.tsx:157-178` (`ACTIONS` at `:163`),
`registry/layout/dialog-layout.tsx:77-89`.

### R18 [reuse] — Extract component: the folded description

**Files:** `registry/layout/card-layout.tsx:247-250,277-293`,
`registry/layout/section.tsx:99,146-172`, `registry/layout/setting-row.tsx:73,96-122`.

### F1 — `DialogLayout` as a floating `CardLayout` (M6)

**Files:** `registry/layout/dialog-layout.tsx`, `registry/layout/card-layout.tsx`,
`registry/ui/dialog-base.ts:88-89`. The dialog panel keeps drawing the border, fill and shadow;
the card inside draws none and takes the dialog's `p-6`, a `DialogTitle` at `text-lg`, a body in
`HeaderContentFooter scroll`, and the stacking footer. The discard `ConfirmDialog` keeps its
per-platform placement (`dialog-layout.tsx:348-357`).

### A4 — remove `Section`'s `surface` (M7)

**File:** `registry/layout/section.tsx:43,130`. App sites: philotes 24, glances 14, heautou 8,
gemifi and zeromem among the rest (53 in all).

### R19 [reuse] — one heading row for `Section` and `CardLayout`

**Files:** `registry/layout/card-layout.tsx:138-155`, `registry/layout/section.tsx:50-72`. The
two text-column floors (`basis-40`, `basis-48`) differ on purpose (`card-layout.tsx:138-141`).

### F2 — not found in `QueryState` (M2)

**Files:** `registry/layout/query-state.tsx`, from `registry/layout/detail-page.tsx:38-52`
(an `EmptyState` at level 1 with the Search icon). App sites it replaces: philotes
`persons/[id]/index.tsx:42-57`, `timeline.tsx:59`, `dates/[dateId].tsx:53`; telos
`projects/[id].tsx:164`, `todos/[id].tsx:44`; llm-router `pools_.$name.tsx:38-50`.

### A5 — remove `Page` and `DetailPage` (M1)

**Files:** `registry/layout/page.tsx`, `registry/layout/detail-page.tsx`,
`registry/layout/page-header.tsx:217-221,269` (`PageInsetContext`). Stories:
`stories/tabs.stories.tsx:406`, `stories/examples/mobile/project.stories.tsx:150`, the galleries.

### A6 — `GridLayout` (M1)

**File:** `registry/layout/page.tsx:83-104` to `registry/layout/grid-layout.tsx`. The cells can
hold anything; every app use today holds cards (telos `overview.tsx:40`, mcp-router
`browse.tsx:93`, auto-cal `ProjectList.tsx:80`, `TodoListList.tsx:96`).

### A7 — remove `StickyHeaderContentFooter` (M3)

**Files:** `registry/layout/header-content-footer.tsx:357-362`, `registry/layout/sidebar.tsx:161`,
`skill/layout/splits.md:120-121`. App sites: ragdown, zeromem, skills-manager, min-agent
(`components/settings/config-form.tsx:131`).

### B4 — `PageLayout` built by hand

min-agent `app/settings.tsx:141`, `components/chat/chat-view.tsx:194`; ragdown
`routes/docs.tsx:225`, `components/doc-editor.tsx:106`; telos
`src/components/domain/project/project-page.tsx:116`; zeromem `routes/index.tsx:36` and eight
more routes, which use a plain column with `PageHeader className="px-0 pt-0"`.

### A8 — `backSlot` (M4)

**Files:** `registry/layout/page-header.tsx` (the slot and its doc at `:128-137`),
`registry/layout/page-layout.tsx` (passes it through). App sites to move: llm-router
`pools_.$name.tsx:46`, `workspaces_.$slug.tsx:47`, `providers.$name.tsx:50`; mcp-router
`servers.$name.tsx:99`, `workspaces_.$slug.tsx:65`.

### A9 — remove `DetailHeader` (M4)

**File:** `registry/layout/detail-header.tsx`. Stories:
`stories/examples/mobile/project.stories.tsx:156`, `stories/web/examples/inbox.stories.tsx:247`.

### F3 — `AppBar` (M5)

**Files:** from `registry/layout/split-layout.tsx:463-513` and
`registry/layout/top-bar-layout.tsx:56-81` to a new `registry/layout/app-bar.tsx`;
`SidebarLayout` draws it.

### A10 — remove `TopBarLayout` (M5)

**Files:** `registry/layout/top-bar-layout.tsx`, `skill/layout/top-bar.md`. Installed but unused
in ephemeris and engrafo.

### R20 [consistency] — Move: four items out of `registry/layout/` (M10)

**Files:** `registry/layout/confirm-button.tsx`, `combobox.tsx`, `unsaved-changes-guard.tsx`,
`radio-group-field.tsx`, and their `registry.json` paths.

### A11 — `radio-group-field` as `registry:ui`

**File:** `registry.json:622-641`.

### A12 — `RouteError`'s `actionSlot`

**File:** `registry/layout/route-error.tsx`. 7 app sites, one per app root.

### A13 — one name for "keep editing"

**Files:** `registry/layout/dialog-layout.tsx:226-229` (`keepLabel`),
`registry/layout/unsaved-changes-guard.tsx:157-160` (`stayLabel`).

### B5 — the `layout` bundle

**File:** `registry.web-only.json`, the `layout` bundle.

### D4 — install paths follow the type

**File:** this ledger, "Conventions", second bullet.

### D5 — stale comments in `query-state.tsx`

**File:** `registry/layout/query-state.tsx:76,250-251`.

### D6 — stale README facts

**File:** `README.md:312-313,467,475,728`.

---

## Low value

### R11 [sweep] — apply P1 across `registry/`

**Hits:** 191 of 326 `if`/`while` conditions (unverified).

### T1 [readability] — type assertions in stories

**Hits:** 297 plain, 12 `as unknown as`, in 53 files.

### R21 [reuse] — `RouteError`'s `friendlyMessage`

**File:** `registry/layout/route-error.tsx:54-69` against `registry/lib/error-message.ts`. A third
error-to-text helper; `QueryState`'s differs on purpose (B1). (unverified whether the two can
share) Low value: both work, and neither file is about to change for it.
