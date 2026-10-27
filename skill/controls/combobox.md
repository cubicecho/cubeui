# Combobox and segmented control

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Segmented control

A row of three or four pills, one current, that switches a view or a period rather than opening a
panel (that is `Tabs`). `@cubeui/segmented`, on both platforms:

```tsx
<SegmentedGroup aria-label="Scale view" value={view} onValueChange={setView}>
  <SegmentedButton value="relative">Relative</SegmentedButton>
  <SegmentedButton value="parallel">Parallel</SegmentedButton>
</SegmentedGroup>
```

With an icon on each pill, and the labels dropped on a narrow screen:

```tsx
<SegmentedGroup aria-label="Editor view" labelHideBelow="sm" value={view} onValueChange={setView}>
  <SegmentedButton value="edit" iconSlot={<Pencil />}>Edit</SegmentedButton>
  <SegmentedButton value="preview" iconSlot={<Eye />}>Preview</SegmentedButton>
</SegmentedGroup>
```

**Put the pills in a `SegmentedGroup`; do not write the row yourself.** The group is the
`role="group"` that says what the pills choose between. Without it, a screen reader hears
"Relative, toggle button, pressed" and nothing about what Relative was chosen from. Name it with
`aria-label`, or with `aria-labelledby` pointed at a visible heading (`nativeID` on device). Inside
a `FormField`, pass `asGroup`, which does that for you (see [forms/form-field.md](../forms/form-field.md#a-group-of-controls-is-still-one-field)).

- **`value` and `onValueChange` go on the group**, and each pill takes its own `value`. The group
  works out which pill is pressed, and a press calls `onValueChange` with that pill's `value`. The
  value is the caller's: the group keeps no state.
- **`active` still works.** A pill given `active` uses it instead of the group's `value`, so older
  call sites with `active={view === "relative"}` keep working inside a group. A pill's own
  `onPress` (`onClick` on the web) still fires after the group is told.
- **`variant`**: `framed`, the default, is an input-height box (`h-10`, a border,
  `bg-background`), so the control lines up beside a `Select` or an `Input`. `plain` is the pills
  alone, for a toolbar or a nav bar.
- **`iconSlot` on a pill** is drawn before the label. Pass a bare `<Pencil />`: the pill lays the two
  out in a row, sizes the icon and gives it the label's colour, chosen or not, on both platforms.
  Do not write the row, the icon's size or a `<span>` for the label yourself, and do not put the
  icon in `children`, where on device it takes no colour.
- **`labelHideBelow` on the group** makes the pills icons alone: `always`, or under a width
  (`sm` / `md` / `lg` / `xl`) with the label back above it. It is on the group because the pills
  in a row should agree. The string child is still required and is still the pill's name, so
  write no `aria-label`. A pill with no `iconSlot` keeps its label.
- The pills are toggle buttons with `aria-pressed`, not radios. For a choice that belongs in a
  form and reads as a list of options, use `RadioGroup`.
- The group is generic over its value. Give it a `value` typed as a union (`"week" | "month"`,
  a `Channel`) and `onValueChange` is called with that union, so `onValueChange={setView}` or
  `field.handleChange` takes it as it is. Do not look the value up again or write `next as Channel`.
- A pill that navigates is a router link, not a `SegmentedButton`. Give the link
  `segmentedItemClass(active)` and put it in a `SegmentedGroup variant="plain"` for the name.

## Combobox

```tsx
<Combobox options={LISTS} value={list} onValueChange={setList} placeholder="Choose one" />
<Combobox multiple options={TAGS} value={tags} onValueChange={setTags} placeholder="No tags" />
```

One control for a value chosen from an array of options. Without `multiple` it holds one `string`;
with it, a `string[]`, shown as chips on the trigger ([Several at once](#several-at-once)).

`options` is `{ value, label, group?, keywords?, disabled?, hint?, meta?, color?, className? }[]`
— one `SelectOption` type for both — plus `{ separator: true }` for a rule and
`{ note }` for a row that is not a choice — the same array
`SelectField` takes, because `SelectField` renders this. Reach for it in a filter bar, a toolbar,
or a `useState` screen; inside a TanStack form use `SelectField` and never wire this by hand.

**It is not shadcn's `Select`.** The primitive at `@/components/ui/select` takes children; this
takes `options`. Nor is it shadcn's own `combobox` item, which installs to
`components/ui/combobox`: this one is at `components/combobox`.

The two can be installed side by side, since they are different files, but then an editor offers
two `Combobox`es to import. Theirs is a set of parts over `@base-ui/react` (`ComboboxInput`,
`ComboboxContent`, `ComboboxItem`…) and takes children; ours takes `options`. An app that wants
only this one does not install theirs, and can have the linter refuse the import, in its
`biome.json`:

```json
{
  "linter": {
    "rules": {
      "style": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "@/components/ui/combobox": "Use Combobox from @/components/combobox."
            }
          }
        }
      }
    }
  }
}
```

- **On both halves.** Same import, `@/components/combobox`, on both.
- **Single and not `searchable`, the menu is the plain `Select` listbox**: radix's listbox under
  the trigger on the web, the `Select` sheet on device. With `searchable`, `onCreateOption` or
  `multiple` it is a `Popover` over a `Command`. Groups, separators, notes, `open` and
  `onOpenChange` behave the same in both, and the trigger is the same box.
- The trigger is what carries the wiring. The `Select` root renders nothing, so an `id` or an
  `aria-invalid` put on it goes nowhere — this takes the rest of the trigger's props (every
  `<button>` prop on the web; `id`, the `aria-*` props and `onBlur` on device) and spreads them on
  the trigger, which is why it drops straight into `FormField`'s **function form**:
  `controlSlot={(wired) => <Combobox {...wired} options={…} … />}`.
- Full width by default, because a column of selects that each shrink to their longest option is
  ragged. Pass `className="w-40"` for a toolbar; the later width wins.
- `contentClassName` is the dropdown's class. `className` is the trigger's, which is the control.
- `className` **on an option** is the row's, on the `SelectItem`. Reach for it when the values are
  identifiers rather than prose — model ids, SHA prefixes, file paths are `font-mono`. Wrapping
  the label in a `<span className="font-mono">` styles the text and leaves the row's padding,
  tick and highlight in the body face.

An option that is not a peer of the others says so in the array rather than in its own label:

```tsx
<Combobox
  options={[
    { value: "stay", label: "Stay here" },
    ...lanes.map((lane) => ({ value: lane.id, label: lane.name, group: "Lanes" })),
    { separator: true },
    { value: "archive", label: "Archive it" },
  ]}
  value={destination}
  onValueChange={setDestination}
/>
```

Drawn in the order given, never sorted — a board's lanes are ordered and alphabetical would be
wrong. A flat `{ value, label }[]` draws flat.

### A list too long to scroll

`searchable` puts a search box above the list. Without it there is no box, and the menu is the
plain listbox.

```tsx
<Combobox
  searchable
  searchPlaceholder="Find a model…"
  options={models.map((m) => ({ value: m.id, label: m.id, keywords: [m.provider] }))}
  value={model}
  onValueChange={setModel}
/>
```

- It matches an option's label, its `group` heading and its `keywords`, every typed word in any
  order. A `label` that is a node cannot be searched, so give that option `keywords`.
- `searchPlaceholder`, `searchLabel` (the box's accessible name) and `emptyMessage` are read only
  when `searchable` is on.
- `searchable` is off by default without `multiple` and on by default with it.
- `onCreateOption` offers to create what a search matches nothing for; given it, a single
  combobox draws the search menu whether or not `searchable` is set. `createLabel` words the row.
- **`freeText` takes what was typed as the value.** The create row ("Use “…”" by default,
  `createLabel` to rename it) sets `value` to the text, and the trigger shows a held value no
  option covers as its own text, ticked in the menu. The options become suggestions: a model id
  from a list fetched when it opens, which the reader can still type past. `freeText` stands in for
  `onCreateOption`; pass one or the other.
- In a form: `<field.SelectField searchable options={…} />` on `@cubeui/app-form`, and
  `<field.ComboboxField searchable options={…} />` from `@cubeui/combobox-field` on
  `@cubeui/form`. See [forms/native.md](../forms/native.md#on-react-native).

### A menu that fills when it opens

A list the server owns should not be fetched on mount: a form of twenty fields would ask for
eighteen lists nobody opens. `onOpenChange` is what makes that possible, and `{ note }` is where
the menu says it is still working.

```tsx
const [opened, setOpened] = useState(false);
const models = useQuery({ queryKey: ["models", endpoint], queryFn: fetchModels, enabled: opened });

<Combobox
  value={model}
  onValueChange={setModel}
  onOpenChange={setOpened}
  placeholder="Choose a model"
  options={[
    ...(models.data ?? []).map((m) => ({ value: m.id, label: m.id, className: "font-mono" })),
    ...(models.isFetching && !models.data ? [{ note: "Loading…" }] : []),
    ...(models.error ? [{ note: models.error.message, className: "text-negative" }] : []),
  ]}
/>
```

- `onOpenChange` is the root's, so it is a prop here rather than something spread on the trigger.
  Pass it alone to be told; pass `open` with it to drive the menu yourself. The `select` primitive
  underneath takes the same pair, on both platforms.
- **A note is not a disabled option.** That is the workaround every hand-written version reaches
  for, and it is a row the keyboard walks onto and a reader hears as a choice they may not have.
  The row is `aria-hidden` and the words are announced from a `role="status"` region beside the
  control — unreachable, and read out when it appears, which is the case exactly, since the menu
  opens before the list exists.
- `SelectField` takes `onOpenChange` too, so a fetched list inside a form does not have to drop
  to `FormField`'s function form to get one word through. On `@cubeui/form` that is
  `ComboboxField`.
- A single `Combobox` has no row for "nothing". In a form, `clearable` on the field adds one and
  writes `null`; outside a form, put the row in `options` and name its value yourself.

### Several at once

`multiple` makes it a tag picker: the trigger shows what is chosen as chips, and a searchable list
is behind it, over `Popover`, `Command` and `Badge`.

```tsx
<Combobox
  multiple
  options={TAGS}
  value={tags}
  onValueChange={setTags}
  placeholder="No tags"
  onCreateOption={(name) => createTag(name)}
/>
```

- `value` is `readonly string[]` and `onValueChange` is handed the next `string[]`. The two shapes
  are one discriminated union on `multiple`, so a `string` value with `multiple` is a type error.
- `searchable` is on by default and `keywords` widen what a search matches beyond the label.
- `onCreateOption` offers to create what a search matches nothing for. Without it, a search that
  matches nothing says `emptyMessage`. `isAddableOptionName` from `@/lib/select-options` is the
  test the create row uses.
- **`freeText` with `multiple` is a tag input**: each typed value becomes a chip, with
  `options={[]}` when there is nothing to suggest. A value already held, in any case, is refused —
  no create row, and `duplicateMessage` (default `“text” is already added.`) is read out from a
  `role="status"` region under the list. `onRefusalChange` is handed that message, and
  `undefined` once the search changes or the menu closes; `ComboboxField` shows it as the field's
  error.
- `clearable` (default `true`) is the Clear button under the list. It is on the `multiple` half
  only.
- `maxDisplay` caps the chips on the trigger and the rest become a count.
- A held value no option covers is not drawn. `withOrphanOptions(options, value)` from
  `@/lib/select-options` appends a row for each, labelled with the value.
- `color` on an option draws a dot, and the tick on a chosen swatch picks its own contrast.
- `hint`, `meta`, `disabled` and `color` are read by the searchable menu, single or multiple; the
  plain listbox reads `disabled` and ignores the other three.
- **`hint` on an option says why it is the way it is** — most often why it is `disabled`. Drawn
  under the label and read after it, never as part of the name. A disabled row fires no hover,
  so a tooltip there is text nobody can reach, and greyed out on its own reads as a bug in the
  picker: "waiting on this would close a loop", "already applied by a rule", "not on your plan".
  Same argument as `Button`'s `hint`.
- **`meta` on an option is the end of the row** — a status badge, a count, a date. Read after the
  name, never as part of it, and never on the chip: the chip is the label and stays a string. Do
  not reach for `color` for this. That is the chip's colour, and pointing it at a status mints a
  second colour vocabulary beside the app's own.
- **`group` on an option is a heading over the rows that share it.** Drawn in the order given,
  not sorted — a board's lanes are ordered and alphabetical would be wrong. The heading is
  searched along with the row, so typing a lane's name still finds the cards in it, and a group
  whose rows are all filtered out hides itself.

`label` is still the row, the chip and what the search matches, so anything that is not the name
goes in one of those three rather than into the label. `"Fix billing (archived)"` is a row saying
its status by having it typed into its name, and it says it on the chip too.

Its trigger is a real control that takes an `id` and the `aria-*` props, which is why it works
inside a `FormField` — but pass them through the **function form** of `controlSlot`, since its root
is a `Popover`. `ComboboxField` already does.

- **On the web** the list is radix's popover over cmdk: portalled, the width of the trigger,
  arrow keys and Enter, and the create row pinned to the bottom of a long list.
- **On device** the trigger opens `Popover`'s native sheet over `Command`'s native list, and a
  row is chosen by pressing it. Every chip on the trigger is also removable with its ✕ — a
  `Badge` with `onRemove` — since there is no keyboard to reopen the list and untick it with.
  The search matches every word on both halves (`matchesEveryWord`), so the same typing finds the
  same rows.
- In a form it is `ComboboxField multiple`: from `@cubeui/combobox-field` on `field.*` through
  `createAppForm` — see [forms/native.md](../forms/native.md#on-react-native) — and from `@cubeui/app-form` on the
  web's one-line fields.
