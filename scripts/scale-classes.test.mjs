/**
 * The reader behind `check-registry-build.mjs`'s rule 17, asked what it has to get right: a step
 * behind variants and a sign, a size's own line read as the line height it is, whole steps left
 * alone, comments not read as classes, and an allow-list that only shrinks.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isOnScale, offScaleClasses, scaleProblems, stepOf } from "./scale-classes.mjs";

test("a step is read through variants, importance and a negative sign", () => {
  assert.deepEqual(stepOf("hover:-mt-0.5"), { utility: "mt-0.5", kind: "spacing", step: "0.5" });
  assert.deepEqual(stepOf("group-data-[size=sm]/item:leading-5"), {
    utility: "leading-5",
    kind: "line-height",
    step: "5",
  });
  assert.deepEqual(stepOf("!size-3.5"), { utility: "size-3.5", kind: "size", step: "3.5" });
  assert.deepEqual(stepOf("text-sm/6"), { utility: "text-sm/6", kind: "line-height", step: "6" });
});

test("whole steps, sizes, weights and colours are not what this rule reads", () => {
  for (const cls of [
    "p-3",
    "gap-2",
    "size-4",
    "h-px",
    "text-sm",
    "font-semibold",
    "text-info/60",
  ]) {
    assert.equal(stepOf(cls), null, cls);
  }
});

test("the named steps pass and the rest do not", () => {
  for (const cls of [
    "leading-5",
    "leading-relaxed",
    "leading-tight",
    "text-sm/relaxed",
    "py-1.5",
    "gap-0.5",
    "size-3.5",
    "w-2.5",
  ]) {
    assert.equal(isOnScale(cls), true, cls);
  }
  for (const cls of [
    "leading-none",
    "leading-snug",
    "leading-[1.6]",
    "text-sm/snug",
    "text-xs/4",
    "gap-2.5",
    "px-3.5",
    "size-1.5",
    "-mx-0.75",
  ]) {
    assert.equal(isOnScale(cls), false, cls);
  }
});

test("a class in a comment is not one anyone renders", () => {
  const source = [
    "// `leading-none` clipped a truncated title",
    "/** `gap-2.5` was the guess */",
    'const ROW = "flex-row gap-2.5 leading-snug";',
  ].join("\n");
  assert.deepEqual(offScaleClasses(source, "row.tsx"), ["gap-2.5", "leading-snug"]);
});

test("a new off-scale class fails, and an allowed one with its reason passes", () => {
  const sources = new Map([["registry/ui/row.tsx", 'const ROW = "gap-2.5 leading-snug py-1.5";']]);
  const allowed = { "registry/ui/row.tsx": { "leading-snug": "shadcn's own row" } };
  assert.deepEqual(scaleProblems(sources, allowed), {
    offScale: ["registry/ui/row.tsx: `gap-2.5`"],
    stale: [],
  });
});

test("an allowed class gone from its file fails, and so does one allowed with no reason", () => {
  const sources = new Map([["registry/ui/row.tsx", 'const ROW = "gap-2 leading-snug";']]);
  const allowed = {
    "registry/ui/row.tsx": { "leading-snug": " ", "gap-2.5": "was a guess" },
    "registry/ui/gone.tsx": { "py-1.75": "the file went" },
  };
  assert.deepEqual(scaleProblems(sources, allowed).stale, [
    "registry/ui/row.tsx: `leading-snug` is allowed with no reason",
    "registry/ui/row.tsx: `gap-2.5` is allowed and no longer used there",
    "registry/ui/gone.tsx: `py-1.75` is allowed and no longer used there",
  ]);
});

test("every line of the allow-list gives a reason", async () => {
  const allowed = JSON.parse(
    await readFile(new URL("./scale-allow.json", import.meta.url), "utf8"),
  );
  for (const [file, classes] of Object.entries(allowed)) {
    for (const [cls, reason] of Object.entries(classes)) {
      assert.ok(isOnScale(cls) === false, `${file}: \`${cls}\` is on the scale and needs no line`);
      assert.ok(reason.length > 20, `${file}: \`${cls}\` needs a reason`);
    }
  }
});
