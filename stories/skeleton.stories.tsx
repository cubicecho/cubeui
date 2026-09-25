import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Skeleton as Compiled } from "../compiled/skeleton";
import { Skeleton as Native } from "../registry/ui/skeleton.tsx";
import { SideBySide } from "./side-by-side";

/**
 * The skeleton on both halves: a rounded `bg-accent` block the caller sizes, pulsing — the web
 * half by CSS animation, the native one by the opacity `Animated` drives. The play test measures
 * each block and checks both are wired to pulse.
 */
const meta = { title: "Stage 0/Skeleton" } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-2">
          <Native testID="native-line" className="h-4 w-[250px]" />
          <Native testID="native-short" className="h-4 w-[200px]" aria-hidden />
        </div>
      }
      compiled={
        <div className="flex flex-col gap-2">
          <Compiled data-testid="compiled-line" className="h-4 w-[250px]" />
          <Compiled data-testid="compiled-short" className="h-4 w-[200px]" aria-hidden />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const block = (id: string) => canvas.getByTestId(id);

    for (const half of ["native", "compiled"]) {
      const line = block(`${half}-line`).getBoundingClientRect();
      await expect(line.width).toBe(250);
      await expect(line.height).toBe(16);
      await expect(block(`${half}-short`).getBoundingClientRect().width).toBe(200);
      await expect(block(`${half}-short`)).toHaveAttribute("aria-hidden", "true");
      // The same token on both: `bg-accent`, rounded.
      await expect(getComputedStyle(block(`${half}-line`)).borderTopLeftRadius).not.toBe("0px");
    }
    await expect(getComputedStyle(block("native-line")).backgroundColor).toBe(
      getComputedStyle(block("compiled-line")).backgroundColor,
    );

    await expect(getComputedStyle(block("compiled-line")).animationName).not.toBe("none");
    // The native one is driven by `Animated`, whose opacity has to reach the same element as the
    // caller's `className` — the reason it is `createAnimatedComponent(View)` and not
    // `Animated.View`, which drops the class and the size with it. The pulse itself cannot be
    // watched here: react-native-web swaps in `AnimatedMock` under a test runner
    // (`Platform.isTesting`), which settles every animation at once.
    await expect(block("native-line").style.opacity).toBe("1");
  },
};
