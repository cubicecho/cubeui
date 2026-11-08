import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ColorPicker as CompiledColorPicker } from "../compiled/color-picker";
import { ColorPicker as NativeColorPicker } from "../registry/ui/color-picker";
import { SideBySide } from "./side-by-side";

/**
 * The swatch row's keyboard, on both halves (#472): one tab stop, as `RadioGroup` has, where every
 * swatch was a stop of its own and sixteen presses of Tab stood between a field's label and its hex
 * box. The arrows move and choose. It is the web's: a phone has no arrow keys, and a screen reader
 * there walks every swatch as before. Both halves here are the web: react-native-web on the left,
 * the compiled DOM on the right.
 */
const meta = { title: "RN Parity/ColorPicker" } satisfies Meta;
export default meta;
type Story = StoryObj;

const SWATCHES = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"] as const;

function Harness({ half }: { half: "native" | "compiled" }) {
  const [value, setValue] = useState("");
  const Picker = half === "native" ? NativeColorPicker : CompiledColorPicker;
  return (
    <div data-testid={half} className="flex flex-col gap-2">
      <Picker
        aria-label={`${half} tag colour`}
        hexLabel={`${half} hex`}
        swatches={SWATCHES}
        value={value}
        onValueChange={setValue}
      />
      <output data-testid={`${half}-value`}>{value || "No colour"}</output>
    </div>
  );
}

export const OneTabStop: Story = {
  render: () => (
    <SideBySide native={<Harness half="native" />} compiled={<Harness half="compiled" />} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const half of ["native", "compiled"] as const) {
      await step(half, async () => {
        const row = within(canvas.getByRole("radiogroup", { name: `${half} tag colour` }));
        const swatch = (color: string) => row.getByRole("radio", { name: color });
        const value = canvas.getByTestId(`${half}-value`);
        const hex = () => within(canvas.getByTestId(half)).getByRole("textbox");

        // No colour yet: the first swatch is the one stop.
        await waitFor(() => expect(swatch("#6366f1").tabIndex).toBe(0));
        for (const color of SWATCHES.slice(1)) {
          await expect(swatch(color).tabIndex).toBe(-1);
        }

        swatch("#6366f1").focus();
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(value).toHaveTextContent("#ec4899"));
        await expect(swatch("#ec4899")).toHaveFocus();
        await expect(swatch("#ec4899")).toHaveAttribute("aria-checked", "true");
        await expect(swatch("#ec4899").tabIndex).toBe(0);
        await expect(swatch("#6366f1").tabIndex).toBe(-1);

        // Round from the first to the last, and Home back to the first.
        await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
        await waitFor(() => expect(value).toHaveTextContent("#10b981"));
        await userEvent.keyboard("{Home}");
        await waitFor(() => expect(value).toHaveTextContent("#6366f1"));

        // Tab leaves the row for the hex box in one press.
        await userEvent.tab();
        await expect(hex()).toHaveFocus();

        // A colour typed in the swatch's own spelling makes that swatch the stop.
        await userEvent.clear(hex());
        await userEvent.type(hex(), "#F59E0B");
        await waitFor(() => expect(swatch("#f59e0b").tabIndex).toBe(0));
      });
    }
  },
};
