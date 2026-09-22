/**
 * The reader behind `check-registry-build.mjs`'s rule 9, asked the cases it has to get right: a
 * colour behind variants and an opacity, the utilities that share a prefix with a colour and are
 * not one, and the comments that talk about classes without rendering any.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { colourOf, tokensIn, unresolvedColours } from "./colour-classes.mjs";

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
