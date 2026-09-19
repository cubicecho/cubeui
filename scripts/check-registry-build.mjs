// Six things that have to be true before a built registry is installable.
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
// Run after `npm run registry:build`.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Both built registries. `public/r` is the React Native half and `public/web` the compiled one;
// they hold the same item names on purpose, and the checks below run over each on its own, because
// "no two items claim this basename" is a question about one registry and not about the repo.
const BUILT = ["public/r", "public/web"];
const SOURCES = "registry";

// Settled in the README's open decision 1, and asserted here so it cannot drift back. Both
// registries answer to this one string; the consumer's URL behind it is what picks a platform.
const NAMESPACE = "@cubeui";

const collisions = [];
const unreachable = [];
const orphans = [];
const unpinned = [];
const drift = [];
const empties = [];
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

    for (const dependency of item.dependencies ?? []) {
      // A scoped name is `@scope/name`, so the `@` that separates the range is
      // never the first character.
      if (!dependency.slice(1).includes("@")) {
        unpinned.push(`${item.name} declares \`${dependency}\` with no version range`);
      }
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

if (
  collisions.length +
    drift.length +
    unpinned.length +
    empties.length +
    unreachable.length +
    orphans.length >
  0
) {
  process.exit(1);
}

const pairs = [...seen.keys()].length;
console.log(
  `${checked} built files across ${BUILT.length} registries all carry content and hold distinct ` +
    `basenames within each; ${pairs} items across ${dirs.length} source directories hold distinct ` +
    "names, every platform pair exports the same set, every npm dependency carries a version " +
    `range, every cross-item dependency names ${NAMESPACE} and an item its own registry holds, and ` +
    "every built item file is still listed by the index beside it.",
);
