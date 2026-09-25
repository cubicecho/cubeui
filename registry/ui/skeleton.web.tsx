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
