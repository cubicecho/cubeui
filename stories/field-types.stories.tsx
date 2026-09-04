import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import type { DateRange } from "@/registry/new-york/control/date-picker";
import {
  InputField,
  NumberField,
  SelectField,
  useAppForm,
} from "@/registry/new-york/form/app-form";
import { DateField, DateRangeField } from "@/registry/new-york/form/date-field";
import { MultiSelectField } from "@/registry/new-york/form/multi-select-field";
import { Button } from "@/registry/new-york/ui/button";

const LISTS = [
  { value: "inbox", label: "Inbox" },
  { value: "work", label: "Work" },
];

const TAGS = [
  { value: "urgent", label: "Urgent", color: "#dc2626" },
  { value: "later", label: "Later" },
  { value: "review", label: "Review" },
];

type Values = {
  title: string;
  minutes: number | null;
  list: string;
  tags: string[];
  dueAt: Date | null;
  window: DateRange | null;
};

/**
 * The six field types every one of these apps has, each as one line, each over a field whose
 * type the compiler checked.
 */
function TaskForm({
  loading = false,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit?: (value: Values) => void;
}) {
  const form = useAppForm({
    defaultValues: {
      title: "",
      minutes: 25,
      list: "",
      tags: [],
      dueAt: null,
      window: null,
    } as Values,
    onSubmit: ({ value }) => onSubmit?.(value),
  });

  return (
    <form
      className="grid w-[520px] gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <InputField form={form} name="title" label="Title" required loading={loading} />
      <NumberField
        form={form}
        name="minutes"
        label="Minutes"
        loading={loading}
        min={0}
        step={5}
        description="How long you expect it to take."
        validators={{
          // `value` is `number | null` here, not `string` — the narrowing is the point.
          onChange: ({ value }) =>
            value != null && value > 480 ? "That is a whole day" : undefined,
        }}
      />
      <SelectField form={form} name="list" label="List" options={LISTS} loading={loading} />
      <MultiSelectField form={form} name="tags" label="Tags" options={TAGS} loading={loading} />
      <DateField form={form} name="dueAt" label="Due" showTime loading={loading} />
      <DateRangeField form={form} name="window" label="Window" loading={loading} />

      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
      <Button type="button" variant="outline">
        Cancel
      </Button>
    </form>
  );
}

const meta = {
  title: "Form/FieldTypes",
  component: TaskForm,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

/**
 * The reason each of these goes through `FormField` rather than being drawn at the call site:
 * every one of them is a control its label actually points at. The three date pickers and the
 * hand-rolled combobox this replaces all render a `<Label>` with no `htmlFor`, so all four are
 * unlabelled controls sitting next to some text.
 */
export const EveryFieldIsLabelled: Story = {
  args: {},
  play: async ({ canvas }) => {
    for (const name of ["Title", "Minutes", "List", "Tags", "Due", "Window"]) {
      expect(canvas.getByLabelText(new RegExp(`^${name}`))).toBeVisible();
    }
  },
};

/** And the popover controls are named through the same wiring the inputs use. */
export const ThePopoverFieldsAreRealControls: Story = {
  args: {},
  play: async ({ canvas }) => {
    expect(canvas.getByLabelText(/^Tags/)).toHaveAttribute("data-slot", "multi-select-trigger");
    expect(canvas.getByLabelText(/^Due/)).toHaveAttribute("data-slot", "date-picker-trigger");
    expect(canvas.getByLabelText(/^Window/)).toHaveAttribute("data-slot", "date-picker-trigger");
  },
};

/**
 * The bug under the fingers. Coercing on every keystroke and rendering the number back makes a
 * decimal point unreachable: the store rounds `1.` to `1`, React re-renders `"1"`, and `4.05`
 * cannot be typed at all.
 */
export const ADecimalCanBeTyped: Story = {
  args: {},
  play: async ({ canvas }) => {
    const minutes = canvas.getByLabelText(/^Minutes/);
    await userEvent.clear(minutes);
    await userEvent.type(minutes, "4.05");
    expect(minutes).toHaveValue(4.05);
  },
};

/** Empty is nothing, not zero — otherwise a cleared box passes a "must be set" validator. */
export const ClearingANumberIsNotZero: Story = {
  args: { onSubmit: () => {} },
  play: async ({ canvas }) => {
    const minutes = canvas.getByLabelText(/^Minutes/);
    await userEvent.clear(minutes);
    expect(minutes).toHaveValue(null);
  },
};

/** Choosing a tag writes into the array behind the field, and the trigger shows what is in it. */
export const ChoosingATagFillsTheField: Story = {
  args: {},
  play: async ({ canvas }) => {
    const tags = canvas.getByLabelText(/^Tags/);

    await userEvent.click(tags);
    await userEvent.click(await screen.findByRole("option", { name: /Urgent/ }));
    await userEvent.click(screen.getByRole("option", { name: /Review/ }));
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(within(tags).getByText("Urgent")).toBeVisible();
    });
    expect(within(tags).getByText("Review")).toBeVisible();
  },
};

/**
 * One flag, six fields, including the three that are popovers — the hand-written forms kept a
 * second skeleton copy of the layout, and it drifted from the real one every time.
 */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll("[data-slot=form-field-skeleton]")).toHaveLength(6);
    expect(canvasElement.textContent).toContain("Window");
  },
};
