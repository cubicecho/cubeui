/**
 * Whether a box that scrolls has anything to scroll, on device. `overflows.web.tsx` is the web
 * half, which measures.
 *
 * The web asks so that a box that scrolls is a tab stop only while it can scroll, and so that a
 * table can fade the edge that has more past it. A device has no tab stops — a finger scrolls the
 * box, and a screen reader's swipe moves through what is in it — and no table, so there is nothing
 * to decide, and this half never measures and always answers `false`.
 */
import { type RefObject, useRef } from "react";

/** Which ends of the box's inline axis have more past them. Never either, on device. */
export type OverflowEdges = { readonly start: boolean; readonly end: boolean };

const NO_EDGES: OverflowEdges = { start: false, end: false };

/** A ref to put on the box, `false`, and no edges: on device nothing reads the answer. */
export function useOverflows<T = unknown>(): readonly [
  RefObject<T | null>,
  boolean,
  OverflowEdges,
] {
  const ref = useRef<T>(null);
  return [ref, false, NO_EDGES] as const;
}
