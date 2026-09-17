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

/** Every part inside a `Dialog` — content, header, footer, title, description. */
export type DialogSectionProps = {
  className?: string | undefined;
  children?: ReactNode;
};
