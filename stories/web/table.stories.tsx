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

const meta = {
  title: "Primitive/Table",
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
    for (const row of rows) expect(row).toHaveAttribute("scope", "row");

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
