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

/** The token names, in emission order. Both maps must carry all of them. */
export const names = Object.keys(light);
