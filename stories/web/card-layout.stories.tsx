import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect } from "storybook/test";
import { CardLayout } from "@/components/card-layout";
import { Button } from "@/components/ui/button";

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
    actionSlot: <Button size="sm" variant="info" iconSlot={<Plus />} content="Add" />,
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Categories");
    const add = canvas.getByRole("button", { name: "Add" });
    expect(title).toBeVisible();
    expect(canvas.getByText(/Deleting a category keeps its activities/)).toBeVisible();
    expect(canvas.getByText("Fabrication")).toBeVisible();
    expect(canvas.getByRole("button", { name: "Save" })).toBeVisible();
    // The action is the header's far end, so it starts after the title does.
    expect(add.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().left);
  },
};

/** Title only. Every other slot absent, and none of them leaves a wrapper behind. */
export const TitleOnly: Story = {
  args: { title: "Categories", contentSlot: <Rows /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=card-footer]")).toBeNull();
  },
};

/** An icon is passed bare — `<Plus />`, not `<Plus className="size-4" />`. The shell sizes it. */
export const WithIcon: Story = {
  args: {
    iconSlot: <Plus />,
    title: "Categories",
    description: "The icon arrives unsized and leaves at 16px.",
    contentSlot: <Rows />,
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    expect(svg).not.toBeNull();
    if (svg) {
      expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
    }
  },
};

/**
 * `emptySlot` replaces the body when `contentSlot` is empty — and `[].map(…)` is an empty array,
 * not null, which is why the shell counts the nodes instead of testing them for truth. The call
 * site writes the map plainly; it never writes `items.length === 0 ? … : …`.
 */
export const Empty: Story = {
  args: {
    title: "Categories",
    emptySlot: <p className="text-foreground/60 text-sm">No categories yet.</p>,
    contentSlot: [].map(() => null),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("No categories yet.");
  },
};

/**
 * Both footer slots. `footerSlot` takes the start, `footerActionsSlot` the end, and the shell
 * splits them — a destructive action held away from the one you meant to press.
 */
export const SplitFooter: Story = {
  args: {
    title: "Danger zone",
    footerSlot: <Button size="sm" variant="destructive-outline" content="Delete" />,
    footerActionsSlot: (
      <>
        <Button size="sm" variant="outline" content="Cancel" />
        <Button size="sm" variant="positive" content="Save" />
      </>
    ),
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const remove = canvas.getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = canvas.getByRole("button", { name: "Cancel" }).getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Save" }).getBoundingClientRect();
    // `footerSlot` and `footerActionsSlot` go to opposite ends: the space is between Delete and
    // Cancel, not between Cancel and Save.
    expect(remove.right).toBeLessThan(cancel.left);
    expect(cancel.right).toBeLessThanOrEqual(save.left);
    expect(cancel.left - remove.right).toBeGreaterThan(save.left - cancel.right);
  },
};

/**
 * `footerActionsSlot` alone right-aligns. This is the common case, and it needs no `footerSlot`.
 */
export const ActionsOnly: Story = {
  args: {
    title: "Categories",
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Categories").getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Save" }).getBoundingClientRect();
    // Given alone, the buttons sit at the footer's end: past the middle of the 420px card, whose
    // start edge the title marks.
    expect(save.left).toBeGreaterThan(title.left + 210);
  },
};

/**
 * A title too long for the card truncates rather than wrapping, because a card is one of several
 * on a grid and a two-line title in one of them sets every other card's header height.
 *
 * The assertion is about the other half of that: `truncate` is `overflow: hidden`, and shadcn's
 * `CardTitle` is `leading-none` — a line box exactly 1em tall, which is shorter than the glyphs
 * in it. Left alone the two together shave the tops off the capitals and the tails off the
 * descenders, which reads as a rendering fault rather than as a design. So the title carries its
 * own padding, and this checks the line box is taller than the text in it.
 *
 * On cubeui the padding sat on a span inside `CardTitle`; here the layout is written in React
 * Native, where a view inside a `Text` is not laid out, so `CardTitle` is the truncating element
 * and the padding is on it.
 */
export const LongTitleTruncates: Story = {
  args: {
    title: "Categories, subcategories, and everything filed under them",
    description: "The description wraps; the title does not.",
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { name: /^Categories/ });

    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);

    // 1.2em is about where a text font's ascent and descent land together; anything at or under
    // the em box is clipping something.
    const fontSize = Number.parseFloat(getComputedStyle(title).fontSize);
    expect(title.clientHeight).toBeGreaterThan(fontSize * 1.2);

    // And it cost the header nothing: the padding is given back as negative margin.
    const style = getComputedStyle(title);
    expect(style.marginTop).toBe(`-${style.paddingTop}`);
  },
};
