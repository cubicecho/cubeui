# cubeui controls: Inputs

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

**Contents**

- [An icon in an input](#an-icon-in-an-input)
- [Fixed text in an input](#fixed-text-in-an-input)
- [An identifier in an input](#an-identifier-in-an-input)
- [A field the browser can fill](#a-field-the-browser-can-fill)
- [Search](#search)
  - [Filter bar](#filter-bar)
- [Password](#password)
- [File picker](#file-picker)
  - [As a button](#as-a-button)

## An icon in an input

An icon inside a field is `Input`'s `leadingSlot`, on both halves. Do not wrap the input in a
`relative` div with an absolute icon and a `pl-8` on the input:

```tsx
<Input aria-label="Filter servers" placeholder="Filter servers" leadingSlot={<Search />} />

<Input
  aria-label="Lane name"
  value={name}
  onChangeText={setName}
  leadingSlot={<Pencil />}
  trailingSlot={
    <Button
      variant="outline"
      size="icon-xs"
      aria-label="Undo rename"
      onPress={() => setName(saved)}
      iconSlot={<Undo2 />}
    />
  }
  wrapperClassName="w-64"
/>
```

- Pass a bare icon. The input sizes it (`size-4`), mutes it, and pads the text past it. It takes no
  press, so a tap on it lands in the field.
- `trailingSlot` is the far end, inside the field: one icon-sized control. It is pressable, so it
  needs its own name. The text stops short of it.
- `className` stays on the field, as on any input. With a slot, the field sits in a box that is
  `w-full`; size that box with `wrapperClassName`. Without a slot there is no box, and the root is
  the field, as before.
- A search box is not this: it is `SearchInput`, below, which is this plus the name and the ✕.

## Fixed text in an input

A fixed part of the value — the URL an id is appended to, a domain, a unit — is `prefixText` or
`suffixText`, on both halves. Do not draw a bordered div with a muted span and a borderless `Input`
inside it: the focus ring and the invalid border then go round the value only, and the prefix is
not read with the field.

```tsx
<Input aria-label="Webhook id" prefixText={`${origin}/webhooks/`} value={id} onChangeText={setId} />
<Input aria-label="Timeout" suffixText="seconds" inputMode="numeric" value={t} onChangeText={setT} />
```

- The text is muted, in the row, inside the field's one border, and not editable. A press on it
  puts the caret in the value. The border, the focus colour and the invalid colour go round the
  whole box.
- On a narrow screen the prefix gives way from its start (`…/webhooks/`), and the value keeps room
  for a few characters. The suffix stays whole.
- On the web the text is read with the field, after its own description.
- It combines with `leadingSlot` and `trailingSlot`, which then sit in the row beside it.
  `wrapperClassName` sizes the box. `InputField` passes both props through.

## An identifier in an input

```tsx
<Input value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} />
```

A URL, a model id, a server id or a shell command is typed as written, and a phone's keyboard
capitalises the first letter and "corrects" the rest unless told not to. `inputMode="url"` raises
the right keyboard and switches neither off. `autoCapitalize` is `none`, `sentences`, `words` or
`characters`; `autoCorrect` is a boolean, and on the web it takes the spelling underline with it.
`InputField` passes both through.

## A field the browser can fill

```tsx
<InputField form={form} name="email" label="Email" type="email" autoComplete="email" />
```

`autoComplete` says what a field holds, so a saved address, a password manager's entry or a
texted code is offered for it. `type="email"` alone does not: without `autoComplete="email"` a
sign-in loses the browser's autofill. It is on `Input`, on both halves, and `InputField` passes it
through. The shared values are the ones HTML and React Native both have: `email`, `username`,
`current-password`, `new-password`, `one-time-code`, `name`, `given-name`, `family-name`, `tel`,
`street-address`, `postal-code`, `country` and the rest of `InputAutoComplete`. `off` asks for no
suggestions. The web half takes any DOM token.

## Search

A box that filters or searches is `SearchInput`, on both halves. Do not build it from `Input
leadingSlot={<Search />}`, and never from a `relative` div, an absolute glyph and a `pl-8`:

```tsx
<SearchInput placeholder="Search servers" value={query} onChangeText={setQuery} />

<SearchInput label="Filter spells" defaultValue={initial} onChangeText={setQuery} wrapperClassName="w-64" />
```

<!-- props:SearchInput -->
`SearchInput`'s props, from the TSDoc in `registry/ui/search-input.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `label` | `string` |  | The accessible name. A search box usually has no visible label, and an unnamed one is read as "search field" and nothing else. `aria-label` wins over it, and a box pointed at by `aria-labelledby` or an `id` (a `<label htmlFor>`, a `FormField`) takes its name from there unless `label` is passed as well. |
| `clearLabel` | `string` | `SEARCH_CLEAR_LABEL` | The clear button's name. Announced, since the ✕ alone says nothing. |
| `clearable` | `boolean` | `true` | Off, there is no clear button. On, it shows only while there is text to clear, so an empty box is not a box with a dead control in it. |
| `onSettledText` | `((text: string) => void)` |  | The text once typing has paused: what a search that asks a server sends. Called `debounce` milliseconds after the last key, and at once when the box is emptied or Enter is pressed. `onChangeText` still hears every key, so the box itself never lags. |
| `debounce` | `number` | `SEARCH_DEBOUNCE_MS` | How long typing has to pause before `onSettledText`, in milliseconds. |

It also takes the props declared in `registry/ui/input-base.ts`: `aria-describedby`, `aria-invalid`, `aria-label`, `aria-labelledby`, `autoCapitalize`, `autoComplete`, `autoCorrect`, `autoFocus`, `className`, `defaultValue`, `disabled`, `id`, `inputMode`, `max`, `maxLength`, `min`, `onBlur`, `onChangeText`, `onEscape`, `onKeyPress`, `onSubmitEditing`, `placeholder`, `prefixText`, `readOnly`, `ref`, `signed`, `step`, `suffixText`, `value`, `wrapperClassName`.
<!-- /props -->

- It is `type="search"`, so a screen reader hears a search field (`role="searchbox"` on device
  too) and a phone raises its search keyboard.
- `label` is its accessible name, default "Search". A placeholder is not a name. `aria-label`
  wins over `label`; a box named by `aria-labelledby` or a `<label htmlFor>` (an `id`, as in
  `FormField`) gets no default, so the visible label is what is read.
- The ✕ shows only while there is text, is a button named `clearLabel` (default "Clear search"),
  empties the box, and puts focus back in it. `clearable={false}` drops it. The browser's own
  ✕ is hidden, so there is one.
- It takes the rest of `Input`'s props except `type`, `leadingSlot` and `trailingSlot`: `onChangeText` on
  both halves, and on the web `onChange` too, as a shadcn input does. The ✕ fires both, as if
  the user had cleared the box. Controlled or not, it clears.
- `className` is on the field; size the box with `wrapperClassName`.
- **A search that asks a server takes `onSettledText`,** not a `useDebounced` beside the box. It
  is called once typing has paused for `debounce` milliseconds (250 by default), and at once on
  Enter or when the box is emptied. `onChangeText` still hears every key, so hold the box's text
  with that and the query with this:

  ```tsx
  <SearchInput value={text} onChangeText={setText} onSettledText={setQuery} />
  ```

### Filter bar

A list page's filter bar is a search box, a select or two, and the buttons that act on the list,
in one wrapping row. There is no component for it — it is one `div`:

```tsx
<div className="flex flex-wrap items-center gap-2">
  <SearchInput placeholder="Search runs" value={query} onChangeText={setQuery} wrapperClassName="w-64" />
  <Combobox options={STATUSES} value={status} onValueChange={setStatus} className="w-40" />
  <Button variant="outline" onClick={reset} content="Reset" />
</div>
```

- `flex-wrap`, so a narrow window stacks the controls rather than squeezing them; `items-center`
  and `gap-2` so a select and a button sit on the search box's line.
- Give the search box and each select a width: both are full width by default, and in a row
  that means one control takes the line.
- Put it above the list, inside the page's content, not in `PageHeader`'s `actionSlot` — those are
  the page's actions, not the list's.

## Password

A password or a pasted secret is `PasswordInput`, on both halves. Do not write
`<Input type="password">` with an eye button placed over it by hand.

```tsx
<PasswordInput value={token} onChangeText={setToken} />                  {/* both halves */}
<PasswordInput value={token} onChange={(e) => setToken(e.target.value)} /> {/* web too */}
```

<!-- props:PasswordInput -->
`PasswordInput`'s props, from the TSDoc in `registry/ui/password-input.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `showLabel` | `string` | `"Show password"` | The reveal button's name while the value is hidden. |
| `hideLabel` | `string` | `"Hide password"` | And while it is showing. Both are announced; the icon alone says nothing. |
| `revealable` | `boolean` | `true` | Off, this is a plain `<Input type="password">` with no button. |

It also takes the props declared in `registry/ui/input-base.ts`: `aria-describedby`, `aria-invalid`, `aria-label`, `aria-labelledby`, `autoCapitalize`, `autoComplete`, `autoCorrect`, `autoFocus`, `className`, `defaultValue`, `disabled`, `id`, `inputMode`, `leadingSlot`, `max`, `maxLength`, `min`, `onBlur`, `onChangeText`, `onEscape`, `onKeyPress`, `onSubmitEditing`, `placeholder`, `prefixText`, `readOnly`, `ref`, `signed`, `step`, `suffixText`, `value`, `wrapperClassName`.
<!-- /props -->

`@cubeui/password-input` installs to `components/password-input`. It is `Input` with
`type="password"` and a show/hide button in its `trailingSlot`, so it takes `Input`'s props on
each half — `onChangeText` everywhere, and on the web `onChange`, `name`, `autoComplete` and a ref
to the `<input>` as well. The reveal toggle is behaviour, not a variant, which is why this is a
component and not a `type="password"` prop. Three things a hand-written eye gets wrong, and this
gets right:

- The toggle does not submit. It is `type="button"` on the web, where a bare `<button>` inside a
  `<form>` submits it, so the usual hand-rolled version submits the login form when you ask to see
  what you typed.
- Its accessible name changes with its state — "Show password" / "Hide password", or `showLabel` /
  `hideLabel` — rather than being a fixed "Toggle" that tells a screen reader nothing about what
  will happen.
- It swaps the input's real `type`, not a CSS mask, so a password manager and the browser's own
  autofill still see a password field. On device that `type` is `secureTextEntry`.

`revealable={false}` drops the toggle for a field that should never be shown. `className` is the
field's and `wrapperClassName` the box around the field and its eye. `leadingSlot` still takes an icon.

In a form it is `PasswordField`, on `field.*` natively and from `@cubeui/password-field` on the
web. Both name the toggle from the field's `label` — "Show API key" — and take `showLabel` and
`hideLabel` to say something else. See [forms/app-form.md](../forms/app-form.md#a-form).

## File picker

A file the user uploads is `FilePicker`: a drop zone over a hidden file input. Do not write a
hidden `<input type="file">` and a `Button` that clicks it, for a `.zip` or a folder either.

```tsx
<FilePicker
  label="Upload notes"
  hint="Drop .md files, or click to choose"
  accept=".md,text/markdown"
  multiple
  onPickMany={(files) => upload(files)} // [{ name, path, type, size, text }, ...]
/>
```

<!-- props:FilePicker -->
`FilePicker`'s props, from the TSDoc in `registry/ui/file-picker.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `accept` | `string` |  | e.g. `"application/json,.json"`. Advisory on the dialog, which lets the user pick "All files", so the web half also applies it to what comes back — to a pick and to a drop alike. A file that does not match is skipped, never read. |
| `multiple` | `boolean` |  | Take several files per pick: the dialog allows a multi-select and a drop keeps every file, a dropped folder's included. Off, a pick is one file and a drop keeps the first one `accept` allows. |
| `read` | `"text" \| "bytes" \| "none"` |  | What to read from each file. `text` (the default) decodes it, which is right for JSON or Markdown and corrupts a `.zip` or an image. `bytes` hands back the file undecoded as `bytes`, and leaves `text` empty. `none` reads nothing at all and hands back a `blob` to read or upload later — for a file too big to hold in memory, or one to refuse by its `size` first. |
| `directory` | `boolean` |  | Make the dialog choose a folder instead of files, and take everything under it, each file reporting where it sat as its `path`. A folder is several files, so every one `accept` allows is kept whether or not `multiple` is set — and since only `onPickMany` carries a `path`, that is the callback to give. Web only. |
| `label` (required) | `string` |  | What is being picked. On the zone it is the visible heading; on the button, the accessible name. |
| `onPick` | `(text: string, fileName: string) => void` |  | Handed the picked file's decoded text, never the `File` object itself. `File` is DOM-only, so a contract carrying one could not be implemented on native. A screen that wants the bytes, the type or the path takes `onPickMany`, whose `PickedFile` has them. With `multiple` and no `onPickMany`, called once per file, in pick order. |
| `onPickMany` | `((files: PickedFile[]) => void)` |  | Called once per pick with every file in it, in pick order — one file without `multiple`. Given, `onPick` is not called at all. |
| `hint` | `string` |  | The zone's second line, under `label`: what to drop, or where it goes. |
<!-- /props -->

- The caller gets plain data for each file, never a `File`, so the calling screen is the same on
  both halves. A picked file is `{ name, path, type, size, text, bytes?, blob? }`: `type` is the
  MIME type, or `""` when the browser does not know it, `path` is `name` unless a folder was
  picked, and `size` is the file's bytes on disk, there whatever `read` is.
- `onPick(text, name)` is one file. `onPickMany(files)` is one call for the whole pick. Pass
  either one, or both. If `onPickMany` is there, `onPick` is not called. With `multiple` and
  only `onPick`, `onPick` is called once for each file, in order.
- `onPick` carries the text and the name and nothing else. Take `onPickMany` for `bytes`, `blob`,
  `size`, `path` or `type`, including when the pick is one file: it is then a list of one.
- `read` is what to read from each file. `"text"`, the default, decodes it, which is right for
  JSON and Markdown and corrupts a `.zip` or an image. `read="bytes"` gives the file undecoded as
  `bytes`, a `Uint8Array`, and leaves `text` as `""`.
- `read="none"` reads nothing: `text` is `""` and the file comes back as `blob`, a handle the
  browser streams from disk. Use it for an upload straight to a bucket, and to refuse a file by
  its `size` before a byte is read. Do not keep a hidden input for either:

  ```tsx
  <FilePicker
    label="Upload a recording"
    read="none"
    onPickMany={([file]) => {
      if (!file?.blob) return;
      if (file.size > MAX_BYTES) return toast.error("That file is over 100 MB");
      xhr.send(file.blob); // a presigned PUT, with `xhr.upload.onprogress` for the bar
    }}
  />
  ```
- `directory` picks a folder instead of files. The dialog chooses a folder, and every file under
  it arrives in one call. Each file's `path` is its place in the folder, with the folder's own
  name first: `my-skill/assets/logo.png`. `multiple` is not needed, and `accept` still skips what
  it does not allow. Web only.
- A drop does not need `directory`. A folder dropped on any picker is walked, so one zone can
  take "click to choose files" and "drop a folder" both: give it `multiple` and `onPickMany`,
  and each file from a dropped folder comes with its `path`. A dropped file's `path` is its name.
- `multiple` lets the dialog select several files and keeps every file in a drop, including the
  files in a dropped folder. Without it, a pick is one file, and a drop keeps the first file
  that `accept` allows.
- `accept` takes the syntax of `<input accept>`: `.ext`, `type/*` or `type/subtype`. It applies
  to drops as well as the dialog. A file that does not match is skipped and never read. List the
  extension as well as the MIME type, because browsers often give `.md` and similar files no
  type at all.

A skill uploaded as an archive, and one uploaded as a folder with its images:

```tsx
<FilePickerButton
  variant="outline"
  label="Choose .md or .zip"
  accept=".md,.zip,application/zip"
  read="bytes"
  onPickMany={([file]) => importSkill(file.name, file.bytes)}
/>
<FilePickerButton
  variant="outline"
  label="Choose folder"
  directory
  read="bytes"
  onPickMany={(files) => importFolder(files)} // each with its `path` and `bytes`
/>
```

### As a button

Where a drop zone does not fit, such as a page header's actions or a toolbar, use
`FilePickerButton` from the same item. It takes the same picking props and opens the file dialog
directly, so you do not need a dialog around a zone.

```tsx
<PageHeader
  title="Notes"
  actionSlot={
    <FilePickerButton
      variant="outline"
      size="icon-sm"
      label="Upload notes"
      accept=".md"
      multiple
      onPickMany={upload}
    />
  }
/>
```

<!-- props:FilePickerButton -->
`FilePickerButton`'s props, from the TSDoc in `registry/ui/file-picker.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `accept` | `string` |  | e.g. `"application/json,.json"`. Advisory on the dialog, which lets the user pick "All files", so the web half also applies it to what comes back — to a pick and to a drop alike. A file that does not match is skipped, never read. |
| `multiple` | `boolean` |  | Take several files per pick: the dialog allows a multi-select and a drop keeps every file, a dropped folder's included. Off, a pick is one file and a drop keeps the first one `accept` allows. |
| `read` | `"text" \| "bytes" \| "none"` |  | What to read from each file. `text` (the default) decodes it, which is right for JSON or Markdown and corrupts a `.zip` or an image. `bytes` hands back the file undecoded as `bytes`, and leaves `text` empty. `none` reads nothing at all and hands back a `blob` to read or upload later — for a file too big to hold in memory, or one to refuse by its `size` first. |
| `directory` | `boolean` |  | Make the dialog choose a folder instead of files, and take everything under it, each file reporting where it sat as its `path`. A folder is several files, so every one `accept` allows is kept whether or not `multiple` is set — and since only `onPickMany` carries a `path`, that is the callback to give. Web only. |
| `label` (required) | `string` |  | What is being picked. On the zone it is the visible heading; on the button, the accessible name. |
| `onPick` | `(text: string, fileName: string) => void` |  | Handed the picked file's decoded text, never the `File` object itself. `File` is DOM-only, so a contract carrying one could not be implemented on native. A screen that wants the bytes, the type or the path takes `onPickMany`, whose `PickedFile` has them. With `multiple` and no `onPickMany`, called once per file, in pick order. |
| `onPickMany` | `((files: PickedFile[]) => void)` |  | Called once per pick with every file in it, in pick order — one file without `multiple`. Given, `onPick` is not called at all. |
| `iconSlot` | `SlotNode` | `<Upload />` | Drawn before the label, or alone at an `icon*` size, where `label` is only the accessible name. Pass a bare `<Upload />`; the button sizes and colours it. Defaults to the upload icon. |
| `className` | `string` |  |  |

It also takes the props declared in `registry/ui/button.tsx`: `size`, `variant`.
<!-- /props -->

- `variant` and `size` are the `Button`'s and are forwarded to it. At an `icon*` size only the
  icon is drawn. At any other size the label is drawn after the icon.
- `label` is required and is always the accessible name.
- `iconSlot` defaults to the upload glyph. Pass a bare `<Plus />` to change it. The button sizes and
  colours it.
- It still takes a file dropped onto it, and shows a ring while something is dragged over it.
- It is a separate component rather than `variant="button"` on `FilePicker`. `variant` already
  means the button's look, and one prop cannot also choose between two shapes.

- **Native:** `@cubeui/file-picker` installs, and both components take the same props, but they
  do not pick. `FilePicker` draws the zone and says on screen that picking is web only.
  `FilePickerButton` draws the button disabled and gives the same reason as its accessibility
  hint. See [native.md](../native.md).
