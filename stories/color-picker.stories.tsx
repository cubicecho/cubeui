import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import {
  COLOR_SWATCHES,
  ColorPicker,
  isHexColor,
  normalizeHex,
} from "@/registry/new-york/control/color-picker";

/** `auto-cal`'s activity palette, as a short list stands in for a domain one. */
const ACTIVITY_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"] as const;

function Harness({
  initial = "",
  ...props
}: Partial<ComponentProps<typeof ColorPicker>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="w-72">
      <ColorPicker aria-label="Tag colour" {...props} value={value} onValueChange={setValue} />
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
};

/** The trigger reads the colour out, so the field is legible without opening anything. */
export const TheTriggerNamesTheColour: Story = {
  args: { initial: "#10b981" },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: /Tag colour/ })).toHaveTextContent("#10b981");
  },
};

/** With nothing chosen, the placeholder stands in — and it is muted, not a fake colour. */
export const Empty: Story = {
  args: { placeholder: "No colour" },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: /Tag colour/ })).toHaveTextContent("No colour");
  },
};

/** Choosing a swatch is the end of the interaction, so the popover goes away. */
export const ChoosingASwatchCloses: Story = {
  args: { swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Tag colour/ });
    await userEvent.click(trigger);

    await userEvent.click(await screen.findByRole("button", { name: "#f59e0b" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveTextContent("#f59e0b");
  },
};

/**
 * The chosen swatch says so to assistive technology, not only with a ring — `ring-ring` is a
 * theme colour, so on the swatch nearest it the selection is invisible.
 */
export const TheChosenSwatchIsAnnounced: Story = {
  args: { initial: "#10b981", swatches: ACTIVITY_COLORS },
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: /Tag colour/ }));

    expect(await screen.findByRole("button", { name: "#10b981" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "#ec4899" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

/** Shorthand and full hex are one colour, and case is not part of the comparison. */
export const ShorthandMatchesTheSwatch: Story = {
  args: { initial: "#0F0", swatches: ["#00ff00", "#ff0000"] },
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: /Tag colour/ }));
    expect(await screen.findByRole("button", { name: "#00ff00" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** A colour that is not on the list is still a colour. Typing it commits it. */
export const AColourNotOnTheListCanBeTyped: Story = {
  args: { swatches: ACTIVITY_COLORS },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Tag colour/ });
    await userEvent.click(trigger);

    await userEvent.type(await screen.findByLabelText("Hex"), "2563eb");
    // The `#` is put back rather than demanded — people paste out of design tools without it.
    await waitFor(() => expect(trigger).toHaveTextContent("#2563eb"));
  },
};

/**
 * Half a colour is not a colour. `#fffaa` never reaches the value, and leaving the box drops the
 * draft rather than leaving the form holding something that cannot be drawn.
 */
export const AHalfTypedColourIsNotCommitted: Story = {
  args: { initial: "#fff" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Tag colour/ });
    await userEvent.click(trigger);

    const hex = await screen.findByLabelText("Hex");
    await userEvent.type(hex, "aa");
    expect(hex).toHaveValue("#fffaa");
    expect(trigger).toHaveTextContent("#fff");

    await userEvent.tab();
    await waitFor(() => expect(hex).toHaveValue("#fff"));
  },
};

/**
 * Emptying the box *is* an answer, though — it is the same "no colour" the Clear button gives,
 * reached by the keyboard, and it reaches the value immediately.
 */
export const EmptyingTheBoxClearsTheColour: Story = {
  args: { initial: "#10b981" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Tag colour/ });
    await userEvent.click(trigger);

    await userEvent.clear(await screen.findByLabelText("Hex"));
    await waitFor(() => expect(trigger).toHaveTextContent("No color"));
  },
};

/** Clearing is a real answer — an optional colour column holds no colour. */
export const ClearIsReachable: Story = {
  args: { initial: "#10b981" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Tag colour/ });
    await userEvent.click(trigger);

    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveTextContent("No color");
  },
};

/** Nothing to clear, so nothing offering to. */
export const ClearIsAbsentWhenEmpty: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Tag colour/ }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  },
};

/** The OS picker is still there, for a colour being matched to something outside the app. */
export const TheNativeWellIsLabelled: Story = {
  args: { initial: "#10b981" },
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: /Tag colour/ }));
    expect(await screen.findByLabelText("Custom color")).toHaveValue("#10b981");
  },
};

export const Disabled: Story = { args: { initial: "#10b981", disabled: true } };

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
