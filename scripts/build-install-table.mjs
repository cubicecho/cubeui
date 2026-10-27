#!/usr/bin/env node
/**
 * `skill/install-paths.md`: where every registry item lands and what to import from it.
 *
 * An agent building one card guessed `@/components/card-layout`, `@/components/confirm-button`
 * and the rest (#387). The guesses were right, and they were guesses: the rule is in
 * `registry.json` (each file's `type`) and `components.json` (the aliases each type lands under),
 * and nothing wrote it down. Items that ship several files (`badge-base.ts`, `badge.tsx`,
 * `badge.web.tsx`) left it unclear which one to import.
 *
 * **Generated, not written**, for the reason `public/index.html` is: a hand-kept list is wrong
 * the first time an item is added. The native half is `registry.json` and the web half
 * `registry.web.json` (itself generated from `registry.json` and `registry.web-only.json`), the
 * two that `registry:build` turns into `r/native/` and `r/`. The exports are read from each entry
 * file with the TypeScript compiler, so the import line names what the file really exports.
 * `--check` fails when the committed table is not what this generates.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const OUT = new URL("skill/install-paths.md", root);

const native = JSON.parse(read("registry.json"));
const web = JSON.parse(read("registry.web.json"));
const { aliases } = JSON.parse(read("components.json"));

/** Where a file of each type lands, as shadcn resolves it from the consumer's aliases. */
const DIRECTORY = {
  "registry:ui": aliases.ui,
  "registry:component": aliases.components,
  "registry:lib": aliases.lib,
};

/** More than this many exports and the import line names the first few and counts the rest. */
const MAX_NAMES = 6;

/** `@/components/ui` → `components/ui`: the path in a project whose `@` is its source root. */
const onDisk = (alias) => alias.replace(/^@\//, "");

const stem = (path) => basename(path).replace(/(\.web)?\.(tsx|ts)$/, "");

/** A `-base.ts` or a `.web.tsx` is a half or a shared part: imported through its entry, never by name. */
const isPart = (path) => /-base\.ts$/.test(path) || /\.web\.tsx$/.test(path);

/** The value exports of one file: components, hooks, functions and constants. Types are left out. */
function valueExports(path) {
  if (existsSync(new URL(path, root)) === false) {
    return [];
  }
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, false);
  const names = [];
  const exported = (node) =>
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly || statement.exportClause === undefined) {
        continue;
      }
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (element.isTypeOnly === false) {
            names.push(element.name.text);
          }
        }
      }
      continue;
    }
    if (exported(statement) === false) {
      continue;
    }
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      if (statement.name) {
        names.push(statement.name.text);
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.push(declaration.name.text);
        }
      }
    } else if (ts.isEnumDeclaration(statement)) {
      names.push(statement.name.text);
    }
  }
  return names;
}

/** One half of one item, as the table needs it. */
function describe(item, sourceOf) {
  if (item.files.length === 0) {
    return {
      key: "set",
      lands: `a set: ${item.registryDependencies.map((d) => `\`${d.replace("@cubeui/", "")}\``).join(", ")}`,
      imports: "— (import from each item)",
    };
  }
  const targeted = item.files.filter((file) => file.target);
  const placed = item.files
    .filter((file) => file.target === undefined)
    .map((file) => ({
      file,
      dest: `${onDisk(DIRECTORY[file.type])}/${basename(file.path)}`,
      specifier: `${DIRECTORY[file.type]}/${stem(file.path)}`,
    }));
  const entries = placed.filter((p) => isPart(p.file.path) === false);
  const named = entries.filter((p) => stem(p.file.path) === item.name);
  const main = named.length > 0 ? named : entries;
  const rest = [
    ...placed.filter((p) => main.includes(p) === false).map((p) => `\`${basename(p.dest)}\``),
    ...targeted.map((file) => `\`${file.target.replace(/^~\//, "")}\``),
  ];
  const landsAt = [
    ...main.map((p) => `\`${p.dest}\``),
    ...targeted
      .slice(0, main.length === 0 ? 1 : 0)
      .map((f) => `\`${f.target.replace(/^~\//, "")}\``),
  ];
  const lands =
    landsAt.join(", ") +
    (rest.length > (main.length === 0 ? 1 : 0)
      ? `; also ${rest.slice(main.length === 0 ? 1 : 0).join(", ")}`
      : "");

  const imports =
    main.length === 0
      ? "— (a stylesheet: see `tokens` above)"
      : main
          .map((p) => {
            if (/\.stories\.tsx$/.test(p.file.path)) {
              return "— (stories)";
            }
            const names = valueExports(sourceOf(p.file.path));
            const shown = names.slice(0, MAX_NAMES).join(", ");
            const more = names.length > MAX_NAMES ? `, … ${names.length - MAX_NAMES} more` : "";
            return names.length === 0
              ? `\`import "${p.specifier}"\``
              : `\`import { ${shown}${more} } from "${p.specifier}"\``;
          })
          .join("<br>");
  return { key: `${lands}|${imports}`, lands, imports };
}

/**
 * The web registry ships `compiled/x.tsx` where the native one ships `registry/…/x.tsx`. Both
 * export the same names (`registry:check` rule 2), so read the source rather than its output.
 */
const nativeSource = (path) => path;
const webSource = (path) => {
  if (path.startsWith("compiled/")) {
    const name = basename(path);
    for (const dir of ["registry/ui/", "registry/layout/"]) {
      if (existsSync(new URL(dir + name, root))) {
        return dir + name;
      }
    }
  }
  return path;
};

const byName = new Map();
for (const [half, registry, sourceOf] of [
  ["web", web, webSource],
  ["native", native, nativeSource],
]) {
  for (const item of registry.items) {
    const halves = byName.get(item.name) ?? [];
    halves.push({ half, ...describe(item, sourceOf) });
    byName.set(item.name, halves);
  }
}

const escapePipes = (cell) => cell.replace(/\|/g, "\\|");

function rows() {
  const out = [];
  for (const name of [...byName.keys()].sort()) {
    const halves = byName.get(name);
    const same = halves.length === 2 && halves[0].key === halves[1].key;
    const groups = same ? [{ ...halves[0], half: "both" }] : halves;
    for (const group of groups) {
      out.push(
        `| \`${name}\` | ${group.half} | ${escapePipes(group.lands)} | ${escapePipes(group.imports)} |`,
      );
    }
  }
  return out;
}

function page() {
  const table = rows();
  return `# Install paths and imports

<!-- Generated by scripts/build-install-table.mjs from registry.json, registry.web.json and
components.json. Do not edit: run \`npm run skill:build\`. -->

Part of the cubeui skill. Every item in the registry: which half it is on, where
\`npx shadcn@latest add @cubeui/<item>\` puts it, and the line that imports it. Read
[SKILL.md](SKILL.md) for which item a shape needs; this file is only where it lands.

**The rule.** A file lands by its type, under the project's own aliases in \`components.json\`.
The paths below are for the stock aliases; the CLI rewrites every import to the project's own:

| File type | Lands in | Import from |
| --- | --- | --- |
${Object.entries(DIRECTORY)
  .map(([type, alias]) => `| \`${type}\` | \`${onDisk(alias)}/<file>\` | \`${alias}/<file>\` |`)
  .join("\n")}

- **On** is the half the item installs on: \`web\` (\`r/{name}.json\`), \`native\`
  (\`r/native/{name}.json\`) or \`both\`. An item on one half only is a 404 on the other.
- **An item of several files** is imported from its entry, the file named after the item. A
  \`-base.ts\` holds what the halves share and a \`.web.tsx\` is the DOM half that the bundler
  picks in place of the \`.tsx\`: both are listed under "also", and neither is imported by name.
- **A set** (\`layout\`, \`form-set\`, \`control\`, \`primitive\`) installs the items it names and has
  no file of its own.
- **\`tokens\`** is the stylesheet, landing beside \`components.json\`: put
  \`@import "../cubeui-tokens.css";\` in the app's CSS entry (see SKILL.md, "Which half you are in").
- The import line names the value exports: components, hooks, functions and constants. The types
  are exported beside them: each \`<Name>Props\`, and \`SlotNode\` from \`@/lib/utils\`.

| Item | On | Lands at | Import |
| --- | --- | --- | --- |
${table.join("\n")}
`;
}

const content = page();
if (process.argv.includes("--check")) {
  const committed = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (committed !== content) {
    console.error(
      `${fileURLToPath(OUT)} is not what the registries generate.\n` +
        "An item was added, renamed or moved without rebuilding the table.\n" +
        "Run `npm run skill:build`.",
    );
    process.exit(1);
  }
  console.log("skill/install-paths.md matches what this script generates.");
} else {
  writeFileSync(OUT, content);
  console.log(`skill/install-paths.md: ${byName.size} items.`);
}
