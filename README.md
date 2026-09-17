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
| 2 | the component registry, ported from `auto-cal/client` | not started |
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

## Commands

```sh
npm run tokens:build   # emit dist/
npm run tokens:check   # fail if dist/ is stale (CI)
npm run parity         # fail if the web emitter diverged from cubeui
npm test               # the colour maths
npm run check          # all three
```

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
3. **Native dark mode wiring.** The native stylesheet emits `:root` and `.dark` in parallel with the
   web one, but how NativeWind 5 selects between them on device is **not yet verified on a device or
   simulator** — it is asserted from the file shape, not observed. The Stage 2 install test is where
   that gets settled.
