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
const stylesheet = async () => {
  const css = readFileSync(join(root, "dist/tokens.native.css"), "utf8")
    .replace(/^@import.*$/gm, "")
    .replace(/@theme inline \{[\s\S]*?\n\}/m, "");
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
