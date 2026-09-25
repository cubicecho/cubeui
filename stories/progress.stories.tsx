import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Progress as Compiled } from "../compiled/progress";
import { Progress as Native } from "../registry/ui/progress";
import { SideBySide } from "./side-by-side";

/**
 * The progress bar on both halves. The play test is what says the value is announced — clamped,
 * out of `max`, in words when `valueLabel` is given, and absent when there is no value — and that
 * the filled part is as wide as the fraction says, the same on both halves.
 */
const meta = { title: "Stage 0/Progress" } satisfies Meta;
export default meta;
type Story = StoryObj;

type ProgressComponent = typeof Native;

function Bars({ Progress }: { Progress: ProgressComponent }) {
  return (
    <div className="flex w-64 flex-col gap-3">
      <Progress value={40} label="Upload" />
      <Progress
        value={1204}
        max={5880}
        label="Re-embedding progress"
        valueLabel="1,204 of 5,880 turns"
      />
      <Progress value={130} label="Overshoot" />
      <Progress value={-5} label="Undershoot" />
      <Progress
        value={92}
        label="Context window"
        className="h-1.5"
        indicatorClassName="bg-destructive"
      />
      <Progress label="Waiting" />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<Bars Progress={Native} />}
      compiled={<Bars Progress={Compiled as ProgressComponent} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("progressbar")).toHaveLength(12);

    const pair = (name: string) => {
      const [native, compiled] = canvas.getAllByRole("progressbar", { name });
      if (!native || !compiled) throw new Error(`both halves should render "${name}"`);
      return [native, compiled] as const;
    };
    // How much of its track the filled part covers, as a fraction.
    const fill = (bar: Element) => {
      const indicator = bar.firstElementChild;
      if (!indicator) throw new Error("a progress bar should draw its indicator");
      return indicator.getBoundingClientRect().width / bar.getBoundingClientRect().width;
    };

    const cases: [string, string | null, string, number][] = [
      ["Upload", "40", "100", 0.4],
      ["Re-embedding progress", "1204", "5880", 1204 / 5880],
      ["Overshoot", "100", "100", 1],
      ["Undershoot", "0", "100", 0],
      ["Context window", "92", "100", 0.92],
      ["Waiting", null, "100", 0],
    ];
    for (const [name, now, max, fraction] of cases) {
      for (const bar of pair(name)) {
        await expect(bar).toHaveAttribute("aria-valuemin", "0");
        await expect(bar).toHaveAttribute("aria-valuemax", max);
        if (now === null) await expect(bar).not.toHaveAttribute("aria-valuenow");
        else await expect(bar).toHaveAttribute("aria-valuenow", now);
        await expect(fill(bar)).toBeCloseTo(fraction, 2);
      }
    }

    // The value in words is read only where it was given.
    for (const bar of pair("Re-embedding progress")) {
      await expect(bar).toHaveAttribute("aria-valuetext", "1,204 of 5,880 turns");
    }
    for (const bar of pair("Upload")) await expect(bar).not.toHaveAttribute("aria-valuetext");

    // The track and the fill are the same colours and height on both halves, and the slot
    // className reaches the fill.
    const [nativeUpload, compiledUpload] = pair("Upload");
    const background = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : "");
    await expect(background(compiledUpload)).toBe(background(nativeUpload));
    await expect(background(compiledUpload.firstElementChild)).toBe(
      background(nativeUpload.firstElementChild),
    );
    await expect(compiledUpload.getBoundingClientRect().height).toBe(8);
    await expect(nativeUpload.getBoundingClientRect().height).toBe(8);
    const [nativeContext, compiledContext] = pair("Context window");
    await expect(background(compiledContext.firstElementChild)).toBe(
      background(nativeContext.firstElementChild),
    );
    await expect(background(compiledContext.firstElementChild)).not.toBe(
      background(compiledUpload.firstElementChild),
    );
    await expect(compiledContext.getBoundingClientRect().height).toBe(6);
  },
};
