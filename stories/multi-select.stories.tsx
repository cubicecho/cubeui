import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
  isAddableOptionName,
  MultiSelect,
  type MultiSelectOption,
  mergeMultiSelectOptions,
} from "@/registry/new-york/control/multi-select";

const TAGS: MultiSelectOption[] = [
  { value: "backend", label: "Backend infrastructure" },
  { value: "frontend", label: "Frontend" },
  { value: "work", label: "Work", color: "#1d4ed8" },
  { value: "workshop", label: "Workshop", color: "#fbbf24" },
  { value: "urgent", label: "Urgent", color: "#dc2626" },
  { value: "someday", label: "Someday", disabled: true },
];

function Harness({
  options = TAGS,
  initial = [],
  ...props
}: Partial<React.ComponentProps<typeof MultiSelect>> & {
  options?: MultiSelectOption[];
  initial?: string[];
}) {
  const [value, setValue] = useState<string[]>(initial);
  const [extra, setExtra] = useState<MultiSelectOption[]>([]);

  return (
    <div className="w-80">
      <MultiSelect
        aria-label="Tags"
        {...props}
        options={[...options, ...extra]}
        value={value}
        onValueChange={setValue}
        onCreateOption={
          props.onCreateOption === undefined
            ? undefined
            : (name) => {
                const created = { value: name.toLowerCase(), label: name };
                setExtra((all) => [...all, created]);
                setValue((all) => [...all, created.value]);
              }
        }
      />
    </div>
  );
}

const meta = {
  title: "Control/MultiSelect",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithSelection: Story = { args: { initial: ["work", "urgent"] } };

/**
 * The one the hand-rolled version cannot do. Tab to it, Enter to open, arrow, Enter to choose,
 * Escape to close — none of which the `div`-with-an-outside-click-listener version supports,
 * although it announces itself as a combobox.
 */
export const ItWorksFromTheKeyboard: Story = {
  args: {},
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    await userEvent.keyboard("{Enter}");

    await screen.findByRole("listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Radix supplies this through `asChild`, so it points at a popover that exists.
    const controls = trigger.getAttribute("aria-controls");
    expect(document.getElementById(controls as string)).not.toBeNull();

    // cmdk highlights the first option on open, so one ArrowDown lands on the second.
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Frontend"));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  },
};

/**
 * Chosen options say so on the option itself, where a screen reader reads it — as `aria-checked`
 * rather than `aria-selected`, because cmdk spends `aria-selected` on which option is
 * *highlighted* and overwrites whatever it is handed.
 */
export const SelectionIsAnnounced: Story = {
  args: { initial: ["work"] },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    const work = await screen.findByRole("option", { name: "Work" });
    expect(work).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("option", { name: "Frontend" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

/** Choosing again removes it — the whole difference between this and a select. */
export const ChoosingTwiceDeselects: Story = {
  args: { initial: ["work"] },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Work" }));
    await waitFor(() => expect(trigger).not.toHaveTextContent("Work"));
  },
};

/**
 * Search matches every word, in any order. cmdk's default is a fuzzy ranker built for a command
 * palette; "back end" finding "Backend infrastructure" is what a list of tags actually needs.
 */
export const SearchMatchesEveryWord: Story = {
  args: {},
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    await userEvent.type(await screen.findByRole("combobox", { name: /Search/i }), "infra back");

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });
    expect(screen.getByRole("option")).toHaveTextContent("Backend infrastructure");
  },
};

/**
 * "Work" stays creatable while "Workshop" exists. The version in one of these apps tests with
 * `.includes`, so a tag whose name is a prefix of another can never be created — and the button
 * simply is not there, with nothing to say why.
 */
export const APrefixOfAnExistingNameIsStillAddable: Story = {
  args: { onCreateOption: () => {} },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    await userEvent.click(trigger);
    const search = await screen.findByRole("combobox", { name: /Search/i });

    await userEvent.type(search, "Works");
    expect(await screen.findByRole("option", { name: /Add .Works./ })).toBeVisible();

    // An exact name, case and space aside, is not addable — that is the duplicate.
    await userEvent.clear(search);
    await userEvent.type(search, "  workshop ");
    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /Add / })).toBeNull();
    });
  },
};

/**
 * The create row is a row, not a keydown handler. cmdk consumes Enter to choose the highlighted
 * option, so a listener on the input races it — and loses whenever anything is highlighted.
 */
export const CreatingAddsAndSelects: Story = {
  args: { onCreateOption: () => {} },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    await userEvent.click(trigger);
    await userEvent.type(await screen.findByRole("combobox", { name: /Search/i }), "Roadmap");
    await userEvent.click(await screen.findByRole("option", { name: /Add .Roadmap./ }));

    await waitFor(() => expect(trigger).toHaveTextContent("Roadmap"));
  },
};

/**
 * A value the options do not cover still draws, and can still be removed. It is a tag that was
 * deleted, or a page of options that has not arrived — and without this the chip is invisible,
 * still submitted, and impossible to take off.
 */
export const AValueWithNoOptionIsStillShown: Story = {
  args: { initial: ["work", "ghost-id"] },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    expect(trigger).toHaveTextContent("ghost-id");

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "ghost-id" }));
    await waitFor(() => expect(trigger).not.toHaveTextContent("ghost-id"));
  },
};

/** Past `maxDisplay` the chips become a count, so the trigger cannot grow without bound. */
export const ManySelectionsCollapse: Story = {
  args: { initial: ["backend", "frontend", "work", "workshop", "urgent"], maxDisplay: 2 },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("combobox", { name: "Tags" })).toHaveTextContent("+3");
  },
};

/**
 * Clear lives in the popover's footer. Inside the trigger it would be a `<button>` inside a
 * `<button>` — invalid markup, and unreachable by keyboard in every browser.
 */
export const ClearIsReachable: Story = {
  args: { initial: ["work", "urgent"] },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Tags" });
    expect(trigger.querySelectorAll("button")).toHaveLength(0);

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    await waitFor(() => expect(trigger).toHaveTextContent("Select…"));
  },
};

/** With few options the search box is only in the way. */
export const WithoutSearch: Story = {
  args: { searchable: false },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    await screen.findByRole("listbox");
    expect(screen.queryByRole("combobox", { name: /Search/i })).toBeNull();
  },
};

/** Coloured chips read their own text colour rather than assuming white. */
export const ColouredOptions: Story = {
  args: { initial: ["work", "workshop", "urgent"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amber = canvas.getByText("Workshop");
    // `#fbbf24` is a light background: white text on it is 1.8:1, so the chip goes dark.
    expect(amber).toHaveStyle({ color: "rgb(0, 0, 0)" });
    expect(canvas.getByText("Urgent")).toHaveStyle({ color: "rgb(255, 255, 255)" });
  },
};

/** The two helpers, checked directly — they are exported because call sites need them too. */
export const TheHelpersHoldUp: Story = {
  args: {},
  play: async () => {
    expect(mergeMultiSelectOptions(TAGS, ["work", "nope"]).at(-1)).toEqual({
      value: "nope",
      label: "nope",
    });
    expect(mergeMultiSelectOptions(TAGS, ["work"])).toHaveLength(TAGS.length);

    expect(isAddableOptionName("Works", TAGS)).toBe(true);
    expect(isAddableOptionName(" WORKSHOP ", TAGS)).toBe(false);
    expect(isAddableOptionName("   ", TAGS)).toBe(false);
  },
};

const DEPENDENCIES: MultiSelectOption[] = [
  { value: "api", label: "Ship the API" },
  { value: "docs", label: "Write the docs" },
  {
    value: "deploy",
    label: "Deploy",
    disabled: true,
    hint: "Waiting on this would close a loop: Deploy → Test → this card",
  },
];

/**
 * kanban-server's dependency picker, and the case the prop is for: a card that already leads back
 * to this one is offered disabled, because choosing it would close a cycle.
 *
 * Greyed out on its own reads as a bug in the picker. The reason is knowable when the options are
 * built and unreachable by the time somebody wonders — and it cannot be a tooltip, because a
 * disabled row fires no hover, which is the same trap `ActionButton` was written for.
 */
export const ADisabledOptionCanSayWhy: Story = {
  args: { options: DEPENDENCIES },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));

    const deploy = await screen.findByRole("option", { name: "Deploy" });
    expect(deploy).toHaveAttribute("aria-disabled", "true");

    // Drawn, not hovered for: the reason is on the screen the whole time the row is. Waited on
    // rather than read straight away, because Radix fades the popover in and a rectangle part-way
    // through that is not yet visible.
    await waitFor(() => {
      expect(within(deploy).getByText(/would close a loop/)).toBeVisible();
    });
  },
};

/**
 * And it is a *description*, not part of the name.
 *
 * Rendered inside the row, the hint would otherwise be swept into the accessible name by the
 * contents — so the option would announce as "Deploy Waiting on this would close a loop…" and
 * then read the same sentence again as its description. `aria-label` pins the name to the label
 * and `aria-describedby` carries the reason, which is `ActionButton`'s arrangement exactly.
 */
export const TheHintIsADescriptionNotAName: Story = {
  args: { options: DEPENDENCIES },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));

    // The name is the label alone — an exact match, so any of the hint leaking in fails here.
    const deploy = await screen.findByRole("option", { name: "Deploy" });

    const describedBy = deploy.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const hint = document.getElementById(describedBy ?? "");
    expect(hint).toHaveTextContent(/would close a loop/);
    expect(hint).toHaveAttribute("data-slot", "multi-select-option-hint");

    // An option with nothing to explain points at nothing, so it is not described by an empty
    // node — the same rule `ActionButton` follows for a missing hint.
    expect(screen.getByRole("option", { name: "Ship the API" })).not.toHaveAttribute(
      "aria-describedby",
    );
  },
};

/**
 * The headings on screen — `:not([hidden])` because cmdk hides a group whose rows have all been
 * filtered out rather than removing it, which is the behaviour worth having and would otherwise
 * make a search look like it had left three headings over one card.
 */
function headingsIn(list: HTMLElement): (string | null)[] {
  return [...list.querySelectorAll("[cmdk-group]:not([hidden]) [cmdk-group-heading]")].map(
    (heading) => heading.textContent,
  );
}

/**
 * kanban-server's "what does this card wait on" picker, which is where the row ran out of room:
 * two hundred titles, and "has this one been done" is a question about where the card is.
 *
 * The lane is a heading and the status is a badge at the end of the row. Both used to be pushed
 * into `keywords`, so they could be searched for and could not be seen.
 */
const BLOCKERS: MultiSelectOption[] = [
  { value: "key", label: "Rotate the signing key", group: "In progress", meta: "running" },
  { value: "billing", label: "Fix billing", group: "In progress", meta: "error" },
  { value: "docs", label: "Write the docs", group: "Review", meta: "idle" },
  { value: "api", label: "Ship the API", group: "Done", meta: "done" },
  { value: "v1", label: "Drop the v1 client", group: "Done", meta: "archived" },
];

/**
 * The groups are drawn in the order they were given. A board's lanes are ordered — In progress
 * comes before Done because that is the way the work moves — and sorting them alphabetically
 * would put Done first, which is the one order that is wrong.
 */
export const RowsAreGroupedByLane: Story = {
  args: { options: BLOCKERS },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    const list = await screen.findByRole("listbox");

    await waitFor(() => {
      expect(headingsIn(list)).toEqual(["In progress", "Review", "Done"]);
    });
  },
};

/**
 * The badge is read after the name, not as part of it. `label` is still the whole accessible
 * name — which is also what the chip says, so a status cannot leak onto the trigger.
 */
export const AStatusIsReadAfterTheName: Story = {
  args: { options: BLOCKERS, initial: ["billing"] },
  play: async ({ canvas }) => {
    // The chip is the label alone. An exact match, so any of the badge leaking in fails here.
    expect(canvas.getByRole("combobox", { name: "Tags" })).toHaveTextContent("Fix billing");

    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    const row = await screen.findByRole("option", { name: "Fix billing" });

    const meta = document.getElementById(row.getAttribute("aria-describedby") ?? "");
    expect(meta).toHaveAttribute("data-slot", "multi-select-option-meta");
    expect(meta).toHaveTextContent("error");
  },
};

/**
 * The heading is searched along with the row, so a lane's name still finds the cards in it — and
 * cmdk drops a heading whose rows have all been filtered out, so what is left is a list of one
 * lane rather than three headings over one card.
 */
export const SearchingForALaneFindsItsCards: Story = {
  args: { options: BLOCKERS },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    await userEvent.type(await screen.findByRole("combobox", { name: /Search/i }), "in progress");

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });
    expect(headingsIn(screen.getByRole("listbox"))).toEqual(["In progress"]);
  },
};

/** A list that has not asked for a heading still does not get one. */
export const AnUngroupedListDrawsNoHeading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Tags" }));
    const list = await screen.findByRole("listbox");

    expect(headingsIn(list)).toHaveLength(0);
  },
};
