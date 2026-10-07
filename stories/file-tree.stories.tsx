import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { FileTree as Compiled } from "../compiled/file-tree";
import { Trash2 as CompiledTrash } from "../compiled/icons";
import { FileTree as Native } from "../registry/layout/file-tree";
import { Button as NativeButton } from "../registry/ui/button";
import { Trash2 as NativeTrash } from "../registry/ui/icons";
import { deferredSave } from "./deferred-save";
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
  if (!root) {
    throw new Error(`${selector} should render`);
  }
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
      if (!row) {
        throw new Error("the link should sit in a row");
      }
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

const MOVABLE: Entry[] = [
  { path: "archive", type: "dir" },
  { path: "db/old/schema.md", type: "file" },
  { path: "db/pg.md", type: "file" },
  { path: "ops/deploy.md", type: "file" },
  { path: "ops/runbook.md", type: "file" },
  { path: "inbox.md", type: "file" },
];

const slowMove = deferredSave<{ from: string; into: string }>();

function MovableTree() {
  const [entries, setEntries] = useState(MOVABLE);
  return (
    <Compiled
      label="Notes"
      pinned={[{ path: "README.md", type: "file" }]}
      entries={entries}
      defaultOpen={["db", "ops"]}
      onSelect={() => {}}
      // `archive` is read-only: nothing may be dropped there.
      canMove={(_node, into) => into !== "archive"}
      onMove={async (from, into) => {
        await slowMove.save({ from, into });
        const name = from.slice(from.lastIndexOf("/") + 1);
        const to = into ? `${into}/${name}` : name;
        setEntries((before) =>
          before.map((entry) => (entry.path === from ? { ...entry, path: to } : entry)),
        );
      }}
    />
  );
}

/**
 * One drag, as the browser's own `DragEvent`s on one `DataTransfer`. `over` hands the event back
 * so a test can ask whether the target took it: a `dragover` nobody prevented is a drop the
 * browser will not make. Each event waits a turn before the next, as the browser's own do: the
 * tree answers one with what the last one left it.
 */
async function drag(source: Element) {
  const dataTransfer = new DataTransfer();
  const send = async (type: string, target: Element) => {
    const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
    target.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve));
    return event;
  };
  await send("dragstart", source);
  return {
    dataTransfer,
    over: (target: Element) => send("dragover", target),
    drop: (target: Element) => send("drop", target),
    end: () => send("dragend", source),
  };
}

const isTinted = (el: Element) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)";

/**
 * Issue #263: a row is dragged onto a folder and `onMove` hears the two paths. Only the compiled
 * half is here, because HTML drag and drop is the web's: react-native-web forwards none of it, and
 * a device has no pointer to drag with.
 */
export const Move: Story = {
  args: { label: "Notes", entries: MOVABLE },
  render: () => (
    <div className="compiled-root bg-background p-6" style={{ width: 300 }}>
      <MovableTree />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement, ".compiled-root");
    const canvas = within(root);
    const tree = canvas.getByRole("list", { name: "Notes" });
    const row = (name: string) => canvas.getByRole("button", { name });
    const item = (name: string) => {
      const found = row(name).closest<HTMLElement>(SLOT("file-tree-item"));
      if (!found) {
        throw new Error(`${name} should sit in an item`);
      }
      return found;
    };
    slowMove.calls.mockClear();

    // Every row of the tree can be picked up; a pinned one cannot.
    await expect(row("inbox.md")).toHaveAttribute("draggable", "true");
    await expect(row("ops")).toHaveAttribute("draggable", "true");
    await expect(row("README.md")).not.toHaveAttribute("draggable");

    // The drag carries the path, so a link's row is not dragged as only its URL.
    const refused = await drag(row("inbox.md"));
    await expect(refused.dataTransfer.getData("text/plain")).toBe("inbox.md");

    // Refused: where it already is, a pinned row, and the folder `canMove` says no to.
    for (const target of [tree, row("README.md"), row("archive")]) {
      await expect((await refused.over(target)).defaultPrevented).toBe(false);
    }
    await expect(isTinted(tree)).toBe(false);
    await expect(isTinted(item("archive"))).toBe(false);
    await refused.drop(row("archive"));
    await refused.end();

    // Refused: a folder onto itself, or into what is under it.
    const folder = await drag(row("db"));
    await expect((await folder.over(row("db"))).defaultPrevented).toBe(false);
    await expect((await folder.over(row("pg.md"))).defaultPrevented).toBe(false);
    await folder.drop(row("pg.md"));
    await folder.end();
    await expect(slowMove.calls).not.toHaveBeenCalled();

    // A file's row counts as the folder it is in, and that folder is what is tinted.
    const move = await drag(row("deploy.md"));
    await expect((await move.over(row("pg.md"))).defaultPrevented).toBe(true);
    await waitFor(() => expect(isTinted(item("db"))).toBe(true));
    await expect(isTinted(item("ops"))).toBe(false);

    // A shut folder under the pointer opens after a moment, so the drop can go deeper.
    await expect(row("old")).toHaveAttribute("aria-expanded", "false");
    await expect((await move.over(row("old"))).defaultPrevented).toBe(true);
    await waitFor(() => expect(row("old")).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(isTinted(item("old"))).toBe(true));
    await expect(isTinted(item("db"))).toBe(false);

    await move.drop(row("schema.md"));
    await expect(slowMove.calls).toHaveBeenCalledTimes(1);
    await expect(slowMove.calls).toHaveBeenLastCalledWith({
      from: "ops/deploy.md",
      into: "db/old",
    });

    // While the move is pending the row waits where it was, muted, and the tint is gone.
    const waiting = row("deploy.md").closest<HTMLElement>(SLOT("file-tree-row"));
    if (!waiting) {
      throw new Error("the file should sit in a row");
    }
    await waitFor(() => expect(getComputedStyle(waiting).opacity).toBe("0.5"));
    await expect(isTinted(item("old"))).toBe(false);
    await expect(item("ops").contains(row("deploy.md"))).toBe(true);

    slowMove.settle("resolve");
    await waitFor(() => expect(item("old").contains(row("deploy.md"))).toBe(true));
    const landed = row("deploy.md").closest<HTMLElement>(SLOT("file-tree-row"));
    await expect(landed && getComputedStyle(landed).opacity).toBe("1");

    // The tree's own blank space is the top level, and its path is empty.
    const up = await drag(row("deploy.md"));
    await expect((await up.over(tree)).defaultPrevented).toBe(true);
    await waitFor(() => expect(isTinted(tree)).toBe(true));
    await up.drop(tree);
    await expect(slowMove.calls).toHaveBeenLastCalledWith({ from: "db/old/deploy.md", into: "" });
    slowMove.settle("resolve");
    await waitFor(() => expect(item("old").contains(row("deploy.md"))).toBe(false));
    await expect(slowMove.calls).toHaveBeenCalledTimes(2);
  },
};
