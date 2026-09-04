# Pending SKILL.md section — FormDialog

Fold into `.claude/skills/cubeui/SKILL.md` after merge. Two edits: a row in the **Choosing**
table, and the **Form dialogs** section below, which goes immediately after **Dialogs**.

---

## Row for the "Choosing" table

| The shape you are building | Use |
| --- | --- |
| A modal with fields in it and a Save | `FormDialog` |

Goes directly under the `DialogLayout` row, because the two are one decision: if the dialog holds
a form, `FormDialog` is the one, and if it holds anything else, `DialogLayout` is.

---

## Form dialogs

`FormDialog` is `DialogLayout` with the form part filled in: a real `<form>`, a Cancel and a Save
in the footer, and the guards that stop a save going twice.

```tsx
<FormDialog
  trigger={<Button>New workspace</Button>}
  title="New workspace"
  description="A workspace exposes the servers you choose at its own URL."
  size="lg"
  content={<WorkspaceFields value={draft} onChange={setDraft} />}
  submitLabel="Create workspace"
  canSubmit={draft.name.trim() !== ""}
  pending={create.isPending}
  error={create.error?.message}
  onSubmit={() => create.mutate(draft)}
/>
```

- **Do not write the buttons.** Cancel and Save are the shell's, in that order, and Cancel closes
  the dialog on its own — it needs no prop, controlled or not. `submitLabel` is what Save says.
  A footer of your own `<Button onClick={save}>` is the pattern this component replaces.
- **Do not write the `<form>` either**, and do not pass one as `content`: the shell owns that
  element, and a form inside a form is invalid HTML whose inner submit the browser drops. Pass
  the bare fields.
- **Enter in a field saves.** Once. That comes free with the form element and is the thing every
  hand-rolled version lost.
- `pending` is a save on its way out: Save goes inert and spins, and a second submit is refused
  no matter which way it arrives. Pass the mutation's pending flag straight in.
- `loading` is the record on its way *in* — an edit dialog opened before its data landed. Submit
  is refused the same way, and the footer stays exactly where it is rather than appearing when
  the data arrives. The skeleton fields are yours: pass them as `content`. `loading` outranks
  `pending`, because a record that has not arrived is not a record being saved.
- `canSubmit` is your validity, not the shell's — nothing here reads a field. Off, Save is inert.
  Say why next to the field, or in `error`; a Save that is disabled and silent is the thing
  per-field messages exist to fix.
- `error` is what went wrong with the **form** — a rejected save, a name already taken. It goes
  in the footer beside the button that caused it and is announced. Not a toast: a message in the
  far corner is gone before the eye gets there. Field-level complaints stay with their field.
- `footer` still means the footer's far end from the buttons — a Delete, a note on what saving
  costs. With `error` as well, the two stack and the error goes on top.

`onSubmit` takes no arguments. The event is already handled — default prevented, and refused
while blocked — so there is nothing useful left to do with it.

### What it still does not do

Ask before discarding. Escape and a stray click on the overlay close the dialog and the draft
goes with it, exactly as they do for `DialogLayout`. That question needs a second dialog and a
flag to open it, which is state, and shells hold none — so it stays with the caller. Two ways to
answer it:

```tsx
// Refuse the accidental exits outright. Blunt, but it is one prop.
<FormDialog dismissible={false} … />

// Or drive `open` yourself and ask on the way out.
<FormDialog open={open} onOpenChange={(next) => (next || !dirty ? setOpen(next) : ask())} … />
```
