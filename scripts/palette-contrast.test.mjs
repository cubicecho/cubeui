/**
 * Every text colour clears WCAG AA, 4.5:1, on the surface it is drawn on — in every palette.
 *
 * A palette is a set of tokens someone picked by eye from an editor theme, and the colours that
 * look like the theme are not always the ones that can be read: Monokai's own comment grey is
 * 3.3:1 on its background. So the pairs a component actually draws are measured here, from the
 * sRGB each token becomes on device, rather than trusted.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { dark, light, palettes } from "../tokens/palette.mjs";
import { toRgb } from "./oklch.mjs";

/**
 * Text on the surface it sits on — the pairs the components draw. A third entry is the opacity
 * the text is drawn at: secondary text is `text-foreground/60`, not a colour of its own.
 */
const PAIRS = [
  ["foreground", "background"],
  ["foreground", "secondary"],
  ["foreground", "background", 0.6],
  ["foreground", "secondary", 0.6],
  ["foreground", "hover", 0.6],
  ["neutral-foreground", "neutral"],
  ["foreground", "hover"],
  ["active-foreground", "active"],
  ["positive-foreground", "positive"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  ["negative-foreground", "negative"],
  ["negative", "background"],
  ["negative", "secondary"],
  ["info", "background"],
  ["info", "secondary"],
];

/**
 * Pairs below 4.5:1 that are kept, each at the ratio it has now, so this can hold them where they
 * are without letting them slip further.
 */
const KNOWN = {};

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (rgb) => {
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** The contrast of `text` at `alpha` over `surface`, blended in sRGB as a compositor does. */
const ratio = (text, surface, alpha = 1) => {
  const under = toRgb(surface);
  const over = toRgb(text).map((c, i) => c * alpha + under[i] * (1 - alpha));
  const [hi, lo] = [luminance(over), luminance(under)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const sets = [
  ["default light", light],
  ["default dark", dark],
  ...Object.entries(palettes).flatMap(([name, modes]) =>
    Object.entries(modes).map(([mode, map]) => [`${name} ${mode}`, map]),
  ),
];

for (const [set, map] of sets) {
  test(`${set}: every text pair is 4.5:1 or better`, () => {
    const short = PAIRS.flatMap(([text, surface, alpha]) => {
      const key = `${set} ${text}${alpha ? `@${alpha}` : ""}/${surface}`;
      const r = Math.round(ratio(map[text], map[surface], alpha) * 100) / 100;
      const floor = KNOWN[key] ?? 4.5;
      return r < floor ? [`${text} on ${surface}: ${r.toFixed(2)}:1, needs ${floor}`] : [];
    });
    assert.deepEqual(short, []);
  });
}

test("the known exceptions are still exceptions", () => {
  // One that has been fixed should leave the list, or it would excuse a later regression.
  for (const [key, floor] of Object.entries(KNOWN)) {
    const [name, mode, pair] = key.split(" ");
    const [text, surface] = pair.split("/");
    const map = name === "default" ? { light, dark }[mode] : palettes[name][mode];
    assert.ok(ratio(map[text], map[surface]) < 4.5, `${key} passes now; drop it from KNOWN`);
    assert.ok(floor < 4.5);
  }
});
