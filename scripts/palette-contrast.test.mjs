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

/** Text on the surface it sits on — the pairs the components draw. */
const PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
];

/**
 * Pairs below 4.5:1 that are shadcn's own and kept, each at the ratio it has now, so this can
 * hold them where they are without letting them slip further. Light `muted-foreground` on `muted`
 * is the tab list's inactive label; lifting it changes shadcn's light look everywhere.
 */
const KNOWN = { "default light muted-foreground/muted": 4.35 };

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (t) => {
  const [r, g, b] = toRgb(t).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
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
    const short = PAIRS.flatMap(([text, surface]) => {
      const key = `${set} ${text}/${surface}`;
      const r = Math.round(ratio(map[text], map[surface]) * 100) / 100;
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
