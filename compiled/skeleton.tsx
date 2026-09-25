/**
 * Copied from `registry/ui/skeleton.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web skeleton: shadcn's, a `<div>` with `animate-pulse`, every `<div>` prop passed through.
 * `skeleton.tsx` is the native counterpart and says why this half is hand-written; `skeleton-base.ts`
 * holds what they share.
 */
import type * as React from "react";
import { skeletonClass } from "@/components/ui/skeleton-base";
import { cn } from "@/lib/utils";

type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse", skeletonClass, className)}
      {...props}
    />
  );
}

export type { SkeletonProps };
export { Skeleton };
