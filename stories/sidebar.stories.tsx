import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
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
    await expect(canvas.getAllByRole("button", { name: "Try again" })).toHaveLength(2);

    // Compact means a nav row's height, not a card's: each placeholder is one row tall.
    const bars = canvasElement.querySelectorAll(
      '[data-slot="row-skeleton"], [data-testid="row-skeleton"]',
    );
    await expect(bars).toHaveLength(4);
    for (const bar of Array.from(bars)) await expect(bar.getBoundingClientRect().height).toBe(32);
  },
};
