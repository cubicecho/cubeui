import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Switch } from "../compiled/switch";
import { SwitchField } from "../compiled/switch-field";
import { Switch as NativeSwitch } from "../registry/ui/switch";
import { SwitchField as NativeSwitchField } from "../registry/ui/switch-field";
import { SideBySide } from "./side-by-side";

/**
 * The web half of `SwitchField`, held to what its doc comment promises: the caption is part of the
 * switch's hit target, and the row is one tab stop.
 *
 * Both were false once (#104). The web half was compiled from the native `Pressable`, which made
 * the caption a `<button>` around a `<label htmlFor>`: a click on it toggled the switch and then
 * toggled it back, and Tab from the switch landed on that button.
 */
const meta = { title: "RN Parity/SwitchField" } satisfies Meta;
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

const WHY = "ocrmypdf is not installed on the server.";
const nativeChange = fn();
const compiledChange = fn();

/**
 * A switch that cannot be changed says why (#270). `description` is the line under the caption
 * and the switch's description, not part of its name; `disabled` reaches the switch, and a press
 * on the caption does not get past it either.
 */
export const DisabledSaysWhy: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeSwitchField
          id="ocr-native"
          label="Run OCR on new uploads"
          description={WHY}
          checked={false}
          onCheckedChange={nativeChange}
          disabled
        />
      }
      compiled={
        <SwitchField
          id="ocr-compiled"
          label="Run OCR on new uploads"
          description={WHY}
          checked={false}
          onCheckedChange={compiledChange}
          disabled
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    nativeChange.mockClear();
    compiledChange.mockClear();
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const section of sections) {
      const half = within(section);
      // The caption alone names it; the reason is what it is described by.
      const control = half.getByRole("switch", { name: "Run OCR on new uploads" });
      await expect(control).toHaveAccessibleDescription(WHY);
      await expect(control).toBeDisabled();

      // The line sits under the caption, not beside it.
      const caption = half.getByText("Run OCR on new uploads").getBoundingClientRect();
      const reason = half.getByText(WHY).getBoundingClientRect();
      await expect(reason.top).toBeGreaterThanOrEqual(caption.bottom);

      await userEvent.click(half.getByText("Run OCR on new uploads"), { pointerEventsCheck: 0 });
    }
    await expect(nativeChange).not.toHaveBeenCalled();
    await expect(compiledChange).not.toHaveBeenCalled();
  },
};

const FIRST = "Turn the task on first";
const hintChange = fn();

/**
 * `hint` (#359), as on `Button`: the one tooltip, and the switch's description. On a disabled
 * switch it keeps the switch focusable (`aria-disabled`) so the reason can be hovered and tabbed
 * to, and the press is still refused. A bare `Switch` and a `SwitchField`, on both halves.
 */
export const HintSaysWhy: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col items-start gap-6 p-6">
          <NativeSwitch
            accessibilityLabel="Arm the trigger"
            checked={false}
            onCheckedChange={hintChange}
            disabled
            hint={FIRST}
          />
          <NativeSwitchField
            id="arm-native"
            label="Arm on save"
            checked={false}
            onCheckedChange={hintChange}
            disabled
            hint={FIRST}
          />
        </div>
      }
      compiled={
        <div className="flex flex-col items-start gap-6 p-6">
          <Switch
            aria-label="Arm the trigger"
            checked={false}
            onCheckedChange={hintChange}
            disabled
            hint={FIRST}
          />
          <SwitchField
            id="arm-compiled"
            label="Arm on save"
            checked={false}
            onCheckedChange={hintChange}
            disabled
            hint={FIRST}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    hintChange.mockClear();
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const section of sections) {
      const half = within(section);
      for (const name of ["Arm the trigger", "Arm on save"]) {
        // The hint describes it and is not folded into its name.
        const control = half.getByRole("switch", { name });
        await expect(control).toHaveAttribute("aria-disabled", "true");
        await expect(control).toHaveAccessibleDescription(FIRST);
        await expect(control).not.toBeDisabled();
        control.focus();
        await expect(document.activeElement).toBe(control);
        await userEvent.click(control);
        await expect(control.getAttribute("aria-checked")).toBe("false");
      }
      await userEvent.click(half.getByText("Arm on save"));
      await userEvent.hover(half.getByRole("switch", { name: "Arm the trigger" }));
      await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent(FIRST));
      await userEvent.unhover(half.getByRole("switch", { name: "Arm the trigger" }));
      await userEvent.keyboard("{Escape}");
    }
    await expect(hintChange).not.toHaveBeenCalled();
  },
};
