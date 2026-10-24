import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { DetailPage as Compiled } from "../compiled/detail-page";
import { DetailPage as Native } from "../registry/layout/detail-page";
import { SideBySide } from "./side-by-side";

/**
 * `DetailPage` before its record is there. Loading is rows that pulse where the record will be;
 * not found is the centred empty block, its title the page's h1 — not a lone grey line.
 */
const meta = {
  title: "RN Parity/DetailPage",
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Project = { name: string };

const shared = {
  notFoundLabel: "Project not found",
  contentSlot: (project: Project) => <Text>{project.name}</Text>,
};

export const NotFound: Story = {
  render: () => (
    <SideBySide
      native={<Native<Project> entity={null} {...shared} />}
      compiled={<Compiled<Project> entity={null} {...shared} />}
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
      native={<Native<Project> entity={null} loading {...shared} />}
      compiled={<Compiled<Project> entity={null} loading {...shared} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("status", { name: "Loading" })).toHaveLength(2);
    await expect(canvas.queryByText("Loading…")).toBeNull();
  },
};
