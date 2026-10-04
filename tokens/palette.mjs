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
 * - `secondary`: the fill of a surface raised off the page — a card, a popover, the sidebar.
 *   Opaque, because a popover floats over content. Its text is `foreground`.
 * - `neutral`, `positive`, `warning`, `negative`, `info`: what a thing says. A button or a badge
 *   with nothing to say is `neutral`. Each that fills has a `-foreground`; `info` is an icon and
 *   a tint, never a fill.
 * - `hover`: the transient grey under a pointer or a menu's keyboard highlight.
 * - `active`: the one colour for chosen, current and focused — a checked control, the current
 *   row, the focus ring.
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
 * `a` is alpha in [0,1] and is omitted when opaque.
 */

/** @typedef {{ l: number, c: number, h: number, a?: number }} Oklch */

/** The corner radius the whole scale is derived from. */
export const radius = "0.625rem";

// The status colours are Tailwind's shades in their sRGB form, the same in every palette until one
// has a reason to differ. White on the two that fill is 5.0:1.
const STATUS = {
  positive: { l: 0.5273, c: 0.1371, h: 150.069 }, // #15803D, green-700 in sRGB
  "positive-foreground": { l: 1, c: 0, h: 0 },
  warning: { l: 0.5553, c: 0.1455, h: 48.998 }, // #B45309, amber-700 in sRGB
  "warning-foreground": { l: 1, c: 0, h: 0 },
};
const INFO = { l: 0.5876, c: 0.1389, h: 241.966 }; // #0284C7, sky-600 in sRGB
const BLACK = { l: 0, c: 0, h: 0 };

/** @type {Record<string, Oklch>} */
const lightTokens = {
  background: { l: 1, c: 0, h: 0 },
  foreground: { l: 0.145, c: 0, h: 0 },
  // Barely off the page: `negative` text is 4.4:1 on anything darker.
  secondary: { l: 0.985, c: 0, h: 0 },
  neutral: { l: 0.205, c: 0, h: 0 },
  "neutral-foreground": { l: 0.985, c: 0, h: 0 },
  // A step darker than `secondary`, or a menu row's highlight would not show on its own popover.
  hover: { l: 0.922, c: 0, h: 0 },
  "hover-foreground": { l: 0.205, c: 0, h: 0 },
  active: { l: 0.5461, c: 0.2152, h: 262.881 }, // #2563EB, blue-600 in sRGB
  "active-foreground": { l: 1, c: 0, h: 0 },
  ...STATUS,
  negative: { l: 0.577, c: 0.245, h: 27.325 },
  "negative-foreground": { l: 1, c: 0, h: 0 },
  info: INFO,
  overlay: BLACK,
};

/** @type {Record<string, Oklch>} */
const darkTokens = {
  background: { l: 0.145, c: 0, h: 0 },
  foreground: { l: 0.985, c: 0, h: 0 },
  secondary: { l: 0.269, c: 0, h: 0 },
  neutral: { l: 0.922, c: 0, h: 0 },
  "neutral-foreground": { l: 0.205, c: 0, h: 0 },
  hover: { l: 0.371, c: 0, h: 0 },
  "hover-foreground": { l: 0.985, c: 0, h: 0 },
  active: { l: 0.7137, c: 0.1434, h: 254.624 }, // #60A5FA, blue-400 in sRGB
  "active-foreground": { l: 0.145, c: 0, h: 0 },
  ...STATUS,
  negative: { l: 0.704, c: 0.191, h: 22.216 },
  // Dark text, not white: dark `negative` is a light coral, and white on it is 2.89:1 — short
  // of the 4.5:1 a button label needs. Near-black is 6.85:1. Light mode's white is 4.77:1.
  "negative-foreground": { l: 0.145, c: 0, h: 0 },
  info: INFO,
  overlay: BLACK,
};

/**
 * Monokai. Every text pair clears 4.5:1 — `palette-contrast.test.mjs` holds it — which is why its
 * `negative` is not the editor's pink: `#F92672` is 3.9:1 on the background and against either
 * text colour, so it is Monokai Pro's `#FF6188`.
 *
 * @type {Record<string, Oklch>}
 */
const monokaiDark = {
  background: { l: 0.2737, c: 0.0109, h: 114.803 }, // #272822
  foreground: { l: 0.9775, c: 0.0079, h: 106.545 }, // #F8F8F2
  secondary: { l: 0.2977, c: 0.0124, h: 113.753 }, // #2D2E27
  neutral: { l: 0.8414, c: 0.2044, h: 127.286 }, // #A6E22E, the green
  "neutral-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  hover: { l: 0.3574, c: 0.0184, h: 103.002 }, // #3E3D32, the line highlight
  "hover-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
  active: { l: 0.7012, c: 0.1812, h: 298.062 }, // #AE81FF, the purple
  "active-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  ...STATUS,
  negative: { l: 0.7058, c: 0.1936, h: 8.454 }, // #FF6188
  "negative-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
  info: INFO,
  overlay: BLACK,
};

/** The names a palette writes, and the only ones a cubeui component may name. */
export const tokenNames = Object.keys(lightTokens);

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
  muted: ["foreground", 0.1],
  "muted-foreground": ["foreground", 0.6],
  accent: "hover",
  "accent-foreground": "hover-foreground",
  selection: "active",
  "selection-foreground": "active-foreground",
  destructive: "negative",
  "destructive-foreground": "negative-foreground",
  border: ["foreground", 0.1],
  input: ["foreground", 0.15],
  ring: "active",
  sidebar: "secondary",
  "sidebar-foreground": "foreground",
  "sidebar-primary": "active",
  "sidebar-primary-foreground": "active-foreground",
  "sidebar-accent": "hover",
  "sidebar-accent-foreground": "hover-foreground",
  "sidebar-border": ["foreground", 0.1],
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
