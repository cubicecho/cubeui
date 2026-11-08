/**
 * PROTOTYPE: the chart colours, `series-1` to `series-6`, fitted to each palette's page and card.
 *
 * A chart's colours have to say nothing, which is why they are not the status colours: a red line
 * reads as an error. They start from Okabe and Ito's set, designed to stay apart for readers with a
 * colour-vision deficiency, in its order (blue, orange, bluish green, reddish purple, sky blue,
 * vermillion; its yellow is left out, because no yellow reaches 3:1 on white). Each colour then
 * moves only as far as three rules need:
 *
 * - 3:1 against the page and a card (WCAG 1.4.11, for a mark someone has to see);
 * - its hue within 12° of where it started, its lightness within a band around Okabe-Ito's own,
 *   and at least 80% of its chroma, so blue stays blue and orange does not darken into brown;
 * - the closest two colours as far apart as they can be, under normal vision and the three
 *   deficiencies, measured in OKLab — and each as far from the palette's status colours, which
 *   are fixed points in that search, so no chart colour can be taken for a status.
 *
 * The last is found by a seeded random search, so the same palette always gives the same colours,
 * and a palette writes nothing for them.
 */
import {
  closestPair,
  contrastRatio,
  isOutOfGamut,
  seenAs,
  toRgb,
  VISIONS,
} from "../scripts/oklch.mjs";

/** @typedef {import("./palette.mjs").Oklch} Oklch */

/** Okabe-Ito's colours in OKLCH, in the order a chart takes them. */
export const OKABE_ITO = [
  { name: "blue", l: 0.532, c: 0.131, h: 244 },
  { name: "orange", l: 0.753, c: 0.158, h: 77 },
  { name: "bluish green", l: 0.62, c: 0.13, h: 165 },
  { name: "reddish purple", l: 0.679, c: 0.118, h: 346 },
  { name: "sky blue", l: 0.735, c: 0.117, h: 236 },
  { name: "vermillion", l: 0.621, c: 0.17, h: 48 },
];

const LIGHT_BAND_LOW = 0.35;
const LIGHT_BAND_HIGH = 0.68;
const DARK_BAND_LOW = 0.55;
const DARK_BAND_HIGH = 0.88;

/** The rules a series colour is held to; `token-weights.test.mjs` checks the first and last. */
export const SERIES = {
  /** WCAG 1.4.11: a mark against what it is drawn on. */
  contrast: 3,
  hueDrift: 12,
  /** The share of Okabe-Ito's chroma a colour keeps at the least. */
  keepChroma: 0.8,
  maxChroma: 0.2,
  /** How far a colour may darken from, or lighten past, Okabe-Ito's own lightness. */
  darken: 0.15,
  lighten: 0.15,
  /** Lightness a colour may take, by mode: the band where 3:1 on the page is reachable. */
  lightness: {
    light: /** @type {const} */ ([LIGHT_BAND_LOW, LIGHT_BAND_HIGH]),
    dark: /** @type {const} */ ([DARK_BAND_LOW, DARK_BAND_HIGH]),
  },
  /** The closest pair may come no nearer than this, in OKLab, under any vision. */
  apart: 0.06,
  /**
   * And no chart colour nearer than this to a status colour. Short of `apart`: with Okabe-Ito's
   * hues held within `hueDrift`, its sky blue and bluish green sit where `info` and `positive` are
   * under tritanopia, and 0.05 is what every palette reaches while the six keep 0.06 between them.
   */
  apartFromStatus: 0.05,
};

/** The colours a chart's own may not be mistaken for. */
export const STATUS_TOKENS = ["positive", "warning", "negative", "info"];

const SEED = 7;
const ITERATIONS = 20000;
/** The first draws move every colour; after that, about 40% of them per draw. */
const WARMUP = 2000;
const MOVE_SHARE = 0.4;
const STEP = { l: 0.1, c: 0.05, h: 8 };
const CHROMA_STEP = 0.98;
const HALF = 0.5;
const TURN = 360;
const HALF_TURN = 180;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function inGamut(t) {
  let c = t.c;
  while (isOutOfGamut({ ...t, c }) && c > 0) {
    c *= CHROMA_STEP;
  }
  return { ...t, c };
}

// The classic C library's linear congruential generator: plenty for a search, and the same
// sequence on every machine.
const LCG_MULTIPLIER = 1103515245;
const LCG_INCREMENT = 12345;
const LCG_MODULUS = 2147483648; // 2³¹

/** A deterministic random number in [0, 1): the same seed, the same colours. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
    return state / LCG_MODULUS;
  };
}

const drift = (h, from) => Math.abs(((h - from + TURN + HALF_TURN) % TURN) - HALF_TURN);

const cache = new Map();

/** The nearest any of `rgbs` comes to any of `fixed`, under any vision, as an OKLab distance. */
export function closestToFixed(rgbs, fixed) {
  let closest = Number.POSITIVE_INFINITY;
  for (const vision of VISIONS) {
    const seen = fixed.map((rgb) => seenAs(rgb, vision));
    for (const rgb of rgbs) {
      const [l, a, b] = seenAs(rgb, vision);
      for (const [fl, fa, fb] of seen) {
        closest = Math.min(closest, Math.hypot(l - fl, a - fa, b - fb));
      }
    }
  }
  return closest;
}

/**
 * Six chart colours for a page and a card, kept apart from each other and from `fixed`.
 *
 * @param {Oklch} page
 * @param {Oklch} card
 * @param {boolean} dark Whether the page is the dark end, which picks the lightness band.
 * @param {Oklch[]} [fixed] The palette's status colours: the search keeps away from them as it
 *   keeps the six apart, and never moves them.
 * @returns {Oklch[]}
 */
export function fitSeries(page, card, dark, fixed = []) {
  const key = JSON.stringify([page, card, dark, fixed]);
  const fixedRgb = fixed.map(toRgb);
  const known = cache.get(key);
  if (known) {
    return known;
  }

  const [modeLo, modeHi] = SERIES.lightness[dark ? "dark" : "light"];
  const bands = OKABE_ITO.map(({ l }) => [
    Math.max(modeLo, l - SERIES.darken),
    Math.min(modeHi, l + SERIES.lighten),
  ]);
  const under = [page, card].map(toRgb);
  const legal = (c, i) =>
    c.c >= (OKABE_ITO[i]?.c ?? 0) * SERIES.keepChroma &&
    drift(c.h, OKABE_ITO[i]?.h ?? 0) <= SERIES.hueDrift &&
    under.every((u) => contrastRatio(toRgb(c), u) >= SERIES.contrast);
  const realise = (params) => params.map(([l, c, h]) => inGamut({ l, c, h }));

  const random = seeded(SEED);
  let best = OKABE_ITO.map(({ c, h }, n) => {
    const [lo, hi] = bands[n] ?? [modeLo, modeHi];
    return [(lo + hi) / 2, c, h];
  });
  let bestDistance = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < ITERATIONS; i++) {
    const candidate = best.map(([l, c, h], n) =>
      i < WARMUP || random() < MOVE_SHARE
        ? [
            clamp(l + (random() - HALF) * STEP.l, ...(bands[n] ?? [modeLo, modeHi])),
            clamp(
              c + (random() - HALF) * STEP.c,
              (OKABE_ITO[n]?.c ?? 0) * SERIES.keepChroma,
              SERIES.maxChroma,
            ),
            (h + (random() - HALF) * STEP.h + TURN) % TURN,
          ]
        : [l, c, h],
    );
    const colours = realise(candidate);
    if (colours.every(legal) === false) {
      continue;
    }
    const rgbs = colours.map(toRgb);
    // Each distance as a share of its floor, so neither is bought with the other.
    const distance = Math.min(
      closestPair(rgbs).distance / SERIES.apart,
      closestToFixed(rgbs, fixedRgb) / SERIES.apartFromStatus,
    );
    if (distance > bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  const result = realise(best);
  cache.set(key, result);
  return result;
}
