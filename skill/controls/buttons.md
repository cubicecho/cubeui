# cubeui controls: Buttons

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

**Contents**

- [Button](#button)
- [Icon buttons](#icon-buttons)
- [Destructive buttons](#destructive-buttons)
  - [Upgrading an earlier install](#upgrading-an-earlier-install)
  - [Type the name to confirm](#type-the-name-to-confirm)

## Button

`Button` takes no children. What is inside a button is an icon, a label and sometimes something at
the far end, so those are the props:

```tsx
<Button content="Continue" onPress={next} />
<Button variant="info" iconSlot={<Plus />} content="New workspace" onPress={create} />
<Button variant="outline" content={chosen.label} trailingSlot={<ChevronDown />} />
<Button variant="outline" linkSlot={<Link to="/docs" />} content="Docs" />
<Button variant="positive" loading={saving} loadingLabel="Saving…" content="Save" onPress={save} />
```

The examples in this skill write `onPress`, the device's name. **A DOM app writes `onClick`**: the
web half renders a real `<button>` and takes its props. The same holds for every pressable in the
set (see [native.md](../native.md)).

<!-- props:Button -->
`Button`'s props, from the TSDoc in `registry/ui/button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `variant` | `"default" \| "destructive" \| "destructive-outline" \| "positive" \| "positive-outline" \| "info" \| "info-outline" \| "outline" \| "secondary" \| "ghost" \| "link" \| null` |  |  |
| `className` | `string` |  |  |
| `content` | `React.ReactNode` |  | The label. A string is drawn in the variant's ink; anything else is rendered as it is — a select's trigger passes the chosen value's own `<Text>`. |
| `iconSlot` | `SlotNode` |  | Before the label, or alone in an `icon*` size, where `aria-label` is required. |
| `trailingSlot` | `SlotNode` |  | The far end, after the label: a trigger's chevron, a count. |
| `linkSlot` | `React.ReactElement` |  | The link this button is, as an element with no children: `<a href="/docs" />`, a router's `<Link to="/docs" />`. It gets the button's look and press, and the icon and label are put inside it. |
| `loading` | `boolean` |  | Pressed, and the work is still running: disabled, `aria-busy`, and a spinner where the icon is — or before the label when there is none. |
| `loadingLabel` | `string` |  | The label while `loading`: "Saving…". Without one the label stays as it was. |
| `size` | `"icon" \| "icon-xs" \| "icon-sm" \| "icon-lg" \| "default" \| "xs" \| "sm" \| "lg" \| null` |  |  |
| `aria-label` | `string` |  |  |
| `hint` | `React.ReactNode` |  | Why it is unavailable, or what it will do: the tooltip, in place of an icon size's name, and read after the name whether or not the tooltip is open. On device only a string is read; a node is shown and not read. |
| `tooltip` | `boolean` | `true` | Whether the tooltip is drawn: the `hint`, or with none an `icon*` size's `aria-label`. Off, a `hint` is still the button's description. Turn it off where the icon already explains itself. |
| `side` | `TooltipSide` | `"top"` | Which edge of the button the tooltip sits on. |
| `aria-describedby` | `string` |  | More ids to describe the button with, kept ahead of the hint's own. Web only: a device describes a control with its accessibility hint, which is what `hint` becomes there. |
<!-- /props -->

- **`variant`** says what the press does, and each one is a token:

  | Variant | For |
  |---|---|
  | `default` | The emphasis of its row, when none of the meanings below fits |
  | `info`, `info-outline` | Adds something: Add, New, Create. The button that opens a form |
  | `positive`, `positive-outline` | Keeps the work: Save, Confirm. A form's `SubmitButton`, whatever it says |
  | `destructive`, `destructive-outline` | Destroys; the outline when it is not the emphasis of its row |
  | `outline` | A quiet action: Cancel, Close, a trigger |
  | `secondary` | An icon inside a field's own border. Its hover and focus darken its edge, not its fill: the hover grey is the same as its own |
  | `ghost`, `link` | Kept for porting shadcn code. Do not use them in new code: a button looks like a button |

- **`content`** is the label. A string is drawn in the variant's ink. Anything else is rendered as
  it is, so a trigger can pass a `<Text>` of its own with the chosen value in it.
- **Every size has the same corner**, `rounded-md`, `xs` and `icon-xs` included: a smaller button
  is not a rounder one. A `ToggleChip` beside them is drawn as a control too — a `/50` edge at rest
  and the button heights, `h-9` and `h-7` at `size="sm"`.
- **`iconSlot`** goes before the label. Alone, in an `icon*` size, it needs an accessible name, which
  is why those sizes require `aria-label` (below).
- **`trailingSlot`** is the far end: a trigger's chevron, a count.
- **`linkSlot`** is the link the button is, as an element with no children: `<a href="…" />` or a
  router's `<Link to="…" />`. This replaces shadcn's `asChild`. On the web the link is drawn as the
  button; on a device it is expo-router's `Link`, which wraps the button with its own `asChild`.
  Handing a `Button` to a radix trigger is unchanged: `<PopoverTrigger asChild><Button … />`.
  A `disabled` or `loading` link button is not followed. On the web the link is `aria-disabled`,
  its click is cancelled, and it leaves the tab order unless it has a `hint`, as a disabled button
  does. It is never handed `disabled`, which an `<a>` ignores and a router's link may write onto
  its `<a>`. On a device the button is drawn without the link.
- **`loading`** is "pressed, and the work is still running": the button is disabled, `aria-busy`,
  and a spinner stands where the icon is, or before the label when there is none. `loadingLabel`
  swaps the label while it runs. Do not disable it, relabel it and draw a `Spinner` by hand.
  `ConfirmButton` takes the same props; a form's submit is `form.SubmitButton`,
  which sets `loading` from the form and is coloured by what it does (see
  [forms/app-form.md](../forms/app-form.md#a-form)).
- A shadcn call site ports as `<Button>Save</Button>` → `<Button content="Save" />`, and
  `<Button><Plus /> New</Button>` → `<Button iconSlot={<Plus />} content="New" />`. Everything else
  about the web half is still shadcn's: the `<button>` props, the sizes, `buttonVariants`.
- `AlertDialogAction` and `AlertDialogCancel` keep their label as children, as shadcn's do.

## Icon buttons

**An icon-only button is a `Button` in an `icon*` size, and it will not typecheck without a name.**

```tsx
<Button aria-label="Delete workspace" variant="outline" size="icon" onClick={remove} iconSlot={<Trash2 />} />
```

`aria-label` is required in the `icon`, `icon-xs`, `icon-sm` and `icon-lg` sizes, and is the
accessible name. `title` is not a name — it is a hint, it is not read in place of one, and it
never appears on a touch device.

**The name is also the tooltip**, on hover and focus, and on a long press on device: an icon on
its own does not tell a sighted user what it does. A screen reader hears the name once, because
the tooltip is not also the button's description. Pass `tooltip={false}` where the icon already
explains itself, as `PasswordInput`'s eye, `SearchInput`'s ✕ and the
`descriptionPlacement="popover"` button do. A text button has no tooltip unless it has a `hint`:
its label is already on screen.

**A `hint` takes the name's place in the tooltip**, on any button, icon or text. The accessible
name stays what it was, and the hint is read after it whether or not the tooltip is open. It is
also an always-mounted `sr-only` node, because a tooltip's text is in the DOM only while it is
showing. `tooltip={false}` keeps that description and drops the tooltip, and `side` moves it.

**`disabled` with a `hint` is not the HTML attribute.** It becomes `aria-disabled`, so the control
keeps its focus ring, its hover and its tooltip and refuses the press in the handler. That is
deliberate: `disabled:pointer-events-none` is why a `title="Empty the lane first"` is unreadable
on exactly the control it is explaining. Pass `hint` with the reason:

```tsx
<Button aria-label="Delete lane" hint="Empty the lane first" disabled={cards.length > 0} size="icon" iconSlot={<Trash2 />} />
```

With no `hint` there is no reason to keep reachable, and `disabled` is the real attribute.

**The tooltip's delay is the app's.** With a `TooltipProvider` above it — the one an app puts at
its root — the button's tooltip uses that provider's `delayDuration` and `skipDelayDuration`.
With none above it, it brings its own and opens at once, so a `Button` never throws for want of
a provider.

**It is `type="button"`, so it does not submit the form it sits in.** You do not need to write it
at the call site. A `<button>` with no type is a submit button, which is why an icon button
beside a field would save the form as well as do its own job — and why Enter in that field would
press the trash, since implicit submission goes to the first submit button in tree order and
never through a click. A form's real submit is `SubmitButton`. If you want one of these to
submit, say `type="submit"`.

**It is the same on both halves**, with the one conversion every pressable has: `onPress` on a
device, `onClick` on the web.

```tsx
<Button
  aria-label="Delete lane"
  hint="Empty the lane first"
  disabled={cards.length > 0}
  size="icon"
  onPress={remove}
  iconSlot={<Trash2 />}
/>
```

- On device the tooltip, the name or the `hint`, opens on a **long press**, and a `disabled` one
  with a `hint` still hears it — that is the same reason `disabled` is `aria-disabled` on the web. TalkBack and VoiceOver
  announce the button as unavailable.
- The tooltip draws no element around the button, on device or on the web, so `className`
  places the button in its parent: `ml-auto`, `self-end`, `flex-1`.
- A string `hint` is the button's accessibility hint, read after the name. A `hint` that is a node
  is only the tooltip there; pass a string when it has to be heard.
- `type` and `aria-describedby` are web only. A device has no form to submit.

## Destructive buttons

```tsx
<ConfirmButton
  aria-label="Delete lane"
  variant="outline"
  size="icon"
  title="Delete this lane?"
  description="The lane takes its cards with it."
  onConfirm={() => deleteLane(id)}
  iconSlot={<Trash2 />}
/>
```

<!-- props:ConfirmButton -->
`ConfirmButton`'s props, from the TSDoc in `registry/ui/confirm-button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | The question, as a heading. "Delete this workspace?" |
| `description` (required) | `ReactNode` |  | What is lost if they say yes. Required, and it is the reason the component is worth installing — see the note below. |
| `confirmLabel` | `ReactNode` | `"Delete"` | The verb on the button that does it. |
| `cancelLabel` | `ReactNode` | `"Cancel"` |  |
| `requireText` | `string` |  | The text to type before the confirm button unlocks — the name of the folder, the repository, the workspace. Matched exactly. For a delete that is big and cannot be undone; left out, the dialog asks with one click. |
| `requireTextLabel` | `ReactNode` |  | The input's label. Defaults to "Type **{requireText}** to confirm". |
| `onConfirm` (required) | `(() => void)` |  |  |

It also takes the props declared in `registry/ui/button.tsx`: `aria-describedby`, `aria-label`, `className`, `content`, `hint`, `iconSlot`, `linkSlot`, `loading`, `loadingLabel`, `side`, `size`, `tooltip`, `trailingSlot`, `variant`.
<!-- /props -->

Do not build the `AlertDialog` by hand. There are 22 hand-written ones across these projects and
they disagree about the button order, the confirm's variant, and what Cancel is called.

**`description` is required, and it is not "This cannot be undone."** The dialog already implies
that, and it teaches nothing. Say what is lost: *the lane takes its cards with it*, *anything
using this key stops working, including the nightly sync*, *the members lose access to every
server in it*. If you cannot write that sentence, the confirm is probably not warranted.

`confirmLabel` names the verb — Delete (the default), Discard, Revoke, Remove, Reset. The action
is always destructive; a confirm that is *not* destructive is a question, and a question is
`DialogLayout`.

Everything `Button` takes, `ConfirmButton` takes: `content`, `aria-label`, `hint`, `disabled`,
`variant`, `size`. There is no `label`: at a text size the words are `content`, and at an
`icon*` size the accessible name is `aria-label`, which is required there, as on `Button`. The
trigger is `destructive-outline` unless you pass a `variant`: it asks the question, and the bold
destructive step is the dialog's. A disabled `ConfirmButton` does not open the dialog.

**`@cubeui/confirm-button` is on both halves**, with the same props. The press opens the question,
so it takes neither `onPress` nor `onClick`; `onConfirm` is the one that acts. The dialog is
`ConfirmDialog`, the one `confirm()` raises, so the three draw the same card: an `alertdialog`
with Cancel first and the destructive verb last, no corner close, and a press beside it that does
not answer it. On device the back button is Cancel, and the trigger's tooltip is `Button`'s
long press.

### Upgrading an earlier install

Files from an earlier install stay in the app until it is re-added, so a call site can still be
written against props that have gone:

- **`ConfirmButton`'s `label` is gone.** Write `content="Delete project"` at a text size, and
  `aria-label="Delete lane"` at an `icon*` size.
- **`ActionButton` is gone.** It is a `Button` at an `icon*` size with `aria-label` and
  `iconSlot`. Its `aria-label` is still the tooltip; a `hint` replaces it there, and
  `tooltip={false}` turns it off. `disabled` changes with the hint. With a `hint`, a disabled
  button is `aria-disabled`: it keeps its focus and tooltip, so it can say why. Without one, it is
  plainly `disabled` and leaves the tab order.
- **`OptionSelect` is gone.** It is `Combobox`.

### Type the name to confirm

For a delete that is big and cannot be undone — a whole folder of notes, a workspace, a
repository — pass `requireText`, and the dialog asks for the name before it acts:

```tsx
<ConfirmButton
  aria-label="Delete folder"
  size="icon"
  title="Delete this folder?"
  description="Its 214 notes go with it, and so does their history."
  requireText={folder.name}
  requireTextLabel={<>Type <strong>{folder.name}</strong> to delete it</>}
  onConfirm={() => deleteFolder(folder.id)}
  iconSlot={<Trash2 />}
/>
```

It is the same prop on all three, so a call site moves between them unchanged:
`<ConfirmDialog requireText={…} />` and `confirm({ …, requireText: folder.name })` on both halves.

- A labelled input sits under the description, and the destructive button stays **disabled until
  the input holds `requireText` exactly** — case and spaces count, nothing is trimmed.
- **Enter confirms only when it matches.** Enter on a wrong value does nothing.
- The input is **empty each time the dialog opens**: the name is typed once per delete.
- `requireTextLabel` is the label, and defaults to "Type **{requireText}** to confirm". Pass
  one to say the verb. It is the input's accessible name, so keep the name in it.

Do not build this from `DialogLayout`, an `Input` and a disabled `Button`. Save it for the rare
delete that earns it: asking for a typed name on every row teaches people to type without
reading, and then it protects nothing.
