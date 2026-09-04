import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus, Users } from "lucide-react";
import { expect } from "storybook/test";
import { HeaderContentFooter } from "@/registry/new-york/layout/header-content-footer";
import { PageHeader } from "@/registry/new-york/layout/page-header";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const Actions = () => (
  <>
    <Button size="sm" variant="outline">
      <Download /> Export
    </Button>
    <Button size="sm">
      <Plus /> New vendor
    </Button>
  </>
);

const Search = () => <Input aria-label="Search vendors" placeholder="Search vendors" />;

const Rows = ({ count = 6 }: { count?: number }) => (
  <ul className="divide-y">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <li key={n} className="py-3 text-sm">
        Vendor {n}
      </li>
    ))}
  </ul>
);

export const Default: Story = {
  args: {
    title: "Vendors",
    description: "Suppliers inventory is purchased from.",
    action: <Actions />,
    content: <Search />,
  },
};

/** Rule 5 — an absent slot draws nothing. No trail, no description, no action, no control row. */
export const TitleOnly: Story = {
  args: { title: "Vendors" },
  play: async ({ canvasElement }) => {
    for (const slot of ["ph-breadcrumbs", "ph-description", "ph-action", "ph-content"]) {
      expect(canvasElement.querySelector(`[data-slot=${slot}]`)).toBeNull();
    }
  },
};

/**
 * The icon arrives bare — `<Users />`, not `<Users className="size-5" />` — and the shell sizes
 * it from the level, so it cannot drift away from the title it sits beside. A status dot goes
 * here too, for the same reason: four of these apps put one in front of a title at four sizes.
 */
export const WithIcon: Story = {
  args: {
    icon: <Users />,
    title: "Vendors",
    description: "The icon arrives unsized and leaves at the level's size.",
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    expect(svg).not.toBeNull();
    if (svg) expect(svg.getBoundingClientRect().width).toBeCloseTo(20, 0);
  },
};

/**
 * The heading level is the caller's, because only the caller knows where the block landed: an
 * `<h1>` inside a card that already sits under a page title is a lie about the document, and an
 * `<h2>` on the page it names is the same lie the other way. The level carries the size with it,
 * so the element and the type scale can never disagree.
 */
export const Levels: StoryObj<typeof PageHeader> = {
  render: () => (
    <div>
      <PageHeader level={1} title="A page" description="Level 1 names the page." />
      <PageHeader level={2} title="A section" description="Level 2 names a pane or a card." />
      <PageHeader level={3} title="A subsection" description="Level 3 goes below that." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const headings = canvasElement.querySelectorAll("[data-slot=ph-title]");
    expect([...headings].map((h) => h.tagName)).toEqual(["H1", "H2", "H3"]);
  },
};

/** A back link is a one-step trail, so it goes where a trail goes and keeps the same inset. */
export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbs: (
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <a className="underline underline-offset-4" href="#vendors">
          Vendors
        </a>
        <span aria-hidden> / </span>
        <span>Acme Supply</span>
      </nav>
    ),
    title: "Acme Supply",
    description: "Vendor since 2019.",
    action: <Actions />,
  },
  play: async ({ canvasElement }) => {
    const trail = canvasElement.querySelector<HTMLElement>("[data-slot=ph-breadcrumbs]");
    const row = canvasElement.querySelector<HTMLElement>("[data-slot=ph-title-row]");
    expect(trail).not.toBeNull();
    expect(row).not.toBeNull();
    if (!trail || !row) return;

    // The trail is inside the header's inset, not beside it. Passed as the caller's own node
    // above the header, it would start 16px to the left of the title it belongs to.
    expect(trail.getBoundingClientRect().left).toBeCloseTo(row.getBoundingClientRect().left, 1);
  },
};

/**
 * The seam. `HeaderContentFooter` leaves its header slot unpadded on purpose — the page header
 * carries its own inset — and gives the body `px-4` to match. This story is the check that the
 * two halves of that arrangement still agree: the title's edges and the first body row's edges
 * are the same edges, and the cap the chassis applies is the only cap in the tree.
 *
 * The wrapper is deliberately wider than `PAGE_COLUMN`'s cap, so what is measured is the capped
 * case rather than the one where the cap does nothing.
 */
export const AlignsWithTheBodyOfAPageChassis: StoryObj<typeof PageHeader> = {
  render: () => (
    <div className="w-[1800px]">
      <HeaderContentFooter
        width="page"
        header={
          <PageHeader
            title="Vendors"
            description="Suppliers inventory is purchased from."
            action={<Actions />}
          />
        }
        content={<Rows />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>("[data-slot=ph-title-row]");
    const body = canvasElement.querySelector<HTMLElement>("[data-slot=hcf-content] > ul");
    expect(row).not.toBeNull();
    expect(body).not.toBeNull();
    if (!row || !body) return;

    const header = row.getBoundingClientRect();
    const rows = body.getBoundingClientRect();

    // Both edges, not just the left: a header that capped itself a second time would still line
    // up on the left and come up short on the right.
    expect(header.left).toBeCloseTo(rows.left, 1);
    expect(header.right).toBeCloseTo(rows.right, 1);

    // And the cap really is in play here — 1800px of wrapper, one column of content.
    expect(header.width).toBeLessThan(1700);
  },
};

/**
 * The rule under the header is derived, not a prop: it is drawn exactly when nothing else
 * separates the header from the body. Every list header in these apps has a search row and no
 * rule; every edit screen and detail page has neither, and grew one by hand in three different
 * border colours. A caller who disagrees says so in one class — `className="border-b-0"`.
 */
export const TheRuleFollowsTheControlRow: StoryObj<typeof PageHeader> = {
  render: () => (
    <div>
      <PageHeader title="Edit vendor" description="Nothing between this and the first field." />
      <PageHeader
        title="Vendors"
        description="A search row already divides them."
        content={<Search />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [bare, withControls] =
      canvasElement.querySelectorAll<HTMLElement>("[data-slot=page-header]");
    if (!bare || !withControls) return;
    expect(getComputedStyle(bare).borderBottomWidth).not.toBe("0px");
    expect(getComputedStyle(withControls).borderBottomWidth).toBe("0px");
  },
};

/**
 * `loading` stands in for the title, at the title's own height, so the body below does not move
 * when the name lands. The trail, the buttons and the search field are not waiting on anything
 * and stay where they are — and stay usable.
 *
 * Both headers here are given the same slots; the only difference is the flag, so their
 * rectangles are directly comparable.
 */
export const Loading: StoryObj<typeof PageHeader> = {
  render: () => (
    <div>
      <PageHeader
        loading
        title="Acme Supply"
        description="Vendor since 2019."
        action={<Actions />}
        content={<Search />}
      />
      <PageHeader
        title="Acme Supply"
        description="Vendor since 2019."
        action={<Actions />}
        content={<Search />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [waiting, landed] =
      canvasElement.querySelectorAll<HTMLElement>("[data-slot=page-header]");
    if (!waiting || !landed) return;

    // The whole header, not only the title row: this is the number the page below inherits.
    expect(waiting.getBoundingClientRect().height).toBeCloseTo(
      landed.getBoundingClientRect().height,
      1,
    );

    // The heading is still a heading with a name. A bar on its own is an empty heading, which
    // leaves a screen reader nothing to land on between the trail and the buttons.
    const heading = waiting.querySelector<HTMLElement>("[data-slot=ph-title]");
    expect(heading?.textContent?.trim()).not.toBe("");

    // The controls did not go away with the title.
    expect(waiting.querySelector("[data-slot=ph-action] button")).not.toBeNull();
    expect(waiting.querySelector("[data-slot=ph-content] input")).not.toBeNull();
  },
};

/**
 * Narrow, the action drops to its own line instead of squeezing the title, and the title wraps
 * rather than truncating — a page title is what names the page, and half of one names nothing.
 *
 * The wrap is driven by the title's own 16rem floor against the action's real width, not by a
 * viewport breakpoint, so it holds inside a pane of a split on a wide screen — which is where a
 * breakpoint fails.
 */
export const NarrowContainer: StoryObj<typeof PageHeader> = {
  render: () => (
    <div className="w-[360px] border">
      <PageHeader
        title="Preferred vendors and their contract renewal dates"
        description="Suppliers inventory is purchased from."
        action={<Actions />}
        content={<Search />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-slot=page-header]");
    const titles = canvasElement.querySelector<HTMLElement>("[data-slot=ph-titles]");
    const action = canvasElement.querySelector<HTMLElement>("[data-slot=ph-action]");
    if (!root || !titles || !action) return;

    // Wrapped: the buttons are under the title block, not beside it.
    expect(action.getBoundingClientRect().top).toBeGreaterThan(
      titles.getBoundingClientRect().bottom - 1,
    );

    // Nothing overflowed the 360px box — not the long title, and not the two buttons.
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth + 1);

    // The title wrapped rather than being clipped to one line.
    const heading = canvasElement.querySelector<HTMLElement>("[data-slot=ph-title]");
    expect(heading?.getBoundingClientRect().height).toBeGreaterThan(30);
  },
};
