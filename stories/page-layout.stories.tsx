import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  PageLayout as CompiledPageLayout,
  titleColumn as compiledTitleColumn,
} from "../compiled/page-layout";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import {
  PageLayout as NativePageLayout,
  titleColumn as nativeTitleColumn,
} from "../registry/layout/page-layout";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Tabs as NativeTabs,
  TabsContent as NativeTabsContent,
  TabsList as NativeTabsList,
  TabsTrigger as NativeTabsTrigger,
} from "../registry/ui/tabs.tsx";

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

function Frame({
  name,
  width = FRAME,
  children,
}: {
  name: string;
  width?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 bg-background py-2 text-foreground">
      <p className="px-2 font-semibold text-foreground/60 text-xs uppercase">{name}</p>
      <div
        data-frame={name}
        className="h-80 border border-foreground/10"
        style={{ width, boxSizing: "content-box" }}
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
              <View role="region" aria-label="Native AI on this project" className="bg-secondary">
                <View
                  className={`${nativeTitleColumn()} flex-row items-center justify-between py-1.5`}
                >
                  <Text className="text-foreground text-sm">AI: auto</Text>
                  <Text className="text-foreground/60 text-sm">2 agents working</Text>
                </View>
              </View>
              <View className={`${nativeTitleColumn()} pt-3`}>
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
              <section aria-label="Compiled AI on this project" className="bg-secondary">
                <div
                  className={`${compiledTitleColumn()} flex items-center justify-between py-1.5`}
                >
                  <span className="text-foreground text-sm">AI: auto</span>
                  <span className="text-foreground/60 text-sm">2 agents working</span>
                </div>
              </section>
              <p className={`${compiledTitleColumn()} pt-3 text-foreground/60 text-sm`}>
                Saved as a template.
              </p>
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

/** The page widths a bar's content is held to, and a phone's frame at the reading column. */
const BAR_CASES = [
  { width: "prose", frame: FRAME },
  { width: "page", frame: FRAME },
  { width: "full", frame: FRAME },
  { width: "prose", frame: 390 },
] as const;

type PageWidth = (typeof BAR_CASES)[number]["width"];

/** A billing notice in `headerBarSlot`: its fill on the outer box, its words in the title's column. */
function NoticeBar({
  half,
  width,
  label,
}: {
  half: "native" | "compiled";
  width: PageWidth;
  label: string;
}) {
  if (half === "native") {
    return (
      <View role="region" aria-label={label} className="bg-warning/10">
        <View className={`${nativeTitleColumn(width)} py-2`}>
          <Text testID="notice-text" className="text-foreground text-sm">
            Your card was declined.
          </Text>
        </View>
      </View>
    );
  }
  return (
    <section aria-label={label} className="bg-warning/10">
      <div className={`${compiledTitleColumn(width)} py-2`}>
        <p data-testid="notice-text" className="text-foreground text-sm">
          Your card was declined.
        </p>
      </div>
    </section>
  );
}

/**
 * A bar's fill runs the width of the page and its words start under the title, at every `width`
 * and at a phone's (#483). A bar told to inset itself `px-4` lined up only while the page was
 * narrower than its column: at `prose` in a wide window its text sat at the window's edge, 66px
 * left of the title.
 */
export const BarOnTheTitlesColumn: Story = {
  render: () => (
    <div>
      {BAR_CASES.flatMap(({ width, frame }) =>
        (["native", "compiled"] as const).map((half) => {
          const Page = half === "native" ? NativePageLayout : CompiledPageLayout;
          const name = `${half} ${width} ${frame}`;
          return (
            <Frame key={name} name={name} width={frame}>
              <Page
                title="Billing"
                width={width}
                headerBarSlot={<NoticeBar half={half} width={width} label={`Notice, ${name}`} />}
                contentSlot={
                  half === "native" ? (
                    <Text className="text-foreground">Invoices.</Text>
                  ) : (
                    <p className="text-foreground">Invoices.</p>
                  )
                }
              />
            </Frame>
          );
        }),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { width, frame } of BAR_CASES) {
      for (const half of ["native", "compiled"]) {
        const name = `${half} ${width} ${frame}`;
        const box = canvasElement.querySelector<HTMLElement>(`[data-frame="${name}"]`);
        if (box === null) {
          throw new Error(`the ${name} frame should render`);
        }
        const edge = box.getBoundingClientRect();
        const bar = within(box).getByRole("region", { name: `Notice, ${name}` });
        const fill = bar.getBoundingClientRect();
        const text = part(box, "notice-text").getBoundingClientRect();
        const title = part(box, "page-header-title").getBoundingClientRect();

        // The fill is the page's width, inside the frame's 1px border.
        await expect({ name, left: fill.left - edge.left, right: edge.right - fill.right }).toEqual(
          { name, left: 1, right: 1 },
        );
        // The words start where the title does.
        await expect({ name, x: Math.round(text.left) }).toEqual({
          name,
          x: Math.round(title.left),
        });
      }
    }
  },
};

/** The settings page's sections, as real tabs with the first one chosen (#489). */
const TABS = ["Agent", "Servers", "Device"];

/**
 * min-agent's settings: the title and its tabs in the reading column, over panels in the same
 * column, and the rule under them the width of the screen. One `Tabs` root around the page, as
 * the skill writes it.
 */
export const FullWidthRuleOverAColumn: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativeTabs defaultValue="Agent" className="h-full">
          <NativePageLayout
            title="Settings"
            width="prose"
            headerClassName="border-b border-foreground/10"
            headerContentSlot={
              <View testID="tab-row">
                <NativeTabsList aria-label="Native settings">
                  {TABS.map((tab) => (
                    <NativeTabsTrigger key={tab} value={tab}>
                      {tab}
                    </NativeTabsTrigger>
                  ))}
                </NativeTabsList>
              </View>
            }
            contentSlot={
              <NativeTabsContent value="Agent">
                <Text className="text-foreground">The agent panel.</Text>
              </NativeTabsContent>
            }
          />
        </NativeTabs>
      </Frame>
      <Frame name="compiled">
        <CompiledTabs defaultValue="Agent" className="h-full">
          <CompiledPageLayout
            title="Settings"
            width="prose"
            headerClassName="border-b border-foreground/10"
            headerContentSlot={
              <div data-testid="tab-row">
                <CompiledTabsList aria-label="Compiled settings">
                  {TABS.map((tab) => (
                    <CompiledTabsTrigger key={tab} value={tab}>
                      {tab}
                    </CompiledTabsTrigger>
                  ))}
                </CompiledTabsList>
              </div>
            }
            contentSlot={
              <CompiledTabsContent value="Agent">
                <p className="text-foreground">The agent panel.</p>
              </CompiledTabsContent>
            }
          />
        </CompiledTabs>
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of frames(canvasElement)) {
      const header = part(frame, "header-content-footer-header");
      const title = part(frame, "page-header");
      const scroller = part(frame, "header-content-footer-content");
      const body = part(frame, "header-content-footer-column");
      const tabs = part(frame, "tab-row");
      await expect(within(frame).getByRole("tab", { name: "Agent" })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      // The rule is the header's, and the header is the frame's width.
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
      await expect(header.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);
      await expect(getComputedStyle(title).borderBottomWidth).toBe("0px");

      // The title block and its tabs are in the reading column, over the body's.
      const column = title.getBoundingClientRect();
      await expect(column.width).toBeCloseTo(PROSE, 0);
      await expect(column.left).toBeCloseTo(body.getBoundingClientRect().left, 0);
      await expect(body.getBoundingClientRect().width).toBeCloseTo(PROSE, 0);
      // The column is inside the scroller, and the scroller is the frame's width, so a scrollbar
      // is at the frame's edge rather than the column's (#451).
      await expect(scroller.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);
      await expect(tabs.getBoundingClientRect().left).toBeCloseTo(
        part(frame, "page-header-title").getBoundingClientRect().left,
        0,
      );
    }
  },
};

/** `size` reaches the title: a compact `h1`, and the page's rule under it all the same. */
export const CompactTitle: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativePageLayout
          title="Chats"
          size="sm"
          contentSlot={<Text className="text-foreground">No chat open.</Text>}
        />
      </Frame>
      <Frame name="compiled">
        <CompiledPageLayout
          title="Chats"
          size="sm"
          contentSlot={<p className="text-foreground">No chat open.</p>}
        />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of frames(canvasElement)) {
      const title = within(frame).getByRole("heading", { level: 1, name: "Chats" });
      await expect(getComputedStyle(title).fontSize).toBe("16px");
      const header = part(frame, "header-content-footer-header");
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
    }
  },
};

/**
 * The footer is drawn as the header is: its rule runs the width of the page, and what is in it
 * keeps the body's column. At `prose` the rule was clipped to the 768px column while the header's
 * ran the full width over it (#483).
 */
export const FooterRuleRunsFullWidth: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativePageLayout
          title="Settings"
          width="prose"
          contentSlot={<Text className="text-foreground">The agent panel.</Text>}
          footerSlot={
            <Text testID="saved" className="text-foreground/60 text-sm">
              Last saved 2 minutes ago
            </Text>
          }
        />
      </Frame>
      <Frame name="compiled">
        <CompiledPageLayout
          title="Settings"
          width="prose"
          contentSlot={<p className="text-foreground">The agent panel.</p>}
          footerSlot={
            <p data-testid="saved" className="text-foreground/60 text-sm">
              Last saved 2 minutes ago
            </p>
          }
        />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of frames(canvasElement)) {
      const header = part(frame, "header-content-footer-header");
      const footer = part(frame, "header-content-footer-footer");
      const body = part(frame, "header-content-footer-column");

      // Both rules are the frame's width.
      await expect(getComputedStyle(footer).borderTopWidth).toBe("1px");
      await expect(footer.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);
      await expect(header.getBoundingClientRect().width).toBeCloseTo(FRAME, 0);

      // What is in the footer starts where the body's text does, in the reading column.
      const saved = part(frame, "saved").getBoundingClientRect();
      const column = part(frame, "page-layout-footer").getBoundingClientRect();
      await expect(column.width).toBeCloseTo(PROSE, 0);
      await expect(column.left).toBeCloseTo(body.getBoundingClientRect().left, 0);
      await expect(saved.left).toBeCloseTo(
        part(frame, "page-header-title").getBoundingClientRect().left,
        0,
      );
    }
  },
};

/**
 * A `headerContentSlot` of no elements — `filters.map(…)` over no filters — is no slot: the rule
 * under the title stays, as it does with nothing passed, rather than going with an empty row.
 */
export const EmptyHeaderContent: Story = {
  render: () => (
    <div>
      <Frame name="native">
        <NativePageLayout
          title="Servers"
          headerContentSlot={[]}
          contentSlot={<Text className="text-foreground">No filters.</Text>}
        />
      </Frame>
      <Frame name="compiled">
        <CompiledPageLayout
          title="Servers"
          headerContentSlot={[]}
          contentSlot={<p className="text-foreground">No filters.</p>}
        />
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const frame of frames(canvasElement)) {
      const header = part(frame, "header-content-footer-header");
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
      await expect(
        frame.querySelector(
          '[data-slot="page-header-content"], [data-testid="page-header-content"]',
        ),
      ).toBeNull();
    }
  },
};
