import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus, Users } from "lucide-react";
import { expect } from "storybook/test";
import { PageLayout } from "@/registry/new-york/layout/page-layout";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";

const meta = {
  title: "Layout/PageLayout",
  component: PageLayout,
  parameters: { layout: "fullscreen" },
  decorators: [
    // The chassis divides a height it is given; in an app that is the viewport.
    (Story) => (
      <div className="h-[520px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Actions = () => (
  <>
    <Button size="sm" variant="outline">
      <Download /> Export
    </Button>
    <Button size="sm">
      <Plus /> New workspace
    </Button>
  </>
);

const Rows = ({ count = 40 }: { count?: number }) => (
  <ul className="divide-y">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <li key={n} className="py-3 text-sm">
        Workspace {n}
      </li>
    ))}
  </ul>
);

export const Default: Story = {
  args: {
    title: "Workspaces",
    description: "Each one exposes the servers you choose.",
    icon: <Users />,
    action: <Actions />,
    headerContent: <Input aria-label="Search workspaces" placeholder="Search workspaces" />,
    content: <Rows />,
  },
};

/**
 * The header is pinned and the body scrolls under it — the thing both hand-written `Page`
 * components existed for, and the thing a plain `mx-auto max-w-3xl` div does not do.
 */
export const HeaderStaysWhileTheBodyScrolls: Story = {
  args: { title: "Workspaces", action: <Actions />, content: <Rows /> },
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector("[data-slot=header-content-footer-content]");
    const header = canvasElement.querySelector("[data-slot=page-header]");
    expect(body).not.toBeNull();
    expect(header).not.toBeNull();

    // The body is the scroller, not the page.
    expect(body?.scrollHeight).toBeGreaterThan((body as HTMLElement).clientHeight);

    const before = header?.getBoundingClientRect().top;
    (body as HTMLElement).scrollTop = 400;
    expect(header?.getBoundingClientRect().top).toBe(before);
  },
};

/**
 * `width` is the prop the two hand-written versions each answered with a `wide` boolean, and
 * then answered differently. Three names, and the header and body always share one of them.
 */
export const WidthIsAWordNotANumber: Story = {
  args: { title: "Settings", width: "prose", content: <Rows count={12} /> },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector(
      "[data-slot=header-content-footer-header]",
    ) as HTMLElement;
    const body = canvasElement.querySelector(
      "[data-slot=header-content-footer-content]",
    ) as HTMLElement;
    // The seam: the header carries its own px-4 and the body is given a matching one, so the
    // title sits directly above the first row rather than 16px left of it.
    expect(header.getBoundingClientRect().width).toBe(body.getBoundingClientRect().width);
    // `page-header` and `hcf-content` are the two padded boxes; what has to line up is what
    // they hold. The header's own `px-4` is the inset, and the body is given a matching one.
    expect(
      canvasElement.querySelector("[data-slot=page-header-title]")?.getBoundingClientRect().left,
    ).toBe(canvasElement.querySelector("li")?.getBoundingClientRect().left);
  },
};

/** Only the title waits. The buttons and the search field stay usable while the name loads. */
export const Loading: Story = {
  args: {
    title: "Workspaces",
    description: "Each one exposes the servers you choose.",
    action: <Actions />,
    headerContent: <Input aria-label="Search workspaces" placeholder="Search workspaces" />,
    loading: true,
    content: <Rows count={4} />,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=page-header]")).toHaveAttribute("aria-busy");
    expect(canvasElement.querySelector("input")).toBeEnabled();
    expect(canvasElement.querySelectorAll("button")).toHaveLength(2);
  },
};

/** A footer is pinned under the body, not parked at the end of the rows. */
export const WithFooter: Story = {
  args: {
    title: "Workspaces",
    content: <Rows />,
    footer: (
      <div className="flex items-center justify-between py-3 text-muted-foreground text-sm">
        <span>40 workspaces</span>
        <Button size="sm" variant="outline">
          Load more
        </Button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const footer = canvasElement.querySelector(
      "[data-slot=header-content-footer-footer]",
    ) as HTMLElement;
    const body = canvasElement.querySelector(
      "[data-slot=header-content-footer-content]",
    ) as HTMLElement;
    expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      body.getBoundingClientRect().bottom - 1,
    );
  },
};
