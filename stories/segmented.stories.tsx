import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SegmentedButton as Compiled } from "../compiled/segmented";
import { SegmentedButton as Native } from "../registry/ui/segmented";
import { SideBySide } from "./side-by-side";

/**
 * Variants and a selected state — the third of the spike's three, and the one that found a bug.
 *
 * The first version of this story asserted `aria-selected` on the React Native half, because that
 * is what `accessibilityState={{ selected }}` looks like it should produce. It produced nothing:
 * react-native-web forwards an allowlist of `aria-*` props and ignores `accessibilityState`, so
 * the active pill was styled and silent. `registry/ui/segmented.tsx` now passes `aria-pressed`
 * under a web guard, and this story is what holds that.
 */
const meta = { title: "Stage 0/Segmented" } satisfies Meta;
export default meta;
type Story = StoryObj;

const OPTIONS = ["Day", "Week", "Month"] as const;

export const Row: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row gap-1">
          {OPTIONS.map((option) => (
            <Native key={option} active={option === "Week"} onPress={() => {}}>
              {option}
            </Native>
          ))}
        </div>
      }
      compiled={
        <div className="flex flex-row gap-1">
          {OPTIONS.map((option) => (
            // `onClick` on this half; see the note in `card.stories.tsx`.
            <Compiled key={option} active={option === "Week"} onClick={() => {}}>
              {option}
            </Compiled>
          ))}
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Six buttons, three per half: the role survives on both.
    await expect(canvas.getAllByRole("button")).toHaveLength(6);

    const [nativeWeek, compiledWeek] = canvas.getAllByRole("button", { name: "Week" });
    if (!nativeWeek || !compiledWeek) throw new Error("both halves should render the active pill");

    // The state both halves have to expose, and the assertion that caught its absence.
    await expect(nativeWeek.getAttribute("aria-pressed")).toBe("true");
    await expect(compiledWeek.getAttribute("aria-pressed")).toBe("true");

    // And the inactive ones say so rather than saying nothing, which is the difference between
    // "this pill is not current" and "this pill has no state to report".
    const [nativeMonth] = canvas.getAllByRole("button", { name: "Month" });
    await expect(nativeMonth?.getAttribute("aria-pressed")).toBe("false");

    // The styling claim: whatever the element, the active pill is the one with the primary
    // background, on both halves and from the same class.
    const background = (el: Element) => getComputedStyle(el).backgroundColor;
    await expect(background(compiledWeek)).toBe(background(nativeWeek));

    const [nativeDay] = canvas.getAllByRole("button", { name: "Day" });
    if (!nativeDay) throw new Error("the inactive pill should render");
    await expect(background(nativeWeek)).not.toBe(background(nativeDay));
  },
};
