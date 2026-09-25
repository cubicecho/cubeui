import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { SettingRow as Compiled } from "../compiled/setting-row";
import { Switch as CompiledSwitch } from "../compiled/switch";
import type { SettingRowIds } from "../registry/layout/setting-row";
import { SettingRow as Native } from "../registry/layout/setting-row";
import { Button as NativeButton } from "../registry/ui/button";
import { Switch as NativeSwitch } from "../registry/ui/switch";
import { SideBySide } from "./side-by-side";

/**
 * The settings row on both halves, at two widths: a column wide enough for the text and the
 * control side by side, and one too narrow, where the control drops under the text. The width is
 * the frame's, not the window's — the row wraps rather than reading a breakpoint — so both cases
 * hold in the test runner's phone-width viewport and in a desktop Storybook alike.
 *
 * The switch is named by the row's title through the `action` function's `titleId`; the button
 * in the description-only row keeps its own text as its name. The a11y addon runs as an error on
 * every story, so each one is also that audit.
 */
const meta = { title: "Stage 0/SettingRow" } satisfies Meta;
export default meta;
type Story = StoryObj;

type SettingRowComponent = typeof Native;

function Rows({
  SettingRow,
  toggle,
  button,
}: {
  SettingRow: SettingRowComponent;
  toggle: (ids: SettingRowIds, checked: boolean, onChange: (next: boolean) => void) => ReactNode;
  button: (label: string, onPress: () => void) => ReactNode;
}) {
  const [dark, setDark] = useState(false);
  const [cleared, setCleared] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <SettingRow
        title="Dark mode"
        description="Switch between light and dark theme."
        action={(ids) => toggle(ids, dark, setDark)}
      />
      <SettingRow
        description={`Forget every turn and session. Cleared ${cleared} times.`}
        action={button("Clear all memory", () => setCleared((n) => n + 1))}
      />
    </div>
  );
}

function halves(width: number) {
  return (
    <SideBySide
      native={
        <div className="native-root" style={{ width }}>
          <Rows
            SettingRow={Native}
            toggle={({ titleId }, checked, onChange) => (
              <NativeSwitch
                aria-labelledby={titleId}
                checked={checked}
                onCheckedChange={onChange}
              />
            )}
            button={(label, onPress) => (
              <NativeButton size="sm" variant="outline" onPress={onPress}>
                {label}
              </NativeButton>
            )}
          />
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width }}>
          <Rows
            SettingRow={Compiled as SettingRowComponent}
            toggle={({ titleId, descriptionId }, checked, onChange) => (
              <CompiledSwitch
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                checked={checked}
                onCheckedChange={onChange}
              />
            )}
            button={(label, onPress) => (
              // `onClick` on this half; see the note in `card.stories.tsx`.
              <CompiledButton size="sm" variant="outline" onClick={onPress}>
                {label}
              </CompiledButton>
            )}
          />
        </div>
      }
    />
  );
}

function roots(canvasElement: HTMLElement) {
  const native = canvasElement.querySelector<HTMLElement>(".native-root");
  const compiled = canvasElement.querySelector<HTMLElement>(".compiled-root");
  if (!native || !compiled) throw new Error("both halves should render");
  return [native, compiled] as const;
}

export const Wide: Story = {
  render: () => halves(480),
  play: async ({ canvasElement }) => {
    const [native, compiled] = roots(canvasElement);

    for (const root of [native, compiled]) {
      const scope = within(root);

      // Named by the title, and toggled by it being pressed.
      const toggle = scope.getByRole("switch", { name: "Dark mode" });
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await userEvent.click(toggle);
      await expect(toggle).toHaveAttribute("aria-checked", "true");

      // The button names itself; a row with no title hands the function nothing to point at.
      const clear = scope.getByRole("button", { name: "Clear all memory" });
      await userEvent.click(clear);
      await expect(scope.getByText(/Cleared 1 times/)).toBeVisible();

      // Wide enough: the control sits at the row's far end, on the text's line.
      const title = scope.getByText("Dark mode").getBoundingClientRect();
      const description = scope.getByText(/Switch between/).getBoundingClientRect();
      const control = toggle.getBoundingClientRect();
      await expect(control.left).toBeGreaterThan(Math.max(title.right, description.right));
      await expect(control.top).toBeLessThan(description.bottom);
      await expect(control.bottom).toBeGreaterThan(title.top);
      await expect(Math.abs(control.right - root.getBoundingClientRect().right)).toBeLessThan(1);
    }

    // The web half also hands the description to the switch as its description.
    const webToggle = within(compiled).getByRole("switch", { name: "Dark mode" });
    await expect(webToggle).toHaveAccessibleDescription("Switch between light and dark theme.");

    // And the two halves draw the text alike.
    const nativeTitle = within(native).getByText("Dark mode");
    const webTitle = within(compiled).getByText("Dark mode");
    await expect(getComputedStyle(webTitle).fontSize).toBe(getComputedStyle(nativeTitle).fontSize);
    await expect(getComputedStyle(webTitle).fontWeight).toBe(
      getComputedStyle(nativeTitle).fontWeight,
    );
    await expect(getComputedStyle(webTitle).color).toBe(getComputedStyle(nativeTitle).color);
  },
};

/** Too narrow for text and control on one line: the control drops under the text, at its start. */
export const Narrow: Story = {
  render: () => halves(200),
  play: async ({ canvasElement }) => {
    for (const root of roots(canvasElement)) {
      const scope = within(root);
      const description = scope.getByText(/Forget every turn/).getBoundingClientRect();
      const control = scope
        .getByRole("button", { name: "Clear all memory" })
        .getBoundingClientRect();
      await expect(control.top).toBeGreaterThanOrEqual(description.bottom);
      await expect(Math.abs(control.left - description.left)).toBeLessThan(1);

      // Still named by the title once it has wrapped.
      await expect(scope.getByRole("switch", { name: "Dark mode" })).toBeTruthy();
    }
  },
};
