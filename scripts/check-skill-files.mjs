#!/usr/bin/env node
// The skill is served to agents through skills servers, whose file reads refuse or truncate a
// large file (#387): `controls.md` had reached 103 KB, and an agent that could not read it whole
// grepped for the sections it expected and never saw the rest. So the skill is split by component
// group, and this holds the split:
//
// 1. No file under `skill/` is over LIMIT, `SKILL.md` included: the slot vocabulary moved out of it
//    into `vocabulary.md` rather than the router getting a larger budget.
// 2. A file over CONTENTS_AFTER lines opens with a contents list linking each of its `##`
//    headings, so a reader that gets only the top of it still knows what is below.
// 3. Every relative link between the skill's files, and from the pointer in
//    `.claude/skills/cubeui/SKILL.md`, names a file that exists and a heading that is in it.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_DIR = join(ROOT, "skill");
const POINTER = join(ROOT, ".claude/skills/cubeui/SKILL.md");

const KB = 1024;
const LIMIT_KB = 25;
const LIMIT = LIMIT_KB * KB;
const CONTENTS_AFTER = 300;

/** GitHub's heading anchor: lower case, punctuation dropped, spaces to hyphens. */
export const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");

/** The headings outside code fences, with GitHub's `-1` suffix on a repeated anchor. */
function headings(text) {
  const found = [];
  const seen = new Map();
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*```/.test(line)) {
      fenced = fenced === false;
      continue;
    }
    const match = fenced ? null : line.match(/^(#{1,6}) (.*)$/);
    if (match) {
      const base = slug(match[2]);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      found.push({ level: match[1].length, anchor: count === 0 ? base : `${base}-${count}` });
    }
  }
  return found;
}

/** Links outside code fences and code spans. */
function links(text) {
  const found = [];
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*```/.test(line)) {
      fenced = fenced === false;
      continue;
    }
    if (fenced) {
      continue;
    }
    const prose = line.replace(/`[^`]*`/g, "``");
    for (const match of prose.matchAll(/\]\(([^)\s]+)\)/g)) {
      found.push(match[1]);
    }
  }
  return found;
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return markdownFiles(path);
    }
    return name.endsWith(".md") ? [path] : [];
  });
}

const problems = [];
const files = markdownFiles(SKILL_DIR);
const anchors = new Map(
  files.map((file) => [file, new Set(headings(readFileSync(file, "utf8")).map((h) => h.anchor))]),
);

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const name = relative(ROOT, file);
  const size = Buffer.byteLength(text);
  if (size > LIMIT) {
    problems.push(
      `${name} is ${Math.round(size / KB)} KB, over ${LIMIT_KB} KB. Split it by component group.`,
    );
  }

  const lines = text.split("\n").length;
  if (lines > CONTENTS_AFTER) {
    const sections = headings(text).filter((h) => h.level === 2);
    const top = text.slice(0, text.search(/^## /m));
    const missing = sections.filter((h) => top.includes(`(#${h.anchor})`) === false);
    if (missing.length > 0) {
      problems.push(
        `${name} is ${lines} lines, and its contents list does not link: ${missing.map((h) => `#${h.anchor}`).join(", ")}`,
      );
    }
  }
}

for (const file of [...files, POINTER]) {
  const name = relative(ROOT, file);
  for (const href of links(readFileSync(file, "utf8"))) {
    if (/^[a-z]+:/.test(href)) {
      continue;
    }
    const [path, anchor] = href.split("#");
    const target = path === "" ? file : join(dirname(file), path);
    if (existsSync(target) === false) {
      problems.push(`${name} links to ${href}, which does not exist.`);
      continue;
    }
    if (anchor && target.endsWith(".md")) {
      const known =
        anchors.get(target) ?? new Set(headings(readFileSync(target, "utf8")).map((h) => h.anchor));
      if (known.has(anchor) === false) {
        problems.push(
          `${name} links to ${href}, and ${relative(ROOT, target)} has no such heading.`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("The skill's files are out of shape:\n");
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}
console.log(`${files.length} skill files: each within ${LIMIT_KB} KB, each link resolves.`);
