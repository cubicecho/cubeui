import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { QueryState } from "@/registry/new-york/layout/query-state";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/registry/new-york/ui/empty";
import { Item, ItemContent, ItemTitle } from "@/registry/new-york/ui/item";

const meta = {
  title: "Layout/QueryState",
  component: QueryState,
  parameters: { layout: "padded" },
} satisfies Meta<typeof QueryState>;

export default meta;
type Story = StoryObj<typeof meta>;

const settled = { isPending: false, isError: false, error: null, refetch: fn() };

const NoRoles = (
  <Empty>
    <EmptyHeader>
      <EmptyTitle>No roles yet</EmptyTitle>
      <EmptyDescription>A role is a kind of lane: a prompt and a contract.</EmptyDescription>
    </EmptyHeader>
  </Empty>
);

const Rows = () => (
  <div className="flex w-[520px] flex-col gap-2">
    {["Execute", "Review", "Expand"].map((name) => (
      <Item key={name} variant="outline">
        <ItemContent>
          <ItemTitle>{name}</ItemTitle>
        </ItemContent>
      </Item>
    ))}
  </div>
);

/** Nothing has come back yet: rows shaped like the rows, announced once. */
export const Loading: Story = {
  args: {
    query: { ...settled, isPending: true },
    what: "your roles",
    count: 0,
    empty: NoRoles,
  },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("status")).toHaveTextContent("Loading");
    // The placeholders themselves are hidden — three cards of nothing is three cards of nothing.
    expect(canvas.queryAllByRole("presentation")).toHaveLength(0);
  },
};

/**
 * The rung most often left out. With retries off a failed query stays failed, and a page that
 * draws the failure as an absence tells somebody whose server went away that they have no data.
 */
export const Failed: Story = {
  args: {
    query: { ...settled, isError: true, error: new Error("Failed to fetch") },
    what: "your roles",
    count: 0,
    empty: NoRoles,
  },
  play: async ({ canvas, args }) => {
    expect(canvas.getByText("Could not load your roles")).toBeVisible();
    expect(canvas.getByText("Failed to fetch")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    expect(args.query.refetch).toHaveBeenCalled();
  },
};

/** It landed, and there is nothing in it. The node is the caller's — usually an `Empty`. */
export const NothingThere: Story = {
  args: { query: settled, what: "your roles", count: 0, empty: NoRoles },
  play: async ({ canvas }) => {
    expect(canvas.getByText("No roles yet")).toBeVisible();
  },
};

/**
 * Once there are rows it draws nothing at all, which is what lets a page read as the ladder and
 * then the list rather than a nest of ternaries.
 */
export const OutOfTheWay: Story = {
  args: { query: settled, what: "your roles", count: 3, empty: NoRoles },
  render: (args) => (
    <>
      <QueryState {...args} />
      <Rows />
    </>
  ),
  play: async ({ canvas }) => {
    expect(canvas.queryByText("No roles yet")).toBeNull();
    expect(canvas.getByText("Review")).toBeVisible();
  },
};

/**
 * `count` is what the page is about to draw, not what came back. A search that matches nothing
 * is an empty *view* over a full result, and only the page knows which one it is showing — so
 * the empty node here is the one about the search, not the one about having no roles.
 */
export const AnEmptyViewIsNotAnEmptyResult: Story = {
  args: {
    query: settled,
    what: "your roles",
    count: 0,
    empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No roles match “verdict”</EmptyTitle>
        </EmptyHeader>
      </Empty>
    ),
  },
  play: async ({ canvas }) => {
    expect(canvas.getByText("No roles match “verdict”")).toBeVisible();
  },
};
