import type { Meta, StoryObj } from "@storybook/react-vite";
import { RefreshCw } from "lucide-react";
import { expect, within } from "storybook/test";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * `Alert` as a DOM app draws it (#489): every variant, with and without an action. Its parity with
 * the device half, and the measurements behind its look, are `RN Parity/Alert`.
 */
const meta = {
  title: "Controls/Alert",
  component: Alert,
  decorators: [
    (Story) => (
      <div className="flex max-w-xl flex-col gap-3 bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "Heads up", description: "Sessions now last thirty days." },
};

/** Every variant; only `destructive` interrupts a screen reader. */
export const Variants: Story = {
  render: () => (
    <>
      <Alert title="Heads up" description="Sessions now last thirty days." />
      <Alert
        variant="info"
        title="Re-embedding · 1,204 of 5,880 turns"
        description="Recall uses the lexical view for turns with no vector yet."
      />
      <Alert
        variant="warning"
        title="Store this token securely"
        description="It will not be shown again."
      />
      <Alert
        variant="destructive"
        title="Could not reach the router"
        description="spawn npx ENOENT"
        actionSlot={
          <Button size="sm" variant="outline" iconSlot={<RefreshCw />} content="Try again" />
        }
      />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(1);
    await expect(canvas.getAllByRole("status")).toHaveLength(3);
    await expect(canvas.getByRole("button", { name: "Try again" })).toBeVisible();
  },
};
