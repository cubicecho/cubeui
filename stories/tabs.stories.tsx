import type { Meta, StoryObj } from "@storybook/react-vite";
import { useContext } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { IconClassContext } from "@/components/ui/icons-base";
import { Badge as CompiledBadge } from "../compiled/badge";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import { Badge } from "../registry/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../registry/ui/tabs.tsx";
import { SideBySide } from "./side-by-side";

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

    await expect(listIcon.dataset.class).toContain("text-active-foreground");
    await expect(canvas.getByTestId("icon-board").dataset.class).toContain("text-foreground/60");
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
