/**
 * The props table of a component whose props type is a union (#463).
 *
 * The generator kept the first member's declaration of each prop, so a prop one member forbids
 * with `never` was documented as `never`: `LoadState`'s `record` could not be passed, by its own
 * table. The fixture is that shape, the smallest one: shared props, and two members that each
 * forbid what the other takes.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { misleadingRows, propsRows, renderTable } from "./props-tables.mjs";

const ROOT = "/fixture";
const PATH = `${ROOT}/registry/layout/thing.ts`;
const SOURCE = `
const SIZES = { sm: "a", md: "b", lg: "c" } as const;
const DEFAULT_LABEL = "Go";
type Mode = "on" | "off";

type Common = {
  /** What it is called. */
  title: string;
  /** How big it is. */
  size?: keyof typeof SIZES | undefined;
  /** What it says. */
  label?: string | undefined;
  mode?: Mode | undefined;
};

type List = {
  /** How many rows there are. */
  count: number;
  /** What to say when there are none. */
  emptySlot?: string | undefined;
  record?: never;
  notFoundLabel?: never;
};

type One = {
  /** The one record. */
  record: unknown;
  /** What to say when it is not there. */
  notFoundLabel: string;
  count?: never;
  emptySlot?: never;
};

export function Thing({ size = "md", label = DEFAULT_LABEL }: Common & (List | One)) {
  return [size, label];
}

export function Broken(_props: { title: string; ghost?: never }) {
  return null;
}
`;

function program() {
  const options = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022 };
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (name, version) =>
    name === PATH ? ts.createSourceFile(name, SOURCE, version, true) : getSourceFile(name, version);
  host.fileExists = (name) => name === PATH || fileExists(name);
  host.readFile = (name) => (name === PATH ? SOURCE : readFile(name));
  return ts.createProgram([PATH], options, host);
}

// One program for every test: each costs the standard library's types.
const PROGRAM = program();

const rowsOf = (name) => {
  const rows = propsRows(PROGRAM, PATH, name, ROOT);
  return { rows, byName: new Map(rows.own.map((row) => [row.name, row])) };
};

test("a prop one member forbids is typed by the member that allows it", () => {
  const { byName } = rowsOf("Thing");
  assert.equal(byName.get("record").type, "unknown");
  assert.equal(byName.get("record").doc, "The one record.");
  assert.equal(byName.get("notFoundLabel").type, "string");
  assert.equal(byName.get("count").type, "number");
  assert.equal(byName.get("count").doc, "How many rows there are.");
});

test("a prop only some members allow says which, and is not required", () => {
  const { byName } = rowsOf("Thing");
  const said = (name) => [byName.get(name).condition, byName.get(name).required];
  assert.deepEqual(said("count"), ["instead of `record`", false]);
  assert.deepEqual(said("record"), ["instead of `count`", false]);
  assert.deepEqual(said("notFoundLabel"), ["required with `record`", false]);
  assert.deepEqual(said("emptySlot"), ["with `count`", false]);
  assert.deepEqual(said("title"), ["", true]);
});

test("a constant's name is written as its values, in the order the source gives them", () => {
  const { byName } = rowsOf("Thing");
  assert.equal(byName.get("size").type, '"sm" | "md" | "lg"');
  assert.equal(byName.get("mode").type, '"on" | "off"');
  assert.equal(byName.get("label").fallback, '"Go"');
});

test("the table marks the condition beside the prop's name", () => {
  const { rows } = rowsOf("Thing");
  const table = renderTable("Thing", PATH, ROOT, rows);
  const row =
    "| `notFoundLabel` (required with `record`) | `string` |  | What to say when it is not there. |";
  assert.ok(table.split("\n").includes(row), table);
  assert.equal(table.includes("`never`"), false, table);
});

test("a row typed `never` or naming a constant is reported", () => {
  const { rows } = rowsOf("Broken");
  assert.deepEqual(
    misleadingRows(rows.own).map((row) => row.name),
    ["ghost"],
  );
  assert.deepEqual(
    misleadingRows([{ name: "size", type: "keyof typeof SIZES" }]).map((row) => row.name),
    ["size"],
  );
});
