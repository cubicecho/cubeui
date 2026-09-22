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

// The import is what tells the compiler which names are elements, so each case names its own.
const compile = (body, imports = "View") =>
  compileSource({ filePath: "x.tsx", text: `import { ${imports} } from "react-native";\n${body}` });

const ok = (body, imports) => {
  const { code, diagnostics } = compile(body, imports);
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

/**
 * The prop map applied to the one place a prop name is not spelled out: `{ accessibilityLabel }`,
 * the shorthand this repo's conditional-spread idiom produces everywhere a prop is optional under
 * `exactOptionalPropertyTypes`. It shipped as a literal `accessibilityLabel` attribute on a DOM
 * `<button>` — invalid HTML, no accessible name, and nothing anywhere saying so.
 */
test("a shorthand prop inside a JSX spread is expanded and renamed", () => {
  const code = ok(
    "export const A = ({ accessibilityLabel }: { accessibilityLabel?: string }) =>\n" +
      "  <Pressable onPress={() => {}} {...(accessibilityLabel ? { accessibilityLabel } : {})} />;",
    "Pressable",
  );
  assert.match(
    code,
    /\{\.\.\.\(accessibilityLabel \? \{ "aria-label": accessibilityLabel \} : \{\}\)\}/,
  );
});

/** The local binding keeps the source's name, so a *reference* to it is not a leak. */
test("a renamed prop's local name still reaches the body", () => {
  const code = ok(
    "export const A = ({ accessibilityLabel }: { accessibilityLabel?: string }) =>\n" +
      "  <Text>{accessibilityLabel}</Text>;",
    "Text",
  );
  assert.match(code, /"aria-label": accessibilityLabel/);
  assert.match(code, /<span className="cube-rn-text">\{accessibilityLabel\}<\/span>/);
});

/**
 * An unmapped React Native prop is refused rather than emitted. React forwards an unknown prop
 * straight to the DOM node, so without this the failure is an invalid attribute and a missing
 * behaviour, with no error at any point between the source and the reader who needs it.
 */
test("a React Native prop with no mapping is refused rather than emitted", () => {
  const { code, diagnostics } = compile(
    'export const A = () => <View accessibilityLanguage="en" />;',
  );
  assert.equal(code, null);
  assert.match(diagnostics[0].message, /used as a prop name in the compiled output/);
});
