import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { MultiSelect as CompiledMultiSelect } from "../compiled/multi-select";
import {
  type MultiSelectOption,
  MultiSelect as NativeMultiSelect,
} from "../registry/layout/multi-select";
import { SideBySide } from "./side-by-side";

/**
 * `MultiSelect` on both web halves: the React Native source under react-native-web on the left —
 * which is what an Expo web app runs, over the web halves of `popover` and `command` — and the
 * compiled DOM on the right. The behaviour the web tier's own stories hold it to is in
 * `stories/web/multi-select.stories.tsx`, against the compiled file a DOM app installs; this one
 * is that the React Native source opens, filters, chooses, creates and clears the same way.
 *
 * On device the popover is the native sheet and the command list the native one, which a story in
 * a browser cannot reach; `command.stories.tsx` holds that list to the same filter.
 */
const meta = { title: "Control/MultiSelect (both halves)" } satisfies Meta;
export default meta;
type Story = StoryObj;

const TAGS: MultiSelectOption[] = [
  { value: "backend", label: "Backend infrastructure", group: "Area" },
  { value: "frontend", label: "Frontend", group: "Area" },
  { value: "work", label: "Work", color: "#1d4ed8", group: "Kind" },
  { value: "urgent", label: "Urgent", color: "#dc2626", group: "Kind", meta: "3" },
  {
    value: "someday",
    label: "Someday",
    disabled: true,
    group: "Kind",
    hint: "Retired: nothing new is filed as someday",
  },
];

type Picker = ComponentType<{
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  onCreateOption?: ((name: string) => void) | undefined;
  "aria-label"?: string | undefined;
}>;

function Harness({ Picker, name }: { Picker: Picker; name: string }) {
  const [value, setValue] = useState<string[]>(["work"]);
  const [extra, setExtra] = useState<MultiSelectOption[]>([]);
  return (
    <div className="w-80">
      <Picker
        aria-label={name}
        options={[...TAGS, ...extra]}
        value={value}
        onValueChange={setValue}
        onCreateOption={(label) => {
          const created = { value: label.toLowerCase(), label };
          setExtra((all) => [...all, created]);
          setValue((all) => [...all, created.value]);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<Harness Picker={NativeMultiSelect as Picker} name="Native tags" />}
      compiled={<Harness Picker={CompiledMultiSelect as Picker} name="Compiled tags" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Native tags", "Compiled tags"]) {
      const trigger = canvas.getByRole("combobox", { name });

      await step(`${name}: the trigger shows the chosen chip and no button inside it`, async () => {
        await expect(trigger).toHaveTextContent("Work");
        await expect(trigger.querySelectorAll("button")).toHaveLength(0);
      });

      await step(`${name}: pressing the trigger opens the list, grouped`, async () => {
        await userEvent.click(trigger);
        await screen.findByRole("listbox");
        await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
        await expect(screen.getByRole("option", { name: "Work" })).toHaveAttribute(
          "aria-checked",
          "true",
        );
        await waitFor(() => expect(screen.getByText("Area")).toBeVisible());
      });

      await step(`${name}: a disabled row says why, as a description`, async () => {
        const someday = screen.getByRole("option", { name: "Someday" });
        const hint = document.getElementById(someday.getAttribute("aria-describedby") ?? "");
        // `testID` is `data-slot` once compiled and `data-testid` under react-native-web.
        await expect(hint?.getAttribute("data-slot") ?? hint?.getAttribute("data-testid")).toBe(
          "multi-select-option-hint",
        );
        await expect(hint).toHaveTextContent(/Retired/);
      });

      await step(`${name}: choosing adds a chip, and every word filters`, async () => {
        await userEvent.click(screen.getByRole("option", { name: "Frontend" }));
        await waitFor(() => expect(trigger).toHaveTextContent("Frontend"));

        await userEvent.type(screen.getByLabelText("Search"), "infra back");
        await waitFor(() =>
          expect(
            screen.getAllByRole("option").filter((row) => !/^Add /.test(row.textContent ?? "")),
          ).toHaveLength(1),
        );
        await expect(screen.getByRole("option", { name: /Backend/ })).toBeVisible();
      });

      await step(`${name}: a new name is offered and created`, async () => {
        const search = screen.getByLabelText("Search");
        await userEvent.clear(search);
        await userEvent.type(search, "Roadmap");
        await userEvent.click(await screen.findByRole("option", { name: /Add .Roadmap./ }));
        await waitFor(() => expect(trigger).toHaveTextContent("Roadmap"));
      });

      await step(`${name}: Clear empties it, and Escape closes`, async () => {
        await userEvent.click(screen.getByRole("button", { name: "Clear" }));
        await waitFor(() => expect(trigger).toHaveTextContent("Select…"));
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
      });
    }
  },
};
