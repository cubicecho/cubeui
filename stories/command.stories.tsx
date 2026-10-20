import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  CommandDialog as CompiledDialog,
  CommandEmpty as CompiledEmpty,
  CommandGroup as CompiledGroup,
  CommandInput as CompiledInput,
  CommandItem as CompiledItem,
  CommandList as CompiledList,
  Command as CompiledRoot,
  CommandSeparator as CompiledSeparator,
  CommandShortcut as CompiledShortcut,
} from "../compiled/command";
import {
  CommandEmpty as NativeEmpty,
  CommandGroup as NativeGroup,
  CommandInput as NativeInput,
  CommandItem as NativeItem,
  CommandList as NativeList,
  Command as NativeRoot,
  CommandSeparator as NativeSeparator,
  CommandShortcut as NativeShortcut,
} from "../registry/ui/command.tsx";
import { SideBySide } from "./side-by-side";

/**
 * The command list on both halves, with the props `Combobox` uses: a named search box, groups
 * that hide their heading when nothing in them matches, `keywords`, an empty message, a
 * `forceMount` row that survives the filter, a controlled search, and `onSelect` handed the
 * item's value. The web half is cmdk; the native one is its own list, chosen by press.
 *
 * The native half is imported by its full name because Vite would otherwise resolve
 * `command.web.tsx`.
 */
const meta = { title: "RN Parity/Command" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onNativeSelect = fn();
const onCompiledSelect = fn();

function NativeHarness() {
  const [search, setSearch] = useState("");
  return (
    <div data-testid="native-half">
      <NativeRoot label="Native fruit">
        <NativeInput value={search} onValueChange={setSearch} placeholder="Search…" />
        <NativeList>
          <NativeEmpty>Nothing grows here.</NativeEmpty>
          <NativeGroup heading="Fruit">
            <NativeItem onSelect={onNativeSelect}>Apple</NativeItem>
            <NativeItem onSelect={onNativeSelect}>
              Banana
              <NativeShortcut>⌘B</NativeShortcut>
            </NativeItem>
          </NativeGroup>
          <NativeSeparator />
          <NativeGroup heading="Vegetable">
            <NativeItem value="Carrot" keywords={["orange"]} onSelect={onNativeSelect}>
              Carrot
            </NativeItem>
            <NativeItem disabled onSelect={onNativeSelect}>
              Celery
            </NativeItem>
          </NativeGroup>
          <NativeGroup forceMount>
            <NativeItem forceMount value="__always__" onSelect={onNativeSelect}>
              Always here
            </NativeItem>
          </NativeGroup>
        </NativeList>
      </NativeRoot>
    </div>
  );
}

function CompiledHarness() {
  const [search, setSearch] = useState("");
  return (
    <div data-testid="compiled-half">
      <CompiledRoot label="Compiled fruit">
        <CompiledInput value={search} onValueChange={setSearch} placeholder="Search…" />
        <CompiledList>
          <CompiledEmpty>Nothing grows here.</CompiledEmpty>
          <CompiledGroup heading="Fruit">
            <CompiledItem onSelect={onCompiledSelect}>Apple</CompiledItem>
            <CompiledItem onSelect={onCompiledSelect}>
              Banana
              <CompiledShortcut>⌘B</CompiledShortcut>
            </CompiledItem>
          </CompiledGroup>
          <CompiledSeparator />
          <CompiledGroup heading="Vegetable">
            <CompiledItem value="Carrot" keywords={["orange"]} onSelect={onCompiledSelect}>
              Carrot
            </CompiledItem>
            <CompiledItem disabled onSelect={onCompiledSelect}>
              Celery
            </CompiledItem>
          </CompiledGroup>
          <CompiledGroup forceMount>
            <CompiledItem forceMount value="__always__" onSelect={onCompiledSelect}>
              Always here
            </CompiledItem>
          </CompiledGroup>
        </CompiledList>
      </CompiledRoot>
    </div>
  );
}

const visible = (half: HTMLElement, text: string) => {
  const node = within(half).queryByText(text);
  return node !== null && node.getClientRects().length > 0;
};

export const Default: Story = {
  render: () => <SideBySide native={<NativeHarness />} compiled={<CompiledHarness />} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const halves = [
      {
        name: "Native",
        half: canvas.getByTestId("native-half"),
        box: () => canvas.getByRole("searchbox", { name: "Native fruit" }),
        onSelect: onNativeSelect,
      },
      {
        name: "Compiled",
        half: canvas.getByTestId("compiled-half"),
        box: () => canvas.getByRole("combobox", { name: "Compiled fruit" }),
        onSelect: onCompiledSelect,
      },
    ];

    for (const { name, half, box, onSelect } of halves) {
      await step(`${name}: every row and both headings with no search`, async () => {
        for (const text of ["Fruit", "Vegetable", "Apple", "Banana", "Carrot", "Always here"]) {
          await expect(visible(half, text)).toBe(true);
        }
        await expect(visible(half, "Nothing grows here.")).toBe(false);
        await expect(half.querySelector(".h-px")).not.toBeNull();
      });

      // The compiled row has a fixed height for the box to fit; the native row grows to it.
      const row = box().closest("[data-slot=command-input-wrapper]");
      if (row !== null) {
        await step(`${name}: the search box sits inside its row`, async () => {
          await expect(inside(box(), row)).toBe(true);
        });
      }

      await step(
        `${name}: typing filters rows, hides an empty group and the separator`,
        async () => {
          await userEvent.type(box(), "ban");
          await waitFor(() => expect(visible(half, "Apple")).toBe(false));
          await expect(visible(half, "Banana")).toBe(true);
          await expect(visible(half, "Vegetable")).toBe(false);
          await expect(visible(half, "Always here")).toBe(true);
          await expect(half.querySelector(".h-px")).toBeNull();
        },
      );

      await step(`${name}: pressing a row hands over its value`, async () => {
        onSelect.mockClear();
        await userEvent.click(within(half).getByText("Banana"));
        // Both read the whole row with no `value`, as `textContent` would: the shortcut included.
        await expect(onSelect).toHaveBeenCalledWith("Banana⌘B");
      });

      await step(
        `${name}: keywords match, and nothing matching shows the empty message`,
        async () => {
          await userEvent.clear(box());
          await userEvent.type(box(), "orange");
          await waitFor(() => expect(visible(half, "Carrot")).toBe(true));
          await expect(visible(half, "Vegetable")).toBe(true);
          await expect(visible(half, "Fruit")).toBe(false);

          await userEvent.clear(box());
          await userEvent.type(box(), "zzz");
          await waitFor(() => expect(visible(half, "Nothing grows here.")).toBe(true));
          await userEvent.clear(box());
        },
      );
    }
  },
};

/** Whether `inner`'s box lies inside `outer`'s, to the pixel. */
const inside = (inner: Element, outer: Element) => {
  const a = inner.getBoundingClientRect();
  const b = outer.getBoundingClientRect();
  return a.top >= b.top && a.bottom <= b.bottom && a.left >= b.left && a.right <= b.right;
};

/**
 * The palette as an app opens it from a shortcut: `CommandDialog`, whose card has no padding, so
 * the search row and the rule under it run edge to edge. Web only, because two open dialogs side
 * by side would sit on each other; the native half's row is held by `Default`.
 *
 * The input used to stand 4px taller than its row, so the rule cut across the box. An app that
 * put `Command` in a padded `Dialog` and cleared its fill saw that rule float under the title.
 */
export const InADialog: Story = {
  render: () => (
    <CompiledDialog
      open
      title="Find a todo"
      description="By title or description."
      label="Search todos"
      shouldFilter={false}
    >
      <CompiledInput placeholder="Search todos" />
      <CompiledList>
        <CompiledEmpty>Nothing matches.</CompiledEmpty>
        <CompiledItem>Write the release notes</CompiledItem>
        <CompiledItem>Book the venue</CompiledItem>
      </CompiledList>
    </CompiledDialog>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", { name: "Find a todo" });
    const box = within(dialog).getByRole("combobox", { name: "Search todos" });
    const row = box.closest("[data-slot=command-input-wrapper]");
    await expect(row).not.toBeNull();
    if (row === null) {
      return;
    }
    // Measured once the card has finished zooming in; mid-animation every box is scaled.
    await waitFor(() => expect(dialog.getAnimations().length).toBe(0));
    await expect(inside(box, row)).toBe(true);
    const card = dialog.getBoundingClientRect();
    const edge = row.getBoundingClientRect();
    await expect(edge.left).toBe(card.left + dialog.clientLeft);
    await expect(edge.right).toBe(card.right - dialog.clientLeft);

    // `shouldFilter` reaches the list: a server-matched list is drawn as it came back.
    await userEvent.type(box, "zzz");
    await expect(within(dialog).getByText("Book the venue")).toBeVisible();
  },
};
