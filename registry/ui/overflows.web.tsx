/**
 * Whether a box that scrolls has anything to scroll, on the web. `overflows.tsx` is the device half.
 *
 * A box that scrolls has to be a tab stop, or only a mouse wheel can move it: axe reports it as
 * `scrollable-region-focusable`, and a keyboard user cannot read what is past the edge. A box that
 * fits is then a stray stop in every page's tab order, so `Table`'s container, `CodeBlock`'s text
 * and `HeaderContentFooter`'s body take the stop only while this says they overflow.
 *
 * It also writes the width the box's scrollbar takes to `--scrollbar-width` on the box: a column
 * centred inside a scrolling box is centred on what the scrollbar leaves, half a scrollbar off a
 * column centred on the box's full width above it, and the variable is how it makes that up.
 */
import { type RefObject, useLayoutEffect, useRef, useState } from "react";

/** The variable the box's scrollbar width is written to, in pixels: `0px` where it takes no room. */
const SCROLLBAR_WIDTH = "--scrollbar-width";

/**
 * A ref to put on the box, and whether what it holds is larger than it is, on either axis, kept up
 * to date as either changes size. `false` until the box has been measured, just after mount.
 */
export function useOverflows<T extends HTMLElement = HTMLDivElement>(): readonly [
  RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  // Before paint, so a column placed by the scrollbar's width does not draw once without it.
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box || typeof ResizeObserver === "undefined") {
      return;
    }
    const measure = () => {
      setOverflows(box.scrollWidth > box.clientWidth || box.scrollHeight > box.clientHeight);
      const style = getComputedStyle(box);
      const borders =
        Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth);
      box.style.setProperty(SCROLLBAR_WIDTH, `${box.offsetWidth - box.clientWidth - borders}px`);
    };
    // The box keeps its size when what it holds grows, so each child is watched as well, and the
    // list of children, for a child that arrives later.
    const resizes = new ResizeObserver(measure);
    const watchChildren = () => {
      for (const child of Array.from(box.children)) {
        resizes.observe(child);
      }
    };
    const arrivals = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.removedNodes)) {
          if (node instanceof Element) {
            resizes.unobserve(node);
          }
        }
      }
      watchChildren();
      measure();
    });
    resizes.observe(box);
    watchChildren();
    arrivals.observe(box, { childList: true });
    measure();
    return () => {
      resizes.disconnect();
      arrivals.disconnect();
    };
  }, []);
  return [ref, overflows] as const;
}
