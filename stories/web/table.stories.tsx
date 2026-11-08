import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CardLayout } from "@/components/card-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { tintsUnderPointer } from "../pointer-tint";
import { tokenColor } from "../token-color";

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

/**
 * A table that fits: every part in its role, and no tab stop on a container with nothing to scroll.
 * The caption is drawn under the container and names the table. A row of words alone does not
 * tint under the pointer, and each row's own header is in the data's ink, not the column names'
 * grey.
 */
export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <Servers />
    </div>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Servers in this workspace" });
    const caption = canvas.getByText("Servers in this workspace");
    expect(caption).toHaveAttribute("data-slot", "table-caption");
    expect(table).toHaveAttribute("aria-labelledby", caption.id);
    // Read once, as the table's name, and not again as a line of text after the rows.
    expect(caption).toHaveAttribute("aria-hidden", "true");
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

    // The column names are the quiet text; a row's header is the thing the row is about.
    for (const column of columns) {
      expect(getComputedStyle(column).color).toBe(tokenColor("foreground", { opacity: MUTED_INK }));
    }
    for (const row of rows) {
      expect(getComputedStyle(row).color).toBe(tokenColor("foreground"));
    }

    const container = table.parentElement as HTMLElement;
    expect(container).toHaveAttribute("data-slot", "table-container");
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    expect(container).not.toHaveAttribute("tabindex");
    expect(container.contains(caption)).toBe(false);
    expect(container.parentElement).toHaveAttribute("data-slot", "table-frame");
    // Nothing past either end, so nothing fades.
    expect(container).not.toHaveAttribute("data-more-start");
    expect(container).not.toHaveAttribute("data-more-end");
    expect(getComputedStyle(container).maskImage).toBe("none");

    // Nothing in these rows can be pressed, so none of them answers the pointer.
    for (const row of canvas.getAllByRole("row")) {
      expect(tintsUnderPointer(row)).toBe(false);
    }
  },
};

/** The step `text-foreground/60` is: secondary text. */
const MUTED_INK = 60;

/** How far apart, in pixels, two edges may be and still count as lined up. */
const SUBPIXEL = 1;

/**
 * Narrower than its columns, the table scrolls sideways inside its own container instead of
 * pushing the page wider — and the container becomes a tab stop, so a keyboard reaches the
 * columns past the edge (axe's `scrollable-region-focusable`). The end with more columns past it
 * fades: the far end at first, the near end once scrolled to the last column. The caption stays
 * under the container, in view, however far it is scrolled.
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
    const frame = container.parentElement?.parentElement as HTMLElement;
    const caption = canvas.getByText("Servers in this workspace");

    expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);
    // The overflow stays inside the container: the frame around it is not pushed wider.
    expect(container.getBoundingClientRect().width).toBeLessThanOrEqual(
      frame.getBoundingClientRect().width,
    );
    await waitFor(() => expect(container).toHaveAttribute("tabindex", "0"));

    // At the start: more past the far end only, and that end fades.
    await waitFor(() => expect(container).toHaveAttribute("data-more-end"));
    expect(container).not.toHaveAttribute("data-more-start");
    expect(getComputedStyle(container).maskImage).not.toBe("none");
    expect(getComputedStyle(container).getPropertyValue("--table-fade-start")).toBe("0px");
    expect(getComputedStyle(container).getPropertyValue("--table-fade-end")).not.toBe("0px");

    container.scrollLeft = container.scrollWidth;
    await waitFor(() => expect(container.scrollLeft).toBeGreaterThan(0));

    // At the end: the near end fades instead.
    await waitFor(() => expect(container).toHaveAttribute("data-more-start"));
    expect(container).not.toHaveAttribute("data-more-end");
    expect(getComputedStyle(container).getPropertyValue("--table-fade-start")).not.toBe("0px");
    expect(getComputedStyle(container).getPropertyValue("--table-fade-end")).toBe("0px");

    // The caption did not scroll with the columns: it is under the container, inside its width.
    expect(container.contains(caption)).toBe(false);
    const box = container.getBoundingClientRect();
    const line = caption.getBoundingClientRect();
    expect(line.top).toBeGreaterThanOrEqual(box.bottom);
    expect(line.left).toBeGreaterThanOrEqual(box.left - SUBPIXEL);
    expect(line.right).toBeLessThanOrEqual(box.right + SUBPIXEL);

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

/**
 * Given a `maxHeight`, a long table scrolls inside its own container on both axes, and its header
 * row stays pinned at the top while the rows scroll under it. Sideways, the header moves with the
 * columns it names. The container is a tab stop while it overflows, so a keyboard can scroll it,
 * and the caption stays under it while the rows scroll.
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
    // The caption is under the container, not under the last row: in view while the rows scroll.
    const caption = canvas.getByText("Run log");
    expect(container.contains(caption)).toBe(false);
    expect(caption.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      container.getBoundingClientRect().bottom,
    );

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

const ACTIVITY = [
  {
    id: "a1",
    time: "09:14",
    who: "Mara Quinn",
    message:
      "Moved the release checklist into the shared workspace and asked the reviewers to sign off on the migration notes before Thursday's cut.",
  },
  {
    id: "a2",
    time: "10:02",
    who: "Theo Park",
    message:
      "Rolled back the search index change after the nightly job timed out twice on the larger tenants; the fix is waiting on a second pair of eyes.",
  },
  {
    id: "a3",
    time: "11:47",
    who: "Kofi Mensah",
    message: "Closed the duplicate reports about the date picker.",
  },
];

// An activity feed on a card: the message column is a sentence or two, and the time is one value.
const Activity = () => (
  <CardLayout
    title="Recent activity"
    description="What changed in the workspace today."
    contentSlot={
      <Table>
        <TableCaption className="sr-only">Recent activity</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ACTIVITY.map((entry) => (
            <TableRow key={entry.id}>
              <TableHead className="whitespace-nowrap">{entry.time}</TableHead>
              <TableCell className="whitespace-nowrap">{entry.who}</TableCell>
              <TableCell>{entry.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    }
  />
);

/**
 * On a card, a long message wraps at the column's width rather than pushing the table past the
 * card's edge, so there is nothing to scroll and no fade. The column names stay on one line, and a
 * cell the caller marks `whitespace-nowrap` — the time, a name — keeps its one line too.
 */
export const WrapsInACard: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="max-w-5xl">
      <Activity />
    </div>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Recent activity" });
    const container = table.parentElement as HTMLElement;
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    expect(container).not.toHaveAttribute("tabindex");
    expect(container).not.toHaveAttribute("data-more-end");

    const lineHeight = (cell: HTMLElement) => Number.parseFloat(getComputedStyle(cell).lineHeight);
    const lines = (cell: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(cell);
      return Math.round(range.getBoundingClientRect().height / lineHeight(cell));
    };
    const long = canvas.getByText(/Rolled back the search index/);
    expect(lines(long)).toBeGreaterThan(1);
    for (const cell of [...canvas.getAllByRole("columnheader"), canvas.getByText("Kofi Mensah")]) {
      expect(lines(cell)).toBe(1);
    }
  },
};

/**
 * In a card's body the table reaches out by its cells' own inset (#517), so the first column's
 * text starts where the card's title does and the last column's ends where the card's action
 * does, as a `List` there lines up (#483). Its rules run nearly edge to edge. A table on its own
 * is where it was put. With a caption, it is the frame round the container that reaches out.
 */
export const LinesUpInACard: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <CardLayout
        title="Servers"
        description="What this workspace connects to."
        actionSlot={<Button size="sm" variant="info" content="Add" />}
        contentSlot={<Servers />}
      />
      <CardLayout
        title="Unnamed servers"
        actionSlot={<Button size="sm" variant="info" content="Add more" />}
        contentSlot={
          <Table aria-label="Unnamed servers">
            <TableBody>
              {SERVERS.map((server) => (
                <TableRow key={server.name}>
                  <TableHead>{server.name}</TableHead>
                  <TableCell className="text-right">{server.tools}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />
      <Table aria-label="Loose servers">
        <TableBody>
          <TableRow>
            <TableCell>filesystem</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvas }) => {
    const cases = [
      { table: "Servers in this workspace", title: "Servers", action: "Add" },
      { table: "Unnamed servers", title: "Unnamed servers", action: "Add more" },
    ];
    // Where a cell's text may run: its box inside its own padding.
    const textBox = (cell: Element) => {
      const box = cell.getBoundingClientRect();
      const style = getComputedStyle(cell);
      return {
        left: box.left + Number.parseFloat(style.paddingLeft),
        right: box.right - Number.parseFloat(style.paddingRight),
      };
    };
    for (const { table, title, action } of cases) {
      const row = within(canvas.getByRole("table", { name: table })).getAllByRole("row")[0];
      const cells = [...(row?.children ?? [])];
      const [first, last] = [cells[0], cells.at(-1)];
      if (!first || !last) {
        throw new Error(`${table} should have a row of cells`);
      }
      const heading = canvas.getByRole("heading", { name: title }).getBoundingClientRect();
      const button = canvas.getByRole("button", { name: action }).getBoundingClientRect();
      await expect(textBox(first).left).toBeCloseTo(heading.left, 0);
      await expect(textBox(last).right).toBeCloseTo(button.right, 0);
    }
    const loose = canvas.getByRole("table", { name: "Loose servers" }).parentElement as HTMLElement;
    await expect(getComputedStyle(loose).marginLeft).toBe("0px");
  },
};

/** Which rows of a selectable table tint under the pointer. */
function Selectable() {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set(["github"]));
  const choose = (name: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) {
      next.add(name);
    } else {
      next.delete(name);
    }
    setChosen(next);
  };
  return (
    <Table>
      <TableCaption>Servers to restart</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <span className="sr-only">Chosen</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SERVERS.map((server) => (
          <TableRow key={server.name} data-state={chosen.has(server.name) ? "selected" : undefined}>
            <TableCell>
              <Checkbox
                aria-label={`Restart ${server.name}`}
                checked={chosen.has(server.name)}
                onCheckedChange={(on) => choose(server.name, on === true)}
              />
            </TableCell>
            <TableHead>{server.name}</TableHead>
            <TableCell>{server.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell />
          <TableHead>Chosen</TableHead>
          <TableCell>{chosen.size}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

/**
 * A row tints under the pointer when it can be acted on: it holds a checkbox, a link or a button,
 * or it has its own `onClick`. A chosen row is tinted `active` and goes a step further under the
 * pointer. The header row and the footer's total, with nothing to press, stay still. On the chosen
 * row's tint the row's header is in `foreground`, as the cells beside it are.
 */
export const WhichRowsTint: Story = {
  render: () => (
    <div className="max-w-[480px]">
      <Selectable />
    </div>
  ),
  play: async ({ canvas }) => {
    const rowOf = (name: string) =>
      canvas.getByRole("rowheader", { name }).closest("tr") as Element;
    const [headerRow] = canvas.getAllByRole("row");
    expect(headerRow && tintsUnderPointer(headerRow)).toBe(false);
    expect(tintsUnderPointer(rowOf("filesystem"))).toBe(true);
    expect(tintsUnderPointer(rowOf("Chosen"))).toBe(false);

    const chosen = rowOf("github");
    expect(chosen).toHaveAttribute("data-state", "selected");
    expect(getComputedStyle(chosen).backgroundColor).toBe(
      tokenColor("active", { opacity: CHOSEN_TINT }),
    );
    expect(tintsUnderPointer(chosen)).toBe(true);
    expect(getComputedStyle(canvas.getByRole("rowheader", { name: "github" })).color).toBe(
      tokenColor("foreground"),
    );

    await userEvent.click(canvas.getByRole("checkbox", { name: "Restart postgres" }));
    await waitFor(() => expect(rowOf("postgres")).toHaveAttribute("data-state", "selected"));
  },
};

/** The step `bg-active/40` is: the tint of a chosen thing. */
const CHOSEN_TINT = 40;

const WEBHOOKS = [
  {
    name: "deploy",
    url: "https://hooks.example.com/services/T024BE7LD/B08S4K5J3/8f2d9c1e7a6b4b0c9e3f5a2d1c8b7e6f",
  },
  { name: "alerts", url: "https://alerts.example.com/v1/incoming/3c1f" },
];

/**
 * A value with no spaces in it — a URL, a hash, a path — cannot wrap at a word, so it sets its
 * column's narrowest width and pushes the table wide. `wrap-anywhere` on its cells lets it break
 * between any two letters instead. It is the column's own class, not the table's: on every cell, a
 * narrow table would break ordinary words mid-word rather than scroll.
 */
export const ALongValue: Story = {
  render: () => (
    <div className="max-w-[480px]">
      <Table>
        <TableCaption>Webhooks</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WEBHOOKS.map((hook) => (
            <TableRow key={hook.name}>
              <TableHead>{hook.name}</TableHead>
              <TableCell className="wrap-anywhere font-mono text-xs">{hook.url}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
  play: async ({ canvas }) => {
    const table = canvas.getByRole("table", { name: "Webhooks" });
    const container = table.parentElement as HTMLElement;
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    expect(container).not.toHaveAttribute("tabindex");
  },
};
