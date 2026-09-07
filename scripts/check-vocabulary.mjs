#!/usr/bin/env node
// Rule 2 of docs/component-conventions.md and the skill's vocabulary section are meant to be the
// same list, read from two directions: the conventions doc argues a word once, the skill hands it
// to an agent. Nothing enforced that, and the two drifted by five words — `width`, `trigger`,
// `rows`, `value`/`onValueChange` were argued and never taught, and `hasUnsavedChanges` was taught
// as a core word when it belongs to one component. Adding a word is a decision about the whole set
// (rule 2), so it should be impossible to make it in only one of the two places that record it.
//
// This compares the *words*, per layer, not their prose. The two files say the same thing in
// different voices on purpose.

import { readFile } from "node:fs/promises";

const CONVENTIONS = "docs/component-conventions.md";
const SKILL = "registry/skill/SKILL.md";

// The layers are the same five in both files; only the first is worded differently, because
// "Core — every shell" is how you argue it and "Everywhere" is how you use it.
const LAYERS = [
  ["Core — every shell.", "Everywhere:"],
  ["Page, split and dialog shells add:", "Page, split and dialog shells add:"],
  ["Form components add:", "Form components add:"],
  ["Controls add:", "Controls add:"],
  ["List rows and query states add:", "List rows and query states add:"],
];

const between = (text, start, end) => {
  const from = text.indexOf(start);
  if (from === -1) return null;
  const rest = text.slice(from + start.length);
  const to = rest.indexOf(end);
  return to === -1 ? rest : rest.slice(0, to);
};

const ticked = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** Rule 2 holds each layer as a table; the word is the first cell. */
function fromConventions(section) {
  const layers = new Map();
  let current = null;
  for (const line of section.split("\n")) {
    const heading = line.match(/^\*\*(.+)\*\*$/);
    if (heading) {
      current = heading[1];
      layers.set(current, []);
      continue;
    }
    if (current && line.startsWith("|")) {
      const cell = line.split("|")[1] ?? "";
      layers.get(current).push(...ticked(cell));
    }
  }
  return layers;
}

/** The skill holds each layer as a bullet list; the word is the bolded head of the bullet. */
function fromSkill(section) {
  const layers = new Map();
  let current = null;
  for (const line of section.split("\n")) {
    const heading = line.match(/^\*\*(.+)\*\*$/);
    if (heading) {
      current = heading[1];
      layers.set(current, []);
      continue;
    }
    if (current && line.startsWith("- **`")) {
      const head = line.slice(2).split(" — ")[0];
      layers.get(current).push(...ticked(head));
    }
  }
  return layers;
}

const conventions = await readFile(CONVENTIONS, "utf8");
const skill = await readFile(SKILL, "utf8");

const rule2 = between(conventions, "## 2. One vocabulary across the set", "\n## 3.");
const vocabulary = between(skill, "## The slot vocabulary", "\n## What does not belong");

const problems = [];
if (rule2 === null) problems.push(`${CONVENTIONS}: rule 2's heading was renamed; this check cannot find it.`);
if (vocabulary === null) problems.push(`${SKILL}: the vocabulary section's heading was renamed; this check cannot find it.`);

if (problems.length === 0) {
  const left = fromConventions(rule2);
  const right = fromSkill(vocabulary);

  for (const [conventionsHeading, skillHeading] of LAYERS) {
    const a = left.get(conventionsHeading);
    const b = right.get(skillHeading);
    if (!a) {
      problems.push(`${CONVENTIONS}: no layer "${conventionsHeading}".`);
      continue;
    }
    if (!b) {
      problems.push(`${SKILL}: no layer "${skillHeading}".`);
      continue;
    }
    const missingFromSkill = a.filter((w) => !b.includes(w));
    const missingFromConventions = b.filter((w) => !a.includes(w));
    if (missingFromSkill.length > 0)
      problems.push(`"${skillHeading}" in ${SKILL} is missing: ${missingFromSkill.join(", ")}`);
    if (missingFromConventions.length > 0)
      problems.push(`"${conventionsHeading}" in ${CONVENTIONS} is missing: ${missingFromConventions.join(", ")}`);
  }

  // A word taught in one layer and argued in another is the `hasUnsavedChanges` case: it reads as
  // a word every shell takes, and only one component has it.
  const layerOf = (layers, headings) => {
    const found = new Map();
    for (const [heading, words] of layers) {
      const index = headings.findIndex((pair) => pair === heading);
      for (const word of words) if (index !== -1) found.set(word, index);
    }
    return found;
  };
  const leftLayer = layerOf(left, LAYERS.map(([c]) => c));
  const rightLayer = layerOf(right, LAYERS.map(([, s]) => s));
  for (const [word, index] of leftLayer) {
    const other = rightLayer.get(word);
    if (other !== undefined && other !== index)
      problems.push(
        `\`${word}\` is a "${LAYERS[index][0]}" word in ${CONVENTIONS} and a "${LAYERS[other][1]}" word in ${SKILL}.`,
      );
  }
}

if (problems.length > 0) {
  console.error("The vocabulary in rule 2 and the vocabulary in the skill disagree:\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nAdding a word is a decision about the whole set (rule 2). Write it in both places, or in neither.",
  );
  process.exit(1);
}

const words = new Set([...fromConventions(rule2).values()].flat());
console.log(`${words.size} words, and rule 2 and the skill agree on every one.`);
