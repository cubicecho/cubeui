/**
 * The conversion is the one piece of real maths in the build, and a wrong value
 * here is invisible until it is on a device. Expected hexes are Tailwind's
 * neutral/red ramps, which is where shadcn's palette comes from.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatOklch, isOutOfGamut, toNativeCss } from "./oklch.mjs";
import { dark, light, names } from "../tokens/palette.mjs";

const cases = [
  [{ l: 1, c: 0, h: 0 }, "#ffffff"],
  [{ l: 0.985, c: 0, h: 0 }, "#fafafa"],
  [{ l: 0.97, c: 0, h: 0 }, "#f5f5f5"],
  [{ l: 0.922, c: 0, h: 0 }, "#e5e5e5"],
  [{ l: 0.708, c: 0, h: 0 }, "#a1a1a1"],
  [{ l: 0.556, c: 0, h: 0 }, "#737373"],
  [{ l: 0.371, c: 0, h: 0 }, "#404040"],
  [{ l: 0.269, c: 0, h: 0 }, "#262626"],
  [{ l: 0.205, c: 0, h: 0 }, "#171717"],
  [{ l: 0.145, c: 0, h: 0 }, "#0a0a0a"],
  [{ l: 0.704, c: 0.191, h: 22.216 }, "#ff6467"],
  [{ l: 0.577, c: 0.245, h: 27.325 }, "#e7000b"],
];

test("oklch converts to the expected sRGB hex", () => {
  for (const [t, want] of cases) assert.equal(toNativeCss(t), want, formatOklch(t));
});

test("alpha becomes rgba, which React Native can parse", () => {
  assert.equal(toNativeCss({ l: 1, c: 0, h: 0, a: 0.1 }), "rgba(255, 255, 255, 0.1)");
  assert.equal(toNativeCss({ l: 1, c: 0, h: 0, a: 0.15 }), "rgba(255, 255, 255, 0.15)");
});

test("formatOklch round-trips the source spelling", () => {
  assert.equal(formatOklch({ l: 0.97, c: 0, h: 0 }), "oklch(0.97 0 0)");
  assert.equal(formatOklch({ l: 1, c: 0, h: 0, a: 0.1 }), "oklch(1 0 0 / 10%)");
  assert.equal(formatOklch({ l: 0.577, c: 0.245, h: 27.325 }), "oklch(0.577 0.245 27.325)");
});

test("light and dark define the same token names", () => {
  assert.deepEqual(Object.keys(light), names);
  assert.deepEqual(Object.keys(dark), names);
});

test("only destructive is outside sRGB", () => {
  const out = names.filter((n) => isOutOfGamut(light[n]) || isOutOfGamut(dark[n]));
  assert.deepEqual(out, ["destructive"]);
});

test("every emitted native colour is a form RN can parse", () => {
  const ok = /^(#[0-9a-f]{6}|rgba\(\d+, \d+, \d+, [\d.]+\))$/;
  for (const n of names)
    for (const map of [light, dark]) assert.match(toNativeCss(map[n]), ok, n);
});
