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
