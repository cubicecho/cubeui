import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HeaderContentFooter } from "@/registry/new-york/layout/header-content-footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/new-york/ui/dialog";

/** How wide the dialog wants to be, past the phone width every size shares. */
const SIZES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[calc(100vw-4rem)]",
} as const;

type DialogLayoutProps = {
  /** The body. It is the only part that scrolls. */
  content: ReactNode;
  /**
   * Required, because a dialog without a title is one no screen reader can announce. A dialog
   * whose design has no room for a heading passes `hideTitle` and keeps this.
   */
  title: ReactNode;
  /** Read to the same people the title is. Absent, the dialog is described by its body. */
  description?: ReactNode;
  /** Keeps the title for assistive technology and takes it off the screen. */
  hideTitle?: boolean;
  /**
   * What opens it, wrapped in `DialogTrigger asChild` — pass a `<Button>`, not a bare string.
   * With a trigger and no `open`, the dialog owns its own state and the caller holds none.
   */
  trigger?: ReactNode;
  /** Controlled open state. Omit both this and `onOpenChange` to let the trigger drive it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: keyof typeof SIZES;
  /** The footer's start. A destructive action, or a word on why the confirm is refusing. */
  footer?: ReactNode;
  /** The footer's end. Cancel and confirm. Given alone, the footer is simply right-aligned. */
  footerActions?: ReactNode;
  /**
   * Whether Escape and a click on the overlay close it. Off for a dialog holding work that
   * would be lost — but prefer asking on the way out to refusing to leave.
   */
  dismissible?: boolean;
  showCloseButton?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
};

/**
 * A dialog with its slots already placed, and a body that scrolls under a header that does not.
 *
 * The scroll is the reason this exists rather than a snippet. Every hand-written dialog in these
 * apps caps itself with `max-h-[85vh] overflow-y-auto` on the content, which scrolls the *whole*
 * dialog: on a long form the title leaves the screen first and the save button is somewhere past
 * the end of the fields.
 *
 * That shape — chrome that stays, a middle that moves, floors that let it — is
 * {@link HeaderContentFooter}, so the dialog composes it rather than owning a second copy. What
 * is left here is the part that is about dialogs: the primitive's own header and footer, the
 * title an assistive technology needs, and the two classes that turn `DialogContent` into a
 * column that can be divided.
 *
 * **Padding stays with the primitive.** `DialogContent` carries it (`p-6` in new-york, `p-4` in
 * others) and so do the footers that bleed to its edge with a negative margin. A shell that set
 * its own would be a shell that only fits one style, so this one overrides `display` and
 * `overflow` and nothing else.
 */
export function DialogLayout({
  content,
  title,
  description,
  hideTitle = false,
  trigger,
  open,
  onOpenChange,
  size = "md",
  footer,
  footerActions,
  dismissible = true,
  showCloseButton = true,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: DialogLayoutProps) {
  const hasFooter = Boolean(footer || footerActions);
  const stop = dismissible ? undefined : (event: Event) => event.preventDefault();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent
        showCloseButton={showCloseButton}
        onEscapeKeyDown={stop}
        onInteractOutside={stop}
        // Radix warns when nothing describes the content. Without a description that is the
        // intent, and an explicit `undefined` is how it is said — spread only in that case,
        // because the prop is applied after the primitive's own and would unlink a real one.
        {...(description ? {} : { "aria-describedby": undefined })}
        // `flex` replaces the primitive's `grid` so the body can be handed the leftover height;
        // `overflow-hidden` takes the scroll off the dialog so the chassis can put it on the
        // body. The cap is the primitive's own, restated for the styles that ship without one.
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
          SIZES[size],
          className,
        )}
      >
        <HeaderContentFooter
          scroll
          className="min-h-0 flex-1 gap-4"
          header={
            <DialogHeader
              // The close button is positioned against the dialog, not the header, so a long
              // title runs under it without this.
              className={cn(showCloseButton && "pr-6", headerClassName)}
            >
              <DialogTitle className={cn(hideTitle && "sr-only")}>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
          }
          // Four pixels of room either side, given back as padding: a focus ring is drawn
          // outside the element that owns it, and a scroll container clips at its edge.
          contentClassName={cn("-mx-1 px-1", contentClassName)}
          content={content}
          footer={
            hasFooter ? (
              <DialogFooter
                className={cn(footer && footerActions && "sm:justify-between", footerClassName)}
              >
                {footer}
                {footerActions ? (
                  <div className="flex items-center gap-2">{footerActions}</div>
                ) : null}
              </DialogFooter>
            ) : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
