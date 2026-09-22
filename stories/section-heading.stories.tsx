import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SectionHeading as Compiled } from "../compiled/section-heading";
import { SectionHeading as Native } from "../registry/layout/section-heading";
import { SideBySide } from "./side-by-side";

/**
 * The trivial case, and the one that establishes the baseline: one `<Text>`, no state, no
 * semantics to infer. If the compiled half of this does not match, nothing further is worth
 * measuring.
 */
const meta = {
  title: "Stage 0/SectionHeading",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Also the harness's own smoke test, and the reason it asserts rather than just renders.
 *
 * `className` on a `react-native` component is Metro's job on device, and nothing does that job
 * under Vite — react-native-web has no `className` passthrough, so without
 * `.storybook/rn-classname.ts` every React Native half of every story renders unstyled, silently
 * and with no error. A story that only rendered would look plausible while comparing a styled
 * tree against an unstyled one. Reading the computed colour off both halves is what makes that
 * failure loud, so the comparison the rest of these stories make is worth something.
 */
export const Default: Story = {
  args: { children: "Upcoming" },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [native, compiled] = canvas.getAllByText("Upcoming");
    if (!native || !compiled) throw new Error("both halves should render");

    const nativeStyle = getComputedStyle(native);
    const compiledStyle = getComputedStyle(compiled);

    // `text-muted-foreground` in the light palette. Spelled as the literal the token emits so a
    // half that silently lost its classes cannot pass by matching the other unstyled half.
    await expect(nativeStyle.color).toBe("rgb(115, 115, 115)");
    await expect(compiledStyle.color).toBe(nativeStyle.color);
    await expect(compiledStyle.fontSize).toBe(nativeStyle.fontSize);
    await expect(compiledStyle.fontWeight).toBe(nativeStyle.fontWeight);
  },
};

export const Overline: Story = {
  args: { variant: "overline", children: "This week" },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [native, compiled] = canvas.getAllByText("This week");
    if (!native || !compiled) throw new Error("both halves should render");

    await expect(getComputedStyle(compiled).textTransform).toBe(
      getComputedStyle(native).textTransform,
    );
    await expect(getComputedStyle(compiled).textTransform).toBe("uppercase");
  },
};
