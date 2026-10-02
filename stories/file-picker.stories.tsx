import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import {
  FilePicker as Compiled,
  FilePickerButton as CompiledButton,
} from "../compiled/file-picker";
import { Plus } from "../compiled/icons";
import { PageHeader } from "../compiled/page-header";
import {
  FilePicker as Native,
  FilePickerButton as NativeButton,
} from "../registry/ui/file-picker.tsx";
import type { PickedFile } from "../registry/ui/file-picker-base";
import { SideBySide } from "./side-by-side";

/**
 * The file picker on both halves. The native half is imported by its full name because Vite
 * would otherwise resolve `file-picker.web.tsx`; it draws the zone and says on screen that it
 * cannot pick, which is the honest version of a placeholder.
 *
 * The compiled half is the hand-written web one: a drop zone over a hidden file input. A drop is
 * simulated with a real `DataTransfer`, which is what a browser hands `onDrop`.
 */
const meta = { title: "Stage 0/FilePicker" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onPick = fn();

/**
 * A `drop` carrying `files`, dispatched as the browser's own `DragEvent`. Testing Library's
 * `fireEvent.drop` copies a `DataTransfer`'s own properties onto a fresh one, and a real one has
 * none — its files live behind getters — so the drop would arrive empty.
 */
function drop(target: Element, files: File[]) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  for (const type of ["dragenter", "dragover", "drop"]) {
    target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
  }
}

/**
 * Issue #132: the zone had `flex-col`, `items-center` and `gap-2` but no `flex`, so it stayed an
 * inline block and the icon, label and hint ran along one line. The assertions are the geometry
 * the classes promise — a column, centred, with the gap between each part.
 */
export const Zone: Story = {
  render: () => (
    <SideBySide
      native={<Native label="Import a board" hint="A .json export" onPick={onPick} />}
      compiled={
        <Compiled
          label="Import a board"
          hint="A .json export"
          accept="application/json,.json"
          onPick={onPick}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onPick.mockClear();

    const zone = canvas.getByRole("button", { name: /Import a board/ });
    await expect(getComputedStyle(zone).display).toBe("flex");
    await expect(getComputedStyle(zone).flexDirection).toBe("column");

    const icon = zone.querySelector("svg");
    const label = within(zone).getByText("Import a board");
    const hint = within(zone).getByText("A .json export");
    if (!icon) throw new Error("the zone should draw its icon");
    const box = (el: Element) => el.getBoundingClientRect();

    // Stacked: each part starts below the one before it, 8px (`gap-2`) apart.
    await expect(box(label).top - box(icon).bottom).toBeCloseTo(8, 0);
    await expect(box(hint).top - box(label).bottom).toBeCloseTo(8, 0);

    // Centred: every part's midline is the zone's.
    const middle = (el: Element) => box(el).left + box(el).width / 2;
    for (const part of [icon, label, hint]) {
      await expect(middle(part)).toBeCloseTo(middle(zone), 0);
    }

    // And it still picks: a dropped file arrives as its text and its name.
    drop(zone, [new File(['{"lanes":[]}'], "board.json", { type: "application/json" })]);
    await waitFor(() => expect(onPick).toHaveBeenCalledWith('{"lanes":[]}', "board.json"));
  },
};

const onPickMany = fn();

/** What a text pick of a loose file hands back: its `path` is its name, and no `bytes`. */
const text = (name: string, text: string, type = "text/markdown"): PickedFile => ({
  name,
  path: name,
  type,
  text,
});

const md = (name: string, text: string) => new File([text], name, { type: "text/markdown" });
// Browsers often report no type at all for `.md`, which is why `accept` lists the extension.
const untypedMd = (name: string, text: string) => new File([text], name);
const png = new File(["\u0089PNG"], "diagram.png", { type: "image/png" });

function fileInput(canvasElement: HTMLElement) {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("the picker should render its file input");
  return input;
}

/**
 * Issue #130: dropping a handful of notes kept only the first, and a drop ignored `accept`. With
 * `multiple` and `onPickMany`, one drop is one call carrying every file `accept` allows, in drop
 * order — the image dropped among the notes is skipped, not read.
 */
export const SeveralDropped: Story = {
  render: () => (
    <SideBySide
      native={
        <Native label="Upload notes" accept=".md,text/markdown" multiple onPickMany={onPickMany} />
      }
      compiled={
        <Compiled
          label="Upload notes"
          hint="Drop .md files, or click to choose"
          accept=".md,text/markdown"
          multiple
          onPick={onPick}
          onPickMany={onPickMany}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onPick.mockClear();
    onPickMany.mockClear();

    const zone = canvas.getByRole("button", { name: /Upload notes/ });
    drop(zone, [md("a.md", "# A"), png, untypedMd("b.md", "# B"), md("c.md", "# C")]);

    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(1));
    // The untyped one reports no type, rather than a guess from its extension.
    await expect(onPickMany).toHaveBeenCalledWith([
      text("a.md", "# A"),
      text("b.md", "# B", ""),
      text("c.md", "# C"),
    ]);
    // `onPickMany` wins: given both, the one-at-a-time callback is not also called.
    await expect(onPick).not.toHaveBeenCalled();

    // A drop of nothing `accept` allows calls nothing.
    drop(zone, [png]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(onPickMany).toHaveBeenCalledTimes(1);
  },
};

/**
 * The dialog path with `multiple` and only `onPick`: the input takes a multi-select, and a caller
 * that already handles one file at a time is called once per file, in order, with no new code.
 */
export const SeveralPicked: Story = {
  render: () => (
    <Compiled label="Upload notes" accept=".md,text/markdown" multiple onPick={onPick} />
  ),
  play: async ({ canvasElement, userEvent }) => {
    onPick.mockClear();

    const input = fileInput(canvasElement);
    await expect(input.multiple).toBe(true);
    await userEvent.upload(input, [md("a.md", "# A"), md("b.md", "# B"), md("c.md", "# C")]);

    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(3));
    await expect(onPick).toHaveBeenNthCalledWith(1, "# A", "a.md");
    await expect(onPick).toHaveBeenNthCalledWith(2, "# B", "b.md");
    await expect(onPick).toHaveBeenNthCalledWith(3, "# C", "c.md");
  },
};

/**
 * Without `multiple` a pick is one file, and a drop of several keeps the first one `accept`
 * allows — here the image is dropped first and the board after it, so the board is the pick.
 */
export const OneAtATime: Story = {
  render: () => <Compiled label="Import a board" accept="application/json,.json" onPick={onPick} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onPick.mockClear();

    await expect(fileInput(canvasElement).multiple).toBe(false);
    drop(canvas.getByRole("button", { name: "Import a board" }), [
      png,
      new File(["{}"], "board.json", { type: "application/json" }),
      new File(["[]"], "other.json", { type: "application/json" }),
    ]);

    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(1));
    await expect(onPick).toHaveBeenCalledWith("{}", "board.json");
  },
};

/** The `compiled` column of a `SideBySide`, so a query does not also find the native half. */
function compiledColumn(canvasElement: HTMLElement) {
  const column = canvasElement.querySelectorAll("section")[1];
  if (!(column instanceof HTMLElement)) throw new Error("the story should render both halves");
  return column;
}

/**
 * Stops a click on the file input from opening the browser's dialog, which a test cannot close,
 * and counts it instead. Counting the click is the proof a trigger opens the dialog.
 */
function catchDialog(input: HTMLInputElement) {
  const opened = fn();
  // Once: `userEvent.upload` clicks the input too, and gives up if that click is prevented.
  input.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      opened();
    },
    { once: true },
  );
  return opened;
}

/**
 * Issue #131: the picker as a compact trigger, so a page header's Upload action opens the file
 * dialog directly instead of opening a dialog that holds a drop zone. `variant` and `size` are the
 * `Button`'s. At an `icon*` size only the icon shows and `label` is the accessible name. The
 * button still takes a drop onto itself.
 *
 * The native half draws the same button, disabled, and gives the reason as its hint.
 */
export const AsAButton: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row items-center gap-2">
          <NativeButton variant="ghost" size="icon-sm" label="Upload notes" onPick={onPick} />
          <NativeButton variant="outline" label="Import a board" onPick={onPick} />
        </div>
      }
      compiled={
        <PageHeader
          title="Notes"
          action={
            <>
              <CompiledButton
                variant="ghost"
                size="icon-sm"
                label="Upload notes"
                accept=".md,text/markdown"
                multiple
                onPickMany={onPickMany}
              />
              <CompiledButton
                variant="outline"
                icon={<Plus />}
                label="Import a board"
                accept=".json"
                onPick={onPick}
              />
            </>
          }
        />
      }
    />
  ),
  play: async ({ canvasElement, userEvent }) => {
    const compiled = within(compiledColumn(canvasElement));
    onPick.mockClear();
    onPickMany.mockClear();

    // Named by `label`. At an icon size it is the icon alone; otherwise the label shows too.
    const upload = compiled.getByRole("button", { name: "Upload notes" });
    const board = compiled.getByRole("button", { name: "Import a board" });
    await expect(upload.textContent).toBe("");
    await expect(upload.querySelector("svg")).not.toBeNull();
    await expect(board).toHaveTextContent("Import a board");
    // The caller's `size` reached the Button: `icon-sm` is a 36px square.
    await expect(upload.getBoundingClientRect().width).toBe(36);
    await expect(upload.getBoundingClientRect().height).toBe(36);

    // A press opens the file dialog straight away. The input is the button's next sibling.
    const uploadInput = upload.nextElementSibling;
    if (!(uploadInput instanceof HTMLInputElement)) throw new Error("the input should follow");
    await expect(uploadInput.multiple).toBe(true);
    const opened = catchDialog(uploadInput);
    await userEvent.click(upload);
    await expect(opened).toHaveBeenCalledTimes(1);

    // The dialog's answer, and a drop onto the button itself, both reach the callback.
    await userEvent.upload(uploadInput, [md("a.md", "# A"), md("b.md", "# B")]);
    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(1));
    await expect(onPickMany).toHaveBeenLastCalledWith([text("a.md", "# A"), text("b.md", "# B")]);
    drop(upload, [png, md("c.md", "# C")]);
    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(2));
    await expect(onPickMany).toHaveBeenLastCalledWith([text("c.md", "# C")]);

    // The native half says it cannot pick, rather than pressing and doing nothing.
    const native = within(canvasElement.querySelectorAll("section")[0] as HTMLElement);
    for (const name of ["Upload notes", "Import a board"]) {
      await expect(native.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
    }
    await expect(onPick).not.toHaveBeenCalled();
  },
};

/** The files the last `onPickMany` call was handed. */
function lastPick(): PickedFile[] {
  return onPickMany.mock.lastCall?.[0] ?? [];
}

// The start of a real archive, then bytes that are not UTF-8: `file.text()` turns each of the
// last four into U+FFFD, which is three bytes going back, so the archive no longer opens.
const ZIP = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0xff, 0xfe, 0x80, 0xc3];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const bytesFile = (name: string, bytes: number[], type: string) =>
  new File([new Uint8Array(bytes)], name, { type });

/**
 * Issue #207: a picker that only decodes text cannot take a `.zip` or an image, so an app that
 * uploads one kept its own hidden input. With `read="bytes"` the file comes back byte for byte in
 * `bytes`, with its `type`, and `text` is left empty rather than holding a corrupted decode.
 */
export const Binary: Story = {
  render: () => (
    <CompiledButton
      variant="outline"
      label="Choose .md or .zip"
      accept=".md,.zip,application/zip"
      read="bytes"
      onPickMany={onPickMany}
    />
  ),
  play: async ({ canvasElement, userEvent }) => {
    onPickMany.mockClear();

    const archive = bytesFile("skill.zip", ZIP, "application/zip");
    // The premise: decoded and encoded again, these are not the bytes that went in.
    const decoded = new TextEncoder().encode(await archive.text());
    await expect(Array.from(decoded)).not.toEqual(ZIP);

    await userEvent.upload(fileInput(canvasElement), archive);
    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(1));

    const [picked] = lastPick();
    await expect(picked?.bytes).toBeInstanceOf(Uint8Array);
    await expect(Array.from(picked?.bytes ?? [])).toEqual(ZIP);
    await expect(picked).toMatchObject({
      name: "skill.zip",
      path: "skill.zip",
      type: "application/zip",
      text: "",
    });
  },
};

/** A file as a folder dialog hands it over: `webkitRelativePath` filled, the folder's name first. */
function inFolder(path: string, file: File) {
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

/**
 * The folder dialog's answer. A test cannot drive that dialog, and `userEvent.upload` keeps one
 * file on an input without `multiple`, where a real folder pick fills the list with all of them.
 */
function pickFolder(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  // The picker has copied the list by now. Left in place, the stand-in would shadow the input's
  // own `files`, and a real pick made in the canvas afterwards would hand back these again.
  Reflect.deleteProperty(input, "files");
}

/**
 * Issue #207: `directory` makes the dialog choose a folder, and every file under it arrives in one
 * call with where it sat as its `path` — so the tree keeps its shape. Here with `read="bytes"`,
 * since a folder holds images beside its Markdown. `multiple` is not needed: a folder is all of
 * its files.
 */
export const Folder: Story = {
  render: () => (
    <CompiledButton
      variant="outline"
      label="Choose folder"
      directory
      read="bytes"
      onPickMany={onPickMany}
    />
  ),
  play: async ({ canvasElement }) => {
    onPickMany.mockClear();

    const input = fileInput(canvasElement);
    await expect(input.webkitdirectory).toBe(true);

    pickFolder(input, [
      inFolder("my-skill/SKILL.md", md("SKILL.md", "# My skill")),
      inFolder("my-skill/assets/logo.png", bytesFile("logo.png", PNG, "image/png")),
      inFolder("my-skill/reference/api.md", md("api.md", "# API")),
    ]);
    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(1));

    const picked = lastPick();
    await expect(picked.map((file) => [file.path, file.name, file.type])).toEqual([
      ["my-skill/SKILL.md", "SKILL.md", "text/markdown"],
      ["my-skill/assets/logo.png", "logo.png", "image/png"],
      ["my-skill/reference/api.md", "api.md", "text/markdown"],
    ]);
    await expect(Array.from(picked[1]?.bytes ?? [])).toEqual(PNG);
    await expect(new TextDecoder().decode(picked[0]?.bytes)).toBe("# My skill");
  },
};

type Tree = File | { [name: string]: Tree };

/**
 * A `FileSystemEntry` over a plain tree, since a test cannot make a real one. A folder's reader
 * hands its children back two at a time and then an empty batch, the way a browser pages a big
 * folder, so reading only the first batch would show up here as missing files.
 */
function entry(name: string, tree: Tree, parent = ""): FileSystemEntry {
  const fullPath = `${parent}/${name}`;
  if (tree instanceof File) {
    const file = (resolve: (file: File) => void) => resolve(tree);
    return { isFile: true, isDirectory: false, name, fullPath, file } as unknown as FileSystemEntry;
  }
  const children = Object.entries(tree).map(([child, sub]) => entry(child, sub, fullPath));
  const createReader = () => ({
    readEntries: (resolve: (batch: FileSystemEntry[]) => void) => resolve(children.splice(0, 2)),
  });
  return {
    isFile: false,
    isDirectory: true,
    name,
    fullPath,
    createReader,
  } as unknown as FileSystemEntry;
}

/**
 * A `drop` of folders. The browser builds a real `DataTransfer`'s entries from the disk, so the
 * event carries a stand-in with only what a drop handler reads: `items`, each with its entry.
 */
function dropEntries(target: Element, entries: FileSystemEntry[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  const items = entries.map((dropped) => ({ kind: "file", webkitGetAsEntry: () => dropped }));
  Object.defineProperty(event, "dataTransfer", { value: { items, files: [] } });
  target.dispatchEvent(event);
}

/**
 * A folder dropped on the zone follows the same `path` rule as one picked in the dialog: the tree
 * is walked, every level of it, and each file reports its place under the folder's own name.
 * `accept` still applies, so the image in the folder is skipped and never read.
 */
export const FolderDropped: Story = {
  render: () => (
    <Compiled
      label="Add a folder of notes"
      hint="Drop a folder, or click to choose one"
      accept=".md,text/markdown"
      directory
      onPickMany={onPickMany}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onPickMany.mockClear();

    dropEntries(canvas.getByRole("button", { name: /Add a folder of notes/ }), [
      entry("notes", {
        "index.md": md("index.md", "# Index"),
        "cover.png": png,
        drafts: {
          "one.md": md("one.md", "# One"),
          "two.md": md("two.md", "# Two"),
          old: { "three.md": md("three.md", "# Three") },
        },
        "todo.md": md("todo.md", "# Todo"),
      }),
    ]);

    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(1));
    await expect(lastPick()).toEqual([
      { ...text("index.md", "# Index"), path: "notes/index.md" },
      { ...text("one.md", "# One"), path: "notes/drafts/one.md" },
      { ...text("two.md", "# Two"), path: "notes/drafts/two.md" },
      { ...text("three.md", "# Three"), path: "notes/drafts/old/three.md" },
      { ...text("todo.md", "# Todo"), path: "notes/todo.md" },
    ]);
  },
};
