import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ToggleChip } from "@/components/ui/toggle-chip";

/**
 * `ToggleChip`, as installed beside it by `@cubeui/toggle-chip-stories`: an on/off pill whose
 * state is `aria-pressed`, and a disabled one that stays put.
 */
function Chips() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-row flex-wrap gap-2 bg-background p-6 text-foreground">
      <ToggleChip selected={on} onClick={() => setOn((v) => !v)}>
        Mon
      </ToggleChip>
      <ToggleChip selected size="sm">
        Tue
      </ToggleChip>
      <ToggleChip disabled>Wed</ToggleChip>
    </div>
  );
}

const meta = { title: "cubeui/ToggleChip", component: Chips } satisfies Meta<typeof Chips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = canvas.getByRole("button", { name: "Mon" });

    await expect(chip.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(chip);
    await expect(chip.getAttribute("aria-pressed")).toBe("true");

    const selected = canvas.getByRole("button", { name: "Tue" });
    await expect(getComputedStyle(selected).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    const disabled = canvas.getByRole("button", { name: "Wed" });
    await expect(disabled).toBeDisabled();
    await expect(disabled.getAttribute("aria-pressed")).toBe("false");
  },
};
