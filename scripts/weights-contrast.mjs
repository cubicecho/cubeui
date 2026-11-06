/**
 * PROTOTYPE: the contrast checks for the named-weight tokens, shared by `token-weights.test.mjs`
 * (which fails on them) and the build's `token-weights.ts`, which the story shows. Measured as
 * `palette-contrast.test.mjs` measures today's tokens: WCAG contrast of the sRGB each token
 * becomes, with a translucent token blended over what is under it.
 */
import { dark, palettes } from "../tokens/palette.mjs";
import { SERIES } from "../tokens/series.mjs";
import { derive, FILLS, SURFACE_STEP } from "../tokens/weights.mjs";
import { closestPair, contrastRatio as contrast, toRgb } from "./oklch.mjs";

export { contrast };

// The floors: WCAG AA for text (1.4.3), and for a control's edge (1.4.11).
const TEXT = 4.5;
const EDGE = 3;
/** A chosen row apart from a hovered one: the bar the default palette was tuned to. */
const STATE_APART = 1.3;
/** `hover:bg-<fill>/90`, the step `-heavy` replaces. */
const NINETY = 0.9;
const HUNDREDTHS = 100;
/** A nested card lighter than a card: the other side of the dark-mode choice. */
const LIGHTER_STEP = 0.03;

/** A colour as drawn: a stack of token names from the bottom up, each at its own alpha. */
export const drawn = (map, ...stack) =>
  stack.reduce(
    (under, name) => {
      const t = map[name];
      const a = t.a ?? 1;
      return toRgb(t).map((c, i) => c * a + under[i] * (1 - a));
    },
    [0, 0, 0],
  );

const round = (n) => Math.round(n * HUNDREDTHS) / HUNDREDTHS;

const SURFACES = ["surface-1", "surface-2", "surface-3", "surface-floating"];
const IN_PAGE = ["surface-1", "surface-2", "surface-3"];
const INKS = ["active", "positive", "warning", "info", "negative"];
const TINTED = ["positive", "warning", "info", "negative"];

/** `[label, text stack, surface stack, floor]`: the pairs the components draw. */
const PAIRS = [
  ...SURFACES.flatMap((s) => [
    ["body text", ["default"], [s], TEXT],
    ["secondary text", ["default-medium"], [s], TEXT],
    ["control edge", ["default-medium"], [s], EDGE],
    ["chosen row text", ["default"], [s, "active-light"], TEXT],
  ]),
  ["text under the pointer", ["default"], ["hover"], TEXT],
  ["secondary text under the pointer", ["default-medium"], ["hover"], TEXT],
  ...FILLS.flatMap((f) => [
    [`label on ${f}`, [`on-${f}`], [f], TEXT],
    [`label on ${f}-heavy`, [`on-${f}`], [`${f}-heavy`], TEXT],
  ]),
  ...INKS.flatMap((ink) => IN_PAGE.map((s) => [`${ink} text`, [ink], [s], TEXT])),
  // An alert, an outline button under the pointer, a highlighted destructive menu row. `active` has
  // no tint drawn with its own text, so it is not here.
  ...TINTED.flatMap((ink) =>
    IN_PAGE.map((s) => [`${ink} text on its tint`, [ink], [s, `${ink}-lightest`], TEXT]),
  ),
];

/** Every pair for one mode of one palette, measured. */
export const pairs = (map) =>
  PAIRS.map(([label, text, surface, floor]) => ({
    label,
    on: surface.join(" + "),
    ratio: round(contrast(drawn(map, ...surface, ...text), drawn(map, ...surface))),
    floor,
  }));

/**
 * State and step checks, which WCAG does not set: a chosen row 1.3:1 from a hovered one (the bar
 * the default palette was tuned to), and each `-heavy` at least as far from its rest as today's
 * `/90` was.
 */
export const states = (map) => {
  const page = drawn(map, "surface-1");
  return [
    ...IN_PAGE.map((s) => ({
      label: "chosen row apart from hovered",
      on: s,
      ratio: round(contrast(drawn(map, s, "active-light"), drawn(map, "hover"))),
      floor: STATE_APART,
    })),
    ...FILLS.map((f) => {
      const rest = drawn(map, "surface-1", f);
      const ninety = toRgb(map[f]).map((c, i) => c * NINETY + page[i] * (1 - NINETY));
      return {
        label: `${f}-heavy apart from ${f}`,
        on: "surface-1",
        ratio: round(contrast(drawn(map, "surface-1", `${f}-heavy`), rest)),
        floor: round(contrast(ninety, rest)),
      };
    }),
  ];
};

const SERIES_COUNT = 6;
const SERIES_NAMES = Array.from({ length: SERIES_COUNT }, (_, i) => `series-${i + 1}`);
const THOUSANDTHS = 1000;

/**
 * A chart's colours: each 3:1 against the page and a card it is drawn on, and the closest two far
 * enough apart, in OKLab, to tell from each other with normal vision and each colour-vision
 * deficiency.
 */
export const series = (map) => {
  const closest = closestPair(SERIES_NAMES.map((n) => toRgb(map[n])));
  const [a, b] = closest.pair.map((i) => SERIES_NAMES[i]);
  return [
    ...SERIES_NAMES.flatMap((n) =>
      ["surface-1", "surface-2"].map((s) => ({
        label: `${n} mark`,
        on: s,
        ratio: round(contrast(drawn(map, n), drawn(map, s))),
        floor: SERIES.contrast,
      })),
    ),
    {
      label: `closest series pair, ${a} and ${b} (OKLab distance)`,
      on: closest.vision,
      ratio: Math.round(closest.distance * THOUSANDTHS) / THOUSANDTHS,
      floor: SERIES.apart,
    },
  ];
};

/**
 * The dark-mode choice, measured both ways: a nested card one step lighter than a card, or sunk
 * toward the page (the rule as it stands). For each, how far it sits from a card, the worst status
 * text on its own tint drawn on it, and whether it went darker than the page.
 */
export const nestedCardChoice = () =>
  [
    ["Default dark", dark],
    ["Monokai dark", palettes.monokai.dark],
  ].flatMap(([palette, base]) =>
    [LIGHTER_STEP, SURFACE_STEP.dark].map((step) => {
      const map = derive(base, {}, { surfaceStep: step });
      const worst = Math.min(
        ...TINTED.map((ink) =>
          contrast(
            drawn(map, "surface-3", `${ink}-lightest`, ink),
            drawn(map, "surface-3", `${ink}-lightest`),
          ),
        ),
      );
      return {
        palette,
        step,
        card: map["surface-2"],
        nested: map["surface-3"],
        apart: round(contrast(drawn(map, "surface-3"), drawn(map, "surface-2"))),
        worst: round(worst),
        floor: TEXT,
        belowPage: map["surface-3"].l < map["surface-1"].l,
      };
    }),
  );
