/**
 * Compiled from `registry/ui/confirm-dialog.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * The text the user has to type before the destructive button unlocks — the name of the
   * folder, the repository, the workspace. Matched exactly: case and spaces count. Left out, the
   * dialog asks with one click, as it always has.
   */
  requireText?: string | undefined;
  /**
   * The input's label, when `requireText` is set. Defaults to "Type **{requireText}** to
   * confirm"; pass "Type **work** to delete it" to say the verb.
   */
  requireTextLabel?: ReactNode;
  onConfirm: () => void;
};

/**
 * A destructive-action confirmation dialog — Cancel plus one destructive button.
 *
 * Prefer `useConfirm()` from `ui/confirm`: one instance mounted for the whole
 * app, handing back a promise. This is the presentational half that it uses, and
 * it is exported for the case where a caller wants the prompt's open state under
 * its own control.
 *
 * `requireText` is the type-the-name mode, for a delete that is big and cannot be
 * undone: a labelled input, and the destructive button stays disabled — Enter
 * included — until it holds that text exactly.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireText,
  requireTextLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        {/* Keyed by the text, so a prompt raised over an open one for something else starts
            empty too. Closing unmounts the body on both platforms, which is what empties the
            box between openings. */}
        <ConfirmDialogBody
          key={requireText ?? ""}
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          requireText={requireText}
          requireTextLabel={requireTextLabel}
          onCancel={() => onOpenChange(false)}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}

type ConfirmDialogBodyProps = {
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  requireText: string | undefined;
  requireTextLabel: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * The inside of the dialog, in its own component so the typed text lives only as
 * long as the dialog is open. Held in `ConfirmDialog` itself, it would outlive the
 * closing and greet the next opening already filled in — one click from a delete
 * the user was only ever asked about once.
 */
function ConfirmDialogBody({
  title,
  description,
  confirmLabel,
  cancelLabel,
  requireText,
  requireTextLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogBodyProps) {
  const [typed, setTyped] = useState("");
  const inputId = useId();
  const labelId = useId();
  const locked = requireText !== undefined && typed !== requireText;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {requireText !== undefined ? (
        <div className="cube-rn-view gap-2">
          {/* `htmlFor` focuses the box on the web; `aria-labelledby` is the name on both
              platforms, since a native label has no association of its own. */}
          <Label id={labelId} htmlFor={inputId}>
            {requireTextLabel ?? (
              <>
                Type{" "}
                <span className="cube-rn-text font-semibold text-foreground">{requireText}</span> to
                confirm
              </>
            )}
          </Label>
          <Input
            id={inputId}
            aria-labelledby={labelId}
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => {
              if (!locked) onConfirm();
            }}
            autoFocus
          />
        </div>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" disabled={locked} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
