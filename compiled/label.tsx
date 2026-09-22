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
 *
 * It takes radix's `Label.Root` props whole — `id`, `onClick`, the `aria-*`
 * and `data-*` props — because it installs over a DOM app's shadcn label, and
 * shadcn's `FieldLabel` is typed as this label's props.
 */

import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { LABEL_CLASS } from "@/components/ui/label-base";
import { cn } from "@/lib/utils";

type LabelProps = Omit<ComponentPropsWithRef<typeof LabelPrimitive.Root>, "className"> & {
  className?: string | undefined;
};

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root data-slot="label" {...props} className={cn(LABEL_CLASS, className)} />
  );
}

export { Label };
