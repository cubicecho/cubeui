import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import {
  combineDateAndTime,
  DatePicker,
  type DateRange,
  DateRangePicker,
  setTime,
} from "@/registry/new-york/control/date-picker";

/** Fixed, so "the 14th" means the same thing in June as it does in December. */
const JUNE_10 = new Date(2026, 5, 10, 9, 30);

function Harness({
  initial = null,
  ...props
}: Partial<React.ComponentProps<typeof DatePicker>> & { initial?: Date | null }) {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <div className="w-72">
      <DatePicker aria-label="Due date" {...props} value={value} onValueChange={setValue} />
    </div>
  );
}

const meta = {
  title: "Control/DatePicker",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithAValue: Story = { args: { initial: JUNE_10 } };

/** Choosing a day is the end of the interaction, so the calendar goes away. */
export const ChoosingADayCloses: Story = {
  args: { initial: JUNE_10 },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Due date/ });
    await userEvent.click(trigger);

    await userEvent.click(await screen.findByRole("button", { name: /June 14th, 2026/ }));

    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull());
    expect(trigger).toHaveTextContent("June 14th, 2026");
  },
};

/**
 * `showTime` is the whole of what a separate `DateTimePicker` was. And the clock survives the
 * day changing — `new Date(day)` from the calendar is midnight, which is how "9:30 on the 14th"
 * becomes "00:00 on the 14th" in the version this replaces.
 */
export const WithATime: Story = {
  args: { initial: JUNE_10, showTime: true },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Due date/ });
    expect(trigger).toHaveTextContent("9:30 AM");

    await userEvent.click(trigger);
    expect(await screen.findByLabelText("Time")).toHaveValue("09:30");

    await userEvent.click(await screen.findByRole("button", { name: /June 14th, 2026/ }));
    // Still open, because the time has not been given yet — and still 9:30.
    expect(await screen.findByLabelText("Time")).toHaveValue("09:30");
    expect(trigger).toHaveTextContent("June 14th, 2026");
    expect(trigger).toHaveTextContent("9:30 AM");
  },
};

/** With no date there is no time to set, so the box waits rather than inventing today. */
export const TheTimeBoxWaitsForADate: Story = {
  args: { showTime: true },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Due date/ }));
    expect(await screen.findByLabelText("Time")).toBeDisabled();
  },
};

/**
 * Clear is in the footer, not an `X` inside the trigger — a `<button>` inside a `<button>` is
 * invalid, and the inner one is unreachable by keyboard in every browser. All three pickers this
 * replaces do it the other way, and two then render an empty `h-4 w-4` div to hold the space.
 */
export const ClearIsAReachableButton: Story = {
  args: { initial: JUNE_10 },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Due date/ });
    expect(trigger.querySelectorAll("button")).toHaveLength(0);

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() => expect(trigger).toHaveTextContent("Pick a date"));
  },
};

/** The matcher goes straight through, so `{ before: … }` is all a "no past dates" rule takes. */
export const WithUnavailableDays: Story = {
  args: { initial: JUNE_10, disabledDates: { before: new Date(2026, 5, 10) } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Due date/ }));
    expect(await screen.findByRole("button", { name: /June 3rd, 2026/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /June 14th, 2026/ })).toBeEnabled();
  },
};

function RangeHarness({
  initial = null,
  ...props
}: Partial<React.ComponentProps<typeof DateRangePicker>> & { initial?: DateRange | null }) {
  const [value, setValue] = useState<DateRange | null>(initial);
  return (
    <div className="w-96">
      <DateRangePicker aria-label="Window" {...props} value={value} onValueChange={setValue} />
    </div>
  );
}

export const Range: StoryObj<typeof RangeHarness> = {
  render: (args) => <RangeHarness {...args} />,
  args: { initial: { from: new Date(2026, 5, 10), to: new Date(2026, 5, 17) } },
};

/**
 * The second date ends the interaction. The version this replaces holds no open state at all, so
 * the calendar stays over the rest of the form until something else is clicked.
 */
export const TheRangeClosesOnTheSecondDate: StoryObj<typeof RangeHarness> = {
  render: (args) => <RangeHarness {...args} />,
  // Empty, so there is no value to take the month from — `defaultMonth` is how a picker with
  // nothing set opens anywhere but today.
  args: { calendarProps: { defaultMonth: new Date(2026, 5, 1) } },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Window/ });
    await userEvent.click(trigger);

    await userEvent.click(await screen.findByRole("button", { name: /June 10th, 2026/ }));
    // One date is half a range, so it stays open.
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /June 17th, 2026/ }));
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull());
    expect(trigger).toHaveTextContent("Jun 10, 2026 – Jun 17, 2026");
  },
};

/** The two date helpers, which are exported because call sites do this arithmetic too. */
export const TheHelpersHoldUp: Story = {
  args: {},
  play: async () => {
    const day = new Date(2026, 5, 14);
    expect(combineDateAndTime(day, JUNE_10).toISOString()).toBe(
      new Date(2026, 5, 14, 9, 30).toISOString(),
    );
    expect(setTime(day, "14:05").toISOString()).toBe(new Date(2026, 5, 14, 14, 5).toISOString());

    // Neither touches what it was handed: a `Date` from props is somebody else's state.
    expect(day.getHours()).toBe(0);
    expect(JUNE_10.getHours()).toBe(9);
  },
};
