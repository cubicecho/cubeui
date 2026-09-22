import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SegmentedButton } from "@/components/ui/segmented";

/**
 * `SegmentedButton`, as installed beside it by `@cubeui/segmented-stories`: a row of pills, one
 * current, and the current one saying so in the only spelling a screen reader reads on the web.
 */
const OPTIONS = ["Day", "Week", "Month"] as const;

function Row() {
  const [value, setValue] = useState<(typeof OPTIONS)[number]>("Week");
  return (
    <div className="flex flex-row gap-1 bg-background p-6 text-foreground">
      {OPTIONS.map((option) => (
        <SegmentedButton key={option} active={option === value} onClick={() => setValue(option)}>
          {option}
        </SegmentedButton>
      ))}
    </div>
  );
}

const meta = { title: "cubeui/Segmented", component: Row } satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The active pill is pressed and painted; the others say they are not pressed rather than saying
 * nothing. The painted check is palette-free: the active pill's background differs from an
 * inactive one's, whatever the two colours are.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = (name: string) => canvas.getByRole("button", { name });
    const background = (el: Element) => getComputedStyle(el).backgroundColor;

    await expect(pill("Week").getAttribute("aria-pressed")).toBe("true");
    await expect(pill("Day").getAttribute("aria-pressed")).toBe("false");
    await expect(background(pill("Week"))).not.toBe(background(pill("Day")));

    await userEvent.click(pill("Month"));
    await expect(pill("Month").getAttribute("aria-pressed")).toBe("true");
    await expect(pill("Week").getAttribute("aria-pressed")).toBe("false");
  },
};
