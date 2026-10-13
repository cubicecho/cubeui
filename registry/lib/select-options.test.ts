import { describe, expect, it } from "vitest";
import {
  blocksOf,
  isNote,
  isSeparator,
  menuValueOf,
  storedValueOf,
  withEmptyOption,
} from "./select-options";

describe("blocksOf", () => {
  it("keeps a flat list as one block with no heading", () => {
    const blocks = blocksOf([
      { label: "Bug", value: "bug" },
      { label: "Chore", value: "chore" },
    ]);
    expect(blocks).toEqual([
      {
        group: undefined,
        options: [
          { label: "Bug", value: "bug" },
          { label: "Chore", value: "chore" },
        ],
      },
    ]);
  });

  it("gathers the options sharing a group, in the order given", () => {
    const blocks = blocksOf([
      { label: "Stay here", value: "stay" },
      { label: "Review", value: "review", group: "Lanes" },
      { label: "Done", value: "done", group: "Lanes" },
      { label: "Archive it", value: "archive" },
    ]);
    expect(blocks.map((block) => ("options" in block ? block.group : null))).toEqual([
      undefined,
      "Lanes",
      undefined,
    ]);
  });

  it("starts a second block for a group that comes back later", () => {
    const blocks = blocksOf([
      { label: "Review", value: "review", group: "Lanes" },
      { separator: true },
      { label: "Done", value: "done", group: "Lanes" },
    ]);
    expect(blocks).toHaveLength(3);
    expect(blocks.filter(isSeparator)).toHaveLength(1);
  });

  it("gives a note a block of its own", () => {
    const blocks = blocksOf([{ label: "Bug", value: "bug" }, { note: "Loading…" }]);
    expect(blocks.filter(isNote)).toEqual([{ note: "Loading…" }]);
  });
});

describe("the row for nothing", () => {
  const options = [{ label: "Ada", value: "ada", group: "People" }];

  it("goes first, saying the empty label, in a run of its own ahead of a heading", () => {
    const blocks = blocksOf(withEmptyOption(options, "Nobody"));
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ group: undefined, options: [{ label: "Nobody" }] });
  });

  it("is the row marked chosen for every way a field says nothing", () => {
    const [empty] = withEmptyOption(options, "Nobody");
    const value = empty && "value" in empty ? empty.value : undefined;
    expect(value).toBeTypeOf("string");
    expect(menuValueOf(null)).toBe(value);
    expect(menuValueOf(undefined)).toBe(value);
    expect(menuValueOf("")).toBe(value);
    expect(menuValueOf("ada")).toBe("ada");
  });

  it("is stored as null, and an option as its own value", () => {
    expect(storedValueOf(menuValueOf(null))).toBeNull();
    expect(storedValueOf("ada")).toBe("ada");
  });
});
