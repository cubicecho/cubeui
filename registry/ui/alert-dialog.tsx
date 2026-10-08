/**
 * shadcn's alert dialog, on device: the same part names over the native `Dialog`, so a screen
 * written against `@cubeui/alert-dialog` moves to an Expo app without being rewritten.
 *
 * The web half is `alert-dialog.web.tsx`, shadcn's file over radix's `AlertDialog`, unchanged —
 * a DOM app that installed this item before it had a native half keeps exactly what it had.
 *
 * What makes it an *alert* dialog rather than a dialog is three things, and they are what
 * `AlertDialogContent` sets on the native `DialogContent`: it is announced as an `alertdialog`,
 * it has no corner close button, and a press on the backdrop does not answer it. The ways out
 * are `AlertDialogCancel`, `AlertDialogAction` and the back button, which is native's Escape.
 *
 * Before reaching for this, check `ConfirmDialog`, `confirm()` and `ConfirmButton`, which are
 * this dialog assembled for a destructive question and are what a new call site wants.
 */
import type { ComponentProps, ReactNode } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

/*
 * The root and the trigger are the native `Dialog`'s own, not wrappers round them: `Dialog` finds
 * its trigger among its children by type — it has to render while the `Modal` is shut — and a
 * wrapper would be a different type and never appear.
 */
/** The root of a dialog that must be answered: it holds the open state. */
const AlertDialog = Dialog;
/** The element that opens the alert dialog. */
const AlertDialogTrigger = DialogTrigger;
/** Where the alert dialog is mounted, outside the tree that opened it. */
const AlertDialogPortal = DialogPortal;
/** The dimmed backdrop behind the alert dialog. */
const AlertDialogOverlay = DialogOverlay;

const CONTENT_SIZES = { default: "max-w-lg", sm: "max-w-xs" } as const;

/** A press beside the card is not an answer. */
const holdOpen = (event: Event) => event.preventDefault();

/** The alert dialog's card, with `role="alertdialog"`. */
function AlertDialogContent({
  className,
  size = "default",
  children,
}: {
  className?: string | undefined;
  /** `sm` is the narrow card, for a question with two short answers. */
  size?: keyof typeof CONTENT_SIZES | undefined;
  children?: ReactNode;
}) {
  return (
    <DialogContent
      role="alertdialog"
      showCloseButton={false}
      onInteractOutside={holdOpen}
      className={cn(CONTENT_SIZES[size], className)}
    >
      {children}
    </DialogContent>
  );
}

type SectionProps = { className?: string | undefined; children?: ReactNode };

/** The block holding the title and the description. */
function AlertDialogHeader({ className, children }: SectionProps) {
  return <DialogHeader className={className}>{children}</DialogHeader>;
}

/** The row holding the cancel and the action buttons. */
function AlertDialogFooter({ className, children }: SectionProps) {
  return <DialogFooter className={className}>{children}</DialogFooter>;
}

/** The question the alert dialog asks, and its accessible name. */
function AlertDialogTitle({ className, children }: SectionProps) {
  return <DialogTitle className={className}>{children}</DialogTitle>;
}

/** The sentence under the title, read as the dialog's description. */
function AlertDialogDescription({ className, children }: SectionProps) {
  return <DialogDescription className={className}>{children}</DialogDescription>;
}

/** The icon or picture above the title. Pass the glyph bare; it is sized by the caller. */
function AlertDialogMedia({ className, children }: SectionProps) {
  return (
    <View
      className={cn(
        "mb-2 size-16 items-center justify-center rounded-md bg-foreground/10",
        className,
      )}
    >
      {children}
    </View>
  );
}

/**
 * A `Button` that closes the dialog after its own press. `DialogClose asChild` hands its child the
 * close as `onPress`, over whatever `onPress` the child had, so the caller's is carried past it as
 * `onAct` and both run: the action first, then the close — radix's `Action` and `Cancel` order.
 */
function ClosingButton({
  onPress: close,
  onAct,
  ...props
}: ButtonProps & { onAct?: ButtonProps["onPress"] | undefined }) {
  return (
    <Button
      {...props}
      onPress={(event) => {
        onAct?.(event);
        close?.(event);
      }}
    />
  );
}

/**
 * `Button`'s props, and the label as `children` — shadcn's shape for these two, which the web half
 * keeps, so a call site reads the same on both.
 */
type ActionProps = Omit<ButtonProps, "content"> & { children?: ReactNode };

/** The button that confirms, and closes the dialog. */
function AlertDialogAction({
  variant = "default",
  size = "default",
  onPress,
  children,
  ...props
}: ActionProps) {
  return (
    <DialogClose asChild>
      <ClosingButton variant={variant} size={size} onAct={onPress} {...props} content={children} />
    </DialogClose>
  );
}

/** The button that declines, and closes the dialog. */
function AlertDialogCancel({
  variant = "outline",
  size = "default",
  onPress,
  children,
  ...props
}: ActionProps) {
  return (
    <DialogClose asChild>
      <ClosingButton variant={variant} size={size} onAct={onPress} {...props} content={children} />
    </DialogClose>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
