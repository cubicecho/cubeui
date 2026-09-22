import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge } from "@/components/ui/badge";

/**
 * `Badge`, as installed beside it by `@cubeui/badge-stories`. Same rules as the button's: nothing
 * here asserts a colour, since the consumer's tokens own those — axe's contrast pass over every
 * variant is the colour check, and it is the consumer's palette it runs against.
 */
const meta = {
  title: "cubeui/Badge",
  component: Badge,
  args: { children: "Active" },
  decorators: [
    (Story) => (
      <div className="flex flex-row flex-wrap items-center gap-2 bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Active")).toBeInTheDocument();
  },
};

/** Every variant with a label, for the contrast pass. */
export const Variants: Story = {
  render: () => (
    <>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Warning")).toBeInTheDocument();
  },
};

/**
 * No label collapses the pill to a dot, which is named when it means something and hidden when
 * it does not — never an unnamed node in the accessibility tree.
 */
export const Dots: Story = {
  render: () => (
    <>
      <Badge variant="warning" label="Paused" />
      <Badge variant="secondary" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Paused" })).toBeInTheDocument();
    await expect(canvas.queryAllByRole("img")).toHaveLength(1);
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  },
};
