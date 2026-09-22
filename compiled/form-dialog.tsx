/**
 * Compiled from `registry/ui/form-dialog.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * Dialog chrome shared by every form dialog: `Dialog` + sized content + header.
 *
 * The caller keeps ownership of the form body and the footer (via
 * `FormDialogFooter`) rather than passing them as props. A form's generics flow
 * from its schema through every bound field, and a wrapper that owns the form
 * has to re-declare them at each layer — more trouble than the wrapper saves.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[480px]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type FormDialogFooterProps = {
  onCancel: () => void;
  cancelLabel?: string;
  /** Left-aligned action — a Delete or a Mark complete. Drawn only when set. */
  secondary?: ReactNode;
  /**
   * A rejected mutation's message, shown above the buttons. Field validation
   * stays inline beneath its field — this is for what only the server knows,
   * such as a delete the database refuses on a foreign key.
   */
  error?: string | null;
  /** The submit control — typically `<form.SubmitButton />`. */
  children: ReactNode;
};

export function FormDialogFooter({
  onCancel,
  cancelLabel = "Cancel",
  secondary,
  error,
  children,
}: FormDialogFooterProps) {
  return (
    <>
      {error ? (
        <span role="alert" className="cube-rn-text text-sm text-destructive">
          {error}
        </span>
      ) : null}
      <DialogFooter className={cn("items-center", secondary && "sm:justify-between")}>
        {secondary ? <div className="cube-rn-view">{secondary}</div> : null}
        <div className="cube-rn-view flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {children}
        </div>
      </DialogFooter>
    </>
  );
}
