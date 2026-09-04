# Survey: the components these projects already wrapped

**Scope:** the non-shadcn components living in `ui/`, `shared/` and `layouts/` across `auto-cal`,
`philotes`, `mcp-router`, `mcp-skills-manager` and **private project 1**. Dated 2026-09-04.

Survey 1 asked what to delete. This one asks a different question: **where did five teams,
working separately, independently write the same component?** Convergence is the strongest
evidence rule 1 can get — stronger than a count of call sites, because nobody copied it.

Inventory: auto-cal 25 wrapped components, private project 1 40 (33 in `shared/`, 7 in `ui/`), philotes 6,
mcp-router 2, mcp-skills-manager 2.

**Extended by [`remaining-cubicecho-projects.md`](./remaining-cubicecho-projects.md)**, which adds
the other seven cubicecho projects and one new candidate (`useDiscardGuard`), confirms the
`EmptyState` and `QueryState` rejections with fresh evidence, and documents a second fork pair.

---

## A. Already built — and independently confirmed

These are cubeui items that one or more of these projects had already invented on their own. No
work to do; they are here because they are the evidence that the existing items were right.

### `StickyHeaderContentFooter` ← philotes `layouts/list.tsx`

```tsx
<div className={cn('flex flex-col h-full pr-2', className)}>
  <div className="shrink-0 pb-3">{header}</div>
  <div className={cn('flex-1 overflow-y-auto min-h-0', spacing && 'space-y-2')}>{body}</div>
  {footer && <div className="shrink-0 pt-3 border-t">{footer}</div>}
</div>
```

That is the chassis, prop for prop — `header`/`body`/`footer` as nodes, `min-h-0` on the scroller
and all. Written with no knowledge of cubeui. philotes calls the body slot `body`; cubeui calls
it `content`. That is the whole difference.

### `ConfirmButton` ← private project 1's `button.tsx:66` `ButtonWithConfirm`

```tsx
const [open, setOpen] = useState(false);
return (<>
  <Confirm {...props} open={open} onClickNo={() => setOpen(false)}
    onClickYes={async (ev) => { await props.onClick?.(ev); setOpen(false); }} />
  <Button {...props} onClick={() => setOpen(true)} />
</>);
```

Identical to `ConfirmButton`, down to holding `open` in the wrapper rather than using a trigger.
Two people reached the same conclusion about the same Radix problem.

It also carries a comment worth reading before anyone argues the registry is overhead:

> `yes_label` never reached `Confirm`, which reads `yesLabel`, so every caller's affirmative label
> was dropped and the button read "Yes": Delete confirmations included, app-wide.

A silent, app-wide a11y and clarity defect, caused by nothing but a prop name drifting inside a
hand-rolled wrapper. This is the class of bug a registry item with one spelling and a story
suite removes.

auto-cal wrote it twice more: `ui/confirm-dialog.tsx` (55 lines, declarative) **and**
`ui/confirm.tsx` (89 lines, an imperative `await confirm({…})` promise). Two APIs, one app.

### `useAppForm` ← philotes `ui/form-field.tsx`

philotes already runs `createFormHook` with `fieldContext`/`formContext` and a `TextField` that
reads `field.state.meta.isTouched && !field.state.meta.isValid`. It is `@cubeui/app-form` with
one of the five fields written. Its doc comment even states cubeui's own rule — *"calling
`createFormHook` per feature file would mint a separate set of contexts for no gain."*

### `PageHeader` ← private project 1's `list-page-header.tsx` (208 lines) and `edit-page-header.tsx`

Private project 1's is the most developed page header anywhere in these repos: `title`, `description`,
`descriptionDetail` (the long explanation behind an info affordance), `search`/`searchZone`,
`actions`/`actionsZone`, `filterZone`. Two things in it that cubeui's `PageHeader` does not have
and arguably should — see §D.

### `ActionButton` ← private project 1's `button.tsx` `tooltipContent`, kanban `action-button.tsx`

Same idea. Private project 1's is fused into a 244-line button that also does variants, icons, loading,
links and confirm; cubeui's is the same behaviour unbundled.

---

## B. Not built, and the evidence says build it

### 1. `Section` — three projects, three spellings of one class string ★

| Project | File | The heading |
| --- | --- | --- |
| philotes | `layouts/section.tsx:16` | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| auto-cal | `ui/section-heading.tsx` (`overline`) | `font-semibold text-muted-foreground text-xs uppercase tracking-wide` |
| private project 1 | `shared/field-section.tsx:17` | `border-b pb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider` |

The same five tokens in three different orders, disagreeing on exactly two things: `tracking-wide`
vs `tracking-wider`, and whether there is a rule under it. Nobody decided either. All three also
carry an optional action beside the heading and a doc comment describing the same intent — "a
quiet heading above a section", "a named facet of an entity screen".

Three projects, three call sites, zero coordination. This is the cleanest rule-1 case in either
survey, and it is 20 lines.

**Shape:** `title`, `content`, `action?`, `rule?` (private project 1's border), `className`. No state, no
card — philotes wraps it in a `Card`, which is a call-site decision, not the component's.

### 2. `MultiSelect` — two full implementations, 446 lines between them ★

`philotes/ui/tag-multi-select.tsx` (141) and private project 1's `shared/multi-select.tsx` (305). Same core
API — `options`, `value`/`selected`, `onChange`, a searchable popover of checkboxes, selected
items shown as removable chips. Private project 1's is generic over `T` and adds `enableSearch`,
`enableAddThroughSearch`, `clearable`, `showCountInsteadOfItems`. auto-cal has a third, narrower
one in `ActivityTypeSelect`.

shadcn ships no multi-select, so rule 3 does not block it. It is the single largest piece of
duplicated *behaviour* found in this pass.

**Caution:** it is also the most complex thing cubeui would own — a popover, a command list,
keyboard handling, and a chip row. Private project 1's 305-line version generic over `T` is the right
starting point, but this is a week, not an afternoon, and it is the one candidate here that could
plausibly be a dependency instead.

### 3. `ColorPicker` + `readableTextColor` — two projects, one algorithm, two spellings ★

```
auto-cal/ui/color-picker.tsx (74)     value, onChange, onBlur?, colors?,  className?
private-project-1/ui/color-picker.tsx (154)   value, onChange, onBlur?, swatches?, className?, id?, disabled?, placeholder?
```

Near-identical props; `colors` vs `swatches` is the drift. Both are backed by a hand-written WCAG
contrast helper, written twice, arriving at the same answer by two routes:

- `auto-cal/src/lib/utils.ts:56` — `luminance(hex) > 0.179 ? '#0b0b0f' : '#ffffff'`
- `private-project-1/utils/color.ts:25` — computes both contrast ratios and takes the larger

These agree. 0.179 is exactly where the two ratios cross —
`sqrt(1.05 × 0.05) − 0.05 = 0.17913` — so auto-cal's threshold is the closed form of private project 1's
comparison, and auto-cal's comment says so. Two correct implementations of a fifteen-line
function, one of which had to re-derive the constant.

They differ in the part that matters less and costs more: auto-cal parses `#rrggbb` only,
private project 1 parses through a `toRgba` that also takes `rgb()` and named colours, and only
private project 1 exports the `{ backgroundColor, borderColor, color }` style triple that every caller
actually wants.

philotes needs it and does not have it: `ui/label-chip.tsx` tints a chip with a user-chosen hex
and picks its text colour with no contrast check at all — which is the state auto-cal's comment
describes leaving behind ("those all used to hardcode white, which is only right for about half
the palette: white on `#f59e0b` is 2.2:1").

**Ship the helper first.** Fifteen lines, two correct implementations to merge, and a third
project currently shipping the bug both of them already fixed. The picker can follow.

### 4. `ChipInput` / tinted chip — three shapes, one hard part

`auto-cal/ui/toggle-chip.tsx` (77), `auto-cal/ui/status-chip.tsx` (46),
`philotes/ui/label-chip.tsx` (58), plus private project 1's `MultiSelectDisplayItem`.

The three are *not* one component — a lifecycle status pill, a selectable filter pill, and a
user-coloured label with a remove `X` are three intents, and collapsing them would be rule 2 with
extra steps. But they share the one genuinely hard part: **a chip whose background is an
arbitrary user-chosen colour and whose text still has to be readable on it.** That part is §3's
helper. Ship `readableTextColor`, and shadcn's `badge` covers the rest at each call site.

**Verdict: do not build the chip.** Build the helper it needs.

---

## C. Not built, and the evidence says don't

| Candidate | Where | Why not |
| --- | --- | --- |
| `AppLayout` (sidebar shell) | mcp-router 151 + mcp-skills 140, **31 diff lines** | The 31 lines are all identity — icons, nav entries, `useRouterStatus` vs `useServerStatus`, "5/12 servers running" vs "9 skills · 3 workspaces". Everything shareable is already `sidebar`, which shadcn ships (rule 3). The genuinely duplicated part is the *status query*, which is data (rule 5). These two want a shared package, not a registry item. |
| `TooltipIcon` | private project 1 `shared/tooltip-icon.tsx` | Not an action button — `cursor-default`, `aria-label="More information"`, no handler. It is a help hint, and only one project has it. But see §D.1: its a11y trick belongs in `ActionButton`. |
| `ClampedText` | private project 1 `shared/clamped-text.tsx` (169) | Only private project 1 measures whether the text actually overflowed before offering "show more". The other ten `line-clamp-*` sites across six projects are a class on a paragraph and need no component. One project, one implementation — fails rule 1. |
| `LastChange` / relative time | private project 1 `shared/last-change.tsx` (224), philotes `lib/relative-time.ts`, notes app | Two projects and a helper file, so the bar is arguable — but private project 1's 224 lines are about *audit records* (who changed what, when), not about formatting a duration. The shared 20% is a date function, not a component. Extract `relativeTime` as a util if anything. |
| `FormButtons` | private project 1 `shared/form-buttons.tsx` (126) | Already recorded as rejected in AGENTS.md. Still true: it is bound to private project 1's `positive`/`negative`/`warning` variant vocabulary, which no other project has. |
| `NeutralButton`, `PositiveButton`, `SecondaryButton`, `NegativeButton`, `WarningButton`, `DestructiveButton` | private project 1 `button.tsx:90-113` | Six components that differ only by which string they pass as `variant`. This is rule 2's counter-example, live, in production. Do not port it; port the call sites to `<Button variant>`. |
| `Icons` barrel | auto-cal `ui/icons.tsx` (127), private project 1 `ui/icons.tsx` (142) | Two projects, similar idea, entirely different contents — each is its app's icon vocabulary. Sharing the barrel would mean sharing the vocabulary. |
| `QueryState` / `RouteError` / `Loader` | auto-cal (29 + 50), private project 1 `ui/loader.tsx` (13) | Rule 5. These take a query result and decide between spinner, error and data. cubeui shells take `loading` as a boolean and `empty` as a node, and the caller keeps the query. |
| `DateTimeInput`, `DatePicker`, `SearchInput`, `Timeline`, `MiniDonut`, `UploadProgressBar` | one project each | Fails rule 1. Revisit if a second project grows one. |

---

## D. Two things private project 1 does better than cubeui

Found while reading, worth acting on independently of any port.

### 1. `ActionButton`'s tooltip is invisible to a screen reader until it opens

`private-project-1/shared/tooltip-icon.tsx:31` keeps the tooltip text permanently mounted in an `sr-only`
span and points at it with `aria-describedby`:

```tsx
const descriptionId = useId();
<span id={descriptionId} className="sr-only">{tooltipContent}</span>
<TooltipTrigger asChild>
  <button aria-label="More information" aria-describedby={descriptionId}>
```

with the reason on it — *"Keep the description mounted because Radix closes the tooltip when
focus scrolls its trigger into view."*

cubeui's `ActionButton` puts `hint` only inside `TooltipContent`, which is unmounted while closed.
So a button with `label="Delete"` and `hint="Deletes the workspace and its four servers"`
announces only "Delete". When `hint` differs from `label`, it should be in an `sr-only` span with
`aria-describedby` — which also fixes the case where the tooltip never opens because focus moved
by scroll.

**This is a real defect in a shipped item.** Small fix, one new story.

### 2. `PageHeader` has nowhere to put a long description

`ListPageHeader`'s `descriptionDetail` — the rest of the explanation behind a click, when the
one-liner is not enough — is a genuinely good idea we do not have, and its doc says exactly why:
*"without this, a long description simply wraps and pushes the list down."* Worth considering,
though it needs a second project asking for it before rule 1 is satisfied.

---

## What I would do

1. **Fix `ActionButton`'s `aria-describedby`** (§D.1). It is a defect in something already shipped
   and installed, and it is a few lines.
2. **Ship `readableTextColor`** (§3). Fifteen lines, two correct implementations to merge, and a
   third project (philotes) still hardcoding text colour on user-chosen backgrounds.
3. **Ship `Section`** (§1). The cleanest rule-1 case in either survey and the smallest component
   in the registry.
4. **Decide on `MultiSelect`** (§2). The biggest win and the biggest cost; the only item here that
   might be better as a dependency.
