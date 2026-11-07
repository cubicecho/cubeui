import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { PageLayout as CompiledPageLayout } from "../compiled/page-layout";
import { PageLayout as NativePageLayout } from "../registry/layout/page-layout";
import { Button as NativeButton } from "../registry/ui/button";

/**
 * `PageLayout`'s header runs the full width of the page while its title keeps the body's column.
 * These rebuild the two screens that wrote the page out by hand for it: a project page with a bar
 * and a notice under its title, and a settings page whose rule runs the width of the screen under
 * a title and tabs held to the reading column.
 */
const meta = { title: "RN Parity/PageLayout", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj;

/** Wider than the reading column, so `prose` is narrower than the page around it. */
const FRAME = 900;
const PROSE = 768;

function Frame({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 bg-background py-2 text-foreground">
      <p className="px-2 font-semibold text-foreground/60 text-xs uppercase">{name}</p>
      <div
        data-frame={name}
        className="h-80 border border-foreground/10"
        style={{ width: FRAME, boxSizing: "content-box" }}
      >
        {children}
      </div>
    </section>
  );
}

/** The part of one half named `slot`, by its `data-slot` or, under react-native-web, its test id. */
function part(frame: HTMLElement, slot: string): HTMLElement {
  const el = frame.querySelector<HTMLElement>(`[data-slot="${slot}"], [data-testid="${slot}"]`);
  if (el === null) {
    throw new Error(`the page should draw ${slot}`);
  }
  return el;
}

function frames(canvasElement: HTMLElement) {
  return ["native", "compiled"].map((name) => {
    const frame = canvasElement.querySelector<HTMLElement>(`[data-frame="${name}"]`);
    if (frame === null) {
      throw new Error(`the ${name} half should render`);
    }
    return frame;
  });
}

const rows = (prefix: string) => Array.from({ length: 20 }, (_, i) => `${prefix} todo ${i + 1}`);

/**
 * telos's project page: the title with its buttons, then a strip of the project's AI state in its
 * own fill, then a pinned notice, all of it the page's width and pinned over the body.
 */
export const BarsUnderTheTitle: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativePageLayout
          title="Launch"
          description="Everything for the spring launch."
          actionSlot={<NativeButton size="sm" variant="outline" content="Edit" />}
          headerBarSlot={
            <>
              <View
                role="region"
                aria-label="Native AI on this project"
                className="flex-row items-center justify-between bg-secondary px-4 py-1.5"
              >
                <Text className="text-foreground text-sm">AI: auto</Text>
                <Text className="text-foreground/60 text-sm">2 agents working</Text>
              </View>
              <View className="px-4 pt-3">
                <Text className="text-foreground/60 text-sm">Saved as a template.</Text>
              </View>
            </>
          }
          contentSlot={rows("Native").map((row) => (
            <Text key={row} className="text-foreground">
              {row}
            </Text>
          ))}
        />
      </Frame>
      <Frame name="compiled">
        <CompiledPageLayout
          title="Launch"
          description="Everything for the spring launch."
          actionSlot={<CompiledButton size="sm" variant="outline" content="Edit" />}
          headerBarSlot={
            <>
              <section
                aria-label="Compiled AI on this project"
                className="flex items-center justify-between bg-secondary px-4 py-1.5"
              >
                <span className="text-foreground text-sm">AI: auto</span>
                <span className="text-foreground/60 text-sm">2 agents working</span>
              </section>
              <p className="px-4 pt-3 text-foreground/60 text-sm">Saved as a template.</p>
            </>
          }
          contentSlot={rows("Compiled").map((row) => (
            <p key={row} className="text-foreground">
              {row}
            </p>
          ))}
        />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [index, frame] of frames(canvasElement).entries()) {
      const half = index === 0 ? "Native" : "Compiled";
      const edge = frame.getBoundingClientRect();
      const header = part(frame, "header-content-footer-header");
      const title = part(frame, "page-header");
      const bar = within(frame).getByRole("region", { name: `${half} AI on this project` });
      const notice = within(frame).getByText("Saved as a template.");

      // The bar runs edge to edge, under the title block and over the notice.
      const box = bar.getBoundingClientRect();
      await expect(box.left).toBeCloseTo(edge.left + 1, 0);
      await expect(box.right).toBeCloseTo(edge.right - 1, 0);
      await expect(box.top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom - 0.5);
      await expect(notice.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom - 0.5);

      // One rule, under the whole header, the width of the page: none on the title block.
      await expect(getComputedStyle(title).borderBottomWidth).toBe("0px");
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
      await expect(header.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);
      await expect(header.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
        notice.getBoundingClientRect().bottom,
      );

      // Pinned with the title: the body is what scrolls under all of it.
      const body = part(frame, "header-content-footer-content");
      await expect(body.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        header.getBoundingClientRect().bottom - 0.5,
      );
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    }
  },
};

/** A row of tabs, standing in for the `Tabs` a settings page holds. */
const TABS = ["Agent", "Servers", "Device"];

/**
 * min-agent's settings: the title and its tabs in the reading column, over panels in the same
 * column, and the rule under them the width of the screen.
 */
export const FullWidthRuleOverAColumn: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativePageLayout
          title="Settings"
          width="prose"
          headerClassName="border-b border-foreground/10"
          headerContentSlot={
            <View testID="tabs" className="flex-row gap-2">
              {TABS.map((tab) => (
                <Text key={tab} className="rounded-md px-3 py-1 text-foreground text-sm">
                  {tab}
                </Text>
              ))}
            </View>
          }
          contentSlot={<Text className="text-foreground">The agent panel.</Text>}
        />
      </Frame>
      <Frame name="compiled">
        <CompiledPageLayout
          title="Settings"
          width="prose"
          headerClassName="border-b border-foreground/10"
          headerContentSlot={
            <div data-testid="tabs" className="flex gap-2">
              {TABS.map((tab) => (
                <span key={tab} className="rounded-md px-3 py-1 text-foreground text-sm">
                  {tab}
                </span>
              ))}
            </div>
          }
          contentSlot={<p className="text-foreground">The agent panel.</p>}
        />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of frames(canvasElement)) {
      const header = part(frame, "header-content-footer-header");
      const title = part(frame, "page-header");
      const body = part(frame, "header-content-footer-content");
      const tabs = part(frame, "tabs");

      // The rule is the header's, and the header is the frame's width.
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
      await expect(header.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);
      await expect(getComputedStyle(title).borderBottomWidth).toBe("0px");

      // The title block and its tabs are in the reading column, over the body's.
      const column = title.getBoundingClientRect();
      await expect(column.width).toBeCloseTo(PROSE, 0);
      await expect(column.left).toBeCloseTo(body.getBoundingClientRect().left, 0);
      await expect(body.getBoundingClientRect().width).toBeCloseTo(PROSE, 0);
      await expect(tabs.getBoundingClientRect().left).toBeCloseTo(
        part(frame, "page-header-title").getBoundingClientRect().left,
        0,
      );
    }
  },
};
