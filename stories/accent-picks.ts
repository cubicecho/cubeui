/**
 * The picks `hexToAccent` is tested on in a story, and the check both `Card/Accent Picks` and
 * `ColorDot` run: in light, dark and Monokai, each mark is 3:1 (WCAG 1.4.11) from that theme's page
 * and card, keeps the hue it was picked in, and is drawn as picked wherever the pick already shows
 * (#504).
 */
import { expect, waitFor } from "storybook/test";
import { tokenColor } from "./token-color";

/**
 * Light picks that show on a dark page as they are and not on a light one, and a navy that is the
 * other way round: the four the one band for every theme drew olive, teal, green and mid blue.
 */
export const PICKS = [
  ["Yellow", "#ffff00", "dark"],
  ["Cyan", "#00ffff", "dark"],
  ["Lime", "#00ff00", "dark"],
  ["Navy", "#000080", "light"],
] as const;

const CHANNEL_MAX = 255;
const HEX_RADIX = 16;
/** A hex step either way in a channel moves an 8-bit colour's hue by up to about this. */
const HUE_SLACK = 2;
const FULL_TURN = 360;
const SECTOR = 60;

/** A CSS colour as 8-bit sRGB, read back off a canvas so any notation the browser takes works. */
export function srgb(color: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("no 2D canvas to read a colour with");
  }
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** WCAG contrast between two CSS colours. */
export function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const [r, g, b] = srgb(color).map((c) => {
      const v = c / CHANNEL_MAX;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The hue of a CSS colour, 0–360. */
function hue(color: string) {
  const [r, g, b] = srgb(color);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) {
    return 0;
  }
  const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * SECTOR + FULL_TURN) % FULL_TURN;
}

const hex = (color: string) =>
  `#${srgb(color)
    .map((c) => c.toString(HEX_RADIX).padStart(2, "0"))
    .join("")}`;

const THEMES = [
  ["light", (html: HTMLElement) => html.classList.add("light")],
  ["dark", (html: HTMLElement) => html.classList.add("dark")],
  ["monokai", (html: HTMLElement) => html.setAttribute("data-palette", "monokai")],
] as const;

/**
 * Puts the page in each theme in turn, on `<html>` as `useThemePreference` does, and checks every
 * mark `marks(name)` finds for each pick; the page's own theme is put back after.
 */
export async function checkPicksInEachTheme(
  step: (label: string, play: () => Promise<void>) => Promise<void> | void,
  marks: (name: string) => Element[],
) {
  const html = document.documentElement;
  const had = {
    dark: html.classList.contains("dark"),
    light: html.classList.contains("light"),
    palette: html.getAttribute("data-palette"),
  };
  try {
    for (const [theme, apply] of THEMES) {
      html.classList.remove("dark", "light");
      html.removeAttribute("data-palette");
      apply(html);
      const shownAsPicked = theme === "light" ? "light" : "dark";
      await step(`${theme}: 3:1 from this page and card, in the hue picked`, async () => {
        // The marks read the theme again after `<html>` changes, a render later.
        await waitFor(() => {
          const page = tokenColor("background");
          const card = tokenColor("secondary");
          for (const [name, picked, showsIn] of PICKS) {
            for (const mark of marks(name)) {
              const drawn = getComputedStyle(mark).backgroundColor;
              expect(contrast(drawn, page)).toBeGreaterThanOrEqual(3);
              expect(contrast(drawn, card)).toBeGreaterThanOrEqual(3);
              const off = Math.abs(hue(drawn) - hue(picked));
              expect(Math.min(off, FULL_TURN - off)).toBeLessThanOrEqual(HUE_SLACK);
              // Where the pick already shows it is drawn as picked; elsewhere it has to move.
              if (showsIn === shownAsPicked) {
                expect(hex(drawn)).toBe(picked);
              } else {
                expect(hex(drawn)).not.toBe(picked);
              }
            }
          }
        });
      });
    }
  } finally {
    html.classList.remove("dark", "light");
    html.removeAttribute("data-palette");
    html.classList.toggle("dark", had.dark);
    html.classList.toggle("light", had.light);
    if (had.palette !== null) {
      html.setAttribute("data-palette", had.palette);
    }
  }
}
