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

/**
 * A title too long for the card truncates rather than wrapping, because a card is one of several
 * on a grid and a two-line title in one of them sets every other card's header height.
 *
 * The assertion is about the other half of that: `truncate` is `overflow: hidden`, and shadcn's
 * `CardTitle` is `leading-none` — a line box exactly 1em tall, which is shorter than the glyphs
 * in it. Left alone the two together shave the tops off the capitals and the tails off the
 * descenders, which reads as a rendering fault rather than as a design. So the truncating span
 * carries its own padding, and this checks the line box is taller than the text in it.
 */
export const LongTitleTruncates: Story = {
  args: {
    title: "Categories, subcategories, and everything filed under them",
    description: "The description wraps; the title does not.",
    content: <Rows />,
  },
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector<HTMLElement>("[data-slot=card-title]");
    expect(title).not.toBeNull();
    if (!title) return;

    const span = title.querySelector<HTMLElement>(".truncate");
    expect(span).not.toBeNull();
    if (!span) return;

    expect(span.scrollWidth).toBeGreaterThan(span.clientWidth);

    // 1.2em is about where a text font's ascent and descent land together; anything at or under
    // the em box is clipping something.
    const fontSize = Number.parseFloat(getComputedStyle(span).fontSize);
    expect(span.clientHeight).toBeGreaterThan(fontSize * 1.2);

    // And it cost the header nothing: the padding is given back as negative margin, so the title
    // still occupies one em of the header's grid.
    expect(span.getBoundingClientRect().height - 2 * 4).toBeCloseTo(
      title.getBoundingClientRect().height,
      1,
    );
  },
};
