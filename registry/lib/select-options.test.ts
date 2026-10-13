import { describe, expect, it } from "vitest";
import { blocksOf, isNote, isSeparator } from "./select-options";

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
