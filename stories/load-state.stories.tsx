import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import { LoadState as Compiled } from "../compiled/load-state";
import { LoadState as Native } from "../registry/layout/load-state";
import { SideBySide } from "./side-by-side";

/**
 * `LoadState` in front of one record, on both halves. Loading is rows that pulse where the record
 * will be; not found is the centred empty block, its title the page's h1 — not a lone grey line.
 */
const meta = {
  title: "RN Parity/LoadState",
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

/**
 * The guard inside a page that already has its title: `level={2}`, so the page keeps one `h1`
 * and the not-found title is the heading under it, at the same size.
 */
export const NotFoundInsideAPage: Story = {
  render: () => (
    <SideBySide
      native={<Native query={answered} {...shared} level={2} />}
      compiled={<Compiled query={answered} {...shared} level={2} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("heading", { level: 1 })).toHaveLength(0);
    await expect(
      canvas.getAllByRole("heading", { level: 2, name: "Project not found" }),
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
