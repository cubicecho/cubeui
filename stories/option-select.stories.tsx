import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { OptionSelect, type SelectEntry } from "@/registry/new-york/control/option-select";
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

/** task-server's model list: identifiers, which is why they are `font-mono`. */
const MODELS = ["gpt-4o-mini", "llama3.1:8b"];

/**
 * The sixth select. Its list belongs to the server, so nothing is asked for until the menu opens
 * — and the menu opens before the list exists, which is what the note is for.
 */
function Fetched() {
  const [value, setValue] = useState("");
  const [fetches, setFetches] = useState(0);
  const [models, setModels] = useState<readonly string[] | null>(null);

  const options: readonly SelectEntry[] = models
    ? models.map((id) => ({ value: id, label: id, className: "font-mono" }))
    : [{ note: "Loading…" }];

  return (
    <div className="w-[320px]">
      <OptionSelect
        aria-label="Model"
        placeholder="Choose a model"
        options={options}
        value={value}
        onValueChange={setValue}
        onOpenChange={(open) => {
          if (!open || models) return;
          setFetches((n) => n + 1);
          // Slow enough that the story can see the menu waiting, which is the state being tested.
          setTimeout(() => setModels(MODELS), 50);
        }}
      />
      {/* How many times the server was asked, so a story can assert that a closed menu asks
          nothing — the reason `onOpenChange` is here rather than a fetch on mount. */}
      <p data-testid="fetches">{fetches}</p>
      <p data-testid="value">{value === "" ? "—" : value}</p>
    </div>
  );
}

function Harness({
  options = DESTINATIONS,
  initial = "",
  ...props
}: Partial<ComponentProps<typeof OptionSelect>> & {
  options?: readonly SelectEntry[];
  initial?: string;
}) {
  const [value, setValue] = useState(initial);

  return (
    <div className="w-[320px]">
      <OptionSelect
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
  title: "Control/OptionSelect",
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
 * The detail every hand-written select field gets wrong. `OptionSelect`'s Radix root renders no DOM,
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

/**
 * The case this control could not express: a menu whose list is fetched when it opens.
 *
 * The fetch is `enabled: opened`, so a form of twenty fields asks the server nothing for the
 * eighteen the reader never touches — and `onOpenChange` is the only way to know, because Radix's
 * root is what holds the open state and the root is the one element this control does not hand
 * back. Without it, the sixth of task-server's six selects stayed on the primitives.
 */
export const TheMenuFillsWhenItOpens: Story = {
  args: {},
  render: () => <Fetched />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Model" });

    // Nothing was asked for until it was opened.
    expect(canvas.getByTestId("fetches")).toHaveTextContent("0");

    await userEvent.click(trigger);
    const list = await screen.findByRole("listbox");
    expect(canvas.getByTestId("fetches")).toHaveTextContent("1");

    // The menu is open and there is nothing in it yet, which is the whole point: it says so
    // rather than standing empty.
    expect(within(list).queryAllByRole("option")).toHaveLength(0);
    expect(list).toHaveTextContent("Loading…");

    await within(list).findByRole("option", { name: "gpt-4o-mini" });
    expect(list).not.toHaveTextContent("Loading…");

    await userEvent.click(within(list).getByRole("option", { name: "llama3.1:8b" }));
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    expect(canvas.getByTestId("value")).toHaveTextContent("llama3.1:8b");
  },
};

/**
 * And a note is not an option.
 *
 * The workaround everywhere else is a disabled option with the message as its label, which is a
 * row the keyboard walks onto and a reader hears as a choice they may not have. This is neither:
 * the row in the menu is `aria-hidden`, because a listbox may own only options and groups, and
 * the words are announced from a live region beside the control that is always mounted — a live
 * region added to the document in the same breath as its text is announced unreliably, and here
 * the menu opens *before* the list exists.
 */
export const ANoteIsNotAChoice: Story = {
  args: { options: [...LISTS, { note: "Two more are still loading…" }] },
  play: async ({ canvas }) => {
    // Always mounted, and it carries the words whether or not the menu is open.
    const live = canvas.getByRole("status");
    expect(live).toHaveTextContent("Two more are still loading…");

    await inTheList(canvas.getByRole("combobox", { name: "On success" }), (list) => {
      // Visible in the menu, and not a row anything can land on.
      expect(list).toHaveTextContent("Two more are still loading…");
      expect(within(list).getAllByRole("option")).toHaveLength(2);
      // Present, and out of the accessibility tree — so it is neither an option nor a row the
      // listbox owns, and it is not read twice.
      expect(within(list).getByText("Two more are still loading…")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  },
};

/**
 * An option's `className` is the row's, not the label's.
 *
 * Model ids, SHA prefixes and file paths are identifiers and want `font-mono`. The only way in
 * before this was to wrap the label, which styles the text and leaves the row's padding, tick and
 * highlight in the body face.
 */
export const AnOptionCanCarryAClass: Story = {
  args: {
    options: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini", className: "font-mono" },
      { value: "inbox", label: "Inbox" },
    ],
  },
  play: async ({ canvas }) => {
    await inTheList(canvas.getByRole("combobox", { name: "On success" }), (list) => {
      const identifier = within(list).getByRole("option", { name: "gpt-4o-mini" });
      const prose = within(list).getByRole("option", { name: "Inbox" });

      // On the row itself, which is what carries the padding and the highlight.
      expect(identifier).toHaveClass("font-mono");
      expect(getComputedStyle(identifier).fontFamily).not.toBe(getComputedStyle(prose).fontFamily);
    });
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
