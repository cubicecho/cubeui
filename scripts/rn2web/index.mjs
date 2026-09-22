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
import { deriveWebRegistry } from "./registry.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(root, "compiled");
const SOURCES = ["registry/ui", "registry/layout"];

/**
 * Web-only items: hand-written DOM components with no React Native half at all.
 *
 * This is the third of the three classes the plan names — universal, native-only, web-only — and it
 * is where cubeui's shells live. `split-layout` is CSS grid tracks driven by a custom property,
 * `page-header` is `max-w-(--breakpoint-2xl)` and `[&_svg]:size-5`; Yoga has no grid and NativeWind
 * has no arbitrary variants, so there is nothing to author natively and nothing for the compiler to
 * transform. They are copied into `compiled/` verbatim, exactly like a `.web.tsx` override.
 *
 * The directory *is* the declaration. A `.web.tsx` inside `registry/ui` or `registry/layout` must
 * have a `.tsx` beside it — that rule is what catches a native half that was deleted or never
 * written — so a web-only item cannot live there without either weakening the rule or carrying a
 * marker field that has to be kept honest. Its own directory needs neither: every file in it is
 * web-only because of where it is.
 */
const WEB_ONLY = "registry/web";

/**
 * `registry/lib` is not a component directory, and only the files in it that reach for React Native
 * need a web half at all. `utils.ts` does: `HOVER_REVEAL` is gated on `Platform.OS`, which folds to
 * a constant here and takes the `react-native` import with it. The rest — `color.ts`,
 * `readable-text-color.ts` — is arithmetic on strings and installs unchanged on both platforms,
 * which is why this is a list and not a directory scan.
 */
const LIB = ["registry/lib/utils.ts"];

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
  for (const rel of LIB) {
    const file = basename(rel);
    found.push({ name: basename(file, ".ts"), kind: "compile", rel, out: file });
  }
  // `registry/web/ui` mirrors `registry:ui` vs `registry:component`, which is what decides whether
  // the CLI installs to `components/ui/` or `components/`. cubeui's consumers already have these
  // files at those paths, so the split is preserved rather than flattened: moving `item` out of
  // `components/ui/` would be a breaking change dressed up as tidying. Output is flat either way —
  // `compiled/` holds one file per item and the basename check is what guards that.
  for (const dir of [WEB_ONLY, `${WEB_ONLY}/ui`]) {
    for (const file of readdirSync(join(root, dir)).sort()) {
      if (!file.endsWith(".tsx")) continue;
      found.push({
        name: basename(file, ".tsx"),
        kind: "passthrough",
        rel: `${dir}/${file}`,
        out: file,
      });
    }
  }
  for (const dir of SOURCES) {
    for (const file of readdirSync(join(root, dir)).sort()) {
      if (!file.endsWith(".tsx")) continue;
      if (file.endsWith(".web.tsx")) {
        found.push({
          name: basename(file, ".web.tsx"),
          kind: "passthrough",
          rel: `${dir}/${file}`,
          out: `${basename(file, ".web.tsx")}.tsx`,
        });
        continue;
      }
      const name = basename(file, ".tsx");
      // An item with a hand-written web half never reaches the transform. `select.web.tsx` is a
      // Radix anchored popper and `select.tsx` is a native `Modal` sheet; there is no transform
      // between those two, and pretending otherwise is what would sink this.
      if (existsSync(join(root, dir, `${name}.web.tsx`))) continue;
      found.push({ name, kind: "compile", rel: `${dir}/${file}`, out: file });
    }
  }
  return found;
}

function emit(item, tree) {
  const text = readFileSync(join(root, item.rel), "utf8");
  const args = {
    filePath: item.rel,
    text,
    compiledNames: tree,
    neutralNames: NEUTRAL,
  };
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

  const out = new Map(all.map((i) => [i.name, i.out]));
  const emitted = new Map(
    [...results]
      .filter(([, r]) => r.code !== null)
      .map(([name, r]) => [out.get(name), format(r.code, `compiled/${out.get(name)}`)]),
  );
  return { emitted, refusals, all };
}

const check = process.argv.includes("--check");
const { emitted, refusals, all } = assemble();

let drift = 0;
for (const [file, code] of emitted) {
  const out = join(OUT, file);
  if ((existsSync(out) ? readFileSync(out, "utf8") : null) === code) continue;
  drift += 1;
  if (check) console.error(`  drift: compiled/${file} is not what its source compiles to`);
  else writeFileSync(out, code);
}

// A `.tsx` in compiled/ with no item behind it any more: the source was deleted or renamed, or it
// started refusing. Stale output keeps shipping from the registry, so it is removed rather than
// reported — except under `--check`, where removing it would be the thing being checked for.
const stale = readdirSync(OUT)
  .filter((f) => /\.tsx?$/.test(f) && !emitted.has(f))
  .sort();
for (const file of stale) {
  if (check) console.error(`  stale: compiled/${file} has no item behind it`);
  else unlinkSync(join(OUT, file));
}

// The second registry, derived from the first rather than kept beside it. See `registry.mjs` for
// why there are two and why the item names are the same in both.
const WEB_REGISTRY = join(root, "registry.web.json");
const source = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const webOnly = JSON.parse(readFileSync(join(root, "registry.web-only.json"), "utf8"));
const { registry: web, dropped } = deriveWebRegistry(source, webOnly, emitted);
// Through biome for the same reason the `.tsx` output is: `--check` has to compare what this writes
// against what the repo's formatter would leave behind, or every file drifts the moment it is
// tidied.
const webJson = format(`${JSON.stringify(web, null, 2)}\n`, "registry.web.json");
if ((existsSync(WEB_REGISTRY) ? readFileSync(WEB_REGISTRY, "utf8") : null) !== webJson) {
  drift += 1;
  if (check) console.error("  drift: registry.web.json is not what registry.json derives to");
  else writeFileSync(WEB_REGISTRY, webJson);
}

for (const { name, kind, rel, diagnostics } of refusals) {
  console.error(
    `\n${name} — no web half (${rel}${kind === "passthrough" ? ", hand-written" : ""})`,
  );
  for (const d of diagnostics) console.error(`  ${d.file}:${d.line}  ${d.message}`);
}

const byKind = (k) => all.filter((i) => i.kind === k && emitted.has(i.out)).length;
console.log(
  `\ncompiled/: ${emitted.size} of ${all.length} items — ` +
    `${byKind("compile")} transformed, ${byKind("passthrough")} hand-written, ` +
    `${refusals.length} refused${check ? `, ${drift} drifted, ${stale.length} stale` : ""}.`,
);
console.log(
  `registry.web.json: ${web.items.length} of ${source.items.length + webOnly.items.length} items` +
    `${dropped.length ? ` — no web half for ${dropped.join(", ")}` : ""}.`,
);

if (check && (drift || stale.length)) process.exit(1);
