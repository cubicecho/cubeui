import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  COLOR_SWATCHES,
  ColorPicker,
  isHexColor,
  normalizeHex,
} from "@/components/ui/color-picker";

/*
 * cubeui's stories, ported to the picker next ships. On `main` it was a popover: a trigger that
 * named the colour, swatch *buttons* with `aria-pressed`, a hex box whose half-typed draft never
 * reached the value, and the OS colour well. Here it is inline — a radio group of swatches and the
 * hex box under it — so the swatches are radios with `aria-checked`, the value is read from an
 * `<output>` beside it rather than from a trigger, and the stories for the trigger, the popover
 * closing and the native well are gone with those parts.
 */

/** `auto-cal`'s activity palette, as a short list stands in for a domain one. */
const ACTIVITY_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"] as const;

function Harness({
  initial = "",
  ...props
}: Partial<ComponentProps<typeof ColorPicker>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid w-72 gap-2">
      <ColorPicker
        aria-label="Tag colour"
        hexLabel="Hex"
        {...props}
        value={value}
        onValueChange={setValue}
      />
      <output data-testid="value">{value || "No colour"}</output>
    </div>
  );
}

const meta = {
  title: "Control/ColorPicker",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithAValue: Story = { args: { initial: "#10b981" } };

export const WithItsOwnPalette: Story = {
  args: { initial: "#ec4899", swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    expect(canvas.getAllByRole("radio")).toHaveLength(ACTIVITY_COLORS.length);
  },
};

/** Choosing a swatch is the whole interaction: the value is the swatch. */
export const ChoosingASwatchSetsTheValue: Story = {
  args: { swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("radio", { name: "#f59e0b" }));
    expect(canvas.getByTestId("value")).toHaveTextContent("#f59e0b");
    expect(canvas.getByLabelText("Hex")).toHaveValue("#f59e0b");
  },
};

/**
 * The chosen swatch says so to assistive technology, not only with a ring — `ring-ring` is a
 * theme colour, so on the swatch nearest it the selection is invisible.
 */
export const TheChosenSwatchIsAnnounced: Story = {
  args: { initial: "#10b981", swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("radiogroup", { name: "Tag colour" })).toBeVisible();
    expect(canvas.getByRole("radio", { name: "#10b981" })).toHaveAttribute("aria-checked", "true");
    expect(canvas.getByRole("radio", { name: "#ec4899" })).toHaveAttribute("aria-checked", "false");
  },
};

/** Shorthand and full hex are one colour, and case is not part of the comparison. */
export const ShorthandMatchesTheSwatch: Story = {
  args: { initial: "#0F0", swatches: ["#00ff00", "#ff0000"] },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("radio", { name: "#00ff00" })).toHaveAttribute("aria-checked", "true");
  },
};

/** A colour that is not on the list is still a colour. Typing it sets it. */
export const AColourNotOnTheListCanBeTyped: Story = {
  args: { swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    // TODO(color-picker): type it without the `#`. `main`'s picker put the `#` back — people paste
    // out of design tools without one — and committed only a whole colour; next's hands the box's
    // text to `onValueChange` as typed, so `#fffaa` reaches the value too.
    await userEvent.type(canvas.getByLabelText("Hex"), "#2563eb");
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("#2563eb"));
    for (const swatch of canvas.getAllByRole("radio")) {
      expect(swatch).toHaveAttribute("aria-checked", "false");
    }
  },
};

/** Emptying the box *is* an answer — the same "no colour" Clear gives, by the keyboard. */
export const EmptyingTheBoxClearsTheColour: Story = {
  args: { initial: "#10b981" },
  play: async ({ canvas }) => {
    await userEvent.clear(canvas.getByLabelText("Hex"));
    await waitFor(() => expect(canvas.getByTestId("value")).toHaveTextContent("No colour"));
  },
};

/** Clearing is a real answer — an optional colour column holds no colour. */
export const ClearIsReachable: Story = {
  args: { initial: "#10b981", clearable: true },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    expect(canvas.getByTestId("value")).toHaveTextContent("No colour");
  },
};

/** Nothing to clear, so nothing offering to. */
export const ClearIsAbsentWhenEmpty: Story = {
  args: { clearable: true },
  play: async ({ canvas }) => {
    expect(canvas.queryByRole("button", { name: "Clear" })).toBeNull();
  },
};

export const Disabled: Story = {
  args: { initial: "#10b981", disabled: true },
  play: async ({ canvas }) => {
    for (const swatch of canvas.getAllByRole("radio")) expect(swatch).toBeDisabled();
    expect(canvas.getByLabelText("Hex")).toBeDisabled();
  },
};

export const TheHelpersHoldUp: Story = {
  play: async () => {
    expect(normalizeHex("2563eb")).toBe("#2563eb");
    expect(normalizeHex("  #2563EB ")).toBe("#2563EB");
    expect(normalizeHex("   ")).toBe("");

    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#ffffff")).toBe(true);
    expect(isHexColor("#ff")).toBe(false);
    expect(isHexColor("rebeccapurple")).toBe(false);

    expect(new Set(COLOR_SWATCHES).size).toBe(COLOR_SWATCHES.length);
    expect(COLOR_SWATCHES.every(isHexColor)).toBe(true);
  },
};
