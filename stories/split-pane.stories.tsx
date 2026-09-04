import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { StickyHeaderContentFooter } from "@/registry/new-york/layout/header-content-footer";
import { type RailWidth, SplitPane } from "@/registry/new-york/layout/split-pane";

const meta = {
  title: "Layout/SplitPane",
  component: SplitPane,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SplitPane>;

export default meta;
type Story = StoryObj<typeof meta>;

const Surface = ({ label, tall = false }: { label: string; tall?: boolean }) => (
  <div className={`rounded border bg-card p-4 text-sm ${tall ? "h-64" : ""}`}>
    <p className="font-medium">{label}</p>
    <p className="mt-1 text-muted-foreground">Placeholder surface.</p>
  </div>
);

const Nav = () => (
  <ul className="divide-y text-sm">
    {["Servers", "Workspaces", "Members", "Settings"].map((item) => (
      <li key={item} className="px-4 py-2">
        {item}
      </li>
    ))}
  </ul>
);

const RAIL_WIDTHS: RailWidth[] = [
  "auto",
  "sm",
  "md",
  "lg",
  "fifth",
  "two-fifths",
  "half",
  "two-thirds",
];

/** The plain split: a main surface, a rail beside it, and a gap between them. */
export const Default: Story = {
  render: (args) => (
    <div className="p-8">
      <SplitPane {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" tall />,
    rail: <Surface label="Rail" />,
    splitAt: "always",
  },
};

/**
 * Every rung of the width scale, so the widths it replaces — `w-56`, `w-72 lg:w-80`, `lg:w-52`,
 * `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)`, `60%` — can be read against each other rather
 * than one screen at a time. Fixed rungs size an inspector by its contents; proportional rungs
 * size a second working surface by the window.
 */
export const WidthScale: Story = {
  render: (args) => (
    <div className="space-y-6 p-8">
      {RAIL_WIDTHS.map((railWidth) => (
        <div key={railWidth}>
          <p className="mb-1 font-mono text-muted-foreground text-xs">{railWidth}</p>
          <SplitPane {...args} railWidth={railWidth} />
        </div>
      ))}
    </div>
  ),
  args: {
    content: <Surface label="Main" />,
    rail: <Surface label="Rail" />,
    splitAt: "always",
  },
};

/** The rail can lead. Stacked, it keeps this reading order rather than jumping below. */
export const RailAtStart: Story = {
  render: (args) => (
    <div className="p-8">
      <SplitPane {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" tall />,
    rail: <Surface label="Rail (start)" />,
    railSide: "start",
    railWidth: "md",
    splitAt: "always",
  },
};

/**
 * Collapse, and rule 5 with it. There is no `collapsed` prop: a closed sidebar is
 * `rail={undefined}`, and what that has to produce is one full-width column — not an empty cell,
 * not a gap still spent on the pane that is not there, and not a divider with one side.
 */
export const NoRailIsOneColumn: Story = {
  render: (args) => (
    <div className="w-[600px] p-0">
      <SplitPane {...args} />
    </div>
  ),
  args: { content: <Surface label="Main, full width" />, railWidth: "md", divider: "line" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-pane]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=sp-content]");
    expect(root).not.toBeNull();
    expect(main).not.toBeNull();
    if (!root || !main) return;

    // Neither the cell nor the rule is drawn — even though `divider="line"` was asked for, since
    // there is nothing on the far side of it to divide.
    expect(canvasElement.querySelector("[data-slot=sp-rail]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=sp-divider]")).toBeNull();

    // And the main pane has the whole width, with no gap spent on the absent rail.
    expect(main.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width);
  },
};

/**
 * The app shell: a nav rail flush against a working surface, with a hairline between them.
 *
 * The rule is a grid track rather than a `border-r` on the rail, which is what every hand-written
 * one uses. The border is right until the layout stacks, at which point it is a line down one
 * side of the screen instead of a line between the two panes.
 */
export const DividedByALine: Story = {
  render: (args) => (
    <div className="h-[300px] w-[600px] border">
      <SplitPane {...args} className="h-full" />
    </div>
  ),
  args: {
    content: <Surface label="Working surface" />,
    rail: <Nav />,
    railSide: "start",
    railWidth: "sm",
    splitAt: "always",
    divider: "line",
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>("[data-slot=sp-rail]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=sp-divider]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=sp-content]");
    expect(rail).not.toBeNull();
    expect(rule).not.toBeNull();
    expect(main).not.toBeNull();
    if (!rail || !rule || !main) return;

    const railBox = rail.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // A hairline, and one that actually sits between the two panes rather than beside one.
    expect(ruleBox.width).toBeCloseTo(1, 0);
    expect(ruleBox.left).toBeGreaterThanOrEqual(railBox.right - 0.5);
    expect(ruleBox.right).toBeLessThanOrEqual(mainBox.left + 0.5);
    // Flush: `line` spends no gap, so the three tracks meet.
    expect(mainBox.left - railBox.right).toBeCloseTo(1, 0);
    // It runs the height of the split, not the height of its own content.
    expect(ruleBox.height).toBeCloseTo(railBox.height, 0);
  },
};

/**
 * The keyboard answer, which is that the divider is deliberately *not* a control.
 *
 * Nothing here drags — the width is a prop, not stored state — so the rule is `aria-hidden` with
 * no role and no tab stop. A separator that takes focus and then does nothing when you press an
 * arrow key satisfies axe and leaves a keyboard user in a dead end. The access that is owed is
 * owed by whatever *behaves*, and here that is a scrolling pane: `StickyHeaderContentFooter`
 * takes the tab stop, inside the split, exactly as it does outside one.
 */
export const DividerIsNotAControl: Story = {
  render: (args) => (
    <div className="h-[300px] w-[600px] border">
      <SplitPane {...args} className="h-full" />
    </div>
  ),
  args: {
    railSide: "start",
    railWidth: "sm",
    splitAt: "always",
    divider: "line",
    rail: <Nav />,
    content: (
      <StickyHeaderContentFooter
        header={<div className="border-b px-4 py-2 font-semibold text-sm">Servers</div>}
        content={
          <ul className="divide-y">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
              <li key={n} className="px-4 py-3 text-sm">
                Server {n}
              </li>
            ))}
          </ul>
        }
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-pane]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=sp-divider]");
    expect(root).not.toBeNull();
    expect(rule).not.toBeNull();
    if (!root || !rule) return;

    // The rule is scenery: hidden from assistive technology, holding no role, taking no focus.
    expect(rule.getAttribute("aria-hidden")).toBe("true");
    expect(rule.getAttribute("role")).toBeNull();
    expect(rule.hasAttribute("tabindex")).toBe(false);

    // The split itself introduces no tab stops at all. The only one under it belongs to the
    // scrolling body, which earned it by being a region the wheel moves and nothing else does.
    const stops = root.querySelectorAll("[tabindex]");
    expect(stops.length).toBe(1);
    const body = canvasElement.querySelector<HTMLElement>("[data-slot=hcf-content]");
    expect(stops[0]).toBe(body);
    expect(body?.tabIndex).toBe(0);

    // And that pane scrolls inside the split rather than growing it: 30 rows of content, and
    // the split is still exactly as tall as the box it was given.
    if (!body) return;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(root.getBoundingClientRect().height).toBeCloseTo(
      root.parentElement?.clientHeight ?? 0,
      0,
    );
  },
};

/**
 * Rule 4 — the floors, in the axis `HeaderContentFooter` does not cover. One wide child in the
 * main pane must scroll inside its own cell instead of growing its track and shoving the rail off
 * the screen. Remove `min-w-0` from the cell, or the `minmax(0,…)` from the track, and this story
 * is how you find out: half the panes this component replaces are missing one or the other.
 */
export const WideContentKeepsItsFloor: Story = {
  render: (args) => (
    <div className="w-[800px] border">
      <SplitPane {...args} />
    </div>
  ),
  args: {
    railWidth: "sm",
    splitAt: "always",
    rail: <Surface label="Rail stays put" />,
    content: (
      <div className="overflow-x-auto rounded border bg-card">
        <div className="w-[2000px] px-4 py-3 text-sm">A single very wide child.</div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-pane]");
    const rail = canvasElement.querySelector<HTMLElement>("[data-slot=sp-rail]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=sp-content]");
    expect(root).not.toBeNull();
    expect(rail).not.toBeNull();
    expect(main).not.toBeNull();
    if (!root || !rail || !main) return;

    const rootBox = root.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // The split stayed inside its 800px box instead of being grown by the 2000px child.
    expect(rootBox.width).toBeLessThanOrEqual(800);
    // The `sm` rung is 20rem, and the wide child did not take a pixel of it.
    expect(railBox.width).toBeCloseTo(320, 0);
    // The rail is still on screen — the whole point of the floor — and the main pane took the
    // remainder rather than 2000px: the split's width, less the rail, less the `gap-4`.
    expect(railBox.right).toBeLessThanOrEqual(rootBox.right + 0.5);
    expect(mainBox.width).toBeCloseTo(rootBox.width - railBox.width - 16, 0);
  },
};

/**
 * Below `splitAt` the two stack, keeping their reading order, and the rule turns with them: a row
 * between the panes rather than a line down one side. This is the narrow-width answer — a phone
 * has room for one pane after the other, even when it has no room for two side by side.
 */
export const StacksWhenNarrow: Story = {
  render: (args) => (
    <div className="w-[420px] border">
      <SplitPane {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" />,
    rail: <Nav />,
    railSide: "start",
    railWidth: "md",
    splitAt: "xl",
    divider: "line",
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>("[data-slot=sp-rail]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=sp-divider]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=sp-content]");
    expect(rail).not.toBeNull();
    expect(rule).not.toBeNull();
    expect(main).not.toBeNull();
    if (!rail || !rule || !main) return;

    const railBox = rail.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // Stacked: the rail is above the main pane, and both have the full width.
    expect(railBox.bottom).toBeLessThanOrEqual(mainBox.top + 0.5);
    expect(mainBox.width).toBeCloseTo(railBox.width, 0);

    // The rule turned with them — a hairline row between the two, not a column beside one.
    expect(ruleBox.height).toBeCloseTo(1, 0);
    expect(ruleBox.width).toBeCloseTo(railBox.width, 0);
    expect(ruleBox.top).toBeGreaterThanOrEqual(railBox.bottom - 0.5);
  },
};
