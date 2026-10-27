# cubeui controls: Code blocks and Markdown

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every control here shares.

**Contents**

- [Code block](#code-block)
- [Markdown](#markdown)
  - [Markdown editor](#markdown-editor)
  - [Markdown code editor](#markdown-code-editor)

## Code block

A block of preformatted text — a config file, a command to paste, a JSON payload, a log — is
`CodeBlock`, from `@cubeui/code` beside the inline `Code`, on both halves. Do not write a `<pre>`
with `rounded-md border bg-foreground/10 p-3 font-mono text-xs` on it: that class list was retyped on
eleven screens and came out with four fills, a border on about half and three paddings.

```tsx
<CodeBlock content={json} />

<CodeBlock
  content={command}
  actionSlot={<CopyButton value={command} label="Copy command" />}
/>

<CodeBlock content={log} wrap maxHeight="md" />
```

<!-- props:CodeBlock -->
`CodeBlock`'s props, from the TSDoc in `registry/ui/code.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `content` (required) | `string` |  | The text, drawn as written: its newlines and its indentation are kept. A string rather than a node, because whitespace is the one thing a block of code cannot have rearranged, and a node would let a caller pass markup that is not preformatted at all. |
| `actionSlot` | `SlotNode` |  | The block's far end, at the top: a `CopyButton`. It sits beside the text rather than over it, so the room it needs is the block's to reserve — the hand-written version floated the button over the text and remembered a `pr-12` to keep the first line out from under it. |
| `wrap` | `boolean` | `false` | What a line too long for the block does. Off, the default, it runs on and the block scrolls sideways, which is right for code and config: a wrapped line of JSON reads as two. On, it wraps, breaking inside a word if it has to, which is right for output, a log, or one long value such as a URL. |
| `maxHeight` | `keyof typeof MAX_HEIGHTS` |  | The tallest the block may get before it scrolls inside itself. Left out, it is as tall as its text. A named height rather than a class, so the blocks in an app are one of three heights instead of a `max-h-*` each. |
| `title` | `string` |  | What the snippet is: a file name, a tool, a shell — ".mcp.json", "Claude Code", "curl". Drawn in a header row of its own, with the `actionSlot` beside it rather than beside the text, and it names a `CopyButton` inside the block "Copy {title}" unless that button has a `label`. |
| `language` | `string` |  | The snippet's language, drawn muted after the `title` — "json", "bash". Only with a title. |
| `follow` | `boolean` | `false` | Keep the end of a growing `content` in view — a live log, a run's output. Meaningful with `maxHeight`, since only a capped block scrolls. It follows while the reader is at the end, lets go once they scroll up, and shows "Jump to latest" until they are back. The text is never a live region: a log read aloud line by line drowns out everything else. |
| `className` | `string` |  | The block's root: its width, its margin. |
<!-- /props -->

- **`content` is a string**, drawn as written: its newlines and its indentation are kept. It is not
  a node, and there is no syntax highlighting. Build the string first (`JSON.stringify(value, null,
  2)`), then pass it.
- **`actionSlot`** is the block's far end, at the top: a `CopyButton`. It has a column of its own, so
  the text never runs under it — there is no `pr-12` to remember and nothing to position. What is
  copied is the button's `value`, which need not be `content`: a snippet shown with a placeholder
  can copy the real token.
- **`wrap`** is what a line too long for the block does. Off, the default, the line runs on and
  the block scrolls sideways: right for code and config, where a wrapped line reads as two. On, it
  wraps, inside a word if it has to: right for output, a log, or one long value.
- **`maxHeight`** — `sm`, `md` or `lg` (ten, fifteen and twenty-four rem) — caps the block, which
  then scrolls inside itself. Left out, the block is as tall as its text. Do not pass a `max-h-*`
  in `className`: the scroller is inside the root, so the text would spill out of the box instead.
- **`title`** labels a snippet the reader copies — `.mcp.json`, `Claude Code`, `curl` — in a header
  row inside the block, and `language` (`json`, `bash`) is drawn muted after it. With a title the
  `actionSlot` moves into that row, and a `CopyButton` there with no `label` is named
  "Copy {title}". Do not put a heading of your own above the block for this. Without a title the
  block is unchanged.

  ```tsx
  <CodeBlock title=".mcp.json" language="json" content={json} actionSlot={<CopyButton value={json} />} />
  ```
- **`follow`** keeps a growing `content` — a live log, a run's output — at its last line, with
  `maxHeight` so the block scrolls. It follows only while the reader is at the end: scrolled up,
  they keep their place and a "Jump to latest" button appears until they are back. Do not write a
  `useEffect` that sets `scrollTop = scrollHeight` on every change; that yanks a reader who
  scrolled up to read. The text is `aria-live="off"`.

  ```tsx
  <CodeBlock content={output} wrap maxHeight="lg" follow />
  ```
- `className` is the root's, for its width or margin. The fill, the border and the padding are
  the block's and are the same on every one; do not restate them.
- On the web the text is a `<pre>`, and a block that can scroll is a tab stop so a keyboard can
  read the end of the line. On a device it is a `ScrollView` and the text is selectable.

**A value to copy — an endpoint, a token, one command — is the same block**, with `wrap` and a
`CopyButton`. There is no second component for it, and it is not a read-only `Input`, which
reads as a field somebody could type in:

```tsx
<CodeBlock
  content={url}
  wrap
  actionSlot={<CopyButton value={url} label="Copy endpoint URL" />}
/>
```

One line of text makes a block one line tall, button included. A value that already has a label
beside it on a settings page is a `PropertyRow` with the string as its `value`,
`valueClassName="font-mono"` and the `CopyButton` as its `actionSlot` instead (see
[Copy button](buttons.md#copy-button)); the block is for the value that stands alone.

## Markdown

A Markdown string drawn as a document — a note, a README, a skill's instructions, a model's
answer — is `Markdown`, from `@cubeui/markdown`. **Web only.** Do not install `react-markdown`
and write a `components` map: that map was written three times and came out with three heading
scales, two blockquote rules and code blocks that matched nothing else on the page.

```tsx
<Markdown content={skill.instructions} />

<Markdown content={file.text} emptySlot={<p className="text-foreground/60">This file is empty.</p>} />
```

<!-- props:Markdown -->
`Markdown`'s props, from the TSDoc in `registry/web/markdown.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `content` (required) | `string` |  | The Markdown source, as a string. |
| `emptySlot` | `SlotNode` |  | What is drawn when `content` is blank: "This file is empty.", "Nothing to preview yet." Left out, a blank document draws nothing. |
| `headingId` | `((text: string) => string)` |  | An id for each heading, worked out from its text, so a table of contents or a `#fragment` can point at one. Return `undefined` to leave a heading without. Left out, no heading has an id: an id is a promise the page makes about what is unique on it, and only the app knows that. |
| `components` | `Components` |  | Elements to draw differently, by tag — react-markdown's own `components`, laid over this component's map. It is how an app's router `<Link>` becomes `a`, or an image is resolved before it is drawn. A replaced `a` or `img` keeps the document's look, which is worn from the root. |
| `remarkPlugins` | `Options["remarkPlugins"]` |  | remark plugins to run after remark-gfm — react-markdown's own `remarkPlugins`. A wikilink syntax, a footnote style. There is no `rehypePlugins`: see the note on raw HTML below. |
| `urlTransform` | `Options["urlTransform"]` |  | What a link's or an image's URL becomes before it is drawn — react-markdown's own `urlTransform`. The default is react-markdown's `defaultUrlTransform`, which keeps `http`, `https`, `mailto` and relative URLs and blanks the rest, `javascript:` among them. Replace it to let a scheme of your own through, and hand everything else back to `defaultUrlTransform`. |
| `wikilinks` | `boolean` | `false` | Reads `[[Note]]`, `[[Note\|label]]`, `[[Note#Heading]]` and `![[image.png]]`. Off by default: in plain Markdown two brackets are text. Each one is a name, so each goes to `resolveLink`, as a `wikilink` or an `embed`; one that gets no answer is drawn broken. |
| `resolveLink` | `ResolveLink` |  | Where a link or an image goes, for the app whose documents point at each other. Called with each wikilink and each relative URL — never with a web address or a `#fragment` — and answers `{ href }`, `{ render }` for the router's own link, `{ pending: true }` or `{ broken: true, reason }`. Nothing at all leaves the link as the document wrote it. |
| `basePath` | `string` |  | The path of the document shown, as a page's address is to its links: `guide/intro.md`, or `guide/` for a directory. With it a relative URL reaches `resolveLink` as a whole path (`../api.md` as `api.md`), and one that climbs out of the root is drawn broken. Without it `resolveLink` gets the URL as written. Wikilinks are names, and are never resolved against it. |
| `collapsible` | `boolean` | `false` | Each heading folds the blocks under it, up to the next heading of its level or higher, with a chevron button beside it. Every section starts open. Off by default: a short note has nothing worth folding, and the button is one more stop for the keyboard per heading. |
| `className` | `string` |  | The document's root: its width, its margin. |
<!-- /props -->

- **`content` is the Markdown source, a string.** It is the only required prop.
- **Every element is one the page already has.** A fenced block is a [`CodeBlock`](#code-block),
  a code span is `Code`, a table is the [`Table`](../layout/trees-and-tables.md#table) with its headers scoped, a
  rule is a `Separator`, a task item (`- [x]`) is a disabled `Checkbox` named by its item, and
  the headings are `PageHeader`'s sizes carried down six levels. There is no class to pass per
  element and no `prose` plugin to install.
- **GitHub-flavoured Markdown is on**: tables, task lists, strikethrough, bare URLs as links.
  There is no syntax highlighting, as `CodeBlock` has none.
- **`emptySlot`** is what a blank `content` draws. Left out, a blank document draws nothing at all.
- **`headingId`** — `(text) => id` — gives each heading an id from its text, so a table of
  contents or a `#fragment` can point at one. Left out, no heading has an id.
- **`collapsible`** folds the document by its headings: each heading gets a chevron button beside
  it that shows and hides the blocks under it, up to the next heading of its level or higher, so an
  `##` folds its `###`s with it. Every section starts open, and a heading with nothing under it
  has no button. Off by default. Do not wrap the parts of a document in `Disclosure`s for this.
- `className` is the root's: its width, its margin. The document is as wide as what it is put in
  and a table or code block in it takes that width; its paragraphs, lists and quotes stop at
  `max-w-prose` (about 65 characters a line) however wide it is.
- A long URL breaks rather than widening the document, and a table or code block too wide for it
  scrolls inside itself.

**Raw HTML is never rendered.** HTML inside the Markdown is shown as the text it is, and there is
no prop that turns it on: the content is as often a repository's or a model's as yours. **URLs
are filtered** too — relative addresses and the `http`, `https`, `mailto`, `irc`, `ircs` and
`xmpp` schemes are kept, and anything else, `javascript:` and `data:` included, is blanked. Neither is something to remember per call
site.

**Documents that link to each other** — notes, a skill's files, a wiki — take three more props.
Do not write a remark plugin, an `a` component and a broken-link style for this: what a name
points at is the app's, and everything else is here.

```tsx
const resolveLink = useCallback<NonNullable<MarkdownProps["resolveLink"]>>(
  (target, { kind }) => {
    const [name] = target.split("#");
    const doc = byName.get(name);
    if (!doc) return { broken: true, reason: `No document named “${name}”.` };
    if (kind === "image" || kind === "embed") return { href: fileUrl(doc) };
    return { render: (label) => <Link to="/docs/$id" params={{ id: doc.id }}>{label}</Link> };
  },
  [byName],
);

<Markdown content={doc.text} wikilinks basePath={doc.path} resolveLink={resolveLink} />
```

- **`wikilinks`** reads `[[Note]]`, `[[Note|label]]`, `[[Note#Heading]]` and `![[image.png]]`.
  Off by default. `[[Note#Heading]]` is shown as "Note › Heading".
- **`resolveLink(target, { kind })`** is asked about every wikilink and every *relative* URL —
  never a web address, a `mailto:` or a `#fragment`. `kind` is `"wikilink"` or `"embed"` for the
  bracket forms and `"link"` or `"image"` for Markdown's own. `target` is the name or path as
  written, its `#heading` still on it. It answers one of:
  - `{ href }` — an address, used as given. For an image it is the `src`, so a blob URL works.
  - `{ render: (label) => … }` — the element only the app can draw: its router's `<Link>`, an
    image it fetches itself. It needs no class; links and images are styled from the root.
  - `{ pending: true }` — still being looked up: the text without a link, a chip for an image.
  - `{ broken: true, reason }` — points at nothing: a dashed underline in `negative`, `reason` as
    its tooltip, "(broken link)" for a screen reader; a "Missing image" chip for an image.
  - nothing — a Markdown link or image is left as written; a wikilink is drawn broken.
- **It may be async.** Return a promise and the link is pending until it settles, and broken if
  it rejects. Keep an async resolver the same function between renders (`useCallback`): each new
  one is asked again. A resolver that reads a query's cache returns `{ pending: true }` instead
  and needs no promise.
- **`basePath`** is the path of the document shown — `guide/intro.md`, or `guide/` for a
  directory. With it `../api.md` reaches `resolveLink` as `api.md`, and a link that climbs out
  of the root is drawn broken without asking. Wikilinks are names and are not resolved against it.
- The pending and broken looks are not props. They are the same in every app on purpose.

Three props are `react-markdown`'s own, for what the above does not cover. They are named as it
names them so its documentation applies:

```tsx
import { defaultUrlTransform } from "react-markdown";

<Markdown
  content={doc.text}
  headingId={slug}
  components={{ img: SignedImage }}
  remarkPlugins={[remarkFootnoteStyle]}
  urlTransform={(url) => (url.startsWith("data:image/") ? url : defaultUrlTransform(url))}
/>
```

- **`components`** replaces elements by tag, laid over the built-in map. A replaced `a` or `img`
  needs no class: links and images are styled from the document's root, so yours look like the
  ones they replaced. Replacing `a` or `img` also replaces what `resolveLink` drives for that
  tag — use one or the other. Declare the components outside the render, or pass a memoised
  object; a new one each render remounts the document.
- **`remarkPlugins`** run after remark-gfm. There is no `rehypePlugins`, which is where raw HTML
  would come back in.
- **`urlTransform`** replaces the URL policy. Let your own scheme through and hand everything else
  to `defaultUrlTransform`, as above — returning the URL unchanged for all of them is the hole the
  default closes.

Text a model is still writing is this component with `content` growing; it re-renders the
document, it does not animate it.

### Markdown editor

A Markdown source to write, with its rendering beside it, is `MarkdownEditor`, from
`@cubeui/markdown-editor`. **Web only.** Do not write a textarea, a `Markdown` and a three-way
toggle by hand.

```tsx
const [body, setBody] = useState(skill.instructions);

<MarkdownEditor aria-label="Instructions" value={body} onValueChange={setBody} />

<FormField
  label="Instructions"
  controlSlot={<MarkdownEditor value={body} onValueChange={setBody} placeholder="# My skill" />}
/>
```

<!-- props:MarkdownEditor -->
`MarkdownEditor`'s props, from the TSDoc in `registry/web/markdown-editor.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | The Markdown source. The caller holds it: this component keeps no copy. |
| `onValueChange` (required) | `(value: string) => void` |  | Called with the whole source on every edit. |
| `view` | `MarkdownEditorView` |  | Which view is showing: `edit` is the source alone, `preview` the rendered document alone, `split` the two side by side. Pass it with `onViewChange` to hold the view yourself — to keep it in the URL, or in a preference. Left out, the component holds it. |
| `onViewChange` | `((view: MarkdownEditorView) => void)` |  | Called with the view the toggle was moved to. |
| `defaultView` | `MarkdownEditorView` | `"split"` | The view to start in when the component holds it. `split` unless given. |
| `emptySlot` | `SlotNode` |  | What the preview draws while the source is blank: "Nothing to preview yet." Left out, the preview is an empty box. |

It also takes the props declared in `registry/ui/textarea-base.ts`: `className`, `maxRows`, `onEscape`, `onSelectionChange`, `onSubmitEditing`, `selection`.
<!-- /props -->

- **`value`, `onValueChange`** — the source is yours. The editor keeps no copy, and saving, a
  dirty flag and autosave are the screen's: put the Save button in the `actionSlot` of the `Section`
  or card the editor sits in.
- **The toggle is drawn for you** — Edit, Split, Preview, a `SegmentedGroup` at the editor's far
  end, above the panes. `edit` is the source alone, `preview` the document alone, `split` both.
- **`view`, `onViewChange`** hold the view outside, to keep it in the URL or a preference.
  **`defaultView`** is where it starts when you do not (`split` unless given). Pass `view` or
  `defaultView`, never both.
- **Under `lg`, `split` shows the source alone.** Two columns do not fit, and stacked the
  preview would be a screen below the line being typed. Preview is one press away.
- **`emptySlot`** is what the preview draws while the source is blank. Left out, an empty box.
- **Every other prop is the textarea's** — `id`, `placeholder`, `disabled`, `name`, `onBlur`,
  `aria-label`, `aria-invalid`, `spellCheck` (off unless given) — so it is a `FormField`'s
  `controlSlot` like any other, and outside one it needs an `aria-label`.
- The textarea stays mounted in all three views, so undo history and the cursor survive a look at
  the preview. Beside the preview it is as tall as the preview; alone it is sixteen rem and
  resizes by its corner.

### Markdown code editor

An app whose main job is editing Markdown files wants `MarkdownCodeEditor`, from
`@cubeui/markdown-code-editor`: CodeMirror 6, coloured from the theme's tokens. **Web only.** Do
not set up CodeMirror by hand, and do not bundle a CodeMirror theme.

**Which one:** `MarkdownEditor` for a field in a form — a description, a skill body, a comment. It
is a textarea, costs nothing, and brings its preview. `MarkdownCodeEditor` for a document — a note,
a README, a page of a wiki — where highlighting, undo and a save key earn about half a megabyte of
CodeMirror. It brings no preview: draw a `Markdown` beside it if the screen wants one.

It is a default export, so the weight is its own chunk and arrives only when an editor is shown:

```tsx
const MarkdownCodeEditor = lazy(() => import("@/components/markdown-code-editor"));

<Suspense fallback={<Skeleton className="min-h-64 w-full" />}>
  <MarkdownCodeEditor
    label="Document"
    value={source}
    onValueChange={setSource}
    onSave={(text) => save.mutate(text)}
  />
</Suspense>
```

- **`value`, `onValueChange`** — the source is yours, as with every control. Handing it a `value`
  that is not what it shows replaces the document without calling `onValueChange`: that is how
  opening another file works, and it does not mark the file changed.
- **`onSave`** is Cmd+S / Ctrl+S, called with the source as it stands. Given, the browser no longer
  offers to save the page.
- **`label`** is the accessible name. With a visible label, pass its id as `aria-labelledby`
  instead. One of the two is required: nothing else names the editor.
- **`readOnly`** shows the source, selectable and copyable, and refuses edits.
- **`placeholder`** is what an empty document shows.
- **`extensions`** are CodeMirror extensions of your own — a completion source for `[[wikilinks]]`,
  a linter, a keymap. They are tried before the editor's own, so a key you bind wins. Hold the
  array in a module constant or `useMemo`: a new array each render reconfigures the editor each
  render. Completion and lint popovers are already drawn in the popover's colours.
- **`autoFocus`** puts the cursor in it on mount. **`className`** is the box: `min-h-64` unless
  given, so `className="min-h-[60vh]"` for a full page.
- **Keep it mounted** to keep the undo history and the cursor. To show a preview in its place,
  hide the editor (`hidden`), do not unmount it.
- Tab leaves the editor, as it leaves any field. Soft wrap, list continuation on Enter and
  highlighting inside fenced code blocks are on.
- **Nothing in the preview is editable**, and nothing becomes a field when it is pressed. The
  source is edited in the textarea and only there.
- The preview is the plain `Markdown`. Documents that need their own `components` or plugins put
  a `Textarea` and their own `<Markdown>` in a `SplitLayout` instead.
