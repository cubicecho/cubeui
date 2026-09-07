// Every file in a built registry item has to arrive with its content in it.
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

const problems = [];
let checked = 0;

for (const entry of (await readdir(BUILT)).sort()) {
  if (!entry.endsWith(".json")) continue;

  // The index names the items rather than holding their files.
  if (entry === "registry.json") continue;

  const where = path.join(BUILT, entry);
  const item = JSON.parse(await readFile(where, "utf8"));

  for (const file of item.files ?? []) {
    checked += 1;
    if (typeof file.content !== "string" || file.content.trim() === "") {
      problems.push(`${where}: ${file.path ?? "(unnamed file)"} has no content`);
    }
  }
}

if (problems.length > 0) {
  console.error("Built registry items are missing content:\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nThe file is empty, or registry.json names a path that is not the one holding the text." +
      "\n`shadcn build` writes an empty `content` for an empty file and reports success.",
  );
  process.exit(1);
}

console.log(`${checked} files across ${BUILT} all carry content.`);
