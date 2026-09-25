import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Separator as Compiled } from "../compiled/separator";
import { Separator as Native } from "../registry/ui/separator";
import { SideBySide } from "./side-by-side";

/**
 * The separator on both halves: one pixel thick, as long as its container, hidden from assistive
 * tech unless `decorative={false}` makes it a `role="separator"`. The play test measures each rule
 * and reads its role, and checks that the compiled half still answers a shadcn call site's
 * `data-[orientation=vertical]:h-4`.
 */
const meta = { title: "Stage 0/Separator" } satisfies Meta;
export default meta;
type Story = StoryObj;

type SeparatorComponent = typeof Native;

// A test id in each half's own spelling: `testID` on the React Native component, which
// react-native-web writes as `data-testid`, and the attribute itself on the compiled one.
type Mark = (id: string) => { testID: string } | { "data-testid": string };

function Rules({
  Separator,
  half,
  mark,
}: {
  Separator: SeparatorComponent;
  half: string;
  mark: Mark;
}) {
  return (
    <div className="flex w-64 flex-col gap-3">
      <span className="text-sm">Above</span>
      <Separator {...mark(`${half}-horizontal`)} />
      <span className="text-sm">Below</span>
      <div className="flex h-8 flex-row items-center gap-2 text-sm">
        <span>Left</span>
        <Separator {...mark(`${half}-vertical`)} orientation="vertical" />
        <span>Right</span>
      </div>
      <Separator decorative={false} aria-label={`${half} boundary`} />
      <div className="flex h-8 flex-row gap-2 text-sm">
        <span>Left</span>
        <Separator orientation="vertical" decorative={false} aria-label={`${half} column`} />
        <span>Right</span>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<Rules Separator={Native} half="native" mark={(id) => ({ testID: id })} />}
      compiled={
        <>
          <Rules
            Separator={Compiled as SeparatorComponent}
            half="compiled"
            mark={(id) => ({ "data-testid": id })}
          />
          <div className="flex h-8 flex-row items-center gap-2 text-sm">
            <span>shadcn</span>
            <Compiled
              data-testid="compiled-shadcn"
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <span>call site</span>
          </div>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = (el: Element) => el.getBoundingClientRect();
    const rule = (half: string, which: string) => canvas.getByTestId(`${half}-${which}`);

    for (const half of ["native", "compiled"]) {
      // Decorative, the default: one pixel, the length of its container, and out of the tree.
      const horizontal = rule(half, "horizontal");
      await expect(box(horizontal).height).toBe(1);
      await expect(box(horizontal).width).toBe(256);
      await expect(horizontal).toHaveAttribute("aria-hidden", "true");
      await expect(horizontal).not.toHaveAttribute("role");

      // Vertical, in a row whose children are centred: still the row's full height.
      const vertical = rule(half, "vertical");
      await expect(box(vertical).width).toBe(1);
      await expect(box(vertical).height).toBe(32);

      // `decorative={false}` is announced, with its orientation when it is not the default.
      const boundary = canvas.getByRole("separator", { name: `${half} boundary` });
      await expect(box(boundary).height).toBe(1);
      const column = canvas.getByRole("separator", { name: `${half} column` });
      await expect(box(column).width).toBe(1);
      await expect(box(column).height).toBe(32);
      if (half === "compiled") {
        await expect(boundary).not.toHaveAttribute("aria-orientation");
        await expect(column).toHaveAttribute("aria-orientation", "vertical");
      }
    }
    await expect(canvas.getAllByRole("separator")).toHaveLength(4);

    // The compiled half carries Radix's `data-orientation`, so a shadcn call site's variant still
    // sizes it.
    const shadcn = canvas.getByTestId("compiled-shadcn");
    await expect(shadcn).toHaveAttribute("data-orientation", "vertical");
    await expect(box(shadcn).height).toBe(16);
  },
};
