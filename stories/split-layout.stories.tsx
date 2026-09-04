import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { StickyHeaderContentFooter } from "@/registry/new-york/layout/header-content-footer";
import {
  SidebarLayout,
  SplitLayout,
  type SplitWidth,
} from "@/registry/new-york/layout/split-layout";

const meta = {
  title: "Layout/SplitLayout",
  component: SplitLayout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SplitLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The preset, whose stories are the bulk of this file — most splits are not even ones. */
type SidebarStory = StoryObj<typeof SidebarLayout>;

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

const RAIL_WIDTHS: SplitWidth[] = [
  "auto",
  "sm",
  "md",
  "lg",
  "fifth",
  "two-fifths",
  "half",
  "two-thirds",
];

/**
 * The base: two panes as equals, and no width given to either.
 *
 * Numbered slots rather than named ones, because neither a role pair (`content`/`sidebar`) nor a
 * side pair (`left`/`right`) is true here — the first is a lie about an even split, the second a
 * lie the moment the panes stack or the page is read right-to-left.
 */
export const Default: Story = {
  render: (args) => (
    <div className="w-[600px] p-8">
      <SplitLayout {...args} />
    </div>
  ),
  args: {
    first: <Surface label="First" />,
    second: <Surface label="Second" />,
    stackBelow: "never",
  },
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-first]");
    const second = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-second]");
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (!first || !second) return;

    // Neither width set is an even split. A component whose panes have no ranking should not
    // invent one in its defaults.
    expect(first.getBoundingClientRect().width).toBeCloseTo(
      second.getBoundingClientRect().width,
      0,
    );
  },
};

/**
 * Either pane can carry the width, and the same rung on the other one is its mirror image.
 *
 * Two props rather than one because a split has no main pane to measure from — `TRACKS` reads
 * `[the sized pane, the pane that takes the rest]`, so `secondWidth` is that row read backwards.
 * The union type is what stops both being set at once, since the pair would then have to disagree
 * about the leftover and one of them would silently lose.
 */
export const EitherPaneCanCarryTheWidth: Story = {
  // Written out rather than spread, because the union is the point: `{...args}` carries both
  // width keys as optional, and the compiler cannot know which arm of the union that lands in.
  render: ({ first, second, stackBelow }) => (
    <div className="w-[600px] space-y-6 p-8">
      <div data-testid="sized-first">
        <p className="mb-1 font-mono text-muted-foreground text-xs">firstWidth="two-thirds"</p>
        <SplitLayout
          first={first}
          second={second}
          stackBelow={stackBelow}
          firstWidth="two-thirds"
        />
      </div>
      <div data-testid="sized-second">
        <p className="mb-1 font-mono text-muted-foreground text-xs">secondWidth="two-thirds"</p>
        <SplitLayout
          first={first}
          second={second}
          stackBelow={stackBelow}
          secondWidth="two-thirds"
        />
      </div>
    </div>
  ),
  args: {
    first: <Surface label="First" />,
    second: <Surface label="Second" />,
    stackBelow: "never",
  },
  play: async ({ canvas }) => {
    const widths = (testId: string) => {
      const scope = canvas.getByTestId(testId);
      const cell = (slot: string) =>
        scope
          .querySelector<HTMLElement>(`[data-slot=split-layout-${slot}]`)
          ?.getBoundingClientRect().width ?? 0;
      return [cell("first"), cell("second")] as const;
    };

    const [firstSized, restOfIt] = widths("sized-first");
    const [restOfIt2, secondSized] = widths("sized-second");

    // The sized pane is twice the other, whichever pane it is.
    expect(firstSized).toBeCloseTo(restOfIt * 2, -1);
    expect(secondSized).toBeCloseTo(restOfIt2 * 2, -1);
    // And naming the width on the far pane is the same split, reversed.
    expect(firstSized).toBeCloseTo(secondSized, 0);
  },
};

/** The preset: a main surface, a sidebar beside it, and a gap between them. */
export const Sidebar: SidebarStory = {
  render: (args) => (
    <div className="p-8">
      <SidebarLayout {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" tall />,
    sidebar: <Surface label="Sidebar" />,
    stackBelow: "never",
  },
};

/**
 * Every rung of the width scale, so the widths it replaces — `w-56`, `w-72 lg:w-80`, `lg:w-52`,
 * `w-14 lg:w-56`, `2fr`, `minmax(16rem,20rem)`, `60%` — can be read against each other rather
 * than one screen at a time. Fixed rungs size an inspector by its contents; proportional rungs
 * size a second working surface by the window.
 */
export const WidthScale: SidebarStory = {
  render: (args) => (
    <div className="space-y-6 p-8">
      {RAIL_WIDTHS.map((sidebarWidth) => (
        <div key={sidebarWidth}>
          <p className="mb-1 font-mono text-muted-foreground text-xs">{sidebarWidth}</p>
          <SidebarLayout {...args} sidebarWidth={sidebarWidth} />
        </div>
      ))}
    </div>
  ),
  args: {
    content: <Surface label="Main" />,
    sidebar: <Surface label="Sidebar" />,
    stackBelow: "never",
  },
};

/** The sidebar can lead. Stacked, it keeps this reading order rather than jumping below. */
export const SidebarAtStart: SidebarStory = {
  render: (args) => (
    <div className="p-8">
      <SidebarLayout {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" tall />,
    sidebar: <Surface label="Sidebar (start)" />,
    sidebarPosition: "start",
    sidebarWidth: "md",
    stackBelow: "never",
  },
};

/**
 * Collapse, and rule 5 with it. There is no `collapsed` prop: a closed sidebar is
 * `sidebar={undefined}`, and what that has to produce is one full-width column — not an empty cell,
 * not a gap still spent on the pane that is not there, and not a divider with one side.
 */
export const NoSidebarIsOneColumn: SidebarStory = {
  render: (args) => (
    <div className="w-[600px] p-0">
      <SidebarLayout {...args} />
    </div>
  ),
  args: { content: <Surface label="Main, full width" />, sidebarWidth: "md", divider: "line" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-first]");
    expect(root).not.toBeNull();
    expect(main).not.toBeNull();
    if (!root || !main) return;

    // Neither the cell nor the rule is drawn — even though `divider="line"` was asked for, since
    // there is nothing on the far side of it to divide.
    expect(canvasElement.querySelector("[data-slot=split-layout-second]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=split-layout-divider]")).toBeNull();

    // And the main pane has the whole width, with no gap spent on the absent sidebar.
    expect(main.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width);
  },
};

/**
 * The app shell: a nav sidebar flush against a working surface, with a hairline between them.
 *
 * The rule is a grid track rather than a `border-r` on the sidebar, which is what every hand-written
 * one uses. The border is right until the layout stacks, at which point it is a line down one
 * side of the screen instead of a line between the two panes.
 */
export const DividedByALine: SidebarStory = {
  render: (args) => (
    <div className="h-[300px] w-[600px] border">
      <SidebarLayout {...args} className="h-full" />
    </div>
  ),
  args: {
    content: <Surface label="Working surface" />,
    sidebar: <Nav />,
    sidebarPosition: "start",
    sidebarWidth: "sm",
    stackBelow: "never",
    divider: "line",
  },
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-first]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-divider]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-second]");
    expect(sidebar).not.toBeNull();
    expect(rule).not.toBeNull();
    expect(main).not.toBeNull();
    if (!sidebar || !rule || !main) return;

    const sidebarBox = sidebar.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // A hairline, and one that actually sits between the two panes rather than beside one.
    expect(ruleBox.width).toBeCloseTo(1, 0);
    expect(ruleBox.left).toBeGreaterThanOrEqual(sidebarBox.right - 0.5);
    expect(ruleBox.right).toBeLessThanOrEqual(mainBox.left + 0.5);
    // Flush: `line` spends no gap, so the three tracks meet.
    expect(mainBox.left - sidebarBox.right).toBeCloseTo(1, 0);
    // It runs the height of the split, not the height of its own content.
    expect(ruleBox.height).toBeCloseTo(sidebarBox.height, 0);
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
export const DividerIsNotAControl: SidebarStory = {
  render: (args) => (
    <div className="h-[300px] w-[600px] border">
      <SidebarLayout {...args} className="h-full" />
    </div>
  ),
  args: {
    sidebarPosition: "start",
    sidebarWidth: "sm",
    stackBelow: "never",
    divider: "line",
    sidebar: <Nav />,
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
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-divider]");
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
    const body = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-content]",
    );
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
 * main pane must scroll inside its own cell instead of growing its track and shoving the sidebar off
 * the screen. Remove `min-w-0` from the cell, or the `minmax(0,…)` from the track, and this story
 * is how you find out: half the panes this component replaces are missing one or the other.
 */
export const WideContentKeepsItsFloor: SidebarStory = {
  render: (args) => (
    <div className="w-[800px] border">
      <SidebarLayout {...args} />
    </div>
  ),
  args: {
    sidebarWidth: "sm",
    stackBelow: "never",
    sidebar: <Surface label="Sidebar stays put" />,
    content: (
      <div className="overflow-x-auto rounded border bg-card">
        <div className="w-[2000px] px-4 py-3 text-sm">A single very wide child.</div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout]");
    const sidebar = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-second]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-first]");
    expect(root).not.toBeNull();
    expect(sidebar).not.toBeNull();
    expect(main).not.toBeNull();
    if (!root || !sidebar || !main) return;

    const rootBox = root.getBoundingClientRect();
    const sidebarBox = sidebar.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // The split stayed inside its 800px box instead of being grown by the 2000px child.
    expect(rootBox.width).toBeLessThanOrEqual(800);
    // The `sm` rung is 20rem, and the wide child did not take a pixel of it.
    expect(sidebarBox.width).toBeCloseTo(320, 0);
    // The sidebar is still on screen — the whole point of the floor — and the main pane took the
    // remainder rather than 2000px: the split's width, less the sidebar, less the `gap-4`.
    expect(sidebarBox.right).toBeLessThanOrEqual(rootBox.right + 0.5);
    expect(mainBox.width).toBeCloseTo(rootBox.width - sidebarBox.width - 16, 0);
  },
};

/**
 * Below `stackBelow` the two stack, keeping their reading order, and the rule turns with them: a row
 * between the panes rather than a line down one side. This is the narrow-width answer — a phone
 * has room for one pane after the other, even when it has no room for two side by side.
 */
export const StacksWhenNarrow: SidebarStory = {
  render: (args) => (
    <div className="w-[420px] border">
      <SidebarLayout {...args} />
    </div>
  ),
  args: {
    content: <Surface label="Main" />,
    sidebar: <Nav />,
    sidebarPosition: "start",
    sidebarWidth: "md",
    stackBelow: "xl",
    divider: "line",
  },
  play: async ({ canvasElement }) => {
    const sidebar = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-first]");
    const rule = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-divider]");
    const main = canvasElement.querySelector<HTMLElement>("[data-slot=split-layout-second]");
    expect(sidebar).not.toBeNull();
    expect(rule).not.toBeNull();
    expect(main).not.toBeNull();
    if (!sidebar || !rule || !main) return;

    const sidebarBox = sidebar.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();

    // Stacked: the sidebar is above the main pane, and both have the full width.
    expect(sidebarBox.bottom).toBeLessThanOrEqual(mainBox.top + 0.5);
    expect(mainBox.width).toBeCloseTo(sidebarBox.width, 0);

    // The rule turned with them — a hairline row between the two, not a column beside one.
    expect(ruleBox.height).toBeCloseTo(1, 0);
    expect(ruleBox.width).toBeCloseTo(sidebarBox.width, 0);
    expect(ruleBox.top).toBeGreaterThanOrEqual(sidebarBox.bottom - 0.5);
  },
};
