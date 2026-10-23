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

/** The two surfaces anything is drawn on: the page, and a card or popover raised off it. */
const SURFACES = ["background", "secondary"];

/** The fills a filled button or badge draws, each with its `-foreground` text. */
const FILLS = ["neutral", "active", "positive", "warning", "info", "negative"];

/** The colours that are also drawn as text: a link, an error, an outline button's label, today. */
const INKS = ["active", "positive", "warning", "info", "negative"];

/**
 * Text on the surface it sits on — the pairs the components draw. A third entry is the opacity
 * the text is drawn at: secondary text is `text-foreground/60`, not a colour of its own.
 *
 * A surface is a token, or a stack of `[token, opacity]` layers from the bottom up, for a fill
 * drawn at an opacity over what is under it: a tint, a chosen row, a fill under the pointer.
 */
const PAIRS = [
  ["foreground", "background"],
  ["foreground", "secondary"],
  ["foreground", "background", 0.6],
  ["foreground", "secondary", 0.6],
  ["foreground", "hover", 0.6],
  ["foreground", "hover"],
  // A link in a row under the pointer.
  ["info", "hover"],
  ...FILLS.flatMap((fill) => [
    [`${fill}-foreground`, fill],
    // `hover:bg-neutral/90` and the rest: the fill under the pointer, and a focused one.
    ...SURFACES.map((surface) => [
      `${fill}-foreground`,
      [
        [surface, 1],
        [fill, 0.9],
      ],
    ]),
  ]),
  ...INKS.flatMap((ink) => SURFACES.map((surface) => [ink, surface])),
  // An outline button under the pointer, and a highlighted destructive menu row: the colour as
  // text on its own `/10` tint.
  ...["positive", "warning", "info", "negative"].flatMap((ink) =>
    SURFACES.map((surface) => [
      ink,
      [
        [surface, 1],
        [ink, 0.1],
      ],
    ]),
  ),
  // A chosen row's text, on `bg-active/40`. Its secondary text turns `foreground` when chosen,
  // because `/60` does not clear 4.5:1 there.
  ...SURFACES.map((surface) => [
    "foreground",
    [
      [surface, 1],
      ["active", 0.4],
    ],
  ]),
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
/** `top` at `alpha` over the sRGB `under`, blended as a compositor does. */
const blend = (under, top, alpha) => toRgb(top).map((c, i) => c * alpha + under[i] * (1 - alpha));

/** A surface's sRGB: a token, or a stack of `[token, opacity]` layers from the bottom up. */
const surfaceRgb = (map, surface) =>
  typeof surface === "string"
    ? toRgb(map[surface])
    : surface.reduce((under, [token, alpha]) => blend(under, map[token], alpha), [0, 0, 0]);

/** The name a surface goes by in a failure message and a `KNOWN` key. */
const surfaceName = (surface) =>
  typeof surface === "string"
    ? surface
    : surface.map(([token, alpha]) => (alpha === 1 ? token : `${token}@${alpha}`)).join("+");

/** The contrast of `text` at `alpha` over the sRGB `under`. */
const ratio = (text, under, alpha = 1) => {
  const over = blend(under, text, alpha);
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

/**
 * A control's edge — `border-foreground/50` on an input, a checkbox, a radio, a select, and the
 * unchecked switch's track — is what says a control is there, so it needs 3:1 against the surface
 * it sits on (WCAG 1.4.11).
 */
const EDGE_ALPHA = 0.5;
const EDGE_SURFACES = ["background", "secondary", "hover"];

for (const [set, map] of sets) {
  test(`${set}: a control's edge is 3:1 or better`, () => {
    const short = EDGE_SURFACES.flatMap((surface) => {
      const r = Math.round(ratio(map.foreground, toRgb(map[surface]), EDGE_ALPHA) * 100) / 100;
      return r < 3 ? [`edge on ${surface}: ${r.toFixed(2)}:1, needs 3`] : [];
    });
    assert.deepEqual(short, []);
  });
}

for (const [set, map] of sets) {
  test(`${set}: every text pair is 4.5:1 or better`, () => {
    const short = PAIRS.flatMap(([text, surface, alpha]) => {
      const name = surfaceName(surface);
      const key = `${set} ${text}${alpha ? `@${alpha}` : ""}/${name}`;
      const r = Math.round(ratio(map[text], surfaceRgb(map, surface), alpha) * 100) / 100;
      const floor = KNOWN[key] ?? 4.5;
      return r < floor ? [`${text} on ${name}: ${r.toFixed(2)}:1, needs ${floor}`] : [];
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
    assert.ok(ratio(map[text], toRgb(map[surface])) < 4.5, `${key} passes now; drop it from KNOWN`);
    assert.ok(floor < 4.5);
  }
});

/**
 * A chosen row (`bg-active/40`) and a row under the pointer (`bg-hover`) are different states, and
 * a hovered row should not read as chosen. Not a contrast floor WCAG sets, so the bar is the one
 * the default palette was tuned to: the two fills 1.3:1 apart on the surfaces a row sits on.
 */
const STATE_APART = 1.3;
for (const [set, map] of sets) {
  test(`${set}: a chosen row is apart from a hovered one`, () => {
    const close = SURFACES.flatMap((surface) => {
      const chosen = surfaceRgb(map, [
        [surface, 1],
        ["active", 0.4],
      ]);
      const hovered = toRgb(map.hover);
      const [hi, lo] = [luminance(chosen), luminance(hovered)].sort((x, y) => y - x);
      const r = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
      return r < STATE_APART ? [`on ${surface}: ${r.toFixed(2)}:1, needs ${STATE_APART}`] : [];
    });
    assert.deepEqual(close, []);
  });
}
