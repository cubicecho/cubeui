import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { LoadState as Compiled } from "../compiled/load-state";
import { PageLayout as CompiledPage } from "../compiled/page-layout";
import { LoadState as Native } from "../registry/layout/load-state";
import { PageLayout as NativePage } from "../registry/layout/page-layout";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * `LoadState` for one record, on both halves. Loading is rows that pulse where the record will be,
 * or nothing inside a loading `PageLayout`, whose title bar already says so; not found is the
 * centred empty block, its title a heading — not a lone grey line.
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

/** Not found with what happened and the way back, on both halves. */
export const NotFoundWithAWayBack: Story = {
  render: () => {
    const words = {
      description: "It may have been archived, or the link is old.",
      level: 2 as const,
    };
    return (
      <SideBySide
        native={
          <Native
            query={answered}
            {...shared}
            {...words}
            actionSlot={<NativeButton variant="outline" content="Back to projects" />}
          />
        }
        compiled={
          <Compiled
            query={answered}
            {...shared}
            {...words}
            actionSlot={<CompiledButton variant="outline" content="Back to projects" />}
          />
        }
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("heading", { level: 2, name: "Project not found" }),
    ).toHaveLength(2);
    await expect(
      canvas.getAllByText("It may have been archived, or the link is old."),
    ).toHaveLength(2);
    await expect(canvas.getAllByRole("button", { name: "Back to projects" })).toHaveLength(2);
  },
};

/**
 * The detail recipe on both halves: inside a `PageLayout` whose `loading` is on, `LoadState`
 * draws no rows, and the title's bar is the one loading state on the screen.
 */
export const InsideALoadingPage: Story = {
  render: () => {
    const pending = { ...answered, isPending: true };
    return (
      <SideBySide
        native={
          <div className="h-72">
            <NativePage
              title="Project"
              loading
              contentSlot={<Native query={pending} {...shared} level={2} />}
            />
          </div>
        }
        compiled={
          <div className="h-72">
            <CompiledPage
              title="Project"
              loading
              contentSlot={<Compiled query={pending} {...shared} level={2} />}
            />
          </div>
        }
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 1, name: "Loading…" })).toHaveLength(2);
    await expect(canvas.queryAllByRole("status")).toHaveLength(0);
    await expect(
      canvasElement.querySelectorAll('[data-slot="row-skeleton"], [data-testid="row-skeleton"]'),
    ).toHaveLength(0);
  },
};
