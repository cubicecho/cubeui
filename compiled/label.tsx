/**
 * Copied from `registry/ui/label.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web label: radix, which is here for one thing — clicking the label
 * focuses the control named by `htmlFor`. That association has no native
 * counterpart, which is the whole reason for the split.
 */

import { Label as LabelPrimitive } from "radix-ui";
import { LABEL_CLASS, type LabelProps } from "@/components/ui/label-base";
import { cn } from "@/lib/utils";

function Label({ htmlFor, className, children }: LabelProps) {
  return (
    <LabelPrimitive.Root htmlFor={htmlFor} className={cn(LABEL_CLASS, className)}>
      {children}
    </LabelPrimitive.Root>
  );
}

export { Label };
