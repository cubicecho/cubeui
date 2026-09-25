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
 * Order is significant: it is the order of the stylesheet the pre-native cubeui
 * shipped (`preview/index.css`), which the web emitter reproduced byte for byte
 * until the two registries merged. `destructive-foreground` and the eight
 * `sidebar-*` tokens were added here — shadcn's own set, which that stylesheet
 * never carried.
 *
 * `a` is alpha in [0,1] and is omitted when opaque.
 */

/** @typedef {{ l: number, c: number, h: number, a?: number }} Oklch */

/** The corner radius the whole scale is derived from. */
export const radius = "0.625rem";

/** @type {Record<string, Oklch>} */
export const light = {
  background: { l: 1, c: 0, h: 0 },
  foreground: { l: 0.145, c: 0, h: 0 },
  card: { l: 1, c: 0, h: 0 },
  "card-foreground": { l: 0.145, c: 0, h: 0 },
  popover: { l: 1, c: 0, h: 0 },
  "popover-foreground": { l: 0.145, c: 0, h: 0 },
  primary: { l: 0.205, c: 0, h: 0 },
  "primary-foreground": { l: 0.985, c: 0, h: 0 },
  secondary: { l: 0.97, c: 0, h: 0 },
  "secondary-foreground": { l: 0.205, c: 0, h: 0 },
  muted: { l: 0.97, c: 0, h: 0 },
  "muted-foreground": { l: 0.556, c: 0, h: 0 },
  accent: { l: 0.97, c: 0, h: 0 },
  "accent-foreground": { l: 0.205, c: 0, h: 0 },
  destructive: { l: 0.577, c: 0.245, h: 27.325 },
  "destructive-foreground": { l: 1, c: 0, h: 0 },
  border: { l: 0.922, c: 0, h: 0 },
  input: { l: 0.922, c: 0, h: 0 },
  ring: { l: 0.708, c: 0, h: 0 },
  sidebar: { l: 0.985, c: 0, h: 0 },
  "sidebar-foreground": { l: 0.145, c: 0, h: 0 },
  "sidebar-primary": { l: 0.205, c: 0, h: 0 },
  "sidebar-primary-foreground": { l: 0.985, c: 0, h: 0 },
  "sidebar-accent": { l: 0.97, c: 0, h: 0 },
  "sidebar-accent-foreground": { l: 0.205, c: 0, h: 0 },
  "sidebar-border": { l: 0.922, c: 0, h: 0 },
  "sidebar-ring": { l: 0.708, c: 0, h: 0 },
};

/** @type {Record<string, Oklch>} */
export const dark = {
  background: { l: 0.145, c: 0, h: 0 },
  foreground: { l: 0.985, c: 0, h: 0 },
  card: { l: 0.205, c: 0, h: 0 },
  "card-foreground": { l: 0.985, c: 0, h: 0 },
  popover: { l: 0.269, c: 0, h: 0 },
  "popover-foreground": { l: 0.985, c: 0, h: 0 },
  primary: { l: 0.922, c: 0, h: 0 },
  "primary-foreground": { l: 0.205, c: 0, h: 0 },
  secondary: { l: 0.269, c: 0, h: 0 },
  "secondary-foreground": { l: 0.985, c: 0, h: 0 },
  muted: { l: 0.269, c: 0, h: 0 },
  "muted-foreground": { l: 0.708, c: 0, h: 0 },
  accent: { l: 0.371, c: 0, h: 0 },
  "accent-foreground": { l: 0.985, c: 0, h: 0 },
  destructive: { l: 0.704, c: 0.191, h: 22.216 },
  // Dark text, not white: dark `destructive` is a light coral, and white on it is 2.89:1 — short
  // of the 4.5:1 a button label needs. Near-black is 6.85:1. Light mode's white is 4.77:1.
  "destructive-foreground": { l: 0.145, c: 0, h: 0 },
  border: { l: 1, c: 0, h: 0, a: 0.1 },
  input: { l: 1, c: 0, h: 0, a: 0.15 },
  ring: { l: 0.556, c: 0, h: 0 },
  sidebar: { l: 0.205, c: 0, h: 0 },
  "sidebar-foreground": { l: 0.985, c: 0, h: 0 },
  "sidebar-primary": { l: 0.488, c: 0.243, h: 264.376 },
  "sidebar-primary-foreground": { l: 0.985, c: 0, h: 0 },
  "sidebar-accent": { l: 0.269, c: 0, h: 0 },
  "sidebar-accent-foreground": { l: 0.985, c: 0, h: 0 },
  "sidebar-border": { l: 1, c: 0, h: 0, a: 0.1 },
  "sidebar-ring": { l: 0.556, c: 0, h: 0 },
};

/** The token names, in emission order. Every map here must carry all of them. */
export const names = Object.keys(light);

/**
 * Palettes beside the default one: a second set of the same tokens, chosen in the app rather than
 * by the device. A palette is a family, and each names the modes it has; one with only `dark`, as
 * Monokai has, is dark whatever the light / dark / system choice says, since there is no light
 * Monokai to fall back to. The default palette is `light` and `dark` above, and is not listed here.
 *
 * Every text pair clears 4.5:1 in every palette — `palette-contrast.test.mjs` holds it — which is
 * why two of Monokai's colours are not the editor's. Its comment grey, `#75715E`, is 3.3:1 on its
 * own background, so muted text is the lighter `#B3AD93`. Its pink, `#F92672`, is 3.9:1 on the
 * background and against either text colour, so destructive is Monokai Pro's `#FF6188`.
 *
 * @type {Record<string, { light?: Record<string, Oklch>, dark?: Record<string, Oklch> }>}
 */
export const palettes = {
  monokai: {
    dark: {
      background: { l: 0.2737, c: 0.0109, h: 114.803 }, // #272822
      foreground: { l: 0.9775, c: 0.0079, h: 106.545 }, // #F8F8F2
      card: { l: 0.2977, c: 0.0124, h: 113.753 }, // #2D2E27
      "card-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      popover: { l: 0.3574, c: 0.0184, h: 103.002 }, // #3E3D32, the line highlight
      "popover-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      primary: { l: 0.8414, c: 0.2044, h: 127.286 }, // #A6E22E, the green
      "primary-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
      secondary: { l: 0.3574, c: 0.0184, h: 103.002 },
      "secondary-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      muted: { l: 0.3574, c: 0.0184, h: 103.002 },
      "muted-foreground": { l: 0.7456, c: 0.0367, h: 96.421 }, // #B3AD93
      accent: { l: 0.3994, c: 0.0163, h: 102.424 }, // #49483E, the selection
      "accent-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      destructive: { l: 0.7058, c: 0.1936, h: 8.454 }, // #FF6188
      "destructive-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
      border: { l: 0.3994, c: 0.0163, h: 102.424 },
      input: { l: 0.4503, c: 0.019, h: 103.225 }, // #57564A
      ring: { l: 0.8269, c: 0.108, h: 211.963 }, // #66D9EF, the blue
      sidebar: { l: 0.2371, c: 0.0058, h: 121.889 }, // #1E1F1C
      "sidebar-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      "sidebar-primary": { l: 0.7012, c: 0.1812, h: 298.062 }, // #AE81FF, the purple
      "sidebar-primary-foreground": { l: 0.2737, c: 0.0109, h: 114.803 },
      "sidebar-accent": { l: 0.3574, c: 0.0184, h: 103.002 },
      "sidebar-accent-foreground": { l: 0.9775, c: 0.0079, h: 106.545 },
      "sidebar-border": { l: 0.3994, c: 0.0163, h: 102.424 },
      "sidebar-ring": { l: 0.8269, c: 0.108, h: 211.963 },
    },
  },
};
