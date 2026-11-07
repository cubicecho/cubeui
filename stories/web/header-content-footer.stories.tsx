import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { HeaderContentFooter } from "@/components/header-content-footer";

const meta = {
  title: "Layout/HeaderContentFooter",
  component: HeaderContentFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HeaderContentFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const Header = () => (
  <div className="border-b px-4 py-3">
    <h1 className="font-semibold text-lg">Workspaces</h1>
    <p className="text-foreground/60 text-sm">Each one exposes the servers you choose.</p>
  </div>
);

const Footer = () => (
  <div className="border-t px-4 py-3 text-foreground/60 text-sm">Page 1 of 12</div>
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
  args: { headerSlot: <Header />, footerSlot: <Footer />, contentSlot: <Rows count={8} /> },
};

/**
 * Rule 5 — an absent slot draws nothing. Not an empty wrapper that spends the gap, and not a
 * grid row the body then auto-places into. Nothing.
 */
export const NoChrome: Story = {
  args: { contentSlot: <Rows count={5} /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=header-content-footer-header]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=header-content-footer-footer]")).toBeNull();
  },
};

/**
 * The one every consuming app gets wrong: sticky needs an ancestor height to divide. Given one,
 * the body scrolls and the chrome stays. This story is the documentation of that requirement.
 */
export const Sticky: StoryObj<typeof HeaderContentFooter> = {
  render: (args) => (
    <div className="h-[400px] border">
      <HeaderContentFooter scroll className="h-full" {...args} />
    </div>
  ),
  args: { headerSlot: <Header />, footerSlot: <Footer />, contentSlot: <Rows count={40} /> },
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-content]",
    );
    expect(body).not.toBeNull();
    if (!body) {
      return;
    }

    // The body overflows and owns the scroll — not the window, not the chassis.
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(getComputedStyle(body).overflowY).toBe("auto");

    // The chrome does not move when it scrolls.
    const header = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-header]",
    );
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
export const WideContentKeepsItsFloor: StoryObj<typeof HeaderContentFooter> = {
  render: (args) => (
    <div className="h-[400px] w-[600px] border">
      <HeaderContentFooter scroll className="h-full" {...args} />
    </div>
  ),
  args: {
    headerSlot: <Header />,
    contentSlot: (
      <div className="overflow-x-auto">
        <div className="w-[2000px] px-4 py-3 text-sm">A single very wide child.</div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const chassis = canvasElement.querySelector<HTMLElement>("[data-slot=header-content-footer]");
    const header = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-header]",
    );
    expect(chassis).not.toBeNull();
    if (!chassis || !header) {
      return;
    }

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
    headerSlot: <Header />,
    footerSlot: <Footer />,
    contentSlot: <Rows count={10} />,
  },
};

/** The chassis's parts, by `data-slot`. */
function partsOf(canvasElement: HTMLElement) {
  const part = (slot: string) => {
    const el = canvasElement.querySelector<HTMLElement>(`[data-slot=${slot}]`);
    if (el === null) {
      throw new Error(`the chassis should draw ${slot}`);
    }
    return el;
  };
  return {
    chassis: part("header-content-footer"),
    header: part("header-content-footer-header"),
    scroller: part("header-content-footer-content"),
    column: part("header-content-footer-column"),
  };
}

/** Wider than the reading column, so the scroller and the column are told apart. */
const AREA = 1000;
const PROSE = 768;
/** A scrollbar's width, for the run's browser, which draws none. */
const SCROLLBAR = 20;

/**
 * With `width` and `scroll`, the column is inside the scroller and the scroller runs the full
 * width, so the scrollbar and the focus line are at the edge of the area, not floating at the
 * column's (#451). The column still sits under the header's. A scrollbar takes its width out of
 * the box it scrolls, so the column is placed by the full width, which `useOverflows` writes to the
 * scroller as `--scrollbar-width`. This run's browser draws no scrollbar, so the play also holds
 * the column to one that a forced `--scrollbar-width` says is there.
 */
export const ScrollerRunsTheFullWidth: StoryObj<typeof HeaderContentFooter> = {
  render: (args) => (
    <div className="h-[400px] border" style={{ width: AREA, boxSizing: "content-box" }}>
      <HeaderContentFooter scroll className="h-full" {...args} />
    </div>
  ),
  args: { width: "prose", headerSlot: <Header />, contentSlot: <Rows count={40} /> },
  play: async ({ canvasElement }) => {
    const { chassis, header, scroller, column } = partsOf(canvasElement);
    const area = chassis.getBoundingClientRect();
    await expect(scroller.getBoundingClientRect().left).toBe(area.left);
    await expect(scroller.getBoundingClientRect().width).toBe(area.width);
    await expect(column.parentElement).toBe(scroller);
    await expect(column.getBoundingClientRect().width).toBe(PROSE);
    await expect(column.getBoundingClientRect().left).toBe(header.getBoundingClientRect().left);
    await expect(getComputedStyle(scroller).getPropertyValue("--scrollbar-width")).toBe(
      `${scroller.offsetWidth - scroller.clientWidth}px`,
    );

    // A scrollbar of SCROLLBAR pixels: the column keeps the header's start and stops short of it.
    const forced = document.createElement("style");
    forced.textContent = `[data-slot=header-content-footer-content] { --scrollbar-width: ${SCROLLBAR}px !important; padding-right: ${SCROLLBAR}px; }`;
    document.head.append(forced);
    try {
      await expect(column.getBoundingClientRect().left).toBe(header.getBoundingClientRect().left);
      await expect(column.getBoundingClientRect().width).toBe(PROSE);
    } finally {
      forced.remove();
    }
  },
};

function Growing() {
  const [count, setCount] = useState(2);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="self-start rounded-md border px-3 py-1 text-sm"
        onClick={() => setCount(40)}
      >
        Add rows
      </button>
      <div className="h-[300px] border">
        <HeaderContentFooter
          scroll
          className="h-full"
          headerSlot={<Header />}
          // Each row a child of the body itself, so the rows that arrive are new children of the
          // scroller rather than a list inside it that grows.
          contentSlot={Array.from({ length: count }, (_, i) => `Row ${i + 1}`).map((row) => (
            <p key={row} className="px-4 py-3 text-sm">
              {row}
            </p>
          ))}
        />
      </div>
    </div>
  );
}

/**
 * The body is a tab stop only while it has something to scroll, as a `Table` is: a body that fits
 * was a stray stop in every page's tab order, and the first thing a dialog focused on opening. Rows
 * that arrive later make it one.
 */
export const TabStopOnlyWhileItOverflows: Story = {
  args: { contentSlot: null },
  render: () => <Growing />,
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-content]",
    );
    if (scroller === null) {
      throw new Error("the chassis should draw its body");
    }
    await expect(scroller.scrollHeight).toBeLessThanOrEqual(scroller.clientHeight);
    await expect(scroller.hasAttribute("tabindex")).toBe(false);

    await userEvent.click(within(canvasElement).getByRole("button", { name: "Add rows" }));
    await waitFor(() => expect(scroller.getAttribute("tabindex")).toBe("0"));
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
  },
};
