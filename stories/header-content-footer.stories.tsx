import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  HeaderContentFooter,
  StickyHeaderContentFooter,
} from "@/registry/new-york/layout/header-content-footer";

const meta = {
  title: "Layout/HeaderContentFooter",
  component: HeaderContentFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HeaderContentFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = () => (
  <div className="border-b px-4 py-3">
    <h1 className="font-semibold text-lg">Vendors</h1>
    <p className="text-muted-foreground text-sm">Suppliers inventory is purchased from.</p>
  </div>
);

const Footer = () => (
  <div className="border-t px-4 py-3 text-muted-foreground text-sm">Page 1 of 12</div>
);

const Rows = ({ count = 40 }: { count?: number }) => (
  <ul className="divide-y">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <li key={n} className="px-4 py-3 text-sm">
        Row {n}
      </li>
    ))}
  </ul>
);

/** The plain chassis: no scroll, so the whole thing is as tall as what is in it. */
export const Default: Story = {
  args: { header: <Header />, footer: <Footer />, content: <Rows count={8} /> },
};

/**
 * Rule 5 — an absent slot draws nothing. Not an empty wrapper that spends the gap, and not a
 * grid row the body then auto-places into. Nothing.
 */
export const NoChrome: Story = {
  args: { content: <Rows count={5} /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=hcf-header]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=hcf-footer]")).toBeNull();
  },
};

/**
 * The one every consuming app gets wrong: sticky needs an ancestor height to divide. Given one,
 * the body scrolls and the chrome stays. This story is the documentation of that requirement.
 */
export const Sticky: StoryObj<typeof StickyHeaderContentFooter> = {
  render: (args) => (
    <div className="h-[400px] border">
      <StickyHeaderContentFooter {...args} />
    </div>
  ),
  args: { header: <Header />, footer: <Footer />, content: <Rows count={40} /> },
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector<HTMLElement>("[data-slot=hcf-content]");
    expect(body).not.toBeNull();
    if (!body) return;

    // The body overflows and owns the scroll — not the window, not the chassis.
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(getComputedStyle(body).overflowY).toBe("auto");

    // The chrome does not move when it scrolls.
    const header = canvasElement.querySelector<HTMLElement>("[data-slot=hcf-header]");
    const before = header?.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await new Promise((r) => requestAnimationFrame(r));
    expect(header?.getBoundingClientRect().top).toBe(before);
  },
};

/**
 * Rule 4 — the floors. One wide child must scroll inside the body rather than grow the chassis
 * and push the chrome off the screen. Without `min-w-0` this story fails, which is the point.
 */
export const WideContentKeepsItsFloor: StoryObj<typeof StickyHeaderContentFooter> = {
  render: (args) => (
    <div className="h-[400px] w-[600px] border">
      <StickyHeaderContentFooter {...args} />
    </div>
  ),
  args: {
    header: <Header />,
    content: (
      <div className="overflow-x-auto">
        <div className="w-[2000px] px-4 py-3 text-sm">A single very wide child.</div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const chassis = canvasElement.querySelector<HTMLElement>("[data-slot=header-content-footer]");
    const header = canvasElement.querySelector<HTMLElement>("[data-slot=hcf-header]");
    expect(chassis).not.toBeNull();
    if (!chassis || !header) return;

    // The chassis stayed inside its 600px box instead of being grown by the 2000px child.
    expect(chassis.clientWidth).toBeLessThanOrEqual(600);
    // And the header is still on screen, which is what the floor is protecting.
    expect(header.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      chassis.getBoundingClientRect().left - 1,
    );
  },
};

/** `width="page"` caps and centres every slot on one column so the title sits above the rows. */
export const PageWidth: Story = {
  args: {
    width: "page",
    header: <Header />,
    footer: <Footer />,
    content: <Rows count={10} />,
  },
};
