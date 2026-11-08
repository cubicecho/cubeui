import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { CardLayout } from "@/components/card-layout";
import { DialogLayout } from "@/components/dialog-layout";
import { EmptyState } from "@/components/empty-state";
import { List } from "@/components/list";
import { ListItem } from "@/components/list-item";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

const meta = {
  title: "Layout/CardLayout",
  component: CardLayout,
  parameters: { layout: "centered" },
  args: { className: "w-[420px]" },
} satisfies Meta<typeof CardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Rows = () => (
  <ul className="divide-y divide-foreground/10 text-sm">
    {["Fabrication", "Assembly", "Packaging"].map((name) => (
      <li key={name} className="py-2">
        {name}
      </li>
    ))}
  </ul>
);

export const Default: Story = {
  args: {
    title: "Categories",
    description: "Deleting a category keeps its activities — they go back to uncategorized.",
    actionSlot: <Button size="sm" variant="info" iconSlot={<Plus />} content="Add" />,
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Categories");
    const add = canvas.getByRole("button", { name: "Add" });
    expect(title).toBeVisible();
    expect(canvas.getByText(/Deleting a category keeps its activities/)).toBeVisible();
    expect(canvas.getByText("Fabrication")).toBeVisible();
    expect(canvas.getByRole("button", { name: "Save" })).toBeVisible();
    // The action is the header's far end, so it starts after the title does.
    expect(add.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().left);
  },
};

/** Title only. Every other slot absent, and none of them leaves a wrapper behind. */
export const TitleOnly: Story = {
  args: { title: "Categories", contentSlot: <Rows /> },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=card-footer]")).toBeNull();
  },
};

/** An icon is passed bare — `<Plus />`, not `<Plus className="size-4" />`. The shell sizes it. */
export const WithIcon: Story = {
  args: {
    iconSlot: <Plus />,
    title: "Categories",
    description: "The icon arrives unsized and leaves at 16px.",
    contentSlot: <Rows />,
  },
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    expect(svg).not.toBeNull();
    if (svg) {
      expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
    }
  },
};

/**
 * `emptySlot` replaces the body when `contentSlot` is empty — and `[].map(…)` is an empty array,
 * not null, which is why the shell counts the nodes instead of testing them for truth. The call
 * site writes the map plainly; it never writes `items.length === 0 ? … : …`.
 */
export const Empty: Story = {
  args: {
    title: "Categories",
    emptySlot: <EmptyState compact title="No categories yet." />,
    contentSlot: [].map(() => null),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("No categories yet.");
  },
};

/**
 * Both footer slots. `footerSlot` takes the start, `footerActionsSlot` the end, and the shell
 * splits them — a destructive action held away from the one you meant to press.
 */
export const SplitFooter: Story = {
  args: {
    title: "Danger zone",
    footerSlot: <Button size="sm" variant="destructive-outline" content="Delete" />,
    footerActionsSlot: (
      <>
        <Button size="sm" variant="outline" content="Cancel" />
        <Button size="sm" variant="positive" content="Save" />
      </>
    ),
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const remove = canvas.getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const cancel = canvas.getByRole("button", { name: "Cancel" }).getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Save" }).getBoundingClientRect();
    // `footerSlot` and `footerActionsSlot` go to opposite ends: the space is between Delete and
    // Cancel, not between Cancel and Save.
    expect(remove.right).toBeLessThan(cancel.left);
    expect(cancel.right).toBeLessThanOrEqual(save.left);
    expect(cancel.left - remove.right).toBeGreaterThan(save.left - cancel.right);
  },
};

/**
 * Two elements in `footerSlot` beside `footerActionsSlot`. The shell groups them: they sit together
 * at the start, `gap-2` apart, and the footer splits between that row and the buttons. They used
 * to be spread by the footer's `justify-between`, which put the second one mid-footer.
 */
export const GroupedFooterStart: Story = {
  args: {
    title: "Danger zone",
    footerSlot: (
      <>
        <span className="text-foreground/60 text-sm">Synced an hour ago</span>
        <Button size="sm" variant="destructive-outline" content="Delete" />
      </>
    ),
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const note = canvas.getByText("Synced an hour ago").getBoundingClientRect();
    const remove = canvas.getByRole("button", { name: "Delete" }).getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Save" }).getBoundingClientRect();
    const title = canvas.getByText("Danger zone").getBoundingClientRect();
    await expect({
      // `gap-2`: 8px between the two, at the card's start edge.
      gap: Math.round(remove.left - note.right),
      atStart: Math.round(note.left - title.left),
      // The space is between Delete and Save, not between the note and Delete.
      split: save.left - remove.right > 8,
    }).toEqual({ gap: 8, atStart: 0, split: true });
  },
};

/**
 * `footerActionsSlot` alone right-aligns. This is the common case, and it needs no `footerSlot`.
 */
export const ActionsOnly: Story = {
  args: {
    title: "Categories",
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Categories").getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Save" }).getBoundingClientRect();
    // Given alone, the buttons sit at the footer's end: past the middle of the 420px card, whose
    // start edge the title marks.
    expect(save.left).toBeGreaterThan(title.left + 210);
  },
};

/**
 * A title too long for the card truncates rather than wrapping, because a card is one of several
 * on a grid and a two-line title in one of them sets every other card's header height.
 *
 * The assertion is about the other half of that: `truncate` is `overflow: hidden`, and a line box
 * no taller than the glyphs in it shaves the tops off the capitals and the tails off the
 * descenders, which reads as a rendering fault rather than as a design. shadcn's `CardTitle` is
 * `leading-none`, a line box exactly 1em tall, and needed padding to undo that; the heading
 * rhythm's title keeps `text-sm`'s own 20px line (#473), and this checks the line box is still
 * taller than the text in it.
 */
export const LongTitleTruncates: Story = {
  args: {
    title: "Categories, subcategories, and everything filed under them",
    description: "The description wraps; the title does not.",
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { name: /^Categories/ });

    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);

    // 1.2em is about where a text font's ascent and descent land together; anything at or under
    // the em box is clipping something.
    const fontSize = Number.parseFloat(getComputedStyle(title).fontSize);
    expect(title.clientHeight).toBeGreaterThan(fontSize * 1.2);
  },
};

/** The body of a card that has rows is the rows, with `emptySlot` given and not drawn. */
export const RowsIgnoreTheEmptySlot: Story = {
  args: {
    title: "Categories",
    emptySlot: <EmptyState compact title="No categories yet." />,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    expect(canvas.getByText("Fabrication")).toBeVisible();
    expect(canvas.queryByText("No categories yet.")).toBeNull();
  },
};

/** The skeleton in the card's body, and only there. */
function skeletonIn(canvasElement: HTMLElement) {
  return canvasElement.querySelector("[data-slot=card-layout-skeleton]");
}

/**
 * `loading` puts a skeleton where the body goes and keeps the header: only the part that is
 * waiting waits. The footer stays too.
 */
export const Loading: Story = {
  args: {
    title: "Categories",
    loading: true,
    contentSlot: <Rows />,
    footerActionsSlot: <Button size="sm" variant="positive" content="Save" />,
  },
  play: async ({ canvas, canvasElement }) => {
    expect(skeletonIn(canvasElement)).not.toBeNull();
    expect(canvas.getByRole("heading", { name: "Categories" })).toBeVisible();
    expect(canvas.queryByText("Fabrication")).toBeNull();
    expect(canvas.getByRole("button", { name: "Save" })).toBeVisible();
  },
};

/** Loading an empty body is still loading: `emptySlot` waits until the data has arrived. */
export const LoadingIsNotEmpty: Story = {
  args: {
    title: "Categories",
    loading: true,
    emptySlot: <EmptyState compact title="No categories yet." />,
    contentSlot: [].map(() => null),
  },
  play: async ({ canvas, canvasElement }) => {
    expect(skeletonIn(canvasElement)).not.toBeNull();
    expect(canvas.queryByText("No categories yet.")).toBeNull();
  },
};

/** `footerSlot` alone sits at the footer's start, level with the title's start edge. */
export const FooterStartOnly: Story = {
  args: {
    title: "Categories",
    footerSlot: <span className="text-foreground/60 text-sm">Synced an hour ago</span>,
    contentSlot: <Rows />,
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Categories").getBoundingClientRect();
    const note = canvas.getByText("Synced an hour ago").getBoundingClientRect();
    expect(Math.round(note.left - title.left)).toBe(0);
  },
};

const MEMBERS = [
  { name: "Ada Lovelace", role: "Owner" },
  { name: "Grace Hopper", role: "Admin" },
];

/** A `List` and a `Table` of the members, each named for the surface it is drawn on. */
const Members = ({ on }: { on: string }) => (
  <>
    <List
      label={`${on} list`}
      contentSlot={MEMBERS.map((m) => <ListItem key={m.name} title={m.name} meta={m.role} />)}
    />
    <Table aria-label={`${on} table`}>
      <TableBody>
        {MEMBERS.map((m) => (
          <TableRow key={m.name}>
            <TableHead>{m.name}</TableHead>
            <TableCell>{m.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </>
);

/** A dialog, a popover and a `DialogLayout`, each opened from inside the card's body. */
const Overlays = () => (
  <div className="flex flex-wrap gap-2">
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" content="Open dialog" />
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Members</DialogTitle>
        <Members on="Dialog" />
      </DialogContent>
    </Dialog>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" content="Open popover" />
      </PopoverTrigger>
      <PopoverContent aria-label="Members" className="flex-col gap-2">
        <Members on="Popover" />
      </PopoverContent>
    </Popover>
    <DialogLayout
      title="Edit members"
      triggerSlot={<Button variant="outline" content="Open form" />}
      contentSlot={
        <List
          label="Form list"
          contentSlot={MEMBERS.map((m) => <ListItem key={m.name} title={m.name} meta={m.role} />)}
        />
      }
    />
  </div>
);

/** The `List` and the table's container, each still where it was put: no margin reaching out. */
async function expectNormalInset(on: string) {
  const list = await screen.findByRole("list", { name: `${on} list` });
  const table = screen.getByRole("table", { name: `${on} table` }).parentElement as HTMLElement;
  await expect(getComputedStyle(list).marginLeft).toBe("0px");
  await expect(getComputedStyle(table).marginLeft).toBe("0px");
}

/**
 * A dialog or a popover opened from a card's body is not in the card (#525). Context passes
 * through a portal, so the `List` and the `Table` in one used to reach out into padding the
 * overlay does not have, as they do in the card. Every floating surface now resets it. A
 * `DialogLayout`'s body is a card's again — the panel is the card — so a list there still lines
 * its rows' titles up with the dialog's.
 */
export const OverlaysLeaveTheCard: Story = {
  args: { title: "Members", contentSlot: <Overlays /> },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));
    await expectNormalInset("Dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Open popover" }));
    await expectNormalInset("Popover");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Open form" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit members" });
    const list = within(dialog).getByRole("list", { name: "Form list" });
    const title = within(dialog).getByRole("heading", { name: "Edit members" });
    const row = within(list).getByText("Ada Lovelace").getBoundingClientRect();
    await expect(row.left).toBeCloseTo(title.getBoundingClientRect().left, 0);
    // Reaching out, the list still fits the body: it does not scroll sideways.
    const body = list.closest("[data-slot=header-content-footer-content]") as HTMLElement;
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
  },
};
