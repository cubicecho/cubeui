import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect } from "storybook/test";
import { CardLayout } from "@/registry/new-york/layout/card-layout";
import { Button } from "@/registry/new-york/ui/button";

const meta = {
  title: "Layout/CardLayout",
  component: CardLayout,
  parameters: { layout: "centered" },
  args: { className: "w-[420px]" },
} satisfies Meta<typeof CardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Rows = () => (
  <ul className="divide-y text-sm">
    {["Fabrication", "Assembly", "Packaging"].map((name) => (
      <li key={name} className="py-2">
        {name}
      </li>
    ))}
  </ul>
);

export const Default: Story = {
  args: {
    title: "Categories",
    description: "Deleting a category keeps its activities — they go back to uncategorized.",
    action: (
      <Button size="sm" variant="outline">
        <Plus /> Add
      </Button>
    ),
    footerActions: <Button size="sm">Save</Button>,
    content: <Rows />,
  },
};

/** Title only. Every other slot absent, and none of them leaves a wrapper behind. */
export const TitleOnly: Story = {
  args: { title: "Categories", content: <Rows /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=card-footer]")).toBeNull();
  },
};

/** An icon is passed bare — `<Plus />`, not `<Plus className="size-4" />`. The shell sizes it. */
export const WithIcon: Story = {
  args: {
    icon: <Plus />,
    title: "Categories",
    description: "The icon arrives unsized and leaves at 16px.",
    content: <Rows />,
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    expect(svg).not.toBeNull();
    if (svg) expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
  },
};

/**
 * `empty` replaces the body when `content` is empty — and `[].map(…)` is an empty array, not
 * null, which is why the shell counts the nodes instead of testing them for truth. The call site
 * writes the map plainly; it never writes `items.length === 0 ? … : …`.
 */
export const Empty: Story = {
  args: {
    title: "Categories",
    empty: <p className="text-muted-foreground text-sm">No categories yet.</p>,
    content: [].map(() => null),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("No categories yet.");
  },
};

/**
 * Both footer slots. `footer` takes the start, `footerActions` the end, and the shell splits
 * them — a destructive action held away from the one you meant to press.
 */
export const SplitFooter: Story = {
  args: {
    title: "Danger zone",
    footer: (
      <Button size="sm" variant="ghost" className="text-destructive">
        Delete
      </Button>
    ),
    footerActions: (
      <>
        <Button size="sm" variant="ghost">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </>
    ),
    content: <Rows />,
  },
};

/** `footerActions` alone right-aligns. This is the common case, and it needs no `footer`. */
export const ActionsOnly: Story = {
  args: {
    title: "Categories",
    footerActions: <Button size="sm">Save</Button>,
    content: <Rows />,
  },
};
