import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ColorPicker } from "../registry/ui/color-picker";
import { ToggleChip } from "../registry/ui/toggle-chip";

/**
 * Not a Stage 0 comparison — these two have no compiled counterpart. They are here because the
 * segmented spike found a whole class of bug rather than one instance of it, and a fix nothing
 * holds is a fix that comes back.
 *
 * `accessibilityState` is the React Native spelling of "this control is selected / checked /
 * disabled", and react-native-web reads none of it: it forwards an allowlist of `aria-*` props
 * and drops everything else. Every control in this registry that announced its state that way was
 * announcing it to nobody on web — styled correctly, and silent. These stories are what say the
 * state is now on the element, and the `a11y: { test: "error" }` in `.storybook/preview.ts` is
 * what says the spelling chosen is one the role actually allows.
 */
const meta = { title: "Accessible state" } satisfies Meta;
export default meta;
type Story = StoryObj;

/** A `button` says it is on with `aria-pressed`. `aria-selected` on a button is an axe failure. */
export const Chips: Story = {
  render: () => (
    <div className="flex flex-row gap-2 bg-background p-6">
      <ToggleChip selected onPress={() => {}}>
        Mon
      </ToggleChip>
      <ToggleChip onPress={() => {}}>Tue</ToggleChip>
      <ToggleChip disabled onPress={() => {}}>
        Wed
      </ToggleChip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Mon" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Tue" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    await expect(canvas.getByRole("button", { name: "Wed" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
  },
};

/**
 * A swatch row is a radio group, which is two claims: each swatch says `aria-checked` — a radio's
 * spelling, not a button's — and they sit inside a `radiogroup`, without which a `radio` is an
 * orphan and axe says so.
 */
export const Swatches: Story = {
  render: () => (
    <div className="bg-background p-6">
      <ColorPicker value="#3b82f6" onChange={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup");
    await expect(within(group).getByRole("radio", { checked: true })).toHaveAttribute(
      "aria-label",
      "#3b82f6",
    );
    await expect(within(group).getAllByRole("radio", { checked: false }).length).toBeGreaterThan(0);
  },
};
