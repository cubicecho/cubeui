/**
 * The type and spacing steps a source file names, and which of them are off cubeui's scale.
 *
 * The input to `check-registry-build.mjs`'s rule 17. The sizes and the weights already held to a
 * few steps by habit, and the line heights and the half-steps did not: six line heights and about
 * seventy half-step classes had brought back the "10px or 12px?" question a scale exists to answer
 * (#480). So a line height and a half-step are each one of the named steps below, or a line of
 * `scale-allow.json` saying why not. `AGENTS.md` and `skill/controls/theme.md` name the whole
 * scale, sizes and whole steps included, and say what each step is for.
 *
 * Read from string literals through the TypeScript parser, as the colour classes are, so a
 * comment quoting `leading-none` is not a class anyone renders.
 */

import { stringsIn, withoutVariants } from "./colour-classes.mjs";

/**
 * The line heights beside the ones the sizes carry (`text-xs` 12px on 16px, `text-sm` 14px on 20px,
 * and so on up), each with what it is for. Anything else is reported.
 */
export const LINE_HEIGHTS = {
  5: "A 20px line: code text, 12px on it, and `text-sm`'s own line said again where a parent's would carry over",
  tight: "A title of 18px or more that may wrap: its own line is too loose for two lines of it",
  relaxed: "Prose read at length: a Markdown document, a hint's paragraph",
};

/** The spacing half-steps (padding, margin, gap, offset), each with what it is for. */
export const SPACING_HALF_STEPS = {
  0.5: "2px: an icon nudged onto the middle of a 20px line, the pad of a badge or inline code, rows packed in a list",
  1.5: "6px: the pad above and below a menu, select, tab or segment row, and the room between a tab's or a segment's icon and its label",
};

/** The size half-steps (width, height, size), each with what it is for. */
export const SIZE_HALF_STEPS = {
  2.5: "10px: a dot standing beside its label, the cap height of 14px text (`ColorDot`'s `md`, #487)",
  3.5: "14px: an icon in an `xs` control, or beside 12px text, where 16px crowds it",
};

const FONT_SIZE = /^text-(xs|sm|base|lg|[2-9]?xl)\/(.+)$/;
const LINE_HEIGHT = /^leading-(.+)$/;
const SPACING =
  /^(p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|inset(-[xy])?|top|right|bottom|left|start|end|translate-[xy]|scroll-[mp][xytrblse]?)-(\d+\.\d+)$/;
const SIZE = /^(size|w|h|min-w|min-h|max-w|max-h|basis)-(\d+\.\d+)$/;

/**
 * The step a class sets, as `{ utility, kind, step }`, where `utility` is the class without its
 * variants or its sign (`hover:-mt-0.5` -> `mt-0.5`), or null for a class that sets no line height
 * and no half-step. A size's own line (`text-sm/6`) is read as the line height it is.
 */
export function stepOf(cls) {
  const utility = withoutVariants(cls).replace(/^-/, "");
  let match = FONT_SIZE.exec(utility);
  if (match) {
    return { utility, kind: "line-height", step: match[2] };
  }
  match = LINE_HEIGHT.exec(utility);
  if (match) {
    return { utility, kind: "line-height", step: match[1] };
  }
  match = SPACING.exec(utility);
  if (match) {
    return { utility, kind: "spacing", step: match[match.length - 1] };
  }
  match = SIZE.exec(utility);
  if (match) {
    return { utility, kind: "size", step: match[2] };
  }
  return null;
}

const NAMED = { "line-height": LINE_HEIGHTS, spacing: SPACING_HALF_STEPS, size: SIZE_HALF_STEPS };

/** Whether a class is on the scale: it sets no line height or half-step, or it sets a named one. */
export function isOnScale(cls) {
  const found = stepOf(cls);
  return found === null || Object.hasOwn(NAMED[found.kind], found.step);
}

/** The off-scale classes in `source`, each once without its variants, in the order they appear. */
export function offScaleClasses(source, fileName) {
  const bad = new Set();
  for (const text of stringsIn(source, fileName)) {
    for (const cls of text.split(/\s+/)) {
      if (cls !== "" && isOnScale(cls) === false) {
        bad.add(stepOf(cls).utility);
      }
    }
  }
  return [...bad];
}

/**
 * Every off-scale class in `sources` (path -> text) that `allowed` (path -> class -> reason) does
 * not name, as `path: class`; and every line of `allowed` that names nothing still there, or names
 * it with no reason, so the list only shrinks.
 */
export function scaleProblems(sources, allowed) {
  const offScale = [];
  const stale = [];
  const found = new Map();
  for (const [file, text] of sources) {
    const classes = offScaleClasses(text, file);
    found.set(file, new Set(classes));
    for (const cls of classes) {
      if (Object.hasOwn(allowed[file] ?? {}, cls) === false) {
        offScale.push(`${file}: \`${cls}\``);
      }
    }
  }
  for (const [file, classes] of Object.entries(allowed)) {
    for (const [cls, reason] of Object.entries(classes)) {
      if (found.get(file)?.has(cls) !== true) {
        stale.push(`${file}: \`${cls}\` is allowed and no longer used there`);
      } else if (typeof reason !== "string" || reason.trim() === "") {
        stale.push(`${file}: \`${cls}\` is allowed with no reason`);
      }
    }
  }
  return { offScale, stale };
}
