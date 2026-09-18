#!/usr/bin/env node
/**
 * `npm run compile` — assemble the whole web tree in `compiled/`, and say why for whatever is left.
 *
 * The output is not "the components the compiler managed to do". It is **the complete web half of
 * the registry**, from two sources:
 *
 *   compiled     `registry/ui/card.tsx`      -> `compiled/card.tsx`      by the transform
 *   passthrough  `registry/ui/select.web.tsx` -> `compiled/select.tsx`   by copying
 *
 * Both are needed for either to be useful, because a compiled item that imports `@/components/ui/
 * select` has to reach a web `select`, and `select` is one of the twelve items that was always
 * going to be hand-written. Level 4 of the plan is not a fallback bolted on next to the compiler;
 * it is half of what makes the compiler's output a tree rather than a pile.
 *
 * "Say why for the rest" is the other half of the output, and not a consolation prize. An item the
 * compiler refuses has been told, with a file and a line, which of the plan's four levels it
 * belongs to — and the answer is usually "write the branch out", which improves the React Native
 * source too.
 *
 * Compilability is transitive — a compiled tree cannot reach back into a React Native component —
 * so the set is a fixed point: try everything, drop what refused, try again until a round changes
 * nothing.
 *
 * `--check` re-compiles without writing and exits non-zero on drift, the same guard shape as
 * `tokens:check` and `git diff --exit-code -- public/r`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileSource, passthroughSource } from "./compile.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(root, "compiled");
const SOURCES = ["registry/ui", "registry/layout"];

/**
 * Biome, as a filter.
 *
 * The emitted text is correct and badly laid out — a transform that inserted an argument into a
 * `cn()` call has no opinion about where the line should break. Formatting here rather than in a
 * follow-up `biome check --write` is what lets `--check` compare like with like: otherwise every
 * file would "drift" the moment the linter tidied it.
 */
function format(code, path) {
  return execFileSync("npx", ["biome", "check", "--write", `--stdin-file-path=${path}`], {
    cwd: root,
    input: code,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

/**
 * The `-base.ts` files: shared types and shared class-name constants, implemented by both halves.
 * They are platform-neutral by construction, so they have no web half and their specifiers are
 * left alone.
 */
function neutral() {
  const names = new Set();
  for (const dir of SOURCES) {
    for (const file of readdirSync(join(root, dir))) {
      if (file.endsWith(".ts") && !file.endsWith(".test.ts")) names.add(basename(file, ".ts"));
    }
  }
  return names;
}

const NEUTRAL = neutral();

/** Every item that has, or could have, a web half — and which of the two it gets it from. */
function items() {
  const found = [];
  for (const dir of SOURCES) {
    for (const file of readdirSync(join(root, dir)).sort()) {
      if (!file.endsWith(".tsx")) continue;
      if (file.endsWith(".web.tsx")) {
        found.push({
          name: basename(file, ".web.tsx"),
          kind: "passthrough",
          rel: `${dir}/${file}`,
        });
        continue;
      }
      const name = basename(file, ".tsx");
      // An item with a hand-written web half never reaches the transform. `select.web.tsx` is a
      // Radix anchored popper and `select.tsx` is a native `Modal` sheet; there is no transform
      // between those two, and pretending otherwise is what would sink this.
      if (existsSync(join(root, dir, `${name}.web.tsx`))) continue;
      found.push({ name, kind: "compile", rel: `${dir}/${file}` });
    }
  }
  return found;
}

function emit(item, tree) {
  const text = readFileSync(join(root, item.rel), "utf8");
  const args = { filePath: item.rel, text, compiledNames: tree, neutralNames: NEUTRAL };
  return item.kind === "compile" ? compileSource(args) : passthroughSource(args);
}

function assemble() {
  const all = items();
  let tree = new Set(all.map((i) => i.name));
  let results = new Map();

  for (;;) {
    results = new Map();
    for (const item of all) {
      if (!tree.has(item.name)) continue;
      results.set(item.name, emit(item, tree));
    }
    const failed = [...results].filter(([, r]) => r.code === null).map(([name]) => name);
    if (failed.length === 0) break;
    const next = new Set([...tree].filter((n) => !failed.includes(n)));
    if (next.size === tree.size) break;
    tree = next;
  }

  // One last round for whatever was dropped, so its diagnostics are its own reason rather than
  // "a sibling was dropped in the round before this one".
  const refusals = [];
  for (const item of all) {
    if (results.get(item.name)?.code != null) continue;
    refusals.push({ ...item, diagnostics: emit(item, tree).diagnostics });
  }

  const emitted = new Map(
    [...results]
      .filter(([, r]) => r.code !== null)
      .map(([name, r]) => [name, format(r.code, `compiled/${name}.tsx`)]),
  );
  return { emitted, refusals, all };
}

const check = process.argv.includes("--check");
const { emitted, refusals, all } = assemble();

let drift = 0;
for (const [name, code] of emitted) {
  const out = join(OUT, `${name}.tsx`);
  if ((existsSync(out) ? readFileSync(out, "utf8") : null) === code) continue;
  drift += 1;
  if (check) console.error(`  drift: compiled/${name}.tsx is not what its source compiles to`);
  else writeFileSync(out, code);
}

// A `.tsx` in compiled/ with no item behind it any more: the source was deleted or renamed, or it
// started refusing. Stale output keeps shipping from the registry, so it is removed rather than
// reported — except under `--check`, where removing it would be the thing being checked for.
const stale = readdirSync(OUT)
  .filter((f) => f.endsWith(".tsx") && !emitted.has(basename(f, ".tsx")))
  .sort();
for (const file of stale) {
  if (check) console.error(`  stale: compiled/${file} has no item behind it`);
  else unlinkSync(join(OUT, file));
}

for (const { name, kind, rel, diagnostics } of refusals) {
  console.error(
    `\n${name} — no web half (${rel}${kind === "passthrough" ? ", hand-written" : ""})`,
  );
  for (const d of diagnostics) console.error(`  ${d.file}:${d.line}  ${d.message}`);
}

const byKind = (k) => all.filter((i) => i.kind === k && emitted.has(i.name)).length;
console.log(
  `\ncompiled/: ${emitted.size} of ${all.length} items — ` +
    `${byKind("compile")} transformed, ${byKind("passthrough")} hand-written, ` +
    `${refusals.length} refused${check ? `, ${drift} drifted, ${stale.length} stale` : ""}.`,
);

if (check && (drift || stale.length)) process.exit(1);
