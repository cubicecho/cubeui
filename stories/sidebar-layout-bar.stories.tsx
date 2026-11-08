import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createLink,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useMatchRoute,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Text } from "react-native";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  Calendar as CompiledCalendar,
  Clock as CompiledClock,
  Monitor as CompiledMonitor,
  Moon as CompiledMoon,
  Search as CompiledSearch,
  Settings as CompiledSettings,
} from "../compiled/icons";
import { AppBarItem as CompiledAppBarItem, Sidebar as CompiledSidebar } from "../compiled/sidebar";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import {
  AppBarItem as NativeAppBarItem,
  Sidebar as NativeSidebar,
} from "../registry/layout/sidebar";
import { SidebarLayout as NativeLayout } from "../registry/layout/split-layout";
import { Button as NativeButton } from "../registry/ui/button";
// The web icon set, as an Expo web build draws it, and as the items here draw their own icons.
import {
  Calendar as NativeCalendar,
  Clock as NativeClock,
  Monitor as NativeMonitor,
  Moon as NativeMoon,
  Search as NativeSearch,
  Settings as NativeSettings,
} from "../registry/ui/icons";

/**
 * What goes in `SidebarLayout`'s bar: `AppBarItem`, the rail's row with only its icon drawn, and
 * the `status` slot, the bar's one line of words.
 *
 * The bar is where every app drew its own links, and what the copies lost is what these check: an
 * icon-only link has a name, the current one is `aria-current="page"`, a count on the row is on
 * the bar too and in the name, and a status line narrows before anything else in the bar moves,
 * wrapping rather than cutting a word off.
 * Both halves are drawn at a phone's width rather than side by side — two 390px bars do not fit
 * beside each other under the breakpoint that draws them.
 */
const meta = {
  title: "RN Parity/SidebarLayout bar",
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "mobile2", isRotated: false } },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** One list of places for the rail and the bar — here only the bar's half of it is drawn. */
const places = [
  { id: "servers", label: "Servers", count: 5, status: { label: "2 failing" } },
  { id: "search", label: "Search", count: 12 },
  { id: "schedule", label: "Schedule", count: "99+" },
  { id: "history", label: "History", count: 3 },
] as const;

/** What each link is called: the label, the status and the count, as the row joins them. */
const names = ["Servers, 2 failing, 5", "Search, 12", "Schedule, 99+", "History, 3"];

const nativeIcons = {
  servers: <NativeMonitor />,
  search: <NativeSearch />,
  schedule: <NativeCalendar />,
  history: <NativeClock />,
};
const compiledIcons = {
  servers: <CompiledMonitor />,
  search: <CompiledSearch />,
  schedule: <CompiledCalendar />,
  history: <CompiledClock />,
};

const STATUS = "3 of 5 servers running";

/** A phone's width and a height to divide, with a hairline so the bar's edges can be seen. */
function Phone({ width, name, children }: { width: number; name: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <p className="px-2 font-semibold text-foreground/60 text-xs uppercase tracking-wide">
        {name} · {width}px
      </p>
      <div
        data-phone={name}
        className="flex h-40 flex-col border border-foreground/10"
        style={{ width, boxSizing: "content-box" }}
      >
        {children}
      </div>
    </section>
  );
}

function Bars({ width, barPosition = "top" }: { width: number; barPosition?: "top" | "bottom" }) {
  return (
    <div className="flex flex-col gap-6 bg-background py-4 text-foreground">
      <Phone width={width} name="react native">
        <NativeLayout
          className="h-full"
          sidebarPosition="start"
          sidebarWidth="auto"
          divider="none"
          sidebarHideBelow="md"
          barPosition={barPosition}
          sidebarSlot={<NativeSidebar label="Native rail" contentSlot={null} />}
          brandSlot={<Text className="font-semibold text-base text-foreground">Router</Text>}
          navSlot={places.map((p) => (
            <NativeAppBarItem
              key={p.id}
              href={`#/${p.id}`}
              label={p.label}
              iconSlot={nativeIcons[p.id]}
              count={p.count}
              active={p.id === "search"}
              {...("status" in p ? { status: p.status } : {})}
            />
          ))}
          navLabel="Native main"
          status={STATUS}
          actionSlot={
            <>
              <NativeButton
                variant="outline"
                size="icon-sm"
                aria-label="Native settings"
                iconSlot={<NativeSettings />}
              />
              <NativeButton
                variant="outline"
                size="icon-sm"
                aria-label="Native theme"
                iconSlot={<NativeMoon />}
              />
            </>
          }
          contentSlot={<Text className="p-4 text-foreground">Native page</Text>}
        />
      </Phone>
      <Phone width={width} name="compiled">
        <CompiledLayout
          className="h-full"
          sidebarPosition="start"
          sidebarWidth="auto"
          divider="none"
          sidebarHideBelow="md"
          barPosition={barPosition}
          sidebarSlot={<CompiledSidebar label="Compiled rail" contentSlot={null} />}
          brandSlot={<span className="font-semibold text-base text-foreground">Router</span>}
          navSlot={places.map((p) => (
            <CompiledAppBarItem
              key={p.id}
              href={`#/${p.id}`}
              label={p.label}
              iconSlot={compiledIcons[p.id]}
              count={p.count}
              active={p.id === "search"}
              {...("status" in p ? { status: p.status } : {})}
            />
          ))}
          navLabel="Compiled main"
          status={STATUS}
          actionSlot={
            <>
              <CompiledButton
                variant="outline"
                size="icon-sm"
                aria-label="Compiled settings"
                iconSlot={<CompiledSettings />}
              />
              <CompiledButton
                variant="outline"
                size="icon-sm"
                aria-label="Compiled theme"
                iconSlot={<CompiledMoon />}
              />
            </>
          }
          contentSlot={<p className="p-4 text-foreground">Compiled page</p>}
        />
      </Phone>
    </div>
  );
}

const slotOf = (el: Element) => el.getAttribute("data-testid") ?? el.getAttribute("data-slot");

/** The bar `SidebarLayout` draws under its breakpoint: an `AppBar`. */
const BAR = '[data-testid="app-bar"], [data-slot="app-bar"]';

function barsOf(canvasElement: HTMLElement) {
  const headers = Array.from(canvasElement.querySelectorAll<HTMLElement>(BAR));
  return headers.map((header) => {
    const part = (slot: string) => {
      const el = Array.from(header.children).find((child) => slotOf(child) === slot);
      if (el instanceof HTMLElement === false) {
        throw new Error(`the bar should draw ${slot}`);
      }
      return el;
    };
    return {
      header,
      brand: part("app-bar-brand"),
      nav: part("app-bar-nav"),
      status: part("app-bar-status"),
      action: part("app-bar-action"),
    };
  });
}

/**
 * The bar the issue asks for, at a phone's 390px: a brand, four places with counts, a status line
 * and two actions.
 */
export const Phone390: Story = {
  render: () => <Bars width={390} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(window.matchMedia("(min-width: 48rem)").matches).toBe(false);

    const bars = barsOf(canvasElement);
    await expect(bars).toHaveLength(2);

    for (const { header, brand, nav, status, action } of bars) {
      await expect(header.getBoundingClientRect().width).toBe(390);

      // Brand, places, status, actions — in that order, the status between the nav and the action.
      await expect(Array.from(header.children).map(slotOf)).toEqual([
        "app-bar-brand",
        "app-bar-nav",
        "app-bar-status",
        "app-bar-action",
      ]);

      // Nothing leaves the bar: every part starts and ends inside it, one after the other.
      const edge = header.getBoundingClientRect();
      let from = edge.left;
      for (const part of [brand, nav, status, action]) {
        const box = part.getBoundingClientRect();
        await expect(box.left).toBeGreaterThanOrEqual(from - 0.5);
        await expect(box.right).toBeLessThanOrEqual(edge.right + 0.5);
        from = box.right;
      }

      // The status is the part that gave way: it holds less than its line needs, and wraps onto
      // more lines rather than cutting a word off (#483), so every word of it is on screen.
      const line = status.firstElementChild;
      if (line instanceof HTMLElement === false) {
        throw new Error("a string status is drawn as text");
      }
      await expect(line).toHaveTextContent(STATUS);
      await expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth);
      await expect(getComputedStyle(line).textOverflow).not.toBe("ellipsis");
      await expect(line.getBoundingClientRect().height).toBeGreaterThan(20);
      await expect(status.getBoundingClientRect().width).toBeGreaterThan(40);
      // Its lines end at the end, by the actions.
      await expect(getComputedStyle(line).textAlign).toBe("end");

      // Past its longest word the status gives no more, and the places scroll for the rest.
      const placesRow = nav.firstElementChild;
      if (placesRow instanceof HTMLElement === false) {
        throw new Error("the places should be in a scroller");
      }
      await expect(placesRow.scrollWidth).toBeGreaterThan(placesRow.clientWidth);

      // One size, one gap: a place is an `icon-sm` action's 36px square, and the places sit 8px
      // apart, as the actions do.
      const [first, second] = Array.from(placesRow.children).map((el) =>
        el.getBoundingClientRect(),
      );
      const buttons = Array.from(action.querySelectorAll("button")).map((el) =>
        el.getBoundingClientRect(),
      );
      if (!first || !second || buttons.length !== 2) {
        throw new Error("the bar should draw its places and its two actions");
      }
      await expect(first.height).toBe(buttons[0]?.height);
      await expect(second.left - first.right).toBe(8);
      await expect((buttons[1]?.left ?? 0) - (buttons[0]?.right ?? 0)).toBe(8);
    }

    for (const half of ["Native", "Compiled"]) {
      const nav = canvas.getByRole("navigation", { name: `${half} main` });
      const links = within(nav).getAllByRole("link");

      // An icon and nothing else, and still a named link — with the status and the count in the
      // name, the way the row joins them.
      await expect(links).toHaveLength(4);
      for (const [index, link] of links.entries()) {
        await expect(link.tagName).toBe("A");
        await expect(link).toHaveAccessibleName(names[index] as string);
        await expect(link).toHaveAttribute("href", `#/${places[index]?.id}`);
        const box = link.getBoundingClientRect();
        await expect([box.width, box.height]).toEqual([36, 36]);
      }

      // A place that is not the current one is in full ink, as a sidebar row is: the tint is
      // what marks the current one, not a fainter icon on the rest.
      const ink = getComputedStyle(links[0] as HTMLElement).color;
      const brand = within(nav.closest("header") as HTMLElement).getByText("Router");
      await expect(ink).toBe(getComputedStyle(brand).color);
      await expect(ink).toBe(getComputedStyle(links[1] as HTMLElement).color);

      // One current place, and it is the one the page is on.
      const current = within(nav).getAllByRole("link", { current: "page" });
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAccessibleName("Search, 12");

      // The count a sidebar row would show is drawn on the bar too.
      await expect(within(links[2] as HTMLElement).getByText("99+")).toBeVisible();
    }

    // The same bar on both halves.
    const [native, compiled] = bars;
    if (!native || !compiled) {
      throw new Error("both halves should render");
    }
    await expect(compiled.header.getBoundingClientRect().height).toBe(
      native.header.getBoundingClientRect().height,
    );
    await expect(compiled.status.getBoundingClientRect().width).toBeCloseTo(
      native.status.getBoundingClientRect().width,
      0,
    );
    const fill = (nav: HTMLElement) =>
      getComputedStyle(within(nav).getByRole("link", { current: "page" })).backgroundColor;
    await expect(fill(compiled.nav)).toBe(fill(native.nav));
    // The current place is filled and the others are not: `selection`, never the hover grey.
    await expect(fill(compiled.nav)).not.toBe(
      getComputedStyle(within(compiled.nav).getAllByRole("link")[0] as HTMLElement).backgroundColor,
    );

    // The label is not drawn, so it is the tooltip: what a sighted user has for the name. The
    // count and the status are marks with no words, so the tooltip says them too (#471), and
    // since it says what the name says, it does not also describe the link.
    for (const half of ["Native", "Compiled"]) {
      const nav = canvas.getByRole("navigation", { name: `${half} main` });
      const servers = within(nav).getByRole("link", { name: "Servers, 2 failing, 5" });
      await userEvent.hover(servers);
      const tip = await screen.findByRole("tooltip");
      await expect(tip).toHaveTextContent("Servers, 2 failing, 5");
      await expect(servers).not.toHaveAttribute("aria-describedby");
      await userEvent.unhover(servers);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    }
  },
};

/**
 * A narrower bar still. The status keeps its longest word and wraps, and the places scroll for
 * the rest: the brand and both actions keep their width and stay inside the bar, which is the
 * whole reason the line has a slot of its own rather than sitting in `actionSlot`.
 */
export const Phone320: Story = {
  render: () => <Bars width={320} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bars = barsOf(canvasElement);
    await expect(bars).toHaveLength(2);

    for (const { header, nav, status, action } of bars) {
      const edge = header.getBoundingClientRect();
      await expect(edge.width).toBe(320);
      // The status is at its floor, its longest word, and every word of it is still drawn; the
      // places give the rest by scrolling. The bar keeps its inset, so the actions stop 16px
      // short of its edge.
      const line = status.firstElementChild;
      if (line instanceof HTMLElement === false) {
        throw new Error("a string status is drawn as text");
      }
      await expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth);
      await expect(status.getBoundingClientRect().width).toBeGreaterThan(30);
      await expect(nav.getBoundingClientRect().width).toBeGreaterThan(36);
      const places = nav.firstElementChild;
      if (places instanceof HTMLElement === false) {
        throw new Error("the places should be in a scroller");
      }
      await expect(places.scrollWidth).toBeGreaterThan(places.clientWidth);
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right - 16 + 0.5);
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right + 0.5);
      await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    }

    for (const half of ["Native", "Compiled"]) {
      await expect(canvas.getByRole("button", { name: `${half} settings` })).toBeVisible();
      await expect(canvas.getByRole("button", { name: `${half} theme` })).toBeVisible();
    }
  },
};

/** The bar's own padding above and below its places, `pt-2` and the 8px over the inset. */
const BAR_PADDING = 8;

/**
 * The bottom safe-area inset the browser reports, read the way the bar reads it: 0 in the
 * `storybook` project, and a home indicator's 34px in the `safe-area` one.
 */
function bottomInset(canvasElement: HTMLElement) {
  const probe = canvasElement.ownerDocument.createElement("div");
  probe.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
  canvasElement.append(probe);
  const inset = Number.parseFloat(getComputedStyle(probe).paddingBottom);
  probe.remove();
  return inset;
}

/**
 * `barPosition="bottom"`: the places leave the bar at the top for one of their own under the page,
 * where a phone's thumb is. The brand, the status and the actions stay where they were.
 *
 * Tagged `safe-area`, so it runs twice: with no inset, and again in the `safe-area` test project
 * as a phone with a home indicator (#341). There the bar takes the inset itself, its places above
 * the indicator and its fill under it to the bottom edge, and the top bar is as it was.
 */
export const BottomBar: Story = {
  tags: ["safe-area"],
  render: () => <Bars width={390} barPosition="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(window.matchMedia("(min-width: 48rem)").matches).toBe(false);
    const inset = bottomInset(canvasElement);

    const heights: number[] = [];
    for (const [half, phoneName] of [
      ["Native", "react native"],
      ["Compiled", "compiled"],
    ] as const) {
      const phone = canvasElement.querySelector<HTMLElement>(`[data-phone="${phoneName}"]`);
      if (phone === null) {
        throw new Error(`the ${phoneName} half should render`);
      }

      // One navigation landmark, and it is the bar along the bottom, not a part of the top one.
      const navs = within(phone).getAllByRole("navigation");
      await expect(navs).toHaveLength(1);
      const bar = canvas.getByRole("navigation", { name: `${half} main` });
      await expect(navs[0]).toBe(bar);
      await expect(slotOf(bar)).toBe("sidebar-layout-bottom-bar");

      // The top bar keeps the brand, the status and the actions, in that order.
      const header = within(phone).getByRole("banner");
      await expect(Array.from(header.children).map(slotOf)).toEqual([
        "app-bar-brand",
        "app-bar-status",
        "app-bar-action",
      ]);
      await expect(within(header).getByText(STATUS)).toBeVisible();
      await expect(canvas.getByRole("button", { name: `${half} settings` })).toBeVisible();

      // Top bar, page, bottom bar: the bar is the full width, under the page, on the bottom edge.
      const content = phone.querySelector<HTMLElement>(
        '[data-testid="sidebar-layout-content"], [data-slot="sidebar-layout-content"]',
      );
      if (content === null) {
        throw new Error("the page should be drawn between the bars");
      }
      const edge = bar.getBoundingClientRect();
      const inner = phone.getBoundingClientRect();
      await expect(edge.width).toBe(390);
      await expect(header.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        content.getBoundingClientRect().top + 0.5,
      );
      await expect(edge.top).toBeGreaterThanOrEqual(content.getBoundingClientRect().bottom - 0.5);
      await expect(edge.bottom).toBeCloseTo(inner.bottom - 1, 0);
      heights.push(edge.height);

      // The bar owns the bottom inset: its padding is the inset plus its own, so the strip under
      // the places is the bar's fill, down to the edge, and not the page behind it.
      const barStyle = getComputedStyle(bar);
      await expect(barStyle.paddingTop).toBe(`${BAR_PADDING}px`);
      await expect(barStyle.paddingBottom).toBe(`${inset + BAR_PADDING}px`);
      await expect(barStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      const strip = canvasElement.ownerDocument.elementFromPoint(edge.left + 1, edge.bottom - 1);
      await expect(strip === bar || bar.contains(strip)).toBe(true);
      // The top bar takes no bottom inset of its own: its padding is the same above and below.
      const headerStyle = getComputedStyle(header);
      await expect(headerStyle.paddingBottom).toBe(headerStyle.paddingTop);

      // The same four places, named and sized as they are at the top, with one current.
      const links = within(bar).getAllByRole("link");
      await expect(links).toHaveLength(4);
      for (const [index, link] of links.entries()) {
        await expect(link).toHaveAccessibleName(names[index] as string);
        const box = link.getBoundingClientRect();
        await expect([box.width, box.height]).toEqual([36, 36]);
        await expect(box.left).toBeGreaterThanOrEqual(edge.left);
        await expect(box.right).toBeLessThanOrEqual(edge.right);
        // Above the home indicator, not under it.
        await expect(box.bottom).toBeLessThanOrEqual(edge.bottom - inset - BAR_PADDING + 0.5);
      }
      const current = within(bar).getAllByRole("link", { current: "page" });
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAccessibleName("Search, 12");

      // Spread over the width rather than bunched at the start: more than the top bar's 8px
      // between two places, and as much room before the first as after the last.
      const [first, second] = links.map((link) => link.getBoundingClientRect());
      const last = links.at(-1)?.getBoundingClientRect();
      if (!first || !second || !last) {
        throw new Error("the bar should hold its places");
      }
      await expect(second.left - first.right).toBeGreaterThan(16);
      await expect(first.left - edge.left).toBeCloseTo(edge.right - last.right, 0);

      // Nothing in the bar is wider than it.
      await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
    }

    // The same bar on both halves, and a page that does not scroll sideways under it.
    await expect(heights[1]).toBe(heights[0]);
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/**
 * A place's tooltip opens above it in the bar along the bottom (#472), where below is off the
 * screen. The web's tooltip turns away from an edge it would cross on its own; a device's is drawn
 * where it is told, and it was told `bottom`. These phones have room under the bar, so a tooltip
 * told `bottom` opens there. In the bar at the top it still opens below.
 */
export const BottomBarTooltipsOpenUp: Story = {
  render: () => <Bars width={390} barPosition="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["Native", "Compiled"] as const) {
      const bar = canvas.getByRole("navigation", { name: `${half} main` });
      const link = within(bar).getByRole("link", { name: "Search, 12" });
      await userEvent.hover(link);
      const tip = (await screen.findByRole("tooltip")).parentElement as HTMLElement;
      await expect({
        half,
        above: tip.getBoundingClientRect().bottom <= link.getBoundingClientRect().top,
      }).toEqual({ half, above: true });
      await userEvent.unhover(link);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    }
  },
};

const CompiledBarLink = createLink(CompiledAppBarItem);
const NativeBarLink = createLink(NativeAppBarItem);

const routes = [
  { to: "/", label: "Servers" },
  { to: "/settings", label: "Settings" },
] as const;

/** Both halves' places as TanStack Router links, each written with `to` and no `href`. */
function RouterBars() {
  const matchRoute = useMatchRoute();
  const active = (to: string) => Boolean(matchRoute({ to, fuzzy: to !== "/" }));
  return (
    <div className="flex flex-col gap-6 bg-background py-4 text-foreground">
      <Phone width={390} name="react native">
        <NativeLayout
          className="h-full"
          sidebarHideBelow="md"
          navSlot={routes.map(({ to, label }) => (
            <NativeBarLink
              key={to}
              to={to}
              label={label}
              iconSlot={to === "/" ? <NativeMonitor /> : <NativeSettings />}
              active={active(to)}
            />
          ))}
          navLabel="Native main"
          contentSlot={<Text className="p-4 text-foreground">Native page</Text>}
        />
      </Phone>
      <Phone width={390} name="compiled">
        <CompiledLayout
          className="h-full"
          sidebarHideBelow="md"
          navSlot={routes.map(({ to, label }) => (
            <CompiledBarLink
              key={to}
              to={to}
              label={label}
              iconSlot={to === "/" ? <CompiledMonitor /> : <CompiledSettings />}
              active={active(to)}
            />
          ))}
          navLabel="Compiled main"
          contentSlot={<p className="p-4 text-foreground">Compiled page</p>}
        />
      </Phone>
    </div>
  );
}

/** A memory router of its own per render, so the story never touches the page's URL. */
function RouterFrame() {
  const [router] = useState(() => {
    const root = createRootRoute({ component: RouterBars });
    const routeTree = root.addChildren(
      routes.map(({ to }) => createRoute({ getParentRoute: () => root, path: to })),
    );
    return createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
  });
  return <RouterProvider router={router} />;
}

/**
 * The item wrapped by TanStack's `createLink`, as the sidebar's row is — the router renders it
 * with the `href` it builds from `to`, through the tooltip's trigger, so the bar's place is a real
 * `<a href>` on both halves and a click is the router's.
 */
export const RouterLink: Story = {
  render: () => <RouterFrame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const compiled = await canvas.findByRole("navigation", { name: "Compiled main" });
    const native = canvas.getByRole("navigation", { name: "Native main" });

    for (const nav of [native, compiled]) {
      const bar = within(nav);
      // The `href` the router built from `to`, on an `<a>`, though no call site passed one.
      const servers = bar.getByRole("link", { name: "Servers" });
      await expect(servers.tagName).toBe("A");
      await expect(servers).toHaveAttribute("href", "/");
      await expect(servers).toHaveAttribute("aria-current", "page");
      await expect(bar.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "href",
        "/settings",
      );
    }

    // A click is the router's, not the browser's: it moves the memory history, and the place the
    // page is now on is the current one on both halves.
    await userEvent.click(within(compiled).getByRole("link", { name: "Settings" }));
    for (const nav of [native, compiled]) {
      await expect(
        await within(nav).findByRole("link", { name: "Settings", current: "page" }),
      ).toBeInTheDocument();
      await expect(within(nav).getByRole("link", { name: "Servers" })).not.toHaveAttribute(
        "aria-current",
      );
    }
  },
};
