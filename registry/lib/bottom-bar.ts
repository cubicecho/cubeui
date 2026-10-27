/**
 * Whether a bar runs along the bottom of the screen, and up to which width — so what floats at the
 * bottom (a toast) can sit above it instead of over it.
 *
 * A layout that draws the bar says so with {@link useReportBottomBar}; a floating surface reads it
 * with {@link useBottomBar}. A store rather than a context, because the reader is drawn by a
 * provider near the root, above the layout that knows about the bar, and a context only flows
 * down. Nothing is measured: the bar is drawn under a breakpoint, so the reader lifts itself under
 * the same breakpoint, with classes, and the first paint is already right on both platforms.
 */
import { useEffect, useSyncExternalStore } from "react";

/**
 * Where the bar stops being drawn: `sm`, `md`, `lg`, `xl` (drawn under that width), or `always`.
 */
export type BottomBarUntil = "sm" | "md" | "lg" | "xl" | "always";

type Entry = { until: BottomBarUntil };

const bars: Entry[] = [];
const listeners = new Set<() => void>();
let current: BottomBarUntil | null = null;

function publish() {
  current = bars.at(-1)?.until ?? null;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read() {
  return current;
}

/**
 * Say that this component draws a bar along the bottom of the screen, under `until`. Pass
 * `undefined` while it draws none. The last bar mounted is the one read.
 */
export function useReportBottomBar(until: BottomBarUntil | undefined): void {
  useEffect(() => {
    if (until === undefined) {
      return;
    }
    const entry: Entry = { until };
    bars.push(entry);
    publish();
    return () => {
      bars.splice(bars.indexOf(entry), 1);
      publish();
    };
  }, [until]);
}

/** The bottom bar on screen, as {@link BottomBarUntil}, or `null` when there is none. */
export function useBottomBar(): BottomBarUntil | null {
  return useSyncExternalStore(subscribe, read, read);
}
