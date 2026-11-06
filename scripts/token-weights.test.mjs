/**
 * PROTOTYPE: holds the named-weight tokens to what today's tokens are held to, and to the reason
 * they exist — that React Native renders every class without mixing a colour at runtime.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile as tailwind } from "@tailwindcss/node";
import { compile as native } from "react-native-css/compiler";
import { derived, tokenNames } from "../tokens/weights.mjs";
import { pairs, series, states } from "./weights-contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nativeCss = readFileSync(join(root, "dist/prototype/tokens.native.css"), "utf8");

/** The classes a component writes for the common jobs (the proposal's class reference). */
const CLASSES = [
  "fg-default",
  "fg-default-medium",
  "fg-negative",
  "fg-on-negative",
  "bg-surface-1",
  "bg-surface-2",
  "bg-surface-3",
  "bg-surface-floating",
  "bg-default-lightest",
  "bg-negative-lightest",
  "bg-active-light",
  "bg-neutral",
  "hover:bg-neutral-heavy",
  "bg-hover",
  "bg-overlay",
  "border-default-lightest",
  "border-default-medium",
  "border-negative-light",
  "border-active",
];

test("native: every token carries a dark value", async () => {
  const css = nativeCss
    .replace(/@theme inline \{[\s\S]*?\n\}/m, "")
    .replace(/@utility[\s\S]*$/m, "");
  const vars = new Map((await native(css)).stylesheet().vr ?? []);
  const missing = tokenNames.filter(
    (n) => JSON.stringify(vars.get(n) ?? "").includes("prefers-color-scheme") === false,
  );
  assert.deepEqual(missing, []);
});

/**
 * react-native-css cannot compile a class rule under lightningcss 1.33 ("failed to deserialize;
 * expected an object-like struct named Specifier"), which is what cubeui installs. The apps pin
 * 1.30.1 with an `overrides` entry, so Metro compiles them; cubeui needs the same pin before this
 * check can run here. Skipped by name rather than passed in silence.
 */
const lightningcss = JSON.parse(
  readFileSync(join(root, "node_modules/lightningcss/package.json"), "utf8"),
).version;

test("native: no class needs a colour mixed at runtime", {
  skip: lightningcss.startsWith("1.30.") ? false : `lightningcss ${lightningcss}: pin 1.30.1`,
}, async () => {
  const source = `@import "tailwindcss/theme.css" theme(reference);\n@import "tailwindcss/utilities.css";\n${nativeCss}`;
  const compiler = await tailwind(source, { base: root, onDependency() {} });
  const styles = new Map((await native(compiler.build(CLASSES))).stylesheet().s ?? []);

  assert.deepEqual(
    CLASSES.filter((c) => styles.has(c) === false),
    [],
    "these classes compiled to nothing",
  );
  // `colorMix` is what react-native-css cannot resolve: an opacity class came out as one.
  assert.deepEqual(
    CLASSES.filter((c) => JSON.stringify(styles.get(c)).includes("colorMix")),
    [],
    "these classes mix a colour at runtime, which renders black on device",
  );
  // `fg-` is the custom utility: it must reach `color`, which text and icons read.
  assert.match(JSON.stringify(styles.get("fg-default-medium")), /"color"/);
});

const sets = Object.entries(derived).flatMap(([palette, modes]) =>
  Object.entries(modes).map(([mode, map]) => [`${palette} ${mode}`, map]),
);

const short = (checks) =>
  checks
    .filter((c) => c.ratio < c.floor)
    .map((c) => `${c.label} on ${c.on}: ${c.ratio}:1, needs ${c.floor}`);

for (const [set, map] of sets) {
  test(`${set}: every text and edge pair reaches its floor`, () => {
    assert.deepEqual(short(pairs(map)), []);
  });

  test(`${set}: chosen, hovered and heavy states stay apart`, () => {
    assert.deepEqual(short(states(map)), []);
  });

  test(`${set}: chart colours show on the page and stay apart`, () => {
    assert.deepEqual(short(series(map)), []);
  });
}
