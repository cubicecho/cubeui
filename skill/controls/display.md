# cubeui controls: Badges, alerts and progress

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

## Progress

```tsx
<Progress value={done} max={turns} label="Re-embedding progress" valueLabel={`${done} of ${turns} turns`} />
<Progress value={job.progress * 100} label={`${job.name} upload`} />
```

<!-- props:Progress -->
`Progress`'s props, from the TSDoc in `registry/ui/progress.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `className` | `string` |  |  |
| `value` | `number \| null` |  | How much is done, from 0 to `max`. Clamped to that range. Left out (or `null`), the bar is indeterminate: drawn empty and announced with no value, as Radix's is — not animated. |
| `max` | `number` | `DEFAULT_MAX` | What `value` is out of. 100 unless given, so a percentage needs nothing. |
| `label` | `string` |  | What is progressing — "Re-embedding progress". The bar's accessible name. |
| `valueLabel` | `string` |  | The value in words, read instead of the bare number: "1,204 of 5,880 turns". Without it a screen reader says the percentage, which is right when the number means nothing else. |
| `indicatorClassName` | `string` |  | The filled part: `bg-negative` for a context window nearly full. |
<!-- /props -->

`@cubeui/progress`, on both halves, for a bar showing how much of something is done — an upload,
a re-embed, a context window filling. It is one self-closing element: do not draw a track `div`
with a filled `div` and a `style.width` inside it.

- `value` is shadcn's: 0 to `max`, and `max` is 100 by default, so a percentage needs nothing
  else. It is clamped to `[0, max]`, so an overshoot draws a full bar, not a longer one.
- It is `role="progressbar"` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`. `label`
  is its accessible name; give one, since a bar with no name is read as "progress bar, 40%".
  `aria-label` works too, so a shadcn call site ports unchanged.
- `valueLabel` is the value in words, read instead of the number ("1,204 of 5,880 turns"). Leave
  it out when the percentage is what the number means.
- No `value` (or `null`) is indeterminate: drawn empty and announced with no value. It does not
  animate. A wait with no known end wants a [`Spinner`](#spinner), not an empty bar.
- `className` is the track (`h-1.5` for a thinner one); `indicatorClassName` is the filled part
  (`bg-negative` for a context window nearly full). Colours are tokens, as everywhere.
- A bar of several coloured segments (a breakdown, a stacked share) is not a progress bar and not
  this component.

## Colour

```tsx
<ColorPicker value={color} onValueChange={setColor} clearable />
```

<!-- props:ColorDot -->
`ColorDot`'s props, from the TSDoc in `registry/ui/color-dot.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `color` (required) | `string` |  |  |
| `size` | `keyof typeof SIZES` | `"md"` |  |
| `className` | `string` |  |  |
| `label` | `string` |  | What the colour stands for, exposed as the accessible name. |
<!-- /props -->

- It is drawn inline, not in a popover: a row of swatches over a hex field, one source for both
  platforms. `<input type="color">` has no native counterpart, so there is no OS colour well.
- The value is a hex string, `#rgb` or `#rrggbb`; `null` and `""` both mean no colour.
  `normalizeHex` and `isHexColor` are exported for a caller that validates its own — the hex
  field reports what is typed as it is typed, so validating is the caller's.
- `onValueChange` and `onChange` are the same callback under two names, and `swatches` and
  `colors` the same list; the default is 16 Tailwind 500s. The swatch row is a `radiogroup` of
  radios, each named by its hex, with a tick drawn in `readableTextColor` of the swatch.
- `clearable` (off by default) draws a Clear button, labelled `clearLabel`, that commits `""`.
- `placeholder` is the hex field's; `hexLabel` names the hex field for a screen reader (web
  only); `swatchesLabel` or `aria-label` names the swatch row. `disabled` blocks all of it, and
  `contentClassName` reaches the swatch row.
- `popoverLabel` and `customLabel` are accepted from the popover picker's API and ignored —
  there is no popover to name and no colour well to label.
- `id` goes to the hex field and the `aria-*` props to the swatch row, so a field's function-form
  `controlSlot` can spread onto it.

Showing a colour the user picked is three small items, all on both halves:

```tsx
<ColorDot color={tag.color} label={tag.name} size="sm" />
<Card accentColor={project.color} accentLabel={project.name}>…</Card>
<span style={{ background: tag.color, color: readableTextColor(tag.color) }}>{tag.name}</span>
```

- **`ColorDot`** (`@cubeui/color-dot`) — a round swatch standing in for a category, status or
  tag in a list; `size` is `sm` or `md`. Without `label` it is decoration and hidden from
  assistive tech; with one, the label is its accessible name.
- **`accentColor`** on `Card` draws a left-edge stripe (`@cubeui/color-bar`), normalised so it
  stays visible in both themes, and `accentLabel` names it. Pass it on `Card` rather than placing
  a `ColorBar` yourself — the card owns the `relative overflow-hidden` the stripe needs.
- **`readableTextColor(color)`** (`@cubeui/readable-text-color`) — black or white ink for text on
  a user-chosen backdrop, by WCAG contrast. It does not flip with the theme, because the backdrop
  does not. It returns `undefined` for anything that is not hex, so the text falls back to the
  inherited foreground. Do not hardcode white on a chip: it fails AA on about half of any palette.

## Removable badge

A tag or filter chip the user can take off is `Badge` with `onRemove`, on both halves:

```tsx
<Badge
  backgroundColor={tag.color}
  textColor={readableTextColor(tag.color)}
  onRemove={() => untag(tag)}
>
  {tag.name}
</Badge>
```

<!-- props:Badge -->
`Badge`'s props, from the TSDoc in `registry/ui/badge.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `variant` | `BadgeVariant` | `"default"` |  |
| `backgroundColor` | `string` |  | Overrides the variant's background with a literal colour — for a badge standing in for a user-chosen tag or category. Passing it also drops the variant's label colour, since the caller's background is unknown and `text-neutral-foreground` would be a guess. Pair it with `readableTextColor` when the label has to stay legible on an arbitrary hue. |
| `textColor` | `string` |  | Overrides the label's colour, for the same case as `backgroundColor`: with an arbitrary hue behind it, neither the variant's label colour nor the `text-foreground` fallback is guaranteed to be legible. `readableTextColor` is what computes the value to pass. |
| `className` | `string` |  |  |
| `label` | `string` |  | What the dot stands for, exposed as its accessible name. In the pill form the text is already the name, so there it only feeds `removeLabel`'s default when the children hold no text of their own. |
| `onRemove` | `(() => void)` |  | Draws a trailing ✕, a button of its own, that calls this — a tag or a filter chip the user can take off. The ✕ is in the label's colour, and pressing it reaches nothing else on the badge. Ignored by the dot, which has no room for it, and by the web half's `asChild`, whose one child is the whole badge. |
| `mono` | `boolean` | `false` | Sets the label in monospace at normal weight, for a machine string: an id, a tool name, a cron expression. It is on the label's type, not the container, so it reaches the `Text` on native. `variant` stays free for colour. |
| `pulse` | `boolean` | `false` | Pulses the dot, for something live: a run in progress, a connection that is up. The dot only; a badge with children ignores it. It stops for a reader who asked for reduced motion. |
| `removeLabel` | `string` |  | The ✕'s accessible name. Defaults to `Remove <text>`, the badge's own text. |
| `children` | `ReactNode` |  | The label: text, a number, or elements such as an icon beside text. Absent — including an empty string — collapses the badge to a dot. |
<!-- /props -->

- `variant` is shadcn's six (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`)
  and three meanings of cubeui's own: `positive`, `warning` and `info`. There is no `success`: the
  word is `positive`, as on `Button` and in the tokens. A toast's tone is the same word:
  `toast("Saved", "positive")`, beside `error`, `warning` and `info`.
- Each coloured meaning has a `-soft` form: `destructive-soft`, `positive-soft`, `warning-soft` and
  `info-soft`. Use it for a badge that is not the main thing on its row, such as a status in a
  long list, where a solid fill on every row drowns the titles. It is a tint and an edge in the
  hue with a dot before the words, and the words stay the foreground, because the hue on its own
  tint is under 4.5:1. Do not pass `text-negative` to "fix" that. With no children a soft badge is
  the solid dot. `badgeVariants` gives the pill's classes but not the dot.
- It draws a trailing ✕ in the label's colour — the variant's, or `textColor` — at the badge's
  icon size. Do not wrap the badge in a second pill with a `Pressable` beside it.
- The ✕ is a button named `removeLabel`, default `Remove <text>`. On the web it is
  `type="button"`, so it never submits a form, and its press stops there: the badge's own
  `onClick` does not fire. The hit area is bigger than the glyph and the pill is no taller.
- The dot (no children) ignores `onRemove`, and so does the web's `asChild`.
- `mono` sets the label in monospace at normal weight, for a machine string: a tool name, an id,
  a cron expression. Write `<Badge variant="outline" mono>{name}</Badge>`, not
  `className="font-mono font-normal"`: a class lands on the container, which on native does not
  reach the label's `Text`. It goes with any `variant` and with `onRemove`.
- `pulse` breathes a dot for something live: `<Badge variant="positive" label="Live" pulse />`.
  Do not hand-draw a `size-2 rounded-full animate-pulse` span. It pulses on device too (a CSS
  keyframe does nothing there), stops under the system's reduced-motion setting on both halves,
  and is ignored by a badge with children.

## Alert

A callout — a tinted, bordered box saying something about the screen it is on — is `Alert`, on
both halves. Do not hand-draw `rounded-md border border-amber-500/50 bg-amber-500/10` with an icon
and two `<p>`s, and do not reach for `Badge`, which labels a thing rather than explaining it:

```tsx
<Alert
  variant="warning"
  title="Store this token securely"
  description="It will not be shown again."
/>

<Alert
  variant="destructive"
  title="Last error"
  description={server.lastError}
  actionSlot={<Button size="sm" variant="outline" onPress={restart} content="Restart" />}
/>
```

<!-- props:Alert -->
`Alert`'s props, from the TSDoc in `registry/ui/alert.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `variant` | `AlertVariant` | `"default"` | What kind of notice it is, which sets the tint, the icon and the role. `destructive` is an error the reader has to hear now and is announced as an `alert`; the others are a `status`. |
| `iconSlot` | `SlotNode` |  | Before the title. A bare `<RefreshCw />`; the alert sizes it and gives it the variant's ink. Left out, the variant's own glyph is drawn — `Info`, `TriangleAlert` or `CircleAlert` — except on `info`, which is a colour and draws nothing it was not given. `null` draws no icon at all, and the text moves to the edge. |
| `title` | `ReactNode` |  | What happened, in a few words: "API key generated", "Last error". |
| `description` | `ReactNode` |  | The line under the title: what it means, or what to do about it. A link may sit inside it. |
| `actionSlot` | `SlotNode` |  | The far end: one button that deals with it — "Change the embedder", "Retry". |
| `className` | `string` |  |  |
| `children` | `ReactNode` |  | shadcn's compound form: `AlertTitle`, `AlertDescription`, and an icon. See the header for how they are placed. The props are the form to write here; this is the form to port. |
<!-- /props -->

- `variant` is `default` (on the card), `info`, `warning` or `destructive`. It sets the tint, the
  icon and the role — nothing else is coloured: the title and the line under it stay the
  foreground on a tint, because the variant's own hue on its own tint is under 4.5:1. Do not pass
  `text-amber-*` to fix that.
- **Only `destructive` is `role="alert"`**, which interrupts a screen reader. The rest are a polite
  `status`. So a failure the user just caused is `destructive`, and a standing notice — a key shown
  once, a fallback in use, a hint — is `warning` or `info` even when it is urgent-looking.
- `iconSlot` defaults to the variant's glyph (`Info`, `TriangleAlert`, `CircleAlert`), except on
  `info`, which is the blue and draws no icon it was not given. Pass a bare
  `<RefreshCw />` to replace it; the alert sizes it and gives it the variant's ink. `iconSlot={null}`
  draws none.
- `title` and `description` are nodes, so a link can sit inside the description. A description
  with loose text in it is a text element; one that is only elements, such as a `<ul>` of reasons
  or a few paragraphs, is drawn in a block box instead, so the list is valid HTML. On device each
  `Text` inside a block description takes its own ink. `actionSlot` is the far end — one button
  that deals with it.
- shadcn's compound form also works, so a port can leave its call sites alone:
  `<Alert><CircleAlert /><AlertTitle>…</AlertTitle><AlertDescription>…</AlertDescription></Alert>`.
  The icon child goes into the icon box (and replaces the default glyph); the parts go into the
  column. New code uses the props.
- A failed *fetch* on a list page is `QueryState`'s rung, and a crashed route is `RouteError`;
  `Alert` is for what the screen says while it works.

## Spinner

A loading indicator is `Spinner`, on both halves. Do not import `Loader2` / `LoaderCircle` and add
`animate-spin`, and do not reach for `ActivityIndicator`:

```tsx
<Spinner label="Loading servers" className="size-6 text-foreground/60" />
```

<!-- props:Spinner -->
`Spinner`'s props, from the TSDoc in `registry/ui/spinner.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` | `string` | `"Loading"` | The spinner's accessible name, announced by its `role="status"`. Say what is loading when the screen has more than one thing that could be. |
| `className` | `string` |  | Size and colour: `size-6`, `text-foreground/60`. The default is `size-4`. |
<!-- /props -->

- A button that is working is `<Button loading>`, not a `Spinner` drawn inside one — see
  [Button](buttons.md#button).

- It is `role="status"`, named by `label` (default `Loading`). Name what is loading when more than
  one thing on the screen could be.
- `className` sizes and colours it; the default is `size-4`. On the web the glyph is
  `currentColor`; on native it takes a `Button`'s ink the way any icon there does.
- Both halves draw the same `LoaderCircle`, one turn a second. `ActivityIndicator` is the
  platform's own spinner, a different shape on each.
- A list screen's loading rung is `QueryState`'s `loading`, not a spinner in the middle of it.

## Skeleton

```tsx
<Skeleton className="h-4 w-[250px]" />
<View role="status" aria-label="Loading profile" className="gap-2">
  <Skeleton className="h-4 w-1/3" aria-hidden />
  <Skeleton className="h-3 w-2/3" aria-hidden />
</View>
```

`@cubeui/skeleton`, on both halves: shadcn's placeholder, a rounded `bg-foreground/10` block that pulses
while what it stands in for loads. `className` is its size.

- It pulses on both halves: `animate-pulse` on the web, and on device the same opacity curve
  (down to half and back, two seconds) run by `Animated`. No Reanimated needed.
- It says nothing to assistive tech itself, as shadcn's does not. Hide each block with
  `aria-hidden` and put them in a `role="status"` named for what is loading.
- Reach for a shell's `loading` first. `CardLayout`, `QueryState`, `StatTile`, `PageHeader` and
  the form fields each draw their own skeleton for the part the request fills. `Skeleton` is for a
  part no shell covers.

## Separator

```tsx
<Separator />
<Separator orientation="vertical" />
<Separator decorative={false} />
```

`@cubeui/separator`, on both halves: shadcn's one-pixel rule, `bg-foreground/10`, as long as its
container. Use it rather than a `border-b` on the group above or a `h-px` view.

- `orientation` is `horizontal` (the default) or `vertical`. A vertical one fills its row's height:
  `self-stretch` on device, shadcn's `h-full` on the web. Give it a height (`h-4`) when the row is
  taller than the rule should be.
- `decorative` is on by default and hides the rule from assistive tech, since what it divides is
  already divided. `decorative={false}` makes it a `role="separator"`, for a boundary nothing else
  on the screen says.
- On the web it still writes `data-orientation`, so shadcn's
  `className="data-[orientation=vertical]:h-4"` works unchanged; a plain `h-4` works too.
- `Menu` has its own `MenuSeparator`, and `Field` its own `FieldSeparator` with a word in the
  middle. Use those inside them.
