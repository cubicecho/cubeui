import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Sidebar, SidebarNavItem, SidebarSection } from "@/components/sidebar";

/**
 * `Sidebar`, as installed beside it by `@cubeui/sidebar-stories`. It is a `registry:component`, so
 * this file lands in `components/` beside it rather than in `components/ui/`.
 *
 * What it holds is the structure, not the palette: whichever colours an app gives `--sidebar`, the
 * column has to stay a named landmark, a section's rows a list named by its title, every row a
 * link, and the row for the page on screen `aria-current="page"`.
 */
const meta = {
  title: "cubeui/Sidebar",
  component: Sidebar,
  decorators: [
    (Story) => (
      <div className="flex h-96 bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Workspace",
    header: <span className="font-semibold">Acme</span>,
    content: (
      <SidebarSection
        title="Projects"
        content={[
          <SidebarNavItem key="inbox" href="#/inbox" label="Inbox" count={12} />,
          <SidebarNavItem key="launch" href="#/launch" label="Launch plan" count={3} active />,
          <SidebarNavItem key="garden" href="#/garden" label="Garden" />,
        ]}
      />
    ),
    footer: <SidebarNavItem href="#/settings" label="Settings" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("complementary", { name: "Workspace" })).toBeInTheDocument();

    const list = canvas.getByRole("list", { name: "Projects" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);

    const current = canvas.getByRole("link", { current: "page" });
    await expect(current).toHaveAccessibleName(/Launch plan/);
    await expect(current.getAttribute("href")).toBe("#/launch");
    await expect(canvas.getAllByRole("link", { current: false })).toHaveLength(3);

    // The footer row is outside the list: a row with no list around it is not a list item.
    await expect(canvas.getByRole("link", { name: "Settings" }).closest("li")).toBeNull();
  },
};
