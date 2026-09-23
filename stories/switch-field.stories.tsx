import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SwitchField } from "../compiled/switch-field";

/**
 * The web half of `SwitchField`, held to what its doc comment promises: the caption is part of the
 * switch's hit target, and the row is one tab stop.
 *
 * Both were false once (#104). The web half was compiled from the native `Pressable`, which made
 * the caption a `<button>` around a `<label htmlFor>`: a click on it toggled the switch and then
 * toggled it back, and Tab from the switch landed on that button.
 */
const meta = { title: "Stage 0/SwitchField" } satisfies Meta;
export default meta;
type Story = StoryObj;

function Harness() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex flex-col items-start gap-4 bg-background p-6 text-foreground">
      <SwitchField
        id="sevenths"
        label="7th chords"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <button type="button">After</button>
    </div>
  );
}

export const CaptionToggles: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "7th chords" });
    await expect(control.getAttribute("aria-checked")).toBe("false");

    // One click on the caption is one toggle, not two that cancel out.
    await userEvent.click(canvas.getByText("7th chords"));
    await expect(control.getAttribute("aria-checked")).toBe("true");
    await userEvent.click(canvas.getByText("7th chords"));
    await expect(control.getAttribute("aria-checked")).toBe("false");

    // And the switch itself still toggles once: a click on interactive content inside a label is
    // not handed to the label's control a second time.
    await userEvent.click(control);
    await expect(control.getAttribute("aria-checked")).toBe("true");
  },
};

export const OneTabStop: Story = {
  render: () => <Harness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "7th chords" });

    control.focus();
    await expect(document.activeElement).toBe(control);

    // Tab from the switch leaves the row: the next stop is the button after it, not a wrapper
    // around the caption.
    await userEvent.tab();
    await expect(document.activeElement).toBe(canvas.getByRole("button", { name: "After" }));
  },
};
