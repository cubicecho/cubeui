/**
 * OKLCH → sRGB, and the two string formats the emitters need.
 *
 * A real conversion rather than a lookup table, so changing a value in
 * `tokens/palette.mjs` produces a correct hex without anyone hand-converting it.
 * Hand conversion is exactly how `min-agent/mobile` drifted from cubeui.
 *
 * The pipeline is the standard one: OKLCH → OKLab → LMS → linear sRGB → gamma.
 * Matrices are Björn Ottosson's.
 */

/** @typedef {{ l: number, c: number, h: number, a?: number }} Oklch */

const PRECISION = 6;
const PERCENT = 100;
const HALF_TURN_DEGREES = 180;
const CHANNEL_MAX = 255;
const HEX = 16;

/** How far outside [0,1] a linear channel may sit before it counts as out of gamut. */
const GAMUT_SLACK = 1e-6;

// The sRGB transfer function's constants, from IEC 61966-2-1.
const LINEAR_CUTOFF = 0.0031308;
const LINEAR_SLOPE = 12.92;
const GAMMA_SCALE = 1.055;
const GAMMA_OFFSET = 0.055;
const GAMMA = 2.4;

/** Drop trailing zeros so 0.97 prints as `0.97` and 1 prints as `1`. */
const num = (n) => String(Number(n.toFixed(PRECISION)));

/**
 * The `oklch(...)` form, matching how Tailwind and shadcn write it.
 * Alpha is a percentage, which is the form `cubeui/preview/index.css` uses.
 * @param {Oklch} t
 */
export function formatOklch(t) {
  const base = `${num(t.l)} ${num(t.c)} ${num(t.h)}`;
  return t.a === undefined ? `oklch(${base})` : `oklch(${base} / ${num(t.a * PERCENT)}%)`;
}

/**
 * Linear-light sRGB channels in [0,1], before gamma and before clamping.
 * Kept separate so `isOutOfGamut` can see the unclamped values.
 * @param {Oklch} t
 */
function toLinearSrgb({ l: L, c: C, h: H }) {
  const rad = (H * Math.PI) / HALF_TURN_DEGREES;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  // OKLab → LMS, then cube. The rows sum to 1, so an achromatic colour
  // (c = 0) maps to r = g = b = L³, which is the property the tests lean on.
  // biome-ignore-start lint/style/noMagicNumbers: Björn Ottosson's published matrix coefficients
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  // biome-ignore-end lint/style/noMagicNumbers: the matrix ends here
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  // biome-ignore-start lint/style/noMagicNumbers: Björn Ottosson's published matrix coefficients
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
  // biome-ignore-end lint/style/noMagicNumbers: the matrix ends here
}

/** The sRGB transfer function. */
const gamma = (c) =>
  c <= LINEAR_CUTOFF ? LINEAR_SLOPE * c : GAMMA_SCALE * c ** (1 / GAMMA) - GAMMA_OFFSET;

/**
 * True when the colour cannot be shown in sRGB and had to be clamped.
 * Worth knowing: a clamped colour is silently wrong on device, and the
 * palette is the one place that should be caught.
 * @param {Oklch} t
 */
export function isOutOfGamut(t) {
  return toLinearSrgb(t).some((c) => c < -GAMUT_SLACK || c > 1 + GAMUT_SLACK);
}

/** 8-bit sRGB channels. @param {Oklch} t */
export function toRgb(t) {
  return toLinearSrgb(t).map((c) =>
    Math.max(
      0,
      Math.min(CHANNEL_MAX, Math.round(gamma(Math.max(0, Math.min(1, c))) * CHANNEL_MAX)),
    ),
  );
}

/**
 * What React Native can actually parse: `#rrggbb`, or `rgba()` when the token
 * carries alpha. RN's engine handles both; it handles no modern colour space.
 * @param {Oklch} t
 */
export function toNativeCss(t) {
  const [r, g, b] = toRgb(t);
  if (t.a !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${num(t.a)})`;
  }
  return `#${[r, g, b].map((c) => c.toString(HEX).padStart(2, "0")).join("")}`;
}

// WCAG 2's relative luminance: the sRGB transfer undone, then the Rec. 709 channel weights.
const WCAG_CUTOFF = 0.04045;
const WCAG_FLARE = 0.05;
// biome-ignore lint/style/noMagicNumbers: the Rec. 709 luminance weights WCAG 2 defines
const REC709 = [0.2126, 0.7152, 0.0722];

/** Relative luminance of 8-bit sRGB channels. @param {number[]} rgb */
export function luminance(rgb) {
  return rgb
    .map((c) => {
      const v = c / CHANNEL_MAX;
      return v <= WCAG_CUTOFF ? v / LINEAR_SLOPE : ((v + GAMMA_OFFSET) / GAMMA_SCALE) ** GAMMA;
    })
    .reduce((sum, v, i) => sum + v * REC709[i], 0);
}

/** WCAG contrast ratio between two 8-bit sRGB colours, from 1 to 21. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + WCAG_FLARE) / (lo + WCAG_FLARE);
}

/*
 * Colour-vision deficiency, for telling chart colours apart. Machado, Oliveira and Fernandes
 * (2009) at full severity: each matrix maps linear sRGB to what a reader with that deficiency
 * sees. Distances are measured in OKLab, where 0.02 is about the smallest step anyone notices.
 */
// biome-ignore-start lint/style/noMagicNumbers: published matrices
const CVD = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const LINEAR_TO_LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const LMS_TO_OKLAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
// biome-ignore-end lint/style/noMagicNumbers: the matrices end here

const apply = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const unclamped = (c) => {
  const v = c / CHANNEL_MAX;
  return v <= WCAG_CUTOFF ? v / LINEAR_SLOPE : ((v + GAMMA_OFFSET) / GAMMA_SCALE) ** GAMMA;
};

/** The ways a colour is seen: with full colour vision, and with each of the three deficiencies. */
export const VISIONS = ["normal", ...Object.keys(CVD)];

/** 8-bit sRGB as OKLab, as a reader with `vision` sees it. */
export function seenAs(rgb, vision = "normal") {
  const linear = rgb.map(unclamped);
  const seen =
    vision === "normal"
      ? linear
      : apply(CVD[vision], linear).map((c) => Math.min(1, Math.max(0, c)));
  return apply(LMS_TO_OKLAB, apply(LINEAR_TO_LMS, seen).map(Math.cbrt));
}

/**
 * The closest two of a set of 8-bit sRGB colours come under any vision, as an OKLab distance, and
 * which pair and vision that is.
 */
export function closestPair(rgbs) {
  let closest = { distance: Number.POSITIVE_INFINITY, vision: "", pair: [0, 0] };
  for (const vision of VISIONS) {
    const seen = rgbs.map((rgb) => seenAs(rgb, vision));
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        const [a, b] = [seen[i], seen[j]];
        const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (distance < closest.distance) {
          closest = { distance, vision, pair: [i, j] };
        }
      }
    }
  }
  return closest;
}
