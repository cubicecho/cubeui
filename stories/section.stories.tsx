import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect, within } from "storybook/test";
import { Section } from "@/registry/new-york/layout/section";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";

const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

const Fields = () => (
  <div className="grid w-[420px] gap-4">
    <div className="grid gap-2">
      <Label htmlFor="work-length">Work length</Label>
      <Input id="work-length" defaultValue="25" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="break-length">Break length</Label>
      <Input id="break-length" defaultValue="5" />
    </div>
  </div>
);

export const Default: Story = {
  args: { title: "Pomodoro", content: <Fields /> },
};

/**
 * The heading is an `h2`, not a small grey `div`. A settings screen is thirty fields in six
 * groups, and the heading list is the only way that is navigable without arrowing through all
 * thirty — which is what the hand-written versions of this in three of these apps cost.
 */
export const TheTitleIsAHeading: Story = {
  args: { title: "Pomodoro", content: <Fields /> },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("heading", { level: 2, name: "Pomodoro" })).toBeVisible();
  },
};

/** A line under the title when the group needs a sentence, not just a name. */
export const WithADescription: Story = {
  args: {
    title: "Notifications",
    description: "How this workspace reaches you when something needs a decision.",
    content: <Fields />,
  },
};

/** The heading row's far end. An add button, a count, a switch that turns the group off. */
export const WithAnAction: Story = {
  args: {
    title: "Aliases",
    action: (
      <Button size="sm" variant="outline">
        <Plus /> Add
      </Button>
    ),
    content: <Fields />,
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Add" })).toBeVisible();
  },
};

/** `rule` draws the hairline one of the three call sites had and the other two did not. */
export const WithARule: Story = {
  args: { title: "Danger zone", rule: true, content: <Fields /> },
};

/**
 * No title, just the gap and the body. Useful as the last group on a page, the one that needs no
 * name — and it must not leave an empty heading row behind.
 */
export const ContentOnly: Story = {
  args: { content: <Fields /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=section-heading]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=section-content]")).not.toBeNull();
  },
};

/**
 * Stacked, which is the only way it is ever really used. The heading sizes and the gaps come
 * from one place, so the sixth section cannot be the one someone typed `tracking-wide` into.
 */
export const Stacked: Story = {
  args: { title: "Pomodoro", content: <Fields /> },
  render: () => (
    <div className="w-[460px] space-y-8">
      <Section title="Pomodoro" content={<Fields />} />
      <Section
        title="Notifications"
        description="How this workspace reaches you when something needs a decision."
        content={<Fields />}
      />
      <Section title="Danger zone" rule content={<Fields />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  },
};
