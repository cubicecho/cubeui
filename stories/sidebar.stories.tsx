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
import { expect, fn, userEvent, within } from "storybook/test";
import { ArrowRight as CompiledArrowRight, Settings as CompiledSettings } from "../compiled/icons";
import { QueryState as CompiledQueryState } from "../compiled/query-state";
import {
  SidebarNavItem as CompiledNavItem,
  SidebarSection as CompiledSection,
  Sidebar as CompiledSidebar,
} from "../compiled/sidebar";
import { QueryState as NativeQueryState } from "../registry/layout/query-state";
import {
  SidebarNavItem as NativeNavItem,
  SidebarSection as NativeSection,
  Sidebar as NativeSidebar,
} from "../registry/layout/sidebar";
import { ArrowRight as NativeArrowRight, Settings as NativeSettings } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `sidebar` is the first layout whose rows are links, so these stories are what say the one source
 * gives the DOM a navigation column rather than a stack of boxes: an `<aside>` named by its label,
 * a list named by its section title with one item per row, a real `<a href>` per row, and
 * `aria-current="page"` on the row for the page on screen — on both halves.
 */
const meta = { title: "Stage 0/Sidebar" } satisfies Meta;
export default meta;
type Story = StoryObj;

const projects = [
  { id: "inbox", name: "Inbox", count: 12 },
  { id: "launch", name: "Launch plan for the spring release, second draft", count: 3 },
  { id: "garden", name: "Garden" },
];

/** A frame with a height to divide, which a sticky chassis needs before anything scrolls. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-96">{children}</div>;
}

const brand = (text: string) => (
  <Text className="font-semibold text-sidebar-foreground">{text}</Text>
);

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native sidebar"
            header={brand("Telos")}
            content={
              <NativeSection
                title="Projects"
                content={projects.map((p) => (
                  <NativeNavItem
                    key={p.id}
                    href={`#/projects/${p.id}`}
                    label={p.name}
                    active={p.id === "launch"}
                    {...(p.count === undefined ? {} : { count: p.count })}
                  />
                ))}
              />
            }
            footer={<NativeNavItem href="#/settings" label="Settings" />}
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled sidebar"
            header={<span className="font-semibold text-sidebar-foreground">Telos</span>}
            content={
              <CompiledSection
                title="Projects"
                content={projects.map((p) => (
                  <CompiledNavItem
                    key={p.id}
                    href={`#/projects/${p.id}`}
                    label={p.name}
                    active={p.id === "launch"}
                    {...(p.count === undefined ? {} : { count: p.count })}
                  />
                ))}
              />
            }
            footer={<CompiledNavItem href="#/settings" label="Settings" />}
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The root is a complementary landmark named by `label` — an `<aside>` on both halves.
    const native = canvas.getByRole("complementary", { name: "Native sidebar" });
    const compiled = canvas.getByRole("complementary", { name: "Compiled sidebar" });
    await expect(compiled.tagName).toBe("ASIDE");

    for (const half of [native, compiled]) {
      const side = within(half);

      // The rows are a list named by the section title, one item per row.
      const list = side.getByRole("list", { name: "Projects" });
      await expect(list.tagName).toBe("UL");
      await expect(within(list).getAllByRole("listitem")).toHaveLength(3);
      await expect(side.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();

      // Every row is a link with a real href, and exactly one is the current page.
      const current = side.getByRole("link", { current: "page" });
      await expect(current).toHaveAccessibleName(/Launch plan/);
      await expect(current.tagName).toBe("A");
      await expect(current.getAttribute("href")).toBe("#/projects/launch");
      await expect(side.getAllByRole("link", { current: false })).toHaveLength(3);

      // The footer row is the same row with no list around it — a stray `<li>` is what axe fails.
      const settings = side.getByRole("link", { name: "Settings" });
      await expect(settings.closest("li")).toBeNull();

      // The long label truncates to one line rather than wrapping the row taller.
      const label = within(current).getByText(/Launch plan/);
      await expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
    }

    // The active fill and the frame are the same colours on both halves.
    const [nativeCurrent, compiledCurrent] = [native, compiled].map((half) =>
      within(half).getByRole("link", { current: "page" }),
    );
    if (!nativeCurrent || !compiledCurrent) throw new Error("both halves should render");
    await expect(getComputedStyle(compiledCurrent).backgroundColor).toBe(
      getComputedStyle(nativeCurrent).backgroundColor,
    );
    await expect(getComputedStyle(compiled).backgroundColor).toBe(
      getComputedStyle(native).backgroundColor,
    );
    await expect(compiled.getBoundingClientRect().width).toBe(native.getBoundingClientRect().width);
  },
};

/**
 * `hideBelow="md"`: under 48rem the rail is not drawn, and from it up it is — a media query in the
 * stylesheet, not in JavaScript, so there is no first frame with the rail drawn and then removed.
 *
 * The play reads the same media query the classes are generated for and checks each half against
 * it, so it holds in the test runner's phone-width viewport (hidden) and in a desktop Storybook
 * (shown) alike. The sidebar without `hideBelow` beside each one is drawn at every width.
 */
export const HiddenBelow: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native rail"
            hideBelow="md"
            content={<NativeNavItem href="#/inbox" label="Inbox" active />}
          />
          <NativeSidebar
            label="Native always"
            content={<NativeNavItem href="#/inbox" label="Inbox" />}
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled rail"
            hideBelow="md"
            content={<CompiledNavItem href="#/inbox" label="Inbox" active />}
          />
          <CompiledSidebar
            label="Compiled always"
            content={<CompiledNavItem href="#/inbox" label="Inbox" />}
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Tailwind's `md` is 48rem; the rail is drawn exactly when this matches.
    const wide = window.matchMedia("(min-width: 48rem)").matches;

    const roots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-testid="sidebar"], [data-slot="sidebar"]'),
    );
    await expect(roots).toHaveLength(4);
    const rails = roots.filter((el) => /rail$/.test(el.getAttribute("aria-label") ?? ""));
    await expect(rails).toHaveLength(2);

    for (const rail of rails) {
      // Hidden is `display: none` — no box, and nothing left for a screen reader either.
      await expect(getComputedStyle(rail).display).toBe(wide ? "flex" : "none");
      await expect(rail.getBoundingClientRect().width).toBe(wide ? 256 : 0);
    }
    for (const name of ["Native rail", "Compiled rail"]) {
      const landmark = canvas.queryByRole("complementary", { name });
      if (wide) await expect(landmark).not.toBeNull();
      else await expect(landmark).toBeNull();
    }

    // Without `hideBelow` the sidebar is drawn at every width, the same flex column as before.
    for (const name of ["Native always", "Compiled always"]) {
      const always = canvas.getByRole("complementary", { name });
      await expect(getComputedStyle(always).display).toBe("flex");
      await expect(always.getBoundingClientRect().width).toBe(256);
    }
  },
};

const recent = ["Quarterly review", "Hiring loop"];

/**
 * `as="nav"` on the sections that are the app's navigation: a `<nav>` on the web and
 * `role="navigation"` on device, named by the title — or by `label` where there is none — while a
 * section of recent items stays out of the landmark. Each half names its own, since two landmarks
 * of one kind sharing a name is what axe's `landmark-unique` reports.
 */
export const NavigationLandmark: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native sidebar"
            content={
              <>
                <NativeSection
                  as="nav"
                  label="Native main"
                  content={[
                    <NativeNavItem key="home" href="#/" label="Home" active />,
                    <NativeNavItem key="inbox" href="#/inbox" label="Inbox" />,
                  ]}
                />
                <NativeSection
                  as="nav"
                  title="Native projects"
                  content={projects.map((p) => (
                    <NativeNavItem key={p.id} href={`#/projects/${p.id}`} label={p.name} />
                  ))}
                />
                <NativeSection
                  title="Native recent"
                  content={recent.map((name) => (
                    <NativeNavItem key={name} href={`#/recent/${name}`} label={name} />
                  ))}
                />
              </>
            }
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled sidebar"
            content={
              <>
                <CompiledSection
                  as="nav"
                  label="Compiled main"
                  content={[
                    <CompiledNavItem key="home" href="#/" label="Home" active />,
                    <CompiledNavItem key="inbox" href="#/inbox" label="Inbox" />,
                  ]}
                />
                <CompiledSection
                  as="nav"
                  title="Compiled projects"
                  content={projects.map((p) => (
                    <CompiledNavItem key={p.id} href={`#/projects/${p.id}`} label={p.name} />
                  ))}
                />
                <CompiledSection
                  title="Compiled recent"
                  content={recent.map((name) => (
                    <CompiledNavItem key={name} href={`#/recent/${name}`} label={name} />
                  ))}
                />
              </>
            }
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const half of ["Native", "Compiled"]) {
      const side = within(canvas.getByRole("complementary", { name: `${half} sidebar` }));

      // Two navigation landmarks per half — one named by `label`, one by its title.
      const navs = side.getAllByRole("navigation");
      await expect(navs).toHaveLength(2);
      const main = side.getByRole("navigation", { name: `${half} main` });
      const projectsNav = side.getByRole("navigation", { name: `${half} projects` });
      await expect(main.tagName).toBe("NAV");
      await expect(projectsNav.tagName).toBe("NAV");

      // The landmark holds the whole section: its heading and its list of links.
      await expect(
        within(projectsNav).getByRole("heading", { name: `${half} projects` }),
      ).toBeInTheDocument();
      await expect(
        within(projectsNav).getByRole("list", { name: `${half} projects` }),
      ).toBeInTheDocument();
      await expect(within(projectsNav).getAllByRole("link")).toHaveLength(3);
      await expect(within(main).getAllByRole("link")).toHaveLength(2);

      // The section that is not navigation stays out of every landmark but the sidebar's own.
      const recentList = side.getByRole("list", { name: `${half} recent` });
      await expect(recentList.closest("nav")).toBeNull();
    }

    // The landmark adds no box of its own: the navigation section lays out as the plain one does.
    const [nativeNav, compiledNav] = ["Native", "Compiled"].map((half) =>
      canvas.getByRole("navigation", { name: `${half} projects` }),
    );
    if (!nativeNav || !compiledNav) throw new Error("both halves should render");
    await expect(compiledNav.getBoundingClientRect().height).toBe(
      nativeNav.getBoundingClientRect().height,
    );
  },
};

const onSignOut = fn();

/**
 * The footer's Sign out: the same row with no `href`, which makes it a button — `role="button"` on
 * device, a `<button type="button">` once compiled, never `aria-current` — drawn exactly like the
 * Settings link above it.
 */
export const ActionRow: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native sidebar"
            content={null}
            footer={
              <>
                <NativeNavItem href="#/settings" label="Settings" icon={<NativeSettings />} />
                <NativeNavItem label="Sign out" icon={<NativeArrowRight />} onPress={onSignOut} />
              </>
            }
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled sidebar"
            content={null}
            footer={
              <>
                <CompiledNavItem href="#/settings" label="Settings" icon={<CompiledSettings />} />
                <CompiledNavItem
                  label="Sign out"
                  icon={<CompiledArrowRight />}
                  onClick={onSignOut}
                />
              </>
            }
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onSignOut.mockClear();

    const halves = [
      canvas.getByRole("complementary", { name: "Native sidebar" }),
      canvas.getByRole("complementary", { name: "Compiled sidebar" }),
    ];
    for (const [index, half] of halves.entries()) {
      const side = within(half);

      // A button, not a link, and never the current page.
      const signOut = side.getByRole("button", { name: "Sign out" });
      await expect(side.queryByRole("link", { name: "Sign out" })).toBeNull();
      await expect(signOut).not.toHaveAttribute("aria-current");
      await expect(signOut).not.toHaveAttribute("href");

      // It does what it is for.
      await userEvent.click(signOut);
      await expect(onSignOut).toHaveBeenCalledTimes(index + 1);

      // The same row as the link above it: box, icon and ink all match.
      const settings = side.getByRole("link", { name: "Settings" });
      const [a, b] = [settings, signOut].map((row) => getComputedStyle(row));
      if (!a || !b) throw new Error("both rows should render");
      for (const prop of ["height", "paddingLeft", "borderRadius", "columnGap"] as const) {
        await expect(b[prop]).toBe(a[prop]);
      }
      const svg = (row: HTMLElement) => {
        const icon = row.querySelector("svg");
        if (!icon) throw new Error("the row should draw its icon");
        return icon.getBoundingClientRect();
      };
      await expect(svg(signOut).width).toBe(svg(settings).width);
      await expect(svg(signOut).height).toBe(svg(settings).height);
      const label = (row: HTMLElement, text: string) =>
        getComputedStyle(within(row).getByText(text));
      await expect(label(signOut, "Sign out").color).toBe(label(settings, "Settings").color);
      await expect(label(signOut, "Sign out").textAlign).toBe(
        label(settings, "Settings").textAlign,
      );
    }

    // On the web it is a real `<button type="button">`, so it submits no form it sits in.
    const compiled = within(halves[1] as HTMLElement).getByRole("button", { name: "Sign out" });
    await expect(compiled.tagName).toBe("BUTTON");
    await expect(compiled).toHaveAttribute("type", "button");
  },
};

const CompiledRouterLink = createLink(CompiledNavItem);
const NativeRouterLink = createLink(NativeNavItem);

const routes = [
  { to: "/", label: "Documents" },
  { to: "/settings", label: "Settings" },
] as const;

/** Both halves' rows as TanStack Router links, each written with `to` and no `href`. */
function RouterRows() {
  const matchRoute = useMatchRoute();
  const active = (to: string) => Boolean(matchRoute({ to, fuzzy: to !== "/" }));
  return (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native sidebar"
            content={
              <NativeSection
                title="Pages"
                content={routes.map(({ to, label }) => (
                  <NativeRouterLink key={to} to={to} label={label} active={active(to)} />
                ))}
              />
            }
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled sidebar"
            content={
              <CompiledSection
                title="Pages"
                content={routes.map(({ to, label }) => (
                  <CompiledRouterLink key={to} to={to} label={label} active={active(to)} />
                ))}
              />
            }
          />
        </Frame>
      }
    />
  );
}

/** A memory router of its own per render, so the story never touches the page's URL. */
function RouterFrame() {
  const [router] = useState(() => {
    const root = createRootRoute({ component: RouterRows });
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
 * The row wrapped by TanStack's `createLink` — the router renders it with the `href` it builds
 * from `to`, so the call site names the destination once and the row is still a real `<a href>`
 * on both halves, which is what middle-click and "copy link" read.
 */
export const RouterLink: Story = {
  render: () => <RouterFrame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const compiled = await canvas.findByRole("complementary", { name: "Compiled sidebar" });
    const native = canvas.getByRole("complementary", { name: "Native sidebar" });

    for (const half of [native, compiled]) {
      const side = within(half);
      // The `href` the router built from `to`, on an `<a>`, though no call site passed one.
      const documents = side.getByRole("link", { name: "Documents" });
      await expect(documents.tagName).toBe("A");
      await expect(documents).toHaveAttribute("href", "/");
      await expect(documents).toHaveAttribute("aria-current", "page");
      await expect(side.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "href",
        "/settings",
      );
    }

    // A click is the router's, not the browser's: it moves the memory history, and the row the
    // page is now on is the current one on both halves.
    await userEvent.click(within(compiled).getByRole("link", { name: "Settings" }));
    for (const half of [native, compiled]) {
      await expect(
        await within(half).findByRole("link", { name: "Settings", current: "page" }),
      ).toBeInTheDocument();
      await expect(within(half).getByRole("link", { name: "Documents" })).not.toHaveAttribute(
        "aria-current",
      );
    }
  },
};

const pending = { isPending: true, isError: false, error: null, refetch: () => undefined };
const failed = {
  isPending: false,
  isError: true,
  error: new Error("502 Bad Gateway"),
  refetch: () => undefined,
};

/**
 * A section's loading and failure rungs, drawn by a `compact` `QueryState` in the `status` slot:
 * no list is drawn while there are no rows, so neither half announces an empty one.
 */
export const States: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeSidebar
            label="Native sidebar"
            content={
              <>
                <NativeSection
                  title="Projects"
                  status={
                    <NativeQueryState compact query={pending} what="projects" count={0} rows={2} />
                  }
                />
                <NativeSection
                  title="Shared"
                  status={
                    <NativeQueryState compact query={failed} what="shared projects" count={0} />
                  }
                />
              </>
            }
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledSidebar
            label="Compiled sidebar"
            content={
              <>
                <CompiledSection
                  title="Projects"
                  status={
                    <CompiledQueryState
                      compact
                      query={pending}
                      what="projects"
                      count={0}
                      rows={2}
                    />
                  }
                />
                <CompiledSection
                  title="Shared"
                  status={
                    <CompiledQueryState compact query={failed} what="shared projects" count={0} />
                  }
                />
              </>
            }
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("list")).toHaveLength(0);
    await expect(canvas.getAllByRole("status", { name: "Loading" })).toHaveLength(2);
    await expect(canvas.getAllByText("Could not load shared projects")).toHaveLength(2);
    // The compact failure is an alert too, on both halves — it replaces the rows it stands in for.
    const alerts = canvas.getAllByRole("alert");
    await expect(alerts).toHaveLength(2);
    for (const alert of alerts)
      await expect(alert).toHaveTextContent("Could not load shared projects");
    await expect(canvas.getAllByRole("button", { name: "Try again" })).toHaveLength(2);

    // Compact means a nav row's height, not a card's: each placeholder is one row tall.
    const bars = canvasElement.querySelectorAll(
      '[data-slot="row-skeleton"], [data-testid="row-skeleton"]',
    );
    await expect(bars).toHaveLength(4);
    for (const bar of Array.from(bars)) await expect(bar.getBoundingClientRect().height).toBe(32);
  },
};
