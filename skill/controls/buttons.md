# cubeui controls: Buttons

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

**Contents**

- [Button](#button)
- [Icon buttons](#icon-buttons)
- [Copy button](#copy-button)
- [Download button](#download-button)
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
| `size` | `IconSize` |  |  |
| `aria-label` | `string` |  |  |
| `hint` | `React.ReactNode` |  | Why it is unavailable, or what it will do: the tooltip, and read after the name whether or not the tooltip is open. On device only a string is read; a node is shown and not read. |
| `tooltip` | `boolean` | `true` | Off, the button keeps its `hint` as its description and drops the tooltip. A tooltip is only ever drawn for a `hint`. |
| `side` | `TooltipSide` | `"top"` | Which edge of the button the tooltip sits on. |
| `aria-describedby` | `string` |  | More ids to describe the button with, kept ahead of the hint's own. Web only: a device describes a control with its accessibility hint, which is what `hint` becomes there. |
<!-- /props -->

- **`variant`** says what the press does, and each one is a token:

  | Variant | For |
  |---|---|
  | `default` | The emphasis of its row, when none of the meanings below fits |
  | `info`, `info-outline` | Adds something: Add, New, Create |
  | `positive`, `positive-outline` | Keeps the work: Save, Confirm |
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
never appears on a touch device. The name is not shown as a tooltip.

**`hint` is the button's tooltip, and the only one it draws**, on any button, icon or text. No
`hint`, no tooltip. The accessible name stays what it was, and the hint is read after it whether
or not the tooltip is open — it is also an always-mounted `sr-only` node, because a tooltip's
text is in the DOM only while it is showing. Pass `tooltip={false}` to keep the description and
drop the tooltip, and `side` to move it.

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

- On device the tooltip opens on a **long press**, and a `disabled` one with a `hint` still hears
  it — that is the same reason `disabled` is `aria-disabled` on the web. TalkBack and VoiceOver
  announce the button as unavailable.
- A string `hint` is the button's accessibility hint, read after the name. A `hint` that is a node
  is only the tooltip there; pass a string when it has to be heard.
- `type` and `aria-describedby` are web only. A device has no form to submit.

## Copy button

A button that puts a string on the clipboard is `CopyButton`, on both halves. Do not write the
`useState(copied)` and the `setTimeout(…, 1500)` again:

```tsx
<PropertyRow
  label="Endpoint"
  value={url}
  valueClassName="font-mono"
  actionSlot={<CopyButton value={url} label="Copy endpoint URL" />}
/>

<CodeBlock
  content={snippet}
  actionSlot={
    <CopyButton
      value={snippet}
      label="Copy snippet"
      onError={() => toast.error("Could not copy. Select the text and copy it by hand.")}
    />
  }
/>
```

<!-- props:CopyButton -->
`CopyButton`'s props, from the TSDoc in `registry/ui/copy-button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | The text that goes on the clipboard. |
| `label` | `string` |  | The accessible name before the press: say what is copied when the screen has more than one thing that could be — "Copy endpoint URL". The default is `Copy`. For the moment after a press the name is `Copied`, whatever this says. Inside a `CodeBlock` with a `title`, the default is "Copy {title}". |
| `variant` | `ButtonProps["variant"]` |  | The button's variant. The default is `outline`. |
| `size` | `ButtonProps["size"]` |  | The button's size. The default is `icon-sm`, which sits flush in a row of small text. |
| `onCopied` | `(() => void)` |  | Called once the text is on the clipboard — a toast, an analytics event. |
| `onError` | `((error: unknown) => void)` |  | Called when the clipboard refused the text — an insecure origin, a denied permission. The button does not turn into a tick, so it never claims a copy that did not happen; this is where the caller says so, since a shell holds no toasts. |
| `disabled` | `boolean` |  | Off: a press copies nothing and calls neither `onCopied` nor `onError`. Say why with `hint`, as on `Button` — "Give the webhook an id first". |
| `hint` | `ButtonProps["hint"]` |  | The button's tooltip, as on `Button`. With `disabled` it keeps the button focusable and hoverable (`aria-disabled`), so the reason it is off can still be read. |
| `className` | `string` |  | The button's class: its position, say `absolute top-2 right-2` over a snippet. |
<!-- /props -->

Beside a block of text it goes in the block's `actionSlot` — see [Code block](code-and-markdown.md#code-block) — not in
an `absolute` corner over it.

- It is an icon button: `Copy`, then `Check` for 1.5 seconds once the text is on the clipboard.
  The accessible name is `label` (default `Copy` — name what is copied when there is more than
  one) and `Copied` while the tick shows.
- `variant` and `size` go to the `Button` underneath; the defaults are `outline` and `icon-sm`.
  At an `icon*` size the button is the glyph alone and `label` is its name. At a text size (`sm`,
  `default`, `lg`) `label` is drawn beside the glyph — a toolbar's
  `<DownloadButton label="Export" size="sm" … />`. Do not build that one from a `Button` and
  `downloadBlob` by hand.
  `className` is the button's, for placing it.
- The tick appears only if the write happened. A refused write — an insecure origin, a denied
  permission — calls `onError` and leaves the button as it was; `onCopied` runs after a good one.
  The toast is yours to raise, from either.
- The web half writes with `navigator.clipboard`, and falls back to `execCommand("copy")` where
  that does not exist (plain http on a LAN address). The native half is `expo-clipboard`, which
  the native item installs; a DOM app installs nothing extra.
- It is `type="button"` on the web, so it never submits the form it sits in.
- It has no tooltip unless given a `hint`: the glyph is the universal one and the name is always
  set.
- When there is nothing to copy yet, pass `disabled` and a `hint` saying why, as on `Button`:
  `<CopyButton value={url} label="Copy the URL" disabled={!id} hint="Give the webhook an id first" />`.
  With the hint it stays focusable (`aria-disabled`), and a press copies nothing and calls neither
  callback. Do not draw a `Button` with the copy glyph in its place.

## Download button

A button that saves a file is `DownloadButton`, on both halves. Do not write the busy state, the
`<a download>` and the `URL.revokeObjectURL` again:

```tsx
<DownloadButton
  label="Download note.md"
  filename="note.md"
  mimeType="text/markdown"
  source={() => getFile(path)}
  onError={(error) => toast.error(String(error))}
/>
```

<!-- props:DownloadButton -->
`DownloadButton`'s props, from the TSDoc in `registry/ui/download-button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `source` | `DownloadContent \| (() => DownloadContent \| Promise<DownloadContent>)` |  | The file's content, or a function that fetches it. A function is called on the press and not before, so a list of fifty rows fetches nothing until one is asked for. |
| `href` | `never` |  |  |
| `filename` (required) | `string` |  | The name the file is saved under, extension included: `note.md`. |
| `mimeType` | `string` |  | The type of a `source` that is a string, and on device of an `href`. A `Blob` carries its own. The default is `text/plain` for a `source`. |
| `label` | `string` | `"Download"` | What the button says. At a text size (`sm`, `default`, `lg`) it is drawn beside the icon — an "Export" button in a toolbar. At an `icon*` size the square has no room for words, so it is the accessible name alone: say what is downloaded when the screen has more than one thing that could be — "Download note.md". The default is `Download`. |
| `variant` | `ButtonProps["variant"]` | `"outline"` | The button's variant. The default is `outline`. |
| `size` | `ButtonProps["size"]` | `"icon-sm"` | The button's size. The default is `icon-sm`, which sits flush in a row of small text; a text size draws `label` beside the icon. |
| `destination` | `DownloadDestination` | `"ask"` | Device only: where the file goes. The default is `ask`, which leaves it to the person pressing. The browser has one answer, its own downloads, and ignores this. |
| `disabled` | `boolean` |  |  |
| `onDownloaded` | `(() => void)` |  | Called once the file has been handed over — a toast, an analytics event. |
| `onError` | `((error: unknown) => void)` |  | Called when `source` or `href` threw or the platform refused the file. The button holds no toasts, so this is where the caller says so. |
| `className` | `string` |  | The button's class. |
<!-- /props -->

- `source` is the content — a `Blob` or a string — or a function returning either, or a promise
  of either. A function is called on the press, so a list of rows fetches nothing until asked.
- A file the server hands out as a URL takes `href` in place of `source`: a string, or a function
  returning one that is called on the press, for a presigned URL that is minted on demand and
  expires. The platform fetches it — the browser streams it to disk with its own progress, a
  device downloads it to a file — so a 100 MB file is never a `Blob` in memory. Pass one of
  `source` and `href`, never both.

  ```tsx
  <DownloadButton
    label="Download the original"
    filename={doc.filename}
    href={() => api.presignDownload(doc.id)}
  />
  ```

- In a browser the `download` attribute is ignored for a URL on another origin. A bucket there
  has to send `Content-Disposition: attachment; filename="…"` itself, or a file the browser can
  show opens in place of the page and `filename` is not used.
- While `source` or `href` is pending the button is disabled and `aria-busy`, with a spinner where the
  glyph was. A `source` or `href` that throws calls `onError` and leaves the button as it was;
  `onDownloaded` runs after a good one.
- `variant` and `size` go to the `Button` underneath; the defaults are `outline` and `icon-sm`.
- On the web the file goes to the browser's downloads. **On a device there is no downloads
  folder**, so `destination` says where: `"share"` opens the share sheet, `"files"` asks for a
  folder and writes into it, and `"ask"`, the default, puts both in a menu on the button so the
  person pressing decides. The web half ignores it.
- `downloadBlob(content, filename, { mimeType, destination })` is the function the button calls,
  exported from the same module for the download that is not a button — a menu row, the end of
  an export job. On a device it takes `"share"` (the default) or `"files"`.
  `downloadUrl(url, filename)` beside it is the same for a URL.
- The native item installs `expo-file-system` and `expo-sharing`; a DOM app installs nothing
  extra.

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
`ConfirmButton`'s props, from the TSDoc in `registry/layout/confirm-button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `title` (required) | `ReactNode` |  | The question, as a heading. "Delete this workspace?" |
| `description` (required) | `ReactNode` |  | What is lost if they say yes. Required, and it is the reason the component is worth installing — see the note below. |
| `confirmLabel` | `ReactNode` | `"Delete"` | The verb on the button that does it. |
| `cancelLabel` | `ReactNode` | `"Cancel"` |  |
| `requireText` | `string` |  | The text to type before the confirm button unlocks — the name of the folder, the repository, the workspace. Matched exactly. For a delete that is big and cannot be undone; left out, the dialog asks with one click. |
| `requireTextLabel` | `ReactNode` |  | The input's label. Defaults to "Type **{requireText}** to confirm". |
| `onConfirm` (required) | `() => void` |  |  |

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
  `iconSlot`. The tooltip no longer comes from the name: pass `hint` for one.
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
