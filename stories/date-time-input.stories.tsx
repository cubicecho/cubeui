import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DateTimeInput as CompiledDateTimeInput } from "../compiled/date-time-input";
import {
  type DateTimeInputProps,
  DateTimeInput as NativeDateTimeInput,
} from "../registry/ui/date-time-input";
import { SideBySide } from "./side-by-side";

/**
 * `DateTimeInput` on both web halves: react-native-web on the left, the compiled DOM on the right.
 *
 * The optional, date-only field is issue #88 — a due date an Expo app could not enter without
 * falling back to an `Input type="date"` and its own ISO conversions. The default story holds the
 * other side of the same change: a caller that never asked for `clearable` gets the field it had,
 * with no Clear and no way to receive a `null`.
 */
const meta = { title: "Stage 0/DateTimeInput" } satisfies Meta;
export default meta;
type Story = StoryObj;

type Field = ComponentType<DateTimeInputProps>;

// The `null` is opt-in, and these are the lines that prove it — a type error here is the API
// changing under an existing caller.
const typeChecks = (Field: Field) => {
  const setDate = (_: Date) => {};
  const setMaybe = (_: Date | null) => {};
  return [
    <Field key="a" value={new Date()} onChange={setDate} />,
    <Field key="b" value={new Date()} onChange={setDate} mode="date" />,
    <Field key="c" clearable value={null} onChange={setMaybe} mode="date" />,
    // @ts-expect-error — `null` without `clearable`
    <Field key="d" value={null} onChange={setMaybe} />,
    // @ts-expect-error — a clearable field can hand back `null`, which a `(Date) => void` cannot take
    <Field key="e" clearable value={new Date()} onChange={setDate} />,
  ];
};
void typeChecks;

/** What the last `onChange` said, as local wall-clock time so midnight is visible. */
function describe(value: Date | null | undefined): string {
  if (value === undefined) return "nothing yet";
  if (value === null) return "null";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function OptionalDate({ Field, name }: { Field: Field; name: string }) {
  const [value, setValue] = useState<Date | null>(null);
  const [last, setLast] = useState<Date | null | undefined>(undefined);
  return (
    <div className="flex flex-col gap-2">
      <Field
        clearable
        mode="date"
        placeholder={name}
        value={value}
        onChange={(next) => {
          setValue(next);
          setLast(next);
        }}
      />
      <output aria-label={`${name} committed`}>{describe(last)}</output>
    </div>
  );
}

function RequiredDateTime({ Field, name }: { Field: Field; name: string }) {
  const [value, setValue] = useState(() => new Date(2026, 8, 3, 14, 30));
  return (
    <div className="flex flex-col gap-2">
      <Field value={value} onChange={setValue} />
      <output aria-label={`${name} committed`}>{describe(value)}</output>
    </div>
  );
}

const body = () => within(document.body);

async function openAndPick(canvasElement: HTMLElement, trigger: RegExp | string, day: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: trigger }));
  const dialog = await body().findByRole("dialog");
  await userEvent.click(within(dialog).getByText(day));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
}

async function assertOptionalDate(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);
  const committed = () => canvas.getByRole("status", { name: `${name} committed` });

  // Empty: the trigger reads the placeholder, and date mode draws no time field.
  await expect(canvas.getByRole("button", { name })).toBeInTheDocument();

  await openAndPick(canvasElement, name, "15");
  // Date-only: the pick is committed at local midnight.
  await waitFor(() => expect(committed()).toHaveTextContent(/-15 00:00$/));
  await expect(canvas.queryByRole("button", { name })).toBeNull();

  // Cleared from the popover, and the placeholder comes back.
  const trigger = canvas.getByRole("button", { name: /15/ });
  await userEvent.click(trigger);
  const dialog = await body().findByRole("dialog");
  await userEvent.click(within(dialog).getByRole("button", { name: /Clear/ }));
  await waitFor(() => expect(committed()).toHaveTextContent("null"));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
}

export const OptionalDateOnly: Story = {
  render: () => (
    <SideBySide
      native={<OptionalDate Field={NativeDateTimeInput} name="Native due date" />}
      compiled={<OptionalDate Field={CompiledDateTimeInput} name="Compiled due date" />}
    />
  ),
  play: async ({ canvasElement }) => {
    // No time field on either half.
    await expect(canvasElement.querySelector("input")).toBeNull();
    await assertOptionalDate(canvasElement, "Native due date");
    await assertOptionalDate(canvasElement, "Compiled due date");
  },
};

async function assertRequired(section: HTMLElement, name: string) {
  const half = within(section);
  const committed = () => half.getByRole("status", { name: `${name} committed` });
  await expect(committed()).toHaveTextContent("2026-09-03 14:30");

  await openAndPick(section, /September 3rd, 2026/, "15");
  // The day moves and the clock does not.
  await waitFor(() => expect(committed()).toHaveTextContent("2026-09-15 14:30"));

  // No Clear on a field that never asked for one.
  await userEvent.click(half.getByRole("button", { name: /September 15th, 2026/ }));
  const dialog = await body().findByRole("dialog");
  await expect(within(dialog).queryByRole("button", { name: /Clear/ })).toBeNull();
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
}

export const RequiredDateAndTime: Story = {
  render: () => (
    <SideBySide
      native={<RequiredDateTime Field={NativeDateTimeInput} name="Native starts" />}
      compiled={<RequiredDateTime Field={CompiledDateTimeInput} name="Compiled starts" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const [native, compiled] = Array.from(canvasElement.querySelectorAll("section"));
    if (!native || !compiled) throw new Error("both halves should render");
    // The time field is there on both halves.
    await expect(native.querySelector("input")).not.toBeNull();
    await expect(compiled.querySelector("input")).not.toBeNull();
    await assertRequired(native, "Native starts");
    await assertRequired(compiled, "Compiled starts");
  },
};
