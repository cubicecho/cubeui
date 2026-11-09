/**
 * The page and card colours of the theme a node is drawn in, on device. `surface-colors.web.tsx`
 * is the web half.
 *
 * A picked colour is moved until it shows against the page and a card (`hexToAccent`), and how far
 * depends on the theme: a yellow shows on a dark page as it is and has to darken on a light one.
 * So `ColorBar` and `ColorDot` ask for the theme's two surfaces here.
 *
 * They are read as the stylesheet's own `--background` and `--secondary`, through NativeWind,
 * rather than from the palette the app chose: that is the colour `bg-background` and
 * `bg-secondary` resolve to where the node is. So it follows the device's appearance,
 * `PaletteProvider`, and a `VariableContextProvider` of the app's own, with or without
 * `@cubeui/theme-picker`.
 */
import { useUnstableNativeVariable } from "nativewind";
import { type RefObject, useMemo, useRef } from "react";

/**
 * NativeWind's hook, as the device runs it. react-native-css publishes its web half's types for
 * both, and that half takes no name and throws, so an Expo app's `tsc` would refuse the call
 * written against the device's signature.
 */
const useVariable = useUnstableNativeVariable as unknown as (name: string) => unknown;

/** The page and the card, as hex. */
export type SurfaceColors = { readonly page: string; readonly card: string };

/**
 * A ref to put on the node, and the page and card colours of the theme it is drawn in: `undefined`
 * where the stylesheet does not set them as colours. On device the variables are read from
 * context, so the ref is not read; it is there so one call serves both halves.
 */
export function useSurfaceColors<T = unknown>(): readonly [
  RefObject<T | null>,
  SurfaceColors | undefined,
] {
  const ref = useRef<T>(null);
  const page = useVariable("--background");
  const card = useVariable("--secondary");
  const surfaces = useMemo(
    () => (typeof page === "string" && typeof card === "string" ? { page, card } : undefined),
    [page, card],
  );
  return [ref, surfaces] as const;
}
