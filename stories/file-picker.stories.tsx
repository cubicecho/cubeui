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
    await expect(onPickMany).toHaveBeenCalledWith([
      { text: "# A", name: "a.md" },
      { text: "# B", name: "b.md" },
      { text: "# C", name: "c.md" },
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
    await expect(onPickMany).toHaveBeenLastCalledWith([
      { text: "# A", name: "a.md" },
      { text: "# B", name: "b.md" },
    ]);
    drop(upload, [png, md("c.md", "# C")]);
    await waitFor(() => expect(onPickMany).toHaveBeenCalledTimes(2));
    await expect(onPickMany).toHaveBeenLastCalledWith([{ text: "# C", name: "c.md" }]);

    // The native half says it cannot pick, rather than pressing and doing nothing.
    const native = within(canvasElement.querySelectorAll("section")[0] as HTMLElement);
    for (const name of ["Upload notes", "Import a board"]) {
      await expect(native.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
    }
    await expect(onPick).not.toHaveBeenCalled();
  },
};
