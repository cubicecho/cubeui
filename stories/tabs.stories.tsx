import type { Meta, StoryObj } from "@storybook/react-vite";
import { useContext } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IconClassContext } from "@/components/ui/icons-base";
import { Badge as CompiledBadge } from "../compiled/badge";
import { Button as CompiledButton } from "../compiled/button";
import { Input as CompiledInput } from "../compiled/input";
import { PageLayout as CompiledPageLayout } from "../compiled/page-layout";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import { PageLayout } from "../registry/layout/page-layout";
import { Badge } from "../registry/ui/badge.tsx";
import { Button } from "../registry/ui/button";
import { Input } from "../registry/ui/input.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../registry/ui/tabs.tsx";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * The device trigger used to put everything it was given inside one `<Text>`, so an icon beside a
 * tab's label landed in a `<Text>` (not valid for an SVG on device) and could not take the tab's
 * colour, which does not inherit off the web. These stories say the icon now sits in the row beside
 * the label, and is handed the active or inactive colour the label wears.
 *
 * The native half is imported by its full name because Vite would otherwise resolve `tabs.web.tsx`.
 * The icon is a probe rather than one from `@cubeui/icons`: here that module is the web half, which
 * ignores the context by design, so the probe reads the context directly and reports it.
 */
const meta = { title: "RN Parity/Tabs" } satisfies Meta;
export default meta;
type Story = StoryObj;

function ProbeIcon({ name }: { name: string }) {
  const inherited = useContext(IconClassContext);
  return <span data-testid={`icon-${name}`} data-class={inherited ?? ""} />;
}

export const IconInTrigger: Story = {
  render: () => (
    <div className="bg-background p-6">
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <ProbeIcon name="list" /> List
          </TabsTrigger>
          <TabsTrigger value="board">
            <ProbeIcon name="board" />
            Board {3}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Text className="text-foreground">The list.</Text>
        </TabsContent>
        <TabsContent value="board">
          <Text className="text-foreground">The board.</Text>
        </TabsContent>
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tab", { name: "List" });
    const board = canvas.getByRole("tab", { name: "Board 3" });

    // In the row, not inside the label's text element.
    const listIcon = canvas.getByTestId("icon-list");
    await expect(listIcon.parentElement).toBe(list);
    await expect(canvas.getByTestId("icon-board").parentElement).toBe(board);

    // The run of strings and numbers stays one label.
    await expect(within(board).getByText("Board 3")).toBeInTheDocument();

    // The active tab's icon in the chosen ink, `foreground`, and the other's in the quiet step.
    await expect(listIcon.dataset.class?.split(" ")).toContain("text-foreground");
    await expect(canvas.getByTestId("icon-board").dataset.class?.split(" ")).toContain(
      "text-foreground/60",
    );
    await expect(canvas.getByTestId("icon-board").dataset.class?.split(" ")).not.toContain(
      "text-foreground",
    );
  },
};

/**
 * A tablist with no visible heading over it is named by `aria-label`, which is on the shared
 * contract so a call site written once names it on both halves. The device half puts it on its
 * `role="tablist"` view; the web half hands it to radix's `List`. `aria-labelledby` is the same
 * path, pointed at a heading that is on screen.
 */
export const NamedTablist: Story = {
  render: () => (
    <SideBySide
      native={
        <Tabs defaultValue="list">
          <TabsList aria-label="Project view">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <Text className="text-foreground">The list.</Text>
          </TabsContent>
          <Text nativeID="native-heading" className="text-foreground">
            Native range
          </Text>
          <TabsList aria-labelledby="native-heading">
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      }
      compiled={
        <CompiledTabs defaultValue="list">
          <CompiledTabsList aria-label="Compiled project view">
            <CompiledTabsTrigger value="list">List</CompiledTabsTrigger>
            <CompiledTabsTrigger value="board">Board</CompiledTabsTrigger>
          </CompiledTabsList>
          <CompiledTabsContent value="list">The list.</CompiledTabsContent>
          <p id="compiled-heading">Compiled range</p>
          <CompiledTabsList aria-labelledby="compiled-heading">
            <CompiledTabsTrigger value="week">Week</CompiledTabsTrigger>
          </CompiledTabsList>
        </CompiledTabs>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist", { name: "Project view" })).toBeInTheDocument();
    await expect(canvas.getByRole("tablist", { name: "Native range" })).toBeInTheDocument();
    await expect(
      canvas.getByRole("tablist", { name: "Compiled project view" }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("tablist", { name: "Compiled range" })).toBeInTheDocument();
  },
};

const sections = ["General", "Appearance", "Servers", "Models", "Shortcuts", "Privacy", "Device"];

/** Seven tabs in a frame as wide as a phone, opened on the last one. */
function ManyTabs({ half }: { half: "native" | "compiled" }) {
  const [Root, List, Trigger, Content] =
    half === "native"
      ? [Tabs, TabsList, TabsTrigger, TabsContent]
      : [CompiledTabs, CompiledTabsList, CompiledTabsTrigger, CompiledTabsContent];
  return (
    <div data-testid={`${half}-frame`} style={{ width: 320 }}>
      <Root defaultValue="Device">
        <List aria-label={`${half} settings`}>
          {sections.map((section) => (
            <Trigger key={section} value={section}>
              {section}
            </Trigger>
          ))}
        </List>
        {/* A tab names the pane it controls, so each one has a pane to name. */}
        {sections.map((section) => (
          <Content key={section} value={section}>
            {half === "native" ? <Text className="text-foreground">{section}</Text> : section}
          </Content>
        ))}
      </Root>
    </div>
  );
}

/**
 * More tabs than the screen is wide (#242). The list used to run off the edge with no way to
 * reach the last tabs; now it stays inside what it was given and scrolls sideways, and the
 * selected tab is brought into view — at mount, where a link chose it, and when another is picked.
 */
export const MoreTabsThanFit: Story = {
  render: () => (
    <SideBySide native={<ManyTabs half="native" />} compiled={<ManyTabs half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      const frame = within(canvasElement).getByTestId(`${half}-frame`);
      const list = within(frame).getByRole("tablist");
      const tab = (name: string) => within(frame).getByRole("tab", { name });
      /** Whether the tab is wholly inside the list's box, to the pixel. */
      const shown = (name: string) => {
        const box = list.getBoundingClientRect();
        const span = tab(name).getBoundingClientRect();
        return span.left >= box.left - 1 && span.right <= box.right + 1;
      };

      // The list is no wider than its frame.
      await expect({ half, width: Math.round(list.getBoundingClientRect().width) }).toEqual({
        half,
        width: 320,
      });

      // Opened on the last tab, which is in view; the first has scrolled off.
      await waitFor(() =>
        expect({ half, device: shown("Device") }).toEqual({ half, device: true }),
      );
      await expect({ half, general: shown("General") }).toEqual({ half, general: false });

      // Chosen from the keyboard or a press, a tab off the start comes back.
      await userEvent.click(tab("General"));
      await expect(tab("General")).toHaveAttribute("aria-selected", "true");
      await waitFor(() =>
        expect({ half, general: shown("General") }).toEqual({ half, general: true }),
      );
    }
  },
};

/** Tabs that fit are where they were: centred in a list given more room than they need. */
export const FewTabsStayCentred: Story = {
  render: () => (
    <SideBySide
      native={
        <Tabs defaultValue="list">
          <TabsList aria-label="Native view" className="w-80">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <Text className="text-foreground">The list.</Text>
          </TabsContent>
          <TabsContent value="board">
            <Text className="text-foreground">The board.</Text>
          </TabsContent>
        </Tabs>
      }
      compiled={
        <CompiledTabs defaultValue="list">
          <CompiledTabsList aria-label="Compiled view" className="w-80">
            <CompiledTabsTrigger value="list">List</CompiledTabsTrigger>
            <CompiledTabsTrigger value="board">Board</CompiledTabsTrigger>
          </CompiledTabsList>
          <CompiledTabsContent value="list">The list.</CompiledTabsContent>
          <CompiledTabsContent value="board">The board.</CompiledTabsContent>
        </CompiledTabs>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const name of ["Native view", "Compiled view"]) {
      const list = within(canvasElement).getByRole("tablist", { name });
      const box = list.getBoundingClientRect();
      const [first, last] = within(list)
        .getAllByRole("tab")
        .map((tab) => tab.getBoundingClientRect());
      if (!first || !last) {
        throw new Error("expected two tabs");
      }
      const before = first.left - box.left;
      const after = box.right - last.right;
      await expect({ name, centred: Math.abs(before - after) <= 1 }).toEqual({
        name,
        centred: true,
      });
    }
  },
};

/**
 * `trailingSlot` is the far end of a tab (#242): a dot for a server in error. The dot is a `Badge`
 * with a `label`, so it is in the tab's name on both halves, after the label and inside the tab.
 */
export const TrailingMark: Story = {
  render: () => (
    <SideBySide
      native={
        <Tabs defaultValue="general">
          <TabsList aria-label="Native settings">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger
              value="device"
              trailingSlot={<Badge variant="destructive" label="Server error" />}
            >
              Device
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Text className="text-foreground">General.</Text>
          </TabsContent>
        </Tabs>
      }
      compiled={
        <CompiledTabs defaultValue="general">
          <CompiledTabsList aria-label="Compiled settings">
            <CompiledTabsTrigger value="general">General</CompiledTabsTrigger>
            <CompiledTabsTrigger
              value="device"
              trailingSlot={<CompiledBadge variant="destructive" label="Server error" />}
            >
              Device
            </CompiledTabsTrigger>
          </CompiledTabsList>
          <CompiledTabsContent value="general">General.</CompiledTabsContent>
        </CompiledTabs>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const name of ["Native settings", "Compiled settings"]) {
      const list = within(canvasElement).getByRole("tablist", { name });
      const tab = within(list).getByRole("tab", { name: /^Device,? Server error$/ });
      const mark = within(tab).getByRole("img", { name: "Server error" });
      const box = tab.getBoundingClientRect();
      const dot = mark.getBoundingClientRect();
      // `name` rides along so a failure names which half broke.
      await expect({
        name,
        // The label is a bare text node on the web half, so the dot is placed against the tab.
        afterLabel: dot.left > box.left + box.width / 2,
        inside: dot.right <= box.right && dot.top >= box.top && dot.bottom <= box.bottom,
      }).toEqual({ name, afterLabel: true, inside: true });
    }
  },
};

/** Where each link was followed to. The story holds the navigation back: the test runner is a page. */
const followed: string[] = [];

const ROUTES = [
  { value: "general", label: "General" },
  { value: "agents", label: "Agents" },
  { value: "servers", label: "Servers" },
];

function RouteTabs({ half, kit }: { half: string; kit: "native" | "compiled" }) {
  const [Root, List, Trigger, Content] =
    kit === "native"
      ? [Tabs, TabsList, TabsTrigger, TabsContent]
      : [CompiledTabs, CompiledTabsList, CompiledTabsTrigger, CompiledTabsContent];
  return (
    <Root defaultValue="general">
      <List aria-label={`${half} settings`}>
        {ROUTES.map((route) => (
          <Trigger
            key={route.value}
            value={route.value}
            linkSlot={
              <a
                href={`#${half.toLowerCase()}-${route.value}`}
                onClick={(event) => {
                  followed.push(event.currentTarget.getAttribute("href") ?? "");
                  event.preventDefault();
                }}
              />
            }
          >
            {route.label}
          </Trigger>
        ))}
      </List>
      {ROUTES.map((route) => (
        <Content key={route.value} value={route.value}>
          <Text className="text-foreground">{`${half} ${route.label} page`}</Text>
        </Content>
      ))}
    </Root>
  );
}

/**
 * `linkSlot` on a trigger (#365): a tab that is a route is drawn as the link, with an `href` to
 * middle-click or open in a new tab, and keeps the tab's role, its selected state and its place in
 * the tablist. A press follows the link and selects the tab.
 */
export const RouteTabsAreLinks: Story = {
  render: () => (
    <SideBySide
      native={<RouteTabs half="Native" kit="native" />}
      compiled={<RouteTabs half="Compiled" kit="compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const list = canvas.getByRole("tablist", { name: `${half} settings` });
        const tabs = within(list);
        const general = tabs.getByRole("tab", { name: "General" });
        const agents = tabs.getByRole("tab", { name: "Agents" });

        await expect(agents.tagName).toBe("A");
        await expect(agents).toHaveAttribute("href", `#${half.toLowerCase()}-agents`);
        await expect(agents).not.toHaveAttribute("type");
        await expect(general).toHaveAttribute("aria-selected", "true");
        await expect(agents).toHaveAttribute("aria-selected", "false");

        followed.length = 0;
        await userEvent.click(agents);
        await waitFor(() => expect(agents).toHaveAttribute("aria-selected", "true"));
        await expect(general).toHaveAttribute("aria-selected", "false");
        // The press reached the link, which is what follows it.
        await expect(followed).toEqual([`#${half.toLowerCase()}-agents`]);
        await expect(canvas.getByText(`${half} Agents page`)).toBeVisible();
      });
    }
  },
};

function TabbedPage({ half, kit }: { half: string; kit: "native" | "compiled" }) {
  const [Root, List, Trigger, Content, Page] =
    kit === "native"
      ? [Tabs, TabsList, TabsTrigger, TabsContent, PageLayout]
      : [
          CompiledTabs,
          CompiledTabsList,
          CompiledTabsTrigger,
          CompiledTabsContent,
          CompiledPageLayout,
        ];
  return (
    <div data-testid={`${half}-frame`} className="h-80 border border-foreground/10">
      <Root defaultValue="general" className="h-full">
        <Page
          title={`${half} settings`}
          headerContentSlot={
            <List aria-label={`${half} sections`}>
              <Trigger value="general">General</Trigger>
              <Trigger value="agents">Agents</Trigger>
            </List>
          }
          contentSlot={
            <>
              <Content value="general">
                <Text className="text-foreground">{`${half} general body`}</Text>
              </Content>
              <Content value="agents">
                <Text className="text-foreground">{`${half} agents body`}</Text>
              </Content>
            </>
          }
        />
      </Root>
    </div>
  );
}

/**
 * The tab list in a page's header and the panels in its body (#365), as one set of tabs: one `Tabs`
 * root around the whole `PageLayout`, given `h-full` so the page still fills its frame. No
 * `display: contents` wrapper.
 */
export const TabsAcrossAPage: Story = {
  render: () => (
    <SideBySide
      native={<TabbedPage half="Native" kit="native" />}
      compiled={<TabbedPage half="Compiled" kit="compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const frame = canvas.getByTestId(`${half}-frame`);
        const root = frame.firstElementChild as HTMLElement;
        const page = root.firstElementChild as HTMLElement;
        // The page fills the frame, as it would without the root around it.
        await expect(page.getBoundingClientRect().height).toBeCloseTo(
          frame.getBoundingClientRect().height - 2,
          0,
        );

        const tabs = within(canvas.getByRole("tablist", { name: `${half} sections` }));
        await userEvent.click(tabs.getByRole("tab", { name: "Agents" }));
        await expect(within(frame).getByText(`${half} agents body`)).toBeVisible();
        await expect(within(frame).queryByText(`${half} general body`)).toBeNull();
        if (half === "Compiled") {
          // One root, so radix's ids pair the panel in the body with the tab in the header.
          const panel = within(frame).getByRole("tabpanel");
          await expect(panel).toHaveAccessibleName("Agents");
        }
      });
    }
  },
};

/** Three tabs in a column much wider than they are, on each half, with one disabled. */
function FewTabs({ half }: { half: "native" | "compiled" }) {
  const [Root, List, Trigger, Content] =
    half === "native"
      ? [Tabs, TabsList, TabsTrigger, TabsContent]
      : [CompiledTabs, CompiledTabsList, CompiledTabsTrigger, CompiledTabsContent];
  const views = ["List", "Board", "Calendar", "Timeline"];
  return (
    <div data-testid={`${half}-column`} className="flex w-[32rem] flex-col">
      <button type="button" className="sr-only">
        Before {half}
      </button>
      <Root defaultValue="List">
        <List aria-label={`${half} layout`}>
          {views.map((view) => (
            <Trigger key={view} value={view} disabled={view === "Calendar"}>
              {view}
            </Trigger>
          ))}
        </List>
        {views.map((view) => (
          <Content key={view} value={view}>
            {half === "native" ? <Text className="text-foreground">{view} pane</Text> : view}
          </Content>
        ))}
      </Root>
    </div>
  );
}

/**
 * A list as wide as its tabs, on both halves (#472). The device list filled its column and centred
 * its tabs in it, where the web's `inline-flex` list hugged them. A caller who wants it across
 * passes `self-stretch` or a width, as `FewTabsStayCentred` does.
 */
export const ListIsAsWideAsItsTabs: Story = {
  render: () => (
    <SideBySide native={<FewTabs half="native" />} compiled={<FewTabs half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      const column = within(canvasElement).getByTestId(`${half}-column`);
      const list = within(column).getByRole("tablist").getBoundingClientRect();
      const tabs = within(column)
        .getAllByRole("tab")
        .map((tab) => tab.getBoundingClientRect());
      const first = tabs[0];
      const last = tabs.at(-1);
      if (!first || !last) {
        throw new Error("expected tabs");
      }
      // Started at the column's start, and no wider than the tabs and the list's own `p-1` and
      // border.
      await expect({
        half,
        start: Math.round(list.left - column.getBoundingClientRect().left),
      }).toEqual({ half, start: 0 });
      await expect({
        half,
        slack: Math.round(list.width - (last.right - first.left)) <= 10,
      }).toEqual({ half, slack: true });
    }
  },
};

/**
 * ARIA's tabs pattern on both halves (#472): the list is one tab stop, on the selected tab, and
 * Left and Right move to the next enabled tab and show it, wrapping, with Home and End. The device
 * half had a stop per tab and no arrows; that is only felt in an Expo web app, since a phone has no
 * Tab key, and the stops are set on the web only so a screen reader there still walks every tab.
 */
export const OneTabStop: Story = {
  render: () => (
    <SideBySide native={<FewTabs half="native" />} compiled={<FewTabs half="compiled" />} />
  ),
  play: async ({ canvasElement, step }) => {
    for (const half of ["native", "compiled"] as const) {
      await step(half, async () => {
        const column = within(within(canvasElement).getByTestId(`${half}-column`));
        const tab = (name: string) => column.getByRole("tab", { name });
        const onATab = () => document.activeElement?.getAttribute("role") === "tab";

        // Tab lands on the selected tab, and the next Tab leaves the list.
        column.getByRole("button", { name: `Before ${half}` }).focus();
        await userEvent.tab();
        await waitFor(() => expect(tab("List")).toHaveFocus());
        await userEvent.tab();
        await expect({ half, onATab: onATab() }).toEqual({ half, onATab: false });
        await userEvent.tab({ shift: true });
        await waitFor(() => expect(tab("List")).toHaveFocus());

        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(tab("Board")).toHaveAttribute("aria-selected", "true"));
        await expect(tab("Board")).toHaveFocus();
        // The stop moved with it: from before the list, Tab lands on Board now.
        column.getByRole("button", { name: `Before ${half}` }).focus();
        await userEvent.tab();
        await waitFor(() => expect(tab("Board")).toHaveFocus());

        // The disabled tab is stepped over.
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(tab("Timeline")).toHaveAttribute("aria-selected", "true"));
        await expect(tab("Timeline")).toHaveFocus();
        await expect(column.getByRole("tabpanel")).toHaveTextContent(/Timeline/);

        // Round from the last to the first, and back with Left; Home and End reach the ends.
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(tab("List")).toHaveFocus());
        await userEvent.keyboard("{ArrowLeft}");
        await waitFor(() => expect(tab("Timeline")).toHaveFocus());
        await userEvent.keyboard("{Home}");
        await waitFor(() => expect(tab("List")).toHaveFocus());
        await userEvent.keyboard("{End}");
        await waitFor(() => expect(tab("Timeline")).toHaveFocus());

        // Up and Down are left to the page.
        await userEvent.keyboard("{ArrowDown}");
        await expect(tab("Timeline")).toHaveFocus();
        await userEvent.keyboard("{Home}");
        await waitFor(() => expect(tab("List")).toHaveAttribute("aria-selected", "true"));
      });
    }
  },
};

/**
 * The pane is a tab stop on both halves (#510), as radix's is: the Tab after the list lands on the
 * pane, so a keyboard reaches its text even when nothing in it takes focus. The device pane was
 * stepped over under Expo web. Focused, its edge turns `active` (#527), as a scroll box's does: it
 * showed nothing, so a keyboard user could not see where focus had gone.
 */
export const PaneIsATabStop: Story = {
  render: () => (
    <SideBySide native={<FewTabs half="native" />} compiled={<FewTabs half="compiled" />} />
  ),
  play: async ({ canvasElement, step }) => {
    for (const half of ["native", "compiled"] as const) {
      await step(half, async () => {
        const column = within(within(canvasElement).getByTestId(`${half}-column`));
        column.getByRole("button", { name: `Before ${half}` }).focus();
        await userEvent.tab();
        await waitFor(() => expect(column.getByRole("tab", { name: "List" })).toHaveFocus());
        const panel = column.getByRole("tabpanel");
        await expect(getComputedStyle(panel).borderTopColor).toBe("rgba(0, 0, 0, 0)");
        await userEvent.tab();
        await waitFor(() => expect(panel).toHaveFocus());
        await expect(getComputedStyle(panel).borderTopColor).toBe(tokenColor("active"));
      });
    }
  },
};

/** A control's height on the web: an `Input`'s, a `Select`'s and a default `Button`'s. */
const CONTROL_HEIGHT = 40;
/** The list's frame around a tab: `p-1` and a 1px border, each side. */
const LIST_FRAME = 10;

/** Tabs beside a search field and a button, as a toolbar of controls lays them out. */
function TabsBesideControls({ half }: { half: "native" | "compiled" }) {
  const [Root, List, Trigger, Content, Field, Action] =
    half === "native"
      ? [Tabs, TabsList, TabsTrigger, TabsContent, Input, Button]
      : [
          CompiledTabs,
          CompiledTabsList,
          CompiledTabsTrigger,
          CompiledTabsContent,
          CompiledInput as typeof Input,
          CompiledButton as typeof Button,
        ];
  const views = ["Open", "Closed"];
  return (
    <div data-testid={`${half}-toolbar`} className="flex flex-col items-start gap-2">
      <Root defaultValue="open">
        <List aria-label={`${half} filter`}>
          {views.map((view) => (
            <Trigger key={view} value={view.toLowerCase()}>
              {view}
            </Trigger>
          ))}
        </List>
        {views.map((view) => (
          <Content key={view} value={view.toLowerCase()}>
            {half === "native" ? <Text className="text-foreground">{view} issues</Text> : view}
          </Content>
        ))}
      </Root>
      <Field aria-label={`${half} search`} placeholder="Search issues" />
      <Action content="Export" />
    </div>
  );
}

/**
 * A tab is the height of the controls beside it on the web, 40px (#521). It was 32px inside a 40px
 * frame, the size of an `Input`'s box, so the tabs over a search field were a row of smaller
 * targets than the field. The frame now grows around the tab rather than holding it to 32px.
 */
export const TriggersMatchControls: Story = {
  render: () => (
    <SideBySide
      native={<TabsBesideControls half="native" />}
      compiled={<TabsBesideControls half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["native", "compiled"] as const) {
      const field = canvas.getByRole("textbox", { name: `${half} search` });
      const action = within(canvas.getByTestId(`${half}-toolbar`)).getByRole("button", {
        name: "Export",
      });
      await expect({ half, field: Math.round(field.getBoundingClientRect().height) }).toEqual({
        half,
        field: CONTROL_HEIGHT,
      });
      await expect({ half, action: Math.round(action.getBoundingClientRect().height) }).toEqual({
        half,
        action: CONTROL_HEIGHT,
      });
      const list = canvas.getByRole("tablist", { name: `${half} filter` }).getBoundingClientRect();
      for (const name of ["Open", "Closed"]) {
        const tab = within(canvas.getByRole("tablist", { name: `${half} filter` }))
          .getByRole("tab", { name })
          .getBoundingClientRect();
        await expect({ half, name, tab: Math.round(tab.height) }).toEqual({
          half,
          name,
          tab: CONTROL_HEIGHT,
        });
      }
      await expect({ half, list: Math.round(list.height) }).toEqual({
        half,
        list: CONTROL_HEIGHT + LIST_FRAME,
      });
    }
  },
};
