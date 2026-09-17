/**
 * Compiled from `registry/layout/section-heading.tsx` — Stage 0 spike, hand-run.
 *
 * Written by hand exactly as the transform would emit it, so the output can be judged before the
 * transform is built. The only things that changed:
 *
 *   `import { Text } from "react-native"`   dropped — the element map covers it
 *   `<Text>`                          ->    `<span>`      (level 1, element map)
 *   `className={cn(...)}`             ->    `className={cn("cube-rn-text", ...)}`
 *
 * The props, the class strings and the TSDoc are untouched, which is the property that makes a
 * compiled registry worth having: the web item is the same component, not a second one to keep
 * in step by hand.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** `overline` is the smaller uppercase label; `default` is a plain section label. */
  variant?: "default" | "overline";
  className?: string;
  children: ReactNode;
};

// A small muted heading above a section of content.
export function SectionHeading({ variant = "default", className, children }: SectionHeadingProps) {
  return (
    <span
      className={cn(
        "cube-rn-text",
        "font-semibold text-muted-foreground",
        variant === "overline" ? "text-xs uppercase tracking-wide" : "text-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
