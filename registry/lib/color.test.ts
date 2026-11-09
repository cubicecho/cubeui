import { describe, expect, it } from "vitest";
import { dark, light, palettes } from "../../dist/cubeui-theme";
import { hexToAccent, hexToHsl } from "./color";
import { hexChannels, luminance } from "./readable-text-color";

/** WCAG contrast between two hex colours. */
function contrast(a: string, b: string): number {
  const [x, y] = [a, b].map((hex) => {
    const rgb = hexChannels(hex);
    if (!rgb) {
      throw new Error(`${hex} is not a hex colour`);
    }
    return luminance(rgb);
  }) as [number, number];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Every theme the tokens ship, by name, in the hex the device draws. */
const THEMES: [string, { background: string; secondary: string }][] = [
  ["light", light],
  ["dark", dark],
  ...Object.entries(palettes).flatMap(([name, modes]) =>
    Object.entries(modes).map(
      ([mode, colours]) => [`${name} ${mode}`, colours] as [string, typeof colours],
    ),
  ),
];

/**
 * Picks that vanished under the old lightness clamp (#471) — yellow 1.07:1 and cyan 1.25:1 on the
 * light page, navy 1.68:1 on the dark one — and the rest of the wheel's corners beside them.
 */
const PICKS: [string, string][] = [
  ["yellow", "#ffff00"],
  ["cyan", "#00ffff"],
  ["lime", "#00ff00"],
  ["navy", "#000080"],
  ["white", "#ffffff"],
  ["black", "#000000"],
  ["red", "#ff0000"],
  ["blue", "#0000ff"],
  ["magenta", "#ff00ff"],
  ["orange", "#ff8800"],
];

/** The picks with a hue to keep: white and black have none. */
const CHROMATIC = PICKS.filter(([name]) => name !== "white" && name !== "black");

/** 3:1 and a hex step over it: as close to the floor as a colour a hex can spell gets. */
const JUST_OVER = 3.2;

describe("hexToAccent", () => {
  // Every spelling `ColorPicker` can hand `Card accentColor`. `#f80` drew no stripe at all
  // (`hsl(NaN, NaN%, NaN%)`), and `ff8800` came out a degree off, read from the wrong offsets.
  it.each(["#f80", "f80", "#ff8800", "ff8800"])("reads %s as orange", (hex) => {
    expect(hexToAccent(hex)).toBe(hexToAccent("#ff8800"));
    expect(hexToHsl(hexToAccent(hex) as string)?.h).toBe(32);
  });

  // The stripe is a mark someone has to see, so 3:1 (WCAG 1.4.11) from what is either side of it:
  // the card it is drawn on and the page beyond the card's edge. Told the theme, it holds that
  // theme (#504); not told, it holds every theme at once.
  for (const [theme, colours] of THEMES) {
    const surfaces = { page: colours.background, card: colours.secondary };
    const nearest = (hex: string) =>
      Math.min(contrast(hex, colours.background), contrast(hex, colours.secondary));

    it.each(PICKS)(`keeps %s 3:1 from ${theme}'s page and card, told the theme`, (_, hex) => {
      expect(nearest(hexToAccent(hex, surfaces) as string)).toBeGreaterThanOrEqual(3);
    });

    it.each(PICKS)(`keeps %s 3:1 from the page and a card in ${theme}, not told`, (_, hex) => {
      expect(nearest(hexToAccent(hex) as string)).toBeGreaterThanOrEqual(3);
    });

    it.each(CHROMATIC)(`keeps the hue of %s in ${theme}`, (_, hex) => {
      const before = hexToHsl(hex)?.h as number;
      const after = hexToHsl(hexToAccent(hex, surfaces) as string)?.h as number;
      expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
    });

    // A pick that shows is drawn as it is, and one that does not is moved only to the edge of
    // showing: within a hex step of 3:1 from whichever surface held it back.
    it.each(PICKS)(`moves %s no further than ${theme} needs`, (_, hex) => {
      const accent = hexToAccent(hex, surfaces) as string;
      if (nearest(hex) >= 3) {
        expect(accent).toBe(hex);
      } else {
        expect(nearest(accent)).toBeLessThan(JUST_OVER);
      }
    });
  }

  // What the preview showed: a light pick keeps its colour on a dark page, and a dark one on a
  // light page, where the one band for every theme drew them olive and mid blue.
  it.each(["#ffff00", "#00ffff", "#00ff00"])("draws %s as it is in dark", (hex) => {
    expect(hexToAccent(hex, { page: dark.background, card: dark.secondary })).toBe(hex);
    expect(hexToAccent(hex)).not.toBe(hex);
  });

  it("draws a navy as it is in light", () => {
    const surfaces = { page: light.background, card: light.secondary };
    expect(hexToAccent("#000080", surfaces)).toBe("#000080");
    expect(hexToAccent("#000080")).not.toBe("#000080");
  });

  it("falls back to the band for every theme when a surface is not a hex", () => {
    expect(hexToAccent("#ffff00", { page: "oklch(0.1 0 0)", card: dark.secondary })).toBe(
      hexToAccent("#ffff00"),
    );
  });

  it.each(CHROMATIC)("keeps the hue of %s, not told the theme", (_, hex) => {
    const before = hexToHsl(hex)?.h as number;
    const after = hexToHsl(hexToAccent(hex) as string)?.h as number;
    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  });

  it("keeps a grey a grey", () => {
    const [r, g, b] = hexChannels(hexToAccent("#fefefe") as string) as [number, number, number];
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("returns a pick that already shows everywhere as it is", () => {
    expect(hexToAccent("#3d8aad")).toBe("#3d8aad");
  });

  it("is undefined for what is not a hex colour, rather than an hsl() of NaN", () => {
    expect(hexToAccent("orange")).toBeUndefined();
    expect(hexToAccent("#ff880")).toBeUndefined();
  });
});

describe("hexToHsl", () => {
  it("reads a short hex as each digit doubled", () => {
    expect(hexToHsl("#0f0")).toEqual(hexToHsl("#00ff00"));
    expect(hexToHsl("00f")).toEqual({ h: 240, s: 1, l: 0.5 });
  });
});
