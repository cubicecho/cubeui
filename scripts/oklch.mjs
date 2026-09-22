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

/** Drop trailing zeros so 0.97 prints as `0.97` and 1 prints as `1`. */
const num = (n) => String(Number(n.toFixed(6)));

/**
 * The `oklch(...)` form, matching how Tailwind and shadcn write it.
 * Alpha is a percentage, which is the form `cubeui/preview/index.css` uses.
 * @param {Oklch} t
 */
export function formatOklch(t) {
  const base = `${num(t.l)} ${num(t.c)} ${num(t.h)}`;
  return t.a === undefined ? `oklch(${base})` : `oklch(${base} / ${num(t.a * 100)}%)`;
}

/**
 * Linear-light sRGB channels in [0,1], before gamma and before clamping.
 * Kept separate so `isOutOfGamut` can see the unclamped values.
 * @param {Oklch} t
 */
function toLinearSrgb({ l: L, c: C, h: H }) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  // OKLab → LMS, then cube. The rows sum to 1, so an achromatic colour
  // (c = 0) maps to r = g = b = L³, which is the property the tests lean on.
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

/** The sRGB transfer function. */
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/**
 * True when the colour cannot be shown in sRGB and had to be clamped.
 * Worth knowing: a clamped colour is silently wrong on device, and the
 * palette is the one place that should be caught.
 * @param {Oklch} t
 */
export function isOutOfGamut(t) {
  return toLinearSrgb(t).some((c) => c < -1e-6 || c > 1 + 1e-6);
}

/** 8-bit sRGB channels. @param {Oklch} t */
export function toRgb(t) {
  return toLinearSrgb(t).map((c) =>
    Math.max(0, Math.min(255, Math.round(gamma(Math.max(0, Math.min(1, c))) * 255))),
  );
}

/**
 * What React Native can actually parse: `#rrggbb`, or `rgba()` when the token
 * carries alpha. RN's engine handles both; it handles no modern colour space.
 * @param {Oklch} t
 */
export function toNativeCss(t) {
  const [r, g, b] = toRgb(t);
  if (t.a !== undefined) return `rgba(${r}, ${g}, ${b}, ${num(t.a)})`;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
