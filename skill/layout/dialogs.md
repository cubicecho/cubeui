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
| `hideTitle` | `boolean` | `false` | Keeps the title for assistive technology and takes it off the screen. |
| `triggerSlot` | `SlotNode` |  | What opens it, wrapped in `DialogTrigger asChild` — pass a `<Button>`, not a bare string. With a trigger and no `open`, the dialog owns its own state and the caller holds none. |
| `open` | `boolean` |  | Controlled open state. Omit both this and `onOpenChange` to let the trigger drive it. |
| `onOpenChange` | `((open: boolean) => void)` |  |  |
| `size` | `keyof typeof SIZES` | `"md"` |  |
| `footerSlot` | `SlotNode` |  | The footer's start. A destructive action, or a word on why the confirm is refusing. |
| `footerActionsSlot` | `SlotNode \| ((close: () => void) => SlotNode)` |  | The footer's end. Cancel and confirm. Given alone, the footer is simply right-aligned. |
| `dismissible` | `boolean` | `true` | Whether Escape and a click on the overlay close it. Off refuses to leave; prefer `hasUnsavedChanges`, which asks on the way out instead. |
| `hasUnsavedChanges` | `boolean \| (() => boolean)` | `false` | There is work in the body that closing would throw away. Escape, a click on the overlay, the close button and a `footerActionsSlot` Cancel then ask first, and the dialog stays open if the answer is no. |
| `discardTitle` | `ReactNode` | `"Discard your changes?"` | The question that asks. Defaulted, because this one really is the same everywhere. |
| `discardDescription` | `ReactNode` | `"What you have typed here will not be saved."` |  |
| `discardLabel` | `ReactNode` | `"Discard"` | The verb that throws the work away, and the one that goes back to it. |
| `keepLabel` | `ReactNode` | `"Keep editing"` |  |
| `showCloseButton` | `boolean` | `true` |  |
| `className` | `string` |  |  |
| `headerClassName` | `string` |  |  |
| `contentClassName` | `string` |  |  |
| `footerClassName` | `string` |  |  |
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
- **The header and footer look the same on both platforms.** The title and description are
  left-aligned; the footer is a right-aligned row that stacks its buttons full width, the main one
  on top, below `sm`. Do not centre the header or reverse the buttons yourself.
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
- A form in a dialog is this component with a `<form>` as `contentSlot` — see [forms/app-form.md](../forms/app-form.md#forms-in-dialogs).

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
- The wording is `DialogLayout`'s by default. `discardTitle`, `discardDescription`,
  `discardLabel` and `stayLabel` on `UnsavedChangesDialog` change it.

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
