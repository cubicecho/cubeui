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
