/**
 * The web skeleton: shadcn's, a `<div>` with `animate-pulse`, every `<div>` prop passed through.
 * `motion-safe:` keeps it still for a reader whose system asks for reduced motion.
 * `skeleton.tsx` is the native counterpart and says why this half is hand-written; `skeleton-base.ts`
 * holds what they share.
 */
import type * as React from "react";
import { skeletonClass } from "@/components/ui/skeleton-base";
import { cn } from "@/lib/utils";

type SkeletonProps = React.ComponentProps<"div">;

/** A pulsing block standing in for content that has not arrived. */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("motion-safe:animate-pulse", skeletonClass, className)}
      {...props}
    />
  );
}

export type { SkeletonProps };
export { Skeleton };
