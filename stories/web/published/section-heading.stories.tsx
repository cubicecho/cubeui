import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SectionHeading } from "@/components/section-heading";

/**
 * `SectionHeading`, as installed beside it by `@cubeui/section-heading-stories`. It is a
 * `registry:component`, so this file lands in `components/` beside it rather than in
 * `components/ui/`.
 */
const meta = {
  title: "cubeui/SectionHeading",
  component: SectionHeading,
  args: { children: "Upcoming" },
  decorators: [
    (Story) => (
      <div className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Muted, and muted means *different from body text* — the palette-free version of asserting
 * `text-muted-foreground` resolved.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByText("Upcoming");
    const body = getComputedStyle(heading.parentElement as Element).color;
    await expect(getComputedStyle(heading).color).not.toBe(body);
  },
};

export const Overline: Story = {
  args: { variant: "overline", children: "This week" },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByText("This week");
    await expect(getComputedStyle(heading).textTransform).toBe("uppercase");
  },
};
