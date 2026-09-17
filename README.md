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
| 3 | `rn2web` — the RN→web compiler | not started |

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
files it needs: `textarea` is a single file, `input` is three (`input-base.ts` + `input.tsx` +
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
npx shadcn@latest add @cubeui/form @cubeui/page @cubeui/tokens --yes   # in a scratch project
```

What that proves, and nothing else does: every `-base.ts` / `.tsx` / `.web.tsx` of a split item
travels together, `@/` rewrites to the consumer's own alias in every file, a `registry:file` lands
at its `target` (`cubeui-tokens.css` at the project root) while a `registry:lib` lands under the
`lib` alias, and the npm dependencies that arrive are the versions intended.

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

## Commands

```sh
npm run build          # tokens → typecheck → registry:build → registry:check
npm run check          # the same, read-only: nothing is regenerated

npm run tokens:build   # emit dist/
npm run tokens:check   # fail if dist/ is stale (CI)
npm run parity         # fail if the web emitter diverged from cubeui
npm run registry:build # shadcn build → public/r
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

`dist/` is committed on purpose — the emitted tokens are the artefact consumers install, and committing
them is what lets `tokens:check` catch drift, the way cubeui catches registry drift with
`git diff --exit-code -- public/r`.

`npm run parity` reads cubeui at `../cubeui` (override with `CUBEUI_PATH`) and skips cleanly when it is
not on disk. It is a transition-period guard: when cubeui is archived, delete it.

## Open decisions

1. **Registry namespace.** The repo is `cubeui-rn`, but since it eventually serves web apps too, `-rn`
   becomes a misnomer and `@cubeuirn` would be a permanent wart in every consumer's `components.json`
   and every Pages URL. Taking `@cubeui` outright is the clean end state and is available now, because
   no app is wired up yet so the two registries never have to coexist in one app. **Not yet decided.**
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
5. **Native dark mode wiring.** The native stylesheet emits `:root` and `.dark` in parallel with the
   web one, but how NativeWind 5 selects between them on device is **not yet verified on a device or
   simulator** — it is asserted from the file shape, not observed. The Stage 2 install test is where
   that gets settled.

## CI

`.github/workflows/ci.yml` runs the same `npm run check` steps one at a time, so a failure names
itself, plus `git diff --exit-code -- public/r` — a drifted checkout means someone edited
`registry.json` without rebuilding, and the published JSON would not match the sources it names.

`.github/workflows/pages.yml` rebuilds the registry from source and publishes `public/`, then
refuses to deploy a tree missing anything `registry.json` promises: an item that 404s is invisible
until someone tries to install it.
