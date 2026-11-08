/**
 * Deriving usable colours from a colour someone picked.
 *
 * A user-chosen hex is arbitrary: it can be near-white, near-black, or fully
 * saturated, and any of those can vanish against a card or blow out next to
 * text. These keep the hue someone chose and constrain everything else.
 *
 * Separate from `lib/utils` because these are the only functions here that a
 * component might not want, and the registry installs whole files. The hex is
 * read by `lib/readable-text-color`'s parser, so `#f80` and `ff8800` are the
 * colours they spell here too.
 */

import { hexChannels } from "@/lib/readable-text-color";

/** The colour wheel is six sectors of sixty degrees, and each channel leads two of them. */
const HUE_SECTORS = 6;
const GREEN_SECTOR = 2;
const BLUE_SECTOR = 4;
const FULL_TURN = 360;
const PERCENT = 100;

/** The lightest and darkest an accent may be and still show on both a light and a dark card. */
const ACCENT_MIN_LIGHTNESS = 0.38;
const ACCENT_MAX_LIGHTNESS = 0.62;

/**
 * Hue (0–360), saturation and lightness (0–1) of a hex colour.
 *
 * @param hex - `#rgb` or `#rrggbb`, with or without the `#`; an alpha digit is dropped.
 * @returns The three, or `undefined` for anything that is not a hex colour.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | undefined {
  const rgb = hexChannels(hex);
  if (!rgb) {
    return undefined;
  }
  const [r, g, b] = rgb;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = ((g - b) / d + (g < b ? HUE_SECTORS : 0)) / HUE_SECTORS;
    } else if (max === g) {
      h = ((b - r) / d + GREEN_SECTOR) / HUE_SECTORS;
    } else {
      h = ((r - g) / d + BLUE_SECTOR) / HUE_SECTORS;
    }
  }

  return { h: Math.round(h * FULL_TURN), s, l };
}

/**
 * Keeps the hue but clamps lightness to a mid range, so a near-white or
 * near-black pick cannot disappear against either the light or the dark card.
 *
 * @param hex - `#rgb` or `#rrggbb`, with or without the `#`.
 * @returns An `hsl()` colour, or `undefined` for anything that is not a hex colour.
 */
export function hexToAccent(hex: string): string | undefined {
  const hsl = hexToHsl(hex);
  if (!hsl) {
    return undefined;
  }
  const clampedL = Math.min(ACCENT_MAX_LIGHTNESS, Math.max(ACCENT_MIN_LIGHTNESS, hsl.l));
  return `hsl(${hsl.h}, ${Math.round(hsl.s * PERCENT)}%, ${Math.round(clampedL * PERCENT)}%)`;
}
