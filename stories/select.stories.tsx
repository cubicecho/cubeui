import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Select, type SelectEntry } from "@/registry/new-york/control/select";
import { FormField } from "@/registry/new-york/form/form-field";

/**
 * kanban-server's "On success" picker, unbound: where a card goes when it passes. Three kinds of
 * answer — stay where it is, one of the other lanes, or archive it, which is not a lane at all.
 */
const DESTINATIONS: readonly SelectEntry[] = [
  { value: "stay", label: "Stay here" },
  { value: "review", label: "Review", group: "Lanes" },
  { value: "qa", label: "QA", group: "Lanes" },
  { value: "done", label: "Done", group: "Lanes" },
  { separator: true },
  { value: "archive", label: "Archive it" },
];

const LISTS: readonly SelectEntry[] = [
  { value: "inbox", label: "Inbox" },
  { value: "work", label: "Work" },
];

function Harness({
  options = DESTINATIONS,
  initial = "",
  ...props
}: Partial<ComponentProps<typeof Select>> & {
  options?: readonly SelectEntry[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial);

  return (
    <div className="w-[320px]">
      <Select
        aria-label="On success"
        placeholder="Pick one"
        {...props}
        options={options}
        value={value}
        onValueChange={setValue}
      />
      {/* The value, read back out, so a story can assert what the control committed rather than
          what its trigger happens to be showing. */}
      <p data-testid="value">{value === "" ? "—" : value}</p>
    </div>
  );
}

const meta = {
  title: "Control/Select",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

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
 * The reason the file exists: a select outside a form.
 *
 * `SelectField` needs a TanStack form object, so a filter bar, a search box or a `useState`
 * screen had no answer but to assemble the trigger, the value, the content and the mapped items
 * by hand — ten of those across these projects, each one a chance to put the wiring somewhere
 * Radix does not read it.
 */
export const ItIsAControlWithAValue: Story = {
  args: {},
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "On success" });
    expect(trigger).toHaveTextContent("Pick one");
    expect(canvas.getByTestId("value")).toHaveTextContent("—");

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Archive it" }));
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    expect(canvas.getByTestId("value")).toHaveTextContent("archive");
    expect(trigger).toHaveTextContent("Archive it");
  },
};

/**
 * The detail every hand-written select field gets wrong. `Select`'s Radix root renders no DOM,
 * so an `id` or an `aria-invalid` put on it goes nowhere at all — silently, because nothing
 * errors and the attribute simply is not in the document. They belong on the trigger, and this
 * takes the rest of a `<button>`'s props there.
 *
 * Which is what makes it drop into `FormField`'s function form: the label's `htmlFor` finds the
 * trigger, the error is what the trigger is described by, and the invalid state is on the thing
 * a screen reader is standing on.
 */
export const TheWiringLandsOnTheTrigger: Story = {
  args: {},
  render: (args) => (
    <FormField
      label="On success"
      description="Where the card goes when it passes."
      error="Pick a destination"
      control={(wired) => <Harness {...args} {...wired} aria-label={undefined} />}
    />
  ),
  play: async ({ canvas }) => {
    // Found by its label, which means `htmlFor` resolved to the trigger and not to a root that
    // drew nothing.
    const trigger = canvas.getByLabelText(/^On success/);
    expect(trigger).toHaveAttribute("aria-invalid", "true");

    const describedBy = trigger.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy.length).toBeGreaterThan(0);
    const described = describedBy.map((id) => document.getElementById(id)?.textContent).join(" ");
    expect(described).toContain("Pick a destination");
  },
};

/**
 * The row that is not a lane is not drawn as one. Without a rule above it, "Archive it" sits
 * flush against the lane names and reads as another of them — and the workaround is a sentence
 * doing a divider's job, `"Archive it — off the board"`, which does not survive a long list.
 */
export const AnOptionThatIsNotALaneIsNotDrawnAsOne: Story = {
  args: {},
  play: async ({ canvas }) => {
    await inTheList(canvas.getByRole("combobox", { name: "On success" }), (list) => {
      const rule = list.querySelector("[data-slot=select-separator]");
      expect(rule).not.toBeNull();

      const archive = within(list).getByRole("option", { name: "Archive it" });
      const done = within(list).getByRole("option", { name: "Done" });

      expect(done.compareDocumentPosition(rule as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(archive.compareDocumentPosition(rule as Node)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
    });
  },
};

/** And options sharing a `group` are drawn under it, in the order they were given. */
export const AGroupIsAHeadingOverItsOptions: Story = {
  args: {},
  play: async ({ canvas }) => {
    await inTheList(canvas.getByRole("combobox", { name: "On success" }), (list) => {
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
 * And a list of peers is still a list of peers: nothing is written until an option is not one, so
 * a plain `{ value, label }[]` draws no heading and no rule.
 */
export const AFlatListIsStillFlat: Story = {
  args: { options: LISTS },
  play: async ({ canvas }) => {
    await inTheList(canvas.getByRole("combobox", { name: "On success" }), (list) => {
      expect(list.querySelectorAll("[data-slot=select-separator]")).toHaveLength(0);
      expect(within(list).queryAllByRole("group", { name: /./ })).toHaveLength(0);
      expect(within(list).getAllByRole("option")).toHaveLength(2);
    });
  },
};

/**
 * Full width by default, because a select in a field is one and a trigger that shrinks to its
 * longest option makes a column of them ragged. A caller who wants a narrow one in a toolbar
 * says so, and `cn` lets the later width win rather than shipping both.
 */
export const ItFillsItsColumnUnlessToldOtherwise: Story = {
  args: {},
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Harness {...args} aria-label="Wide" />
      <Harness {...args} aria-label="Narrow" className="w-40" />
    </div>
  ),
  play: async ({ canvas }) => {
    const wide = canvas.getByRole("combobox", { name: "Wide" });
    const narrow = canvas.getByRole("combobox", { name: "Narrow" });

    expect(narrow.className).toContain("w-40");
    expect(narrow.getBoundingClientRect().width).toBeLessThan(wide.getBoundingClientRect().width);
  },
};

/** Disabled reaches the trigger through the root, so there is nothing to open. */
export const Disabled: Story = {
  args: { disabled: true, initial: "stay" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "On success" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent("Stay here");
  },
};
