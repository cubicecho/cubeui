import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { FieldRow } from "@/registry/new-york/form/field-row";
import { FormField } from "@/registry/new-york/form/form-field";
import { Input } from "@/registry/new-york/ui/input";

const meta = {
  title: "Form/FieldRow",
  component: FieldRow,
  parameters: { layout: "centered" },
} satisfies Meta<typeof FieldRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const cells = (canvasElement: HTMLElement) =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-slot=field-row-cell]"));

/** Two values that belong together, on one line. The shape this exists for. */
export const TwoUp: Story = {
  args: {
    content: (
      <>
        <FormField label="Priority" control={<Input defaultValue="Normal" />} />
        <FormField label="Duration" control={<Input defaultValue="30 minutes" />} />
      </>
    ),
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvasElement }) => {
    const [first, second] = cells(canvasElement);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;

    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();

    // One line, and the same width — the cells share the row rather than sizing to their content.
    expect(b.top).toBe(a.top);
    expect(b.left).toBeGreaterThan(a.right);
    expect(b.width).toBeCloseTo(a.width, 0);
  },
};

/**
 * The reason this is a component and not `grid grid-cols-2 gap-4`.
 *
 * A grid keeps its columns at every width, so the same row that reads well on a settings page
 * becomes two 140px fields inside a dialog, and a third one becomes three 90px fields — by which
 * point the value in each is clipped. The floor on a cell is what makes the row wrap instead,
 * and it is the part nobody remembers to add to a grid written in a hurry.
 */
export const WrapsRatherThanSqueezing: Story = {
  args: {
    content: (
      <>
        <FormField label="Priority" control={<Input />} />
        <FormField label="Duration" control={<Input />} />
        <FormField label="Repeats" control={<Input />} />
      </>
    ),
  },
  decorators: [(Story) => <div className="w-[420px] border p-4">{Story()}</div>],
  play: async ({ canvasElement }) => {
    const [first, second, third] = cells(canvasElement);
    if (!first || !second || !third) return;

    expect(second.getBoundingClientRect().top).toBe(first.getBoundingClientRect().top);

    // The third dropped to its own line, at full width, rather than making three narrow columns.
    expect(third.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().bottom);
    expect(third.getBoundingClientRect().width).toBeGreaterThan(
      first.getBoundingClientRect().width,
    );
  },
};

/** `perRow` is the floor, and the floor is the only thing that changes. */
export const ThreeUp: Story = {
  args: {
    perRow: 3,
    content: (
      <>
        <FormField label="Day" control={<Input />} />
        <FormField label="Month" control={<Input />} />
        <FormField label="Year" control={<Input />} />
      </>
    ),
  },
  decorators: [(Story) => <div className="w-[560px]">{Story()}</div>],
  play: async ({ canvasElement }) => {
    const found = cells(canvasElement);
    expect(found).toHaveLength(3);
    const tops = found.map((cell) => cell.getBoundingClientRect().top);
    expect(new Set(tops).size).toBe(1);
  },
};

/**
 * A field that renders nothing leaves no cell behind, so `{isEdit && <FormField …/>}` does not
 * silently take a third of the row with it.
 */
export const AbsentFieldsTakeNoSpace: Story = {
  args: {
    content: (
      <>
        <FormField label="Priority" control={<Input />} />
        {false && <FormField label="Never" control={<Input />} />}
        {null}
        <FormField label="Duration" control={<Input />} />
      </>
    ),
  },
  decorators: [(Story) => <div className="w-[480px]">{Story()}</div>],
  play: async ({ canvasElement }) => {
    expect(cells(canvasElement)).toHaveLength(2);
  },
};
