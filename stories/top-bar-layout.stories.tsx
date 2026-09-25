import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { TopBarLayout as CompiledTopBarLayout } from "../compiled/top-bar-layout";
import { TopBarLayout as NativeTopBarLayout } from "../registry/layout/top-bar-layout";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * `TopBarLayout` is the app shell with no sidebar. These stories say the one source gives both
 * halves the same bar — brand at the start, the links after it, the actions at the end — and the
 * two landmarks, and that on the web the bar stays where it is while the page under it scrolls.
 */
const meta = { title: "Stage 0/Top Bar Layout" } satisfies Meta;
export default meta;
type Story = StoryObj;

const LINKS = ["Dashboard", "Review", "Rules", "Merges", "Devices", "Keys"];

const signOut = fn();

/**
 * A pane with a height, standing in for the window: the web bar sticks to whatever scrolls it, and
 * the native chassis divides the height it is given.
 */
function Frame({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div data-testid={testId} className="h-72 overflow-y-auto rounded-md border border-border">
      {children}
    </div>
  );
}

/** Enough page that it has to scroll under the bar. */
const rows = (prefix: string) => Array.from({ length: 30 }, (_, i) => `${prefix} row ${i + 1}`);

export const Default: Story = {
  // Two app shells on one page are two banners and two mains, which a real page never has; the
  // rules that say so are off here only. `Narrow` is one shell, and axe checks it in full.
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
          <NativeTopBarLayout
            brand={<Text className="font-semibold text-foreground">eunomia</Text>}
            nav={LINKS.map((label) => (
              <Text
                key={label}
                role="link"
                className="rounded-md px-3 py-1.5 text-muted-foreground text-sm"
              >
                {label}
              </Text>
            ))}
            navLabel="Native main"
            action={
              <NativeButton size="sm" variant="ghost" onPress={signOut}>
                Sign out
              </NativeButton>
            }
            content={rows("Native").map((row) => (
              <Text key={row} className="px-4 py-2 text-foreground">
                {row}
              </Text>
            ))}
          />
        </Frame>
      }
      compiled={
        <Frame testId="compiled-frame">
          <CompiledTopBarLayout
            brand={<span className="font-semibold text-foreground">eunomia</span>}
            nav={LINKS.map((label) => (
              <a
                key={label}
                href={`#/${label.toLowerCase()}`}
                className="shrink-0 rounded-md px-3 py-1.5 text-muted-foreground text-sm"
              >
                {label}
              </a>
            ))}
            navLabel="Compiled main"
            action={
              <CompiledButton size="sm" variant="ghost" onClick={signOut}>
                Sign out
              </CompiledButton>
            }
            content={rows("Compiled").map((row) => (
              <p key={row} className="px-4 py-2 text-foreground">
                {row}
              </p>
            ))}
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const banners = canvas.getAllByRole("banner");
    const mains = canvas.getAllByRole("main");
    await expect(banners).toHaveLength(2);
    await expect(mains).toHaveLength(2);

    // The compiled half is the real elements, not a `div` with a role on it.
    const compiledFrame = canvas.getByTestId("compiled-frame");
    const compiledBanner = within(compiledFrame).getByRole("banner");
    await expect(compiledBanner.tagName).toBe("HEADER");
    await expect(within(compiledFrame).getByRole("main").tagName).toBe("MAIN");
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

      // Brand at the start, the links after it, the actions at the end — in reading order and on
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

      // Every link is in the navigation landmark, and the landmark is in the banner.
      await expect(within(nav).getAllByRole("link")).toHaveLength(LINKS.length);
      await expect(banner.contains(nav)).toBe(true);

      // The page is under the bar, not beside it or behind it.
      await expect(main.getBoundingClientRect().top).toBeGreaterThanOrEqual(bannerBox.bottom - 1);
      await expect(within(main).getByText(`${prefix} row 1`)).toBeVisible();
    }

    // The action is the caller's handler, wired through untouched.
    await userEvent.click(within(compiledBanner).getByRole("button", { name: "Sign out" }));
    await expect(signOut).toHaveBeenCalled();

    // On the web the frame scrolls and the bar stays at its top while the rows move under it.
    const before = compiledBanner.getBoundingClientRect().top;
    const firstRow = within(compiledFrame).getByText("Compiled row 1");
    const rowBefore = firstRow.getBoundingClientRect().top;
    compiledFrame.scrollTop = 200;
    await waitFor(() => expect(compiledFrame.scrollTop).toBeGreaterThan(0));
    await expect(firstRow.getBoundingClientRect().top).toBeLessThan(rowBefore - 100);
    await expect(Math.abs(compiledBanner.getBoundingClientRect().top - before)).toBeLessThan(1);
  },
};

/** Six links in a phone's width: the navigation scrolls sideways and the actions stay on screen. */
export const Narrow: Story = {
  render: () => (
    <div className="w-80 bg-background">
      <CompiledTopBarLayout
        brand={<span className="font-semibold text-foreground">eunomia</span>}
        nav={LINKS.map((label) => (
          <a
            key={label}
            href={`#/${label.toLowerCase()}`}
            className="shrink-0 rounded-md px-3 py-1.5 text-muted-foreground text-sm"
          >
            {label}
          </a>
        ))}
        action={
          <CompiledButton size="sm" variant="ghost" onClick={signOut}>
            Sign out
          </CompiledButton>
        }
        content={<p className="px-4 py-2 text-foreground">The page.</p>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const banner = canvas.getByRole("banner");
    const nav = canvas.getByRole("navigation");

    // The links overflow their landmark and scroll inside it rather than widening the bar.
    await expect(nav.scrollWidth).toBeGreaterThan(nav.clientWidth);
    await expect(banner.scrollWidth).toBeLessThanOrEqual(banner.clientWidth);

    // The action is still inside the bar at its end.
    const action = canvas.getByRole("button", { name: "Sign out" }).getBoundingClientRect();
    await expect(action.right).toBeLessThanOrEqual(banner.getBoundingClientRect().right);
  },
};
