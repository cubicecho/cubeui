import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useAppForm } from "@/registry/new-york/form/app-form";
import { FieldRow } from "@/registry/new-york/form/field-row";
import { Button } from "@/registry/new-york/ui/button";

const PRIORITIES = [
  { value: "1", label: "Low" },
  { value: "2", label: "Normal" },
  { value: "3", label: "High" },
];

const DURATIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
];

const LISTS = [
  { value: "inbox", label: "Inbox" },
  { value: "work", label: "Work" },
];

type TodoFormProps = {
  loading?: boolean;
  onSubmit?: (value: unknown) => void;
};

/**
 * `auto-cal`'s `TodoForm`, as it is written with these components: no ids, no `aria-describedby`,
 * no "has this been touched yet", no error plumbing. Each field is its label and its validator.
 */
function TodoForm({ loading = false, onSubmit }: TodoFormProps) {
  const form = useAppForm({
    defaultValues: {
      title: "",
      description: "",
      list: "",
      priority: "2",
      minutes: "30",
      schedule: true,
    },
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
      <form.AppField
        name="title"
        validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
      >
        {(field) => (
          <field.InputField
            label="Title"
            required
            loading={loading}
            placeholder="What needs to be done?"
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {(field) => (
          <field.TextareaField
            label="Description"
            description="Optional. Notes, links, anything you want beside it later."
            loading={loading}
            rows={3}
            placeholder="Add any notes or details…"
          />
        )}
      </form.AppField>

      <form.AppField
        name="list"
        validators={{
          onChange: ({ value }) =>
            value ? undefined : "Pick a list — a todo with nowhere to go is never seen again.",
        }}
      >
        {(field) => (
          <field.SelectField
            label="List"
            required
            loading={loading}
            options={LISTS}
            placeholder="Choose a list"
          />
        )}
      </form.AppField>

      <FieldRow
        content={
          <>
            <form.AppField name="priority">
              {(field) => (
                <field.SelectField label="Priority" loading={loading} options={PRIORITIES} />
              )}
            </form.AppField>
            <form.AppField name="minutes">
              {(field) => (
                <field.SelectField label="Duration" loading={loading} options={DURATIONS} />
              )}
            </form.AppField>
          </>
        }
      />

      <form.AppField name="schedule">
        {(field) => (
          <field.SwitchField
            label="Schedule it automatically"
            description="Finds the next free block that fits the duration."
            loading={loading}
          />
        )}
      </form.AppField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <form.AppForm>
          <form.SubmitButton>Create Todo</form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}

const meta = {
  title: "Form/AppForm",
  component: TodoForm,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TodoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A form does not open covered in red. Nothing has been touched, nothing has been submitted.
    expect(canvasElement.querySelector("[data-slot=field-error]")).toBeNull();

    const title = canvas.getByLabelText(/^Title/);
    await userEvent.type(title, "Write the registry docs");
    expect(title).toHaveValue("Write the registry docs");
  },
};

/**
 * What the layer is for, in one assertion: every field reports at the same moment, in the same
 * voice, and the *select* reports too — a trigger with `aria-invalid` and an error it is
 * described by, which is the half that every hand-written select field in these apps drops.
 */
export const ErrorsWaitForTheSubmit: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvasElement.querySelectorAll("[data-slot=field-error]")).toHaveLength(0);

    await userEvent.click(canvas.getByRole("button", { name: "Create Todo" }));

    await waitFor(() => {
      expect(canvasElement.querySelectorAll("[data-slot=field-error]")).toHaveLength(2);
    });

    const title = canvas.getByLabelText(/^Title/);
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Title is required");

    const list = canvas.getByLabelText(/^List/);
    expect(list).toHaveAttribute("data-slot", "select-trigger");
    expect(list).toHaveAttribute("aria-invalid", "true");
    expect(list).toHaveAccessibleDescription(
      "Pick a list — a todo with nowhere to go is never seen again.",
    );

    // And each one is announced rather than merely printed beside the field.
    for (const error of canvasElement.querySelectorAll("[data-slot=field-error]")) {
      expect(error).toHaveAttribute("role", "alert");
    }
  },
};

/** Typing clears the field's own message and leaves its neighbour's alone. */
export const FixingOneFieldClearsOneMessage: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create Todo" }));
    await waitFor(() => {
      expect(canvasElement.querySelectorAll("[data-slot=field-error]")).toHaveLength(2);
    });

    await userEvent.type(canvas.getByLabelText(/^Title/), "Write the registry docs");

    await waitFor(() => {
      expect(canvasElement.querySelectorAll("[data-slot=field-error]")).toHaveLength(1);
    });
    expect(canvas.getByLabelText(/^Title/)).not.toHaveAttribute("aria-invalid");
  },
};

/**
 * One flag, the whole form. The apps that hand-wrote this kept a second copy of every form built
 * out of skeleton twins, drifting from the real one; this is that, deleted.
 */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const skeletons = canvasElement.querySelectorAll("[data-slot=form-field-skeleton]");
    expect(skeletons).toHaveLength(6);

    // The labels are still there and still real — they are literals, not data being waited on.
    expect(canvasElement.textContent).toContain("Title");
    expect(canvasElement.textContent).toContain("Schedule it automatically");
  },
};
