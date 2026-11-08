#!/usr/bin/env node
/**
 * The props tables in the skill, from the TSDoc on each component's props type.
 *
 * The skill taught props by example, and an agent could not confirm from an example what a prop
 * it had not seen used does (#387). The TSDoc on the props types already says, in the registry's
 * own voice, so the tables are read from it rather than written a second time: a table that is
 * copied by hand is wrong the first time a prop is added.
 *
 * A table is asked for in a skill file with a pair of markers, and this fills what is between:
 *
 *     <!-- props:CardLayout -->
 *     <!-- /props -->
 *
 * The component is found by its export in `registry/` (the native source first, then the
 * web-only tier) and its props are the first parameter of its call signature, resolved by the
 * TypeScript compiler against the tsconfig that file is checked under. What makes a row is
 * `props-tables.mjs`.
 *
 * `--check` fails when a committed table is not what this generates. Both modes fail on a row
 * typed `never` or `keyof typeof …`: a table that says a prop cannot be passed, or names a
 * constant the reader cannot see, is what #463 found in five of them. Both fail on a row with no
 * description too, which #492 found in a hundred.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { misleadingRows, propsRows, renderTable, undocumentedRows } from "./props-tables.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "skill");

const MARKER = /<!-- props:([A-Za-z]+) -->\n[\s\S]*?<!-- \/props -->/g;

/** Where a component is looked for, in order: a native source wins over the web-only tier. */
const SOURCES = [
  { dir: "registry/layout", config: "tsconfig.json" },
  { dir: "registry/ui", config: "tsconfig.json" },
  { dir: "registry/web", config: "tsconfig.web.json" },
  { dir: "registry/web/ui", config: "tsconfig.web.json" },
];

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

/**
 * The file that exports `name` as a component, and the tsconfig it is checked under. Within a
 * directory, a file that declares it wins over one that only lists it in an `export { … }`,
 * because an old item kept for a release re-exports the names of the one that replaced it
 * (`description-list` re-exports `PropertyRow`); a component declared unexported and listed at
 * the end (`sidebar`) is still found.
 */
function findComponent(name) {
  const declares = new RegExp(`export (function|const) ${name}\\b`);
  const lists = new RegExp(`export \\{[^}]*\\b${name}\\b`);
  for (const { dir, config } of SOURCES) {
    const files = readdirSync(join(ROOT, dir)).filter(
      (file) => /\.tsx?$/.test(file) && /\.(web|test|stories)\./.test(file) === false,
    );
    for (const pattern of [declares, lists]) {
      for (const file of files) {
        const path = join(ROOT, dir, file);
        if (pattern.test(readFileSync(path, "utf8"))) {
          return { path, config };
        }
      }
    }
  }
  throw new Error(`No file in registry/ exports a component named ${name}.`);
}

/**
 * One program per tsconfig, over every file a table needs: a program per component costs the
 * standard library's types each time.
 */
const programs = new Map();
function programFor(config, rootNames) {
  if (programs.has(config) === false) {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      join(ROOT, config),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
          throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
        },
      },
    );
    programs.set(config, ts.createProgram(rootNames, { ...parsed.options, noEmit: true }));
  }
  return programs.get(config);
}

const misleading = [];
const undocumented = [];
function propsTable(name, roots) {
  const { path, config } = findComponent(name);
  const rows = propsRows(programFor(config, roots.get(config)), path, name, ROOT);
  for (const row of misleadingRows(rows.own)) {
    misleading.push(`${name}'s \`${row.name}\` is typed \`${row.type}\``);
  }
  for (const row of undocumentedRows(rows.own)) {
    undocumented.push(`${name}'s \`${row.name}\` (${row.at})`);
  }
  return renderTable(name, path, ROOT, rows);
}

const checking = process.argv.includes("--check");
const files = markdownFiles(SKILL).map((file) => ({ file, text: readFileSync(file, "utf8") }));
const roots = new Map();
for (const { text } of files) {
  for (const [, name] of text.matchAll(MARKER)) {
    const { path, config } = findComponent(name);
    roots.set(config, [...(roots.get(config) ?? []), path]);
  }
}

const stale = [];
let tables = 0;
for (const { file, text } of files) {
  const next = text.replace(MARKER, (_whole, name) => {
    tables += 1;
    return `<!-- props:${name} -->\n${propsTable(name, roots)}\n<!-- /props -->`;
  });
  if (next !== text) {
    if (checking) {
      stale.push(relative(ROOT, file));
    } else {
      writeFileSync(file, next);
    }
  }
}

if (misleading.length > 0) {
  console.error(
    `${misleading.join(".\n")}.\n` +
      "A row typed `never` is a prop no member of the props type allows: take it out, or allow\n" +
      "it in a member. A `keyof typeof` left in a row is one the checker could not spell out:\n" +
      "write the type as its values.",
  );
  process.exit(1);
}
if (undocumented.length > 0) {
  console.error(
    `${undocumented.join(",\n")}\nhave no TSDoc, so their rows say nothing.\n` +
      "Write each one's first paragraph for a reader choosing the prop. A prop declared in a\n" +
      "shared type is documented there, once for every component that takes it.",
  );
  process.exit(1);
}
if (stale.length > 0) {
  console.error(
    `The props tables in ${stale.join(", ")} are not what the TSDoc generates.\n` +
      "A prop was added, renamed or re-described without rebuilding them.\n" +
      "Run `npm run skill:build`.",
  );
  process.exit(1);
}
console.log(`${tables} props tables ${checking ? "match the TSDoc" : "written"}.`);
