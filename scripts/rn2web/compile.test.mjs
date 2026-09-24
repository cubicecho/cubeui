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

/**
 * A platform-guarded spread with a shorthand in it — `{ href, "aria-current": … }` on
 * `sidebar`'s nav row — is still just attributes once the guard folds. It used to be left as a
 * spread, which the `accessibilityState` check then could not see into, and the item was refused.
 */
test("a shorthand inside a folded platform spread becomes an attribute", () => {
  const code = ok(
    "export const A = ({ href, on }: { href: string; on: boolean }) =>\n" +
      '  <Pressable role="link" accessibilityState={{ selected: on }}\n' +
      '    {...(Platform.OS === "web" ? ({ href, "aria-current": on ? "page" : undefined } as const) : {})} />;',
    "Platform, Pressable",
  );
  assert.match(code, /<a\s+href=\{href\} aria-current=\{on \? "page" : undefined\}/);
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

/**
 * A platform branch written as statements, which is the only way to put two different *elements*
 * on the two sides — a `ScrollView` on device, a scrolling `<div>` here — without naming either
 * outside a JSX tag. The native arm has to be gone before the element pass sees it, or the
 * `ScrollView` compiles into dead code the DOM consumer still downloads.
 */
test("an if on Platform.OS keeps the web arm and drops what it made unreachable", () => {
  const code = ok(
    "export const A = () => {\n" +
      '  if (Platform.OS === "web") {\n' +
      '    return <View className="web" />;\n' +
      "  }\n" +
      '  return <ScrollView className="native" />;\n' +
      "};",
    "Platform, ScrollView, View",
  );
  assert.match(code, /return <div className="cube-rn-view web" \/>;/);
  assert.equal(code.includes("native"), false, code);
  assert.equal(code.includes("if ("), false, code);
});

test("an if on the other platform is dropped, else arm and all", () => {
  const code = ok(
    "export const A = () => {\n" +
      '  let c = "a";\n' +
      '  if (Platform.OS !== "web") { c = "native"; } else { c = "web"; }\n' +
      "  return <View className={c} />;\n" +
      "};",
    "Platform, View",
  );
  assert.match(code, /c = "web";/);
  assert.equal(code.includes('"native"'), false, code);
});

test("a type import the ref rewrite used up is dropped", () => {
  const code = ok(
    'import type { ElementRef, Ref } from "react";\n' +
      "export const A = ({ r }: { r: Ref<ElementRef<typeof View>> }) => <View ref={r} />;",
  );
  assert.match(code, /import type \{ Ref \} from "react";/);
  assert.match(code, /Ref<HTMLDivElement>/);
});

test("a platform && in a class list folds to its operand", () => {
  const code = ok(
    'export const A = () => <View className={cn("a", Platform.OS === "web" && "w", Platform.OS !== "web" && "n")} />;',
    "Platform, View",
  );
  assert.match(code, /"a", "w", false/);
  assert.equal(code.includes('"n"'), false, code);
});

/**
 * A heading whose rank the caller picks. A literal `aria-level` is an `<hN>`; an expression cannot
 * be one, because the tag is written once at compile time, so the element keeps `role="heading"`
 * and `aria-level` — which is a heading of that rank to assistive technology, and what
 * react-native-web renders for the same source.
 */
test("a literal aria-level on a heading becomes that heading element", () => {
  const code = ok('export const A = () => <Text role="heading" aria-level={3}>a</Text>;', "Text");
  assert.match(code, /<h3 className="cube-rn-text">a<\/h3>/);
});

test("an expression aria-level on a heading keeps the role and the level", () => {
  const code = ok(
    "export const A = ({ level }: { level: 1 | 2 | 3 }) =>\n" +
      '  <Text role="heading" aria-level={level}>a</Text>;',
    "Text",
  );
  assert.match(
    code,
    /<span role="heading" aria-level=\{level\} className="cube-rn-text">a<\/span>/,
  );
});

test("a heading with no aria-level is still refused", () => {
  const { code, diagnostics } = compile(
    'export const A = () => <Text role="heading">a</Text>;',
    "Text",
  );
  assert.equal(code, null);
  assert.match(diagnostics[0].message, /needs an `aria-level`/);
});

/**
 * A `<dl>` and its groups. On device the list is `role="list"` and each group `role="listitem"`;
 * on the web neither role may stay, because a role on the `<dl>` or on one of its `<div>`s is what
 * makes the `<dl>` invalid. `webAs` names the element, and the role beside it is the device's.
 */
test("a device list role is dropped from a webAs dl and its grouping div", () => {
  const code = ok(
    'export const A = () => <View webAs="dl" role="list"><View webAs="div" role="listitem">' +
      '<Text webAs="dt">a</Text><View webAs="dd" /></View></View>;',
    "Text, View",
  );
  assert.equal(code.includes("role="), false, code);
  assert.match(code, /<dl className="cube-rn-view"><div className="cube-rn-view"><dt /);
  assert.match(code, /<dd className="cube-rn-view" \/>/);
});

test("a listitem role on a bare View is still an li", () => {
  const code = ok('export const A = () => <View role="listitem" />;');
  assert.match(code, /<li className="cube-rn-view" \/>/);
});
