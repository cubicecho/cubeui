/**
 * Proves a Tailwind opacity class — `text-foreground/60`, `border-foreground/50`, `bg-negative/10` —
 * comes out as a colour on native.
 *
 * Like `tokens-dark.test.mjs`, this is a guard on a third-party library rather than on our own
 * output, and it exists because the failure shipped. Tailwind writes `/50` as
 * `color-mix(in oklab, var(--foreground) 50%, transparent)`. react-native-css's compiler leaves the
 * percentage it was not given as `undefined`, Metro injects the stylesheet as JSON, which makes it
 * `null`, and the runtime's `colorMix` gave up on any argument left over — so every one of those
 * classes resolved to no colour at all, and React Native draws an
 * unset text, icon or border colour as black. On the web the browser mixes the colour itself, so
 * nothing looked wrong there. About 270 uses in the native registry were affected.
 *
 * The fix is `patches/react-native-css+*.patch`, applied by `postinstall`. Every Expo app installing
 * from `public/r/native` needs the same patch until it is fixed upstream. If an upgrade drops the
 * patch, or a new release still has the bug, this fails here rather than on someone's phone.
 *
 * Compiler and runtime are both the real ones. Only the steps between them are reproduced. Metro's
 * injection is `JSON.stringify` (`getNativeInjectionCode`), so the stylesheet makes that round trip
 * here: without it the gap stays `undefined`, the resolver filters it out, and the bug does not
 * show. The runtime's resolver imports React Native and does not load in Node, so `resolve` is its
 * descriptor-array branch — resolve each argument, drop the `undefined`s, keep everything else,
 * `null` included.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { compile } from "react-native-css/compiler";

// Not an exported path, so it is found from the compiler's: both live in the package's `dist/commonjs`.
const require = createRequire(import.meta.url);
const commonjs = join(require.resolve("react-native-css/compiler"), "../..");
const { colorMix } = require(join(commonjs, "native/styles/functions/color-mix.js"));

const VARS = { foreground: "#fafafa" };

/** react-native-css's `resolveValue`, reduced to the branches a `color-mix()` reaches. */
const resolve = (value) => {
  if (Array.isArray(value) === false) {
    return value;
  }
  if (typeof value[0] === "object" && value[1] === "var") {
    return VARS[value[2]];
  }
  if (typeof value[0] === "object" && value[1] === "colorMix") {
    return colorMix(resolve, value);
  }
  return value.map(resolve).filter((d) => d !== undefined);
};

/** The declarations the compiler wrote for `.name`, as `[property, descriptor]` pairs. */
const compiled = async (css, name) => {
  // As Metro injects it on native: through JSON, which turns every `undefined` into `null`.
  const sheet = JSON.parse(JSON.stringify((await compile(css)).stylesheet()));
  const styles = new Map(sheet.s ?? []);
  assert.ok(styles.has(name), `no style named ${name}`);
  return styles
    .get(name)
    .flatMap((rule) => rule.d.map(([descriptor, property]) => [property, descriptor]));
};

/** The last value `property` resolves to, as the runtime would apply it: the later rule wins. */
const resolved = async (css, name, property) =>
  (await compiled(css, name))
    .filter(([p]) => p === property)
    .map(([, descriptor]) => resolve(descriptor))
    .at(-1);

// Tailwind 4's output for each class, verbatim: a plain fallback, then the mix behind `@supports`.
const opacityClass = (selector, property, percent) => `
${selector} {
  ${property}: var(--foreground);
  @supports (color: color-mix(in lab, red, red)) {
    ${property}: color-mix(in oklab, var(--foreground) ${percent}%, transparent);
  }
}`;

for (const [className, selector, cssProperty, property, percent] of [
  ["text-foreground/60", ".text-foreground\\/60", "color", "color", 60],
  ["border-foreground/50", ".border-foreground\\/50", "border-color", "borderColor", 50],
  ["bg-foreground/10", ".bg-foreground\\/10", "background-color", "backgroundColor", 10],
]) {
  test(`${className} resolves to the foreground at ${percent}% on native`, async () => {
    const css = opacityClass(selector, cssProperty, percent);
    assert.equal(
      await resolved(css, className, property),
      `rgba(250, 250, 250, ${percent / 100})`,
      "the mix resolved to nothing, so React Native draws this colour black: " +
        "is patches/react-native-css+*.patch still applied?",
    );
  });
}

test("the omitted percentage still reaches the runtime as null", async () => {
  // The shape the patch is for. If a release stops writing it, the patch can go: this fails then,
  // and says so, rather than the patch outliving its reason.
  const [[, descriptor]] = (await compiled(opacityClass(".x", "color", 50), "x")).slice(-1);
  assert.deepEqual(descriptor[1], "colorMix");
  assert.equal(
    descriptor[2].at(-1),
    null,
    "no trailing null: react-native-css may have fixed this upstream",
  );
});

test("a mix with both percentages, or none, still resolves", () => {
  // The patch drops empty arguments. These are the shapes that never had one, kept working.
  const fg = [{}, "var", "foreground", 1];
  assert.equal(
    resolve([{}, "colorMix", ["oklab", fg, "50%", "transparent", "50%"]]),
    "rgba(250, 250, 250, 0.5)",
  );
  assert.equal(resolve([{}, "colorMix", ["oklab", fg, "transparent"]]), "rgba(250, 250, 250, 0.5)");
  assert.equal(
    resolve([{}, "colorMix", ["oklab", fg, "50%", "transparent", "50%", "red"]]),
    undefined,
  );
});
