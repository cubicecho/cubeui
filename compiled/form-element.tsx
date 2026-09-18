/**
 * Copied from `registry/ui/form-element.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The element `<Form>` renders on web: a real `<form>`.
 *
 * Kept for one reason — Enter inside a field raises the DOM submit event, and
 * nothing else in the tree does. `SubmitButton` is a `Pressable`, not a submit
 * control, so the two paths cannot both fire for one press.
 */
import type { FormElementProps } from "@/components/ui/form-element-base";
import { cn } from "@/lib/utils";

export function FormElement({ onSubmit, className, children }: FormElementProps) {
  return (
    <form
      className={cn("flex flex-col", className)}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
