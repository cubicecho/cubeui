import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, type ReactNode, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DateTimeInput as CompiledDateTimeInput } from "../compiled/date-time-input";
import { Label as CompiledLabel } from "../compiled/label";
import {
  type DateTimeInputProps,
  DateTimeInput as NativeDateTimeInput,
} from "../registry/ui/date-time-input";
import { Label as NativeLabel } from "../registry/ui/label";
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
    // Unnamed, the time box keeps the name it always had.
    await expect(native.querySelector("input")).toHaveAccessibleName("Time");
    await expect(compiled.querySelector("input")).toHaveAccessibleName("Time");
    await assertRequired(native, "Native starts");
    await assertRequired(compiled, "Compiled starts");
  },
};

type LabelComponent = ComponentType<{ id?: string; htmlFor?: string; children?: ReactNode }>;

/**
 * The ways a form names the field — issues #101 and #111. Each half uses its own `Label`, except for the
 * `htmlFor` row on the native half: the native `Label` has no `htmlFor` to give, so that row uses
 * a DOM `<label>` to prove the trigger's `id` still reaches the element under react-native-web.
 */
function NamedFields({
  Field,
  Label,
  prefix,
  htmlForLabel,
}: {
  Field: Field;
  Label: LabelComponent;
  prefix: string;
  htmlForLabel: LabelComponent;
}) {
  const [due, setDue] = useState<Date | null>(null);
  const [starts, setStarts] = useState(() => new Date(2026, 8, 3, 9, 0));
  const [ends, setEnds] = useState(() => new Date(2026, 8, 3, 17, 0));
  const [review, setReview] = useState<Date | null>(null);
  const HtmlForLabel = htmlForLabel;
  return (
    <div className="flex flex-col gap-3">
      <HtmlForLabel htmlFor={`${prefix}-due`}>{`${prefix} due`}</HtmlForLabel>
      <Field id={`${prefix}-due`} clearable mode="date" value={due} onChange={setDue} />
      <Label id={`${prefix}-starts-label`}>{`${prefix} starts`}</Label>
      <Field aria-labelledby={`${prefix}-starts-label`} value={starts} onChange={setStarts} />
      <Field aria-label={`${prefix} ends`} value={ends} onChange={setEnds} />
      <Field
        aria-label={`${prefix} review`}
        clearable
        mode="date"
        placeholder="No due date"
        value={review}
        onChange={setReview}
      />
    </div>
  );
}

function DomLabel({
  id,
  htmlFor,
  children,
}: {
  id?: string;
  htmlFor?: string;
  children?: ReactNode;
}) {
  return (
    <label id={id} htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}

async function assertNamed(section: HTMLElement, prefix: string) {
  const half = within(section);
  const [due, starts, ends, review] = half.getAllByRole("button");
  if (!due || !starts || !ends || !review) throw new Error("four triggers should render");

  // `htmlFor` → the trigger's `id`, and the label names it. A `<label for>` replaces the
  // button's contents as its name, so the placeholder is only its text — which is why the skill
  // sends a field that wants the date in its name to `aria-labelledby` (issue #111).
  await expect(due).toHaveAttribute("id", `${prefix}-due`);
  await expect(due).toHaveAccessibleName(`${prefix} due`);
  await expect(due).toHaveTextContent("Pick a date");

  // The date-only fields draw no time box, so the two inputs are the starts and ends time boxes.
  // Read through the accessible-name algorithm rather than `getByLabelText`: the starts box names
  // itself partly by pointing at its own id, which a label-text query does not follow.
  const [startsTime, endsTime] = Array.from(section.querySelectorAll("input"));
  if (!startsTime || !endsTime) throw new Error("both datetime fields should draw a time box");

  // `aria-labelledby` names the trigger by the label and then the date, so the date is not lost
  // to the name (issue #111); the time box is the label's name plus "time".
  await expect(starts).toHaveAccessibleName(`${prefix} starts September 3rd, 2026`);
  await expect(startsTime).toHaveValue("09:00");
  await expect(startsTime).toHaveAccessibleName(`${prefix} starts time`);

  // `aria-label` is composed with the date, and the time box is derived from the bare label.
  await expect(ends).toHaveAccessibleName(`${prefix} ends, September 3rd, 2026`);
  await expect(endsTime).toHaveValue("17:00");
  await expect(endsTime).toHaveAccessibleName(`${prefix} ends, time`);

  // Empty, the placeholder stands in for the date in the name.
  await expect(review).toHaveAccessibleName(`${prefix} review, No due date`);
}

export const NamedByAForm: Story = {
  render: () => (
    <SideBySide
      native={
        <NamedFields
          Field={NativeDateTimeInput}
          Label={NativeLabel}
          htmlForLabel={DomLabel}
          prefix="Native"
        />
      }
      compiled={
        <NamedFields
          Field={CompiledDateTimeInput}
          Label={CompiledLabel}
          htmlForLabel={CompiledLabel}
          prefix="Compiled"
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const [native, compiled] = Array.from(canvasElement.querySelectorAll("section"));
    if (!native || !compiled) throw new Error("both halves should render");
    await assertNamed(native, "Native");
    await assertNamed(compiled, "Compiled");
  },
};
