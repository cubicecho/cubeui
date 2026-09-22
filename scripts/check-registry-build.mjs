// Eight things that have to be true before a built registry is installable.
//
// ## 1. No two source files share an item name
//
// The shadcn CLI resolves a cross-item import by the source file's *basename*, not by the item
// name. In cubeui this showed up as `control/select.tsx` importing alongside the vendored `select`
// primitive: the consumer ended up with `import { OptionSelect } from "@/components/ui/select"` —
// a path that resolves, to the wrong file, failing three files from the cause. Renaming only the
// item does not help; the file is what the CLI matches on.
//
// cubeui-rn owns every file it ships, so the rule here is not "does it collide with a vendored
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
// Two ways it goes wrong. A namespace other than `@cubeui` silently asks the consumer to have
// configured a key nobody told them about. And a dependency on an item this registry does not
// hold resolves to a 404 mid-install, after files have already been written. The second is not
// hypothetical: it is what `registry.web.json`'s fixed-point drop exists to prevent, since an item
// whose web half was refused takes its dependents with it, and this is the assertion that the
// drop actually happened.
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
// A `.test.ts` is exempt. `readable-text-color` ships its tests on purpose, and the runner they
// import is the consumer's to choose — declaring `vitest` would install a test framework into an
// app that may not use one.
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
// A part is claimed when a component named for it exists — `SELECT_ITEM_CLASS` is claimed because
// `SelectItem` does, `TOOLTIP_TEXT_CLASS` is not because there is no `TooltipText`. A claimed
// component may apply its own part's constants and any unclaimed one; applying another claimed
// part's is the error. That is what leaves `Switch` free to wear both `SWITCH_TRACK_CLASS` and
// `SWITCH_THUMB_CLASS` — it is one component drawing two parts, and neither part has a component
// of its own to belong to.
//
// Run after `npm run registry:build`.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isSource, packageName, packagesIn } from "./imports.mjs";

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
let checked = 0;

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

for (const built of BUILT) {
  const basenames = new Map();
  const pinned = new Map();
  const present = new Set();
  const wanted = [];

  // The index is the registry's own account of what it holds; the item files beside it are what
  // actually gets served. Section 6 is the gap between those two.
  const index = await readFile(path.join(built, "registry.json"), "utf8").catch(() => null);
  const listed = index === null ? null : new Set(JSON.parse(index).items.map((i) => i.name));

  for (const entry of (await readdir(built).catch(() => [])).sort()) {
    if (!entry.endsWith(".json") || entry === "registry.json") continue;

    const where = path.join(built, entry);
    const item = JSON.parse(await readFile(where, "utf8"));
    present.add(item.name);

    if (listed && !listed.has(item.name)) {
      orphans.push(`${where}: "${item.name}" is not in ${built}/registry.json`);
    }

    for (const dependency of item.registryDependencies ?? []) {
      // A bare name is upstream shadcn's own registry and is not ours to check; a full URL
      // resolves on its own. Only a namespaced one goes through the consumer's map.
      if (!dependency.startsWith("@")) continue;
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
    }
  }

  for (const { from, dependency } of wanted) {
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
      "\ninstall 404s partway through, after files have already been written into their tree.",
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

if (
  collisions.length +
    drift.length +
    unpinned.length +
    empties.length +
    unreachable.length +
    orphans.length +
    mismatched.length +
    peerless.length +
    ranges.length +
    misapplied.length >
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
    "the packages its own files import plus their required peers, at one range per package, and " +
    "every shared class constant is applied only by the component it is named for.",
);
