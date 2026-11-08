# cubeui layout: Dialogs

Part of the cubeui skill. Read [SKILL.md](../SKILL.md) first, and [index.md](index.md) for what every shell here shares.

## Dialogs

```tsx
<DialogLayout
  triggerSlot={<Button variant="info" content="New workspace" />}
  title="New workspace"
  description="A workspace exposes the servers you choose at its own URL."
  size="lg"
  contentSlot={<WorkspaceFields value={draft} onChange={setDraft} />}
  footerActionsSlot={(close) => (
    <>
      <Button variant="outline" onClick={close} content="Cancel" />
      <Button variant="positive" onClick={save} loading={saving} loadingLabel="Saving…" content="Save" />
    </>
  )}
/>
```

<!-- props:DialogLayout -->
`DialogLayout`'s props, from the TSDoc in `registry/layout/dialog-layout.tsx`:

| Prop | Type | Default | What it is |
| --- | --- | --- | --- |
| `contentSlot` (required) | `SlotNode` |  | The body. It is the only part that scrolls. |
| `title` (required) | `ReactNode` |  | Required, because a dialog without a title is one no screen reader can announce. A dialog whose design has no room for a heading passes `hideTitle` and keeps this. |
| `description` | `ReactNode` |  | Read to the same people the title is. Absent, the dialog is described by its body. |
| `descriptionPlacement` | `DescriptionPlacement` | `"inline"` | Where the description is drawn. `inline` (the default) puts it under the title; `popover` puts it behind a small button after the title, named "About <title>", and on the web the dialog is still described by it. It stays inline on a dialog with no body and no footer, where the description is all the dialog says. `CardLayout`'s prop, passed to the card on the panel. |
| `descriptionIconSlot` | `SlotNode` |  | The `popover` button's glyph. A question mark by default. |
| `hideTitle` | `boolean` | `false` | Keeps the title for assistive technology and takes it off the screen. |
| `iconSlot` | `SlotNode` |  | Sits before the title. On the web it is sized to the text — pass a bare `<Plus />`. On device an icon cannot be sized from outside it, so pass it at the size you want. |
| `actionSlot` | `SlotNode` |  | The header's far end, clear of the close button: a menu, a status badge, a switch. |
| `actionPlacement` | `ActionPlacement` | `"wrap"` | Where the action goes when the title and the action do not both fit on one line. `wrap` (the default) moves the action under the title; `inline` keeps it beside the title and cuts the title short with an ellipsis instead. `CardLayout`'s prop, passed to the card on the panel. |
| `emptySlot` | `SlotNode` |  | Shown instead of `contentSlot` when there is nothing in it: no element, or a `List` with no rows — `CardLayout`'s rule. |
| `loading` | `boolean` | `false` | Whether the body is still being fetched. On, a skeleton stands in for it and `emptySlot` is not consulted. The title and the footer stay. |
| `triggerSlot` | `SlotNode` |  | What opens it, wrapped in `DialogTrigger asChild` — pass a `<Button>`, not a bare string. With a trigger and no `open`, the dialog owns its own state and the caller holds none. |
| `open` | `boolean` |  | Controlled open state. Omit both this and `onOpenChange` to let the trigger drive it. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called with `true` when the trigger opens it and `false` when it closes. A close that `hasUnsavedChanges` asks about is reported only once the answer is Discard. With `open`, this is where the caller sets it. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | How wide the dialog is from the `sm` breakpoint up: `sm` 24rem, `md` 32rem, `lg` 42rem, `xl` 56rem, and `full` the window less 16px a side. Narrower than that, every size is as wide as the screen less the same 16px a side. |
| `footerSlot` | `SlotNode` |  | The footer's start. A destructive action, or a word on why the confirm is refusing. Several elements sit together in one row with a small gap; `footerActionsSlot` stays at the far end. |
| `footerActionsSlot` | `SlotNode \| ((close: () => void) => SlotNode)` |  | The footer's end. Cancel and confirm, as a fragment: below `sm` they stack full width, the last on top. Given alone, the footer is simply right-aligned. |
| `wrapperSlot` | `((parts: SlotNode, wrapper: { className: string }) => SlotNode)` |  | Wraps the header, the body and the footer together, inside the dialog. Its use is a form: with the fields and the submit button under one `<form>`, Enter in a field submits it and the footer's submit button is a real one. A `<form>` around the body alone leaves the button outside it, where the browser does not count it, and Enter in a form of two fields does nothing. |
| `dismissible` | `boolean` | `true` | Whether Escape and a click on the overlay close it. Off refuses to leave; prefer `hasUnsavedChanges`, which asks on the way out instead. |
| `hasUnsavedChanges` | `boolean \| (() => boolean)` | `false` | There is work in the body that closing would throw away. Escape, a click on the overlay, the close button and a `footerActionsSlot` Cancel then ask first, and the dialog stays open if the answer is no. |
| `discardTitle` | `ReactNode` | `"Discard your changes?"` | The question that asks: "Discard your changes?". Defaulted, because this one really is the same everywhere. |
| `discardDescription` | `ReactNode` | `"What you have typed here will not be saved."` | The line under it: "What you have typed here will not be saved." |
| `discardLabel` | `ReactNode` | `"Discard"` | The verb that throws the work away: "Discard". |
| `keepLabel` | `ReactNode` | `"Keep editing"` | The verb that goes back to it: "Keep editing". Also what Escape answers. |
| `showCloseButton` | `boolean` | `true` | Whether the ✕ is drawn in the corner. It closes the way Escape does, so `hasUnsavedChanges` still asks first. Turn it off only when the footer has a way out of its own, such as a Cancel. |
| `className` | `string` |  | On the dialog's panel. Its width comes from `size`, so reach for this for anything else. |
| `headerClassName` | `string` |  | On the header: the title, the description, and the room the ✕ takes. |
| `contentClassName` | `string` |  | On the body, the part that scrolls between the header and the footer. |
| `footerClassName` | `string` |  | On the footer, which holds `footerSlot` and the actions. |
<!-- /props -->

- `title` is **required** — it is what assistive technology announces. A design with no room for
  a heading passes `hideTitle`, which keeps the title and takes it off the screen. Never drop it.
- Give a `triggerSlot` and no `open`, and the dialog owns its state. Pass `open`/`onOpenChange` when
  something outside the trigger opens it (a row menu, a route, a keyboard shortcut).
- The body scrolls; the header and footer do not. Do not add `max-h-*` or `overflow-y-auto` — a
  cap on the whole dialog is what takes the title off the screen on a long form.
- **`hasUnsavedChanges` is the one to remember.** On, Escape, a click on the overlay and the
  close button all ask before throwing the work away, and the dialog is still there behind the
  question. It is asked for, never computed, because only the caller knows what its fields are.
  `discardTitle`, `discardDescription`, `discardLabel` and `keepLabel` reword the question when
  the dialog knows what is lost. The question is a `ConfirmDialog` (so `@cubeui/dialog-layout`
  installs `@cubeui/confirm-dialog`): an `alertdialog` at `sm` width, Keep first and Discard last.
- **A dialog is a `CardLayout` on the dialog's panel.** The panel draws the border, fill, shadow
  and `p-6` inset, and the card's parts sit on it: the title is the dialog's `text-lg` title and
  names it, the body is the one part that scrolls, and the footer stacks below `sm`. So a dialog
  takes the card's `iconSlot` before the title, an `actionSlot` at the header's far end (kept
  clear of the close button), `actionPlacement`, `descriptionPlacement`, `loading` and
  `emptySlot`, with the card's rules for each — see [Cards](cards.md#cards). A `CardLayout` in the
  dialog's body is drawn as a card again.
- **`descriptionPlacement="popover"` folds the description behind a button after the title**, as
  on a card, on both halves. On the web the dialog is still described by the sentence, so a screen
  reader reads it as the dialog opens. Pass the same placement your app's cards and fields use.
- **A dialog keeps 16px clear of each side of the screen**, on both platforms and at every size,
  `full` included. Do not pad the dialog or cap its width to make room at a phone's edge.
- **The header and footer look the same on both platforms.** The title and description are
  left-aligned; the footer is a right-aligned row that stacks its buttons full width, the main one
  on top, below `sm`, as `ConfirmDialog`'s does. `footerSlot` sits at the row's start and stacks
  under the buttons. Do not centre the header or reverse the buttons yourself, and pass the
  buttons as a fragment, not wrapped in a `View` or `div` of your own, which would hold them at
  their labels' width.
- **A toast raised while the dialog is open is drawn over it**, announced and pressable: a press on
  its Undo or ✕ does not close the dialog or ask `hasUnsavedChanges`. That is on the web. On
  device a toast raised under an open dialog is not seen until the dialog closes, so say a failure
  inside the dialog, beside what caused it.
- **Pass it as a function when the answer is not something you render.** The question is asked
  once, at a click — nothing in the dialog draws the answer — so a boolean makes you keep a value
  in render that only a handler reads, and work held outside the form's fields has to be lifted
  into state to answer at all. `hasUnsavedChanges={() => !form.state.isDefaultValue ||
  picker.hasEdits()}` runs at the click and subscribes to nothing. `isDefaultValue` and not
  `isDirty`: `isDirty` stays true for a field typed into and then back out of, so the dialog asks
  about a form identical to how it opened.
- **Take `close` from `footerActionsSlot` rather than closing the dialog yourself.** Pass a function
  and it is handed the dialog's own close — the same one Escape, the overlay and the close button
  go through, so `hasUnsavedChanges` asks on the way through Cancel too. A Cancel wired to your
  own `setOpen(false)` goes around the shell, and that is the door people actually click:

  ```tsx
  footerActionsSlot={(close) => (
    <>
      <Button variant="outline" onClick={close} content="Cancel" />
      <Button variant="positive" onClick={save} content="Save" />
    </>
  )}
  ```

  The node form still works and is right for a footer that closes nothing. Only `footerActionsSlot`
  takes the function; `footerSlot` is the other end of the row.
- `dismissible={false}` refuses Escape and outside clicks outright. Prefer `hasUnsavedChanges`,
  which asks on the way out rather than refusing to leave.
- **A form in a dialog puts its `<form>` in `wrapperSlot`**, not in `contentSlot`.
  `wrapperSlot={(parts, { className }) => <FormElement className={className} …>{parts}</FormElement>}`
  wraps the header, body and footer together inside the dialog, so the footer's submit is a
  submit button the form owns, and Enter in a field submits. A `<form>` in `contentSlot` leaves the
  button outside it, and Enter in a form of two fields does nothing. Pass `className` on: it keeps
  the body scrolling. It is a function, called rather than mounted, so the fields keep their
  state — see [forms/app-form.md](../forms/app-form.md#forms-in-dialogs).

### A page with unsaved edits

A dialog asks through `hasUnsavedChanges`. A page has three ways out and no shell that owns them
— a router navigation, its own Close button, closing the tab — so it has a guard instead, from
`@cubeui/unsaved-changes-guard`. Do not wire the router's blocker to a dialog by hand, with a
second piece of state for the Close button:

```tsx
const blocker = useBlocker({ shouldBlockFn: () => dirty, withResolver: true });
const guard = useUnsavedChangesGuard({ hasUnsavedChanges: dirty, blocker });

<Button variant="outline" onPress={() => guard.leave(onClose)} content="Close" />
<UnsavedChangesDialog guard={guard} />
```

- **It imports no router.** `blocker` is whatever the app's router returned: TanStack Router's
  `useBlocker({ withResolver: true })` and React Router's `useBlocker(dirty)` both fit as they
  come. *Discard* calls its `proceed`, *Keep editing* its `reset`. An app with no router leaves
  it out.
- `guard.leave(go)` is for the page's own Close and Cancel: it runs `go` at once when nothing
  would be lost and after *Discard* when something would. On a device it is also what the
  navigator's "before remove" event calls —
  `usePreventRemove(dirty, ({ data }) => guard.leave(() => navigation.dispatch(data.action)))`.
- Closing the tab is covered on the web by the guard's own `beforeunload` listener, held only
  while there are changes, so the router's `enableBeforeUnload` is not needed. The browser words
  that question itself.
- `hasUnsavedChanges` is a boolean or a function, as on `DialogLayout`.
- The wording is `DialogLayout`'s by default, and the props that change it have the same names:
  `discardTitle`, `discardDescription`, `discardLabel` and `keepLabel`. `stayLabel` is
  `keepLabel`'s old name, deprecated and kept for one release.
- The guard's two answers are `guard.discard()` and `guard.keep()`, named for the buttons they
  answer. `guard.stay()` is `keep`'s old name, deprecated and kept for one release.

### Saving with Cmd/Ctrl+S

There is no registry item for this, on purpose: it is one listener, it exists only where there
is a keyboard, and only one app has an editor page that needs it. A web app that does keeps the
hook itself, beside the page that saves:

```ts
/** Runs `onSave` on Cmd/Ctrl+S while `enabled`, and always keeps the browser's own save away. */
export function useSaveShortcut(onSave: () => void, enabled = true) {
  const latest = useRef(onSave);
  latest.current = onSave;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (enabled) latest.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
```

Pass it the same function the Save button calls and the same condition that enables the button,
so the key and the button cannot disagree. The Save button stays on the page: the shortcut is a
second way in, never the only one.
