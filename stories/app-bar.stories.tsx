import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { AppBar as CompiledAppBar } from "../compiled/app-bar";
import { Button as CompiledButton } from "../compiled/button";
import { HeaderContentFooter as CompiledHeaderContentFooter } from "../compiled/header-content-footer";
import { Search as CompiledSearch } from "../compiled/icons";
import { BarNavItem as CompiledBarNavItem } from "../compiled/sidebar";
import { AppBar as NativeAppBar } from "../registry/layout/app-bar";
import { HeaderContentFooter as NativeHeaderContentFooter } from "../registry/layout/header-content-footer";
import { BarNavItem as NativeBarNavItem } from "../registry/layout/sidebar";
import { Button as NativeButton } from "../registry/ui/button";
import { Search as NativeSearch } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `AppBar` is the bar across the top of an app. These stories say the one source gives both
 * halves the same bar — brand at the start, the places after it, the actions at the end — and,
 * as the app with no sidebar builds it, the bar over a page that scrolls under it.
 */
const meta = { title: "RN Parity/App Bar" } satisfies Meta;
export default meta;
type Story = StoryObj;

const LINKS = ["Dashboard", "Review", "Rules", "Merges", "Devices", "Keys"];

const signOut = fn();

/** A pane with a height, standing in for the window the chassis divides. */
function Frame({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div data-testid={testId} className="h-72 rounded-md border border-foreground/10">
      {children}
    </div>
  );
}

/** Enough page that it has to scroll under the bar. */
const rows = (prefix: string) => Array.from({ length: 30 }, (_, i) => `${prefix} row ${i + 1}`);

/**
 * The app with no sidebar: `HeaderContentFooter scroll` with the bar in its header slot and the
 * page, marked `main`, in its body.
 */
export const OverAPage: Story = {
  // Two app shells on one page are two banners and two mains, which a real page never has; the
  // rules that say so are off here only. `Narrow` draws one bar per half inside no landmark.
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "landmark-no-duplicate-banner", enabled: false },
          { id: "landmark-no-duplicate-main", enabled: false },
          { id: "landmark-unique", enabled: false },
        ],
      },
    },
  },
  render: () => (
    <SideBySide
      native={
        <Frame testId="native-frame">
          <NativeHeaderContentFooter
            scroll
            className="h-full"
            headerSlot={
              <NativeAppBar
                brandSlot={<Text className="font-semibold text-foreground">eunomia</Text>}
                navSlot={LINKS.map((label) => (
                  <Text
                    key={label}
                    role="link"
                    className="rounded-md px-3 py-1.5 text-foreground/60 text-sm"
                  >
                    {label}
                  </Text>
                ))}
                navLabel="Native main"
                actionSlot={
                  <NativeButton size="sm" variant="outline" onPress={signOut} content="Sign out" />
                }
              />
            }
            contentSlot={
              <View role="main">
                {rows("Native").map((row) => (
                  <Text key={row} className="px-4 py-2 text-foreground">
                    {row}
                  </Text>
                ))}
              </View>
            }
          />
        </Frame>
      }
      compiled={
        <Frame testId="compiled-frame">
          <CompiledHeaderContentFooter
            scroll
            className="h-full"
            headerSlot={
              <CompiledAppBar
                brandSlot={<span className="font-semibold text-foreground">eunomia</span>}
                navSlot={LINKS.map((label) => (
                  <a
                    key={label}
                    href={`#/${label.toLowerCase()}`}
                    className="shrink-0 rounded-md px-3 py-1.5 text-foreground/60 text-sm"
                  >
                    {label}
                  </a>
                ))}
                navLabel="Compiled main"
                actionSlot={
                  <CompiledButton
                    size="sm"
                    variant="outline"
                    onClick={signOut}
                    content="Sign out"
                  />
                }
              />
            }
            contentSlot={
              <main>
                {rows("Compiled").map((row) => (
                  <p key={row} className="px-4 py-2 text-foreground">
                    {row}
                  </p>
                ))}
              </main>
            }
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole("banner")).toHaveLength(2);
    await expect(canvas.getAllByRole("main")).toHaveLength(2);

    // The compiled half is the real elements, not a `div` with a role on it.
    const compiledFrame = canvas.getByTestId("compiled-frame");
    const compiledBanner = within(compiledFrame).getByRole("banner");
    await expect(compiledBanner.tagName).toBe("HEADER");
    await expect(
      within(compiledFrame).getByRole("navigation", { name: "Compiled main" }).tagName,
    ).toBe("NAV");

    for (const [frame, prefix] of [
      [canvas.getByTestId("native-frame"), "Native"],
      [compiledFrame, "Compiled"],
    ] as const) {
      const half = within(frame);
      const banner = half.getByRole("banner");
      const main = half.getByRole("main");
      const nav = half.getByRole("navigation", { name: `${prefix} main` });

      // Brand at the start, the places after it, the actions at the end — in reading order and on
      // one line.
      const brand = within(banner).getByText("eunomia").getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      const action = within(banner)
        .getByRole("button", { name: "Sign out" })
        .getBoundingClientRect();
      await expect(brand.right).toBeLessThanOrEqual(navBox.left + 1);
      await expect(navBox.right).toBeLessThanOrEqual(action.left + 1);
      await expect(
        Math.abs(brand.top + brand.height / 2 - (action.top + action.height / 2)),
      ).toBeLessThan(2);
      const bannerBox = banner.getBoundingClientRect();
      await expect(bannerBox.right - action.right).toBeLessThan(24);

      // Every place is in the navigation landmark, and the landmark is in the banner.
      await expect(within(nav).getAllByRole("link")).toHaveLength(LINKS.length);
      await expect(banner.contains(nav)).toBe(true);

      // The page is under the bar, not beside it or behind it.
      await expect(main.getBoundingClientRect().top).toBeGreaterThanOrEqual(bannerBox.bottom - 1);
      await expect(within(main).getByText(`${prefix} row 1`)).toBeVisible();
    }

    // The action is the caller's handler, wired through untouched.
    await userEvent.click(within(compiledBanner).getByRole("button", { name: "Sign out" }));
    await expect(signOut).toHaveBeenCalled();

    // The body scrolls and the bar stays at the top while the rows move under it.
    const body = compiledFrame.querySelector<HTMLElement>(
      '[data-slot="header-content-footer-content"]',
    );
    if (body === null) {
      throw new Error("the chassis should draw a body");
    }
    const before = compiledBanner.getBoundingClientRect().top;
    const firstRow = within(compiledFrame).getByText("Compiled row 1");
    const rowBefore = firstRow.getBoundingClientRect().top;
    body.scrollTop = 200;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
    await expect(firstRow.getBoundingClientRect().top).toBeLessThan(rowBefore - 100);
    await expect(Math.abs(compiledBanner.getBoundingClientRect().top - before)).toBeLessThan(1);
  },
};

/** Six places in a phone's width, one with a count: they scroll sideways, the badge whole. */
export const Narrow: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="w-80 bg-background">
          <NativeAppBar
            brandSlot={<Text className="font-semibold text-foreground">eunomia</Text>}
            navSlot={LINKS.map((label, index) => (
              <NativeBarNavItem
                key={label}
                href={`#/${label.toLowerCase()}`}
                label={label}
                iconSlot={<NativeSearch />}
                {...(index === 0 ? { count: 12 } : {})}
              />
            ))}
            navLabel="Native main"
            actionSlot={
              <NativeButton size="sm" variant="outline" onPress={signOut} content="Sign out" />
            }
          />
        </div>
      }
      compiled={
        <div className="w-80 bg-background">
          <CompiledAppBar
            brandSlot={<span className="font-semibold text-foreground">eunomia</span>}
            navSlot={LINKS.map((label, index) => (
              <CompiledBarNavItem
                key={label}
                href={`#/${label.toLowerCase()}`}
                label={label}
                iconSlot={<CompiledSearch />}
                {...(index === 0 ? { count: 12 } : {})}
              />
            ))}
            navLabel="Compiled main"
            actionSlot={
              <CompiledButton size="sm" variant="outline" onClick={signOut} content="Sign out" />
            }
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const half of ["Native", "Compiled"]) {
      const nav = canvas.getByRole("navigation", { name: `${half} main` });
      const banner = nav.closest("header");
      const places = nav.firstElementChild;
      if (banner === null || places instanceof HTMLElement === false) {
        throw new Error(`${half}: the places should be in a scroller in the banner`);
      }

      // The places overflow their scroller and move inside it rather than widening the bar.
      await expect(places.scrollWidth).toBeGreaterThan(places.clientWidth);
      await expect(banner.scrollWidth).toBeLessThanOrEqual(banner.clientWidth);

      // The action is still inside the bar at its end.
      const action = within(banner).getByRole("button", { name: "Sign out" });
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        banner.getBoundingClientRect().right,
      );

      // The count over the first place's corner is inside what the scroller draws, not clipped.
      const badge = within(nav).getByText("12").getBoundingClientRect();
      const box = places.getBoundingClientRect();
      await expect(badge.top).toBeGreaterThanOrEqual(box.top - 0.5);
      await expect(badge.right).toBeLessThanOrEqual(box.right + 0.5);
      await expect(places.scrollHeight).toBeLessThanOrEqual(places.clientHeight);
    }
  },
};
