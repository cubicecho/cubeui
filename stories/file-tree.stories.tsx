import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { FileTree as Compiled } from "../compiled/file-tree";
import { Trash2 as CompiledTrash } from "../compiled/icons";
import { FileTree as Native } from "../registry/layout/file-tree";
import { Button as NativeButton } from "../registry/ui/button";
import { Trash2 as NativeTrash } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * A skill's files as mcp-skills-manager lists them — its own Markdown pinned above the tree, a size
 * after each file, a delete button beside each row — drawn with either half. What the tests hold
 * is what the two hand-written copies got wrong or left out: the nesting is a list of lists, a
 * folder folds, and the row action is a sibling of the row rather than a button inside it.
 */
const meta = {
  title: "RN Parity/FileTree",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

type Entry = { path: string; type: "file" | "dir"; size?: number };

const PINNED: Entry[] = [{ path: "SKILL.md", type: "file", size: 2048 }];
// Out of order and without `references` or `references/api`, which the tree adds itself.
const ENTRIES: Entry[] = [
  { path: "notes.md", type: "file", size: 512 },
  { path: "references/api/v2/endpoints.md", type: "file", size: 4096 },
  { path: "scripts", type: "dir" },
  { path: "references/forms.md", type: "file", size: 1024 },
  { path: "scripts/build.sh", type: "file", size: 256 },
  { path: "references/api/v2", type: "dir" },
];

const size = (bytes: number | undefined) => (bytes === undefined ? null : `${bytes} B`);

const selectNative = fn();
const deleteNative = fn();
const foldNative = fn();
const selectCompiled = fn();
const deleteCompiled = fn();
const foldCompiled = fn();

function NativeTree() {
  const [selected, setSelected] = useState("SKILL.md");
  return (
    <Native
      label="Skill files"
      pinned={PINNED}
      entries={ENTRIES}
      selected={selected}
      onSelect={(path) => {
        setSelected(path);
        selectNative(path);
      }}
      onOpenChange={foldNative}
      meta={(node) => size(node.entry?.size)}
      actionSlot={(node) =>
        node.type === "file" ? (
          <NativeButton
            size="icon-xs"
            variant="ghost"
            aria-label={`Delete ${node.path}`}
            iconSlot={<NativeTrash />}
            onPress={() => deleteNative(node.path)}
          />
        ) : null
      }
    />
  );
}

function CompiledTree() {
  const [selected, setSelected] = useState("SKILL.md");
  return (
    <Compiled
      label="Skill files"
      pinned={PINNED}
      entries={ENTRIES}
      selected={selected}
      onSelect={(path) => {
        setSelected(path);
        selectCompiled(path);
      }}
      onOpenChange={foldCompiled}
      meta={(node) => size(node.entry?.size)}
      actionSlot={(node) =>
        node.type === "file" ? (
          <CompiledButton
            size="icon-xs"
            variant="ghost"
            aria-label={`Delete ${node.path}`}
            iconSlot={<CompiledTrash />}
            onClick={() => deleteCompiled(node.path)}
          />
        ) : null
      }
    />
  );
}

const SLOT = (slot: string) => `[data-slot="${slot}"], [data-testid="${slot}"]`;

function rootOf(canvasElement: HTMLElement, selector: string) {
  const root = canvasElement.querySelector<HTMLElement>(selector);
  if (!root) throw new Error(`${selector} should render`);
  return root;
}

/** The names on screen, top to bottom. */
function names(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(SLOT("file-tree-name")),
    (el) => el.textContent,
  );
}

export const Deep: Story = {
  args: { label: "Skill files", entries: ENTRIES },
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 300 }}>
          <NativeTree />
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 300 }}>
          <CompiledTree />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const cases = [
      { selector: ".native-root", select: selectNative, remove: deleteNative, fold: foldNative },
      {
        selector: ".compiled-root",
        select: selectCompiled,
        remove: deleteCompiled,
        fold: foldCompiled,
      },
    ];

    for (const { selector, select, remove, fold } of cases) {
      const root = rootOf(canvasElement, selector);
      const canvas = within(root);
      select.mockClear();
      remove.mockClear();
      fold.mockClear();

      // The pinned file first, then folders before files and by name, every level open.
      await expect(names(root)).toEqual([
        "SKILL.md",
        "references",
        "api",
        "v2",
        "endpoints.md",
        "forms.md",
        "scripts",
        "build.sh",
        "notes.md",
      ]);

      // One named list, with a list inside each folder's item.
      const lists = canvas.getAllByRole("list");
      await expect(lists[0]).toHaveAccessibleName("Skill files");
      await expect(lists).toHaveLength(5);

      // Each level sits further in than the one above it.
      const left = (name: string) => canvas.getByText(name).getBoundingClientRect().left;
      await expect(left("api")).toBeGreaterThan(left("references"));
      await expect(left("v2")).toBeGreaterThan(left("api"));
      await expect(left("endpoints.md")).toBeGreaterThan(left("v2"));
      await expect(left("forms.md")).toBeCloseTo(left("api"), 0);
      // A file's name starts where a folder's does at the same level.
      await expect(left("notes.md")).toBeCloseTo(left("scripts"), 0);

      // The selected file says so; the others do not.
      const pinned = canvas.getByRole("button", { name: /^SKILL\.md/ });
      await expect(pinned).toHaveAttribute("aria-current", "true");
      const notes = canvas.getByRole("button", { name: /^notes\.md/ });
      await expect(notes).not.toHaveAttribute("aria-current");
      await expect(notes).toHaveTextContent("512 B");

      // Pressing a file selects it by its whole path.
      await userEvent.click(canvas.getByText("endpoints.md"));
      await expect(select).toHaveBeenLastCalledWith("references/api/v2/endpoints.md");
      await expect(canvas.getByRole("button", { name: /^endpoints\.md/ })).toHaveAttribute(
        "aria-current",
        "true",
      );
      await expect(pinned).not.toHaveAttribute("aria-current");

      // The row action is beside the row, not in it, and pressing it does not select.
      const del = canvas.getByRole("button", { name: "Delete notes.md" });
      await expect(notes.contains(del)).toBe(false);
      await userEvent.click(del);
      await expect(remove).toHaveBeenLastCalledWith("notes.md");
      await expect(select).toHaveBeenCalledTimes(1);

      // A folder is a button that folds what is under it, and tells the caller what is left open.
      const api = canvas.getByRole("button", { name: "api" });
      await expect(api).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(api);
      await expect(api).toHaveAttribute("aria-expanded", "false");
      await expect(canvas.queryByText("endpoints.md")).toBeNull();
      await expect(canvas.getByText("forms.md")).toBeVisible();
      // `v2` is still open under it: shutting a folder does not forget what was open inside.
      await expect(fold).toHaveBeenLastCalledWith(["references", "references/api/v2", "scripts"]);
      await expect(select).toHaveBeenCalledTimes(1);

      // And from the keyboard: Enter on the focused folder opens it again.
      api.focus();
      await userEvent.keyboard("{Enter}");
      await expect(api).toHaveAttribute("aria-expanded", "true");
      await expect(canvas.getByText("endpoints.md")).toBeVisible();
      await expect(fold).toHaveBeenLastCalledWith([
        "references",
        "references/api",
        "references/api/v2",
        "scripts",
      ]);
    }

    // The two halves draw a name alike.
    const nativeName = within(rootOf(canvasElement, ".native-root")).getByText("notes.md");
    const compiledName = within(rootOf(canvasElement, ".compiled-root")).getByText("notes.md");
    await expect(getComputedStyle(compiledName).fontSize).toBe(
      getComputedStyle(nativeName).fontSize,
    );
    await expect(getComputedStyle(compiledName).color).toBe(getComputedStyle(nativeName).color);
    await expect(compiledName.getBoundingClientRect().height).toBeCloseTo(
      nativeName.getBoundingClientRect().height,
      0,
    );
  },
};

const NOTES: Entry[] = [
  { path: "ideas/a-note-with-a-very-long-name-that-cannot-fit-on-the-row.md", type: "file" },
  { path: "ideas/short.md", type: "file" },
  { path: "archive/2025/old.md", type: "file" },
  { path: "inbox.md", type: "file" },
];

/**
 * mcp-ragdown's notes: the open note is in the URL, so each file is the router's own link — a real
 * `<a href>` with `aria-current="page"` — and `archive` starts shut because the caller says which
 * folders are open.
 */
export const Links: Story = {
  args: { label: "Notes", entries: NOTES },
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 240 }}>
          <Native
            label="Notes"
            entries={NOTES}
            selected="ideas/short.md"
            defaultOpen={["ideas"]}
            // biome-ignore lint/a11y/useAnchorContent: the tree draws the row inside the link
            linkSlot={(node) => <a href={`#/notes/${node.path}`} />}
          />
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 240 }}>
          <Compiled
            label="Notes"
            entries={NOTES}
            selected="ideas/short.md"
            defaultOpen={["ideas"]}
            // biome-ignore lint/a11y/useAnchorContent: the tree draws the row inside the link
            linkSlot={(node) => <a href={`#/notes/${node.path}`} />}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const selector of [".native-root", ".compiled-root"]) {
      const root = rootOf(canvasElement, selector);
      const canvas = within(root);

      // Only `ideas` is open; `archive` keeps what is under it unmounted.
      await expect(canvas.getByRole("button", { name: "archive" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(canvas.queryByText("old.md")).toBeNull();

      // A file is a link to its own path, and the open one is the current page.
      const links = canvas.getAllByRole("link");
      await expect(links).toHaveLength(3);
      const short = canvas.getByRole("link", { name: "short.md" });
      await expect(short).toHaveAttribute("href", "#/notes/ideas/short.md");
      await expect(short).toHaveAttribute("aria-current", "page");
      await expect(canvas.getByRole("link", { name: "inbox.md" })).not.toHaveAttribute(
        "aria-current",
      );

      // The link fills the row, so the whole row is the target.
      const row = short.closest<HTMLElement>(SLOT("file-tree-row"));
      if (!row) throw new Error("the link should sit in a row");
      await expect(short.getBoundingClientRect().width).toBeCloseTo(
        row.getBoundingClientRect().width,
        0,
      );

      // A long name keeps to one line and to the tree's width.
      const long = canvas.getByText(/a-note-with-a-very-long-name/);
      const lineHeight = Number.parseFloat(getComputedStyle(long).lineHeight);
      await expect(long.getBoundingClientRect().height).toBeLessThan(lineHeight * 1.5);
      await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
      await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(
        root.getBoundingClientRect().right,
      );
    }
  },
};
