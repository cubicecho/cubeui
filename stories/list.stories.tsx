import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { List as Compiled, ListRow as CompiledRow } from "../compiled/list";
import { ListItem as CompiledItem } from "../compiled/list-item";
import { List as Native, ListRow as NativeRow } from "../registry/layout/list";
import { ListItem as NativeItem } from "../registry/layout/list-item";
import { SideBySide } from "./side-by-side";

/**
 * A card's list of workspaces — the `<ul>`, the rule between rows and the padding around each,
 * which every app wrote by hand around its `ListItem`s — drawn with either half.
 */
const meta = {
  title: "RN Parity/List",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const WORKSPACES = [
  { id: "work", name: "Work", servers: "4 servers" },
  { id: "home", name: "Home", servers: "2 servers" },
  { id: "lab", name: "Lab", servers: "1 server" },
];

function half(canvasElement: HTMLElement, selector: string) {
  const root = canvasElement.querySelector<HTMLElement>(selector);
  if (!root) {
    throw new Error(`${selector} should render`);
  }
  return root;
}

const halves = (canvasElement: HTMLElement) => [
  half(canvasElement, ".native-root"),
  half(canvasElement, ".compiled-root"),
];

/** The rows of the one list in a half, by role. */
function rowsOf(root: HTMLElement) {
  return within(within(root).getByRole("list", { name: "Workspaces" })).getAllByRole("listitem");
}

const ruleWidths = (rows: HTMLElement[]) => rows.map((row) => getComputedStyle(row).borderTopWidth);

/** An array of rows beside a fixed last one, in a fragment: four rows, each a list item. */
export const Divided: Story = {
  args: { label: "Workspaces" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root">
          <Native
            label="Workspaces"
            contentSlot={
              <>
                {WORKSPACES.map((w) => (
                  <NativeItem key={w.id} title={w.name} meta={w.servers} />
                ))}
                <NativeItem title="Archive" description="Kept, not routed" />
              </>
            }
          />
        </div>
      }
      compiled={
        <div className="compiled-root">
          <Compiled
            label="Workspaces"
            contentSlot={
              <>
                {WORKSPACES.map((w) => (
                  <CompiledItem key={w.id} title={w.name} meta={w.servers} />
                ))}
                <CompiledItem title="Archive" description="Kept, not routed" />
              </>
            }
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of halves(canvasElement)) {
      // One list, named, and the fragment and the array inside it opened into four items.
      const list = within(root).getByRole("list", { name: "Workspaces" });
      const rows = rowsOf(root);
      await expect(rows).toHaveLength(4);
      for (const row of rows) {
        await expect(row.parentElement).toBe(list);
      }
      await expect(rows.map((row) => row.textContent)).toEqual([
        "Work4 servers",
        "Home2 servers",
        "Lab1 server",
        "ArchiveKept, not routed",
      ]);

      // A rule over every row but the first, in a colour, and the same padding around each.
      await expect(ruleWidths(rows)).toEqual(["0px", "1px", "1px", "1px"]);
      for (const row of rows.slice(1)) {
        await expect(getComputedStyle(row).borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
      }
      for (const row of rows) {
        await expect(getComputedStyle(row).paddingTop).toBe("4px");
        await expect(getComputedStyle(row).paddingBottom).toBe("4px");
      }
    }

    // The web half is the elements themselves, not roles on a `div`.
    const compiled = half(canvasElement, ".compiled-root");
    await expect(within(compiled).getByRole("list").tagName).toBe("UL");
    await expect(rowsOf(compiled).map((row) => row.tagName)).toEqual(["LI", "LI", "LI", "LI"]);

    // The two halves draw every row the same height.
    const heights = (root: HTMLElement) =>
      rowsOf(root).map((row) => Math.round(row.getBoundingClientRect().height));
    await expect(heights(compiled)).toEqual(heights(half(canvasElement, ".native-root")));
  },
};

/** `divided={false}`: rows that are cards of their own bring their own border. */
export const Undivided: Story = {
  args: { label: "Workspaces" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root">
          <Native
            label="Workspaces"
            divided={false}
            contentSlot={WORKSPACES.map((w) => (
              <NativeItem
                key={w.id}
                title={w.name}
                meta={w.servers}
                className="rounded-lg border border-foreground/10 bg-secondary"
              />
            ))}
          />
        </div>
      }
      compiled={
        <div className="compiled-root">
          <Compiled
            label="Workspaces"
            divided={false}
            contentSlot={WORKSPACES.map((w) => (
              <CompiledItem
                key={w.id}
                title={w.name}
                meta={w.servers}
                className="rounded-lg border border-foreground/10 bg-secondary"
              />
            ))}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of halves(canvasElement)) {
      const rows = rowsOf(root);
      await expect(rows).toHaveLength(3);
      await expect(ruleWidths(rows)).toEqual(["0px", "0px", "0px"]);
    }
  },
};

/** No rows is no list: the empty rung is `QueryState`'s, and "list, 0 items" says nothing. */
export const NoRows: Story = {
  args: { label: "Workspaces" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root">
          <Native label="Workspaces" contentSlot={[]} />
        </div>
      }
      compiled={
        <div className="compiled-root">
          <Compiled label="Workspaces" contentSlot={[false, null]} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of halves(canvasElement)) {
      await expect(within(root).queryByRole("list")).toBeNull();
    }
  },
};

/** A run's steps: a decision with its two arms under it, one arm with a step of its own. */
const STEPS = [
  { id: "fetch", name: "Fetch the branch", depth: 0 },
  { id: "decide", name: "Tests pass?", depth: 0 },
  { id: "yes", name: "Open the PR", depth: 1 },
  { id: "label", name: "Label it", depth: 2 },
  { id: "no", name: "Report the failure", depth: 1 },
];

function NestedSteps({
  List,
  Row,
  Item,
}: {
  List: typeof Native;
  Row: typeof NativeRow;
  Item: typeof NativeItem;
}) {
  return (
    <List
      label="Steps"
      contentSlot={
        <>
          {STEPS.map((s) => (
            <Row key={s.id} depth={s.depth}>
              <Item title={s.name} />
            </Row>
          ))}
          <Item key="done" title="Done" />
        </>
      }
    />
  );
}

/**
 * Rows that nest without being files (#368): each `ListRow` carries its `depth`, and the list
 * indents it a step a level with a guide rule, and gives a screen reader the level. A row with no
 * `ListRow` around it is a plain row.
 */
export const Nested: Story = {
  args: { label: "Steps" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root w-80">
          <NestedSteps List={Native} Row={NativeRow} Item={NativeItem} />
        </div>
      }
      compiled={
        <div className="compiled-root w-80">
          <NestedSteps
            List={Compiled as typeof Native}
            Row={CompiledRow as typeof NativeRow}
            Item={CompiledItem as typeof NativeItem}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of halves(canvasElement)) {
      const rows = within(within(root).getByRole("list", { name: "Steps" })).getAllByRole(
        "listitem",
      );
      await expect(rows.map((row) => row.getAttribute("aria-level"))).toEqual([
        "1",
        "1",
        "2",
        "3",
        "2",
        null,
      ]);
      const left = within(root).getByRole("list", { name: "Steps" }).getBoundingClientRect().left;
      const starts = rows.map((row) => row.getBoundingClientRect().left - left);
      await expect(starts).toEqual([0, 0, 16, 32, 16, 0]);
      await expect(rows.map((row) => getComputedStyle(row).borderLeftWidth)).toEqual([
        "0px",
        "0px",
        "2px",
        "2px",
        "2px",
        "0px",
      ]);
      await expect(within(root).getByText("Label it")).toBeVisible();
    }
  },
};
