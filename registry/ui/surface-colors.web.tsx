/**
 * The page and card colours of the theme a node is drawn in, on the web: an Expo app's web build,
 * where Metro picks this file over `surface-colors.tsx`, and a DOM app, where it is the whole item.
 *
 * They are the `--background` and `--secondary` the node itself resolves, read off its computed
 * style, rather than the palette `useThemePreference` stored. An app may theme without cubeui's
 * hooks — a `.dark` class of its own, a stylesheet under `prefers-color-scheme`, a panel themed
 * apart from the page — and the node's own variables are the colours `bg-background` and
 * `bg-secondary` paint there in every one of those cases. The stored choice knows none of them,
 * and knows nothing of an app's own values for the tokens.
 *
 * A variable can be written in any CSS colour (`oklch()` in `@cubeui/tokens`), so each is drawn on
 * a one-pixel canvas and read back as sRGB hex. They are read again when `<html>` changes its
 * class, style or theme attribute, and when the device turns dark or light.
 */
import { type RefObject, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

/** The page and the card, as hex. */
export type SurfaceColors = { readonly page: string; readonly card: string };

const PAGE = "--background";
const CARD = "--secondary";
const DARK_QUERY = "(prefers-color-scheme: dark)";
/** What a theme switch changes on `<html>`: a class, the palette, or variables set inline. */
const THEME_ATTRIBUTES = ["class", "style", "data-palette", "data-theme"];
const OPAQUE = 255;
const HEX_RADIX = 16;
const HEX_DIGITS = 2;

/** Counts theme changes, so every hook on the page reads again after one. */
let changes = 0;
const listeners = new Set<() => void>();
/** One observer for the page, made by the first hook and dropped with the last. */
let stopWatching: (() => void) | null = null;

function watch(): () => void {
  const changed = () => {
    changes++;
    for (const listener of listeners) {
      listener();
    }
  };
  const observer = new MutationObserver(changed);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  });
  const query = typeof window.matchMedia === "function" ? window.matchMedia(DARK_QUERY) : null;
  query?.addEventListener("change", changed);
  return () => {
    observer.disconnect();
    query?.removeEventListener("change", changed);
  };
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  stopWatching ??= watch();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      stopWatching?.();
      stopWatching = null;
    }
  };
}

const snapshot = () => changes;
const serverSnapshot = () => 0;

let pixel: CanvasRenderingContext2D | null | undefined;

/**
 * Colours laid one over the next on white, as sRGB hex: a translucent card is seen over the page.
 * `undefined` where there is no canvas, or a layer is not a colour.
 */
function flatten(layers: string[]): string | undefined {
  if (layers.some((layer) => layer === "" || CSS.supports("color", layer) === false)) {
    return undefined;
  }
  pixel ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!pixel) {
    return undefined;
  }
  pixel.globalAlpha = 1;
  for (const layer of ["#ffffff", ...layers]) {
    pixel.fillStyle = layer;
    pixel.fillRect(0, 0, 1, 1);
  }
  const [r = 0, g = 0, b = 0, a = 0] = pixel.getImageData(0, 0, 1, 1).data;
  if (a !== OPAQUE) {
    return undefined;
  }
  return `#${[r, g, b].map((c) => c.toString(HEX_RADIX).padStart(HEX_DIGITS, "0")).join("")}`;
}

function read(node: Element): SurfaceColors | undefined {
  const style = getComputedStyle(node);
  const page = style.getPropertyValue(PAGE).trim();
  const card = style.getPropertyValue(CARD).trim();
  const pageHex = flatten([page]);
  const cardHex = flatten([page, card]);
  return pageHex && cardHex ? { page: pageHex, card: cardHex } : undefined;
}

/**
 * A ref to put on the node, and the page and card colours of the theme it is drawn in: `undefined`
 * until the node has been read, just after mount and before paint, and where its stylesheet does
 * not set them.
 */
export function useSurfaceColors<T extends Element = HTMLElement>(): readonly [
  RefObject<T | null>,
  SurfaceColors | undefined,
] {
  const ref = useRef<T>(null);
  const change = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [surfaces, setSurfaces] = useState<SurfaceColors>();
  /** The node and the theme change last read, so a render that changes neither reads nothing. */
  const last = useRef<{ node: T | null; change: number }>({ node: null, change: -1 });
  // Before paint, so a stripe is not drawn once in the colour for no theme in particular. On every
  // render rather than on `change` alone: the node can arrive later than the hook, as a
  // `ColorBar` does when it is first given a colour.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || (node === last.current.node && change === last.current.change)) {
      return;
    }
    last.current = { node, change };
    const next = read(node);
    setSurfaces((now) => (now?.page === next?.page && now?.card === next?.card ? now : next));
  });
  return [ref, surfaces] as const;
}
