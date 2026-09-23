/**
 * The colour utilities a source file names, and which of them no stylesheet defines.
 *
 * This is the input to one invariant of `check-registry-build.mjs`: **every `text-*`, `bg-*` and
 * `border-*` colour a registry file uses resolves to a token.** Tailwind generates a colour utility
 * only for a colour its theme holds, and it says nothing about one it does not — the class is kept
 * in the markup, matches no rule, and the element takes whatever it inherits. That shipped here:
 * `button`'s `destructive` variant and `toast`'s error tone both wore `text-destructive-foreground`
 * for as long as the palette had no `--destructive-foreground`, and a consumer found out by
 * defining it in their own `global.css`.
 *
 * Read from string literals through the TypeScript parser rather than by a regex over the file,
 * because this registry's TSDoc talks about classes constantly — `text-in-text`, and a
 * `bg-input-background` quoted from the call sites a component replaced — and a comment is not a
 * class anyone renders.
 */

import ts from "typescript";

/** The utility families checked, longest first so `ring-offset-*` is not read as `ring-*`. */
const FAMILIES = ["ring-offset", "border", "ring", "text", "bg", "fill", "stroke", "outline"];

/**
 * Suffixes a family takes that are not a colour. Anything a family is given that is neither in
 * here, nor a token, nor a Tailwind palette colour is reported — so a utility this list has not
 * heard of fails loudly and gets added, rather than passing unexamined.
 */
const NOT_COLOUR = {
  text: /^(xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)$/,
  bg: /^(fixed|local|scroll|auto|cover|contain|none|center|top|bottom|left|right|(left|right)-(top|bottom)|no-repeat|repeat(-[xy]|-round|-space)?|(clip|origin)-\w+|blend-[\w-]+|(linear|radial|conic|gradient)-.*)$/,
  border: /^(\d+(\.\d+)?|px|solid|dashed|dotted|double|hidden|none|collapse|separate|spacing-.*)?$/,
  ring: /^(\d+|inset)?$/,
  "ring-offset": /^\d+$/,
  fill: /^none$/,
  stroke: /^(\d+|none)$/,
  outline: /^(\d+|none|hidden|solid|dashed|dotted|double|offset-.*)?$/,
};

/** The colours Tailwind 4 ships in its default theme, which need no token of ours. */
const PALETTE =
  /^((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)|black|white|transparent|current|inherit)$/;

/** Every string a file spells, from both plain and template literals — the places a class can be. */
function stringsIn(source, fileName = "source.tsx") {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  const out = [];
  const visit = (node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) out.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
}

/** `hover:bg-accent/50` -> `bg-accent`; `[&>a:hover]:text-primary` -> `text-primary`. */
function utilityOf(cls) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < cls.length; i++) {
    if (cls[i] === "[" || cls[i] === "(") depth++;
    else if (cls[i] === "]" || cls[i] === ")") depth--;
    else if (cls[i] === ":" && depth === 0) start = i + 1;
  }
  return cls
    .slice(start)
    .replace(/^!|!$/g, "")
    .replace(/\/[\w.[\]%-]+$/, "");
}

/**
 * The colour a utility names, as `{ family, colour }`, or null for a utility that names none —
 * `text-sm`, `border-b-0`, an arbitrary `text-[0.9em]`, or a template fragment like `bg-`.
 */
export function colourOf(cls) {
  const utility = utilityOf(cls);
  for (const family of FAMILIES) {
    if (!utility.startsWith(`${family}-`) && utility !== family) continue;
    let rest = utility.slice(family.length + 1);
    // `border-t-destructive` is a colour on one side; `border-t` alone is a width.
    if (family === "border") rest = rest.replace(/^[xytrblse](-|$)/, "");
    if (rest === "" || /^[[(]/.test(rest) || NOT_COLOUR[family].test(rest)) return null;
    return { family, colour: rest };
  }
  return null;
}

/**
 * The colour utilities in `source` that resolve to neither a token in `tokens` nor a colour
 * Tailwind ships, each once, in the order they first appear.
 */
export function unresolvedColours(source, tokens, fileName) {
  const bad = new Set();
  for (const text of stringsIn(source, fileName)) {
    for (const cls of text.split(/\s+/)) {
      const found = colourOf(cls);
      if (found && !tokens.has(found.colour) && !PALETTE.test(found.colour))
        bad.add(utilityOf(cls));
    }
  }
  return [...bad];
}

/** The colour names a stylesheet's `@theme inline` block makes available: `--color-x` -> `x`. */
export function tokensIn(css) {
  return new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]));
}

/**
 * `border`, `border-2`, `border-t`, `border-x-[3px]`, behind any variants — a utility that draws a
 * border at all. `border-b-0` draws none and is not one.
 */
export function isBorderWidth(cls) {
  const match = /^border(-[xytrblse])?(-(\d+(\.\d+)?|px|\[[^\]]+\]))?$/.exec(utilityOf(cls));
  return match !== null && !/^-0(\.0+)?$/.test(match[2] ?? "");
}

/** The class-joining calls whose arguments are one class list: every string in one is in scope. */
const JOINERS = new Set(["cn", "cva", "clsx", "twMerge"]);

/** Whether `node`'s parent is still the same class list, climbing out from a string. */
function joins(node) {
  const parent = node.parent;
  if (!parent) return false;
  if (
    ts.isParenthesizedExpression(parent) ||
    ts.isConditionalExpression(parent) ||
    ts.isBinaryExpression(parent) ||
    ts.isArrayLiteralExpression(parent) ||
    ts.isObjectLiteralExpression(parent) ||
    ts.isPropertyAssignment(parent) ||
    ts.isTemplateSpan(parent) ||
    ts.isTemplateExpression(parent) ||
    ts.isAsExpression(parent) ||
    ts.isSatisfiesExpression(parent)
  ) {
    return true;
  }
  return (
    ts.isCallExpression(parent) &&
    ts.isIdentifier(parent.expression) &&
    JOINERS.has(parent.expression.text)
  );
}

/** The escape hatch: a comment naming where the colour comes from instead. */
const ESCAPE = /@border-colour\b/;

/** Whether a comment above the string, up to its statement or property, carries the escape. */
function excused(node, source) {
  for (let at = node; at && !ts.isSourceFile(at); at = at.parent) {
    const ranges = ts.getLeadingCommentRanges(source, at.getFullStart()) ?? [];
    if (ranges.some((r) => ESCAPE.test(source.slice(r.pos, r.end)))) return true;
    if (ts.isStatement(at) || ts.isPropertyAssignment(at)) break;
  }
  return false;
}

function parse(source, fileName) {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/**
 * The class strings in a React Native source that draw a border and name no colour for it, as
 * `line: "…"`.
 *
 * React Native's default `borderColor` is black, and react-native-web's base `View` class says
 * `border: 0 solid black` — a class, so a stylesheet's `* { border-color: var(--border) }` loses
 * to it. On device and on Expo web a bare `border` is a black line; only the compiled DOM half,
 * which has no such base class, ever drew it in the theme's colour.
 *
 * A string is judged with the class list it is joined into — every string in the same `cn(…)`,
 * `cva(…)`, conditional, array or object — so `cn("border", on ? "border-primary" : "border-input")`
 * passes. A string whose colour is added somewhere this cannot see (a constant applied in another
 * file) says so with a `@border-colour` comment above it, naming where.
 */
export function uncolouredBorders(source, fileName = "source.tsx") {
  const file = parse(source, fileName);
  const literals = [];
  const visit = (node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) literals.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);

  const classesOf = (node) => node.text.split(/\s+/).filter(Boolean);
  const bad = [];
  for (const literal of literals) {
    if (!classesOf(literal).some(isBorderWidth)) continue;
    let root = literal;
    while (joins(root)) root = root.parent;
    const coloured = literals
      .filter((l) => l.pos >= root.pos && l.end <= root.end)
      .some((l) => classesOf(l).some((cls) => colourOf(cls)?.family === "border"));
    if (coloured || excused(literal, source)) continue;
    const { line } = file.getLineAndCharacterOfPosition(literal.getStart());
    bad.push(`${line + 1}: "${literal.text.trim()}"`);
  }
  return bad;
}

/**
 * `Platform.select({ web: undefined, default: "text-foreground" })` and its kin — a colour class
 * every platform gets but web — as `line: …`.
 *
 * `Platform.OS === "web"` is true for the compiled half *and* under react-native-web, and only the
 * first inherits colour. Under react-native-web a `Text` sets its own `color`, black, so a title
 * whose ink was left to inheritance on web is black on the dark theme. A colour class is harmless
 * on the compiled half; set it everywhere.
 */
export function weblessColours(source, fileName = "source.tsx") {
  const file = parse(source, fileName);
  const bad = [];
  const visit = (node) => {
    const callee = ts.isCallExpression(node) ? node.expression : undefined;
    const options = node.arguments?.[0];
    if (
      callee &&
      ts.isPropertyAccessExpression(callee) &&
      callee.name.text === "select" &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === "Platform" &&
      options &&
      ts.isObjectLiteralExpression(options)
    ) {
      const branches = new Map();
      for (const p of options.properties) {
        if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
          branches.set(p.name.text, p.initializer);
        }
      }
      const web = branches.get("web");
      const blank =
        web === undefined ||
        (ts.isIdentifier(web) && web.text === "undefined") ||
        web.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isStringLiteralLike(web) && web.text.trim() === "");
      const colours = [...branches]
        .filter(([name]) => name !== "web")
        .flatMap(([, value]) =>
          ts.isStringLiteralLike(value) ? value.text.split(/\s+/).filter((c) => colourOf(c)) : [],
        );
      if (blank && colours.length > 0) {
        const { line } = file.getLineAndCharacterOfPosition(node.getStart());
        bad.push(`${line + 1}: \`${colours.join(" ")}\` everywhere but web`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return bad;
}
