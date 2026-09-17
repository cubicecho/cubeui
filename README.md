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
| 2 | the component registry, ported from `auto-cal/client` | **in progress** — 42 items, pipeline green |
| 3 | `rn2web` — the RN→web compiler | not started (spike first) |

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

## Commands

```sh
npm run build          # tokens → typecheck → registry:build → registry:check
npm run check          # the same, read-only: nothing is regenerated

npm run tokens:build   # emit dist/
npm run tokens:check   # fail if dist/ is stale (CI)
npm run parity         # fail if the web emitter diverged from cubeui
npm run registry:build # shadcn build → public/r
npm run registry:check # collisions, platform-pair drift, empty content
npm test               # colour maths (node --test) + registry libs (vitest)
npm run lint           # biome
```

Two test runners on purpose: `scripts/` is the token pipeline — plain node ESM, no JSX, no bundler —
and runs under `node --test` so it stays runnable with nothing installed. `registry/` runs under
vitest, the way cubeui's does and the way Storybook will want.

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
3. **Whether the `.web.tsx` split survives Stage 3.** Every web half kept so far is one the compiler
   could not have produced — `input.web.tsx` exists for `type="time"` and `min`/`max`, `label.web.tsx`
   for the radix `htmlFor` association. That is the intended split. Whether the *rest* of the set
   needs one is what the Stage 0 spike decides.
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
