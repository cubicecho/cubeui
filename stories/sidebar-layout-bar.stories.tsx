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
import { BarNavItem as CompiledBarNavItem, Sidebar as CompiledSidebar } from "../compiled/sidebar";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import {
  BarNavItem as NativeBarNavItem,
  Sidebar as NativeSidebar,
} from "../registry/layout/sidebar";
import { SidebarLayout as NativeLayout } from "../registry/layout/split-layout";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Calendar as NativeCalendar,
  Clock as NativeClock,
  Monitor as NativeMonitor,
  Moon as NativeMoon,
  Search as NativeSearch,
  Settings as NativeSettings,
} from "../registry/ui/icons";

/**
 * What goes in `SidebarLayout`'s bar: `BarNavItem`, the rail's row with only its icon drawn, and
 * the `status` slot, the bar's one line of words.
 *
 * The bar is where every app drew its own links, and what the copies lost is what these check: an
 * icon-only link has a name, the current one is `aria-current="page"`, a count on the row is on
 * the bar too and in the name, and a status line shortens before anything else in the bar moves.
 * Both halves are drawn at a phone's width rather than side by side — two 390px bars do not fit
 * beside each other under the breakpoint that draws them.
 */
const meta = {
  title: "Stage 0/SidebarLayout bar",
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
      <p className="px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {name} · {width}px
      </p>
      <div
        data-phone={name}
        className="flex h-40 flex-col border border-border"
        style={{ width, boxSizing: "content-box" }}
      >
        {children}
      </div>
    </section>
  );
}

function Bars({ width }: { width: number }) {
  return (
    <div className="flex flex-col gap-6 bg-background py-4 text-foreground">
      <Phone width={width} name="react native">
        <NativeLayout
          className="h-full"
          sidebarPosition="start"
          sidebarWidth="auto"
          divider="none"
          sidebarHideBelow="md"
          sidebar={<NativeSidebar label="Native rail" content={null} />}
          brand={<Text className="font-semibold text-base text-foreground">Router</Text>}
          nav={places.map((p) => (
            <NativeBarNavItem
              key={p.id}
              href={`#/${p.id}`}
              label={p.label}
              icon={nativeIcons[p.id]}
              count={p.count}
              active={p.id === "search"}
              {...("status" in p ? { status: p.status } : {})}
            />
          ))}
          navLabel="Native main"
          status={STATUS}
          action={
            <>
              <NativeButton variant="ghost" size="icon-sm" aria-label="Native settings">
                <NativeSettings />
              </NativeButton>
              <NativeButton variant="ghost" size="icon-sm" aria-label="Native theme">
                <NativeMoon />
              </NativeButton>
            </>
          }
          content={<Text className="p-4 text-foreground">Native page</Text>}
        />
      </Phone>
      <Phone width={width} name="compiled">
        <CompiledLayout
          className="h-full"
          sidebarPosition="start"
          sidebarWidth="auto"
          divider="none"
          sidebarHideBelow="md"
          sidebar={<CompiledSidebar label="Compiled rail" content={null} />}
          brand={<span className="font-semibold text-base text-foreground">Router</span>}
          nav={places.map((p) => (
            <CompiledBarNavItem
              key={p.id}
              href={`#/${p.id}`}
              label={p.label}
              icon={compiledIcons[p.id]}
              count={p.count}
              active={p.id === "search"}
              {...("status" in p ? { status: p.status } : {})}
            />
          ))}
          navLabel="Compiled main"
          status={STATUS}
          action={
            <>
              <CompiledButton variant="ghost" size="icon-sm" aria-label="Compiled settings">
                <CompiledSettings />
              </CompiledButton>
              <CompiledButton variant="ghost" size="icon-sm" aria-label="Compiled theme">
                <CompiledMoon />
              </CompiledButton>
            </>
          }
          content={<p className="p-4 text-foreground">Compiled page</p>}
        />
      </Phone>
    </div>
  );
}

const slotOf = (el: Element) => el.getAttribute("data-testid") ?? el.getAttribute("data-slot");

function barsOf(canvasElement: HTMLElement) {
  const headers = Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      '[data-testid="sidebar-layout-header"], [data-slot="sidebar-layout-header"]',
    ),
  );
  return headers.map((header) => {
    const part = (slot: string) => {
      const el = Array.from(header.children).find((child) => slotOf(child) === slot);
      if (!(el instanceof HTMLElement)) throw new Error(`the bar should draw ${slot}`);
      return el;
    };
    return {
      header,
      brand: part("sidebar-layout-brand"),
      nav: part("sidebar-layout-nav"),
      status: part("sidebar-layout-status"),
      action: part("sidebar-layout-action"),
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
        "sidebar-layout-brand",
        "sidebar-layout-nav",
        "sidebar-layout-status",
        "sidebar-layout-action",
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

      // Four places at their full size: four 32px items and three 4px gaps.
      await expect(nav.getBoundingClientRect().width).toBe(140);

      // The status is the part that gave way: it holds less than its line needs, and says so with
      // an ellipsis rather than by wrapping or by pushing the actions out.
      const line = status.firstElementChild;
      if (!(line instanceof HTMLElement)) throw new Error("a string status is drawn as text");
      await expect(line).toHaveTextContent(STATUS);
      await expect(line.scrollWidth).toBeGreaterThan(line.clientWidth);
      await expect(getComputedStyle(line).textOverflow).toBe("ellipsis");
      await expect(status.getBoundingClientRect().width).toBeGreaterThan(40);
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
        await expect([box.width, box.height]).toEqual([32, 32]);
      }

      // One current place, and it is the one the page is on.
      const current = within(nav).getAllByRole("link", { current: "page" });
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAccessibleName("Search, 12");

      // The count a sidebar row would show is drawn on the bar too.
      await expect(within(links[2] as HTMLElement).getByText("99+")).toBeVisible();
    }

    // The same bar on both halves.
    const [native, compiled] = bars;
    if (!native || !compiled) throw new Error("both halves should render");
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

    // The label is not drawn, so it is the tooltip: what a sighted user has for the name.
    for (const half of ["Native", "Compiled"]) {
      const nav = canvas.getByRole("navigation", { name: `${half} main` });
      const servers = within(nav).getByRole("link", { name: "Servers, 2 failing, 5" });
      await userEvent.hover(servers);
      const tip = await screen.findByRole("tooltip");
      await expect(tip).toHaveTextContent("Servers");
      await userEvent.unhover(servers);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    }
  },
};

/**
 * A narrower bar still: the status is what is lost. The brand, the four places and both actions
 * keep their width and stay inside the bar, which is the whole reason the line has a slot of its
 * own rather than sitting in `action`.
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
      await expect(nav.getBoundingClientRect().width).toBe(140);
      await expect(status.getBoundingClientRect().width).toBeLessThan(40);
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right + 0.5);
      await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    }

    for (const half of ["Native", "Compiled"]) {
      await expect(canvas.getByRole("button", { name: `${half} settings` })).toBeVisible();
      await expect(canvas.getByRole("button", { name: `${half} theme` })).toBeVisible();
    }
  },
};

const CompiledBarLink = createLink(CompiledBarNavItem);
const NativeBarLink = createLink(NativeBarNavItem);

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
          nav={routes.map(({ to, label }) => (
            <NativeBarLink
              key={to}
              to={to}
              label={label}
              icon={to === "/" ? <NativeMonitor /> : <NativeSettings />}
              active={active(to)}
            />
          ))}
          navLabel="Native main"
          content={<Text className="p-4 text-foreground">Native page</Text>}
        />
      </Phone>
      <Phone width={390} name="compiled">
        <CompiledLayout
          className="h-full"
          sidebarHideBelow="md"
          nav={routes.map(({ to, label }) => (
            <CompiledBarLink
              key={to}
              to={to}
              label={label}
              icon={to === "/" ? <CompiledMonitor /> : <CompiledSettings />}
              active={active(to)}
            />
          ))}
          navLabel="Compiled main"
          content={<p className="p-4 text-foreground">Compiled page</p>}
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
