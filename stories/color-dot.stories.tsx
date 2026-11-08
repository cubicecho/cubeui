import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { ColorDot as Compiled } from "../compiled/color-dot";
import { ColorDot as Native } from "../registry/ui/color-dot";
import { SideBySide } from "./side-by-side";

const meta = { title: "RN Parity/ColorDot" } satisfies Meta;
export default meta;
type Story = StoryObj;

const dots = (Dot: typeof Native) => (
  <div className="flex flex-row items-center gap-2">
    <Dot color="#7c3aed" label="Design" />
    <Dot color="#0d9488" size="sm" />
  </div>
);

/**
 * A named dot shows its name under the pointer on the web (#479): its colour is all a sighted
 * reader has otherwise, and two colours can be one to a reader with a colour-vision deficiency.
 * The name is not also its description, which would read it twice, and a dot with no name stays
 * decoration, with no tooltip.
 */
export const ANamedDotShowsItsName: Story = {
  render: () => <SideBySide native={dots(Native)} compiled={dots(Compiled)} />,
  play: async ({ canvasElement }) => {
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const half of sections) {
      const dot = within(half).getByRole("img", { name: "Design" });
      await userEvent.hover(dot);
      const tooltip = await screen.findByRole("tooltip");
      await expect(tooltip).toHaveTextContent("Design");
      await waitFor(() => expect(tooltip).toBeVisible());
      await expect(dot).not.toHaveAttribute("aria-describedby");
      await expect(dot).toHaveAccessibleDescription("");
      await userEvent.unhover(dot);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());

      const plain = half.querySelector("[aria-hidden='true']");
      await expect(plain).not.toBeNull();
      await expect(plain).not.toHaveAttribute("data-slot", "tooltip-trigger");
    }
  },
};
