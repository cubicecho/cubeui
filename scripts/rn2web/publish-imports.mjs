#!/usr/bin/env node
/**
 * After `shadcn build`: every relative import between shipped files becomes the `@/` alias for
 * where the target file is *installed*.
 *
 *   compiled/app-form.tsx     `from "./button"`  ->  `from "@/components/ui/button"`
 *   compiled/card-layout.tsx  `from "./card"`    ->  `from "@/components/ui/card"`
 *
 * `compiled/` is flat, and inside this repo `./button` is the right spelling for it — the compiler
 * writes it so that a compiled file never resolves a sibling through a tsconfig that means the
 * React Native half (see `rewriteSpecifiers` in `compile.mjs`). A consumer's tree is not flat. The
 * shadcn CLI places each file by its type — `registry:ui` in `components/ui/`, `registry:component`
 * in `components/`, `registry:lib` in `lib/` — and rewrites an `@/` alias against the consumer's
 * `components.json`, but leaves a relative specifier exactly as written. So `app-form`, a
 * `registry:component`, installed importing a `./button` that had landed one directory down, and
 * thirty other items shipped the same way. The alias is what the CLI knows how to move.
 *
 * The target's type is read from the built registry itself, by basename — the same key the CLI
 * resolves a cross-item import by, and one `registry:check` rule 1 already holds unique. A `./x`
 * naming no shipped file is left alone, so rule 13 fails on it by name rather than this guessing.
 *
 * Usage: `node scripts/rn2web/publish-imports.mjs public/r [public/r/native …]`
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Where the CLI puts a file of each type, as the consumer's `@/` alias spells it. */
const INSTALL_ALIAS = {
  "registry:ui": "@/components/ui",
  "registry:component": "@/components",
  "registry:lib": "@/lib",
  "registry:hook": "@/hooks",
};

/** `from "./x"`, `import "./x"` and `import("./x")` — the forms a specifier takes in these files. */
const RELATIVE = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])\.\/([^"'/]+)\2/g;

const stem = (file) => path.basename(file).replace(/\.(tsx?|jsx?)$/, "");

async function publish(dir) {
  const entries = (await readdir(dir)).filter((e) => e.endsWith(".json") && e !== "registry.json");
  const items = await Promise.all(
    entries.map(async (entry) => {
      const where = path.join(dir, entry);
      return { where, item: JSON.parse(await readFile(where, "utf8")) };
    }),
  );

  const aliasOf = new Map();
  for (const { item } of items) {
    for (const file of item.files ?? []) {
      const alias = INSTALL_ALIAS[file.type];
      if (alias && !file.target) aliasOf.set(stem(file.path), alias);
    }
  }

  let rewritten = 0;
  for (const { where, item } of items) {
    let changed = false;
    for (const file of item.files ?? []) {
      if (typeof file.content !== "string") continue;
      const next = file.content.replace(RELATIVE, (whole, lead, quote, name) => {
        const alias = aliasOf.get(stem(name));
        if (!alias) return whole;
        rewritten += 1;
        return `${lead}${quote}${alias}/${stem(name)}${quote}`;
      });
      if (next !== file.content) {
        file.content = next;
        changed = true;
      }
    }
    // `shadcn build`'s own layout: two-space JSON, no trailing newline.
    if (changed) await writeFile(where, JSON.stringify(item, null, 2));
  }
  console.log(`${dir}: ${rewritten} relative imports rewritten to their install alias.`);
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("usage: publish-imports.mjs <built registry dir>…");
  process.exit(2);
}
for (const dir of dirs) await publish(dir);
