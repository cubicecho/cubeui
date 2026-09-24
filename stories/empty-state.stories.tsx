import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Search as CompiledSearch } from "../compiled/icons";
import { EmptyState as Compiled } from "../compiled/page";
import { EmptyState as Native } from "../registry/layout/page";
import { Search as NativeSearch } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `EmptyState`'s `level` — issue #124. An empty list inside a page keeps a plain title; an empty
 * state that *is* the page (a first run, a record not found, a link that did not work) passes a
 * `level` and its title becomes the heading a screen reader lands on, at the same size.
 */
const meta = {
  title: "Stage 0/EmptyState",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  icon: NativeSearch,
  title: "Project not found",
  description: "It may have been deleted, or the link is wrong.",
};

function render(props: { level?: 1 | 2 | 3 }) {
  return (
    <SideBySide
      native={<Native {...args} {...props} />}
      compiled={<Compiled {...args} icon={CompiledSearch} {...props} />}
    />
  );
}

/** No `level`: the title is text, not a heading, as it always was. */
export const Default: Story = {
  args,
  render: () => render({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("Project not found")).toHaveLength(2);
    await expect(canvas.queryAllByRole("heading")).toHaveLength(0);
  },
};

/** `level={1}`: the whole screen is the empty state, so its title is the page's `h1`. */
export const PageHeading: Story = {
  args: { ...args, level: 1 },
  render: () => render({ level: 1 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headings = canvas.getAllByRole("heading", { level: 1, name: "Project not found" });
    await expect(headings).toHaveLength(2);
    const [native, compiled] = headings;
    if (!native || !compiled) throw new Error("both halves should render");

    // The same size as the plain title: the rank says where it sits, not how big it looks.
    await expect(getComputedStyle(native).fontSize).toBe("14px");
    await expect(getComputedStyle(compiled).fontSize).toBe("14px");
    await expect(getComputedStyle(compiled).fontWeight).toBe(getComputedStyle(native).fontWeight);
    await expect(getComputedStyle(compiled).color).toBe(getComputedStyle(native).color);
  },
};

/** Any rank from 1 to 3, on both halves. */
export const Level: Story = {
  args: { ...args, level: 3 },
  render: () => render({ level: 3 }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("heading", { level: 3, name: "Project not found" }),
    ).toHaveLength(2);
  },
};
