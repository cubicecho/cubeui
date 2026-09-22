/**
 * The npm packages a source file imports.
 *
 * This is the input to one invariant, asked of every item in both registries: **an item declares
 * exactly the packages its own files import.** Both directions of that are a real bug, and both
 * shipped here before this existed:
 *
 *   undeclared  `button.tsx` imports `radix-ui` for `Slot`, and `registry.json` says only
 *               `class-variance-authority`. The CLI installs what the item declares, so the
 *               consumer gets a file importing a package that is not in their tree — a resolve
 *               error at import time, in a file they did not write.
 *
 *   unimported  `icons` declares `lucide-react`, which only `icons.web.tsx` uses. In the native
 *               registry that is a DOM icon set being installed into an Expo app. `calendar`
 *               declared `react-day-picker` the same way.
 *
 * `ts.preProcessFile` rather than a regex, because the regex that looks right is wrong: `"from"`
 * appears inside strings and TSDoc all over this registry, and a `variant = "default"` on an
 * exported function matches `/^\s*export\b[^;'"]*?["']([^"']+)["']/`. This is the scanner the
 * compiler itself uses to find a file's dependencies before binding, so it sees imports and
 * nothing that merely reads like one.
 */

import ts from "typescript";

/**
 * Packages a consumer is guaranteed to already have, and which no item therefore declares.
 *
 * An Expo app has `react` and `react-native` before it installs anything from here, and a DOM app
 * has `react` and `react-dom`. Declaring them would make the CLI reinstall — and possibly move —
 * the framework the app is built on, which is a worse failure than the one being prevented.
 */
const PEERS = new Set(["react", "react-native", "react-dom"]);

/** `radix-ui/react-slot` -> `radix-ui`; `@tanstack/react-form/foo` -> `@tanstack/react-form`. */
function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * The bare package specifiers in `source`, minus the peers above.
 *
 * Relative paths and the `@/` alias are both skipped: they name a file, not a package. `@/` in
 * particular is how every cross-item import in this registry is written — including the ones
 * reaching upstream shadcn's `@/components/ui/separator` — so it is `registryDependencies` that
 * covers them and never `dependencies`.
 */
export function packagesIn(source, path = "") {
  const found = new Set();
  const specifiers = path.endsWith(".css")
    ? cssImportsIn(source)
    : ts.preProcessFile(source, true, true).importedFiles.map((f) => f.fileName);
  for (const fileName of specifiers) {
    if (fileName.startsWith(".") || fileName.startsWith("@/")) continue;
    const name = packageOf(fileName);
    if (!PEERS.has(name)) found.add(name);
  }
  return found;
}

/**
 * The specifiers a stylesheet `@import`s.
 *
 * A regex here where the TypeScript scanner is used above, because there is no CSS parser in this
 * repo's dependencies and `@import` is the one CSS statement whose grammar is small enough to
 * match honestly: it is the first thing in the file, its argument is a quoted string or a
 * `url()`, and anything after that is a layer or media query this does not care about — which is
 * why the match stops at the closing quote and `@import "tailwindcss/theme.css" layer(theme);`
 * yields the stylesheet rather than `theme`.
 *
 * It matters because a stylesheet is the only file in this registry that can pull in a package
 * the consumer has to have installed and that no `.tsx` mentions — `tw-animate-css` is exactly
 * that, and the four items using its classes had no way to say so.
 */
function cssImportsIn(source) {
  const found = [];
  for (const match of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) {
    found.push(match[1]);
  }
  return found;
}

/** `nativewind@^5.0.0-rc.0` -> `nativewind`. A scoped name's own `@` is never the separator. */
export const packageName = (spec) => spec.replace(/(?!^)@[\^~><=\d].*$/, "");

/**
 * Files that can name a package: a TypeScript source, and a stylesheet.
 *
 * `.css` was outside this until a compiled DOM component shipped wearing `cube-rn-view` and
 * `animate-in` with nothing in the consumer's tree defining either. The stylesheet is where both
 * are imported from, so it is a file with dependencies and has to be read as one. A `.md` in an
 * item's files still is not.
 */
export const isSource = (path) => /\.(tsx?|css)$/.test(path);
