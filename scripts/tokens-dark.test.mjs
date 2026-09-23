/**
 * Proves the native stylesheet's dark palette actually reaches the device.
 *
 * This is the one guard here written against a *third-party compiler's* output rather
 * than against our own, and it exists because the failure it catches shipped. The
 * emitter wrote `.dark { … }` — correct for the web build, correct in every shadcn
 * stylesheet, and on native a silent no-op. There is no DOM and no root element to
 * carry a class, so react-native-css reads a bare `.dark` as an ordinary class style:
 * variables scoped to whatever subtree gets `className="dark"`, never the root set.
 * Nothing errors. Nothing warns. The build is green and every Expo app installing the
 * tokens renders light for ever.
 *
 * `react-native-css/compiler` is the same transform Metro runs, and it imports in
 * Node, so the question needs no device or simulator — which is what the README used
 * to say it was waiting for. Asserting on the compiled artefact is also why this
 * survives an RC bump: if a future react-native-css changes which spelling it honours,
 * this fails here rather than on someone's phone.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile } from "react-native-css/compiler";
import { names } from "../tokens/palette.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * `@import` and `@theme` are Tailwind-time constructs that Metro resolves upstream of
 * this compiler, and lightningcss cannot parse them standalone. Stripping them leaves
 * exactly the part under test: the two variable blocks.
 */
const stylesheet = async (source = readFileSync(join(root, "dist/tokens.native.css"), "utf8")) => {
  const css = source.replace(/^@import.*$/gm, "").replace(/@theme inline \{[\s\S]*?\n\}/m, "");
  return (await compile(css)).stylesheet();
};

const isDark = (value) => JSON.stringify(value).includes("prefers-color-scheme");

test("every token carries a dark value the compiler can see", async () => {
  const vars = new Map((await stylesheet()).vr ?? []);

  assert.equal(vars.size, names.length, "not every token became a root variable");

  const missing = names.filter((n) => !isDark(vars.get(n)));
  assert.deepEqual(
    missing,
    [],
    "these tokens have no dark value on native — the dark block is probably `.dark`, " +
      "which compiles to a class style rather than root variables",
  );
});

test("the dark block did not become a class style", async () => {
  // The signature of the bug: a style named `dark` appearing beside the root variables.
  // It is worth asserting separately, because a partial regression would leave some
  // tokens dark and strand the rest here rather than failing the check above.
  const styles = ((await stylesheet()).s ?? []).map(([name]) => name);
  assert.deepEqual(styles, [], `the stylesheet should define no classes, found: ${styles}`);
});

/** The body of the first block opened by `selector`, one declaration per entry. */
const declarations = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `no \`${selector}\` block in dist/tokens.native.css`);
  const body = css.slice(start, css.indexOf("}", start));
  return body.match(/--[\w-]+: [^;]+;/g) ?? [];
};

/**
 * The rules that exist for Expo *web* and nothing else: the `box-sizing`, `<button>` and page-font
 * resets raw DOM controls need, and the `:is(html.dark)` / `:is(html.light)` override a theme picker needs. Both are only
 * safe to ship in the one stylesheet because the native compiler drops them — and the spellings
 * that look equivalent do not get dropped: `:root.dark` fails the compile, `html.dark` becomes a
 * class style. So what is asserted is the compiler's own output, with and without them.
 */
const WEB_ONLY = [
  /^\*,\n::before,\n::after \{[\s\S]*?\n\}/m,
  /^:where\((button|html)\) \{[\s\S]*?\n\}/gm,
  /^:is\(html\.(dark|light)\) \{[\s\S]*?\n\}/gm,
];

test("the web-only rules compile to nothing on native", async () => {
  const css = readFileSync(join(root, "dist/tokens.native.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  const without = WEB_ONLY.reduce((acc, re) => acc.replace(re, ""), css);

  assert.match(css, /^\*,\n::before,\n::after \{\n {2}box-sizing: border-box;\n\}/m);
  assert.match(css, /^:where\(button\) \{\n {2}border: 0 solid;[\s\S]*?font: inherit;\n\}/m);
  assert.match(css, /^:where\(html\) \{\n {2}font-family: [^;]+;\n\}/m);
  assert.equal((css.match(/^:is\(html\.(dark|light)\) \{/gm) ?? []).length, 2);
  assert.equal(/box-sizing|:where\(|:is\(html/.test(without), false, "the strip missed something");
  assert.deepEqual(await stylesheet(css), await stylesheet(without));
});

/**
 * The strip above proves the rules as spelled contribute nothing; this proves the compiler is
 * dropping them rather than, say, turning an element selector into a style named `button` that
 * the comparison would also have stripped. Each is compiled on its own beside a class that is
 * known to survive, so an empty result means dropped, not a parse that failed quietly.
 */
test("an element selector is dropped on native, as `*` is", async () => {
  const probe = ".probe { color: red; }";
  const alone = await stylesheet(probe);
  assert.deepEqual(
    alone.s?.map(([name]) => name),
    ["probe"],
  );
  for (const rule of [
    "*, ::before, ::after { box-sizing: border-box; }",
    ":where(button) { border: 0 solid; background-color: transparent; color: inherit; font: inherit; }",
    "button { border: 0 solid; background-color: transparent; }",
    ":where(html) { font-family: Arial, sans-serif; }",
  ]) {
    assert.deepEqual(await stylesheet(`${probe}\n${rule}`), alone, rule);
  }
});

test("the manual override carries the whole palette, in both directions", () => {
  const css = readFileSync(join(root, "dist/tokens.native.css"), "utf8");
  const system = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
  const lightRoot = declarations(css, ":root").filter((d) => !d.startsWith("--radius:"));

  assert.equal(lightRoot.length, names.length);
  assert.deepEqual(declarations(css, ":is(html.light)"), lightRoot);
  assert.deepEqual(declarations(css, ":is(html.dark)"), declarations(system, ":root"));
});
