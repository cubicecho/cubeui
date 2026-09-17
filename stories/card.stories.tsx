import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  Card as Compiled,
  CardContent as CompiledContent,
  CardDescription as CompiledDescription,
  CardFooter as CompiledFooter,
  CardHeader as CompiledHeader,
  CardTitle as CompiledTitle,
} from "../compiled/card";
import {
  Card as Native,
  CardContent as NativeContent,
  CardDescription as NativeDescription,
  CardFooter as NativeFooter,
  CardHeader as NativeHeader,
  CardTitle as NativeTitle,
} from "../registry/ui/card";
import { SideBySide } from "./side-by-side";

/**
 * The component the spike is really about: nested `View`/`Text`, a `forwardRef`, a container that
 * changes element on a prop, and semantics the source already states in `role`/`aria-level`.
 */
const meta = { title: "Stage 0/Card" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * The geometry check, and the one that decides the plan's open risk #1.
 *
 * A compiled `<div>` has none of react-native-web's per-component base class, so the question is
 * whether `cube-rn-reset.css` replaces enough of it that the same classes produce the same box.
 * Comparing the rendered rectangles is the only version of that question with an answer: the two
 * halves get the same width from the frame, so any difference in height is a difference in how
 * the two trees laid out.
 */
export const Static: Story = {
  render: () => {
    const body = (
      C: typeof Native | typeof Compiled,
      H: typeof NativeHeader | typeof CompiledHeader,
      T: typeof NativeTitle | typeof CompiledTitle,
      D: typeof NativeDescription | typeof CompiledDescription,
      Ct: typeof NativeContent | typeof CompiledContent,
      F: typeof NativeFooter | typeof CompiledFooter,
      probe: Record<string, string>,
    ) => (
      <C {...probe}>
        <H>
          <T>Quarterly review</T>
          <D>Everything that shipped since June.</D>
        </H>
        <Ct>
          <D>Twelve items, four of them still open.</D>
        </Ct>
        <F>
          <D>Updated today</D>
        </F>
      </C>
    );

    return (
      <SideBySide
        native={body(
          Native,
          NativeHeader,
          NativeTitle,
          NativeDescription,
          NativeContent,
          NativeFooter,
          // `data-testid` is not a React Native prop. react-native-web derives the attribute from
          // `testID`, which is the same rename the element map has to perform — so the two halves
          // are probed by the two spellings of one thing.
          { testID: "native-card" },
        )}
        compiled={body(
          Compiled,
          CompiledHeader,
          CompiledTitle,
          CompiledDescription,
          CompiledContent,
          CompiledFooter,
          { "data-testid": "compiled-card" },
        )}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The semantic claim: the source said `role="heading" aria-level={3}`, the compiled output
    // says `<h3>`, and the accessibility tree cannot tell the two apart. Finding both through the
    // same query is what "the compiler preserved the semantics" means operationally.
    const headings = canvas.getAllByRole("heading", { level: 3 });
    await expect(headings).toHaveLength(2);

    const native = canvas.getByTestId("native-card").getBoundingClientRect();
    const compiled = canvas.getByTestId("compiled-card").getBoundingClientRect();

    // A pixel of tolerance for sub-pixel rounding, not for a layout that nearly agrees.
    await expect(Math.abs(compiled.height - native.height)).toBeLessThanOrEqual(1);
    await expect(Math.abs(compiled.width - native.width)).toBeLessThanOrEqual(1);
  },
};

/**
 * The `role="button"` the source already carries, taken at its word — and the story that corrected
 * this spike's own assumption.
 *
 * It was written expecting react-native-web to render the `Pressable` as a focusable `<div>`, with
 * the compiled `<button>` as the improvement. It does not: given `role="button"` react-native-web
 * emits a real `<button>` too. That is the strongest evidence the spike produced, because it means
 * level-2 inference is not a new idea the compiler is gambling on — it is what the web target
 * already does with these components, and compiling only removes the runtime that was doing it.
 */
export const Pressable: Story = {
  render: () => (
    <SideBySide
      native={
        <Native onPress={() => {}} testID="native-card">
          <NativeHeader>
            <NativeTitle>Open the review</NativeTitle>
          </NativeHeader>
        </Native>
      }
      compiled={
        <Compiled onPress={() => {}} data-testid="compiled-card">
          <CompiledHeader>
            <CompiledTitle>Open the review</CompiledTitle>
          </CompiledHeader>
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button")).toHaveLength(2);

    // Both halves, not just the compiled one.
    await expect(canvas.getByTestId("native-card").tagName).toBe("BUTTON");
    await expect(canvas.getByTestId("compiled-card").tagName).toBe("BUTTON");

    // Down to `type`, which is not a React Native concept at all: a `<button>` inside a `<form>`
    // with no type submits it, and react-native-web sets it for the same reason the compiler does.
    await expect(canvas.getByTestId("compiled-card").getAttribute("type")).toBe("button");
    await expect(canvas.getByTestId("native-card").getAttribute("type")).toBe("button");
  },
};

/**
 * `ColorBar` through `Card`, which is the absolutely-positioned case — the one where the reset's
 * `position: relative` on the container is what keeps the bar inside the card instead of pinning
 * it to the viewport.
 */
export const Accent: Story = {
  render: () => (
    <SideBySide
      native={
        <Native accentColor="#3b82f6" accentLabel="Engineering" testID="native-card">
          <NativeHeader>
            <NativeTitle>Engineering</NativeTitle>
            <NativeDescription>Owned by the platform team.</NativeDescription>
          </NativeHeader>
        </Native>
      }
      compiled={
        <Compiled accentColor="#3b82f6" accentLabel="Engineering" data-testid="compiled-card">
          <CompiledHeader>
            <CompiledTitle>Engineering</CompiledTitle>
            <CompiledDescription>Owned by the platform team.</CompiledDescription>
          </CompiledHeader>
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bars = canvas.getAllByRole("img", { name: "Engineering" });
    await expect(bars).toHaveLength(2);

    const [nativeBar, compiledBar] = bars;
    if (!nativeBar || !compiledBar) throw new Error("both bars should render");

    const inside = (bar: Element, card: Element) => {
      const b = bar.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      return b.left >= c.left - 1 && b.right <= c.right + 1 && b.height > 0;
    };

    await expect(inside(nativeBar, canvas.getByTestId("native-card"))).toBe(true);
    await expect(inside(compiledBar, canvas.getByTestId("compiled-card"))).toBe(true);
  },
};
