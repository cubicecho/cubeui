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
 * TypeScript compiler against the tsconfig that file is checked under. A row is a prop declared
 * in the component's own file; props it takes from another registry type (`Button`'s, on
 * `ConfirmButton`) are named in one line under the table, and the platform's own props (a
 * `Pressable`'s, a `<div>`'s) are left out. The text is the first paragraph of the prop's TSDoc.
 *
 * `--check` fails when a committed table is not what this generates.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

/** The file that exports `name` as a component, and the tsconfig it is checked under. */
function findComponent(name) {
  const declares = new RegExp(`export (function|const) ${name}\\b|export \\{[^}]*\\b${name}\\b`);
  for (const { dir, config } of SOURCES) {
    const files = readdirSync(join(ROOT, dir)).filter(
      (file) => /\.tsx?$/.test(file) && /\.(web|test|stories)\./.test(file) === false,
    );
    for (const file of files) {
      const path = join(ROOT, dir, file);
      if (declares.test(readFileSync(path, "utf8"))) {
        return { path, config };
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

const oneLine = (text) => text.replace(/\s+/g, " ").trim();
const firstParagraph = (text) => oneLine(text.split(/\n\s*\n/)[0] ?? "");
const cell = (text) => text.replace(/\|/g, "\\|");
const dropUndefined = (type) => type.replace(/\s*\|\s*undefined\b/g, "").trim();

/** `{ level = 3, loading = false }`: the defaults written in the component's own parameter. */
function defaultsOf(declaration) {
  const fn = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
  const defaults = new Map();
  const visit = (node) => {
    if (ts.isFunctionLike(node) && node.parameters?.length > 0) {
      const [first] = node.parameters;
      if (ts.isObjectBindingPattern(first.name)) {
        for (const element of first.name.elements) {
          const prop = element.propertyName ?? element.name;
          if (element.initializer && ts.isIdentifier(prop)) {
            defaults.set(prop.text, element.initializer.getText());
          }
        }
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  if (fn) {
    visit(fn);
  }
  return defaults;
}

function propsTable(name, roots) {
  const { path, config } = findComponent(name);
  const program = programFor(config, roots.get(config));
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(path);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exported = checker.getExportsOfModule(moduleSymbol).find((s) => s.name === name);
  if (exported === undefined) {
    throw new Error(`${relative(ROOT, path)} does not export ${name}.`);
  }
  const symbol =
    exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
  const declaration = symbol.valueDeclaration ?? symbol.declarations[0];
  const signature = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures()[0];
  if (signature === undefined || signature.parameters.length === 0) {
    throw new Error(`${name} in ${relative(ROOT, path)} takes no props.`);
  }
  const propsType = checker.getTypeOfSymbolAtLocation(signature.parameters[0], declaration);
  const members = propsType.isUnion() ? propsType.types : [propsType];

  // A prop is required only when every member of a union requires it.
  const props = new Map();
  for (const member of members) {
    for (const prop of checker.getPropertiesOfType(member)) {
      const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
      const seen = props.get(prop.name);
      props.set(prop.name, {
        symbol: seen?.symbol ?? prop,
        required: (seen ? seen.required : true) && optional === false,
        count: (seen?.count ?? 0) + 1,
      });
    }
  }

  // The item's own files: `badge.tsx` and the `badge-base.ts` its props type is written in.
  const stem = path.replace(/\.tsx?$/, "");
  const ownFiles = new Set([path, `${stem}-base.ts`]);
  const own = [];
  const borrowed = new Map();
  const defaults = defaultsOf(declaration);
  for (const [propName, { symbol: prop, required, count }] of props) {
    const decl = prop.declarations?.find((d) => d.getSourceFile().fileName.startsWith(ROOT));
    const file = decl?.getSourceFile().fileName ?? "";
    if (decl === undefined || relative(ROOT, file).startsWith("registry/") === false) {
      continue;
    }
    if (ownFiles.has(file) === false) {
      const where = `\`${relative(ROOT, file)}\``;
      borrowed.set(where, [...(borrowed.get(where) ?? []), propName]);
      continue;
    }
    const typeText =
      decl.type?.getText() ?? checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, decl));
    own.push({
      pos: decl.pos + (file === path ? Number.MAX_SAFE_INTEGER / 2 : 0),
      name: propName,
      type: dropUndefined(oneLine(typeText)),
      required: required && count === members.length,
      fallback: defaults.get(propName) ?? "",
      doc: firstParagraph(ts.displayPartsToString(prop.getDocumentationComment(checker))),
    });
  }
  own.sort((a, b) => a.pos - b.pos);

  const lines = [
    `\`${name}\`'s props, from the TSDoc in \`${relative(ROOT, path)}\`:`,
    "",
    "| Prop | Type | Default | What it is |",
    "| --- | --- | --- | --- |",
    ...own.map(
      (p) =>
        `| \`${p.name}\`${p.required ? " (required)" : ""} | \`${cell(p.type)}\` | ${
          p.fallback ? `\`${cell(p.fallback)}\`` : ""
        } | ${cell(p.doc)} |`,
    ),
  ];
  for (const [where, names] of borrowed) {
    lines.push(
      "",
      `It also takes the props declared in ${where}: ${names
        .slice()
        .sort()
        .map((n) => `\`${n}\``)
        .join(", ")}.`,
    );
  }
  return lines.join("\n");
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

if (stale.length > 0) {
  console.error(
    `The props tables in ${stale.join(", ")} are not what the TSDoc generates.\n` +
      "A prop was added, renamed or re-described without rebuilding them.\n" +
      "Run `npm run skill:build`.",
  );
  process.exit(1);
}
console.log(`${tables} props tables ${checking ? "match the TSDoc" : "written"}.`);
