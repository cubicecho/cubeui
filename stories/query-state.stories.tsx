import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import { QueryState as Compiled } from "../compiled/query-state";
import { QueryState as Native } from "../registry/layout/query-state";
import { SideBySide } from "./side-by-side";

/**
 * `QueryState` in front of one record, on both halves. Loading is rows that pulse where the record
 * will be; not found is the centred empty block, its title the page's h1 — not a lone grey line.
 */
const meta = {
  title: "RN Parity/QueryState",
} satisfies Meta;

export default meta;
type Story = StoryObj;

const answered = { isPending: false, isError: false, error: null, refetch: fn() };

const shared = { what: "this project", record: null, notFoundLabel: "Project not found" };

export const NotFound: Story = {
  render: () => (
    <SideBySide
      native={<Native query={answered} {...shared} />}
      compiled={<Compiled query={answered} {...shared} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("heading", { level: 1, name: "Project not found" }),
    ).toHaveLength(2);
  },
};

export const Loading: Story = {
  render: () => (
    <SideBySide
      native={<Native query={{ ...answered, isPending: true }} {...shared} />}
      compiled={<Compiled query={{ ...answered, isPending: true }} {...shared} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("status", { name: "Loading" })).toHaveLength(2);
    await expect(canvas.queryByText("Loading…")).toBeNull();
  },
};
