/**
 * Compiled from `registry/lib/utils.ts` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Row actions that fade in on hover.
 *
 * There is no hover off web, so the class that hides them would hide them for
 * good — on native they are simply always visible. Kept here rather than inline
 * so no component has to reach for `Platform` to express it.
 */
export const HOVER_REVEAL = "opacity-0 transition-opacity group-hover:opacity-100";
