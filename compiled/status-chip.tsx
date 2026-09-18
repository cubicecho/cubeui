/**
 * Compiled from `registry/ui/status-chip.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * `neutral` and `info` come from the theme; the other three do not.
 *
 * shadcn's token set has exactly one semantic colour (`destructive`), so
 * success and warning are palette colours picked to sit beside it. An app that
 * adds its own tokens should override these two lines and nothing else.
 */
const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted",
  info: "bg-primary/10",
  success: "bg-green-500/10",
  warning: "bg-amber-500/10",
  danger: "bg-destructive/10",
};

const TONE_TEXT_CLASS: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  info: "text-primary",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-destructive",
};

export function StatusChip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: string;
}) {
  return (
    <div
      className={cn(
        "cube-rn-view",
        "self-start rounded-full px-2 py-0.5",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span
        className={cn("cube-rn-text", "text-[11px] font-medium capitalize", TONE_TEXT_CLASS[tone])}
      >
        {children}
      </span>
    </div>
  );
}
