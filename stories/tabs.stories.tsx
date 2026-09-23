import type { Meta, StoryObj } from "@storybook/react-vite";
import { useContext } from "react";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { IconClassContext } from "@/components/ui/icons-base";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
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
const meta = { title: "Tabs" } satisfies Meta;
export default meta;
type Story = StoryObj;

function ProbeIcon({ name }: { name: string }) {
  const inherited = useContext(IconClassContext);
  return <span data-testid={`icon-${name}`} data-class={inherited ?? ""} />;
}

export const IconInTrigger: Story = {
  parameters: {
    // Known and not this story's subject: an inactive tab is `text-muted-foreground` on
    // `bg-muted`, shadcn's own pairing and the web half's too, at 4.34:1. That is a token
    // decision for both halves, and it is left to one; everything else axe checks still runs.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
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

    await expect(listIcon.dataset.class).toContain("text-foreground");
    await expect(canvas.getByTestId("icon-board").dataset.class).toContain("text-muted-foreground");
  },
};

/**
 * A tablist with no visible heading over it is named by `aria-label`, which is on the shared
 * contract so a call site written once names it on both halves. The device half puts it on its
 * `role="tablist"` view; the web half hands it to radix's `List`. `aria-labelledby` is the same
 * path, pointed at a heading that is on screen.
 */
export const NamedTablist: Story = {
  parameters: {
    // The inactive-tab contrast, as above.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
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
