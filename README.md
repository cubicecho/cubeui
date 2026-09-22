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
| 2 | the component registry, ported from `auto-cal/client` | **done** — 53 items, pipeline green |
| 0 | the compiler spike — three components, compiled by hand, rendered beside the originals | **done — verdict: go** |
| 3 | `rn2web` — the RN→web compiler, and the web registry it feeds | **done** — every item has a web half, 77 published |
| 4 | cubeui's own items ported in as the web-only tier | **done** — 24 web-only items, cubeui fully covered; the layout shells and `section` since moved to both platforms |

Stage 0 is numbered before stage 3 and run after stage 2 on purpose: it is the gate on stage 3, and it
needed a real component set to have anything to compile.

**This repo is cubeui's `next` branch.** The web registry is published at the URL cubeui's ten DOM
consumers already map, so the flip is a merge rather than a migration — see
[Stage 4](#stage-4--cubeuis-own-items-the-web-only-tier).

## Stage 1 — tokens

`tokens/palette.mjs` is the single source of truth: 27 shadcn token names in light and dark, stored as
OKLCH components — the 18 cubeui has always carried, plus `destructive-foreground` and shadcn's eight
`sidebar-*` tokens. `npm run tokens:build` emits three encodings of it into `dist/`:

| Output | Encoding | For |
|---|---|---|
| `tokens.web.css` | `oklch()` | Tailwind 4 on the web |
| `tokens.native.css` | hex / `rgba()` | NativeWind 5 on device |
| `cubeui-theme.ts` | JS strings | RN props that take a colour |

Three encodings because **React Native's style engine cannot parse `oklch()` at runtime**, and because
RN props like `placeholderTextColor`, icon tints and SVG fills are plain strings that cannot read a CSS
variable. The conversion is real colour maths (`scripts/oklch.mjs`, OKLCH → OKLab → LMS → linear sRGB →
gamma), not a lookup table, so changing a value in the palette produces a correct hex with nobody
hand-converting anything.

**The two stylesheets do not spell dark mode the same way, and cannot.** The web build emits `.dark
{ … }`, which is what every shadcn stylesheet has and what cubeui's byte-parity requires. The native
build emits `@media (prefers-color-scheme: dark) { :root { … } }`, because on device there is no DOM
and no root element to carry a class: react-native-css reads a bare `.dark` as an ordinary class
style, scoping the variables to whatever subtree gets `className="dark"` rather than to the root. So
native follows the **system** appearance, and an in-app toggle is `Appearance.setColorScheme("dark")`
rather than a class on a wrapper. That is the one place these two platforms' theming does not look
alike, and open decision 7 is where it was found.

**An Expo web build gets the class override as well.** Nothing inside a web page can move
`prefers-color-scheme`, so a light / dark / system picker there needs a class that beats the media
query in both directions. The native stylesheet ends with two more palette blocks,
`:is(html.dark) { … }` and `:is(html.light) { … }`, generated like the rest: `class="dark"` or
`class="light"` on `<html>` wins over the system, and no class follows it. The spelling is the one
that works on both platforms. `:root.dark` — what an app would write by hand — fails the native
compile outright ("Class-qualified :root selectors are unsupported on native"), and `.dark` /
`html.dark` compile into the class style open decision 7 removed. `:is(html.dark)` is (0,1,1), so it
outranks the media query's `:root`, and react-native-css drops it without a word;
`scripts/tokens-dark.test.mjs` asserts the compiled native output is identical with and without it.

**The native stylesheet also carries the one line of preflight a web build needs:**
`*, ::before, ::after { box-sizing: border-box; }`. Preflight itself stays out — it would fight
react-native-web's unlayered reset — but it was the only thing setting `border-box` on `*`.
react-native-web sets it on every element it renders, so a `View` never noticed; a `.web.tsx` half
that renders a raw `<input>` or `<textarea>` fell back to `content-box`, and an `h-10 py-2` input
drew 58px tall beside a 40px button. It lives here rather than as `box-border` on each raw-DOM class
so the next raw-DOM half is covered too. Yoga is always border-box, and the native compiler drops
the rule. `stories/tokens.stories.tsx` measures the input beside the button.

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

The **web-only** tier — cubeui's shells — is declared separately in `registry.web-only.json` and
lives in `registry/web/`; see [Stage 4](#stage-4--cubeuis-own-items-the-web-only-tier). This table is
the React Native set.

| Group | Items |
|---|---|
| tokens | `tokens` |
| lib | `utils`, `color`, `readable-text-color` |
| primitives | `icons`, `button`, `card`, `checkbox`, `code`, `input`, `label`, `textarea`, `switch` |
| platform-split | `dialog`, `popover`, `select`, `tabs`, `tooltip`, `calendar`, `file-picker`, `form-element` |
| pills and swatches | `segmented`, `toggle-chip`, `badge`, `color-bar`, `color-dot`, `color-picker` |
| forms | `field`, `form`, `form-dialog`, `switch-field`, `date-time-input`, `inline-number-edit`, `radio-group`, `radio-group-field` |
| feedback | `confirm`, `confirm-dialog`, `toast`, `query-state`, `route-error` |
| layout | `header-content-footer`, `page-header`, `page-layout`, `split-layout`, `sidebar`, `card-layout`, `dialog-layout`, `page`, `detail-page`, `detail-header`, `section-heading`, `section` |
| docs | `skill` |

Everything generic in `auto-cal/client/src/components/ui` is now here. What was left behind was
left behind on purpose: its vocabulary was the app's, not the set's. `inline-length-edit` became
`inline-number-edit` (a value, a range and a formatter, rather than minutes clamped to 1440), and
`status-chip` stopped naming a project's three lifecycle states — first as a tone, and then, in
open decision 4, as `badge`.

**`file-picker` is web-only.** Its native half draws the zone and says so on screen; it does not
pick a file. Doing that needs `expo-document-picker` plus a file-system read, which is an app-level
choice with its own permission flow, so the registry ships the contract and the working web half
rather than a control that silently opens nothing.

The `tokens` item installs `dist/tokens.native.css` as `cubeui-tokens.css` at the project root —
`@import` it from the app's own `global.css` — and `dist/cubeui-theme.ts` as `@/lib/cubeui-theme`,
for the RN props that take a colour as a string and cannot read a CSS variable. The name is
namespaced on purpose: a `registry:lib` lands in the consumer's `lib/` by basename, and it used to be
`theme.ts`, which overwrote an app's own `lib/theme.ts` on `shadcn add` without asking.

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

`scripts/check-registry-build.mjs` enforces six things, and each one is a failure that otherwise
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
5. **Every cross-item dependency names `@cubeui`, and an item its own registry holds.** A
   `registryDependencies` entry resolves against the *consumer's* `components.json`, never against
   the registry the item came from — which is the whole trick behind the two-registry split and
   equally the trap. A stray namespace asks the consumer to have configured a key nobody mentioned,
   and a dependency on a missing item 404s *mid-install*, after files are already in their tree.
6. **Every built item file is still listed by the index beside it.** `shadcn build` writes an item
   file per item and never removes one. Renaming `status-chip` to `badge` left
   `public/r/status-chip.json` in place, complete and still served at its URL, with the index
   already correct and the orphan colliding with nothing — so every other check here passed. Since
   `public/` is committed, this one reports rather than deleting, and the fix is `git rm`.

It also holds that **every colour class names a token** (rule 9 in the script). Tailwind generates
nothing for a colour its theme does not hold and says nothing either — the class stays in the markup
and the element inherits. `button`'s `destructive` variant and `toast`'s error tone both wore
`text-destructive-foreground` while the palette had no such token. `scripts/colour-classes.mjs`
reads every `text-*`, `bg-*`, `border-*` (and `ring-*`, `fill-*`, `stroke-*`, `outline-*`) colour
out of the string literals in `registry/` — through the TypeScript parser, so TSDoc that talks about
classes is not read as markup — and each has to be a token both stylesheets define or a colour
Tailwind ships.

And that **every layout is on both platforms** (rule 11). The layout shells are written once in
`registry/layout/` and the web half is compiled from them, so a native layout with no web item beside
it — its compile was refused, and the web registry dropped it without failing — is an error, and so is
a layout in the web `layout` set with no native item, unless `WEB_ONLY_LAYOUTS` in the script names
why (`section`, until #61; `disclosure-row`, which is built on the web-only `item`).

All five novel checks are negative-tested: breaking one export, duplicating one basename, leaving
one dependency bare, pointing one at an item that does not exist, and stranding one built file each
make it exit non-zero and name the cause.

### The install test

The registry is verified the way a consumer meets it, not only the way it is built: serve `public/`
over HTTP, point a throwaway project's `components.json` at it, and `shadcn add` a few items.

```sh
python3 -m http.server 8731 --directory public   # in this repo

# in a scratch DOM project, "@cubeui": "http://localhost:8731/r/{name}.json"
npx shadcn@latest add @cubeui/form-set @cubeui/page-layout @cubeui/tokens --yes

# in a scratch Expo project, "@cubeui": "http://localhost:8731/r/native/{name}.json"
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
react-native-web anywhere in the output. **Every file has a web half — 36 generated, 33
hand-written** — and `registry.web.json`, derived from `registry.json` and `registry.web-only.json`
in the same run, publishes **all 77 items**. `scripts/rn2web/` is about 1400 lines, of which
`tables.mjs` is all of the judgement and `compile.mjs` is the ts-morph that applies it.

The stories from Stage 0 now render the **generated** files rather than hand-compiled stand-ins, so
the spike's assertions became the compiler's regression test without anything being rewritten.

### Two registries, one repo

The compiled half is published as a **second registry built from the same sources**. A consumer
points `@cubeui` at whichever one matches the platform it is:

```jsonc
// a DOM app
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
// an Expo app
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/native/{name}.json" }
```

**On a Vite app, put `compilerOptions.paths` in the root `tsconfig.json` as well.** `npm create
vite@latest` writes `paths` into `tsconfig.app.json` and leaves the root file a bare `references`
stub; the CLI reads only the root one, finds no `@/` alias, and resolves it as a relative path —
so the install writes a literal `@/` **directory** at the project root, reports success, and the
app's own imports see none of it. The first sign of trouble is `Cannot find module
'@/components/ui/card'`. Duplicating the `paths` block into the root file is the whole fix.

The web half holds the shorter URL even though this registry is React Native first. That is not an
accident of which came first: `…/cubeui/r/{name}.json` is the string ten DOM consumers map to
`@cubeui` **today**, and this branch becomes that repo. Keeping `/r/` meaning "web" is what makes the
flip a no-op for every consumer that already exists. Pointing it at the native half instead would
have handed React Native source to ten DOM apps, silently, on merge day.

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

**Where the rule stops, and what catches the rest.** A prop with no entry in either table is *not*
refused — `transformElement` passes it through onto the host element, which looks like the one hole
in "refuse, never guess". It is not, because `compiled/` is on the typechecked path: every one of the
17 errors in open decision 6 was tsc's, on generated code, before anything could ship. The compiler
does not need its own DOM attribute allowlist when the type system already holds one. All 27 props
that reach a host element in `compiled/` today are valid DOM or React (`aria-*`, `className`,
`disabled`, `onChange`, `ref`, `role`, `type`, …).

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
`<section>`, `<nav>`, `<figure>` have no ARIA role a `<View>` could have carried. (`<aside>` was on
this list, wrongly: its role is `complementary`, which `sidebar` writes on its root and level 2 now
maps to `<aside>`. The role is what makes the source's `aria-label` legal under react-native-web,
where a role-less `<div>` may not be named and axe says so.)
`registry/lib/web-as.d.ts` augments React Native's `ViewProps` and `TextProps` with an optional
`webAs`, which the compiler reads and removes; on device React Native drops the unknown prop, so it
costs one type declaration and no runtime. `section` is the first item to need it: its root is a
`<View webAs="section">`, named by its title through `aria-labelledby`, which is what a
region landmark is on the DOM.

`section` also made level 2 give a little. Its title's rank is a prop, and an `<hN>` is chosen when
the file is compiled, so an `aria-level` that is an expression rather than a literal keeps
`role="heading"` + `aria-level` on the element map's tag — a `<span role="heading" aria-level={level}>`,
which is the same heading to assistive technology and exactly what react-native-web renders for the
same source. A literal still becomes the element; a heading with no `aria-level` is still refused.

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
  Once the guard folds, a spread of an object literal is inlined as attributes — shorthands too, so
  `sidebar`'s `{...(Platform.OS === "web" ? { href, "aria-current": … } : {})}` comes out as
  `<a href={href} aria-current={…}>`, which is what lets the `accessibilityState` check see the
  `aria-current` that answers its `selected`.

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

## Stage 4 — cubeui's own items, the web-only tier

cubeui's 28 items are now here — plus the five upstream shadcn primitives they depend on, published
from here for the reason [below](#the-five-upstream-primitives-now-published-from-here) — and with
them this registry covers everything cubeui published. They
are the plan's **third class**: web-only, hand-written, no React Native half and nothing for the
compiler to do. `SplitLayout` is CSS grid tracks driven by a custom property, `PageHeader` is
`max-w-(--breakpoint-2xl)` and `[&_svg]:size-5`; Yoga has no grid and NativeWind has no arbitrary
variants, so there was never an RN source for these to come from.

**The layout family has since left this tier** (#57). `header-content-footer`, `page-header`,
`page-layout`, `split-layout`, `card-layout` and `dialog-layout` are written once in
`registry/layout/` and compiled for the web — and `sidebar` (#59), which was never in this tier,
joined them there: the split is flex rather than grid tracks, and the web
classes Yoga cannot read sit behind a `Platform.select` the compiler folds, so the DOM output keeps
them. The one `PageHeader` replaced the smaller one `page` carried on device. Rule 11 of the guards
keeps the family on both sides.

| Class | Files | Declared by | Example |
|---|---|---|---|
| universal | compiled from RN, or `-base` + `.tsx` + `.web.tsx` | `registry.json` | `button`, `card`, `select` |
| native-only | `.tsx` only | `registry.json` | the `Modal` sheet half of `dialog` |
| **web-only** | `registry/web/*.tsx`, hand-written | `registry.web-only.json` | `OptionSelect`, `FormField`, `MultiSelect` |

**The directory is the declaration.** A `.web.tsx` inside `registry/ui` must have a `.tsx` beside
it — that rule is what catches a native half someone deleted — so a web-only item cannot live there
without either weakening the rule or carrying a marker field that has to be kept honest.
`registry/web/` needs neither: every file in it is web-only because of where it is, and
`registry/web/ui/` mirrors `registry:ui` vs `registry:component` so `item` still installs to
`components/ui/` where cubeui's consumers already have it.

**And the published item says so.** The tier was invisible from outside this repo — `section` had
no native half, `card` does, and their item JSON was the same shape down to both shipping one file
out of `compiled/` — so the only ways to tell were installing it and reading the file header,
probing `/r/native/<name>.json` for a 404, or reading this table. `registry.mjs` now appends
*"Web-only: no React Native half."* to each of the web-only descriptions in the web registry, which is
the one field already published and already printed by the CLI at install time. It is appended
rather than written into `registry.web-only.json`, so the 29th item cannot be the one that forgets.
In the native registry the item simply is not there, which says it more plainly.

### The port was an API reconciliation, not a copy

This is the part worth reading before the next one of these. cubeui's shells were written against
**radix's and shadcn's full prop surface**; this registry's primitives are RN-derived and narrower,
because a `Pressable` honours none of `ComponentProps<"button">`. So roughly a dozen primitives had
to be **widened on both halves** before a single shell would typecheck — `select`, `card`, `field`,
`dialog`, `popover`, `tooltip`, `input`, `checkbox`, `switch`, `button`, `color-picker`, `calendar`.

The governing rule was that **the RN vocabulary wins**: a ported shell is rewritten to it
(`onChangeText`, not a DOM `onChange`; `backgroundColor`, not a `style` object), rather than the
primitive being widened to accept a DOM shape it cannot honour. What *was* added on both halves is
the list of genuine capability gaps the port found:

| Gap | Filled with |
|---|---|
| `Select` had no grouping | `SelectGroup`, `SelectLabel`, `SelectSeparator` |
| `Card` had no trailing header slot | `CardAction` — absolute on native, `col-start-2` on web |
| `Dialog` could not be opened by its own child | `DialogTrigger`, and `onEscapeKeyDown` wired to Android back |
| `Popover` was controlled-only | `defaultOpen`, and uncontrolled state on the native half |
| `Tooltip` had no placement | `side`, and a shared `TOOLTIP_SIDE_CLASS` map |
| `Input` could not be a password, a time or a colour | `InputType` widened, plus `inputMode` |
| `Calendar` was single-date only | **a native range implementation**: matchers, disabled days, multi-month |

The calendar is the one that was real work rather than a prop: `calendar-base.ts` now declares
`DateRange` and `DateMatcher` itself, discriminated on `mode`, so the shared type does not come from
react-day-picker — a library only one platform has — and `date-picker` no longer type-depends on it.
`calendar.tsx` evaluates the matchers and draws the range; `calendar.web.tsx` passes both branches
through to `DayPicker`.

### Two names that could not come across unchanged

- **`form` → `form-set`.** cubeui's `form` is a bundle of the eight bound-field items; this
  registry's `form` is the React Native `Form` component. The shadcn CLI resolves a cross-item
  import by *basename*, so the two cannot share the name. The bundle is `@cubeui/form-set`, and it
  is the one rename a migrating consumer has to make.
- **`color-picker`.** cubeui installs it to `components/color-picker.tsx` and this registry to
  `components/ui/color-picker.tsx`, because here it is a primitive rather than a shell. A consumer
  flipping over gets a second file rather than an overwrite; delete the old one and fix the import.

### The five upstream primitives, now published from here

`separator`, `skeleton`, `command`, `radio-group` and `alert-dialog` were the last bare
`registryDependencies` in this registry: names the consumer's CLI resolved against ui.shadcn.com
rather than against this repo. `vendor/shadcn/` held a copy of each so the web half had something to
typecheck against, and that directory doubled as the compiler's "leave this import alone" list.

They are `@cubeui/*` items now, out of `registry/web/ui/` beside `item` and `empty`, and `vendor/`
is gone. **The reason is `cn`.** Upstream's published primitives import it from an npm package
called `cn`; every file this registry ships imports it from `@/lib/utils`. Installing anything from
here therefore split a consumer's `components/` down the middle — the shells calling one `cn`, the
primitives under them calling another, both in the tree, and `cn` added to `dependencies` in
`package.json` by the CLI. Nothing errors. A project that has customised `cn` has customised it for
half its components, and the first sign is a class that should have been merged and was not.

The cost is owning shadcn's update cadence for five files, which is the price of the install being
one dialect. It is the same trade `item` and `empty` were already published on.

`radio-group` has since left the list. A React Native app needed it too, so it is now written in
native (`registry/ui/radio-group.tsx`) and compiled like any other universal item, with
`radio-group-field` beside it. The web API kept `RadioGroup` / `RadioGroupItem`, `value` /
`defaultValue` / `onValueChange`, `disabled`, `orientation` and `loop`, and a label-less
`RadioGroupItem` is still the bare circle for a caller's own `<Label htmlFor>`. What went with
radix: the hidden `<input>` behind `name` / `required` for a native `<form>` submit, `dir`, and
`asChild`.

With no upstream names left, the compiler's third case for an import specifier goes too: every
`@/components/ui/*` an emitted file reaches for is now either compiled or passed through, so it is
rewritten to `./` like any other.

### The landing page

`https://cubicecho.github.io/cubeui/` is both the registry's host and its human URL — the only repo
in the org where those are the same string — and `public/` was `r/` and nothing else, so the bare
URL 404'd. Someone arriving from cubicecho.com, or from the end of a `components.json` line, had the
registry URL and no way to read what was behind it.

`scripts/build-page.mjs` writes `public/index.html`: the install snippet for both platforms, the
Vite `paths` note above, and every item with a `both` / `web` / `native` tag. **Generated from the
two `registry.json` files**, because the item list is what a person comes for and a hand-written
copy of it is wrong the first time an item is added — silently, since nothing checks prose.
`npm run page:check` fails if the committed page has drifted, the same guard `dist/` and `compiled/`
are held to, and it runs in CI beside `git diff --exit-code -- public/r`.

One file, no build step of its own, no framework and no CDN font. The palette is cubesite's
`brand/tokens.css` values inlined rather than imported — this is served from a different host and
should not fetch a stylesheet to render — and the mark and `favicon.svg` are cubesite's, both
`currentColor`-driven and so correct in either theme from one file.

### The Storybook, deployed beside the registry

`pages.yml` builds it into `public/storybook`, so it ships in the same artefact the registry does
and lands at `https://cubicecho.github.io/cubeui/storybook/`. It is **not committed** — 9MB of
generated bundle with no consumer but that host, and a stale copy in git reads as current — so
`public/storybook/` is in `.gitignore` and the page is the only thing in `public/` besides `r/`
that a human is meant to open.

A consuming app composes it with one entry, which is the whole of what mechanism 1 of
[#45](https://github.com/cubicecho/cubeui/issues/45) asked for:

```ts
// .storybook/main.ts
refs: { cubeui: { title: "cubeui", url: "https://cubicecho.github.io/cubeui/storybook" } },
```

Composition needs exactly one thing from this side — `access-control-allow-origin: *`, which Pages
sends on every response — and it buys documentation, not a test: the stories render in cubeui's
iframe under **cubeui's** tokens, so "does `Button` still pass contrast after our `index.css`
override" is unanswered by it. That question needs a story compiled in the consumer, which is
mechanism 2, below.

Nothing is served until `next` reaches `main`: `pages.yml` deploys from `main` only, so until then
`/storybook/index.json` is a 404 — though already one carrying the CORS header, which is the part
composition depends on.

### Stories through the registry

The other half of #45: a story installed *into* the consumer, where it renders under the app's own
`index.css` and runs as a test under the app's own addon-vitest.

```sh
npx shadcn add @cubeui/button-stories   # lands components/ui/button.stories.tsx, beside button.tsx
```

- **The file is the declaration.** Every `stories/web/published/<name>.stories.tsx` becomes a
  web-registry item `<name>-stories`, derived by `rn2web` alongside `registry.web.json` and
  depending on `@cubeui/<name>`. No hand-written entry, so no entry to drift.
- **A separate item, not part of the component.** Installing `button` does not drag a Storybook
  file into an app with no Storybook, and `-stories` is asked for by name.
- **It lands where the component does**, taking the component item's own type — `components/ui/`
  for a `registry:ui`, `components/` for a `registry:component` — so a stories glob over `src/`
  finds it, and it reads as the component's neighbour.
- **Written in the consumer's terms.** Imports are `@/components/ui/button`, which
  `tsconfig.web.json` resolves to `compiled/` here — so these stories typecheck and run in this
  Storybook too, and are tested before they ship.
- **Nothing the consumer's tree will not have.** No helper, no relative import, no decorator
  package: `react`, `storybook/test`, a *type-only* import from `@storybook/react-vite`, and the
  `@/` paths of the item's own dependency closure. It declares no npm dependency, so an install
  never moves the consumer's Storybook pin. The floor is Storybook 9 (`storybook/test`) and CSF3
  `args` / `play` with `within(canvasElement)`.
- **No colour is asserted.** The consumer owns the palette; axe's contrast pass is the colour check,
  and the assertions are the palette-free ones — a variant painted *something*, disabled dims,
  the state attribute is set.
- **Web only, for now.** On-device Storybook has no `play` and no addon-vitest, which is the whole
  reason to ship a story, so the native registry carries none.

Rule 10 in `check-registry-build.mjs` holds the import rules against the built JSON, which is what
a consumer actually receives. The stories in `stories/web/published/` are button, badge, card,
segmented, toggle-chip, section-heading and sidebar; the Stage 0 stories stay unpublished, because they
compare against the native half and a consumer has no native half to compare.

**`staticDirs` is not the way to serve `public/`, and the default nearly broke this.** Vite's
`publicDir` defaults to `<root>/public`, and `public/` here is the deployed registry rather than
this app's assets — so every Storybook build was carrying a second copy of 160 item JSONs, and the
moment the landing page landed at `public/index.html` it **overwrote Storybook's own**: a static
build whose index was the registry page and whose UI could not be reached. `.storybook/main.ts`
sets `config.publicDir = false` in `viteFinal`. Setting `staticDirs: []` does not do it — Storybook
treats the empty array as unset and Vite's own default still applies.

### Two tsconfig projects, split by platform

`tsconfig.json` is React Native — `registry/{ui,layout,lib}`, `stories`, `scripts`, `tokens`.
`tsconfig.web.json` is everything DOM — `compiled/`, `registry/web/`, `stories/web/`. They are split by
**platform, not by directory-under-test**, because `@/components/ui/button` has to mean the compiled
web half in one and the React Native one in the other.

Leaving `compiled/` in both is how `compiled/multi-select-field.tsx` came to be typechecked against a
React Native `Badge` — silently, for the whole of stage 3. `npx tsc --explainFiles` is what found it:
`exclude` does not stop a file being pulled in by an import. The Stage 0 stories need the same split
at runtime, so `.storybook/main.ts` adds a second `vite-tsconfig-paths` naming `tsconfig.web.json` —
the framework's own only ever loads a file called `tsconfig.json`.

### The skill

`@cubeui/skill` installs `SKILL.md` plus `layout.md`, `forms.md` and `controls.md` into
`.claude/skills/cubeui/`, using shadcn's `files[].target` (`~` is the project root there, not
`$HOME`). It came across with cubeui's three references nearly unchanged — they describe the
web-only tier, which did not change — and a rewritten `SKILL.md`, because the one thing an agent now
has to know first is **which half it is in**: the shells are a 404 in an Expo project, and the native
set is its own smaller vocabulary rather than a port of this one.

## Commands

```sh
npm run build          # tokens → typecheck → registry:build → registry:check
npm run check          # the same, read-only: nothing is regenerated

npm run tokens:build   # emit dist/
npm run tokens:check   # fail if dist/ is stale (CI)
npm run parity         # fail if the web emitter diverged from cubeui
npm run compile        # registry/ → compiled/, the DOM half
npm run compile:check  # fail if compiled/ is stale (CI)
npm run registry:build # shadcn build → public/r (web) and public/r/native
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
2. ~~**Sidebar tokens.**~~ **Closed: not a decision, a trigger — and it has not fired.** This entry
   said the blocker was byte-parity with cubeui, which framed it as a timing problem: wait for
   archival, then add them. It is a YAGNI problem instead, and those end differently.

   **Nothing in either repo consumes a sidebar token.** cubeui's stylesheet has none. The `sidebar`
   hits in cubeui's shells are a *prop* — `split-layout`'s `sidebar` / `sidebarPosition` /
   `sidebarWidth` slot — not a colour, and `page-layout` says outright that it does not own the
   sidebar and leaves the drawing to shadcn's own `sidebar` component. This registry ships no
   sidebar item either. Parity was never what stood in the way; there was simply nothing to theme.

   Two corrections to the entry while it is being closed. Upstream ships **eight** sidebar tokens
   (`--sidebar`, `-foreground`, `-primary`, `-primary-foreground`, `-accent`, `-accent-foreground`,
   `-border`, `-ring`), not four. `min-agent/mobile` defined four of them — and it is a dark-only
   app whose `:root` *is* the dark palette, so it is not evidence of what a themed set needs.

   **What reopens it:** a sidebar-shaped item landing here, which belongs to the "port cubeui's 23
   web-only shells" work. At that point the choice is the main palette (byte-parity is gone by then,
   or the check has been) or a separate `tokens-sidebar` item, which keeps the main blocks untouched
   and is the cheaper answer if only one app wants a sidebar. Not before.

   **It fired, and the answer was the main palette.** Every cubicecho app's sidebar uses the eight
   tokens, telos was defining all of them in its own `global.css` to keep working, and a sidebar
   layout was coming here next — it is `sidebar` now (#59), drawn on `bg-sidebar`,
   `border-sidebar-border` and `sidebar-accent`. A separate item would have been one more thing each of those apps had
   to know to install. `npm run parity` now compares around the additions — every token cubeui has
   must still match it in value and order, and a token cubeui lacks is not drift — so the
   transition-period guard survives the palette growing.
3. ~~**Whether the `.web.tsx` split survives Stage 3.**~~ **Settled by the spike: it survives, as the
   escape hatch it already is.** Every web half kept so far is one the compiler could not have
   produced — `input.web.tsx` exists for `type="time"` and `min`/`max`, `label.web.tsx` for the radix
   `htmlFor` association — and the spike found nothing in the plain set that needs one. Level 4 of
   the plan (an existing `X.web.tsx` is emitted verbatim and codegen is skipped) stands unchanged.
4. ~~**`status-chip` and cubeui's `badge`.**~~ **Settled: one item, named `badge`.**

   This entry began from a false premise. It said "cubeui's `badge` has not been ported yet", and
   cubeui has no `badge` to port: the only mention of the name in its whole `registry.json` is a
   *bare* `"badge"` in `multi-select`'s dependencies, which resolves to upstream shadcn's registry
   and not to cubeui. There was never a clash between the two repos to settle.

   The second argument against the name did not survive either. Taking `badge` collides with
   upstream shadcn's own `badge`, which installs to the same `components/ui/badge.tsx` — but this
   registry already claims 15 of upstream's names on the same terms (`button`, `card`, `input`,
   `select`, `dialog`, `switch`, `tabs`, `textarea`, `form` among them). It replaces the primitive
   layer rather than sitting beside it, so `badge` is no more of a collision than `button` was.

   So the real question was vocabulary, and the fold is a strict superset. Upstream's four variant
   names keep upstream's meanings, which is what lets a DOM call site port unchanged and what makes
   cubeui's `multi-select` — `variant="secondary"` plus a per-option colour — land here verbatim
   when its turn comes. The old `tone` values map onto them without an orphan: `neutral` →
   `secondary`, `info` → `default`, `danger` → `destructive`, leaving `success` and `warning` as the
   only two additions.

   **The token cost this entry was expected to pay did not come due.** Promoting `success` and
   `warning` to `--success` / `--warning` would put this repo's `:root` block out of step with
   cubeui's, which is open decision 2's whole reason for being deferred. They ship as palette
   colours instead, exactly as `status-chip` already shipped them, so `npm run parity` stays green
   and nothing outside this repo is touched. The promotion stays available and reaches no call
   site when it happens — it is an edit to `tokens/palette.mjs` and one class map.

   **A badge with no label collapses to a dot** — same variant, same meaning, no width needed. It
   does not overlap `color-dot`: that one takes a literal colour for a category whose hue is
   user-chosen data, this one takes a semantic variant. The dot is also the one form with no text
   to be named by, so it is named outright (`role="img"` + `aria-label`) or hidden
   (`aria-hidden`), and `stories/accessible-state.stories.tsx` holds that rather than this
   paragraph.

   That story earned its place immediately. `success` shipped as `green-600`, which is **3.22:1**
   against white — short of the 4.5:1 that 12px text needs — and the axe pass caught it, not
   review. Both semantic fills are now the 700s (4.95 and 5.03), which puts them beside
   `destructive`'s own 4.77.

   One thing this rename exposed: `shadcn build` writes item files and never removes one, so
   `public/r/status-chip.json` kept serving the old component at its old URL with the index
   already correct and nothing colliding. `check-registry-build.mjs` grew a sixth rule for it.
5. ~~**Publishing `compiled/` as registry items, and the `web-button` name it seemed to need.**~~
   **Settled: two registries from one repo.** The basename collision was a property of putting both
   halves in one registry, not of the halves. `public/r` and `public/r/native` are built from the
   same sources, hold the same item names, and a consumer picks one by URL. No DOM app ever types
   `web-button`. Verified by installing from it, not only by building it.
6. ~~**`onPress` or `onClick` on the compiled half.**~~ **Settled: `onClick`** — a DOM app installing
   a DOM component is not handed React Native's vocabulary, and gets the whole `<button>` prop
   surface with it: `onMouseEnter`, `onFocus`, `type`, `form`, and whatever `userEvent.click` expects.

   This entry used to claim the choice was *reversible in one line of `PROP_MAP`*. It is not, and
   deleting the line to find out is what settled it: **17 type errors across 14 files**, in two
   populations. Eight compiled files put `onPress` on a real `<button>`. Five more, plus a story,
   fail on `<Button onPress>` — and that group is the actual reason, because `ButtonProps` is
   `React.ComponentProps<typeof Pressable>` on native and `React.ComponentPropsWithoutRef<"button">`
   on web. It is not a renamed type, it is a different one, so removing the map entry does not give
   the compiled `Button` an `onPress`; it gives it no press prop at all. Offering `onPress` on the web
   half would mean the compiler **synthesizing an adapter** per component — declaring the prop, wiring
   it to the host's `onClick`, and narrowing the DOM prop surface so `onClick` is not also there.
   That is codegen of an API shim, not a table entry.

   The cost — the two halves are not interchangeable at the call site, which the side-by-side stories
   show directly — is smaller than it reads. The halves are never installed into the same app: an
   Expo app installs from `public/r/native` and a DOM app from `public/r`, so no call site sees both
   vocabularies. And only three items expose a press handler as public API at all (`card`,
   `segmented`, `toggle-chip`); the other 27 `onPress` occurrences are internal wiring on a
   `Pressable` that becomes a `<button>` either way. No `-base.ts` declares a press prop, so nothing
   in the shared contracts had to move.
7. ~~**Native dark mode wiring.**~~ **Settled: it was broken, and it needed no device to find out.**
   The entry was right to be suspicious and wrong about what it was waiting for.
   `react-native-css/compiler` is the same transform Metro runs and it imports in Node, so the
   committed stylesheet can simply be put through it:

   | `dist/tokens.native.css` | root variables | …carrying a dark value | stray class styles |
   |---|---|---|---|
   | as it shipped | 18 | **0** | `dark` |
   | after the fix | 18 | **18** | none |

   `.dark { … }` is correct on web and a silent no-op on native. There is no DOM and no root element
   to carry a class, so the compiler reads it as an ordinary class style — variables scoped to
   whatever subtree gets `className="dark"`, never the root set. It does not warn, the build stays
   green, and every Expo app installing the tokens renders light for ever. `--background` compiled to
   `[["#fff"]]`, with the whole dark palette parked in an unreachable class.

   The fix is one line in the native emitter: `@media (prefers-color-scheme: dark) { :root { … } }`.
   The web emitter keeps `.dark`, which is right for the DOM and is what cubeui parity requires — so
   this is the first place the two encodings differ by more than colour syntax.

   Two things worth keeping. `.dark:root` looks like the obvious fix and is rejected outright —
   *"Class-qualified :root selectors are unsupported on native"* — even though react-native-css's own
   `selectors.ts` still carries a matcher for that spelling, so reading the source rather than running
   it gives the wrong answer. And native now follows the **system** appearance: an in-app toggle is
   `Appearance.setColorScheme("dark")`, not a class on a wrapper.

   `scripts/tokens-dark.test.mjs` holds both halves — every token carries a dark value, and the
   stylesheet defines no classes — asserted against the compiler's output rather than our own, so an
   RC that changes which spelling it honours fails here instead of on someone's phone. Negative-tested
   by restoring the old `.dark` block: both assertions fire.

## CI

`.github/workflows/ci.yml` runs the same `npm run check` steps one at a time, so a failure names
itself, plus `git diff --exit-code -- public/r` — a drifted checkout means someone edited
`registry.json` without rebuilding, and the published JSON would not match the sources it names. The
same argument covers `compile:check`: `compiled/` is committed, so a stale one means someone changed a
component and shipped the old DOM half.

`.github/workflows/pages.yml` rebuilds the registry from source and publishes `public/`, then
refuses to deploy a tree missing anything `registry.json` promises: an item that 404s is invisible
until someone tries to install it.
