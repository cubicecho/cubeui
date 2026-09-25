import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Search as CompiledSearch } from "../compiled/icons";
import { EmptyState as Compiled } from "../compiled/page";
import { EmptyState as Native } from "../registry/layout/page";
import { Button as NativeButton } from "../registry/ui/button";
import { Search as NativeSearch } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `EmptyState`'s `level` (issue #124) and `compact`. An empty list inside a page keeps a plain
 * title; an empty state that *is* the page (a first run, a record not found, a link that did not
 * work) passes a `level` and its title becomes the heading a screen reader lands on, at the same
 * size. An empty list inside a card, a sidebar section or a popover is one muted line: `compact`.
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

const onAdd = fn();

/**
 * `compact`: "No labels yet." as one muted line with a small icon and a link-style action — no
 * bubble, no centred block, no heading.
 */
export const Compact: Story = {
  args: { compact: true, title: "No labels yet." },
  render: () => (
    <SideBySide
      native={
        <>
          <Native
            compact
            icon={NativeSearch}
            title="No labels yet."
            action={
              <NativeButton variant="link" size="xs" onPress={onAdd}>
                Add a label
              </NativeButton>
            }
          />
          <span data-testid="muted" className="text-muted-foreground">
            muted
          </span>
        </>
      }
      compiled={
        <Compiled
          compact
          icon={CompiledSearch}
          title="No labels yet."
          action={
            <CompiledButton variant="link" size="xs" onClick={onAdd}>
              Add a label
            </CompiledButton>
          }
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titles = canvas.getAllByText("No labels yet.");
    await expect(titles).toHaveLength(2);
    await expect(canvas.queryAllByRole("heading")).toHaveLength(0);

    const muted = getComputedStyle(canvas.getByTestId("muted")).color;
    for (const title of titles) {
      // One line: the icon, the text and the action side by side, not a centred column.
      const line = title.parentElement;
      if (!line) throw new Error("the title should sit in the line");
      await expect(getComputedStyle(line).flexDirection).toBe("row");
      await expect(line.getBoundingClientRect().height).toBeLessThan(48);
      await expect(line.querySelector("svg")?.getBoundingClientRect().width).toBe(16);

      await expect(getComputedStyle(title).color).toBe(muted);
      await expect(getComputedStyle(title).fontSize).toBe("14px");
      await expect(getComputedStyle(title).fontWeight).toBe("400");
    }

    onAdd.mockClear();
    for (const button of canvas.getAllByRole("button", { name: "Add a label" })) {
      await userEvent.click(button);
    }
    await expect(onAdd).toHaveBeenCalledTimes(2);
  },
};

/** `compact` with nothing but the words: the call sites that are a bare `<Text>` today. */
export const CompactTextOnly: Story = {
  args: { compact: true, title: "No projects yet." },
  render: () => (
    <SideBySide
      native={<Native compact title="No projects yet." className="px-2" />}
      compiled={<Compiled compact title="No projects yet." className="px-2" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titles = canvas.getAllByText("No projects yet.");
    await expect(titles).toHaveLength(2);
    const [native, compiled] = titles;
    if (!native || !compiled) throw new Error("both halves should render");
    await expect(native.parentElement?.querySelector("svg")).toBeNull();
    await expect(compiled.parentElement?.querySelector("svg")).toBeNull();
    await expect(getComputedStyle(compiled).color).toBe(getComputedStyle(native).color);
    // The inset lands on the root, on both halves.
    await expect(getComputedStyle(compiled.parentElement as HTMLElement).paddingLeft).toBe("8px");
    await expect(getComputedStyle(native.parentElement as HTMLElement).paddingLeft).toBe("8px");
  },
};
