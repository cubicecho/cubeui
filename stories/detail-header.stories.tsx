import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { DetailHeader as Compiled } from "../compiled/detail-header";
import { DetailHeader as Native } from "../registry/layout/detail-header";
import { SideBySide } from "./side-by-side";

/**
 * `DetailHeader`'s words are the set's: `description`, `badgesSlot`, `actionSlot`, and a heading
 * `level` whose size follows it, as on `PageHeader`. The old `subtitle`, `badgeSlot` and
 * `actionsSlot` still draw for one release, and lose to the new name when both are passed.
 */
const meta = {
  title: "RN Parity/DetailHeader",
} satisfies Meta;

export default meta;
type Story = StoryObj;

const onBack = () => {};

/** The page's own name by default: an `<h1>` at `text-xl`; `level={2}` is an `<h2>` at `text-lg`. */
export const Level: Story = {
  render: () => (
    <SideBySide
      native={
        <>
          <Native onBack={onBack} backLabel="Back" title="Atlas" description="Due on Friday" />
          <Native onBack={onBack} backLabel="Back" title="Beacon" level={2} />
        </>
      }
      compiled={
        <>
          <Compiled onBack={onBack} backLabel="Back" title="Atlas" description="Due on Friday" />
          <Compiled onBack={onBack} backLabel="Back" title="Beacon" level={2} />
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ones = canvas.getAllByRole("heading", { level: 1, name: "Atlas" });
    const twos = canvas.getAllByRole("heading", { level: 2, name: "Beacon" });
    await expect(ones).toHaveLength(2);
    await expect(twos).toHaveLength(2);
    for (const heading of ones) {
      await expect(getComputedStyle(heading).fontSize).toBe("20px");
    }
    for (const heading of twos) {
      await expect(getComputedStyle(heading).fontSize).toBe("18px");
    }
    await expect(canvas.getAllByText("Due on Friday")).toHaveLength(2);
  },
};

/** The deprecated names still draw, and the new name wins where both are given. */
export const DeprecatedNames: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          onBack={onBack}
          backLabel="Back"
          title="Atlas"
          subtitle="Old line"
          badgeSlot={<Text>Old badge</Text>}
          actionsSlot={<Text>Old action</Text>}
          actionSlot={<Text>New action</Text>}
        />
      }
      compiled={
        <Compiled
          onBack={onBack}
          backLabel="Back"
          title="Atlas"
          subtitle="Old line"
          badgeSlot={<span>Old badge</span>}
          actionsSlot={<span>Old action</span>}
          actionSlot={<span>New action</span>}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("Old line")).toHaveLength(2);
    await expect(canvas.getAllByText("Old badge")).toHaveLength(2);
    await expect(canvas.getAllByText("New action")).toHaveLength(2);
    await expect(canvas.queryByText("Old action")).toBeNull();
  },
};
