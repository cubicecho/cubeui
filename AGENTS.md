# AGENTS.md — cubeui

A custom [shadcn registry](https://ui.shadcn.com/docs/registry) of primitives, layout shells,
form fields and controls for the cubicecho apps and private project 1 — React Native and the DOM
from one set of sources. Consumers install from it with the shadcn CLI, pointing `@cubeui` at the
half that matches their platform:

```jsonc
// components.json — a DOM app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json" }
// an Expo app:
"registries": { "@cubeui": "https://cubicecho.github.io/cubeui/r/native/{name}.json" }
```

```bash
npx shadcn@latest add @cubeui/tokens @cubeui/dialog-layout
```

The [README](./README.md) is how the registry is built and why, stage by stage. This file is the
guidance for adding to it.

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
code from real screens, it does not belong here yet. The same holds across platforms: an Expo app
and a DOM app drawing the same card from two hand-kept copies is the same drift, one level up,
which is why most items are written once and compiled.

## Staying on task

Read this before adding anything:

1. **Show the duplication first.** Name the call sites — file and line — that the component
   replaces. Three or more, in at least two projects, or it is premature. `git grep` across
   `~/code/cubicecho/*` and private project 1 is where the evidence is.
2. **A variant prop is not a component.** When a shell needs a fourth boolean to fit a screen,
   the screen wanted a different shell. Adding `compact`, `bare`, `variant="alt"` to make one
   more call site fit is how a library becomes a worse version of the primitive underneath.
3. **Do not wrap — or redraw — a primitive that already exists.** Re-exporting `Card` with a `cn`
   around it adds a file and removes nothing. The shell exists to answer "where does this node
   go", once.

   Wrapping is the obvious version of this and it is not the one that happens. The one that
   happens is *redrawing*: writing `<Text className="text-muted-foreground text-sm">` for a
   field's description when `FieldDescription` exists, and now the registry owns a second set of
   type scales to keep in step with a first. `FormField` shipped that way once and was rewritten
   to compose `Field`, `FieldLabel`, `FieldContent`, `FieldDescription` and `FieldError` — which
   also handed it `orientation` and the horizontal arrangement for free.

   **This registry now publishes its own primitives**, so "what shadcn ships" is two lists. The
   first is this repo's: `registry/ui/` holds a native-first `button`, `card`, `dialog`, `field`,
   `input`, `select`, `separator`, `skeleton`, `tabs`, `command` and the rest, and each one's web half is a **superset of shadcn's
   API** — installed over a DOM app's own `components/ui/`, so a shadcn call site keeps compiling
   (README, "The web halves are now a superset of shadcn's"). `registry/web/ui/` re-publishes the
   upstream primitives the web tier needs — `table` (`alert-dialog`, `command`, `empty` and `item`
   were four, and are native-first now). **Check those two directories before you write markup**; a shell
   composes what is there. The second list is upstream's —
   `curl -s https://ui.shadcn.com/r/index.json` — and it is where to look before inventing a
   primitive this registry does not have yet.

   **Widening a primitive is not redrawing it.** When a shell needs something a primitive here
   lacks, the fix is on the primitive, on both halves where both can honour it: the port of the
   pre-native items added `SelectGroup`, `CardAction`, `DialogTrigger`, a native range calendar
   and more that way (README, Stage 4). Keep shadcn's API as the floor of every web half — a prop
   dropped from one is a DOM app that stops compiling, and
   `stories/web/shadcn-superset.type-assertions.tsx` is where that is proved.

   **Re-publishing is not wrapping** either. A file in `registry/web/ui/` is shadcn's, adapted
   only to import `cn` from `@/lib/utils` like everything else here. The point is the
   *distribution*: a project installing `@cubeui/alert-dialog` takes its confirm from here, so a change
   made once reaches all of them. The cost is owning shadcn's update cadence for those files, so
   the test for adding one is whether you would ever want to change it centrally — and whether a
   shell here imports it, since a bare upstream `registryDependencies` name splits a consumer's
   `cn` in two (README, "The five upstream primitives").

   The converse holds too: if a primitive covers the whole job, there is no component to write.
   `SplitLayout` is not resizable partly because dragging is `resizable`, which shadcn ships.
4. **Compose, do not re-derive.** `HeaderContentFooter` is the only implementation of "chrome
   that stays, a middle that moves". `DialogLayout` composes it, as the chassis it hands the
   `CardLayout` on its panel. A shell that reimplements a
   shape another shell already owns is the exact bug this registry is against.
5. **Shells hold no state, no data, no routing, no toasts.** They take nodes and place them.
   The line is *who owns the state*: state about the shell's own interaction is the shell's, and
   state about the app's data is the caller's. `DialogLayout` holds whether its discard question
   is up, and is *handed* `hasUnsavedChanges` rather than reading the form. See conventions §8.
6. **A component is a domain object; a layout places it.** A component names a thing in the app's
   domain — a Task, an Invoice, a ServerRow — and belongs in the app. A layout names an
   arrangement and knows nothing about what it arranges. That is the test for whether something
   belongs in this registry at all. It holds about nine times in ten; the controls are the
   standing exception. See conventions §12.
7. **Names are plain English.** No vendor jargon, no house metaphors, no initialisms — a prop and
   a `data-slot` are both public API, and every rename of one has been breaking. `rail` was
   Material's, `dirty` is Formik's, `hcf-` was ours. Internal metaphors (*chassis*, *floors*,
   *rungs*) stay in this file and in source comments, never in a prop name. See conventions §11.

## Author native-first

**Write it once, in React Native, and let the compiler make the web half.** An item in
`registry/ui/` (primitives) or `registry/layout/` (shells) is React Native source: `View`,
`Text`, `Pressable`, NativeWind classes. `npm run compile` runs `scripts/rn2web`, which rewrites
each one into a plain DOM component in `compiled/` — no react-native-web — and the web registry
ships `compiled/`, not the source. The rules that make that work:

- **The compiler refuses; it never guesses.** A construct it cannot translate faithfully is an
  error naming the file and line, not a best effort. When it refuses, change the source, or give
  the item a hand-written web half (below) — do not teach the compiler a guess.
- **`compiled/` is generated.** Every file there opens with a header naming its source. Edit the
  source and re-run `npm run compile`; `compile:check` fails CI on a `compiled/` file that no
  longer matches.
- **A primitive the DOM does differently gets a hand-written half.** `button.tsx` +
  `button.web.tsx`, with what both halves share (the `cva` variants, the prop types) in
  `button-base.ts`. The `.web.tsx` is copied into `compiled/` rather than compiled. A `.web.tsx`
  must have a `.tsx` beside it, and the two must export the same names — `registry:check` rules 1
  and 2.
- **Web-only classes go behind `Platform.select`.** A class Yoga cannot read (grid, arbitrary
  variants, `max-w-(--breakpoint-2xl)`) sits in `Platform.select({ web: …, default: … })`, which
  the compiler folds to its web branch. That is how the layout family is on both platforms.
- **But `web` is not only the compiled half.** An Expo web app runs the native source under
  react-native-web, where `Platform.OS === "web"` too and nothing is inherited: a bare `border`
  is black and a `Text` with no colour class is black. Name a border colour beside every border
  width (`border border-border`) and a text colour on every platform, never
  `Platform.select({ web: undefined, default: "text-foreground" })` — `registry:check` rule 14.
- **Declare the item in `registry.json`.** It is the native registry, and the web registry
  (`registry.web.json`) is generated from it plus `registry.web-only.json` — never edit
  `registry.web.json` by hand.

**The web-only tier is `registry/web/`.** Hand-written DOM components with no React Native half:
`FormField`, `app-form` and the bound fields, `table`, and the
rest. They are declared in `registry.web-only.json`, and the directory *is* the declaration — every
file there is web-only because of where it is. `registry/web/ui/` is the same tier for the
re-published primitives, so they still install to `components/ui/`. Put an item here only when an
RN source is genuinely impossible or unwanted (a Radix popover, a `<table>`), not
because the compiler refused once; and a layout does not go here at all — `registry:check`
rule 11 holds the layout family on both platforms, with no exceptions. The
tier only shrinks: rule 16 fails on a web-only item that `WEB_ONLY` in the script does not name with
its reason, and on a line left behind after its item gained a native half. Adding a line is a case
to make in the PR, not a way round the rule.

**Tokens are `tokens/palette.mjs`**, and nowhere else. `npm run tokens:build` emits the web
stylesheet (`oklch()`), the native one (hex, because React Native cannot parse `oklch()`) and
`cubeui-theme.ts` into `dist/`, which is committed. A colour class names a token, never Tailwind's
palette and never `black` or `white` — `registry:check` rule 9.

**A token is named for what the colour means, :**

| Token | What it is |
|---|---|
| `background`, `foreground` | The page, and the text on it |
| `secondary` | The fill of a surface raised off the page: a card, a popover, a dialog. Its text is `foreground`. App chrome — a sidebar, a top or bottom bar — is not raised: it is `background` with a `/10` rule |
| `neutral`, `neutral-foreground` | A button or a badge with nothing to say |
| `positive`, `warning`, `negative`, `info` (each with `-foreground`) | What a thing says. `info` is the blue for a thing worth pointing out: a highlight with a name, and no icon or role of its own |
| `hover` | The transient fill under a pointer, a menu's keyboard highlight or keyboard focus: `active`'s hue, all but grey. Its text is `foreground` |
| `active`, `active-foreground` | Chosen, current and focused: the tint of a checked control or the current row (`bg-active/40`), a focused field's border. Nothing in the registry draws `active-foreground`: it is kept for an app's own solid `active` mark, such as a brand tile |
| `overlay` | The scrim behind a dialog |

**Muted is an opacity, not a token, and there are six steps.** A palette is only predictable if a
component cannot invent a seventh:

| Step | Is | Example |
|---|---|---|
| `/10` | A quiet fill, a tint, a border | `bg-foreground/10`, `bg-warning/10`, `border-foreground/10` |
| `/40` | The edge of a tint, an invalid ring, the tint of a chosen thing | `border-warning/40`, `ring-negative/40`, `bg-active/40` |
| `/50` | A control's edge — an input, a select, a checkbox, an unchecked switch — 3:1 on every surface (WCAG 1.4.11), held by `palette-contrast.test.mjs` | `border-foreground/50`, `bg-foreground/50` |
| `/60` | Secondary text, the scrim, a border under the pointer, a chosen thing under the pointer or focused | `text-foreground/60`, `bg-overlay/60`, `hover:bg-active/60` |
| `/90` | A fill under the pointer | `hover:bg-neutral/90` |
| none | Everything else | `bg-neutral`, `border-active` |

A floating surface is the exception, and is why `secondary` exists: a popover has to be opaque.

**Every palette takes the same steps.** `secondary` is 1.08–1.15:1 from the page, `hover`
1.15–1.3:1 beyond it, and the chosen tint 1.7–2.1:1 from what it is drawn on. The status colours
are held 0.06 apart in OKLab under normal vision and the three colour-vision deficiencies, which
takes a difference in lightness as well as hue, and the chart colours 0.05 from them.
`palette-contrast.test.mjs` holds all of it, and the reasons are in `tokens/palette.mjs`.

**A shadow means elevation.** Only something floating over the page draws one: a dialog, a menu, a
select's list, a popover, a tooltip, a toast, a control laid over content. A surface in the page's
flow (`Card`, `CardLayout`, `Alert`) is set apart by its border and fill, and never a
shadow (#342). Its size is the elevation, from a fixed map: `shadow-sm` for a part laid over a control (a
switch's thumb, a copy button over a code block), `shadow-md` for what floats over the page (a
popover, a menu, a select's list, a tooltip, a toast), and `shadow-lg` for a dialog alone.

**Blocks and rows share one heading rhythm** (#473). `Card` and `CardLayout`, `Section`,
`SettingRow`, `Item` at `sm`, `ListItem`, `CollapsibleRow` and `Collapsible` lay out a title, the
line under it and an action the same way: the title 14px semibold in full ink, the description
14px at the `/60` step, 4px between them, and the action level with the title's top, never centred
on the text. Between two actions it is 8px, or 4px between `icon-xs` buttons, which `actionGap`
reads off the buttons' `size`. Beside an action the text keeps 10rem, or the action wraps under
it, 8px down: a block's to the start, a row's to the far end, clear of its leading slot. The
classes are `HEADING_TITLE`, `HEADING_DESCRIPTION`, `HEADING_GAP`, `HEADING_WRAP_FLOOR`,
`HEADING_WRAP_GAP` and `actionGap` in `registry/lib/utils.ts`; every one of those shells takes them
from there, and a new block or row with a title does too, rather than spelling
`text-sm font-semibold` again. The title and its line are the same size on purpose: hierarchy
comes from weight and ink, so a card of rows reads as one type scale and not three. A block's
description runs beside its action, not under it, because a button taller than the title's line
would push it off the title. `Item`'s `default` size is shadcn's and stays outside the rhythm, and
`SectionHeading`'s overline is a label, not a block's title. `RN Parity/Heading rhythm` holds the
seven to it on both halves.

**A button looks like a button.** `ghost` and `link` stay as Button variants, for an app porting
shadcn code, and nothing in this registry or its stories uses them: a quiet action is `outline`,
and an icon inside a field's own border is `secondary`. The one exception is `DescriptionHint`,
which is `ghost`, round and `icon-xs` beside a title: it is the title's footnote mark, not an
action, and it sits on the title's line beside every field, card and row that folds a
description. An outlined box there drew a button on each of them, competing with the real
actions in `actionSlot`, and a border's height would no longer fit the line. It still turns
`hover` under the pointer and focused, so it reads as pressable where it is pressed. An action that adds something (Add, New,
Create) is `info`, one that keeps the work (Save) is `positive`, and one that destroys is
`destructive` or `destructive-outline`. A form's own submit keeps what was typed, so
`SubmitButton` is `positive` even when it says Create; `info` is the button that opened the form.

**A link is `info`.** `text-info`, in Markdown, in `Empty` and `Item`'s description, and in the
`link` variant of Button and Badge. `neutral` is a fill; as text it is green in Monokai.

**shadcn's names are aliases, and not for us.** `primary`, `destructive`, `accent`, `muted`,
`border`, `ring`, `card`, `popover` and the rest are still emitted, each as the token it now is
(`ALIASES` in `tokens/palette.mjs`), so a vendored shadcn component keeps working. Rule 9 fails a
registry file that names one.

**A focused field turns its border `active`, and draws no ring.** Input, textarea and the select
trigger are `focus:border-active`, and `aria-invalid:focus:border-active` on the web so an invalid
field still shows where focus is.

**Nothing draws a focus ring: a focused thing looks hovered** — as it looks under the pointer in
the state it is in. An unchosen row or an outline button turns `bg-hover` under the pointer, and
does the same under `focus-visible:`. An outline button's edge darkens with the fill, as
`secondary`'s does — `outline` to `border-foreground/60`, a coloured outline from its `/50` rest to
the full colour — because the fill alone changed 1.1–1.5:1; `palette-contrast.test.mjs` measures
the change. A row lights only for its own pressed part, `has-[>:focus-visible]:`, the one focusable
child of the row: a leading checkbox or an action button inside it shows its own look alone, or
the row and its button were the same `hover` and could not be told apart. An off switch keeps its
`/50` track, its 3:1, and is edged in `active`. A filled button keeps `hover:bg-neutral/90` (and the rest)
for the pointer, but focused it takes `focus-visible:bg-hover focus-visible:text-foreground`; a
label or icon that carries its own ink on a `Text` turns with it through a named group
(`group/button` and `group-focus-visible/button:text-foreground`). For a filled button the rule is
the 3:1 change of contrast (WCAG 2.4.13): every solid fill a control rests on is 3:1 or more from
`hover` in every palette, and `foreground` on `hover` is 4.5:1 or more —
`palette-contrast.test.mjs` holds both. A `/90` fill was 1.1–1.3:1 from its rest, which is why
focus is not drawn that way. A chosen thing — a checked checkbox, an on switch, the active tab,
segmented pill, toggle chip or sidebar row, a picked day, a chosen row — focused takes the `/60`
step it has under the pointer (`focus-visible:bg-active/60`, or `has-[>:focus-visible]:` on a row
whose focus is on its pressed part), so it still reads as chosen; its ink is `foreground` already and does
not change. The `/60` step is 1.39–1.57:1 from the `/40` rest, short of 2.4.13's 3:1; it was
chosen over `bg-hover`, which is no closer to 3:1 and made a focused chosen thing look unchosen.
A box that is a tab stop only so a keyboard can scroll it — an overflowing `Table`, a `CodeBlock`,
`HeaderContentFooter`'s scrolling body, a stacked `SplitLayout` — has no hover look, so it shows
focus as a field does, with `FOCUS_EDGE` (`registry/lib/utils.ts`): a transparent edge that turns
`active` under `focus-visible:`. The page body and the split draw that line as a 1px inset shadow,
`INSET_FOCUS_EDGE`, which takes no room. The table, the code block, the body and the split are tab
stops only while they overflow, as `useOverflows` (`@cubeui/overflows`) measures it. A dialog that
opens with no field to focus focuses its own panel, which draws no ring and no edge for it:
otherwise its first button took focus, and a filled primary that looks hovered reads unfilled the
moment the dialog appears. With a field, the first field takes focus; an `alertdialog` keeps its
first answer, the safe one.

**A chosen thing is `active`, not `neutral`.** Checkbox, switch, radio, segmented pill, active tab,
current sidebar row, toggle chip, a calendar's picked day, a selected stat tile, a checked menu row,
the option a select or combobox is on: the `active` tint. `neutral` is for the thing to press.
Keeping the two apart is why a chosen option does not look like a button.

**Hover is the pale `hover` fill, chosen is the `active` tint, rest is no fill.** Every interactive thing has these
three states and no more, and none of them borrows another's colour:

- *Rest* — no fill (or the framed control's `bg-background`).
- *Hover, or a menu's keyboard highlight* — transient, and `bg-hover`. Secondary text
  (`text-foreground/60`) stays readable on it in every palette; `palette-contrast.test.mjs` holds
  that.
- *Chosen* — checked, pressed, current, on, selected: persistent, and the `active` tint,
  `bg-active/40` with its text in `foreground`, controls and rows alike. Its secondary text and
  quiet icons turn `foreground` too, because `/60` on the tint is under 4.5:1. The pointer over it
  tints it a step further (`hover:bg-active/60`) rather than turning it grey, and so does focus. A
  control whose edge is what shows it is there — a checkbox, a switch's track, a radio's circle, a
  toggle chip, a radio tile, a stat tile — is also edged in `border-active`, because the tint is not
  3:1 from the surface (WCAG 1.4.11) and `active` is; its mark — the check, the switch's thumb, the
  radio's dot — is `foreground`, 3:1 or more on the tint, on the `/60` step and on the surface.
  Foreground on both steps is 4.5:1 or more, the three fills (chosen, chosen under the pointer,
  hovered) are 1.3:1 apart, and the mark and the edge are 3:1, in every palette:
  `palette-contrast.test.mjs` holds all of it, and `Tokens/Chosen state` holds the controls to it.

A chosen state drawn in `hover` is the bug this rule exists for: it looks like a hover that stuck.
A chosen state drawn solid (`bg-active text-active-foreground`) was the look until the tint
replaced it everywhere: coloured content on the fill failed (2.7–3.4:1 for text, about 1:1 for an
`info` badge), and its pointer step, `/90`, was 1.15–1.24:1 from rest. Three looks were compared
side by side — solid everywhere, tinted rows beside solid controls, and the tint everywhere — and
the tint everywhere was chosen, accepting that a chosen control stands out less among its
neighbours than a filled one did.

## Status

Published to <https://cubicecho.github.io/cubeui/> by `.github/workflows/pages.yml` on every push
to `main`; the registry is the `r/` directory of that site, the native half `r/native/`, and the
Storybook `storybook/`. The landing page lists every item and which platforms it is on.

```
tokens/palette.mjs                    the one colour source; `tokens:build` emits dist/
registry/ui/                          primitives, React Native, some with a .web.tsx half
registry/layout/                      the shells, React Native, compiled for the web
registry/lib/                         `cn`, readableTextColor, the colour helpers, `describeError`
registry/web/                         the web-only tier, hand-written DOM
registry/web/ui/                      upstream shadcn primitives, re-published from here
skill/                                the usage skill: SKILL.md, vocabulary.md, native.md, and
                                      one file per component group in layout/, forms/ and
                                      controls/;
                                      plain files, not a registry item
compiled/                             generated by rn2web; what the web registry ships
registry.json                         the native registry, and the source of the web one
registry.web-only.json                the web-only tier's items
registry.web.json                     generated — do not edit
stories/                              Storybook, and the tests: every story is one
stories/gallery/, stories/web/gallery.stories.tsx
                                      every item on one page, per platform. A new item goes under
                                      a section in each it ships on, or the story fails
docs/component-conventions.md         authoring rules, and the open questions
.claude/skills/cubeui/SKILL.md        a pointer at skill/, so this repo's own agent
                                      reads the copy consumers take
scripts/rn2web/                       the compiler
scripts/build-tokens.mjs              the token emitter
scripts/check-registry-build.mjs      `registry:check`: sixteen rules over what ships
scripts/install-test.mjs              `install-test`: `shadcn add` every item into scratch apps, `tsc`
scripts/check-vocabulary.mjs          `docs:check`: rule 2 and the skill hold the same words
scripts/check-skill-files.mjs         `docs:check`: each skill file's size, contents and links
scripts/build-install-table.mjs       skill/install-paths.md, from the two registry indexes
scripts/build-props-tables.mjs        the skill's props tables, from the TSDoc on each props type
scripts/props-tables.mjs              one table's rows: a union props type merged, constants expanded
scripts/build-page.mjs                the landing page, public/index.html
.github/workflows/ci.yml              `npm run check` and the Storybook tests
.github/workflows/pages.yml           builds and publishes the registry on `main`
```

Sources import each other as `@/components/ui/...`, `@/components/...` and `@/lib/...`; the CLI
rewrites those against the consuming project's own aliases on install. Pick the prefix by where the
*imported* file installs — its type, not its directory here: `registry:ui` is `@/components/ui/`,
`registry:component` is `@/components/`. A relative import never ships: the CLI does not rewrite
one, and `registry:check` rule 13 fails on it. `compiled/` uses `./x` internally and
`registry:build` puts the alias back.

Still unsettled: the open decisions at the end of the README, and the open questions in
`docs/component-conventions.md`. Do not answer those unilaterally in code.

## Stack

- **TypeScript 5**, strict, ESM only; two tsconfig projects split by platform —
  `tsconfig.json` is React Native, `tsconfig.web.json` is `compiled/`, `registry/web/` and
  `stories/web/`
- **React 19**; **React Native** with **NativeWind 5** on the native side; **Tailwind v4**,
  **radix-ui** (the unified package) and **lucide-react** on the web side. A file a device
  bundles (`registry/ui/*.tsx` with no `.web.tsx` beside it taking its place) never imports the
  unified package: Metro does not drop what is unused, so one import of it ships every primitive
  and `react-dom`. The one primitive those files need is `Slot`, from `@radix-ui/react-slot`
- **shadcn** CLI for `build`
- **Biome** for lint and format
- **Storybook** (on Vite) for the stories and, through vitest, the tests

Registry sources import `cn`, react, react-native, lucide, and other cubeui items — nothing else
(conventions §10). Anything further is a dependency every consuming project has to be told about,
and `registry:check` rule 7 holds each item's declared packages to the ones its files import. The
sanctioned exception is `@tanstack/react-form`, in the form items that bind to it.

`cmdk`, `date-fns` and `react-day-picker` do not count against that rule on the web: they are
what `command` and `calendar` are written on, so they arrive with the primitive rather than
because of a shell. `date-fns` and `react-day-picker` are still the reason `date-picker` is a
separate registry item — a form of plain inputs installs `@cubeui/app-form` and pulls in neither.
`cmdk` does arrive with it, through `combobox`, which `SelectField` renders.

`react-markdown` and `remark-gfm` are the same case: `markdown` is written on them, and they are
declared by that one item. `markdown` and `markdown-editor` are in no bundle for the same reason
`date-picker` is its own item — nothing installs a Markdown parser except the app that asked for
one. `markdown-code-editor` is the same again with CodeMirror (`@codemirror/*`, `@lezer/highlight`),
and is a default export so an app can load it with `lazy()`.

## The forms assume TanStack Form

**Every project these components are installed into runs [TanStack Form](https://tanstack.com/form).**
Assume it. `auto-cal` is the reference — `createFormHookContexts`, a `useAppForm` hook, and
`<form.AppField name="title">{(field) => <field.InputField label="Title" />}</form.AppField>` at
the call site — and its `client/src/components/ui/form.tsx` is the file to read before adding
anything here.

This is a decision, not an observation, and it is the one that lets a form component be worth
installing. A shell hedging across react-hook-form, TanStack and a bare `useState` can only
accept strings and nodes, so every call site keeps writing the three lines that pull the error
off the field, decide whether it has been touched yet, and pass it down — which is the
duplication. Do not add a prop, a branch or a doc sentence accommodating another form library.

The binding lives in two places, one per tier:

- **`registry/ui/form.tsx`** (`@cubeui/form`) is the universal one: `Form`, `useAppForm`,
  `InputField`, `NumberField`, `PasswordField` and the rest, written in React Native and compiled like any
  primitive.
  `registry/ui/date-time-field.tsx` and `registry/ui/color-picker-field.tsx` are its heavy fields,
  added to `field.*` with `createAppForm`; `combobox-field.tsx` and `segmented-field.tsx` join
  the same way. `registry/ui/radio-group-field.tsx`
  binds the same way beside it.
- **`registry/web/app-form.tsx`** (`@cubeui/app-form`) is the web-only one: the contexts,
  `useAppForm`, and `InputField`, `NumberField`, `TextareaField`, `SelectField`, `ComboboxField`,
  `CheckboxField`, `SwitchField`, `PasswordField` and `SubmitButton`, each reading the store and
  handing `FormField` a string. `@cubeui/date-field` and `@cubeui/color-field` are the same layer
  in their own files, for the weight of what they import; `@cubeui/password-field` is the old
  import path of `PasswordField`, kept working, and `@cubeui/form-set` installs all of them.

`NumberField` is on both, with one contract: it writes `number | null`, empty is `null`, and the
text being typed is a draft that `registry/lib/number-draft.ts` reads for both files. Do not
store `Number(text)` per keystroke in a new field: on device the box is redrawn from the store,
and `1.` loses its point before the next digit.

Those three are the only files in the registry that import `@tanstack/react-form`. A web-only
field `app-form.tsx` does not hold is still bound through it: `bindToForm`, `splitProps` and
`useFieldError` are exported for exactly that, so `date-field.tsx` needs no second copy of the
render prop and no opinion about the form library.

The split to preserve is `auto-cal`'s. `FormField` is presentational: it takes `error` as a node
and asks nothing about where it came from. The bound fields read the store and hand it a string.
Keep new work on the right side of that line: a component that needs the form store is bound, and
one that only needs to be told goes below it. Presentational is what makes each bound field
fifteen lines instead of a fork, and it is what lets a field the binding does not cover yet be
written by hand without leaving the set.

**A field's `name` is checked against the form's values, and against their type.** `bindToForm`
takes the value type the control writes, so `<NumberField name="title">` over a string field and
`<DateField name="window">` over a `DateRange` are both build errors. This is the reason
`NumberField` is a component rather than a `type="number"` prop, and the reason `DateRangeField`
is not a `range` prop on `DateField` — rule 2 is about props that only change how something
looks, and neither of these does.

**`FormField` can name a group as well as a control.** `asGroup` swaps the `<label htmlFor>` for
a `FieldTitle` plus an `aria-labelledby` on the control, because HTML will not let a `<label>`
name a `<div role="radiogroup">` — the browser drops the association silently. Any grouped
control needs it: a segmented control, a swatch grid used as the field itself. `RadioGroupField`
does the same thing itself now that it is native-first.

## Code style

- Biome-enforced: double quotes, semicolons, trailing commas, 2-space indent, 100 line width,
  `import type` for type-only imports, imports organised on save
- In `registry/` and `compiled/`, the cubicecho rules as well, as errors: braces on every `if` and
  loop body, no bare numbers outside a `const NAME = 5`, and `x === false` (not `!x`) for a logic
  check, with `!` left for null guards (`no-negation.grit`). An app that vendors these files lints
  them with those rules, so a file that fails them gets the linter turned off around it (#286).
  A suppression only the compiled element needs is written `// web: biome-ignore …`, or
  `{/* web: biome-ignore … */}` among JSX children, where a line comment is text
- Files `kebab-case.tsx`; components `PascalCase`; vars and functions `camelCase`; true
  constants `SCREAMING_SNAKE_CASE`
- Prefix an unused parameter with `_`; `unknown` over `any`, which is an error
- Comments explain **why**, not what. A comment that restates the line below it is noise. The
  comments worth writing here are the ones that say what went wrong without the line
- Re-export with `import` + `export { … }`, never `export … from` — the shadcn CLI rewrites
  import declarations against a consumer's aliases and leaves re-export declarations alone, so
  the `from` form installs pointing at a directory the consumer does not have. `registry:check`
  rule 12
- Tailwind variants are literal class maps (`const SIZES = { sm: "sm:max-w-sm" }`), never
  composed strings — the scanner reads source text, so a built class name is never generated.
  A class-map constant is applied by the file that owns it — `registry:check` rule 8
- Colour classes name a token, never Tailwind's palette or a shadcn alias —
  `registry:check` rule 9

The full authoring rules are [`docs/component-conventions.md`](docs/component-conventions.md).
The slot vocabulary (`contentSlot`, `title`, `description`, `iconSlot`, `actionSlot`, `footerSlot`,
`footerActionsSlot`, `emptySlot`, `loading`, `<slot>ClassName`) is the part to know before writing
a prop; the skill teaches it in [`skill/vocabulary.md`](skill/vocabulary.md).

**A prop that takes elements ends in `Slot`.** It is typed `SlotNode` (`registry/lib/utils.ts`):
an element, several, or nothing — never a bare string or number, because React Native draws text
only inside a `<Text>`. A prop that takes words (`title`, `description`, `label`) has no suffix,
and the component puts the `<Text>` around them itself. A prop that accepts either keeps the bare
name: `MenuItem`'s `trailing`, `Button`'s `content`. A slot's class prop is named without the
suffix — `contentClassName`, not `contentSlotClassName`.

**No shell takes `children`.** The body is `contentSlot`, a prop like every other slot, because in a
layout every part is dynamic and none of them earns the privileged position. A component that
accepts children is a component that has to answer "and what if both were passed?" — see rule 1
of the conventions doc. `Button` keeps the rule too — `iconSlot`, `content`, `trailingSlot`, `linkSlot` — which
is what lets `loading` swap the icon for a spinner; it is the one primitive whose web half is not a
superset of shadcn's. The compound primitives (`Card`, `Dialog`, `Tabs`) take children, as
shadcn's do.

## Before you commit

```bash
npm run build     # tokens → compile → typecheck → registry:build → page:build → skill:build → registry:check
npm run check     # the same, read-only: what CI runs
```

A change to how files are placed, imported or depended on also gets `npm run install-test`, which
`shadcn add`s every item into scratch web and native apps and runs their `tsc`. It needs the
network, so it is not in `check`.

`npm run check` is `tokens:check`, `compile:check`, both typechecks, `registry:check`,
`page:check`, `skill:check`, `docs:check`, Biome and the tests. It is read-only, so a failure in it is either a
real fault or a generated file (`dist/`, `compiled/`, `public/r/`, `public/index.html`, `skill/install-paths.md`) that
`npm run build` has not been re-run for. Commit the regenerated files with the change that made
them.

The story tests open a Chromium, and two of them on one machine kill each other: the run ends
with "Browser connection was closed". Where more than one checkout shares the machine, every
`npm test`, `npm run check` and `npm run install-test` takes the same lock
(`flock "$HOME/.cache/cubeui-test.lock" npm run check`), and a git worktree is made outside this
directory, so the tools here never find a second copy of the project.

**A `waitFor` callback only reads.** `waitFor` runs its callback again on every change to the
document, so a callback that changes it — appends a node, sets an attribute or a style — calls
itself in a loop of microtasks that `waitFor`'s own timer never gets between. A condition that
never comes true then hangs the renderer for the whole test timeout instead of failing in a
second (#497). `tokenColor` is safe there: it spells a colour out in a shadow root, which no
observer of the document sees. Work out anything else that touches the page before the `waitFor`.

## Keep the skill in sync

[`skill/SKILL.md`](skill/SKILL.md) is how an agent in a *consuming* project learns these
components. A new component, a renamed prop or a changed default is not finished until it is in
there. Consumers copy these files from this repository, so a stale skill is a stale skill in
every project that took it.

The skill is not a registry item. It is plain files, and how a consumer gets them to their agent
(a skills directory, a skills server, something else) is theirs to choose, so do not write an
install path into the skill or the README.

**Edit it in `skill/`, never in `.claude/`.** That directory is a tool's working directory, not a
source directory — this repo ignores `.claude/worktrees/` and most projects ignore the whole
thing. `.claude/skills/cubeui/SKILL.md` is a pointer at these files so that this repo's own
agent reads the copy consumers take, rather than a second copy that drifts from it.

The split is load-bearing. `SKILL.md` is the router — which platform half you are in, the install
line, the web choosing table, the rule that no shell takes children, and no inline edits — and it
is short because it is the part that is always in context. [`vocabulary.md`](skill/vocabulary.md)
is the slot vocabulary, layer by layer, loaded by anyone writing a slot prop; it left `SKILL.md`
when that file passed 25 KB. [`native.md`](skill/native.md) is the choosing table for an Expo app. The rest is one file per component group —
[`layout/`](skill/layout/index.md), [`forms/`](skill/forms/index.md) and
[`controls/`](skill/controls/index.md), each with an `index.md` holding what its files share —
read when the table sends the agent to one of them. Something only one path needs goes in that
path's file, not in `SKILL.md`.

**Keep every file small enough to read whole.** A skills server hands an agent a file in one read
and refuses or truncates a large one (#387), so no file is over 25 KB, `SKILL.md` included, a file
over 300 lines opens with a contents list, and every link between the files resolves to a heading
that exists. `npm run docs:check` fails on each of those. When a file outgrows its budget, split
it by component group and update the links, not the budget.

**`skill/install-paths.md` is generated** — every item's half, where it lands and its import
line, from `registry.json`, `registry.web.json` and `components.json`. `npm run build` rewrites
it and `npm run skill:check` fails CI on a stale one; never edit it by hand.

**The props tables are generated too.** A `<!-- props:CardLayout -->` … `<!-- /props -->` pair in
a skill file is filled by `scripts/build-props-tables.mjs` from the TSDoc on that component's
props type: one row per prop declared in the item's own files, a line naming the props it takes
from another item's. So the TSDoc *is* the props documentation — write each prop's first
paragraph for a reader choosing it — and a new shell or control gets a marker beside its first
example. `skill:check` fails on a table that no longer matches.

A union props type is one table. A prop is one row, its type what any member allows, and its text
from the member that allows it — so the TSDoc goes there, not on a `never`. A prop only some
members allow says which: `notFoundLabel` (required with `record`). A type written as a constant
(`keyof typeof SIZES`) or as an alias of values (`SplitWidth`, exported or not) is printed as its
values, and cva's `| null` on a variant is left off (#492). Both modes fail on a row typed `never`
or still reading `keyof typeof` (#463), and on a row with no description: a prop with no TSDoc is
a prop the reader cannot choose (#492).

A new item goes in its topic file **and** gets a row in the choosing table; a new slot word
goes in `vocabulary.md` and in rule 2 of the conventions doc, because those two are the
same list. `npm run docs:check` is what makes that true rather than intended — it compares the
words layer by layer and fails CI on a word written into one of them and not the other. Say it in
both voices: the conventions doc argues the word, the skill hands it to an agent. A new file
is linked from its directory's `index.md`, from `SKILL.md`'s choosing table, and from the pointer
in `.claude/skills/cubeui/SKILL.md`.

## Git

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, with an
  optional scope (`feat(layout): …`). Subject in the imperative, lowercase after the colon, no
  trailing period. The body says why, wrapped at 80
- Run `npm run check` before every commit
- Branch for the work; `main` is what CI and Pages watch
- **Never rebase — merge.** `git merge origin/main` to bring main into a branch

## Where the source material is

The duplication these components replace, and the prior art worth reading before writing a new
one:

| Path | What is there |
| --- | --- |
| private project 1, `app/layouts/` | `header-content-footer`, `sticky-header-content-footer`, `split-pane` — the chassis this set is built on, and the best commentary on *why* a layout is a component |
| `~/code/cubicecho/ai_tools/kanban_server/web/components/` | `form-dialog`, `confirm-button`, `board-card` — a shell that already exists, and what it cost to not have one |
| `~/code/cubicecho/ai_tools/mcp/mcp-router/app/src/components/` | `workspace-dialog`, `members-card`, `connect-card` |
| `~/code/cubicecho/apps/eunomia/apps/web/src/components/` | `confirm-delete`, `rules/*-card`, `dashboard/stat-tiles` |
| `~/code/cubicecho/apps/philotes/app/src/components/layouts/` | `section`, `header`, and `dashboard/widget` |
| `~/code/cubicecho/ai_tools/task_server/web/components/app-shell.tsx` | `Page` — the same forty lines as kanban's, and the reason `PageLayout` exists |
| private project 1, `app/components/shared/` | the most mature version of this idea anywhere here: `fact-grid`, `list-page-header`, `field-section`, `tooltip-icon`, `confirm` |
| `~/code/cubicecho/ai_tools/min-agent/mobile/` | the Expo app whose hand-converted palette is why `tokens/` exists |

## Surveyed and deliberately not built

Recorded so the next pass does not re-derive them:

- **`AppShell`** (sidebar + header + main). Five apps hand-roll it — kanban, task_server,
  mcp-router, mcp-skills-manager, notes — and the two mcp apps are near-forks (their
  `token-gate.tsx` differs by 4 lines out of 67). Not built as a shell: the layout half is
  `@cubeui/sidebar`, and the genuinely shared part between the mcp apps is auth, which is rule 5.
  The one layout piece still hand-written in six of them — the `md:hidden` bar with the brand and
  icon nav over a rail hidden below `md` — is `SidebarLayout`'s `sidebarHideBelow` with `brandSlot`,
  `navSlot`, `status` and `actionSlot`, a widening rather than a new `app-shell` item, which would also
  have collided with mcp-ragdown's own `components/app-shell.tsx` on install. The links in that
  bar are `@cubeui/sidebar`'s `AppBarItem` — the rail's row with only the icon drawn — so the
  apps' own link classes, and the counts they dropped on the bar, go with it. The bar itself is
  `@cubeui/app-bar`'s `AppBar`, which an app with no sidebar puts over its page on its own.
- **The list row** (`badges`, `title`, `meta`, `actions`, `dim`). 99 instances of
  `flex items-start justify-between` across 8 projects. Settled: once kanban installed
  `@cubeui/item`, the plain row *was* `Item` and its `row-card.tsx` was deleted rather than
  upstreamed — `dim` is one `className` on `ItemContent`, which is not a component. What `Item`
  had no answer for was the row that **opens**, so `DisclosureRow`, now `CollapsibleRow`, is what
  shipped.
  `Item` had no answer for a React Native app either, and five Expo apps drew the row by hand,
  so `ListItem` (`registry/layout/list-item.tsx`) is that row on both halves — `leadingSlot`,
  `title`, `description`, `meta`, `actionSlot`, and an optional pressable middle. `Item` itself now
  has a native half (`registry/ui/item.tsx`, classes shared through `item-base.ts`), and the two
  are one drawing of a row: `ListItem` is `Item`'s parts at `size="sm"` — `Item` the box,
  `ItemMedia` the `leadingSlot`, `ItemContent`, `ItemTitle` and `ItemDescription` the words,
  `ItemActions` the `actionSlot` — and adds only what `Item` has no part for, the pressable middle
  and `meta`. `sm` is `ListItem`'s metrics and `default` stays shadcn's, so a DOM app's rows draw
  as they did and a row composed from the parts at `sm` lines up with the `ListItem`s beside it.
  `CollapsibleRow` is a `ListItem` that opens, built on the same `Item` at `sm`, `ListItem`'s words
  and `Collapsible`'s button, so the row that opens is on both halves too and looks like the rows
  beside it.
  The list around the rows came last (#325): llm-router wrapped its four lists in a `RowList` of
  its own, and three more apps wrote the `<ul>`, the `divide-y` and the row padding by hand, so
  `List` (`registry/layout/list.tsx`) is that `<ul>` on both halves. It wraps each element of
  `contentSlot` itself, as `GridLayout` does, and has no empty or loading state: `LoadState` sits
  above it.
- **`FileTree`** (#226). mcp-skills-manager drew a skill's files on raw `<li>` and `<button>`,
  and mcp-ragdown then carried a second copy for its notes, each with its own `buildTree`.
  Settled: `buildTree` is `registry/lib/tree.ts` and the look is `registry/layout/file-tree.tsx`,
  one source for both halves. A file's row is a link (`linkSlot`) or a button (`onSelect`), row
  actions are siblings of it and hidden only where a pointer can hover, folders fold, and it is
  a list of lists rather than a `role="tree"`, which would promise arrow keys on two platforms.
  A row is dragged onto a folder (#263) and the tree only says so: `onMove(from, into)`, with
  `canMove` to refuse a target. The drag is HTML's, so it is the web half with a pointer; the
  keyboard, a touch screen and a native build move a row through the app's own "Move to…"
  action, which is why `onMove` is never the only way in.
- **`EmptyState`**. ~30 files hand-roll "no results". `@cubeui/empty` is the primitive, and
  `CardLayout` already has the slot. `EmptyState` did ship later, as `@cubeui/empty-state`, and `empty`
  is now shadcn's parts on both halves drawn the same way — `EmptyState` is built on them.
- **`FactGrid`** (private project 1's is excellent — it replaced 10 hand-rolled `<dl>`s and 5
  copies of a `Fact` helper, one of which had lost its `<dt>`/`<dd>`). Fails rule 1's two-project
  bar: cubicecho has 4 `<dl>` files and they are all in one app. Superseded by
  `@cubeui/description-list` (#135), now `property-list`, once mcp-ragdown's settings page became
  the second app with a hand-built label / value / hint row — as a list of rows rather than a
  grid, because the rows are what those settings pages are made of.
- **Inline edits — never add them back.** `InlineTextEdit` and `InlineNumberEdit` (a value
  shown as text that became an input on press, committing on blur) were removed. Every form and
  input in this set is explicit: a field is always drawn as a field, and an edit goes through a
  form with a Save — a `DialogLayout` holding the form, for a rename. Do not rebuild the pattern under another name,
  as a prop on `Text` or a heading, or as a documented recipe, however many apps hand-roll it;
  rule 1's evidence does not apply to this one.
- **`FormDialog` — removed (#273).** `@cubeui/form-dialog` was dialog chrome that took `children`
  and a `FormDialogFooter`, on both halves, beside a `DialogLayout` that already owned the shape
  with slots and the unsaved-changes guard — and the skill said both "use it" and "there is none".
  A form in a dialog is `DialogLayout` on both halves. Do not add a second dialog shell for forms;
  what a form needs from its dialog goes on `DialogLayout`.
- **`FormButtons`**. Too bound to private project 1's `isNew`/`isDeleted`/restore vocabulary to
  port.
- **`SliderField` / a slider control.** Asked for and not built, and the grep that suggested it
  was wrong. Of the eight files matching `<Slider`, three are `rc-slider`, three more are a theme
  demo and a story, and exactly one is a real shadcn `Slider`: private project 1's
  `ut-ui/icon/icon-picker.tsx`, unbound, in one project. One call site in one project fails
  rule 1 twice over. There is also a blocker: Radix names a thumb only when there are two or more
  of them, and shadcn's `Slider` forwards nothing to its thumbs — so a single-thumb shadcn slider
  has an unnamed `role="slider"`, which axe reports.
- **`RadioGroupField` was built on the shell, not on the evidence.** All 20 `<RadioGroup` uses
  were private project 1's theme demos, its story and the primitive itself. It shipped because
  `asGroup` had to be built anyway and this is what proved it worked, and it is on both platforms
  now because a React Native app needed a radio group. Do not cite it as precedent for skipping
  rule 1.
