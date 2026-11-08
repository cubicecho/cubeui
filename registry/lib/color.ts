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

import { hexChannels, luminance } from "@/lib/readable-text-color";

/** The colour wheel is six sectors of sixty degrees, and each channel leads two of them. */
const HUE_SECTORS = 6;
const GREEN_SECTOR = 2;
const BLUE_SECTOR = 4;
const FULL_TURN = 360;

/**
 * The darkest and lightest an accent may be, as WCAG relative luminance: the band that is 3:1
 * (WCAG 1.4.11, a mark someone has to see) from the page and from a card in every palette
 * `@cubeui/tokens` ships, so a stripe shows in whichever theme is on without knowing which. The
 * light card (0.91) caps the band at 0.27 and Monokai's card (0.028) floors it at 0.18; these sit
 * inside that, with room for rounding to a hex. `color.test.ts` holds them to every palette.
 *
 * It was HSL lightness 0.38–0.62, which is not how light a colour looks: a yellow at 0.5 was
 * 1.07:1 on the light page and a navy 1.68:1 on the dark one (#471).
 */
const ACCENT_MIN_LUMINANCE = 0.19;
const ACCENT_MAX_LUMINANCE = 0.26;
/** Halvings of the lightness search: far finer than a hex can say. */
const SEARCH_STEPS = 24;
const HALF = 0.5;
const CHANNEL_MAX = 255;
const HEX_RADIX = 16;
const HEX_DIGITS = 2;

/** Red, green and blue in each sixty-degree sector of the wheel, from the chroma and the second. */
const SECTORS: readonly ((c: number, x: number) => [number, number, number])[] = [
  (c, x) => [c, x, 0],
  (c, x) => [x, c, 0],
  (c, x) => [0, c, x],
  (c, x) => [0, x, c],
  (c, x) => [x, 0, c],
  (c, x) => [c, 0, x],
];

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

/** Red, green and blue as 0–1 from hue (0–360), saturation and lightness (0–1). */
function hslChannels(h: number, s: number, l: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const sector = (h / (FULL_TURN / HUE_SECTORS)) % HUE_SECTORS;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const base = l - chroma * HALF;
  const [r, g, b] = SECTORS[Math.floor(sector)]?.(chroma, second) ?? [0, 0, 0];
  return [r + base, g + base, b + base];
}

function toHex(channels: [number, number, number]): string {
  return `#${channels
    .map((c) =>
      Math.round(c * CHANNEL_MAX)
        .toString(HEX_RADIX)
        .padStart(HEX_DIGITS, "0"),
    )
    .join("")}`;
}

/**
 * Keeps the hue and saturation of a pick but moves its lightness into the band that shows on the
 * page and on a card in every theme, so a near-white, a near-black, a yellow or a navy cannot
 * disappear against either. A pick already in the band is returned as it is.
 *
 * @param hex - `#rgb` or `#rrggbb`, with or without the `#`.
 * @returns A `#rrggbb` colour, or `undefined` for anything that is not a hex colour.
 */
export function hexToAccent(hex: string): string | undefined {
  const rgb = hexChannels(hex);
  const hsl = hexToHsl(hex);
  if (!rgb || !hsl) {
    return undefined;
  }
  const at = (l: number) => luminance(hslChannels(hsl.h, hsl.s, l));
  const now = luminance(rgb);
  if (now >= ACCENT_MIN_LUMINANCE && now <= ACCENT_MAX_LUMINANCE) {
    return toHex(rgb);
  }
  // Luminance rises with HSL lightness at a fixed hue and saturation, so the band's edge is found
  // by halving: lighter up to its floor, or darker down to its ceiling.
  const tooDark = now < ACCENT_MIN_LUMINANCE;
  let low = tooDark ? hsl.l : 0;
  let high = tooDark ? 1 : hsl.l;
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const mid = (low + high) * HALF;
    const lit = at(mid);
    if (tooDark ? lit >= ACCENT_MIN_LUMINANCE : lit > ACCENT_MAX_LUMINANCE) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return toHex(hslChannels(hsl.h, hsl.s, tooDark ? high : low));
}
