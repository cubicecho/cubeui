import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, fn, userEvent, within } from "storybook/test";
import { ActionButton as CompiledAction } from "../compiled/action-button";
import { Button as CompiledButton } from "../compiled/button";
import {
  Folder as CompiledFolder,
  Moon as CompiledMoon,
  RefreshCw as CompiledRefresh,
  Settings as CompiledSettings,
} from "../compiled/icons";
import {
  BarNavItem as CompiledBarItem,
  SidebarNavItem as CompiledNavItem,
  SidebarSection as CompiledSection,
  Sidebar as CompiledSidebar,
} from "../compiled/sidebar";
import { SidebarLayout as CompiledLayout } from "../compiled/split-layout";
import { ThemePicker as CompiledThemePicker } from "../compiled/theme-picker";
import { ActionButton as NativeAction } from "../registry/layout/action-button";
import {
  BarNavItem as NativeBarItem,
  SidebarNavItem as NativeNavItem,
  SidebarSection as NativeSection,
  Sidebar as NativeSidebar,
} from "../registry/layout/sidebar";
import { SidebarLayout as NativeLayout } from "../registry/layout/split-layout";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Folder as NativeFolder,
  Moon as NativeMoon,
  RefreshCw as NativeRefresh,
  Settings as NativeSettings,
} from "../registry/ui/icons";
import { ThemePicker as NativeThemePicker } from "../registry/ui/theme-picker";
import { SideBySide } from "./side-by-side";

/**
 * `SidebarLayout`'s `sidebarHideBelow`: the app shell's narrow width. From the breakpoint up the
 * rail is drawn and the bar is not; under it the bar is drawn over the page — a `header` holding
 * the brand, a named `nav` and the action — and the rail is not. One breakpoint, said once, read by
 * both halves, on both platforms.
 */
const meta = { title: "RN Parity/SidebarLayout" } satisfies Meta;
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
            sidebarSlot={
              <NativeSidebar
                label="Native rail"
                headerSlot={<Text className="font-semibold text-foreground">Router</Text>}
                contentSlot={
                  <NativeSection
                    as="nav"
                    label="Native rail places"
                    contentSlot={places.map((p) => (
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
            brandSlot={<Text className="font-semibold text-foreground">Router</Text>}
            navSlot={places.map((p) => (
              <NativeNavItem
                key={p.id}
                href={`#/${p.id}`}
                label={p.name}
                active={p.id === "servers"}
              />
            ))}
            navLabel="Native main"
            actionSlot={
              <NativeButton
                variant="outline"
                size="icon-sm"
                aria-label="Native theme"
                onPress={onTheme}
                iconSlot={<NativeMoon />}
              />
            }
            contentSlot={<Text className="p-4 text-foreground">Native page</Text>}
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
            sidebarSlot={
              <CompiledSidebar
                label="Compiled rail"
                headerSlot={<span className="font-semibold text-foreground">Router</span>}
                contentSlot={
                  <CompiledSection
                    as="nav"
                    label="Compiled rail places"
                    contentSlot={places.map((p) => (
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
            brandSlot={<span className="font-semibold text-foreground">Router</span>}
            navSlot={places.map((p) => (
              <CompiledNavItem
                key={p.id}
                href={`#/${p.id}`}
                label={p.name}
                active={p.id === "servers"}
              />
            ))}
            navLabel="Compiled main"
            actionSlot={
              <CompiledButton
                variant="outline"
                size="icon-sm"
                aria-label="Compiled theme"
                onClick={onTheme}
                iconSlot={<CompiledMoon />}
              />
            }
            contentSlot={<p className="p-4 text-foreground">Compiled page</p>}
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

/**
 * Issue #267: the bar on the narrowest phone, 320px, holding what it was made to hold — two
 * `BarNavItem`s, a compact `ThemePicker` and an icon button, with no brand. The halves are
 * stacked rather than side by side, so each has the whole 320px, and neither may be wider than
 * it: a bar that is scrolls the whole page sideways.
 */
export const BarFitsAPhone: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div className="flex flex-col gap-4 bg-background text-foreground">
      <section>
        <Frame>
          <NativeLayout
            className="h-full"
            sidebarHideBelow="md"
            sidebarSlot={<NativeSidebar label="Native rail" contentSlot={null} />}
            navLabel="Native main"
            navSlot={
              <>
                <NativeBarItem href="#/files" label="Files" iconSlot={<NativeFolder />} active />
                <NativeBarItem href="#/settings" label="Settings" iconSlot={<NativeSettings />} />
              </>
            }
            actionSlot={
              <>
                <NativeThemePicker variant="compact" aria-label="Native theme" />
                <NativeAction
                  label="Native refresh"
                  variant="outline"
                  size="icon-sm"
                  iconSlot={<NativeRefresh />}
                />
              </>
            }
            contentSlot={<Text className="p-4 text-foreground">Native page</Text>}
          />
        </Frame>
      </section>
      <section>
        <Frame>
          <CompiledLayout
            className="h-full"
            sidebarHideBelow="md"
            sidebarSlot={<CompiledSidebar label="Compiled rail" contentSlot={null} />}
            navLabel="Compiled main"
            navSlot={
              <>
                <CompiledBarItem
                  href="#/files"
                  label="Files"
                  iconSlot={<CompiledFolder />}
                  active
                />
                <CompiledBarItem
                  href="#/settings"
                  label="Settings"
                  iconSlot={<CompiledSettings />}
                />
              </>
            }
            actionSlot={
              <>
                <CompiledThemePicker variant="compact" aria-label="Compiled theme" />
                <CompiledAction
                  label="Compiled refresh"
                  variant="outline"
                  size="icon-sm"
                  iconSlot={<CompiledRefresh />}
                />
              </>
            }
            contentSlot={<span className="p-4 text-foreground">Compiled page</span>}
          />
        </Frame>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    const canvas = within(canvasElement);
    const headers = canvas.getAllByRole("banner");
    await expect(headers).toHaveLength(2);

    for (const header of headers) {
      const bar = header.getBoundingClientRect();
      // Everything in the bar is inside the bar.
      for (const part of Array.from(header.children)) {
        const box = part.getBoundingClientRect();
        await expect(box.left).toBeGreaterThanOrEqual(bar.left);
        await expect(box.right).toBeLessThanOrEqual(bar.right + 0.5);
      }
      await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
      // All three theme choices are still there to press.
      await expect(within(header).getAllByRole("radio")).toHaveLength(3);
    }
    // The page does not scroll sideways.
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(canvasElement.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
