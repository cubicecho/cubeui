/**
 * Copied from `registry/ui/spinner.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

import { type SpinnerProps, spinnerClass } from "@/components/ui/spinner-base";
import { cn } from "@/lib/utils";
/**
 * The web spinner: shadcn's — `LoaderCircle` with `animate-spin`, a
 * `role="status"` named `Loading`. `spinner.tsx` is the native counterpart and
 * its header says why it is not `ActivityIndicator`; `spinner-base.ts` holds
 * what they share.
 *
 * It takes `label` and `className` and nothing else, as the native half does:
 * shadcn's spreads the rest of the `<svg>`'s attributes, and a call site that
 * passed one is rare enough to wrap the glyph itself.
 *
 * The glyph is `currentColor`, so it takes the colour of the text around it —
 * a button's label, a muted line — unless `className` names one.
 */
import { LoaderCircle } from "./icons";

export type { SpinnerProps };

export function Spinner({ label = "Loading", className }: SpinnerProps) {
  return (
    <LoaderCircle
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn(spinnerClass, "animate-spin", className)}
    />
  );
}
