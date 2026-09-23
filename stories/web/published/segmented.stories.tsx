import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SegmentedButton, SegmentedGroup } from "@/components/ui/segmented";

/**
 * `SegmentedButton` in a `SegmentedGroup`, as installed beside it by `@cubeui/segmented-stories`:
 * a named row of pills, one current, and the current one saying so in the only spelling a screen
 * reader reads on the web. The group holds the selection, so no pill writes `active={x === value}`.
 */
const OPTIONS = ["Day", "Week", "Month"] as const;

function Row() {
  const [value, setValue] = useState<string>("Week");
  const [view, setView] = useState<string>("List");
  return (
    <div className="flex flex-col gap-3 bg-background p-6 text-foreground">
      <SegmentedGroup aria-label="Range" value={value} onValueChange={setValue}>
        {OPTIONS.map((option) => (
          <SegmentedButton key={option} value={option}>
            {option}
          </SegmentedButton>
        ))}
      </SegmentedGroup>
      <p id="segmented-view-heading" className="text-sm font-medium">
        View
      </p>
      <SegmentedGroup
        variant="plain"
        aria-labelledby="segmented-view-heading"
        value={view}
        onValueChange={setView}
      >
        <SegmentedButton value="List">List</SegmentedButton>
        <SegmentedButton value="Board">Board</SegmentedButton>
      </SegmentedGroup>
    </div>
  );
}

const meta = { title: "cubeui/Segmented", component: Row } satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Each row is a group named by `aria-label` or by the heading above it. The active pill is
 * pressed and painted; the others say they are not pressed rather than saying nothing. The
 * painted check is palette-free: the active pill's background differs from an inactive one's,
 * whatever the two colours are.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const range = canvas.getByRole("group", { name: "Range" });
    const view = canvas.getByRole("group", { name: "View" });
    const pill = (group: HTMLElement, name: string) => within(group).getByRole("button", { name });
    const background = (el: Element) => getComputedStyle(el).backgroundColor;

    await expect(pill(range, "Week").getAttribute("aria-pressed")).toBe("true");
    await expect(pill(range, "Day").getAttribute("aria-pressed")).toBe("false");
    await expect(background(pill(range, "Week"))).not.toBe(background(pill(range, "Day")));

    await userEvent.click(pill(range, "Month"));
    await expect(pill(range, "Month").getAttribute("aria-pressed")).toBe("true");
    await expect(pill(range, "Week").getAttribute("aria-pressed")).toBe("false");

    await userEvent.click(pill(view, "Board"));
    await expect(pill(view, "Board").getAttribute("aria-pressed")).toBe("true");
    await expect(pill(view, "List").getAttribute("aria-pressed")).toBe("false");
  },
};
