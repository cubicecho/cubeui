/**
 * Copied from `registry/ui/reduced-motion.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * Whether the reader asked the system for reduced motion, on the web: the
 * `(prefers-reduced-motion: reduce)` media query. `reduced-motion.tsx` is the device half.
 *
 * The components here honour the query in CSS, through the tokens stylesheet and `motion-safe:`
 * classes, and need no hook. This is for what CSS cannot reach — a `scrollTo` that would glide —
 * and for an app's own animation in script.
 *
 * Nothing touches `window` at import, and a server render answers `false`.
 */
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void) {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function read() {
  return typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches;
}

/** `true` when the reader's system asks for reduced motion, kept up to date as they change it. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
