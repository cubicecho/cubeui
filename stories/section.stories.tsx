import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { Section as Compiled } from "../compiled/section";
import { Section as Native } from "../registry/layout/section";
import { SideBySide } from "./side-by-side";

/**
 * `section` was a web-only item until a React Native app wrote its own. These stories are what say
 * the one source still gives the DOM what the hand-written `<section>` + `<h2>` did: a heading of
 * the right rank, and a region named by it.
 */
const meta = {
  title: "Stage 0/Section",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = <Text className="text-foreground text-sm">Work 25 minutes, rest 5.</Text>;

export const Default: Story = {
  args: { title: "Pomodoro", description: "How long a focus block runs.", divider: true },
  render: (args) => (
    <SideBySide
      native={<Native {...args} content={body} />}
      compiled={<Compiled {...args} content={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both halves are a level-2 heading named by the title — the rank is a prop now, and a rank
    // known only at runtime is `role="heading"` + `aria-level` rather than an `<h2>`.
    const headings = canvas.getAllByRole("heading", { level: 2, name: "Pomodoro" });
    await expect(headings).toHaveLength(2);
    const [native, compiled] = headings;
    if (!native || !compiled) throw new Error("both halves should render");

    // The compiled root is a `<section>` named by its title, which is what makes it a landmark.
    const region = canvas.getByRole("region", { name: "Pomodoro" });
    await expect(region.tagName).toBe("SECTION");

    const nativeStyle = getComputedStyle(native);
    const compiledStyle = getComputedStyle(compiled);
    await expect(nativeStyle.color).toBe("rgb(115, 115, 115)");
    await expect(compiledStyle.color).toBe(nativeStyle.color);
    await expect(compiledStyle.fontSize).toBe(nativeStyle.fontSize);
    await expect(compiledStyle.textTransform).toBe("uppercase");
    await expect(compiledStyle.letterSpacing).toBe(nativeStyle.letterSpacing);
  },
};

export const Level: Story = {
  args: { title: "Breaks", level: 3 },
  render: (args) => (
    <SideBySide
      native={<Native {...args} content={body} />}
      compiled={<Compiled {...args} content={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 3, name: "Breaks" })).toHaveLength(2);
    await expect(canvas.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  },
};

export const CardSurface: Story = {
  args: { title: "Danger zone", surface: "card" },
  render: (args) => (
    <SideBySide
      native={<Native {...args} className="native-root" content={body} />}
      compiled={<Compiled {...args} className="compiled-root" content={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const native = canvasElement.querySelector(".native-root");
    const compiled = canvasElement.querySelector(".compiled-root");
    if (!native || !compiled) throw new Error("both halves should render");

    const nativeStyle = getComputedStyle(native);
    const compiledStyle = getComputedStyle(compiled);
    await expect(compiledStyle.borderTopWidth).toBe("1px");
    await expect(compiledStyle.borderTopWidth).toBe(nativeStyle.borderTopWidth);
    await expect(compiledStyle.paddingTop).toBe(nativeStyle.paddingTop);
    await expect(compiledStyle.backgroundColor).toBe(nativeStyle.backgroundColor);
  },
};
