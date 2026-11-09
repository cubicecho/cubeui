/**
 * PROTOTYPE: the named-weight tokens, derived from today's palettes.
 *
 * A palette still writes the same 17 colours (`tokens/palette.mjs`). This file turns each one into
 * the new names and generates the rest, so every value here is a literal colour — nothing is mixed
 * at runtime, which is what React Native cannot do (react-native-css's `colorMix` returns
 * `undefined` for Tailwind's `/NN` classes, and the colour falls back to black).
 *
 * - A meaning colour (`default`, `neutral`, the four statuses, `active`) gets four weights, named
 *   for how heavy the stroke is: `-lightest`, `-light` and `-medium` are the colour at an alpha, so
 *   they still blend over whatever surface is under them; `-heavy` is a stronger colour, computed
 *   in OKLCH.
 * - `on-<colour>` is the text and icon colour on that colour's solid fill. `on-default` is the page
 *   colour, for the fills that swap the page's colours round: a tooltip, a count badge.
 * - `surface-1` to `surface-3` are the page and two levels of nesting; `surface-floating` is
 *   whatever sits above the page.
 * - `hover` stays an opaque colour of its own, and `overlay` carries the dialog backdrop's alpha.
 * - `series-1` to `series-6` are a chart's colours, which say nothing (`tokens/series.mjs`).
 */
import { contrastRatio, isOutOfGamut, toRgb } from "../scripts/oklch.mjs";
import { dark, light, palettes } from "./palette.mjs";
import { fitSeries, STATUS_TOKENS } from "./series.mjs";

/** @typedef {import("./palette.mjs").Oklch} Oklch */

/** The alpha each light weight lays its colour down at. */
export const WEIGHTS = { lightest: 0.1, light: 0.4, medium: 0.6 };

/** The colours that carry meaning, each with its source token in today's palette. */
export const MEANINGS = {
  default: "foreground",
  neutral: "neutral",
  positive: "positive",
  warning: "warning",
  negative: "negative",
  info: "info",
  active: "active",
};

/** The meaning colours drawn as a solid fill, each with an `on-` colour for what sits on it. */
export const FILLS = ["default", "neutral", "positive", "warning", "negative", "info", "active"];

/**
 * `-heavy`: the nearest colour `apart`:1 from its rest, found by moving lightness away from the page
 * (darker on a light page, lighter on a dark one) with chroma raised. A colour with no room that
 * way — near-black `neutral` on a white page cannot get visibly darker — moves toward the page
 * instead, which is what `hover:bg-neutral/90` did. 1.3:1 is the most today's `/90` reached.
 *
 * A grey takes `greyApart` instead. A coloured fill gets heavier in chroma as well as lightness, so
 * 1.3:1 reads as a clear step; a grey has no chroma to raise, and at 1.3:1 near-black `neutral`
 * moved only from `#171717` to `#2e2e2e`, too close to tell under the pointer.
 */
export const HEAVY = { apart: 1.3, greyApart: 1.6, chroma: 1.15 };

/** Under this OKLCH chroma a colour counts as a grey for `HEAVY.greyApart`. */
const GREY_CHROMA = 0.02;

/**
 * How far `surface-3`, a card nested in a card, moves from `surface-2` in lightness, per palette
 * and mode. Positive is away from the page: darker in light mode, lighter in dark (#504).
 *
 * Light takes 0.03, the most that keeps status text on its tint at 4.5:1 there. Default dark takes
 * the same step lighter, which leaves that text 5.05:1. Dark used to sink a nested card toward the
 * page by 0.07 instead, and once its card became neutral-900 (#479) that put it below the page.
 *
 * Monokai's is 0. Its card is already as light as its status text allows: `negative` on its `/10`
 * tint is 4.55:1 on the card and 4.49:1 on the next shade lighter that a hex can draw, so the
 * largest raise that holds 4.5:1 is none. A nested card there is set apart by its edge alone.
 */
export const SURFACE_STEP = {
  default: { light: 0.03, dark: 0.03 },
  monokai: { dark: 0 },
};

/** The dialog backdrop's alpha, which used to be `bg-overlay/60` at every call site. */
export const OVERLAY_ALPHA = 0.6;

const CHROMA_STEP = 0.98;
const LIGHTNESS_STEP = 0.005;
const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** Pull chroma in until the colour fits sRGB, so a heavy colour is never silently clipped. */
function inGamut(t) {
  let c = t.c;
  while (isOutOfGamut({ ...t, c }) && c > 0) {
    c *= CHROMA_STEP;
  }
  return { ...t, c };
}

const contrast = (a, b) => contrastRatio(toRgb(a), toRgb(b));

/** The first colour far enough from `colour`, walking lightness in `direction`; null at the edge. */
function walk(colour, direction, heavy) {
  const { chroma } = heavy;
  const apart = colour.c < GREY_CHROMA ? heavy.greyApart : heavy.apart;
  for (let l = colour.l; l >= 0 && l <= 1; l += direction * LIGHTNESS_STEP) {
    const candidate = inGamut({ l, c: colour.c * chroma, h: colour.h });
    if (contrast(candidate, colour) >= apart) {
      return candidate;
    }
  }
  return null;
}

/**
 * The new tokens for one mode of one palette.
 *
 * @param {Record<string, Oklch>} base A palette as `palette.mjs` exports it.
 * @param {{ surface3?: Oklch, surfaceFloating?: Oklch }} [overrides] A palette may tune these.
 * @param {{ heavy?: typeof HEAVY, surfaceStep?: number | { light?: number, dark?: number } }} [tuning]
 *   For trying other rules; `surfaceStep` is the palette's entry in `SURFACE_STEP`, or a number
 *   for either mode.
 * @returns {Record<string, Oklch>}
 */
export function derive(
  base,
  overrides = {},
  { heavy = HEAVY, surfaceStep = SURFACE_STEP.default } = {},
) {
  const page = base.background;
  // Away from the page: lighter on a dark page, darker on a light one.
  const away = base.foreground.l > page.l ? 1 : -1;
  const raised = base.secondary;
  const step =
    typeof surfaceStep === "number" ? surfaceStep : (surfaceStep[away > 0 ? "dark" : "light"] ?? 0);

  /** @type {Record<string, Oklch>} */
  const out = {
    "surface-1": page,
    "surface-2": raised,
    "surface-3": overrides.surface3 ?? { ...raised, l: clamp01(raised.l + away * step) },
    "surface-floating": overrides.surfaceFloating ?? raised,
  };

  for (const [name, source] of Object.entries(MEANINGS)) {
    const colour = base[source];
    out[name] = colour;
    for (const [weight, alpha] of Object.entries(WEIGHTS)) {
      out[`${name}-${weight}`] = { ...colour, a: alpha };
    }
    out[`${name}-heavy`] = walk(colour, away, heavy) ?? walk(colour, -away, heavy) ?? colour;
  }

  for (const fill of FILLS) {
    // `default` is the page's text colour, so what reads on it is the page colour itself.
    out[`on-${fill}`] = fill === "default" ? page : base[`${fill}-foreground`];
  }

  out.hover = base.hover;
  out.overlay = { ...base.overlay, a: OVERLAY_ALPHA };
  const statuses = STATUS_TOKENS.map((name) => base[name]);
  fitSeries(page, raised, away > 0, statuses).forEach((colour, i) => {
    out[`series-${i + 1}`] = colour;
  });
  return out;
}

/**
 * shadcn's names, each as the new token it copies, so a vendored shadcn component keeps working.
 * Written as values beside the tokens, for the same reason `palette.mjs` gives: native reads a dark
 * value only from a literal.
 */
export const ALIASES = {
  background: "surface-1",
  foreground: "default",
  card: "surface-2",
  "card-foreground": "default",
  popover: "surface-floating",
  "popover-foreground": "default",
  primary: "neutral",
  "primary-foreground": "on-neutral",
  secondary: "surface-2",
  "secondary-foreground": "default",
  muted: "default-lightest",
  "muted-foreground": "default-medium",
  accent: "hover",
  "accent-foreground": "default",
  destructive: "negative",
  "destructive-foreground": "on-negative",
  selection: "active",
  "selection-foreground": "on-active",
  border: "default-lightest",
  input: "default-medium",
  ring: "active",
  sidebar: "surface-1",
  "sidebar-foreground": "default",
  "sidebar-primary": "active",
  "sidebar-primary-foreground": "on-active",
  "sidebar-accent": "hover",
  "sidebar-accent-foreground": "default",
  "sidebar-border": "default-lightest",
  "sidebar-ring": "active",
};

const withAliases = (tokens) => ({
  ...tokens,
  ...Object.fromEntries(Object.entries(ALIASES).map(([alias, target]) => [alias, tokens[target]])),
});

/** Every mode of every palette, derived: `{ default: { light, dark }, monokai: { dark } }`. */
export const derived = {
  default: { light: withAliases(derive(light)), dark: withAliases(derive(dark)) },
  ...Object.fromEntries(
    Object.entries(palettes).map(([name, modes]) => [
      name,
      Object.fromEntries(
        Object.entries(modes).map(([mode, map]) => [
          mode,
          withAliases(derive(map, {}, { surfaceStep: SURFACE_STEP[name] })),
        ]),
      ),
    ]),
  ),
};

/** The new token names, without the aliases, in emission order. */
export const tokenNames = Object.keys(derive(light));

/** Every emitted name: the tokens, then the aliases. */
export const names = [...tokenNames, ...Object.keys(ALIASES)];
