import { Loader2 } from "lucide-react";
import { type ComponentProps, type ReactNode, type SubmitEvent, useId } from "react";
import { cn } from "@/lib/utils";
import { DialogLayout } from "@/registry/new-york/layout/dialog-layout";
import { Button } from "@/registry/new-york/ui/button";
import { DialogClose } from "@/registry/new-york/ui/dialog";

type FormDialogProps = {
  /**
   * The fields. Stacked in a gapped column, because every hand-written copy of this dialog
   * opened by wrapping its fields in one — and each one picked a different gap.
   *
   * Not a `<form>`: this shell owns that element, and a form inside a form is invalid HTML
   * whose inner submit the browser silently drops.
   */
  content: ReactNode;
  /** Required for the same reason {@link DialogLayout} requires it: it is what is announced. */
  title: ReactNode;
  /** One line on what saving this does. Absent, the dialog is described by its fields. */
  description?: ReactNode;
  /** Keeps the title for assistive technology and takes it off the screen. */
  hideTitle?: boolean;
  /** What opens it. With a trigger and no `open`, the dialog owns its own open state. */
  trigger?: ReactNode;
  /** Controlled open state. Omit both to let the trigger drive it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: ComponentProps<typeof DialogLayout>["size"];
  /**
   * Whether Escape and a click on the overlay close it. A form dialog holds work, so this is
   * the one place refusing is defensible — but prefer asking on the way out, which stays the
   * caller's because it needs a second dialog and a flag to open it.
   */
  dismissible?: boolean;
  /**
   * Save. Called with nothing: the submit event is already handled — default prevented, and
   * refused while the form is `loading` or `pending` — so a caller given the event could only
   * undo that.
   *
   * Runs on the submit button *and* on Enter in a field, which is the whole difference between
   * this and a footer of `onClick` buttons.
   */
  onSubmit: () => void;
  /**
   * A save is in flight. The submit button goes inert and spins, and the form refuses to submit
   * again — the double-submit guard six of the seven dialogs this replaces wrote out by hand,
   * and the seventh forgot.
   *
   * Not the same thing as `loading`: this is the record on its way *out*.
   */
  pending?: boolean;
  /**
   * The record being edited has not arrived yet. Submit is refused and the button is inert, but
   * the footer is still drawn — dropping it is what makes the dialog jump the moment the data
   * lands, and it is the reflow a field-for-field skeleton cannot fix from inside the body.
   *
   * The skeleton fields themselves are `content`, the caller's: only the caller knows how many
   * fields are coming. `loading` outranks `pending`, because a record that has not arrived is
   * not a record being saved.
   */
  loading?: boolean;
  /**
   * Whether the form is in a state worth saving. Off, submit is refused exactly as `loading`
   * and `pending` refuse it. Pair it with `error` or with the fields' own messages: a Save that
   * is disabled and never says why is the complaint per-field errors exist to answer.
   */
  canSubmit?: boolean;
  /** What the submit button says. "Save" fits an edit; a create usually names the thing. */
  submitLabel?: ReactNode;
  /**
   * What went wrong with the *form* rather than with one field — a rejected save, a name
   * already taken. It sits in the footer beside the button that caused it and is announced,
   * because the alternative every source app reached for was a toast in the far corner that is
   * gone before the eye gets there.
   */
  error?: ReactNode;
  /**
   * The footer's far end from the buttons: a delete, a note on what saving costs. Given
   * alongside `error`, the two stack and the error goes on top.
   */
  footer?: ReactNode;
  /** The dialog itself. */
  className?: string;
  /** The `<form>`. Where a caller changes the column's gap, or makes the fields a grid. */
  contentClassName?: string;
};

/**
 * A form in a dialog: the fields, a Cancel, and a Save that cannot be pressed twice.
 *
 * The shape is {@link DialogLayout}'s, so it is composed rather than restated — this component
 * adds nothing to the chrome, the scroll or the sizing. Everything it does add is about the
 * *form*: one `<form>` element, a submit the keyboard can reach, the guards on the way into it,
 * and a home for the error a toast was standing in for.
 *
 * **The submit button is not inside the form, and still submits it.** The body scrolls and the
 * footer does not, so the two cannot be nested — putting the buttons inside the scrolling region
 * is the bug the dialog chassis exists to stop. They are associated the way HTML has always
 * allowed: the form carries an id, the button carries `form={id}`. That association is also
 * what makes Enter in a field submit, which a footer of `onClick` handlers never did.
 *
 * **The footer is always drawn.** Not conditionally, not replaced by a skeleton row: `loading`
 * makes it inert and leaves it in place, because a footer that appears when the data lands
 * changes the dialog's height under the reader, and a second component drawing stand-in buttons
 * is a second set of widths to keep in step with the real ones.
 *
 * **No state lives here.** `loading`, `pending` and `error` are the caller's, because they
 * belong to the caller's query and mutation; `open` is Radix's when uncontrolled. Ask-before-
 * discard is deliberately absent for the same reason — a shell holding it would be a shell no
 * project could install without also agreeing to its wording.
 */
export function FormDialog({
  content,
  title,
  description,
  hideTitle,
  trigger,
  open,
  onOpenChange,
  size,
  dismissible,
  onSubmit,
  pending = false,
  loading = false,
  canSubmit = true,
  submitLabel = "Save",
  error,
  footer,
  className,
  contentClassName,
}: FormDialogProps) {
  const formId = useId();
  const errorId = useId();
  const blocked = loading || pending || !canSubmit;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Belt and braces, and the two fail differently. `disabled` on the button stops the pointer
    // and the implicit submission a default button carries; this stops every other way in — a
    // `requestSubmit()` on the form's id, a password manager, a browser submitting a one-field
    // form on Enter regardless of the button. Only the first is visible to a reader, and only
    // the second is true of every path.
    if (blocked) return;
    onSubmit();
  };

  const errorNode = error ? (
    <p id={errorId} role="alert" data-slot="form-dialog-error" className="text-sm text-destructive">
      {error}
    </p>
  ) : null;

  return (
    <DialogLayout
      title={title}
      description={description}
      hideTitle={hideTitle}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      size={size}
      dismissible={dismissible}
      className={className}
      content={
        <form
          id={formId}
          data-slot="form-dialog-form"
          onSubmit={handleSubmit}
          // The error lives in the footer, outside this element, so nothing else links the two.
          aria-describedby={error ? errorId : undefined}
          aria-busy={loading || pending || undefined}
          className={cn("flex flex-col gap-4", contentClassName)}
        >
          {/*
            The form's own submit button, never seen. Enter in a field submits the form that
            *contains* a submit button — the spec says a button associated by `form=` counts, and
            engines and test tooling disagree about that often enough that the visible Save in
            the footer cannot be relied on to be the one Enter finds. `display: none` keeps it
            out of the tab order and out of the accessibility tree both.

            It is deliberately not disabled while a save is blocked, which is what leaves
            `handleSubmit`'s guard as the only thing between a held-down Enter and a second save.
            That is the guard doing its job, not a hole in it.
          */}
          <button type="submit" tabIndex={-1} className="hidden" />
          {content}
        </form>
      }
      // The footer's start takes both, stacked, rather than one winning: the error is about the
      // save and the aside is usually a delete, and a form can be refusing while still offering
      // to remove the thing.
      footer={
        errorNode && footer ? (
          <div data-slot="form-dialog-aside" className="flex flex-col items-start gap-1.5">
            {errorNode}
            {footer}
          </div>
        ) : (
          (errorNode ?? footer)
        )
      }
      footerActions={
        <>
          {/* Radix's own close, so Cancel needs no prop and works controlled or not. It stays
              live while a save is in flight: a Cancel that goes dead for the length of a slow
              request is a dialog a reader cannot leave. */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={blocked}>
            {/* Only for a save on its way out. Nothing is in flight while `loading`. */}
            {pending && !loading ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </>
      }
    />
  );
}
