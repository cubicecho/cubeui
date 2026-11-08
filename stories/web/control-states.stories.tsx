import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { tokenColor } from "../token-color";

/**
 * Each form control on its own, in the states a screen puts it in: at rest, focused from the
 * keyboard, disabled and refused (#489). The gallery draws each one once, at rest, so a state
 * that went wrong was only seen where a screen happened to use it.
 *
 * Every play moves focus with the keyboard, from the control at rest to the one beside it, so the
 * story is left showing the focus look; a click would show none, which is what `focus-visible`
 * is for.
 */
const meta = {
  title: "Controls/States",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** One state, captioned, in a row of them that wraps at a phone's width. */
function States({ states }: { states: [caption: string, node: ReactNode][] }) {
  return (
    <div className="flex max-w-full flex-row flex-wrap items-start gap-6 bg-background p-6 text-foreground">
      {states.map(([caption, node]) => (
        <figure key={caption} className="m-0 flex min-w-0 flex-col items-start gap-2">
          <figcaption className="text-foreground/60 text-xs">{caption}</figcaption>
          {node}
        </figure>
      ))}
    </div>
  );
}

const style = (element: Element) => getComputedStyle(element);

/** Focuses `from`, then Tab, which must land on `to`: focus that a keyboard moved. */
async function tabFrom(from: HTMLElement, to: HTMLElement) {
  from.focus();
  await userEvent.tab();
  await waitFor(() => expect(to).toHaveFocus());
}

export const CheckboxStates: Story = {
  name: "Checkbox",
  render: () => (
    <States
      states={[
        ["Rest", <Checkbox key="rest" aria-label="Rest" />],
        ["Focused", <Checkbox key="focused" aria-label="Focused" />],
        ["Checked", <Checkbox key="checked" aria-label="Checked" defaultChecked />],
        ["Disabled", <Checkbox key="disabled" aria-label="Disabled" disabled />],
        [
          "Disabled, checked",
          <Checkbox
            key="disabled-checked"
            aria-label="Disabled, checked"
            disabled
            defaultChecked
          />,
        ],
        ["Invalid", <Checkbox key="invalid" aria-label="Invalid" aria-invalid />],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const box = (name: string) => within(canvasElement).getByRole("checkbox", { name });
    await expect(box("Disabled")).toBeDisabled();
    await expect(box("Disabled, checked")).toBeChecked();
    await expect(style(box("Invalid")).borderTopColor).toBe(tokenColor("negative"));
    await expect(style(box("Checked")).borderTopColor).toBe(tokenColor("active"));
    await tabFrom(box("Rest"), box("Focused"));
    await waitFor(() => expect(style(box("Focused")).backgroundColor).toBe(tokenColor("hover")));
  },
};

export const SwitchStates: Story = {
  name: "Switch",
  render: () => (
    <States
      states={[
        ["Rest", <Switch key="rest" aria-label="Rest" />],
        ["Focused", <Switch key="focused" aria-label="Focused" />],
        ["On", <Switch key="on" aria-label="On" defaultChecked />],
        ["Disabled", <Switch key="disabled" aria-label="Disabled" disabled />],
        [
          "Disabled, on",
          <Switch key="disabled-on" aria-label="Disabled, on" disabled defaultChecked />,
        ],
        ["Invalid", <Switch key="invalid" aria-label="Invalid" aria-invalid defaultChecked />],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const track = (name: string) => within(canvasElement).getByRole("switch", { name });
    await expect(track("Disabled")).toBeDisabled();
    await expect(style(track("Invalid")).borderTopColor).toBe(tokenColor("negative"));
    // An off switch shows focus in its edge, and keeps its `/50` track.
    await tabFrom(track("Rest"), track("Focused"));
    await waitFor(() => expect(style(track("Focused")).borderTopColor).toBe(tokenColor("active")));
  },
};

function Transport({
  name,
  disabled = false,
  invalid = false,
}: {
  name: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Select defaultValue="http" disabled={disabled}>
      <SelectTrigger aria-label={name} aria-invalid={invalid || undefined} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="http">HTTP</SelectItem>
        <SelectItem value="stdio">Standard I/O</SelectItem>
      </SelectContent>
    </Select>
  );
}

export const SelectStates: Story = {
  name: "Select",
  render: () => (
    <States
      states={[
        ["Rest", <Transport key="rest" name="Rest" />],
        ["Focused", <Transport key="focused" name="Focused" />],
        ["Disabled", <Transport key="disabled" name="Disabled" disabled />],
        ["Invalid", <Transport key="invalid" name="Invalid" invalid />],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const trigger = (name: string) => within(canvasElement).getByRole("combobox", { name });
    await expect(trigger("Disabled")).toBeDisabled();
    await expect(style(trigger("Invalid")).borderTopColor).toBe(tokenColor("negative"));
    await tabFrom(trigger("Rest"), trigger("Focused"));
    await waitFor(() =>
      expect(style(trigger("Focused")).borderTopColor).toBe(tokenColor("active")),
    );
  },
};

const MONTH = new Date(2026, 8, 1);
const PICKED = new Date(2026, 8, 15);
const SUNDAY = 0;
const SATURDAY = 6;
const isWeekend = (date: Date) => date.getDay() === SUNDAY || date.getDay() === SATURDAY;

function PickedCalendar() {
  const [day, setDay] = useState<Date | undefined>(PICKED);
  return (
    <Calendar
      mode="single"
      selected={day}
      onSelect={setDay}
      defaultMonth={MONTH}
      disabled={isWeekend}
      className="rounded-lg border border-foreground/10"
    />
  );
}

/**
 * A picked day, the weekends refused, and the day the keyboard moved to: the arrow keys move a
 * calendar's focus, so focus lands on the day after the picked one.
 */
export const CalendarStates: Story = {
  name: "Calendar",
  render: () => <PickedCalendar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const day = (label: RegExp) =>
      canvas
        .getAllByRole("button")
        .find((button) => label.test(button.getAttribute("aria-label") ?? "")) as HTMLElement;
    const picked = day(/September 15th/);
    const saturday = day(/September 19th/);
    await expect(saturday).toBeDisabled();
    picked.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(day(/September 16th/)).toHaveFocus());
  },
};

/**
 * A label at rest, and faded beside a disabled control: shadcn's `peer-disabled:`, for a label
 * written after its control. Inside a `Field` the field fades its label itself (see Field).
 */
export const LabelStates: Story = {
  name: "Label",
  render: () => (
    <States
      states={[
        [
          "Rest",
          <div key="rest" className="flex flex-row items-center gap-2">
            <Checkbox id="label-rest" className="peer" />
            <Label htmlFor="label-rest">Email me about releases</Label>
          </div>,
        ],
        [
          "Disabled",
          <div key="disabled" className="flex flex-row items-center gap-2">
            <Checkbox id="label-disabled" className="peer" disabled />
            <Label htmlFor="label-disabled">Email me about releases</Label>
          </div>,
        ],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const labels = canvasElement.querySelectorAll("label");
    await expect(labels).toHaveLength(2);
    await expect(style(labels[0] as Element).opacity).toBe("1");
    await expect(style(labels[1] as Element).opacity).toBe("0.5");
  },
};

function EmailField({
  id,
  disabled = false,
  invalid = false,
}: {
  id: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Field disabled={disabled} data-invalid={invalid || undefined} className="w-64 max-w-full">
      <FieldLabel htmlFor={id}>Email</FieldLabel>
      <FieldContent>
        <Input
          id={id}
          defaultValue={invalid ? "ada@" : "ada@example.com"}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-line`}
        />
        {invalid ? (
          <FieldError id={`${id}-line`}>An email has a domain after the @.</FieldError>
        ) : (
          <FieldDescription id={`${id}-line`}>Where receipts are sent.</FieldDescription>
        )}
      </FieldContent>
    </Field>
  );
}

/** A whole field: its label, control and description fade together, and a refusal is its error. */
export const FieldStates: Story = {
  name: "Field",
  render: () => (
    <States
      states={[
        ["Rest", <EmailField key="rest" id="field-rest" />],
        ["Focused", <EmailField key="focused" id="field-focused" />],
        ["Disabled", <EmailField key="disabled" id="field-disabled" disabled />],
        ["Invalid", <EmailField key="invalid" id="field-invalid" invalid />],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const input = (id: string) => canvasElement.querySelector<HTMLElement>(`#${id}`) as HTMLElement;
    await expect(input("field-disabled")).toBeDisabled();
    await expect(within(canvasElement).getAllByRole("group")[2]).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(input("field-invalid")).toHaveAccessibleDescription(
      "An email has a domain after the @.",
    );
    await expect(style(input("field-invalid")).borderTopColor).toBe(tokenColor("negative"));
    await tabFrom(input("field-rest"), input("field-focused"));
    await waitFor(() =>
      expect(style(input("field-focused")).borderTopColor).toBe(tokenColor("active")),
    );
  },
};

export const TextareaStates: Story = {
  name: "Textarea",
  render: () => (
    <States
      states={[
        ["Rest", <Textarea key="rest" aria-label="Rest" rows={3} className="w-56" />],
        ["Focused", <Textarea key="focused" aria-label="Focused" rows={3} className="w-56" />],
        [
          "Disabled",
          <Textarea
            key="disabled"
            aria-label="Disabled"
            rows={3}
            className="w-56"
            disabled
            defaultValue="Locked while the run is going."
          />,
        ],
        [
          "Invalid",
          <Textarea key="invalid" aria-label="Invalid" rows={3} className="w-56" aria-invalid />,
        ],
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const box = (name: string) => within(canvasElement).getByRole("textbox", { name });
    await expect(box("Disabled")).toBeDisabled();
    await expect(style(box("Invalid")).borderTopColor).toBe(tokenColor("negative"));
    await tabFrom(box("Rest"), box("Focused"));
    await waitFor(() => expect(style(box("Focused")).borderTopColor).toBe(tokenColor("active")));
  },
};
