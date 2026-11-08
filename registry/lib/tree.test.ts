import { describe, expect, it } from "vitest";
import { buildTree, isValidMove, parentPath, type TreeNode } from "./tree";

const shape = (nodes: TreeNode[]): unknown =>
  nodes.map((node) => (node.type === "dir" ? { [node.name]: shape(node.children) } : node.name));

describe("buildTree", () => {
  it("nests files under the folders their paths name, adding the ones the list leaves out", () => {
    const tree = buildTree([
      { path: "ideas/deep/a.md", type: "file" },
      { path: "readme.md", type: "file" },
    ]);
    expect(shape(tree)).toEqual([{ ideas: [{ deep: ["a.md"] }] }, "readme.md"]);
    expect(tree[0]).toMatchObject({ path: "ideas", type: "dir" });
    expect(tree[0]?.entry).toBeUndefined();
    expect(tree[0]?.children[0]?.path).toBe("ideas/deep");
  });

  it("sorts folders first and then by name at every level", () => {
    const tree = buildTree([
      { path: "b.md", type: "file" },
      { path: "z/b.md", type: "file" },
      { path: "a.md", type: "file" },
      { path: "z/y/c.md", type: "file" },
      { path: "m/a.md", type: "file" },
    ]);
    expect(shape(tree)).toEqual([
      { m: ["a.md"] },
      { z: [{ y: ["c.md"] }, "b.md"] },
      "a.md",
      "b.md",
    ]);
  });

  it("reads the digits in a name as a number", () => {
    const tree = buildTree([
      { path: "file10.md", type: "file" },
      { path: "file2.md", type: "file" },
      { path: "file1.md", type: "file" },
      { path: "v10", type: "dir" },
      { path: "v9", type: "dir" },
    ]);
    expect(shape(tree)).toEqual([{ v9: [] }, { v10: [] }, "file1.md", "file2.md", "file10.md"]);
  });

  it("ignores a leading, trailing or doubled slash", () => {
    const marker = { path: "docs/", type: "dir" as const };
    const tree = buildTree([
      marker,
      { path: "/docs//a.md", type: "file" },
      { path: "docs/b.md/", type: "file" },
      { path: "/", type: "dir" },
      { path: "", type: "file" },
    ]);
    expect(shape(tree)).toEqual([{ docs: ["a.md", "b.md"] }]);
    expect(tree[0]?.path).toBe("docs");
    expect(tree[0]?.entry).toBe(marker);
    expect(tree[0]?.children.map((node) => node.path)).toEqual(["docs/a.md", "docs/b.md"]);
    // The node's path is the cleaned one; the entry keeps the key as listed.
    expect(tree[0]?.children[0]?.entry?.path).toBe("/docs//a.md");
  });

  it("keeps a file and a folder that share a path, the folder first", () => {
    const file = { path: "logs", type: "file" as const };
    const child = { path: "logs/run.log", type: "file" as const };
    for (const entries of [
      [file, child],
      [child, file],
    ]) {
      const tree = buildTree(entries);
      expect(shape(tree)).toEqual([{ logs: ["run.log"] }, "logs"]);
      expect(tree[0]).toMatchObject({ path: "logs", type: "dir" });
      expect(tree[0]?.entry).toBeUndefined();
      expect(tree[1]).toMatchObject({ path: "logs", type: "file", children: [] });
      expect(tree[1]?.entry).toBe(file);
    }
  });

  it("keeps each entry on its node, a listed folder's included", () => {
    const file = { path: "notes/a.md", type: "file" as const, size: 3 };
    const dir = { path: "notes", type: "dir" as const, size: 0 };
    const tree = buildTree([file, dir]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.entry).toBe(dir);
    expect(tree[0]?.children[0]?.entry).toBe(file);
  });

  it("gives a folder listed after its child the entry, and lists it once", () => {
    const dir = { path: "a", type: "dir" as const };
    const tree = buildTree([{ path: "a/b/c.md", type: "file" }, dir, dir]);
    expect(shape(tree)).toEqual([{ a: [{ b: ["c.md"] }] }]);
    expect(tree[0]?.entry).toBe(dir);
  });

  it("keeps an empty folder, and returns nothing for an empty list", () => {
    expect(shape(buildTree([{ path: "empty", type: "dir" }]))).toEqual([{ empty: [] }]);
    expect(buildTree([])).toEqual([]);
  });
});

describe("parentPath", () => {
  it("is the folder a path sits in, and empty at the top level", () => {
    expect(parentPath("ideas/deep/a.md")).toBe("ideas/deep");
    expect(parentPath("readme.md")).toBe("");
  });
});

describe("isValidMove", () => {
  it("allows a move into another folder or up to the top level", () => {
    expect(isValidMove("ops/pg.md", "db")).toBe(true);
    expect(isValidMove("ops/pg.md", "")).toBe(true);
    expect(isValidMove("ops", "db/old")).toBe(true);
  });

  it("refuses a folder dropped on itself or on anything under it", () => {
    expect(isValidMove("ops", "ops")).toBe(false);
    expect(isValidMove("ops", "ops/deep/er")).toBe(false);
    // A sibling whose name only starts the same way is not under it.
    expect(isValidMove("ops", "ops-old")).toBe(true);
  });

  it("lets a file go into the folder that shares its path, and not a folder into itself", () => {
    expect(isValidMove("logs", "logs", "file")).toBe(true);
    expect(isValidMove("logs", "logs/old", "file")).toBe(true);
    expect(isValidMove("logs", "logs", "dir")).toBe(false);
    // Left out, the type is a folder's: the stricter answer, as it was before it could be given.
    expect(isValidMove("logs", "logs")).toBe(false);
    expect(isValidMove("logs/run.log", "logs", "file")).toBe(false);
  });

  it("refuses a move into the folder the path is already in", () => {
    expect(isValidMove("ops/pg.md", "ops")).toBe(false);
    expect(isValidMove("readme.md", "")).toBe(false);
  });
});
