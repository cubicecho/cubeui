import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import type { SelectEntry } from "@/registry/new-york/form/app-form";
import { SelectField, useAppForm } from "@/registry/new-york/form/app-form";

/**
 * kanban-server's "On success" picker: where a card goes when it passes. Three kinds of answer —
 * stay where it is, one of the other lanes, or archive it, which is not a lane at all.
 */
const DESTINATIONS: readonly SelectEntry[] = [
  { value: "stay", label: "Stay here" },
  { value: "review", label: "Review", group: "Lanes" },
  { value: "qa", label: "QA", group: "Lanes" },
  { value: "done", label: "Done", group: "Lanes" },
  { separator: true },
  { value: "archive", label: "Archive it" },
];

const LISTS = [
  { value: "inbox", label: "Inbox" },
  { value: "work", label: "Work" },
];

function LaneForm({ options = DESTINATIONS }: { options?: readonly SelectEntry[] }) {
  const form = useAppForm({ defaultValues: { onSuccess: "stay" } });

  return (
    <form className="grid w-[360px] gap-4">
      <SelectField
        form={form}
        name="onSuccess"
        label="On success"
        description="Where the card goes when it passes."
        options={options}
      />
    </form>
  );
}

const meta = {
  title: "Form/SelectField",
  component: LaneForm,
  parameters: { layout: "centered" },
} satisfies Meta<typeof LaneForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Open the list, do something in it, and leave it closed.
 *
 * The closing wait is not politeness. Radix animates the list out and holds `pointer-events:
 * none` on the body until it has finished, and the axe run every story gets catches the listbox
 * on its way out and reports it as one with no accessible name.
 */
async function inTheList(
  trigger: HTMLElement,
  assert: (list: HTMLElement) => void | Promise<void>,
) {
  await userEvent.click(trigger);
  await assert(await screen.findByRole("listbox"));
  await userEvent.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).toBeNull();
  });
}

export const Default: Story = { args: {} };

/**
 * The row that is not a lane is not drawn as one. Without a rule above it, "Archive it" sits
 * flush against the lane names and reads as another of them — and the workaround is a sentence
 * doing a divider's job, `"Archive it — off the board"`, which does not survive a long list.
 */
export const AnOptionThatIsNotALaneIsNotDrawnAsOne: Story = {
  args: {},
  play: async ({ canvas }) => {
    await inTheList(canvas.getByLabelText(/^On success/), (list) => {
      const rule = list.querySelector("[data-slot=select-separator]");
      expect(rule).not.toBeNull();

      const archive = within(list).getByRole("option", { name: "Archive it" });
      const done = within(list).getByRole("option", { name: "Done" });

      // The rule is between them, which is the whole claim.
      expect(done.compareDocumentPosition(rule as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(archive.compareDocumentPosition(rule as Node)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
    });
  },
};

/** And options sharing a `group` are drawn under it, in the order they were given. */
export const AGroupIsAHeadingOverItsOptions: Story = {
  args: {},
  play: async ({ canvas }) => {
    await inTheList(canvas.getByLabelText(/^On success/), (list) => {
      const lanes = within(list).getByRole("group", { name: "Lanes" });
      expect(
        within(lanes)
          .getAllByRole("option")
          .map((row) => row.textContent),
      ).toEqual(["Review", "QA", "Done"]);
    });
  },
};

/**
 * A heading is not something you can pick. Neither is a rule — Radix marks it `aria-hidden`, so
 * the list a screen reader walks is still four options and one of them is `Stay here`.
 */
export const AHeadingIsNotAnOption: Story = {
  args: {},
  play: async ({ canvas }) => {
    await inTheList(canvas.getByLabelText(/^On success/), (list) => {
      expect(
        within(list)
          .getAllByRole("option")
          .map((row) => row.textContent),
      ).toEqual(["Stay here", "Review", "QA", "Done", "Archive it"]);
    });
  },
};

/** Choosing one still writes to the field, rule or no rule above it. */
export const ChoosingTheOddOneOutStillWorks: Story = {
  args: {},
  play: async ({ canvas }) => {
    const trigger = canvas.getByLabelText(/^On success/);
    expect(trigger).toHaveTextContent("Stay here");

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Archive it" }));
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    expect(trigger).toHaveTextContent("Archive it");
  },
};

/**
 * And a list of peers is still a list of peers: nothing is written until an option is not one, so
 * a plain `{ value, label }[]` draws no heading and no rule.
 */
export const AFlatListIsStillFlat: Story = {
  args: { options: LISTS },
  play: async ({ canvas }) => {
    await inTheList(canvas.getByLabelText(/^On success/), (list) => {
      expect(list.querySelectorAll("[data-slot=select-separator]")).toHaveLength(0);
      expect(within(list).queryAllByRole("group", { name: /./ })).toHaveLength(0);
      expect(within(list).getAllByRole("option")).toHaveLength(2);
    });
  },
};
