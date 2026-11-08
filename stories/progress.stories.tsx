import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Progress as Compiled } from "../compiled/progress";
import { Progress as Native } from "../registry/ui/progress";
import { SideBySide } from "./side-by-side";

/**
 * The progress bar on both halves. The play test is what says the value is announced — clamped,
 * out of `max`, in words when `valueLabel` is given, and absent when there is no value — and that
 * the filled part is as wide as the fraction says, the same on both halves. With no value the bar
 * draws a third of its track, and `Indeterminate` is what says it sweeps, or rests under reduced
 * motion (#487).
 */
const meta = { title: "RN Parity/Progress" } satisfies Meta;
export default meta;
type Story = StoryObj;

type ProgressComponent = typeof Native;

/** The filled part, on either half: the native one is named by its `testID`. */
function indicatorOf(bar: Element): Element {
  const indicator = bar.querySelector(
    "[data-slot=progress-indicator], [data-testid=progress-indicator]",
  );
  if (!indicator) {
    throw new Error("a progress bar should draw its indicator");
  }
  return indicator;
}

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
        indicatorClassName="bg-negative"
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
      if (!native || !compiled) {
        throw new Error(`both halves should render "${name}"`);
      }
      return [native, compiled] as const;
    };
    // How much of its track, inside the edge, the filled part covers, as a fraction.
    const fill = (bar: Element) => indicatorOf(bar).getBoundingClientRect().width / bar.clientWidth;

    const cases: [string, string | null, string, number][] = [
      ["Upload", "40", "100", 0.4],
      ["Re-embedding progress", "1204", "5880", 1204 / 5880],
      ["Overshoot", "100", "100", 1],
      ["Undershoot", "0", "100", 0],
      ["Context window", "92", "100", 0.92],
      // No value is a third of the track, sweeping: never the empty bar 0% is.
      ["Waiting", null, "100", 1 / 3],
    ];
    for (const [name, now, max, fraction] of cases) {
      for (const bar of pair(name)) {
        await expect(bar).toHaveAttribute("aria-valuemin", "0");
        await expect(bar).toHaveAttribute("aria-valuemax", max);
        if (now === null) {
          await expect(bar).not.toHaveAttribute("aria-valuenow");
        } else {
          await expect(bar).toHaveAttribute("aria-valuenow", now);
        }
        await expect(fill(bar)).toBeCloseTo(fraction, 2);
      }
    }

    // The value in words is read only where it was given.
    for (const bar of pair("Re-embedding progress")) {
      await expect(bar).toHaveAttribute("aria-valuetext", "1,204 of 5,880 turns");
    }
    for (const bar of pair("Upload")) {
      await expect(bar).not.toHaveAttribute("aria-valuetext");
    }

    // The track and the fill are the same colours and height on both halves, and the slot
    // className reaches the fill.
    const [nativeUpload, compiledUpload] = pair("Upload");
    const background = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : "");
    await expect(background(compiledUpload)).toBe(background(nativeUpload));
    await expect(background(indicatorOf(compiledUpload))).toBe(
      background(indicatorOf(nativeUpload)),
    );
    // The edge that shows the whole track, the same on both halves.
    await expect(getComputedStyle(compiledUpload).borderTopColor).toBe(
      getComputedStyle(nativeUpload).borderTopColor,
    );
    await expect(getComputedStyle(compiledUpload).borderTopWidth).toBe("1px");
    await expect(compiledUpload.getBoundingClientRect().height).toBe(8);
    await expect(nativeUpload.getBoundingClientRect().height).toBe(8);
    const [nativeContext, compiledContext] = pair("Context window");
    await expect(background(indicatorOf(compiledContext))).toBe(
      background(indicatorOf(nativeContext)),
    );
    await expect(background(indicatorOf(compiledContext))).not.toBe(
      background(indicatorOf(compiledUpload)),
    );
    await expect(compiledContext.getBoundingClientRect().height).toBe(6);
  },
};

/** Where the segment starts, in widths of the track inside its edge. */
function offsetOf(bar: Element): number {
  const track = bar.getBoundingClientRect().left + bar.clientLeft;
  return (indicatorOf(bar).getBoundingClientRect().left - track) / bar.clientWidth;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * With no value, a third of the track sweeps across it, so waiting never looks like 0% (#487).
 * Under reduced motion it holds still in the middle third, off the start, where it cannot be read
 * as an amount. Tagged `reduced-motion`, so it runs again in a browser that asks for it.
 */
export const Indeterminate: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <SideBySide
      native={
        <div className="flex w-64 flex-col gap-3">
          <Native label="Waiting" />
          <Native label="Waiting on the server" indicatorClassName="bg-info" />
        </div>
      }
      compiled={
        <div className="flex w-64 flex-col gap-3">
          <Compiled label="Waiting" />
          <Compiled label="Waiting on the server" indicatorClassName="bg-info" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bars = canvas.getAllByRole("progressbar");
    await expect(bars).toHaveLength(4);
    // The native half measures its track before it starts.
    await pause(100);
    const before = bars.map(offsetOf);
    await pause(250);
    const after = bars.map(offsetOf);
    for (const [index, bar] of bars.entries()) {
      await expect(bar).not.toHaveAttribute("aria-valuenow");
      const width = indicatorOf(bar).getBoundingClientRect().width / bar.clientWidth;
      await expect(width).toBeCloseTo(1 / 3, 2);
      if (reduced) {
        await expect(after[index]).toBeCloseTo(1 / 3, 2);
        await expect(after[index]).toBe(before[index]);
      } else {
        await expect(after[index]).not.toBe(before[index]);
      }
    }
  },
};
