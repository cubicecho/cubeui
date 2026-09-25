import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
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
 * The command list on both halves, with the props `MultiSelect` uses: a named search box, groups
 * that hide their heading when nothing in them matches, `keywords`, an empty message, a
 * `forceMount` row that survives the filter, a controlled search, and `onSelect` handed the
 * item's value. The web half is cmdk; the native one is its own list, chosen by press.
 *
 * The native half is imported by its full name because Vite would otherwise resolve
 * `command.web.tsx`.
 */
const meta = { title: "Command" } satisfies Meta;
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
