import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { DescriptionHint } from "@/components/ui/description-hint";

/**
 * The description folded behind a button beside a title, opened (#489). The shells that fold one
 * (`descriptionPlacement="popover"`) are `RN Parity/DescriptionPlacement`; this is the pane itself,
 * which no story had opened.
 */
const meta = {
  title: "Controls/DescriptionHint",
  component: DescriptionHint,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="flex flex-row items-center gap-1 bg-background p-6 text-foreground">
        <span className="font-semibold text-sm">Retention</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DescriptionHint>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A press opens the pane, named for what it describes; Escape closes it and focus comes back. */
export const Open: Story = {
  args: {
    label: "Retention",
    fallbackName: "About this setting",
    description:
      "How long a finished run's logs are kept. Older logs are deleted at midnight, and a pinned run keeps its logs whatever this says.",
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "About Retention" });
    await userEvent.click(button);
    const pane = await screen.findByRole("dialog", { name: "About Retention" });
    await expect(pane).toHaveTextContent(/How long a finished run's logs are kept/);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(button).toHaveFocus();
    // Left open, so the story shows the pane.
    await userEvent.click(button);
    await screen.findByRole("dialog", { name: "About Retention" });
  },
};
