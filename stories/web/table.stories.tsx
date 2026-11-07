import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expectFocusEdge } from "../focus-edge";

const meta = {
  title: "Layout/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const SERVERS = [
  { name: "filesystem", transport: "stdio", tools: 11, status: "Connected" },
  { name: "github", transport: "http", tools: 42, status: "Connected" },
  { name: "postgres", transport: "stdio", tools: 7, status: "Stopped" },
];

// The shape of mcp-router's server list, the first place this replaces a hand-kept copy.
const Servers = () => (
  <Table>
    <TableCaption>Servers in this workspace</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Transport</TableHead>
        <TableHead className="text-right">Tools</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {SERVERS.map((server) => (
        <TableRow key={server.name}>
          <TableHead>{server.name}</TableHead>
          <TableCell>{server.transport}</TableCell>
          <TableCell className="text-right">{server.tools}</TableCell>
          <TableCell>{server.status}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableHead>Total</TableHead>
        <TableCell />
        <TableCell className="text-right">60</TableCell>
        <TableCell />
      </TableRow>
    </TableFooter>
  </Table>
);

/** A table that fits: every part in its role, and no tab stop on a container with nothing to scroll. */
export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <Servers />
    </div>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Servers in this workspace" });
    expect(table.querySelector("caption")).toHaveTextContent("Servers in this workspace");
    expect(canvas.getAllByRole("row")).toHaveLength(5);
    expect(canvas.getAllByRole("cell").length).toBeGreaterThan(0);

    // The header row's cells are `th scope="col"`, and the first cell of each body row is the
    // row's own header — `scope="row"`, which a screen reader reads out before each cell.
    const columns = canvas.getAllByRole("columnheader");
    expect(columns.map((c) => c.textContent)).toEqual(["Name", "Transport", "Tools", "Status"]);
    for (const column of columns) {
      expect(column.tagName).toBe("TH");
      expect(column).toHaveAttribute("scope", "col");
    }
    const rows = canvas.getAllByRole("rowheader");
    expect(rows.map((r) => r.textContent)).toEqual(["filesystem", "github", "postgres", "Total"]);
    for (const row of rows) {
      expect(row).toHaveAttribute("scope", "row");
    }

    const container = table.parentElement as HTMLElement;
    expect(container).toHaveAttribute("data-slot", "table-container");
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    expect(container).not.toHaveAttribute("tabindex");
  },
};

/**
 * Narrower than its columns, the table scrolls sideways inside its own container instead of
 * pushing the page wider — and the container becomes a tab stop, so a keyboard reaches the
 * columns past the edge (axe's `scrollable-region-focusable`).
 */
export const Narrow: Story = {
  render: () => (
    <div className="w-48">
      <Servers />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole("table", { name: "Servers in this workspace" });
    const container = table.parentElement as HTMLElement;
    const frame = container.parentElement as HTMLElement;

    expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    // The overflow stays inside the container: the frame around it is not pushed wider.
    expect(container.getBoundingClientRect().width).toBeLessThanOrEqual(
      frame.getBoundingClientRect().width,
    );
    await waitFor(() => expect(container).toHaveAttribute("tabindex", "0"));

    container.scrollLeft = container.scrollWidth;
    await waitFor(() => expect(container.scrollLeft).toBeGreaterThan(0));

    await userEvent.click(canvasElement);
    await userEvent.tab();
    expect(container).toHaveFocus();
  },
};

const LEVELS = ["info", "warn", "error"] as const;
const SOURCES = ["router", "worker", "scheduler", "auth"] as const;
const LOG_LINES = 40;

const LOG = Array.from({ length: LOG_LINES }, (_, i) => ({
  id: i,
  time: `12:${String(i).padStart(2, "0")}:07`,
  level: LEVELS[i % LEVELS.length],
  source: SOURCES[i % SOURCES.length],
  message: `Handled request ${1000 + i} for workspace ${i % 5}`,
  duration: 20 + ((i * 37) % 400),
}));

// A run's log: forty lines, wider than its frame, under a capped height.
const Log = () => (
  <Table maxHeight="sm">
    <TableCaption>Run log</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead>Time</TableHead>
        <TableHead>Level</TableHead>
        <TableHead>Source</TableHead>
        <TableHead>Message</TableHead>
        <TableHead className="text-right">Duration (ms)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {LOG.map((line) => (
        <TableRow key={line.id}>
          <TableHead>{line.time}</TableHead>
          <TableCell>{line.level}</TableCell>
          <TableCell>{line.source}</TableCell>
          <TableCell>{line.message}</TableCell>
          <TableCell className="text-right">{line.duration}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

/** How far apart, in pixels, two edges may be and still count as lined up. */
const SUBPIXEL = 1;

/**
 * Given a `maxHeight`, a long table scrolls inside its own container on both axes, and its header
 * row stays pinned at the top while the rows scroll under it. Sideways, the header moves with the
 * columns it names. The container is a tab stop while it overflows, so a keyboard can scroll it.
 */
export const MaxHeight: Story = {
  render: () => (
    <div className="w-96">
      <Log />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole("table", { name: "Run log" });
    const container = table.parentElement as HTMLElement;
    const header = table.querySelector("thead") as HTMLElement;
    const [firstColumn] = canvas.getAllByRole("columnheader");
    const [firstRow] = canvas.getAllByRole("rowheader");
    if (!firstColumn || !firstRow) {
      throw new Error("The log table has no header cells.");
    }

    expect(container.scrollHeight).toBeGreaterThan(container.clientHeight);
    expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    await waitFor(() => expect(container).toHaveAttribute("tabindex", "0"));

    // Down: the rows pass under the header, which stays at the container's top, opaque, with its
    // rule still drawn.
    container.scrollTop = 200;
    await waitFor(() => expect(container.scrollTop).toBe(200));
    // The inside of the container: it keeps a transparent edge while it is a tab stop.
    const top = container.getBoundingClientRect().top + container.clientTop;
    expect(Math.abs(header.getBoundingClientRect().top - top)).toBeLessThanOrEqual(SUBPIXEL);
    expect(firstRow.getBoundingClientRect().top).toBeLessThan(top);
    expect(getComputedStyle(header).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(firstColumn).boxShadow).toContain("inset");

    // Sideways: the header scrolls with the body, so each name stays over its column.
    container.scrollLeft = 100;
    await waitFor(() => expect(container.scrollLeft).toBeGreaterThan(0));
    expect(
      Math.abs(firstColumn.getBoundingClientRect().left - firstRow.getBoundingClientRect().left),
    ).toBeLessThanOrEqual(SUBPIXEL);
    expect(firstColumn.getBoundingClientRect().left).toBeLessThan(
      container.getBoundingClientRect().left,
    );

    await userEvent.click(canvasElement);
    await userEvent.tab();
    expect(container).toHaveFocus();
  },
};

/**
 * Tabbed to, an overflowing table's container draws no ring: its edge turns `active`, as a
 * focused field's border does. Focused by a click, it shows neither.
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div className="w-48">
      <Servers />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole("table", { name: "Servers in this workspace" });
    const container = table.parentElement as HTMLElement;
    await waitFor(() => expect(container).toHaveAttribute("tabindex", "0"));
    await expectFocusEdge(container, canvasElement);
  },
};
