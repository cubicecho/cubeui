/**
 * Whether a box that scrolls has anything to scroll, on device. `overflows.web.tsx` is the web
 * half, which measures.
 *
 * The web asks so that a box that scrolls is a tab stop only while it can scroll. A device has no
 * tab stops — a finger scrolls the box, and a screen reader's swipe moves through what is in it —
 * so there is nothing to decide, and this half never measures and always answers `false`.
 */
import { type RefObject, useRef } from "react";

/** A ref to put on the box, and `false`: on device nothing reads the answer. */
export function useOverflows<T = unknown>(): readonly [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  return [ref, false] as const;
}
