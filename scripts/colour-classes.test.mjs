/**
 * The reader behind `check-registry-build.mjs`'s rule 9, asked the cases it has to get right: a
 * colour behind variants and an opacity, the utilities that share a prefix with a colour and are
 * not one, and the comments that talk about classes without rendering any. Then rule 14's: a
 * border with no colour in its class list, and ink every platform gets but web.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  colourOf,
  isBorderWidth,
  tokensIn,
  uncolouredBorders,
  unresolvedColours,
  weblessColours,
} from "./colour-classes.mjs";

const tokens = new Set(["primary", "destructive", "border", "ring"]);

test("a colour is read through variants, importance and opacity", () => {
  assert.deepEqual(colourOf("hover:bg-primary/90"), { family: "bg", colour: "primary" });
  assert.deepEqual(colourOf("data-[state=open]:!text-destructive"), {
    family: "text",
    colour: "destructive",
  });
  assert.deepEqual(colourOf("[&>a:hover]:text-primary"), { family: "text", colour: "primary" });
  assert.deepEqual(colourOf("border-t-destructive"), { family: "border", colour: "destructive" });
  assert.deepEqual(colourOf("ring-offset-background"), {
    family: "ring-offset",
    colour: "background",
  });
});

test("utilities that are not colours are not read as one", () => {
  for (const cls of [
    "text-sm",
    "text-sm/relaxed",
    "text-2xl",
    "text-center",
    "text-balance",
    "text-[0.9em]",
    "bg-no-repeat",
    "bg-linear-to-r",
    "border",
    "border-2",
    "border-b",
    "border-b-0",
    "border-dashed",
    "ring",
    "ring-2",
    "ring-[3px]",
    "ring-offset-2",
    "outline-none",
    "outline-hidden",
    "bg-",
    "text",
  ]) {
    assert.equal(colourOf(cls), null, cls);
  }
});

test("only a colour that is neither a token nor Tailwind's own is reported", () => {
  const source = `
    // text-in-text inherits, and bg-input-background is what a call site used to copy.
    /** \`text-destructive-foreground\` in TSDoc is prose too. */
    const a = "bg-primary text-white bg-black/80 bg-green-700 border-transparent fill-current";
    const b = cn("text-destructive-foreground", \`hover:bg-sidebar-accent \${x} bg-\${tone}\`);
    const c = <div className="border-border ring-ring/50 text-destructive-foreground" />;
  `;
  assert.deepEqual(unresolvedColours(source, tokens), [
    "text-destructive-foreground",
    "bg-sidebar-accent",
  ]);
});

test("tokens are what the stylesheet's @theme block names", () => {
  const css =
    "@theme inline {\n  --radius-sm: 1px;\n  --color-sidebar-ring: var(--sidebar-ring);\n}";
  assert.deepEqual([...tokensIn(css)], ["sidebar-ring"]);
});

test("a border width is told apart from a border colour and from no border", () => {
  for (const cls of ["border", "border-2", "border-t", "border-x-[3px]", "md:border-b"]) {
    assert.equal(isBorderWidth(cls), true, cls);
  }
  for (const cls of ["border-b-0", "border-border", "border-dashed", "rounded", "border-t-0"]) {
    assert.equal(isBorderWidth(cls), false, cls);
  }
});

test("a native border with no colour anywhere in its class list is reported", () => {
  const source = `
    // A bare border in a comment is prose: rounded-lg border
    const card = "rounded-lg border bg-card";
    const coloured = "rounded-lg border border-border bg-card";
    const none = "border-b-0";
    const joined = cn("rounded-md border", on ? "border-primary" : "border-input");
    const variant = cva("border", { variants: { tone: { a: "border-destructive" } } });
    const nested = cn("p-2", card ? cn("border-2 p-3", "border-input") : "rounded-sm");
    const conditional = cn("gap-2", divider && "border-b pb-1");
    const jsx = <View className="w-full rounded-md border px-3" />;
    /** @border-colour each half adds it from the checked state. */
    export const BOX_CLASS = "rounded border";
  `;
  assert.deepEqual(uncolouredBorders(source), [
    '3: "rounded-lg border bg-card"',
    '9: "border-b pb-1"',
    '10: "w-full rounded-md border px-3"',
  ]);
});

test("a colour class given to every platform but web is reported", () => {
  const source = `
    const INK = Platform.select({ web: undefined, default: "text-foreground" });
    const MISSING = Platform.select({ ios: "text-card-foreground" });
    const BLANK = Platform.select({ web: "", native: "bg-muted" });
    const SIZE = Platform.select({ web: "[&_svg]:size-5", default: undefined });
    const LAYOUT = Platform.select({ web: undefined, default: "absolute h-px w-px" });
    const BOTH = Platform.select({ web: "text-foreground", default: "text-foreground" });
  `;
  assert.deepEqual(weblessColours(source), [
    "2: `text-foreground` everywhere but web",
    "3: `text-card-foreground` everywhere but web",
    "4: `bg-muted` everywhere but web",
  ]);
});
