/**
 * The compiler's element pass, where the tag it emits is decided.
 *
 * Tested here rather than through the registry build because the build only ever reports that an
 * item has no web half — true and useless. These are the smallest sources that tell the two tag
 * shapes apart, which is what the pass gets wrong when it gets anything wrong.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { compileSource } from "./compile.mjs";

const compile = (body) =>
  compileSource({ filePath: "x.tsx", text: `import { View } from "react-native";\n${body}` });

const ok = (body) => {
  const { code, diagnostics } = compile(body);
  assert.deepEqual(
    diagnostics.map((d) => d.message),
    [],
  );
  return code;
};

test("a self-closing element is renamed", () => {
  assert.match(
    ok('export const A = () => <View className="a" />;'),
    /<div className="cube-rn-view a" \/>/,
  );
});

/**
 * The regression. A self-closing element's parent is the element *enclosing* it, so a rename that
 * asked the parent's kind renamed the outer tag twice and left the inner `<View />` behind — which
 * the element-leak check then read as an element chosen at runtime and refused the whole file over.
 */
test("a self-closing element nested inside another is renamed", () => {
  const code = ok('export const A = () => <View className="a"><View className="b" /></View>;');
  assert.equal(code.includes("View"), false, code);
  assert.match(code, /<div className="cube-rn-view a"><div className="cube-rn-view b" \/><\/div>/);
});

test("a paired element nested inside another is renamed on both tags", () => {
  const code = ok('export const A = () => <View className="a"><View className="b"></View></View>;');
  assert.equal(code.includes("View"), false, code);
});

test("an element picked at runtime is still refused", () => {
  const { code, diagnostics } = compile(
    "export const A = ({ on }: { on: boolean }) => { const C = on ? View : View; return <C />; };",
  );
  assert.equal(code, null);
  assert.match(diagnostics[0].message, /chosen at runtime/);
});
