import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveWebRegistry } from "./registry.mjs";

const item = (name, deps) => ({
  name,
  type: "registry:ui",
  ...(deps ? { registryDependencies: deps } : {}),
  files: [{ path: `registry/ui/${name}.tsx`, type: "registry:ui" }],
});

const derive = (items, emitted) =>
  deriveWebRegistry(
    { items: [{ name: "tokens", files: [] }, { name: "utils", files: [] }, ...items] },
    { items: [] },
    new Map(Object.entries(emitted)),
  ).registry.items;

test("an item whose emitted text wears the reset depends on tokens (#133)", () => {
  const [, , toast] = derive([item("toast", ["@cubeui/utils"])], {
    "toast.tsx": 'import { cn } from "@/lib/utils";\n<div className="cube-rn-view" />',
  });
  assert.deepEqual(toast.registryDependencies, ["@cubeui/utils", "@cubeui/tokens"]);
});

test("the tokens dependency is added once, beside a derived utils", () => {
  const [, , plain, already] = derive([item("plain"), item("already", ["@cubeui/tokens"])], {
    "plain.tsx": 'import { cn } from "@/lib/utils";\n<span className="cube-rn-text" />',
    "already.tsx": '<span className="cube-rn-text" />',
  });
  assert.deepEqual(plain.registryDependencies, ["@cubeui/utils", "@cubeui/tokens"]);
  assert.deepEqual(already.registryDependencies, ["@cubeui/tokens"]);
});

test("an item that never names a reset class is left alone", () => {
  const [, , clean] = derive([item("clean", ["@cubeui/utils"])], {
    "clean.tsx": '<div className="flex" />',
  });
  assert.deepEqual(clean.registryDependencies, ["@cubeui/utils"]);
});
