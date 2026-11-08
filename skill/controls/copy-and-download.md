# cubeui controls: Copy and download buttons

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares. Both are a [Button](buttons.md#button) that does one job, and take its look.

**Contents**

- [Copy button](#copy-button)
- [Download button](#download-button)

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
      onError={() => toast("Could not copy. Select the text and copy it by hand.")}
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
| `variant` | `"default" \| "destructive" \| "destructive-outline" \| "positive" \| "positive-outline" \| "info" \| "info-outline" \| "outline" \| "secondary" \| "ghost" \| "link"` |  | The button's variant. The default is `outline`. |
| `size` | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` |  | The button's size. The default is `icon-sm`, which sits flush in a row of small text. |
| `onCopied` | `(() => void)` |  | Called once the text is on the clipboard — a toast, an analytics event. |
| `onError` | `((error: unknown) => void)` |  | Called when the clipboard refused the text — an insecure origin, a denied permission. The button does not turn into a tick, so it never claims a copy that did not happen; this is where the caller says so, since a shell holds no toasts. |
| `disabled` | `boolean` |  | Off: a press copies nothing and calls neither `onCopied` nor `onError`. Say why with `hint`, as on `Button` — "Give the webhook an id first". |
| `hint` | `ReactNode` |  | The button's tooltip, as on `Button`. With `disabled` it keeps the button focusable and hoverable (`aria-disabled`), so the reason it is off can still be read. |
| `tooltip` | `boolean` |  | Whether the tooltip is drawn: the `hint`, or with none at an `icon*` size the name, `label` and then `Copied`. Off, a `hint` is still the button's description. Turn it off where the icon already explains itself. |
| `className` | `string` |  | The button's class, for its place in a row: `ml-auto`, `self-end`. Beside a block of text it goes in the block's `actionSlot` — `CodeBlock`, `CardLayout`, `Section`, `PropertyRow`, `ListItem` — not in an `absolute` corner over the block, where it covers the text. |
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
- At an `icon*` size its name is its tooltip, as on `Button`: `label`, then `Copied` while the
  tick shows. A `hint` takes its place, and `tooltip={false}` turns it off.
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
  onError={(error) => toast(String(error))}
/>
```

<!-- props:DownloadButton -->
`DownloadButton`'s props, from the TSDoc in `registry/ui/download-button.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `source` (instead of `href`) | `DownloadContent \| (() => DownloadContent \| Promise<DownloadContent>)` |  | The file's content, or a function that fetches it. A function is called on the press and not before, so a list of fifty rows fetches nothing until one is asked for. |
| `href` (instead of `source`) | `string \| (() => string \| Promise<string>)` |  | A URL, or a function that asks the server for one on the press — a presigned URL that is minted on demand and expires. The browser streams it to disk with its own progress, and a device downloads it to a file, so this is the one to use for a file too big to hold as a `Blob`. |
| `filename` (required) | `string` |  | The name the file is saved under, extension included: `note.md`. |
| `mimeType` | `string` |  | The type of a `source` that is a string, and on device of an `href`. A `Blob` carries its own. The default is `text/plain` for a `source`. |
| `label` | `string` | `"Download"` | What the button says. At a text size (`sm`, `default`, `lg`) it is drawn beside the icon — an "Export" button in a toolbar. At an `icon*` size the square has no room for words, so it is the accessible name alone: say what is downloaded when the screen has more than one thing that could be — "Download note.md". The default is `Download`. |
| `variant` | `"default" \| "destructive" \| "destructive-outline" \| "positive" \| "positive-outline" \| "info" \| "info-outline" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"outline"` | The button's variant. The default is `outline`. |
| `size` | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` | `"icon-sm"` | The button's size. The default is `icon-sm`, which sits flush in a row of small text; a text size draws `label` beside the icon. |
| `destination` | `"ask" \| "share" \| "files"` | `"ask"` | Device only: where the file goes. The default is `ask`, which leaves it to the person pressing. The browser has one answer, its own downloads, and ignores this. |
| `disabled` | `boolean` |  | The button cannot be pressed. |
| `tooltip` | `boolean` |  | Whether the tooltip is drawn: at an `icon*` size, `label`. A text size draws its label and has no tooltip. Turn it off where the icon already explains itself. |
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
  At an `icon*` size `label` is its tooltip, as on `Button`, and `tooltip={false}` turns it off.
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
