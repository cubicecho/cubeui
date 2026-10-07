import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ColorField as CompiledColorField } from "../compiled/color-picker-field";
import { DateTimeField as CompiledDateTimeField } from "../compiled/date-time-field";
import {
  FieldRow as CompiledFieldRow,
  Form as CompiledForm,
  createAppForm as compiledCreateAppForm,
} from "../compiled/form";
import { MultiSelectField as CompiledMultiSelectField } from "../compiled/multi-select-form-field";
import { SegmentedField as CompiledSegmentedField } from "../compiled/segmented-field";
import { ColorField as NativeColorField } from "../registry/ui/color-picker-field";
import { DateTimeField as NativeDateTimeField } from "../registry/ui/date-time-field";
import {
  FieldRow as NativeFieldRow,
  Form as NativeForm,
  createAppForm as nativeCreateAppForm,
} from "../registry/ui/form";
import { MultiSelectField as NativeMultiSelectField } from "../registry/ui/multi-select-form-field";
import { SegmentedField as NativeSegmentedField } from "../registry/ui/segmented-field";
import { SideBySide } from "./side-by-side";

/**
 * The native form hook — issue #115. `useAppForm` with every bound field on `field.*`, the heavy
 * two added by `createAppForm`, on both halves: react-native-web on the left, the compiled DOM on
 * the right. What is asserted is what a screen reader hears — the date in the trigger's name, a
 * name on the swatch row — and that `SubmitButton`'s `disabled` only ever tightens the guard.
 */
const meta = { title: "RN Parity/Form" } satisfies Meta;
export default meta;
type Story = StoryObj;

const SWATCHES = ["#ef4444", "#22c55e", "#3b82f6"];

const native = nativeCreateAppForm({
  DateTimeField: NativeDateTimeField,
  ColorField: NativeColorField,
  MultiSelectField: NativeMultiSelectField,
  SegmentedField: NativeSegmentedField,
});
const compiled = compiledCreateAppForm({
  DateTimeField: CompiledDateTimeField,
  ColorField: CompiledColorField,
  MultiSelectField: CompiledMultiSelectField,
  SegmentedField: CompiledSegmentedField,
});

type Kit = { useAppForm: typeof native.useAppForm; Form: typeof NativeForm };

function TodoForm({ kit, blocked }: { kit: Kit; blocked?: boolean | undefined }) {
  const { useAppForm, Form } = kit;
  const form = useAppForm({
    defaultValues: {
      title: "",
      done: false,
      notify: true,
      due: new Date(2026, 8, 15) as Date | null,
      color: "#3b82f6",
    },
    onSubmit: () => {},
  });
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <form.AppField
          name="title"
          validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
        >
          {(field) => (
            <field.InputField label="Title" description="What needs to be done." required />
          )}
        </form.AppField>
        <form.AppField name="done">{(field) => <field.CheckboxField label="Done" />}</form.AppField>
        <form.AppField name="notify">
          {(field) => <field.SwitchField label="Notify" description="A reminder on the day." />}
        </form.AppField>
        <form.AppField name="due">
          {(field) => <field.DateTimeField label="Due" mode="date" clearable />}
        </form.AppField>
        <form.AppField name="color">
          {(field) => <field.ColorField label="Colour" swatches={SWATCHES} />}
        </form.AppField>
        <form.SubmitButton createLabel="Save" disabled={blocked} />
      </Form>
    </form.AppForm>
  );
}

const NATIVE: Kit = { useAppForm: native.useAppForm, Form: NativeForm };

// The compiled module is the same source through the compiler; its refs are DOM elements.
const COMPILED = { useAppForm: compiled.useAppForm, Form: CompiledForm } as unknown as Kit;

function halves(canvasElement: HTMLElement) {
  const sections = Array.from(canvasElement.querySelectorAll("section"));
  if (sections.length !== 2) throw new Error("both halves should render");
  return sections.map((section) => within(section));
}

/** Every field on `field.*`, each named by its label without the caller naming the control. */
export const Fields: Story = {
  render: () => (
    <SideBySide native={<TodoForm kit={NATIVE} />} compiled={<TodoForm kit={COMPILED} />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      // The hint line and `required` reach a text field too (#238).
      const title = half.getByRole("textbox", { name: "Title" });
      await expect(title).toHaveAccessibleDescription("What needs to be done.");
      await expect(title).toHaveAttribute("aria-required", "true");
      await expect(half.getByRole("checkbox", { name: "Done" })).toBeInTheDocument();
      await expect(half.getByRole("switch", { name: "Notify" })).toBeInTheDocument();
      // `asGroup`: the label and then the date, not the label alone.
      await expect(
        half.getByRole("button", { name: "Due September 15th, 2026" }),
      ).toBeInTheDocument();
      // The swatch row is a radiogroup, which a `<label>` cannot name; the label's id does.
      await expect(half.getByRole("radiogroup", { name: "Colour" })).toBeInTheDocument();
      await expect(half.getByRole("button", { name: "Save" })).toBeEnabled();
    }
  },
};

/** Silent until a submit, then an alert, `aria-invalid`, and a Save that cannot be pressed again. */
export const Errors: Story = {
  render: () => (
    <SideBySide native={<TodoForm kit={NATIVE} />} compiled={<TodoForm kit={COMPILED} />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      const title = half.getByRole("textbox", { name: "Title" });
      await expect(half.queryByRole("alert")).toBeNull();

      await userEvent.click(half.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(half.getByRole("alert")).toHaveTextContent("Title is required"));
      await expect(title).toHaveAttribute("aria-invalid", "true");
      await expect(half.getByRole("button", { name: "Save" })).toBeDisabled();

      await userEvent.type(title, "Buy milk");
      await waitFor(() => expect(half.queryByRole("alert")).toBeNull());
      await expect(half.getByRole("button", { name: "Save" })).toBeEnabled();
    }
  },
};

/** A reason the store cannot know disables a valid form. */
export const DisabledFromOutside: Story = {
  render: () => (
    <SideBySide
      native={<TodoForm kit={NATIVE} blocked />}
      compiled={<TodoForm kit={COMPILED} blocked />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      await expect(half.getByRole("button", { name: "Save" })).toBeDisabled();
    }
  },
};

/** `disabled={false}` is OR-ed, not an override: an invalid form stays disabled. */
export const DisabledFalseCannotEnable: Story = {
  render: () => (
    <SideBySide
      native={<TodoForm kit={NATIVE} blocked={false} />}
      compiled={<TodoForm kit={COMPILED} blocked={false} />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      await userEvent.click(half.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(half.getByRole("alert")).toBeInTheDocument());
      await expect(half.getByRole("button", { name: "Save" })).toBeDisabled();
    }
  },
};

type RowKit = Kit & { FieldRow: typeof NativeFieldRow };

function NameForm({ kit }: { kit: RowKit }) {
  const { useAppForm, Form, FieldRow } = kit;
  const form = useAppForm({
    defaultValues: { first: "", last: "", middle: "" },
    onSubmit: () => {},
  });
  const hasMiddle = false;
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <FieldRow
          contentSlot={
            <>
              <form.AppField name="first">
                {(field) => <field.InputField label="First name" />}
              </form.AppField>
              {hasMiddle && (
                <form.AppField name="middle">
                  {(field) => <field.InputField label="Middle name" />}
                </form.AppField>
              )}
              <form.AppField name="last">
                {(field) => <field.InputField label="Last name" />}
              </form.AppField>
            </>
          }
        />
      </Form>
    </form.AppForm>
  );
}

/**
 * `FieldRow` takes `contentSlot`, as the web one does (#280): the fragment is opened into a cell
 * per field, so the two share a line, and the field that rendered nothing left no cell behind.
 */
export const Row: Story = {
  render: () => (
    <SideBySide
      native={<NameForm kit={{ ...NATIVE, FieldRow: NativeFieldRow }} />}
      compiled={
        <NameForm
          kit={{ ...COMPILED, FieldRow: CompiledFieldRow as unknown as typeof NativeFieldRow }}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      const first = half.getByRole("textbox", { name: "First name" });
      const last = half.getByRole("textbox", { name: "Last name" });
      const a = first.getBoundingClientRect();
      const b = last.getBoundingClientRect();
      await expect(Math.round(a.top)).toBe(Math.round(b.top));
      await expect(b.left).toBeGreaterThan(a.right);
      // Equal cells, so nothing sits in a third one.
      await expect(Math.round(a.width)).toBe(Math.round(b.width));
    }
  },
};

const TYPES = [
  { label: "Friend", value: "friend" },
  { label: "Colleague", value: "colleague" },
];

function RelationshipForm({ kit }: { kit: Kit }) {
  const { useAppForm, Form } = kit;
  const [types, setTypes] = useState(TYPES);
  const form = useAppForm({
    defaultValues: { type: "", role: "" },
    onSubmit: () => {},
  });
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <form.AppField name="type">
          {(field) => <field.SelectField label="Type" options={types} placeholder="Pick a type" />}
        </form.AppField>
        <form.AppField name="role">
          {(field) => (
            <field.SelectField label="Role" options={[]} placeholder="No roles yet" disabled />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.type}>
          {(type) => <output aria-label="Stored type">{type}</output>}
        </form.Subscribe>
        <button type="button" onClick={() => form.setFieldValue("type", "mentor")}>
          Create and pick
        </button>
        <button
          type="button"
          onClick={() => setTypes([...TYPES, { label: "Mentor", value: "mentor" }])}
        >
          Refetch
        </button>
      </Form>
    </form.AppForm>
  );
}

/**
 * `SelectField` takes `disabled`, and keeps a value its list does not hold yet (#278). The second
 * is the dialog that creates an option and picks it before the refetch lands: inside a `<form>`
 * the web select used to hand `""` back for a value with no item, so the field cleared itself and
 * its validator fired a moment before the option arrived.
 */
export const SelectKeepsAValueAheadOfItsOption: Story = {
  render: () => (
    <SideBySide
      native={<RelationshipForm kit={NATIVE} />}
      compiled={<RelationshipForm kit={COMPILED} />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      // Named by its label, which is the wiring landing on the trigger and not on the root.
      const role = half.getByLabelText("Role");
      await expect(role).toHaveTextContent("No roles yet");
      await expect(role).toBeDisabled();

      await userEvent.click(half.getByRole("button", { name: "Create and pick" }));
      const stored = half.getByLabelText("Stored type");
      await waitFor(() => expect(stored).toHaveTextContent("mentor"));
      // The cleared value arrived on a later tick, so the wait is what makes this a test of it.
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(stored).toHaveTextContent("mentor");

      await userEvent.click(half.getByRole("button", { name: "Refetch" }));
      await waitFor(() => expect(half.getByLabelText("Type")).toHaveTextContent("Mentor"));
      await expect(stored).toHaveTextContent("mentor");
    }
  },
};

const LABELS = [
  { value: "family", label: "Family" },
  { value: "work", label: "Work" },
  { value: "school", label: "School" },
];
const CHANNELS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "in-person", label: "In person" },
];

function InteractionForm({ kit }: { kit: Kit }) {
  const { useAppForm, Form } = kit;
  const form = useAppForm({
    defaultValues: { labelIds: ["work"] as string[], channel: "call" },
    onSubmit: () => {},
  });
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <form.AppField name="labelIds">
          {(field) => <field.MultiSelectField label="Labels" options={LABELS} />}
        </form.AppField>
        <form.AppField
          name="channel"
          validators={{
            onChange: ({ value }) => (value === "email" ? "Email is not logged here" : undefined),
          }}
        >
          {(field) => (
            <field.SegmentedField label="Channel" description="How you spoke." options={CHANNELS} />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <output aria-label="Stored">{`${values.labelIds.join("+")} by ${values.channel}`}</output>
          )}
        </form.Subscribe>
      </Form>
    </form.AppForm>
  );
}

/**
 * The two bound fields a form used to wire by hand (#279), passed to `createAppForm` as
 * `DateTimeField` is: a `MultiSelect` over a list of strings and a `SegmentedGroup` over one. Each
 * is named by its label, writes the field, and shows the field's error.
 */
export const MultiSelectAndSegmented: Story = {
  render: () => (
    <SideBySide
      native={<InteractionForm kit={NATIVE} />}
      compiled={<InteractionForm kit={COMPILED} />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves(canvasElement)) {
      const stored = half.getByLabelText("Stored");
      await expect(stored).toHaveTextContent("work by call");

      const channel = half.getByRole("group", { name: "Channel" });
      await expect(within(channel).getByRole("button", { name: "Call" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await userEvent.click(within(channel).getByRole("button", { name: "In person" }));
      await expect(stored).toHaveTextContent("work by in-person");

      await userEvent.click(within(channel).getByRole("button", { name: "Email" }));
      await waitFor(() => expect(half.getByRole("alert")).toHaveTextContent("Email is not logged"));
      await userEvent.click(within(channel).getByRole("button", { name: "Call" }));

      // The list is in a portal, outside the half.
      await userEvent.click(half.getByRole("combobox", { name: /Labels/ }));
      const page = within(canvasElement.ownerDocument.body);
      await userEvent.click(await page.findByRole("option", { name: "Family" }));
      await waitFor(() => expect(stored).toHaveTextContent("work+family by call"));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(page.queryByRole("option", { name: "Family" })).toBeNull());
    }
  },
};
