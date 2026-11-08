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

describe("hexToAccent", () => {
  // Every spelling `ColorPicker` can hand `Card accentColor`. `#f80` drew no stripe at all
  // (`hsl(NaN, NaN%, NaN%)`), and `ff8800` came out a degree off, read from the wrong offsets.
  it.each(["#f80", "f80", "#ff8800", "ff8800"])("reads %s as orange", (hex) => {
    expect(hexToAccent(hex)).toBe(hexToAccent("#ff8800"));
    expect(hexToHsl(hexToAccent(hex) as string)?.h).toBe(32);
  });

  // The stripe is a mark someone has to see, so 3:1 (WCAG 1.4.11) from what is either side of it:
  // the card it is drawn on and the page beyond the card's edge, in every theme at once, since the
  // stripe does not know which is on.
  for (const [theme, colours] of THEMES) {
    it.each(PICKS)(`keeps %s 3:1 from the page and a card in ${theme}`, (_, hex) => {
      const accent = hexToAccent(hex) as string;
      expect(contrast(accent, colours.background)).toBeGreaterThanOrEqual(3);
      expect(contrast(accent, colours.secondary)).toBeGreaterThanOrEqual(3);
    });
  }

  it.each(PICKS.filter(([name]) => name !== "white" && name !== "black"))(
    "keeps the hue of %s",
    (_, hex) => {
      const before = hexToHsl(hex)?.h as number;
      const after = hexToHsl(hexToAccent(hex) as string)?.h as number;
      expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
    },
  );

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
