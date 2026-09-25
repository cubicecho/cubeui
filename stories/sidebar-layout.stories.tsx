import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Moon as CompiledMoon } from "../compiled/icons";
import {
  SidebarNavItem as CompiledNavItem,
  SidebarSection as CompiledSection,
  Sidebar as CompiledSidebar,
} from "../compiled/sidebar";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import {
  SidebarNavItem as NativeNavItem,
  SidebarSection as NativeSection,
  Sidebar as NativeSidebar,
} from "../registry/layout/sidebar";
import { SidebarLayout as NativeLayout } from "../registry/layout/split-layout";
import { Button as NativeButton } from "../registry/ui/button";
import { Moon as NativeMoon } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `SidebarLayout`'s `sidebarHideBelow`: the app shell's narrow width. From the breakpoint up the
 * rail is drawn and the bar is not; under it the bar is drawn over the page — a `header` holding
 * the brand, a named `nav` and the action — and the rail is not. One breakpoint, said once, read by
 * both halves, on both platforms.
 */
const meta = { title: "Stage 0/SidebarLayout" } satisfies Meta;
export default meta;
type Story = StoryObj;

const places = [
  { id: "servers", name: "Servers" },
  { id: "browse", name: "Browse" },
  { id: "settings", name: "Settings" },
];

/** A frame with a height to divide, which the sticky sidebar needs before anything lays out. */
function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-96 flex-col">{children}</div>;
}

const onTheme = fn();

/**
 * One render and one play for both widths. The play reads the same media query the classes are
 * generated for and checks the half that should be drawn; the two stories below are what make both
 * branches run, by setting the viewport the test runner renders in.
 */
const shell: Story = {
  render: () => (
    <SideBySide
      native={
        <Frame>
          <NativeLayout
            className="h-full"
            sidebarPosition="start"
            sidebarWidth="auto"
            divider="none"
            sidebarHideBelow="md"
            sidebar={
              <NativeSidebar
                label="Native rail"
                header={<Text className="font-semibold text-sidebar-foreground">Router</Text>}
                content={
                  <NativeSection
                    as="nav"
                    label="Native rail places"
                    content={places.map((p) => (
                      <NativeNavItem
                        key={p.id}
                        href={`#/${p.id}`}
                        label={p.name}
                        active={p.id === "servers"}
                      />
                    ))}
                  />
                }
              />
            }
            brand={<Text className="font-semibold text-foreground">Router</Text>}
            nav={places.map((p) => (
              <NativeNavItem
                key={p.id}
                href={`#/${p.id}`}
                label={p.name}
                active={p.id === "servers"}
              />
            ))}
            navLabel="Native main"
            action={
              <NativeButton
                variant="ghost"
                size="icon-sm"
                aria-label="Native theme"
                onPress={onTheme}
              >
                <NativeMoon />
              </NativeButton>
            }
            content={<Text className="p-4 text-foreground">Native page</Text>}
          />
        </Frame>
      }
      compiled={
        <Frame>
          <CompiledLayout
            className="h-full"
            sidebarPosition="start"
            sidebarWidth="auto"
            divider="none"
            sidebarHideBelow="md"
            sidebar={
              <CompiledSidebar
                label="Compiled rail"
                header={<span className="font-semibold text-sidebar-foreground">Router</span>}
                content={
                  <CompiledSection
                    as="nav"
                    label="Compiled rail places"
                    content={places.map((p) => (
                      <CompiledNavItem
                        key={p.id}
                        href={`#/${p.id}`}
                        label={p.name}
                        active={p.id === "servers"}
                      />
                    ))}
                  />
                }
              />
            }
            brand={<span className="font-semibold text-foreground">Router</span>}
            nav={places.map((p) => (
              <CompiledNavItem
                key={p.id}
                href={`#/${p.id}`}
                label={p.name}
                active={p.id === "servers"}
              />
            ))}
            navLabel="Compiled main"
            action={
              <CompiledButton
                variant="ghost"
                size="icon-sm"
                aria-label="Compiled theme"
                onClick={onTheme}
              >
                <CompiledMoon />
              </CompiledButton>
            }
            content={<p className="p-4 text-foreground">Compiled page</p>}
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onTheme.mockClear();
    // Tailwind's `md` is 48rem. The rail is drawn exactly when this matches and the bar exactly
    // when it does not.
    const wide = window.matchMedia("(min-width: 48rem)").matches;

    const headers = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-testid="sidebar-layout-header"], [data-slot="sidebar-layout-header"]',
      ),
    );
    await expect(headers).toHaveLength(2);
    const rails = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-testid="sidebar"], [data-slot="sidebar"]'),
    );
    await expect(rails).toHaveLength(2);

    for (const header of headers) {
      // The bar is the page's banner: a `<header>` on both halves.
      await expect(header.tagName).toBe("HEADER");
      await expect(getComputedStyle(header).display).toBe(wide ? "none" : "flex");
    }
    for (const rail of rails) {
      await expect(rail.getBoundingClientRect().width).toBe(wide ? 256 : 0);
    }

    for (const half of ["Native", "Compiled"]) {
      const rail = canvas.queryByRole("complementary", { name: `${half} rail` });
      const bar = canvas.queryByRole("navigation", { name: `${half} main` });

      if (wide) {
        // The rail is drawn and its places are reachable; the bar is gone from the tree too.
        await expect(rail).not.toBeNull();
        await expect(bar).toBeNull();
        await expect(canvas.queryByRole("button", { name: `${half} theme` })).toBeNull();
        continue;
      }

      // Under the breakpoint the rail is `display: none` — no box, and no landmark left behind.
      await expect(rail).toBeNull();
      await expect(canvas.queryByRole("navigation", { name: `${half} rail places` })).toBeNull();

      // The bar's navigation is a named landmark, and every place in it is a named link.
      if (!bar) throw new Error(`${half}: the bar's navigation should be drawn under md`);
      await expect(bar.tagName).toBe("NAV");
      const links = within(bar).getAllByRole("link");
      await expect(links.map((a) => a.textContent)).toEqual(["Servers", "Browse", "Settings"]);
      await expect(within(bar).getByRole("link", { current: "page" })).toHaveAccessibleName(
        "Servers",
      );

      // The action is at the far end of the bar, and it is a button that answers.
      const theme = canvas.getByRole("button", { name: `${half} theme` });
      await userEvent.click(theme);
      await expect(theme.closest("header")).not.toBeNull();
      await expect(theme.closest("nav")).toBeNull();
    }

    if (wide) return;

    await expect(onTheme).toHaveBeenCalledTimes(2);

    for (const header of headers) {
      // The bar sits over the page, not beside it: the page starts where the bar ends.
      const content = header.nextElementSibling;
      if (!content) throw new Error("the page should follow the bar");
      await expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        header.getBoundingClientRect().bottom - 0.5,
      );
      // The brand is first in the bar and the action last, with the nav between them.
      const slots = Array.from(header.children).map(
        (el) => el.getAttribute("data-testid") ?? el.getAttribute("data-slot"),
      );
      await expect(slots).toEqual([
        "sidebar-layout-brand",
        "sidebar-layout-nav",
        "sidebar-layout-action",
      ]);
    }

    // The same bar on both halves: the same height and the same fill.
    const [native, compiled] = headers;
    if (!native || !compiled) throw new Error("both halves should render");
    await expect(compiled.getBoundingClientRect().height).toBe(
      native.getBoundingClientRect().height,
    );
    await expect(getComputedStyle(compiled).backgroundColor).toBe(
      getComputedStyle(native).backgroundColor,
    );
  },
};

/** From `md` up: the rail beside the page, and no bar. The test runner's default 1200px. */
export const Wide: Story = {
  ...shell,
  play: async (context) => {
    await expect(window.matchMedia("(min-width: 48rem)").matches).toBe(true);
    await shell.play?.(context);
  },
};

/**
 * Under `md`: the bar over the page, and no rail. `globals.viewport` is what the Storybook test
 * runner resizes the page to before the play runs, so this branch runs in CI rather than only in
 * a narrow browser window.
 */
export const Narrow: Story = {
  ...shell,
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async (context) => {
    await expect(window.matchMedia("(min-width: 48rem)").matches).toBe(false);
    await shell.play?.(context);
  },
};
