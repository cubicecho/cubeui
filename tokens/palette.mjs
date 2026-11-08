/**
 * The single source of truth for colour in cubeui.
 *
 * Values are stored as OKLCH components rather than strings because the three
 * emitters need different encodings of the same colour, and a string would force
 * each of them to re-parse it:
 *
 * - web CSS keeps `oklch()`, which is what Tailwind 4 and every browser want.
 * - native CSS needs hex/rgba. **React Native's style engine cannot parse
 *   `oklch()` at runtime** — this is not a preference, it is the reason this file
 *   exists in this shape. `ai_tools/min-agent/mobile/global.css` discovered it the
 *   hard way and hand-converted the palette; that hand conversion has since
 *   drifted from cubeui in three places, which is the drift this package ends.
 * - `cubeui-theme.ts` needs plain JS strings, because RN props that take a colour
 *   (`placeholderTextColor`, icon tints, navigator chrome, SVG fills) are strings
 *   and cannot read a CSS variable.
 *
 * **A token is named for what the colour means.** These are the ones a palette
 * writes, and the only ones a cubeui component names:
 *
 * - `background`, `foreground`: the page and the text on it.
 * - `secondary`: the fill of a surface raised off the page — a card, a popover, a dialog.
 *   Opaque, because a popover floats over content. Its text is `foreground`. App chrome — a
 *   sidebar, a top or bottom bar — is not raised: it is `background` with a `/10` rule.
 * - `neutral`, `positive`, `warning`, `negative`, `info`: what a thing says. A button or a badge
 *   with nothing to say is `neutral`, and `info` is the blue for one worth pointing out. Each has
 *   a `-foreground` for the text on its fill.
 * - `hover`: the transient fill under a pointer, a menu's keyboard highlight or keyboard focus:
 *   `active`'s hue, all but grey. Its text is `foreground`.
 * - `active`: the one colour for chosen and current — the tint of a checked control or the
 *   current row — and a focused field's border. Nothing draws a focus ring: a focused thing looks
 *   hovered.
 * - `overlay`: the scrim behind a dialog, drawn at an opacity the component picks.
 *
 * **Nothing here is a quieter copy of another token.** Muted is an opacity on the class:
 * `text-foreground/60` is secondary text, `border-foreground/10` a border, `bg-foreground/10` a
 * quiet fill, `bg-warning/10` a tint. It is `foreground` and not `neutral` so that a palette whose
 * `neutral` has a hue (Monokai's is green) keeps grey borders.
 *
 * **shadcn's names are still emitted**, as `ALIASES` below, so a vendored shadcn component and a
 * call site written against the old names keep working. `registry:check` rule 9 does not let a
 * cubeui component name one.
 *
 * **Every palette keeps the same hierarchy**, and `palette-contrast.test.mjs` holds the steps: a
 * raised surface is 1.08–1.15:1 from the page, `hover` is 1.15–1.3:1 further on from it, and the
 * chosen tint (`active` at `/40`) is 1.7–2.1:1 from what it is drawn on. The light theme sets the
 * span: its page is white and a control's edge has to stay 3:1 on `hover`, so page to hover is
 * about 1.3:1 at the most, and the dark themes take the same steps rather than the 1.3:1 card they
 * could afford.
 *
 * **The status colours differ in lightness, not only in hue**, so a reader with a colour-vision
 * deficiency can still tell them apart: red and green, and red and amber, are one colour to many
 * of them at the same lightness. The test holds each pair 0.06 apart in OKLab under normal vision
 * and the three deficiencies (`scripts/oklch.mjs`), the bar the chart colours are held to.
 *
 * `a` is alpha in [0,1] and is omitted when opaque.
 */

/** @typedef {{ l: number, c: number, h: number, a?: number }} Oklch */

/** The corner radius the whole scale is derived from. */
export const radius = "0.625rem";

// The status colours on a light page are dark, about Tailwind's 800s: a 700 is 5.0:1 on white but
// drops under 4.5:1 as text on its own `/10` tint (an outline button under the pointer) and as
// white text on its `/90` fill (a filled button under the pointer). That leaves them a narrow band
// of lightness, so they are spread across it: under protanopia red reads darker than it is and
// amber-800 was 0.025 from it, so `warning` is the darkest, a burnt orange, and `negative` the
// lightest.
const STATUS = {
  positive: { l: 0.453, c: 0.108, h: 151.3 }, // #196635, green-800 a shade lighter
  "positive-foreground": { l: 1, c: 0, h: 0 },
  warning: { l: 0.393, c: 0.112, h: 44.2 }, // #742C02, darker than amber-900
  "warning-foreground": { l: 1, c: 0, h: 0 },
  // About sky-700, which it was, turned a little toward blue and darkened to read on its tint on a
  // nested card. The 600 it was as a tint is 4.1:1 under white text.
  info: { l: 0.49, c: 0.131, h: 248.75 }, // #0863A6
  "info-foreground": { l: 1, c: 0, h: 0 },
};
// On a dark page they are light, with dark text, as dark `negative` is a light coral: a 700 is
// dim there, and under 3:1 against the page as an icon. `positive` is the 400, a step lighter than
// the rest: as the 500 it was 0.008 from `negative` under deuteranopia, one colour.
const DARK_STATUS = {
  positive: { l: 0.8003, c: 0.1821, h: 151.711 }, // #4ADE80, green-400 in sRGB
  "positive-foreground": { l: 0.145, c: 0, h: 0 },
  warning: { l: 0.7686, c: 0.1647, h: 70.08 }, // #F59E0B, amber-500 in sRGB
  "warning-foreground": { l: 0.145, c: 0, h: 0 },
  info: { l: 0.6847, c: 0.1479, h: 237.323 }, // #0EA5E9, sky-500 in sRGB
  "info-foreground": { l: 0.145, c: 0, h: 0 },
};
const BLACK = { l: 0, c: 0, h: 0 };

/** @type {Record<string, Oklch>} */
const lightTokens = {
  background: { l: 1, c: 0, h: 0 },
  foreground: { l: 0.145, c: 0, h: 0 },
  // neutral-100: 1.09:1 from the page. Darker would leave too little room for `hover` beyond it.
  secondary: { l: 0.97, c: 0, h: 0 },
  neutral: { l: 0.205, c: 0, h: 0 },
  "neutral-foreground": { l: 0.985, c: 0, h: 0 },
  // 1.19:1 from `secondary`, so a menu row's highlight shows on its own popover; any darker and a
  // control's edge on it falls toward 3:1 and `info` text under 4.5:1.
  hover: { l: 0.91, c: 0.025, h: 218 }, // `active`, all but grey
  // A quiet cyan, between `info` and `positive` in hue and nearer `info`, so chosen reads as neither.
  // Dark enough that white text still reads on it at `/90`, the focused step.
  active: { l: 0.5, c: 0.07, h: 218 }, // #2D6D7E
  "active-foreground": { l: 1, c: 0, h: 0 },
  ...STATUS,
  // About red-700, a step under the 600 it was (3.99:1 as text on its own `/10` tint), with a
  // little less chroma: red-700 itself is outside sRGB.
  negative: { l: 0.5, c: 0.17, h: 27.5 }, // #B02B26
  "negative-foreground": { l: 1, c: 0, h: 0 },
  overlay: BLACK,
};

/** @type {Record<string, Oklch>} */
const darkTokens = {
  background: { l: 0.145, c: 0, h: 0 },
  foreground: { l: 0.985, c: 0, h: 0 },
  // neutral-900, 1.1:1 from the page as the light card is. The 800 it was is 1.31:1, which made a
  // dark card heavier than a light one and left `hover` only 1.13:1 beyond it.
  secondary: { l: 0.205, c: 0, h: 0 },
  neutral: { l: 0.922, c: 0, h: 0 },
  "neutral-foreground": { l: 0.205, c: 0, h: 0 },
  // `active`, all but grey: the pointer and the chosen row read as one family. 1.2:1 from
  // `secondary`, and dark enough to stay apart from a chosen row (`active/40`), which it matched
  // at 0.371, and for `info` to read on it.
  hover: { l: 0.27, c: 0.03, h: 218 }, // #142A30
  active: { l: 0.68, c: 0.065, h: 218 }, // #69A2B3
  "active-foreground": { l: 0.145, c: 0, h: 0 },
  ...DARK_STATUS,
  negative: { l: 0.704, c: 0.191, h: 22.216 },
  // Dark text, not white: dark `negative` is a light coral, and white on it is 2.89:1 — short
  // of the 4.5:1 a button label needs. Near-black is 6.85:1.
  "negative-foreground": { l: 0.145, c: 0, h: 0 },
  overlay: BLACK,
};

/**
 * Monokai. Every text pair clears 4.5:1 — `palette-contrast.test.mjs` holds it — which is why its
 * `negative` is not the editor's pink: `#F92672` is 3.9:1 on the background and against either
 * text colour, so it is Monokai Pro's `#FF6188`, lifted to read on its own tint.
 *
 * @type {Record<string, Oklch>}
 */
const monokaiDark = {
  background: { l: 0.2737, c: 0.0109, h: 114.803 }, // #272822
  foreground: { l: 0.9775, c: 0.0079, h: 106.545 }, // #F8F8F2
  // A shade lighter than the #2D2E27 it was, to sit 1.1:1 from the page as the others do.
  secondary: { l: 0.302, c: 0.0124, h: 113.753 }, // #2E2F28
  neutral: { l: 0.8414, c: 0.2044, h: 127.286 }, // #A6E22E, the green
  "neutral-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  hover: { l: 0.3574, c: 0.0184, h: 103.002 }, // #3E3D32, the line highlight
  active: { l: 0.7012, c: 0.1812, h: 298.062 }, // #AE81FF, the purple
  "active-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  // Not Monokai's own green: that is `neutral` here, and a saved badge has to differ from a button.
  // Nor default dark's green-400, which is 0.036 from the cyan under tritanopia: green-500, a shade
  // lighter.
  positive: { l: 0.738, c: 0.192, h: 149.58 }, // #2BCA63
  "positive-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  // The orange turned a little toward yellow: as #FD971F it is 0.051 from `negative` under
  // tritanopia.
  warning: { l: 0.777, c: 0.1683, h: 66.37 }, // #FD9D16
  "warning-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  info: { l: 0.8269, c: 0.108, h: 211.963 }, // #66D9EF, the cyan
  "info-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  // Monokai Pro's #FF6188 lifted a little: at its own lightness it is 4.18:1 as text on its `/10`
  // tint over a popover, the highlighted destructive menu row. Turned toward pink, away from the
  // orange.
  negative: { l: 0.735, c: 0.1742, h: 2.45 }, // #FF74A0
  "negative-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  overlay: BLACK,
};

/** The names a palette writes, and the only ones a cubeui component may name. */
export const tokenNames = Object.keys(lightTokens);

// The alphas the aliases lay `foreground` down at.
const FAINT = 0.1;
const INPUT_EDGE = 0.5;
const QUIET_TEXT = 0.6;

/**
 * shadcn's names, each as the token it now is. A string is that token; `[token, alpha]` is the
 * token at an opacity, for the names that were a quieter copy of another colour. They are written
 * into every block as values, not as `var()`: react-native-css reads a dark value only from a
 * literal, and one stylesheet that is the same in both builds is worth more than the indirection.
 * So a palette of your own that sets `--negative` sets `--destructive` beside it.
 *
 * @type {Record<string, string | [string, number]>}
 */
export const ALIASES = {
  card: "secondary",
  "card-foreground": "foreground",
  popover: "secondary",
  "popover-foreground": "foreground",
  primary: "neutral",
  "primary-foreground": "neutral-foreground",
  "secondary-foreground": "foreground",
  muted: ["foreground", FAINT],
  "muted-foreground": ["foreground", QUIET_TEXT],
  accent: "hover",
  "accent-foreground": "foreground",
  selection: "active",
  "selection-foreground": "active-foreground",
  destructive: "negative",
  "destructive-foreground": "negative-foreground",
  border: ["foreground", FAINT],
  input: ["foreground", INPUT_EDGE],
  ring: "active",
  // App chrome is the page, not a raised surface: a copied shadcn sidebar draws as cubeui's own does.
  sidebar: "background",
  "sidebar-foreground": "foreground",
  "sidebar-primary": "active",
  "sidebar-primary-foreground": "active-foreground",
  "sidebar-accent": "hover",
  "sidebar-accent-foreground": "foreground",
  "sidebar-border": ["foreground", FAINT],
  "sidebar-ring": "active",
};

/** A palette's tokens with every alias beside them, which is what the emitters write. */
function withAliases(tokens) {
  const aliased = Object.entries(ALIASES).map(([name, target]) => [
    name,
    typeof target === "string" ? tokens[target] : { ...tokens[target[0]], a: target[1] },
  ]);
  return { ...tokens, ...Object.fromEntries(aliased) };
}

export const light = withAliases(lightTokens);
export const dark = withAliases(darkTokens);

/** Every emitted name, in emission order: the tokens, then the aliases. */
export const names = Object.keys(light);

/**
 * Palettes beside the default one: a second set of the same tokens, chosen in the app rather than
 * by the device. A palette is a family, and each names the modes it has; one with only `dark`, as
 * Monokai has, is dark whatever the light / dark / system choice says, since there is no light
 * Monokai to fall back to. The default palette is `light` and `dark` above, and is not listed here.
 *
 * @type {Record<string, { light?: Record<string, Oklch>, dark?: Record<string, Oklch> }>}
 */
export const palettes = {
  monokai: { dark: withAliases(monokaiDark) },
};
