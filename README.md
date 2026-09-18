# cubeui-rn

A shadcn registry of React Native components, and the tokens they share with the web.

**Endgame: this replaces [cubeui](https://github.com/cubicecho/cubeui).** It starts by serving the
Expo apps and ends as the single registry serving every app in the tree, at which point cubeui is
archived. Until then the two coexist and this repo proves it stays faithful to cubeui's palette on
every build.

**Nothing outside this repo is modified.** No app is wired up to it yet.

## Status

| Stage | What | State |
|---|---|---|
| 1 | `tokens` — one palette, three emitters | **done** |
| 2 | the component registry, ported from `auto-cal/client` | **done** — 41 items, pipeline green |
| 0 | the compiler spike — three components, compiled by hand, rendered beside the originals | **done — verdict: go** |
| 3 | `rn2web` — the RN→web compiler, and the web registry it feeds | **done** — all 39 files have a web half, all 42 items published |

Stage 0 is numbered before stage 3 and run after stage 2 on purpose: it is the gate on stage 3, and it
needed a real component set to have anything to compile.

## Stage 1 — tokens

`tokens/palette.mjs` is the single source of truth: 18 shadcn token names in light and dark, stored as
OKLCH components. `npm run tokens:build` emits three encodings of it into `dist/`:

| Output | Encoding | For |
|---|---|---|
| `tokens.web.css` | `oklch()` | Tailwind 4 on the web |
| `tokens.native.css` | hex / `rgba()` | NativeWind 5 on device |
| `theme.ts` | JS strings | RN props that take a colour |

Three encodings because **React Native's style engine cannot parse `oklch()` at runtime**, and because
RN props like `placeholderTextColor`, icon tints and SVG fills are plain strings that cannot read a CSS
variable. The conversion is real colour maths (`scripts/oklch.mjs`, OKLCH → OKLab → LMS → linear sRGB →
gamma), not a lookup table, so changing a value in the palette produces a correct hex with nobody
hand-converting anything.

### Why this exists, in one table

Hand conversion is how the tree drifted. `ai_tools/min-agent/mobile/global.css` converted the same
palette by hand; 14 of its 18 tokens still match cubeui and **four no longer do**:

| Token | min-agent (hand) | cubeui (source of truth) |
|---|---|---|
| `accent` | `#262626` | `#404040` |
| `popover` | `#171717` | `#262626` |
| `border` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.1)` |
| `input` | `rgba(255,255,255,0.16)` | `rgba(255,255,255,0.15)` |

## Stage 2 — the registry

`registry.json` → `shadcn build` → `public/r/*.json`, the same shape cubeui uses. Consumers add one
line to `components.json` and install with the stock shadcn CLI; there is no bespoke sync tool,
because the CLI already does the copying and the import-alias rewriting.

The registry is organised **by item, not by platform**. An item is one component and ships whichever
files it needs: `card` is a single file, `input` is three (`input-base.ts` + `input.tsx` +
`input.web.tsx`). `tsconfig.json`'s `paths` deliberately mirror where the CLI actually puts each file
in a consumer's tree, so an import that typechecks here is the import the consumer gets.

| Group | Items |
|---|---|
| tokens | `tokens` |
| lib | `utils`, `color`, `readable-text-color` |
| primitives | `icons`, `button`, `card`, `checkbox`, `code`, `input`, `label`, `textarea`, `switch` |
| platform-split | `dialog`, `popover`, `select`, `tabs`, `tooltip`, `calendar`, `file-picker`, `form-element` |
| pills and swatches | `segmented`, `toggle-chip`, `status-chip`, `color-bar`, `color-dot`, `color-picker` |
| forms | `field`, `form`, `form-dialog`, `switch-field`, `date-time-input`, `inline-number-edit` |
| feedback | `confirm`, `confirm-dialog`, `toast`, `query-state`, `route-error` |
| layout | `page`, `detail-page`, `detail-header`, `section-heading` |

Everything generic in `auto-cal/client/src/components/ui` is now here. What was left behind was
left behind on purpose: its vocabulary was the app's, not the set's. `inline-length-edit` became
`inline-number-edit` (a value, a range and a formatter, rather than minutes clamped to 1440), and
`status-chip` became a tone rather than a project's three lifecycle states.

**`file-picker` is web-only.** Its native half draws the zone and says so on screen; it does not
pick a file. Doing that needs `expo-document-picker` plus a file-system read, which is an app-level
choice with its own permission flow, so the registry ships the contract and the working web half
rather than a control that silently opens nothing.

The `tokens` item installs `dist/tokens.native.css` as `cubeui-tokens.css` at the project root —
`@import` it from the app's own `global.css` — and `dist/theme.ts` as `@/lib/theme`, for the RN
props that take a colour as a string and cannot read a CSS variable.

### What the NativeWind 4 → 5 port actually changed

auto-cal is on NativeWind 4 / Tailwind 3; this repo targets 5 / 4. Two API changes are not
deprecations — the old names are **gone**, so an app still on 4 cannot take these files unchanged:

| NativeWind 4 | NativeWind 5 | Where |
|---|---|---|
| `cssInterop(C, { className: { nativeStyleToProp } })` | `styled(C, { className: { nativeStyleMapping } })` | `ui/icons.tsx` |
| `placeholderClassName="text-muted-foreground"` | `placeholder:text-muted-foreground` in `className` | `ui/textarea.tsx` |

The `placeholder:` variant is the better spelling regardless: react-native-css compiles it to the
`placeholderTextColor` prop on device and to a real `::placeholder` rule on web, so one class covers
both. NativeWind installs as **`5.0.0-rc.0`**, not the preview the plan assumed.

### Guards

`scripts/check-registry-build.mjs` enforces four things, and each one is a failure that otherwise
ships silently:

1. **No two source files claim the same item name.** The shadcn CLI resolves a cross-item import by
   the file's *basename*, so two files called `select.tsx` in different directories mean one import
   silently resolves to the wrong file. Renaming the item in `registry.json` does not help.
2. **A `.tsx` and its `.web.tsx` export the same names.** TypeScript only ever resolves the native
   file, so an export added to one half and not the other typechecks, builds, and fails at runtime on
   web only. Nothing upstream catches this.
3. **Every npm dependency carries a version range.** `"dependencies": ["nativewind"]` makes the CLI
   run `npm install nativewind`, which takes the latest *stable* — 4.2.7 — into an app whose
   components are written against 5, where `cssInterop` is gone and `styled` does not exist. This
   was a real bug, found by installing into a throwaway app and reading the `package.json` that
   came out; the check is what stops it coming back.
4. **Every built file carries content.** `shadcn build` writes `content: ""` for an empty file and
   reports success.

All three novel checks are negative-tested: breaking one export, duplicating one basename and
leaving one dependency bare each make it exit non-zero and name the cause.

### The install test

The registry is verified the way a consumer meets it, not only the way it is built: serve `public/`
over HTTP, point a throwaway project's `components.json` at it, and `shadcn add` a few items.

```sh
python3 -m http.server 8731 --directory public   # in this repo

# in a scratch Expo project, "@cubeui": "http://localhost:8731/r/{name}.json"
npx shadcn@latest add @cubeui/form @cubeui/page @cubeui/tokens --yes

# in a scratch DOM project, "@cubeui": "http://localhost:8731/web/{name}.json"
npx shadcn@latest add @cubeui/page @cubeui/select @cubeui/toast @cubeui/tokens --yes
```

What that proves, and nothing else does: every `-base.ts` / `.tsx` / `.web.tsx` of a split item
travels together, `@/` rewrites to the consumer's own alias in every file, a `registry:file` lands
at its `target` (`cubeui-tokens.css` at the project root) while a `registry:lib` lands under the
`lib` alias, and the npm dependencies that arrive are the versions intended.

The web registry was verified the same way, and the four things worth checking there all held: not
one line of react-native or nativewind in anything installed, `cubeui-tokens.css` arriving as the
**oklch** encoding rather than the hex one, `lucide-react` and `radix-ui` installed where the Expo
side would have taken `lucide-react-native` and `nativewind`, and `@cubeui/select` pulling the
compiled `select` — the same item name the Expo project used for the `Modal` sheet.

## Stage 0 — the spike, and its verdict

**Verdict: go.** The compiler is worth building. The evidence is in `compiled/`, `stories/` and the
assertions those stories carry, not in this paragraph — the point of the spike was to make the claim
falsifiable.

Three components were compiled **by hand-running the transform a compiler would run** —
`section-heading` (one `Text`), `card` (nested `View`/`Text`, a conditional `Pressable` root, a
`role="heading"`/`aria-level` title) and `segmented` (variants, press state, a selected pill) — plus
`color-bar`, which `card` needs. Each is rendered in Storybook **beside its React Native original**,
running through react-native-web, and each story asserts that the two halves agree.

### What it proved

**1. The reset gap closes.** This was open risk #1, the one that decides the whole stage. A compiled
plain-DOM component loses react-native-web's per-component base class, and RN source legitimately
omits classes web then needs because Yoga supplies those defaults. `compiled/cube-rn-reset.css`
carries them — the values lifted from react-native-web's own source, in `@layer base` so unlayered
Tailwind utilities still win. With it, the two halves of the card story measure **identically**:
100 / 98 / 24 / 20 px on both sides, asserted at `<= 1px`.

**2. Level-2 ARIA inference is not speculative — react-native-web already does it.** The plan
proposed inferring `<h3>` from `role="heading" aria-level={3}` and `<button>` from `role="button"`.
The spike found react-native-web *already performs that inference at runtime*: a `Pressable` with
`accessibilityRole="button"` renders a real `<button type="button">`, which is why the card story
asserts both halves are `BUTTON`. Compiling does not invent the semantics; it removes the runtime
that was deriving them on every render. The story asserts two `<h3>`s, one per half, for the same
reason.

**3. The one real divergence found was a bug in the RN source, not a limit of the compiler.**
`aria-selected` came back `null` on the native segmented pill. The cause: **react-native-web drops
`accessibilityState` entirely** — it forwards an allowlist of `aria-*` props and nothing else — so
the active pill was styled but silent to a screen reader. That is a live a11y bug in three shipped
registry files, and it was fixed in the RN source rather than papered over in the compiled output:

| Item | Was | Now also emits, on web |
|---|---|---|
| `segmented` | `accessibilityState={{ selected }}` | `aria-pressed` |
| `toggle-chip` | `accessibilityState={{ selected, disabled }}` | `aria-pressed`, `aria-disabled` |
| `color-picker` | `accessibilityState={{ selected }}` | `aria-checked`, inside a `radiogroup` |

`aria-pressed` rather than the naive `aria-selected`, because `aria-selected` is only defined on
`option`, `tab`, `row`, `gridcell` and `treeitem`; on a button axe rejects it as `aria-allowed-attr`.
That is the mapping the compiler's inference table has to encode, and the spike is what found it.

**4. The residual cost, stated rather than hidden.** The spread-props type diverges: the RN component
takes `ComponentProps<typeof View>` and the compiled one `ComponentPropsWithoutRef<"div">`. An escape
hatch used on one platform does not typecheck on the other. This is recorded in
`compiled/card.tsx`'s header, and it is the honest price of the transform.

### How the harness is kept honest

Two things, because a comparison harness that renders both halves unstyled agrees with itself
perfectly.

- **Every story asserts a computed value, not just a render.** `section-heading.stories.tsx` asserts
  the literal colour `text-muted-foreground` emits — `rgb(115, 115, 115)`. That single assertion
  caught three separate failures of the className polyfill that all looked correct in source.
- **axe is live and negative-tested.** `.storybook/preview.ts` sets `a11y: { test: "error" }`, so a
  violation fails the run. That setting was verified by deliberately writing the naive
  `aria-selected`-on-a-button markup and confirming the run went red with `aria-allowed-attr` —
  rather than assumed from the config.

### The one piece of harness machinery worth knowing about

`.storybook/rn-classname.ts` rewrites `from "react-native"` to `from "react-native-css/components"`
in this repo's own files only. NativeWind 5's `className` support on bare `react-native` components
is a **Metro-only** polyfill; Storybook runs on Vite, so without this the RN half renders with no
Tailwind classes at all. The file's header records the two shapes that do **not** work — a
`resolveId` hook (Vite's alias plugin runs ahead of every user plugin, including `enforce: "pre"`)
and an aliased `export *` shim (this bundler does not honour local-export shadowing) — so neither
gets retried.

## Stage 3 — `rn2web`, the compiler

`npm run compile` reads `registry/` and writes `compiled/`: the same components as plain DOM, with no
react-native-web anywhere in the output. **All 39 files have a web half — 26 generated, 13
hand-written** — and `registry.web.json`, derived from `registry.json` in the same run, publishes
**all 42 items**. `scripts/rn2web/` is about 1400 lines, of which `tables.mjs` is all
of the judgement and `compile.mjs` is the ts-morph that applies it.

The stories from Stage 0 now render the **generated** files rather than hand-compiled stand-ins, so
the spike's assertions became the compiler's regression test without anything being rewritten.

### Two registries, one repo

The compiled half is published as a **second registry built from the same sources**. A consumer
points `@cubeui` at whichever one matches the platform it is:

```jsonc
// an Expo app
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui-rn/r/{name}.json" }
// a DOM app
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui-rn/web/{name}.json" }
```

**The item names are the same on both sides** — `card` is `card`, and `shadcn add @cubeui/card`
installs the right one because of the URL, not because of the name. One registry could not do that:
the shadcn CLI resolves a cross-item import by the source file's *basename*, so `registry/ui/card.tsx`
and `compiled/card.tsx` in one registry would be ambiguous, and the way out would have been a
permanent `web-card` in every DOM consumer's file tree. Split in two, the basenames never meet.

`registryDependencies` need no rewriting at all, which is what makes this cheap. They are already
written `@cubeui/utils`, and `@cubeui` resolves against the **consumer's** `components.json` — so one
string reaches the React Native `utils` in an Expo app and the compiled one in a DOM app, with
nothing in this repo knowing which. The flip side is that it only works while `@cubeui` points here:
an item installed through some *other* key still resolves its own dependencies through `@cubeui`, and
lands in whatever registry that key names. See open decision 1 for what that costs a migration.

`registry.web.json` is **derived, not maintained** (`scripts/rn2web/registry.mjs`), because a second
`registry.json` is a second place to forget. It collapses `X.tsx` and `X.web.tsx` to the one
`compiled/X.tsx`, keeps `-base.ts` where it is, swaps `dist/tokens.native.css` for the oklch one,
drops the npm dependencies only an Expo app needs, and drops an item whose web half was refused —
then drops whatever depended on *that*, to a fixed point. `check-registry-build.mjs` checks both
built registries, and asserts the basename rule **per registry, on the built output**, rather than
inferring it from the fact that the split happened.

### The rule the whole thing is built on: refuse, never guess

Every construct with no table entry produces a `file:line` diagnostic and the item gets **no web
half** — a partially-transformed file is the one output worse than none. `npm run compile` prints its
refusals and exits 0, because a refusal is not a failure. It is the compiler saying which of the
plan's four levels an item belongs to:

```
textarea — no web half (registry/ui/textarea.tsx)
  registry/ui/textarea.tsx:16  `TextInput` is out of scope for the compiler — an input's type,
  keyboard and placeholder vocabulary do not survive a table. Ship a hand-written `.web.tsx` for
  this item instead.
```

**The refusal list is empty today**, and that diagnostic is why — it is the last one, and writing the
file it asked for is what closed it. `textarea` was the only real refusal; `form` was refused solely
because it imports `textarea`, since a compiled tree cannot reach back into a React Native component.
Had either been published half-compiled, the failure would have surfaced in a consumer's app as a
`<div>` nobody could type into.

### What refusing bought

The interesting result of Stage 3 is not the 26 generated files. It is that **four defects in the
React Native source were found by trying to compile it**, none of which any RN tooling would report:

- **`card` picked its container at runtime.** `const Container = onPress ? Pressable : View` refuses,
  because the tag, the reset class and the inferred role all follow from knowing which one it is. The
  source now branches explicitly. It reads better — the two containers never shared a prop list.
- **`toast` shipped an alert nobody could dismiss with a keyboard.** It was a `Pressable` with
  `accessibilityRole="alert"`. A role *replaces* an element's semantics rather than adding to them,
  so that markup is an alert with a press handler that is not exposed — on web *and* on device,
  where the screen reader was told it was looking at a message rather than at something to activate.
  Compiled to markup a linter understands, biome's `useKeyWithClickEvents` said so immediately. The
  announcement and the dismiss target are now two elements.
- **`accessibilityState` is dropped by react-native-web**, which Stage 0 found by hand. It is now a
  permanent compiler guard: every key in an `accessibilityState` must also be said with an `aria-*`
  the web will actually read, checked against `ACCESSIBILITY_STATE_ARIA`, or the item is refused.
  The bug class cannot come back.
- **`textarea` rested on a premise that had quietly expired.** Its header said a `TextInput multiline`
  *is* a `<textarea>` on web, so a `.web.tsx` would be pure duplication. True — under
  react-native-web. The whole point of the compiled registry is that react-native-web is not there,
  and nothing else was going to notice, because the file still typechecked, still rendered in
  Storybook (which runs on RNW) and still worked in every Expo app. The compiler is what read the
  premise back and found it no longer held. It is now three files, like `input`.

### The four levels, as built

| Level | Mechanism | Where |
|---|---|---|
| 1 | element map — `View`→`div`, `Text`→`span`, `Pressable`→`button`, `ScrollView`→`div[overflow-auto]` | `ELEMENTS` |
| 2 | inference from ARIA already present — `role="heading"`+`aria-level={3}`→`<h3>`, `role="list"`→`<ul>` | `NATIVE_TAG_FOR_ROLE` |
| 3 | `webAs` — an explicit tag for what ARIA cannot say | `registry/lib/web-as.d.ts` |
| 4 | an existing `X.web.tsx` supplies the web half and nothing is generated | `passthroughSource` |

Level 3 exists because levels 1 and 2 cannot reach the markup whose semantics *are* the element:
`<section>`, `<nav>`, `<aside>`, `<figure>` have no ARIA role a `<View>` could have carried.
`registry/lib/web-as.d.ts` augments React Native's `ViewProps` and `TextProps` with an optional
`webAs`, which the compiler reads and removes; on device React Native drops the unknown prop, so it
costs one type declaration and no runtime. **Nothing in the registry needs it yet** — every item so
far was reachable from ARIA it already had — so it is built and typed but unexercised.

Level 4 still runs the same passes. That surfaced the second reason it has to: `file-picker.web.tsx`
reaches for a React Native `<Text>`, which is free inside an Expo app on web and would have been the
one import dragging react-native-web back into a DOM app. It compiles to the `<span>`
react-native-web would have rendered anyway.

### Four things the compiler knows that a rename would not

- **The reset.** `compiled/cube-rn-reset.css` carries what react-native-web's per-component base class
  carried, because Yoga's defaults are not CSS's. It also carries the four `pointer-events` classes,
  transcribed rule for rule from react-native-web's style compiler — including the `!important`,
  because `box-none` and `box-only` describe a view and its children disagreeing, which CSS says with
  two rules and not one value.
- **A `<button>` may not carry any role.** `BUTTON_ROLES` is the list it legitimately takes — the
  ARIA checkbox, radio, switch, tab and menu-item patterns are all built on a real `<button>`. Any
  other role and the `Pressable` compiles to the generic box with the role on it, which is what
  react-native-web renders too. This is what the toast finding became.
- **A `ScrollView` is two boxes.** The viewport and the content container, which is what
  `contentContainerClassName` styles. The compiler emits both; collapsing them would put the padding
  on the scroller, where it scrolls away instead of surrounding the content. It is the only element
  the compiler emits that the source did not write.
- **`Platform.OS` is a constant here.** `Platform.OS === "web"` folds to `true`, the ternary around it
  collapses, `Platform.select({ web, default })` resolves, and the import goes. That is what lets a
  source file carry web-only ARIA behind a platform guard and have the compiled half come out clean.

### Where the compiled half is not a drop-in

**Props use DOM names.** `onPress` becomes `onClick`, `testID` becomes `data-slot`, and the prop
*types* change with them — the RN component takes `ComponentProps<typeof View>` and the compiled one
`ComponentPropsWithoutRef<"div">`. Both directions were possible and this is a real fork; see open
decision 6. The stories carry a note at each of the two places it shows.

**`useSemanticElements` is off for `compiled/**` and only there** (`biome.json`, which is strict JSON
and cannot hold the comment, hence this paragraph). The rule asks for `<input type="checkbox">` where
the compiled tree writes `role="checkbox"` on a `<button>`, and `<fieldset>` where it writes
`role="group"`. Both are valid ARIA and both are the only thing the RN source could have said: there
is no `<input>` on a phone, so those patterns are built from a `Pressable` and a role. Every other
a11y rule stays on, and they earn more here than anywhere else in the repo, because a generated file
is the one nobody reads — the toast is the proof.

## Commands

```sh
npm run build          # tokens → typecheck → registry:build → registry:check
npm run check          # the same, read-only: nothing is regenerated

npm run tokens:build   # emit dist/
npm run tokens:check   # fail if dist/ is stale (CI)
npm run parity         # fail if the web emitter diverged from cubeui
npm run compile        # registry/ → compiled/, the DOM half
npm run compile:check  # fail if compiled/ is stale (CI)
npm run registry:build # shadcn build → public/r and public/web
npm run registry:check # collisions, platform-pair drift, empty content
npm test               # colour maths (node --test) + registry libs + the stories (vitest)
npm run lint           # biome

npm run storybook      # the RN-vs-compiled comparison, on :3001
npm run build-storybook
```

Two test runners on purpose: `scripts/` is the token pipeline — plain node ESM, no JSX, no bundler —
and runs under `node --test` so it stays runnable with nothing installed. Everything else runs under
vitest, in two projects: `unit` in node for the registry libs, and `storybook` in a headless Chromium
for the stories, because an axe run and a `getComputedStyle` assertion both need a real browser.

`compiled/` and `registry.web.json` are committed for the same reason `dist/` is, and
`compile:check` is what catches a compiler change that silently stops emitting for an item.

`dist/` is committed on purpose — the emitted tokens are the artefact consumers install, and committing
them is what lets `tokens:check` catch drift, the way cubeui catches registry drift with
`git diff --exit-code -- public/r`.

`npm run parity` reads cubeui at `../cubeui` (override with `CUBEUI_PATH`) and skips cleanly when it is
not on disk. It is a transition-period guard: when cubeui is archived, delete it.

## Open decisions

1. ~~**Registry namespace.**~~ **Settled: `@cubeui`, permanently.** Nothing in the repo changes — it
   is already the string in all 42 items' `registryDependencies`. It was never really contested:
   ten consumers map `@cubeui` today, so adoption is a one-line *URL* edit each, not a rename. The
   platform split does not reopen it, because both registries answer to the same string and the URL
   behind it is what differs. `@cubeuirn` would have been a permanent wart — `-rn` stops being true
   the moment a DOM app installs from it, which it already does.

   What *did* need settling is whether the two registries can coexist in one consumer during the
   migration, and installing from both says **only for leaf items**. Two registries in one
   `components.json` works, and the CLI's key format (`^@[a-zA-Z0-9][a-zA-Z0-9-_]*$`) allows a
   `@cubeui-legacy`. But `registryDependencies` resolve against the *consumer's* map, and cubeui's
   own items name `@cubeui` internally — so with `@cubeui` repointed here, `@cubeui-legacy/query-state`
   fetches cubeui's item, reads its `@cubeui/item` dependency, and goes looking for `item` in **this**
   registry, which has none. It fails. `@cubeui-legacy/split-layout` installs fine, because it
   declares no dependencies at all. The trap is symmetric — all 42 items here name `@cubeui` too, so
   whichever registry does not hold the key breaks its own cross-item imports.

   Of cubeui's 28 un-ported items, exactly **14 survive a renamed key** and 14 do not, split precisely
   on whether they carry an `@`-namespaced dependency. So the sequencing is: **port first, then flip
   once.** Do not plan a dual-registry window — it is only usable for leaves, and it is not needed if
   the porting lands before the consumer moves, which is the order this plan already has. If
   coexistence ever does become necessary, the fix belongs in the derivation and not in the namespace:
   `registry.mjs` can rewrite intra-registry dependencies to absolute URLs and make each registry
   self-contained, at the cost of the property directly below.
2. **Sidebar tokens.** cubeui has 18 tokens; `min-agent/mobile` added four `sidebar-*` ones that
   upstream shadcn also ships. Adding them here would break byte-parity with cubeui, which is currently
   load-bearing as a correctness proof. Deferred until cubeui adoption, when parity stops mattering.
3. ~~**Whether the `.web.tsx` split survives Stage 3.**~~ **Settled by the spike: it survives, as the
   escape hatch it already is.** Every web half kept so far is one the compiler could not have
   produced — `input.web.tsx` exists for `type="time"` and `min`/`max`, `label.web.tsx` for the radix
   `htmlFor` association — and the spike found nothing in the plain set that needs one. Level 4 of
   the plan (an existing `X.web.tsx` is emitted verbatim and codegen is skipped) stands unchanged.
4. **`status-chip` and cubeui's `badge`.** They are the same component seen from two sides — a
   toned pill around a word. cubeui's `badge` has not been ported yet; when it is, one of the two
   names has to go, and the vocabulary check is what should make that impossible to forget.
5. ~~**Publishing `compiled/` as registry items, and the `web-button` name it seemed to need.**~~
   **Settled: two registries from one repo.** The basename collision was a property of putting both
   halves in one registry, not of the halves. `public/r` and `public/web` are built from the same
   sources, hold the same item names, and a consumer picks one by URL. No DOM app ever types
   `web-button`. Verified by installing from it, not only by building it.
6. **`onPress` or `onClick` on the compiled half.** It is `onClick` today, on the argument that a DOM
   app installing a DOM component should not be handed React Native's vocabulary. The cost is that
   the two halves are not interchangeable at the call site, which the side-by-side stories show
   directly. Keeping `onPress` on both would make them swappable and would make the web half the only
   component in a DOM app that does not take `onClick`. **Reversible — it is one line in `PROP_MAP`.**
7. **Native dark mode wiring.** The native stylesheet emits `:root` and `.dark` in parallel with the
   web one, but how NativeWind 5 selects between them on device is **not yet verified on a device or
   simulator** — it is asserted from the file shape, not observed. The Stage 2 install test is where
   that gets settled.

## CI

`.github/workflows/ci.yml` runs the same `npm run check` steps one at a time, so a failure names
itself, plus `git diff --exit-code -- public/r public/web` — a drifted checkout means someone edited
`registry.json` without rebuilding, and the published JSON would not match the sources it names. The
same argument covers `compile:check`: `compiled/` is committed, so a stale one means someone changed a
component and shipped the old DOM half.

`.github/workflows/pages.yml` rebuilds the registry from source and publishes `public/`, then
refuses to deploy a tree missing anything `registry.json` promises: an item that 404s is invisible
until someone tries to install it.
