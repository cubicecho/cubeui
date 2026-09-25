// Sixteen things that have to be true before a built registry is installable.
//
// ## 1. No two source files share an item name
//
// The shadcn CLI resolves a cross-item import by the source file's *basename*, not by the item
// name. In cubeui this showed up as `control/select.tsx` importing alongside the vendored `select`
// primitive: the consumer ended up with `import { OptionSelect } from "@/components/ui/select"` —
// a path that resolves, to the wrong file, failing three files from the cause. Renaming only the
// item does not help; the file is what the CLI matches on.
//
// This registry owns every file it ships, so the rule here is not "does it collide with a vendored
// primitive" but "do any two of ours collide". A file's *item name* is its basename with the
// platform and contract suffixes removed — `input.tsx`, `input.web.tsx` and `input-base.ts` are
// all the `input` item and belong together. Two of them in **different directories** is the
// collision.
//
// ## 2. A `.tsx` and its `.web.tsx` export the same names
//
// This is the platform-split equivalent of the rule above, and it is the failure the split is
// most prone to. `icons.web.tsx` says it outright: "The exported names must stay in step with
// `icons.tsx`. Nothing checks that automatically: TypeScript only ever resolves the native file."
//
// So adding an icon to the native file and forgetting the web one typechecks, builds, ships, and
// fails at runtime on web only — `undefined is not a component`, in whichever app happened to use
// it first. Nothing upstream catches it because the web file is never on a typechecked path.
//
// ## 3. Every npm dependency an item declares carries a version range
//
// `"dependencies": ["nativewind"]` makes the CLI run `npm install nativewind`, which installs the
// latest *stable* — 4.2.7 — into an app whose components are written against 5. `cssInterop` is
// gone in 5 and `styled` does not exist in 4, so the app fails at import time, in a file it did
// not write, naming a package it did not ask for. This was a real bug here, found by installing
// into a throwaway app and reading the `package.json` that came out.
//
// A bare name is only safe for a package with no breaking majors ahead of it, which is not a
// judgement a build should be making silently. Spell the range.
//
// ## 4. Every file in a built registry item arrives with its content in it
//
// `shadcn build` inlines each source file into the item's JSON. A *missing* path fails the build
// loudly and names the item. A path that resolves to an **empty** file does not: the item is
// written with `content: ""`, the build reports success, and the only symptom is a consumer
// installing a file with nothing in it.
//
// ## 5. Every cross-item dependency names this registry, and an item that is in it
//
// `registryDependencies` are resolved against the **consumer's** `components.json`, not against
// the registry the item came from. That is the whole trick behind the two-registry split — one
// `@cubeui/utils` reaches the React Native `utils` in an Expo app and the compiled one in a DOM
// app — and it is also the trap, because the string is checked by nobody until a consumer runs
// `shadcn add`.
//
// Three ways it goes wrong. A namespace other than `@cubeui` silently asks the consumer to have
// configured a key nobody told them about. A dependency on an item this registry does not hold
// resolves to a 404 mid-install, after files have already been written — not hypothetical: it is
// what `registry.web.json`'s fixed-point drop exists to prevent, since an item whose web half was
// refused takes its dependents with it, and this is the assertion that the drop actually happened.
//
// And a *bare* name — `separator`, `skeleton` — resolves against ui.shadcn.com instead of against
// anything here, which is a second registry's files arriving inside an install of this one. That
// reads like a saving until you look at what comes down: upstream's published primitives import
// `cn` from an npm package, every file this registry ships imports it from `@/lib/utils`, and a
// consumer who installs one item ends up with both — two functions with one name, half their
// components calling each, and nothing erroring. The five that used to be bare are published from
// `registry/web/ui/` now, so the rule can be what it always meant: every cross-item dependency
// names this registry.
//
// ## 6. Every item file in a built registry is still an item of that registry
//
// `shadcn build` writes an item file per item and never removes one. Rename `status-chip` to
// `badge` and the index loses `status-chip`, `badge.json` appears beside it — and
// `status-chip.json` stays exactly where it was, still complete, still served at its URL. A
// consumer who installed it before the rename, or who pasted the URL from anywhere, keeps
// getting the old component indefinitely, and nothing upstream of here notices: the index is
// correct, every remaining item is correct, and the orphan collides with nothing.
//
// `compiled/` already treats its own version of this as garbage and deletes it. This cannot,
// because `public/` is committed, so it reports and the fix is `git rm`.
//
// ## 7. An item declares exactly the packages its own files import
//
// Rule 3 checks that a declared dependency carries a range. This checks that the list is the
// right list, in both directions, and both directions shipped here before it existed.
//
// *Undeclared.* `button.tsx` imports `radix-ui` for `Slot`, and `registry.json` said only
// `class-variance-authority`. The CLI installs what the item declares and copies the file either
// way, so the consumer ends up with a file importing a package that is not in their tree — and
// the failure is a resolve error at import time, in a file they did not write, naming a package
// they never asked for. `badge` did the same with `class-variance-authority`, and eight of the
// ported web-only shells declared nothing at all.
//
// *Unimported.* The mirror, and the more expensive one, because it succeeds. `calendar` declared
// `date-fns` on both halves; only the native calendar uses it, the web half is `react-day-picker`,
// and so every DOM consumer installed a date library nothing imports. Nothing fails, so nothing
// says so — it is only visible by reading the `package.json` that comes out of an install.
//
// The two registries hold different files for the same item name, so this is asked of each on its
// own, against the `content` that actually shipped. `registry.json` is the union of both halves
// and each registry narrows it; this is the assertion that the narrowing came out exact.
//
// A `.test.ts` is exempt, should one ever ship: the runner it imports is the consumer's to choose,
// and declaring `vitest` would install a test framework into an app that may not use one. None
// does now — `readable-text-color` shipped its tests until the install test put that file in a
// consumer's `lib/`, where their `tsc` failed on a `vitest` import they never asked for.
//
// *Peers.* An import is not the only way a package reaches the consumer. `icons` imports
// `lucide-react-native`, which lists `react-native-svg` as a required *peer* — npm does not
// install a peer, so the item installed into an Expo app that then could not draw a single icon,
// and `icons` is a dependency of most of this registry. `nativewind` did the same with
// `react-native-css` and `tailwindcss`; the first of those is what made the install test's own
// `npx expo install` fail with ERESOLVE before any of this was visible.
//
// So an item also declares the required peers of whatever it declares, and those peers are exempt
// from the "no file imports it" half above — nothing imports `react-native-svg` here, and it still
// has to be in the consumer's tree.
//
// An *optional* peer has to be declared too, which is the part that reads wrong until it bites.
// npm installs an optional peer when it can, and an unpinned one floats to its newest version:
// `radix-ui` optionally peers `@types/react-dom@*`, npm takes 19.3.0, and 19.3.0 requires
// `@types/react@^19.3.0`. An app whose lockfile holds `@types/react` at 19.2.x — which is every
// Expo 57 app with a committed `package-lock.json` — then fails the install outright with
// ERESOLVE, and the half it was failing to install is the `.web.tsx` half that makes Expo Web
// work. Declaring `@types/react-dom@~19.2.0` is what lets `shadcn add` run there without
// `--legacy-peer-deps`.
//
// The tilde is the point and `^19.2.0` does not work: a caret still admits 19.3.0, npm still
// takes it, and the conflict is unchanged. This is a pin on a minor line and it needs moving
// when the Expo SDK's own `@types/react` moves — `npm run registry:check` says so when the peer
// stops resolving, and that is the whole reason this rule reads the real manifests.
//
// It goes in `dependencies`, not `devDependencies`, which is not where it belongs: the shadcn
// CLI builds the Expo path's dev flag as a single malformed argument — `npx expo install
// '-- -D' -- '@types/react-dom@...'` — and `expo install` rejects it, so `devDependencies` does
// not install at all for an Expo consumer. A type package in `dependencies` is inert; a registry
// item that cannot install is not.
//
// It also checks that a package declared by more than one item carries the *same* range in all of
// them. Two items asking for two ranges of one package is a single install whose result depends on
// which item the consumer added last.
//
// ## 8. A shared class constant is applied by the component it is named for
//
// A `-base.ts` is the contract the two platforms implement, and the class constants in it are the
// part of that contract that is a *string* — so misapplying one is not a type error anywhere. It
// shipped: `select.web.tsx`'s `SelectItem` wore `SELECT_ITEM_CLASS`, `SELECT_ITEM_TEXT_CLASS`,
// `SELECT_LABEL_CLASS` **and** `SELECT_SEPARATOR_CLASS`, and since `cn` is tailwind-merge and the
// separator's `h-px` was last, every row in every select menu on the web half was one pixel tall.
//
// Nothing caught it. It typechecks, it builds, both guards above pass, and there is no story
// asserting the height of a menu row — so it reached a consumer, who found it by opening a menu.
// This is the cheapest of the three answers that issue proposed, and it is the one that is an
// invariant rather than a test: the names already say who owns what, and the rule is just that
// they mean it.
//
// ## 9. Every colour class names a token
//
// Tailwind generates a colour utility only for a colour its theme holds, and is silent about one
// it does not: the class stays in the markup, matches no rule, and the element inherits. `button`'s
// `destructive` variant and `toast`'s error tone both wore `text-destructive-foreground` while the
// palette had no `--destructive-foreground`, and the consumer who noticed fixed it by defining the
// token in their own `global.css`. So every `text-*`, `bg-*`, `border-*` (and `ring-*`, `fill-*`,
// `stroke-*`, `outline-*`) colour a registry file spells has to be a token both stylesheets define
// or a colour Tailwind ships. `colour-classes.mjs` reads it out of string literals, not comments.
//
// A part is claimed when a component named for it exists — `SELECT_ITEM_CLASS` is claimed because
// `SelectItem` does, `TOOLTIP_TEXT_CLASS` is not because there is no `TooltipText`. A claimed
// component may apply its own part's constants and any unclaimed one; applying another claimed
// part's is the error. That is what leaves `Switch` free to wear both `SWITCH_TRACK_CLASS` and
// `SWITCH_THUMB_CLASS` — it is one component drawing two parts, and neither part has a component
// of its own to belong to.
//
// ## 10. A published story imports only what a consumer's tree will have
//
// A story item (`button-stories`, derived from `stories/web/published/`) is copied into someone
// else's `components/ui/` and compiled by their Storybook, so every import in it has to resolve
// *there*, in their layout, under the Storybook major they pinned. Each import is one of:
//
// - an `@/` path that some item in the story's own `registryDependencies` closure installs at
//   exactly that path — `@/components/ui/button` because `button` is a `registry:ui` file called
//   `button.tsx`. A path that only resolves in this repo is a resolve error in theirs.
// - `react`, `storybook/test` for the names in `STORY_TEST_API`, or a *type-only* import of
//   `@storybook/react-vite`. Nothing else from Storybook: an addon is the app's choice, and a
//   runtime import of the framework package fails in an app on a different Vite framework where
//   a type import only costs a type.
//
// Never a relative path. That is a local helper — `stories/side-by-side.tsx` is one — which does
// not ship, and would arrive as a dangling import in a file the consumer did not write.
//
// Those Storybook packages are also the only exemption from rule 7: an app that asks for a story
// has Storybook, and declaring it would have the CLI install one over whatever major it pinned.
//
// ## 11. A layout is on both platforms
//
// The layout shells — the chassis, the page header, the page, the split, the card and the dialog —
// are written once in `registry/layout/` and the web half is compiled from them. Before that, the
// web had its own copies and the device had a different `PageHeader` with different props, and the
// two drifted the way any pair kept by hand does. So a native layout item with no web item beside
// it is an error (its compile was refused, and the web registry dropped it without failing), and so
// is a layout in the web `layout` set with no native item, unless it is named in
// `WEB_ONLY` (rule 16) with the reason it cannot be one yet.
//
// ## 12. Nothing re-exports with `export … from`
//
// The shadcn CLI rewrites a file's *import declarations* against the consumer's aliases and leaves
// its *re-export declarations* exactly as written. So `export { PageHeader } from
// "@/components/page-header"` installs pointing wherever this repo happened to keep the file, not
// wherever the consumer's `components.json` puts it — the install succeeds and `tsc` fails
// afterwards, in a file the consumer did not write. It shipped on cubeui (#9, fixed in c2982e4)
// and came back here in `page` and `textarea`. Import the name at the top the way everything else
// is imported and `export { … }` the local binding: the same two lines, and the one that moves is
// the one the CLI knows how to move. Asked of the built `content`, which is what the CLI rewrites.
//
// ## 13. Every import between shipped files resolves where the CLI puts them
//
// The CLI places a file by its *type* — `registry:ui` in the consumer's `components/ui/`,
// `registry:component` in `components/`, `registry:lib` in `lib/` — and rewrites an `@/` alias
// against the consumer's `components.json`. A relative specifier it leaves exactly as written. So
// `compiled/` being flat made `./button` look right: `app-form` imported `./button`, `./checkbox`
// and three more, and installed into `components/` with every one of them in `components/ui/`.
// Thirty-one items shipped like that, and every check above passed, because each is about one file
// or one item and this is about where two of them land relative to each other.
//
// So a shipped file never imports another by a relative path, and every `@/` specifier it holds
// has to be a path that the item itself or something in its `registryDependencies` closure
// installs — `@/components/ui/card` only if a `registry:ui` file called `card.tsx` arrives with the
// install, not merely because one exists somewhere in the repo. Rule 10 is this rule for the story
// items, which have their own package floor on top; this is the same question for everything else.
//
// ## 14. A React Native source names the colour of every border it draws, and of every `Text`
//
// Two things only the compiled DOM half has: a stylesheet's `* { border-color: var(--border) }`
// reaching every element, and colour inherited from the parent. Under react-native-web — an Expo
// web app running the native source — neither holds, and on device neither ever did. React
// Native's default `borderColor` is black and react-native-web's base `View` class sets
// `border: 0 solid black`, which a class beats and a `*` rule does not; and a `Text` there sets its
// own `color`, black. So `card`, the card surface of `section` and `route-error`'s details box all
// drew black borders on Expo web and on device (#78), and `PageHeader`'s title was black on the
// dark theme, because `Platform.select({ web: undefined, … })` left its ink to inheritance on web —
// and `Platform.OS === "web"` is true under react-native-web too.
//
// So in `registry/ui`, `registry/layout` and `registry/lib` (not a `.web.tsx`, which is DOM), a
// class string with a border-width utility — `border`, `border-2`, `border-t` — has to carry a
// `border-*` colour, judged with the class list it is joined into: every string in the same
// `cn(…)`/`cva(…)` call, conditional, array or object. A string whose colour is added where that
// cannot see, like a `-base.ts` constant each half colours from its own state, says so with a
// `@border-colour` comment above it naming where. And no `Platform.select` gives a colour class to
// every platform but web: set it everywhere, which is harmless on the compiled half.
//
// ## 15. A web item wearing the reset's classes depends on the item that installs the reset
//
// `cube-rn-view`, `cube-rn-text` and the rest are defined in `cubeui-reset.css`, which arrives
// with `tokens` and nowhere else. `toast`, `file-picker` and `card` wore them and depended only on
// `utils`, so `shadcn add @cubeui/toast` into a fresh app drew an unstyled block where a flex
// column was meant — no error, since a class that matches nothing is not one (#133).
// `registry.web.json` derives the dependency from the emitted text; this is the assertion, asked
// of the `content` that actually shipped, that the derivation reached every item that needs it.
//
// ## 16. The web-only tier only shrinks
//
// Every item is meant to come from React Native: written once, compiled for the web. The web-only
// tier in `registry.web-only.json` is what predates that, plus the few things React Native cannot
// draw. So each web-only item that ships a file is named in `WEB_ONLY`, below, with the reason it
// has no native half, and one that is not named fails the build — a new web-only item is a decision
// to argue in review, not a file dropped in `registry/web/`. A line whose item is gone from the
// tier fails too, so porting an item and forgetting its line cannot leave room for the next one.
// Rule 11 reads its exceptions from the same list.
//
// Run after `npm run registry:build`.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  tokensIn,
  uncolouredBorders,
  unresolvedColours,
  weblessColours,
} from "./colour-classes.mjs";
import { isSource, packageName, packagesIn } from "./imports.mjs";
import { RESET_CLASS, TOKENS } from "./rn2web/registry.mjs";

// Both built registries. `public/r` is the compiled web half and `public/r/native` the React Native
// one; they hold the same item names on purpose, and the checks below run over each on its own,
// because "no two items claim this basename" is a question about one registry and not about the
// repo. Nesting one inside the other is safe here only because the walk takes `.json` files and
// skips `registry.json`, so `public/r`'s pass never sees the `native/` directory as an item.
const BUILT = ["public/r", "public/r/native"];
const SOURCES = "registry";

// Settled in the README's open decision 1, and asserted here so it cannot drift back. Both
// registries answer to this one string; the consumer's URL behind it is what picks a platform.
const NAMESPACE = "@cubeui";

/**
 * The packages `name` wants alongside itself, and whether each one is optional.
 *
 * Read from this repo's own `node_modules`, which is the only copy of that fact there is — a peer
 * range lives in the dependency's manifest and nowhere in this registry. A package this repo does
 * not have installed is skipped rather than guessed at; it would have to be a devDependency here
 * to typecheck anything that uses it, so in practice the lookup succeeds.
 */
/**
 * Packages the consumer has before it installs anything from here, and which therefore satisfy a
 * peer without any item declaring it.
 *
 * The framework itself — `react` with `react-native` in an Expo app, `react` with `react-dom` in a
 * DOM one — plus the two that arrive inside `expo`. `@expo/metro-config` is a direct dependency of
 * `expo` and brings `lightningcss` with it, which is how `react-native-css` finds both; asking an
 * app to install its own copy of its own bundler's config would be worse than the gap.
 */
const PROVIDED = new Set([
  "react",
  "react-native",
  "react-dom",
  "expo",
  "@expo/metro-config",
  "lightningcss",
  // Any app with a `.tsx` in it already has this, and both an Expo app and a DOM one pin their
  // own — Expo 57 to `~19.2`. Declaring a second range is how the conflict above starts.
  "@types/react",
]);

async function peersOf(name) {
  const manifest = await readFile(`node_modules/${name}/package.json`, "utf8").catch(() => null);
  if (manifest === null) return [];
  const pkg = JSON.parse(manifest);
  const meta = pkg.peerDependenciesMeta ?? {};
  return Object.keys(pkg.peerDependencies ?? {}).map((peer) => ({
    peer,
    optional: Boolean(meta[peer]?.optional),
  }));
}

/**
 * Rule 10's allowlists. `storybook/test` is where Storybook 9 moved `@storybook/test`, and these are
 * the names that have been there, unchanged, since — the floor the story items' descriptions
 * promise. A newer helper is a newer floor, and that is a decision to make on purpose rather than
 * by an import.
 */
const STORY_PACKAGES = new Set(["react", "storybook/test", "@storybook/react-vite"]);
const STORY_TYPE_ONLY = new Set(["@storybook/react-vite"]);
const STORY_TEST_API = new Set([
  "expect",
  "fireEvent",
  "fn",
  "screen",
  "spyOn",
  "userEvent",
  "waitFor",
  "within",
]);
/** Where the CLI puts a file of each type, as the consumer's `@/` alias spells it. */
const INSTALL_ALIAS = {
  "registry:ui": "@/components/ui",
  "registry:component": "@/components",
  "registry:lib": "@/lib",
  "registry:hook": "@/hooks",
};
const isStory = (item) => (item.files ?? []).some((f) => f.path.endsWith(".stories.tsx"));

/**
 * Every path the items named by `dependencies`, and their own dependency closure, install —
 * spelled as the `@/` import that reaches each one in the consumer's tree.
 */
function installedBy(dependencies, items) {
  const reachable = new Set();
  const queue = [...dependencies];
  const visited = new Set();
  while (queue.length > 0) {
    const dep = queue.shift().slice(`${NAMESPACE}/`.length);
    if (visited.has(dep)) continue;
    visited.add(dep);
    const target = items.get(dep);
    if (!target) continue;
    for (const file of target.files ?? []) {
      const alias = INSTALL_ALIAS[file.type];
      if (alias && !file.target) {
        reachable.add(`${alias}/${path.basename(file.path).replace(/\.tsx?$/, "")}`);
      }
    }
    queue.push(...(target.registryDependencies ?? []));
  }
  return reachable;
}

/** The module specifiers a file names: imports, re-exports and `import()` of a string literal. */
function specifiersIn(file) {
  const source = ts.createSourceFile(file.path, file.content ?? "", ts.ScriptTarget.Latest, true);
  const found = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      found.push(node.arguments[0].text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const literal = node.argument.literal;
      if (ts.isStringLiteral(literal)) found.push(literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

/** Rule 13 for one item, against the registry it was built into. */
function placementProblems(built, item, items) {
  const problems = [];
  const reachable = installedBy([`${NAMESPACE}/${item.name}`], items);
  for (const file of item.files ?? []) {
    if (!/\.(tsx?|jsx?|mjs)$/.test(file.path)) continue;
    const where = `${built}: "${item.name}" (${path.basename(file.path)})`;
    for (const spec of specifiersIn(file)) {
      if (spec.startsWith(".")) {
        problems.push(`${where} imports \`${spec}\`, a relative path the CLI will not rewrite`);
      } else if (spec.startsWith("@/") && !reachable.has(spec)) {
        problems.push(
          `${where} imports \`${spec}\`, which neither it nor its registryDependencies install there`,
        );
      }
    }
  }
  return problems;
}

/** Rule 10 for one story item, against the registry it was built into. */
function storyProblems(built, item, items) {
  const problems = [];
  const name = item.name.replace(/-stories$/, "");
  if (!(item.registryDependencies ?? []).includes(`${NAMESPACE}/${name}`)) {
    problems.push(`${built}: "${item.name}" does not depend on \`${NAMESPACE}/${name}\``);
  }

  const reachable = installedBy(item.registryDependencies ?? [], items);

  for (const file of item.files ?? []) {
    const source = ts.createSourceFile(file.path, file.content ?? "", ts.ScriptTarget.Latest);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const spec = statement.moduleSpecifier.text;
      const where = `${built}: "${item.name}" (${path.basename(file.path)})`;

      if (spec.startsWith(".")) {
        problems.push(`${where} imports \`${spec}\`, a local file that does not ship`);
      } else if (spec.startsWith("@/")) {
        if (!reachable.has(spec)) {
          problems.push(
            `${where} imports \`${spec}\`, which nothing in its registryDependencies installs`,
          );
        }
      } else if (!STORY_PACKAGES.has(spec)) {
        problems.push(`${where} imports \`${spec}\`, which a consumer's Storybook may not have`);
      } else if (STORY_TYPE_ONLY.has(spec) && !statement.importClause?.isTypeOnly) {
        problems.push(`${where} imports \`${spec}\` at runtime; only \`import type\` is allowed`);
      } else if (spec === "storybook/test") {
        const bindings = statement.importClause?.namedBindings;
        const names =
          bindings && ts.isNamedImports(bindings)
            ? bindings.elements.map((e) => (e.propertyName ?? e.name).text)
            : ["*"];
        for (const imported of names.filter((n) => !STORY_TEST_API.has(n))) {
          problems.push(`${where} imports \`${imported}\` from storybook/test, outside the floor`);
        }
      }
    }
  }
  return problems;
}

const stories = [];
const collisions = [];
const unreachable = [];
const orphans = [];
const unpinned = [];
const drift = [];
const empties = [];
const mismatched = [];
const ranges = [];
const peerless = [];
const misapplied = [];
const uncoloured = [];
const reexports = [];
const misplaced = [];
const inkless = [];
const resetless = [];
let checked = 0;

/**
 * Rule 12: `export { … } from`, `export type { … } from` and `export * from` a path. A package
 * specifier is exempt — `icons.web.tsx` re-exports straight from `lucide-react` — because the CLI
 * has nothing to rewrite in one and it resolves the same in every tree.
 */
const REEXPORT =
  /^[ \t]*export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s*["'](?:@\/|~\/|\.{1,2}\/)[^"']*["'];?/gm;

/** `input.web.tsx` and `input-base.ts` are both the `input` item. */
function itemName(file) {
  return file
    .replace(/\.(tsx|ts)$/, "")
    .replace(/\.web$/, "")
    .replace(/-base$/, "");
}

/**
 * The names a module exports, values and types together — what a call site can reach through it,
 * which is the thing the two platforms have to agree on.
 *
 * Deliberately a regex pass and not the TypeScript compiler: this guard runs on the *web* half,
 * which imports `@radix-ui/*` and other packages the native side never installs, so anything that
 * resolves modules would need the whole web dependency tree present just to answer a question
 * about names. `export *` is the one form it cannot answer, so it says so rather than passing.
 */
function exportsOf(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const names = new Set();

  if (/^\s*export\s+\*/m.test(code)) return undefined;

  for (const [, name] of code.matchAll(
    /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)\s+(\w+)/gm,
  )) {
    names.add(name);
  }

  for (const [, group] of code.matchAll(/^\s*export\s+(?:type\s+)?\{([^}]*)\}/gm)) {
    for (const entry of group.split(",")) {
      const name = entry
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name.replace(/^type\s+/, ""));
    }
  }

  return names;
}

/**
 * The class constants a `-base.ts` exports, keyed by the part of the component each belongs to.
 *
 * `SELECT_ITEM_CLASS` and `SELECT_ITEM_TEXT_CLASS` are both the `ITEM` part: the second is the
 * text half of the same row, split out because native does not inherit colour. A trailing `_TEXT`
 * is therefore stripped — unless it is the whole remainder, as in `TOOLTIP_TEXT_CLASS`, which
 * names the text of the item itself and not a part called "text".
 */
function classPartsOf(source, item) {
  const prefix = `${item.replace(/-/g, "_").toUpperCase()}_`;
  const parts = new Map();
  for (const [, name] of source.matchAll(/^export const ([A-Z][A-Z0-9_]*_CLASS)\b/gm)) {
    if (!name.startsWith(prefix) && name !== `${prefix.slice(0, -1)}_CLASS`) continue;
    const middle = name.slice(prefix.length, -"_CLASS".length);
    const part = middle.endsWith("_TEXT") ? middle.slice(0, -"_TEXT".length) : middle;
    parts.set(name, part);
  }
  return parts;
}

/** `select` + `ITEM` -> `SelectItem`; `select` + `` -> `Select`. */
function componentFor(item, part) {
  const pascal = (s) =>
    s
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join("");
  return pascal(item) + pascal(part);
}

/**
 * Each top-level declaration in a module, as `name -> its text`.
 *
 * Split on column-zero `function`/`const`, which is what these files look like because biome
 * formats them — a nested declaration is indented and stays inside its parent's slice, which is
 * the behaviour this wants. It is a text scan and not a parse for the same reason `exportsOf`
 * above is: this runs over the web half, whose imports resolve only in a tree the native side
 * does not have.
 */
function declarationsIn(source) {
  const found = [];
  const starts = [...source.matchAll(/^(?:export\s+)?(?:function|const)\s+(\w+)/gm)];
  for (const [index, match] of starts.entries()) {
    const end = starts[index + 1]?.index ?? source.length;
    found.push([match[1], source.slice(match.index, end)]);
  }
  return found;
}

const dirs = (await readdir(SOURCES, { withFileTypes: true })).filter((d) => d.isDirectory());
const seen = new Map();

for (const dir of dirs) {
  const here = path.join(SOURCES, dir.name);
  const files = (await readdir(here)).filter(
    (f) => /\.(tsx|ts)$/.test(f) && !f.endsWith(".test.ts"),
  );

  for (const file of files) {
    const item = itemName(file);
    const previous = seen.get(item);
    if (previous && previous !== dir.name) {
      collisions.push(
        `${SOURCES}/${dir.name}/${file} and ${SOURCES}/${previous}/ both claim "${item}"`,
      );
    }
    seen.set(item, dir.name);
  }

  // Rule 8. A class constant is applied by the component it is named for.
  for (const base of files.filter((f) => f.endsWith("-base.ts"))) {
    const item = itemName(base);
    const parts = classPartsOf(await readFile(path.join(here, base), "utf8"), item);
    if (parts.size === 0) continue;

    const implementations = files.filter(
      (f) => itemName(f) === item && f !== base && f.endsWith(".tsx"),
    );
    const sources = await Promise.all(
      implementations.map(async (f) => [f, await readFile(path.join(here, f), "utf8")]),
    );

    // A part is claimed only where a component of that name exists, on either half.
    const claimed = new Set();
    for (const part of new Set(parts.values())) {
      const component = componentFor(item, part);
      if (sources.some(([, text]) => declarationsIn(text).some(([n]) => n === component))) {
        claimed.add(part);
      }
    }

    for (const [file, text] of sources) {
      for (const [name, body] of declarationsIn(text)) {
        const own = [...claimed].find((part) => componentFor(item, part) === name);
        if (own === undefined) continue;
        for (const [constant, part] of parts) {
          if (part === own || !claimed.has(part)) continue;
          if (!new RegExp(`\\b${constant}\\b`).test(body)) continue;
          misapplied.push(
            `${here}/${file}: \`${name}\` applies \`${constant}\`, which belongs to ` +
              `\`${componentFor(item, part)}\``,
          );
        }
      }
    }
  }

  for (const web of files.filter((f) => f.endsWith(".web.tsx"))) {
    const native = web.replace(/\.web\.tsx$/, ".tsx");
    if (!files.includes(native)) {
      drift.push(`${here}/${web} has no ${native} beside it`);
      continue;
    }

    const [nativeNames, webNames] = await Promise.all(
      [native, web].map(async (f) => exportsOf(await readFile(path.join(here, f), "utf8"))),
    );

    if (!nativeNames || !webNames) {
      drift.push(`${here}/${web}: \`export *\` — the names cannot be compared, so spell them out`);
      continue;
    }

    const missingOnWeb = [...nativeNames].filter((n) => !webNames.has(n));
    const missingOnNative = [...webNames].filter((n) => !nativeNames.has(n));

    if (missingOnWeb.length > 0)
      drift.push(`${here}/${web} is missing: ${missingOnWeb.join(", ")}`);
    if (missingOnNative.length > 0) {
      drift.push(`${here}/${native} is missing: ${missingOnNative.join(", ")}`);
    }
  }
}

// Rule 9. Every colour a registry file names is a token both stylesheets define, or a colour
// Tailwind ships. Recursive, unlike the walk above, because `registry/web/ui` is a source too.
const [nativeTokens, webTokens] = await Promise.all(
  ["dist/tokens.native.css", "dist/tokens.web.css"].map(async (f) =>
    tokensIn(await readFile(f, "utf8")),
  ),
);
const tokens = new Set([...nativeTokens].filter((t) => webTokens.has(t)));
for (const file of await readdir(SOURCES, { recursive: true })) {
  if (!/\.(tsx|ts)$/.test(file)) continue;
  const where = path.join(SOURCES, file);
  for (const cls of unresolvedColours(await readFile(where, "utf8"), tokens, file)) {
    uncoloured.push(`${where}: \`${cls}\``);
  }
}

// Rule 14. What react-native-web and the device do not inherit, a native source names.
const NATIVE_SOURCES = ["ui", "layout", "lib"].map((dir) => path.join(SOURCES, dir));
for (const dir of NATIVE_SOURCES) {
  for (const file of await readdir(dir)) {
    if (!/\.(tsx|ts)$/.test(file) || /\.(web\.tsx|test\.ts)$/.test(file)) continue;
    const where = path.join(dir, file);
    const source = await readFile(where, "utf8");
    for (const one of uncolouredBorders(source, file)) {
      inkless.push(`${where}:${one} draws a border and names no colour for it`);
    }
    for (const one of weblessColours(source, file)) inkless.push(`${where}:${one}`);
  }
}

for (const built of BUILT) {
  const basenames = new Map();
  const pinned = new Map();
  const present = new Set();
  const wanted = [];
  const items = new Map();

  // The index is the registry's own account of what it holds; the item files beside it are what
  // actually gets served. Section 6 is the gap between those two.
  const index = await readFile(path.join(built, "registry.json"), "utf8").catch(() => null);
  const listed = index === null ? null : new Set(JSON.parse(index).items.map((i) => i.name));

  for (const entry of (await readdir(built).catch(() => [])).sort()) {
    if (!entry.endsWith(".json") || entry === "registry.json") continue;

    const where = path.join(built, entry);
    const item = JSON.parse(await readFile(where, "utf8"));
    present.add(item.name);
    items.set(item.name, item);

    if (listed && !listed.has(item.name)) {
      orphans.push(`${where}: "${item.name}" is not in ${built}/registry.json`);
    }

    for (const dependency of item.registryDependencies ?? []) {
      // A full URL resolves on its own and names its own registry. Everything else goes through
      // the consumer's map, including a bare name — which goes through it to ui.shadcn.com.
      if (/^https?:\/\//.test(dependency)) continue;
      wanted.push({ from: item.name, dependency });
    }

    for (const dependency of [...(item.dependencies ?? []), ...(item.devDependencies ?? [])]) {
      // A scoped name is `@scope/name`, so the `@` that separates the range is
      // never the first character.
      if (!dependency.slice(1).includes("@")) {
        unpinned.push(`${item.name} declares \`${dependency}\` with no version range`);
      }
      const name = packageName(dependency);
      const seenRange = pinned.get(name);
      if (seenRange && seenRange.spec !== dependency) {
        ranges.push(
          `${built}: "${seenRange.from}" wants \`${seenRange.spec}\` and ` +
            `"${item.name}" wants \`${dependency}\``,
        );
      } else if (!seenRange) {
        pinned.set(name, { spec: dependency, from: item.name });
      }
    }

    // Rule 7. What the item's own files reach for, against what it tells the CLI to install.
    const imported = new Set();
    for (const file of item.files ?? []) {
      if (!isSource(file.path) || file.path.endsWith(".test.ts")) continue;
      for (const name of packagesIn(file.content ?? "", file.path)) imported.add(name);
    }
    // Rule 7's one exemption: a story's Storybook imports are the app's own, and rule 10 is what
    // narrows them to the ones a consumer is sure to have.
    if (isStory(item)) {
      imported.delete("storybook");
      imported.delete("@storybook/react-vite");
    }
    // `devDependencies` is where an optional peer goes — `@types/react-dom` is not a runtime
    // dependency — so both lists count as "declared" for every question below.
    const declared = [...(item.dependencies ?? []), ...(item.devDependencies ?? [])].map(
      packageName,
    );
    for (const name of imported) {
      if (declared.includes(name)) continue;
      mismatched.push(`${built}: "${item.name}" imports \`${name}\` and does not declare it`);
    }

    // A required peer of something declared belongs in the list too, and is not expected to be
    // imported by anything here — `react-native-svg` is what draws every lucide icon and appears
    // in no source file in this repo.
    const peers = new Set();
    for (const name of declared) {
      for (const { peer, optional } of await peersOf(name)) {
        if (PROVIDED.has(peer)) continue;
        peers.add(peer);
        if (declared.includes(peer)) continue;
        peerless.push(
          `${built}: "${item.name}" declares \`${name}\`, which ` +
            `${optional ? "optionally peers" : "requires"} \`${peer}\` — and it is declared nowhere`,
        );
      }
    }

    for (const name of declared) {
      if (imported.has(name) || peers.has(name)) continue;
      mismatched.push(`${built}: "${item.name}" declares \`${name}\` and no file imports it`);
    }

    for (const file of item.files ?? []) {
      checked += 1;
      if (typeof file.content !== "string" || file.content.trim() === "") {
        empties.push(`${where}: ${file.path ?? "(unnamed file)"} has no content`);
      }

      // The same rule as the source scan above, asked of what actually shipped. It is what the
      // two-registry split exists to keep true, so it is checked on the built output rather than
      // inferred from the fact that the split happened.
      const name = path.basename(file.path);
      const owner = basenames.get(name);
      if (owner && owner !== item.name) {
        collisions.push(`${built}: items "${owner}" and "${item.name}" both ship \`${name}\``);
      }
      basenames.set(name, item.name);

      // Rule 12. A re-export's specifier is one the CLI never rewrites.
      for (const [statement] of (file.content ?? "").matchAll(REEXPORT)) {
        reexports.push(`${where}: ${file.path} — \`${statement.replace(/\s+/g, " ")}\``);
      }
    }

    // Rule 15. The web registry only: the reset exists for the compiled half, and a native source
    // names it in comments that explain why a compiled view is a flex column.
    const wearsReset =
      built === BUILT[0] &&
      (item.files ?? []).some((f) => isSource(f.path) && (f.content ?? "").includes(RESET_CLASS));
    const tokens = `${NAMESPACE}/${TOKENS}`;
    if (wearsReset && item.name !== TOKENS && !item.registryDependencies?.includes(tokens)) {
      resetless.push(
        `${where}: "${item.name}" wears \`${RESET_CLASS}*\`, not depending on ${tokens}`,
      );
    }
  }

  for (const item of items.values()) {
    if (isStory(item)) stories.push(...storyProblems(built, item, items));
    else misplaced.push(...placementProblems(built, item, items));
  }

  for (const { from, dependency } of wanted) {
    if (!dependency.startsWith("@")) {
      unreachable.push(
        `${built}: "${from}" depends on \`${dependency}\` — a bare name, which is ui.shadcn.com's`,
      );
      continue;
    }
    const [namespace, ...rest] = dependency.slice(1).split("/");
    const name = rest.join("/");
    if (namespace !== NAMESPACE.slice(1)) {
      unreachable.push(`${built}: "${from}" depends on \`${dependency}\` — not \`${NAMESPACE}\``);
    } else if (!present.has(name)) {
      unreachable.push(
        `${built}: "${from}" depends on \`${dependency}\`, which ${built} does not hold`,
      );
    }
  }
}

// Rule 11. The layout family is written once, in `registry/layout/`, and the web half is compiled
// from it. Asked of the two built indexes, because the failure is an item present in one and not
// the other: a layout whose compile is refused drops out of the web registry quietly, and a shell
// added to `registry/web/` is a second copy of a thing that should have one.
const LAYOUT_DIR = "registry/layout/";
const LAYOUT_BUNDLE = "layout";
// Rule 16. Every web-only item that ships a file, and why it has no React Native half. Each one is
// a named debt, not a category: when the reason goes, so does the line, and nothing is added
// without one. Rule 11 takes its exceptions from here too.
const WEB_ONLY = {
  "alert-dialog": "only `confirm-button` uses it; goes when that is rebuilt on `ConfirmDialog`",
  "app-form": "the web form layer; to merge into `form`",
  "color-field": "a bound field of `app-form`; to merge into `form`",
  command: "built on `cmdk`, which has no React Native build; a native half is planned",
  "confirm-button": "built on the web-only `alert-dialog`; to be rebuilt on `ConfirmDialog`",
  "date-field": "a bound field of `app-form`; to merge into `form`",
  "disclosure-row":
    "a `<button>` in shadcn's `Item`; to be rebuilt on `Disclosure` and the native `item`",
  "field-row": "part of the web form layer; to merge into `form`",
  "form-field": "part of the web form layer; to merge into `form`",
  "multi-select": "built on the web-only `command`; a native half is planned",
  "multi-select-field": "a bound field over the web-only `multi-select`",
  "password-field": "a bound field of `app-form`; to merge into `form`",
  table: "React Native has no table element; on device the rows are `ListItem`s",
};
const namesIn = async (built) => {
  const text = await readFile(path.join(built, "registry.json"), "utf8").catch(() => null);
  return text === null ? null : JSON.parse(text).items;
};
const webItems = await namesIn(BUILT[0]);
const nativeItems = await namesIn(BUILT[1]);
const oneSided = [];
if (webItems && nativeItems) {
  const onWeb = new Set(webItems.map((i) => i.name));
  const onNative = new Set(nativeItems.map((i) => i.name));
  for (const item of nativeItems) {
    const layout = (item.files ?? []).some((f) => f.path.startsWith(LAYOUT_DIR));
    if (layout && !onWeb.has(item.name)) {
      oneSided.push(`"${item.name}" is a layout on React Native and has no compiled web half`);
    }
  }
  const bundle = webItems.find((i) => i.name === LAYOUT_BUNDLE);
  for (const dependency of bundle?.registryDependencies ?? []) {
    const name = dependency.split("/").pop();
    if (onNative.has(name) || name in WEB_ONLY) continue;
    oneSided.push(`"${name}" is in the web \`${LAYOUT_BUNDLE}\` set and has no React Native half`);
  }
}

const webOnlyText = await readFile("registry.web-only.json", "utf8");
const webOnlyItems = JSON.parse(webOnlyText).items;
const undeclared = [];
const declared = new Set();
for (const item of webOnlyItems) {
  // A bundle ships no file of its own; what it gathers is judged item by item.
  if ((item.files ?? []).length === 0) continue;
  declared.add(item.name);
  if (!(item.name in WEB_ONLY)) {
    undeclared.push(`"${item.name}" is web-only and \`WEB_ONLY\` does not say why`);
  }
}
for (const name of Object.keys(WEB_ONLY)) {
  if (!declared.has(name)) {
    undeclared.push(`"${name}" is named in \`WEB_ONLY\` and is no longer a web-only item`);
  }
}

if (collisions.length > 0) {
  console.error("Two files claim one name:\n");
  for (const collision of collisions) console.error(`  ${collision}`);
  console.error(
    "\nThe CLI resolves a cross-item import by the file's basename, so an import of one is" +
      "\nrewritten to the other. It resolves, to the wrong file, and fails on the members." +
      "\nRename the file — renaming only the item in registry.json does not help.",
  );
}

if (drift.length > 0) {
  console.error(`${collisions.length > 0 ? "\n" : ""}A platform pair has drifted:\n`);
  for (const one of drift) console.error(`  ${one}`);
  console.error(
    "\nBoth halves must export the same names, so no call site has to know which platform it is" +
      "\non. TypeScript will not catch this: it only ever resolves the native file, so the web" +
      "\nhalf ships a missing export and fails at runtime, on web, in whichever app used it first.",
  );
}

if (unpinned.length > 0) {
  console.error(`${collisions.length + drift.length > 0 ? "\n" : ""}An npm dependency is bare:\n`);
  for (const one of unpinned) console.error(`  ${one}`);
  console.error(
    "\nThe CLI runs `npm install <name>`, which takes the latest stable. `nativewind` alone" +
      "\ninstalls 4 into an app whose components are written against 5, and the app fails at" +
      "\nimport time in a file it did not write. Spell the range: `nativewind@^5.0.0-rc.0`.",
  );
}

if (empties.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length > 0 ? "\n" : ""}Built items are missing content:\n`,
  );
  for (const empty of empties) console.error(`  ${empty}`);
  console.error(
    "\nThe file is empty, or registry.json names a path that is not the one holding the text." +
      "\n`shadcn build` writes an empty `content` for an empty file and reports success.",
  );
}

if (unreachable.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length > 0 ? "\n" : ""}A cross-item dependency does not resolve:\n`,
  );
  for (const one of unreachable) console.error(`  ${one}`);
  console.error(
    `\nA \`registryDependencies\` entry resolves against the *consumer's* \`components.json\`, so` +
      `\n${NAMESPACE} has to be the namespace and the item has to be in this registry. Otherwise the` +
      "\ninstall 404s partway through, after files have already been written into their tree — or," +
      "\nfor a bare name, quietly succeeds and brings upstream shadcn's own files in beside ours," +
      "\nimporting `cn` from a package rather than from `@/lib/utils`.",
  );
}

if (orphans.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length > 0 ? "\n" : ""}A built item outlived its registry entry:\n`,
  );
  for (const one of orphans) console.error(`  ${one}`);
  console.error(
    "\n`shadcn build` writes item files and never removes one, so a renamed or deleted item keeps" +
      "\nserving its old self at its old URL forever. The index is right and the orphan collides" +
      "\nwith nothing, so only this says so. Delete it: `git rm` the file named above.",
  );
}

if (mismatched.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length > 0 ? "\n" : ""}An item's dependencies are not the ones its files import:\n`,
  );
  for (const one of mismatched) console.error(`  ${one}`);
  console.error(
    "\nThe CLI installs what the item declares and copies the files either way, so an undeclared" +
      "\nimport reaches the consumer as a resolve error in a file they did not write — and a" +
      "\ndeclared package nothing imports installs silently and forever. `registry.json` is the" +
      "\nunion of both halves; each registry narrows it to the files that registry ships.",
  );
}

if (peerless.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length + mismatched.length > 0 ? "\n" : ""}A required peer reaches no consumer:\n`,
  );
  for (const one of peerless) console.error(`  ${one}`);
  console.error(
    "\nnpm does not install a required peer, and floats an optional one to its newest version." +
      "\n`icons` declared `lucide-react-native` without `react-native-svg`, so it installed into an" +
      "\nExpo app that could then draw no icon at all. `radix-ui` optionally peers `@types/react-dom`," +
      "\nwhose newest wants an `@types/react` ahead of the one Expo pins, which fails the install" +
      "\noutright. Declare it on the item that declares the package — an optional peer in" +
      "\n`devDependencies`, a required one in `dependencies`.",
  );
}

if (ranges.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length + mismatched.length + peerless.length > 0 ? "\n" : ""}One package, two version ranges:\n`,
  );
  for (const one of ranges) console.error(`  ${one}`);
  console.error(
    "\nA consumer installing both items runs one install, and which range wins depends on which" +
      "\nitem they added last. Pick one range and use it in every item that names the package.",
  );
}

if (misapplied.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length + mismatched.length + peerless.length + ranges.length > 0 ? "\n" : ""}A component wears another component's class:\n`,
  );
  for (const one of misapplied) console.error(`  ${one}`);
  console.error(
    "\n`cn` is tailwind-merge, so the last class of a property wins and the extra one is simply" +
      "\nobeyed. This shipped: every row in every web select menu was `h-px` — one pixel tall —" +
      "\nbecause `SelectItem` also wore `SELECT_SEPARATOR_CLASS`. Nothing else here can see it:" +
      "\na class name is a string, and no story asserts the height of a menu row.",
  );
}

if (uncoloured.length > 0) {
  console.error(
    `${collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length + mismatched.length + peerless.length + ranges.length + misapplied.length > 0 ? "\n" : ""}A colour class names no token:\n`,
  );
  for (const one of uncoloured) console.error(`  ${one}`);
  console.error(
    "\nTailwind generates nothing for a colour its theme does not hold, and says nothing either:" +
      "\nthe class stays in the markup and the element inherits. `text-destructive-foreground`" +
      "\nshipped that way on `button` and `toast`. Add the token to `tokens/palette.mjs` and run" +
      "\n`npm run tokens:build`, or use a colour that exists.",
  );
}

if (stories.length > 0) {
  console.error("\nA published story would not compile in the app that installs it:\n");
  for (const one of stories) console.error(`  ${one}`);
  console.error(
    "\nA story item is copied into the consumer's components/ and built by their Storybook, so" +
      "\nevery import has to resolve in their tree: an @/ path an item it depends on installs," +
      "\n`react`, the storybook/test floor, or `import type` from @storybook/react-vite. A local" +
      "\nhelper or an addon import is a resolve error in a file they did not write.",
  );
}

if (oneSided.length > 0) {
  console.error(
    `${stories.length + collisions.length + drift.length + unpinned.length + empties.length + unreachable.length + orphans.length + mismatched.length + peerless.length + ranges.length + misapplied.length + uncoloured.length > 0 ? "\n" : ""}A layout exists on one platform only:\n`,
  );
  for (const one of oneSided) console.error(`  ${one}`);
  console.error(
    "\nThe layout family is written once, in `registry/layout/`, and compiled for the web. A layout" +
      "\nwhose compile was refused drops out of the web registry without failing the build; run" +
      "\n`npm run compile` for the reason. A layout added to `registry/web/` instead is a second" +
      "\ncopy to keep in step — write it in `registry/layout/`, or name why it cannot be in" +
      "\n`WEB_ONLY` in this file.",
  );
}

if (reexports.length > 0) {
  console.error("\nA built file re-exports with `export … from`:\n");
  for (const one of reexports) console.error(`  ${one}`);
  console.error(
    "\nThe shadcn CLI rewrites import declarations against the consumer's aliases and leaves" +
      "\nre-export declarations alone, so this path installs verbatim and points at a file the" +
      "\nconsumer may not have. Import the name at the top and `export { … }` the local binding.",
  );
}

if (misplaced.length > 0) {
  console.error("\nA built file imports something the install will not put where it points:\n");
  for (const one of misplaced) console.error(`  ${one}`);
  console.error(
    "\nThe CLI places each file by its type — `registry:ui` in components/ui/, `registry:component`" +
      "\nin components/, `registry:lib` in lib/ — and rewrites `@/` aliases, never relative paths." +
      "\nImport a sibling as `@/components/ui/<x>`, `@/components/<x>` or `@/lib/<x>` by where *it*" +
      "\nlands, and name the item that ships it in `registryDependencies`.",
  );
}

if (inkless.length > 0) {
  console.error("\nA React Native source leaves a colour to what only the compiled half has:\n");
  for (const one of inkless) console.error(`  ${one}`);
  console.error(
    "\nReact Native's default border colour is black, react-native-web's base `View` class says" +
      "\n`border: 0 solid black`, and a react-native-web `Text` sets its own black `color` — so a" +
      "\nbare `border`, or ink left to inheritance on web, is black on device and on Expo web." +
      "\nAdd `border-border` (or the right token) beside the width, and name a text colour on every" +
      "\nplatform. A colour added in another file is marked with a `@border-colour` comment.",
  );
}

if (resetless.length > 0) {
  console.error("\nA built item wears the reset's classes without installing the reset:\n");
  for (const one of resetless) console.error(`  ${one}`);
  console.error(
    "\n`cube-rn-*` classes are defined in `cubeui-reset.css`, which only `@cubeui/tokens` installs." +
      "\n`deriveWebRegistry` in scripts/rn2web/registry.mjs adds the dependency to every web item" +
      "\nwhose emitted text names one; re-run `npm run build`, or find what bypassed it.",
  );
}

if (undeclared.length > 0) {
  console.error("\nThe web-only tier changed:\n");
  for (const one of undeclared) console.error(`  ${one}`);
  console.error(
    "\nEvery item is written once in React Native and compiled for the web. A new item in" +
      "\n`registry.web-only.json` is one more thing kept by hand on one platform; write it in" +
      "\n`registry/ui` or `registry/layout` instead, or add it to `WEB_ONLY` in this file with the" +
      "\nreason it cannot be, and make that case in review. An item that has gained a native half" +
      "\ntakes its line out of `WEB_ONLY` with it.",
  );
}

if (
  undeclared.length +
    resetless.length +
    inkless.length +
    misplaced.length +
    reexports.length +
    stories.length +
    collisions.length +
    drift.length +
    unpinned.length +
    empties.length +
    unreachable.length +
    orphans.length +
    mismatched.length +
    peerless.length +
    ranges.length +
    misapplied.length +
    uncoloured.length +
    oneSided.length >
  0
) {
  process.exit(1);
}

const pairs = [...seen.keys()].length;
console.log(
  `${checked} built files across ${BUILT.length} registries all carry content and hold distinct ` +
    `basenames within each; ${pairs} items across ${dirs.length} source directories hold distinct ` +
    "names, every platform pair exports the same set, every npm dependency carries a version " +
    `range, every cross-item dependency names ${NAMESPACE} and an item its own registry holds, ` +
    "every built item file is still listed by the index beside it, and every item declares exactly " +
    "the packages its own files import plus their required peers, at one range per package, " +
    "every shared class constant is applied only by the component it is named for, every " +
    "colour class names a token, every published story imports only what the consumer's " +
    "tree will hold, every layout is on both platforms, nothing re-exports with `export … from`, " +
    "every import between shipped files resolves where the CLI installs them, every " +
    "native source names the colour of the borders and text react-native-web would draw black, " +
    "every item wearing the reset's classes depends on the item that installs it, and every " +
    `web-only item is one of the ${Object.keys(WEB_ONLY).length} \`WEB_ONLY\` names, with its reason.`,
);
