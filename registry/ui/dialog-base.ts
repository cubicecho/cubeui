/**
 * The contract `dialog.tsx` and `dialog.web.tsx` both implement. Separate
 * module for the usual reason: Metro resolves `./dialog` to `dialog.web.tsx`
 * on web, so the web file cannot import shared types from `./dialog` without
 * importing itself.
 *
 * Deliberately narrower than radix's own props: `open`/`onOpenChange` and the
 * section slots, which is the surface both platforms can actually honour. A
 * shared contract is also the only thing that makes the platform pair
 * checkable — TypeScript resolves the native file and never compares the two,
 * so `scripts/check-registry-build.mjs` compares the exported names instead.
 */
import type { ReactNode } from "react";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export type DialogTriggerProps = {
  /**
   * Hand the press handler to the single child rather than wrapping it. Always
   * pass it, for the reason `popover-base.ts` gives: a `Pressable` wrapping a
   * `Button` never fires on native, because the inner pressable claims the touch.
   */
  asChild?: boolean | undefined;
  children: ReactNode;
};

/**
 * `DialogContent` takes three things the section slots do not.
 *
 * `onEscapeKeyDown` and `onInteractOutside` are the two ways a dialog closes without
 * the caller asking, and a form dialog with unsaved edits needs to intercept both.
 * Native has one of each — the hardware back button and the backdrop press — so they
 * are honoured there too rather than being web-only.
 */
export type DialogContentProps = DialogSectionProps & {
  /** Draw the corner close button. Default `true`. */
  showCloseButton?: boolean | undefined;
  onEscapeKeyDown?: ((event: Event) => void) | undefined;
  onInteractOutside?: ((event: Event) => void) | undefined;
  /** `undefined` passed explicitly is how "nothing describes this" is said to radix. */
  "aria-describedby"?: string | undefined;
};

/** Every part inside a `Dialog` — content, header, footer, title, description. */
export type DialogSectionProps = {
  className?: string | undefined;
  children?: ReactNode;
};
