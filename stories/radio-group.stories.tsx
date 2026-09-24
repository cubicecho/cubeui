import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  RadioGroupItem as CompiledItem,
  RadioGroup as CompiledRadioGroup,
} from "../compiled/radio-group";
import { RadioGroupField } from "../compiled/radio-group-field";
import { RadioGroup as NativeRadioGroup, RadioGroupItem } from "../registry/ui/radio-group";
import { SideBySide } from "./side-by-side";

/**
 * The radio contract a consumer used to write by hand — one tab stop, arrows that move *and*
 * select, a hover hint — asserted on both halves, because the point of the item is that nobody
 * writes it again. The keyboard is web-only by design (a phone has no arrow keys), and both halves
 * here are the web: react-native-web on the left, the compiled DOM on the right.
 */
const meta = { title: "Stage 0/RadioGroup" } satisfies Meta;
export default meta;
type Story = StoryObj;

function NativeHarness({ variant }: { variant: "row" | "card" | "segmented" }) {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <NativeRadioGroup
      aria-label="Native theme"
      value={value}
      onValueChange={setValue}
      variant={variant}
    >
      <RadioGroupItem value="light" label="Light" hint="Always light" icon={<Text>☀</Text>} />
      <RadioGroupItem value="dark" label="Dark" hint="Always dark" icon={<Text>☾</Text>} />
      <RadioGroupItem value="system" label="System" description="Follows the device." />
    </NativeRadioGroup>
  );
}

function CompiledHarness({ variant }: { variant: "row" | "card" | "segmented" }) {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <CompiledRadioGroup
      aria-label="Compiled theme"
      value={value}
      onValueChange={setValue}
      variant={variant}
    >
      <CompiledItem value="light" label="Light" hint="Always light" icon={<span>☀</span>} />
      <CompiledItem value="dark" label="Dark" hint="Always dark" icon={<span>☾</span>} />
      <CompiledItem value="system" label="System" description="Follows the device." />
    </CompiledRadioGroup>
  );
}

/** One tab stop, arrows that move and select, wrapping — the same on both halves. */
async function assertKeyboard(group: HTMLElement) {
  const g = within(group);
  const radio = (name: string) => g.getByRole("radio", { name });

  // Nothing checked: the first option is the one tab stop.
  await waitFor(() => expect(radio("Light").tabIndex).toBe(0));
  await expect(radio("Dark").tabIndex).toBe(-1);
  await expect(radio("System").tabIndex).toBe(-1);

  radio("Light").focus();
  await userEvent.keyboard("{ArrowDown}");
  await waitFor(() => expect(radio("Dark")).toHaveAttribute("aria-checked", "true"));
  await expect(radio("Dark")).toHaveFocus();
  // The checked option is now the tab stop, and the only one.
  await expect(radio("Dark").tabIndex).toBe(0);
  await expect(radio("Light").tabIndex).toBe(-1);

  await userEvent.keyboard("{ArrowRight}");
  await waitFor(() => expect(radio("System")).toHaveAttribute("aria-checked", "true"));
  // Wraps from the last to the first.
  await userEvent.keyboard("{ArrowDown}");
  await waitFor(() => expect(radio("Light")).toHaveAttribute("aria-checked", "true"));
  await expect(radio("Light")).toHaveFocus();
  await userEvent.keyboard("{ArrowUp}");
  await waitFor(() => expect(radio("System")).toHaveAttribute("aria-checked", "true"));
  await expect(g.getAllByRole("radio", { checked: true })).toHaveLength(1);
}

export const Row: Story = {
  render: () => (
    <SideBySide
      native={<NativeHarness variant="row" />}
      compiled={<CompiledHarness variant="row" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await assertKeyboard(canvas.getByRole("radiogroup", { name: "Native theme" }));
    await assertKeyboard(canvas.getByRole("radiogroup", { name: "Compiled theme" }));

    // A click checks, and the description describes its own option only.
    const compiled = within(canvas.getByRole("radiogroup", { name: "Compiled theme" }));
    await userEvent.click(compiled.getByRole("radio", { name: "Dark" }));
    await expect(compiled.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(compiled.getByRole("radio", { name: "System" })).toHaveAccessibleDescription(
      "Follows the device.",
    );
  },
};

export const Card: Story = {
  render: () => (
    <SideBySide
      native={<NativeHarness variant="card" />}
      compiled={<CompiledHarness variant="card" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const compiled = within(canvas.getByRole("radiogroup", { name: "Compiled theme" }));
    // The hover hint is the element's own `title`, with no spread at the call site.
    await expect(compiled.getByRole("radio", { name: "Light" })).toHaveAttribute(
      "title",
      "Always light",
    );
    await assertKeyboard(canvas.getByRole("radiogroup", { name: "Compiled theme" }));

    // The tiles share the row: `flex-1` on each, the same width on both halves.
    const nativeTile = within(canvas.getByRole("radiogroup", { name: "Native theme" })).getByRole(
      "radio",
      { name: "Dark" },
    );
    const compiledTile = compiled.getByRole("radio", { name: "Dark" });
    await expect(getComputedStyle(compiledTile).flexGrow).toBe("1");
    await expect(getComputedStyle(compiledTile).borderTopWidth).toBe(
      getComputedStyle(nativeTile).borderTopWidth,
    );
  },
};

/**
 * The `SegmentedGroup` look with the radio contract: one framed row across the container, equal
 * segments, the checked one filled — and still one tab stop and arrows that move and choose.
 */
export const Segmented: Story = {
  render: () => (
    <SideBySide
      native={<NativeHarness variant="segmented" />}
      compiled={<CompiledHarness variant="segmented" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Native theme", "Compiled theme"]) {
      const group = canvas.getByRole("radiogroup", { name });
      await assertKeyboard(group);
      // Full width: the frame is as wide as the column it sits in.
      const column = group.parentElement as HTMLElement;
      await expect(Math.round(group.getBoundingClientRect().width)).toBe(
        Math.round(column.getBoundingClientRect().width),
      );
      // Equal segments, and the checked one is the filled one.
      const radios = within(group).getAllByRole("radio");
      const widths = radios.map((r) => Math.round(r.getBoundingClientRect().width));
      await expect(new Set(widths).size).toBe(1);
      const checked = within(group).getByRole("radio", { checked: true });
      const unchecked = radios.find((r) => r !== checked) as HTMLElement;
      await expect(getComputedStyle(checked).backgroundColor).not.toBe(
        getComputedStyle(unchecked).backgroundColor,
      );
    }
    // A segment draws no description, so it is described by nothing.
    const compiled = within(canvas.getByRole("radiogroup", { name: "Compiled theme" }));
    await expect(compiled.getByRole("radio", { name: "System" })).not.toHaveAttribute(
      "aria-describedby",
    );
  },
};

function FieldHarness() {
  const form = useForm({ defaultValues: { visibility: "" }, onSubmit: () => {} });
  return (
    <div className="flex flex-col gap-4 bg-background p-6">
      <RadioGroupField
        form={form}
        name="visibility"
        label="Visibility"
        description="Who can see this project."
        required
        validators={{ onSubmit: ({ value }) => (value ? undefined : "Pick one.") }}
        options={[
          { value: "private", label: "Private", description: "Only you." },
          { value: "team", label: "Team", description: "Everyone in the workspace." },
        ]}
      />
      <button type="button" onClick={() => form.handleSubmit()}>
        Save
      </button>
    </div>
  );
}

/** The compiled field: named by its title, silent until a submit, and cleared by choosing. */
export const Field: Story = {
  render: () => <FieldHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: /Visibility/ });
    await expect(group).toHaveAttribute("aria-required", "true");
    await expect(canvas.queryByRole("alert")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent("Pick one."));
    await expect(group).toHaveAttribute("aria-invalid", "true");

    await userEvent.click(canvas.getByRole("radio", { name: "Team" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await expect(canvas.getByRole("radio", { name: "Team" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};

/** A disabled option is skipped by the arrows and is never the tab stop. */
export const DisabledOption: Story = {
  render: () => (
    <CompiledRadioGroup aria-label="Size" defaultValue="s">
      <CompiledItem value="s" label="Small" />
      <CompiledItem value="m" label="Medium" disabled />
      <CompiledItem value="l" label="Large" />
    </CompiledRadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("radio", { name: "Small" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(canvas.getByRole("radio", { name: "Large" })).toHaveAttribute("aria-checked", "true"),
    );
    await expect(canvas.getByRole("radio", { name: "Medium" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};
