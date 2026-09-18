/**
 * Compiled from `registry/ui/code.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * An inline monospace span. `<code>` has no native counterpart and it appeared
 * inline inside a sentence, so this has to be a `Text` — a `View` cannot be
 * nested in one.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Code({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "cube-rn-text",
        "rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
