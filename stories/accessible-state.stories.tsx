import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge } from "../registry/ui/badge";
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

/**
 * A badge with no label collapses to a dot, and the dot is the one form with no text to be named
 * by. So it is named outright or it is hidden, and the case this story exists to forbid is the
 * one in between: a coloured node sitting in the accessibility tree with nothing to say about
 * itself. The pill needs none of this — the word it shows is already its name.
 *
 * Every variant is rendered with a label as well, because the axe pass covers the whole canvas
 * and contrast is the thing this component's colour choices are most likely to get wrong. It
 * already caught one: `success` shipped as `green-600`, which is 3.22:1 against white.
 */
export const Badges: Story = {
  render: () => (
    <div className="flex flex-row flex-wrap items-center gap-2 bg-background p-6">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Overdue</Badge>
      <Badge variant="warning" label="Paused" />
      <Badge variant="secondary" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Active").textContent).toBe("Active");
    // The labelled dot: `role="img"` because it is a graphic standing for a word, and the label
    // is the word. Without the role the name has nothing to attach to.
    await expect(canvas.getByRole("img", { name: "Paused" }).getAttribute("aria-label")).toBe(
      "Paused",
    );
    // And the unlabelled one is decoration, so it is out of the tree entirely rather than in it
    // unnamed — one `img`, not two.
    await expect(canvas.queryAllByRole("img").length).toBe(1);
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
  },
};
