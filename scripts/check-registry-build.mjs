// Two things that have to be true before a built registry is installable.
//
// ## 1. No item shares a file basename with a shadcn primitive
//
// The CLI resolves a cross-item import by the source file's *basename*, not by the item name. So
// `control/select.tsx` importing into `form/app-form.tsx` alongside the `select` primitive left
// the consumer with `import { OptionSelect } from "@/components/ui/select"` — a path that
// resolves, to the wrong file, failing on the members three files from the cause (#36). Renaming
// only the item does not help; the file is what the CLI matches on.
//
// `registry/new-york/ui/` is the vendored set, so it *is* the list of names that are taken.
//
// ## 2. Every file in a built registry item arrives with its content in it
//
// `shadcn build` inlines each source file into the item's JSON. A *missing* path fails the build
// loudly — 4.20.1 stops on the ENOENT and names the item. A path that resolves to an **empty**
// file does not: the item is written with `content: ""`, the build says `✔ Building registry`,
// and the only symptom is a consumer installing a file with nothing in it.
//
// That is the failure this guards, and the skill is where it would bite. Its four files are
// prose, so nothing downstream typechecks or imports them; an empty one is only noticed by the
// person it was supposed to help.
//
// Run after `npm run registry:build`.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const BUILT = "public/r";
const SOURCES = "registry/new-york";
const PRIMITIVES = path.join(SOURCES, "ui");

const collisions = [];
const empties = [];
let checked = 0;

const taken = new Set(
  (await readdir(PRIMITIVES)).filter((f) => f.endsWith(".tsx")).map((f) => path.basename(f, ".tsx")),
);

for (const dir of (await readdir(SOURCES, { withFileTypes: true })).filter((d) => d.isDirectory())) {
  if (dir.name === "ui") continue;
  for (const file of await readdir(path.join(SOURCES, dir.name))) {
    const name = file.replace(/\.(tsx|ts)$/, "");
    if (name !== file && taken.has(name)) {
      collisions.push(
        `${SOURCES}/${dir.name}/${file} shares its name with the ${name} primitive`,
      );
    }
  }
}

for (const entry of (await readdir(BUILT)).sort()) {
  if (!entry.endsWith(".json")) continue;

  // The index names the items rather than holding their files.
  if (entry === "registry.json") continue;

  const where = path.join(BUILT, entry);
  const item = JSON.parse(await readFile(where, "utf8"));

  for (const file of item.files ?? []) {
    checked += 1;
    if (typeof file.content !== "string" || file.content.trim() === "") {
      empties.push(`${where}: ${file.path ?? "(unnamed file)"} has no content`);
    }
  }
}

if (collisions.length > 0) {
  console.error("An item shares a file name with a shadcn primitive:\n");
  for (const collision of collisions) console.error(`  ${collision}`);
  console.error(
    "\nThe CLI resolves a cross-item import by the file's basename, so an import of this one is" +
      "\nrewritten to the primitive. It resolves, to the wrong file, and fails on the members." +
      "\nRename the file — renaming only the item in registry.json does not help.",
  );
}

if (empties.length > 0) {
  console.error(`${collisions.length > 0 ? "\n" : ""}Built registry items are missing content:\n`);
  for (const empty of empties) console.error(`  ${empty}`);
  console.error(
    "\nThe file is empty, or registry.json names a path that is not the one holding the text." +
      "\n`shadcn build` writes an empty `content` for an empty file and reports success.",
  );
}

if (collisions.length > 0 || empties.length > 0) process.exit(1);

console.log(
  `${checked} files across ${BUILT} all carry content, ` +
    `and no item shares a name with one of the ${taken.size} primitives.`,
);
