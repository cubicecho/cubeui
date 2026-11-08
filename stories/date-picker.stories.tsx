import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  DatePicker as CompiledDatePicker,
  DateRangePicker as CompiledDateRangePicker,
} from "../compiled/date-picker";
import { DateTimeInput as CompiledDateTimeInput } from "../compiled/date-time-input";
import {
  type DateRange,
  DatePicker as NativeDatePicker,
  DateRangePicker as NativeDateRangePicker,
} from "../registry/ui/date-picker";
import { DateTimeInput as NativeDateTimeInput } from "../registry/ui/date-time-input";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * `DatePicker` and `DateRangePicker` on both web halves: react-native-web on the left, the
 * compiled DOM on the right. The web tier's own stories (`stories/web/date-picker.stories.tsx`)
 * hold the DOM half to what it was before it had a native source; these hold the two halves to
 * each other.
 */
const meta = { title: "RN Parity/DatePicker" } satisfies Meta;
export default meta;
type Story = StoryObj;

type Picker = ComponentType<React.ComponentProps<typeof NativeDatePicker>>;
type RangePicker = ComponentType<React.ComponentProps<typeof NativeDateRangePicker>>;

/** What the last `onValueChange` said, as local wall-clock time so the clock is visible. */
function describe(value: Date | null | undefined): string {
  if (value === undefined) {
    return "nothing yet";
  }
  if (value === null) {
    return "null";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function describeRange(value: DateRange | null | undefined): string {
  if (value === undefined) {
    return "nothing yet";
  }
  if (value === null) {
    return "null";
  }
  return `${describe(value.from ?? null)} to ${value.to ? describe(value.to) : "open"}`;
}

function OneDate({ Picker, name, showTime }: { Picker: Picker; name: string; showTime?: true }) {
  const [value, setValue] = useState<Date | null>(() => new Date(2026, 8, 3, 14, 30));
  return (
    <div className="flex flex-col gap-2">
      <Picker aria-label={name} showTime={showTime} value={value} onValueChange={setValue} />
      <output aria-label={`${name} committed`}>{describe(value)}</output>
    </div>
  );
}

function ARange({ Picker, name }: { Picker: RangePicker; name: string }) {
  const [value, setValue] = useState<DateRange | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Picker
        aria-label={name}
        // One month, so each day's number is on the screen once.
        numberOfMonths={1}
        calendarProps={{ defaultMonth: new Date(2026, 8, 1) }}
        value={value}
        onValueChange={setValue}
      />
      <output aria-label={`${name} committed`}>{describeRange(value)}</output>
    </div>
  );
}

const body = () => within(document.body);

function halves(canvasElement: HTMLElement) {
  const [native, compiled] = Array.from(canvasElement.querySelectorAll("section"));
  if (!native || !compiled) {
    throw new Error("both halves should render");
  }
  return [native, compiled] as const;
}

async function assertOneDate(section: HTMLElement, name: string) {
  const half = within(section);
  const trigger = half.getByRole("button", { name });
  const committed = () => half.getByRole("status", { name: `${name} committed` });
  await expect(trigger).toHaveTextContent("September 3rd, 2026");

  // Picking a day closes the pane, and the clock survives the day changing.
  await userEvent.click(trigger);
  await userEvent.click(within(await body().findByRole("dialog")).getByText("15"));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(committed()).toHaveTextContent("2026-09-15 14:30"));

  // Clear is in the pane, not nested in the trigger.
  await expect(trigger.querySelectorAll("button")).toHaveLength(0);
  await userEvent.click(trigger);
  await userEvent.click(
    within(await body().findByRole("dialog")).getByRole("button", { name: /Clear/ }),
  );
  await waitFor(() => expect(committed()).toHaveTextContent("null"));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await expect(trigger).toHaveTextContent("Pick a date");
}

export const OneDateAndClear: Story = {
  render: () => (
    <SideBySide
      native={<OneDate Picker={NativeDatePicker} name="Native due" />}
      compiled={<OneDate Picker={CompiledDatePicker} name="Compiled due" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const [native, compiled] = halves(canvasElement);
    // The slot `DateField`'s stories select on. The source writes it on the `Button`, which
    // react-native-web drops and the compiled `<button>` keeps.
    await expect(within(compiled).getByRole("button", { name: "Compiled due" })).toHaveAttribute(
      "data-slot",
      "date-picker-trigger",
    );
    await assertOneDate(native, "Native due");
    await assertOneDate(compiled, "Compiled due");
  },
};

async function assertTime(section: HTMLElement, name: string) {
  const half = within(section);
  const trigger = half.getByRole("button", { name });
  const committed = () => half.getByRole("status", { name: `${name} committed` });
  await expect(trigger).toHaveTextContent("2:30 PM");

  await userEvent.click(trigger);
  const dialog = await body().findByRole("dialog");
  await expect(within(dialog).getByLabelText("Time")).toHaveValue("14:30");

  // A day with a time still to come keeps the pane open, and keeps the clock.
  await userEvent.click(within(dialog).getByText("15"));
  await waitFor(() => expect(committed()).toHaveTextContent("2026-09-15 14:30"));
  await expect(body().getByRole("dialog")).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
}

export const WithATime: Story = {
  render: () => (
    <SideBySide
      native={<OneDate Picker={NativeDatePicker} name="Native starts" showTime />}
      compiled={<OneDate Picker={CompiledDatePicker} name="Compiled starts" showTime />}
    />
  ),
  play: async ({ canvasElement }) => {
    const [native, compiled] = halves(canvasElement);
    await assertTime(native, "Native starts");
    await assertTime(compiled, "Compiled starts");
  },
};

async function assertRange(section: HTMLElement, name: string) {
  const half = within(section);
  const trigger = half.getByRole("button", { name });
  const committed = () => half.getByRole("status", { name: `${name} committed` });
  await expect(trigger).toHaveTextContent("Pick a date range");

  await userEvent.click(trigger);
  await userEvent.click(within(await body().findByRole("dialog")).getByText("10"));
  // One press is half the interaction, so the pane stays open. What it commits differs: the
  // native grid holds a half range and react-day-picker a one-day one, so only `from` is asserted.
  await waitFor(() => expect(committed()).toHaveTextContent(/^2026-09-10 00:00 to/));
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect(body().getByRole("dialog")).toBeInTheDocument();

  await userEvent.click(within(body().getByRole("dialog")).getByText("17"));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await expect(committed()).toHaveTextContent("2026-09-10 00:00 to 2026-09-17 00:00");
  await expect(trigger).toHaveTextContent("Sep 10, 2026 – Sep 17, 2026");
}

export const ARangeClosesOnTheSecondDate: Story = {
  render: () => (
    <SideBySide
      native={<ARange Picker={NativeDateRangePicker} name="Native window" />}
      compiled={<ARange Picker={CompiledDateRangePicker} name="Compiled window" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const [native, compiled] = halves(canvasElement);
    await assertRange(native, "Native window");
    await assertRange(compiled, "Compiled window");
  },
};

type TimeInput = ComponentType<React.ComponentProps<typeof NativeDateTimeInput>>;

/** Every date trigger, valid and refused, so a field's border can be read off each. */
function Triggers({
  Picker,
  RangePicker,
  TimeInput,
  half,
}: {
  Picker: Picker;
  RangePicker: RangePicker;
  TimeInput: TimeInput;
  half: string;
}) {
  const noop = () => {};
  return (
    <div className="flex flex-col gap-3">
      <Picker aria-label={`${half} due`} value={null} onValueChange={noop} />
      <Picker aria-label={`${half} refused due`} aria-invalid value={null} onValueChange={noop} />
      <RangePicker aria-label={`${half} refused window`} aria-invalid onValueChange={noop} />
      <TimeInput
        aria-label={`${half} refused starts`}
        aria-invalid
        mode="date"
        clearable
        value={null}
        onChange={noop}
      />
    </div>
  );
}

/** Tabs from the canvas until `target` has focus, as a keyboard reaches it. */
async function tabTo(target: HTMLElement, canvasElement: HTMLElement) {
  const MAX_TABS = 20;
  await userEvent.click(canvasElement);
  for (let tabs = 0; tabs < MAX_TABS && document.activeElement !== target; tabs++) {
    await userEvent.tab();
  }
  await expect(target).toHaveFocus();
}

/**
 * The date triggers look like fields, as `Combobox`'s does (#464): a refused one is edged in
 * `negative`, and keyboard focus turns the edge `active` and leaves the fill on `background`,
 * where it used to fill with the hover grey and keep its grey edge. `DatePicker`,
 * `DateRangePicker` and `DateTimeInput` share the trigger, on both halves.
 */
export const TriggersLookLikeFields: Story = {
  render: () => (
    <SideBySide
      native={
        <Triggers
          Picker={NativeDatePicker}
          RangePicker={NativeDateRangePicker}
          TimeInput={NativeDateTimeInput}
          half="Native"
        />
      }
      compiled={
        <Triggers
          Picker={CompiledDatePicker}
          RangePicker={CompiledDateRangePicker}
          TimeInput={CompiledDateTimeInput}
          half="Compiled"
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const negative = tokenColor("negative");
    const active = tokenColor("active");
    const background = tokenColor("background");
    const edge = (el: HTMLElement) => getComputedStyle(el).borderTopColor;
    const fill = (el: HTMLElement) => getComputedStyle(el).backgroundColor;

    for (const half of ["Native", "Compiled"]) {
      await step(`${half}: a refused trigger is edged in negative`, async () => {
        for (const name of [`${half} refused due`, `${half} refused window`]) {
          await expect(edge(canvas.getByRole("button", { name }))).toBe(negative);
        }
        const starts = canvas.getByRole("button", { name: new RegExp(`^${half} refused starts`) });
        await expect(edge(starts)).toBe(negative);
        await expect(edge(canvas.getByRole("button", { name: `${half} due` }))).not.toBe(negative);
      });

      await step(`${half}: focus turns the edge active and keeps the fill`, async () => {
        const due = canvas.getByRole("button", { name: `${half} due` });
        await expect(fill(due)).toBe(background);
        await tabTo(due, canvasElement);
        // `waitFor`, because a button's colours transition.
        await waitFor(() => expect(edge(due)).toBe(active));
        await expect(fill(due)).toBe(background);

        // Focus wins over the refusal while it is being fixed, as it does in an input.
        const refused = canvas.getByRole("button", { name: `${half} refused due` });
        await tabTo(refused, canvasElement);
        await waitFor(() => expect(edge(refused)).toBe(active));
        await expect(fill(refused)).toBe(background);
      });
    }
  },
};
