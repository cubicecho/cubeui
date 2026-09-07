import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
  InputField,
  SelectField,
  SwitchField,
  TextareaField,
  useAppForm,
} from "@/registry/new-york/form/app-form";
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
  /** A reason not to submit that the form store cannot know. See the stories at the bottom. */
  submitDisabled?: boolean;
};

/**
 * `auto-cal`'s `TodoForm`, as it is written with these components: no ids, no `aria-describedby`,
 * no "has this been touched yet", no error plumbing. Each field is its label and its validator.
 *
 * And each field is one element. The same form written with `form.AppField` needs a render prop
 * and a closing tag around every one of these — six fields, eighteen extra lines, none of which
 * say anything about the form. The render-prop version is still there for the fields that need
 * the `field` object; these six never did.
 */
function TodoForm({ loading = false, onSubmit, submitDisabled }: TodoFormProps) {
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
      <InputField
        form={form}
        name="title"
        label="Title"
        required
        loading={loading}
        placeholder="What needs to be done?"
        validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Title is required") }}
      />

      <TextareaField
        form={form}
        name="description"
        label="Description"
        description="Optional. Notes, links, anything you want beside it later."
        loading={loading}
        rows={3}
        placeholder="Add any notes or details…"
      />

      <SelectField
        form={form}
        name="list"
        label="List"
        required
        loading={loading}
        options={LISTS}
        placeholder="Choose a list"
        validators={{
          onChange: ({ value }) =>
            value ? undefined : "Pick a list — a todo with nowhere to go is never seen again.",
        }}
        listeners={{
          onChange: ({ value }) => {
            // Filing something under Work answers a question the form was about to ask again.
            // Guarded on the other field having been left alone, because a listener that writes
            // over a choice somebody made is not a convenience, it is the form arguing back.
            if (form.state.fieldMeta.priority?.isTouched) return;
            form.setFieldValue("priority", value === "work" ? "3" : "2");
          },
        }}
      />

      <FieldRow
        content={
          <>
            <SelectField
              form={form}
              name="priority"
              label="Priority"
              loading={loading}
              options={PRIORITIES}
            />
            <SelectField
              form={form}
              name="minutes"
              label="Duration"
              loading={loading}
              options={DURATIONS}
            />
          </>
        }
      />

      <SwitchField
        form={form}
        name="schedule"
        label="Schedule it automatically"
        description="Finds the next free block that fits the duration."
        loading={loading}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <form.AppForm>
          <form.SubmitButton disabled={submitDisabled}>Create Todo</form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}

/**
 * Choose an option from a `SelectField`, and wait for the popover to actually be gone.
 *
 * The wait is not politeness. Radix animates the list out and holds `pointer-events: none` on the
 * body until it has finished, so the next click in a story lands on nothing — and the axe run
 * every story gets catches the closing listbox on its way out and reports it as one with no name.
 */
async function choose(trigger: HTMLElement, option: string | RegExp) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole("option", { name: option }));
  await waitFor(() => {
    expect(screen.queryByRole("listbox")).toBeNull();
  });
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

/**
 * A reason not to submit that lives outside the form.
 *
 * `canSubmit` and `isSubmitting` are the two the store knows, and they are not all of them: a
 * composer whose other tab has a mutation in flight, a settings form that is valid but identical
 * to the row it was opened from. Without a way to say those, the whole component gets dropped for
 * a hand-written `<Button type="submit">` that re-derives the two it did know — which is the
 * duplication this exists to remove.
 */
export const AnOutsideReasonCanDisableIt: Story = {
  args: { submitDisabled: true },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Create Todo" })).toBeDisabled();
  },
};

/**
 * And it is OR-ed, so it only ever *tightens*. `disabled={false}` is a caller saying it has no
 * objection of its own, not a caller overruling the store — an invalid form stays refused.
 *
 * The ordering matters as much as the OR: `disabled` is written after `{...props}` rather than
 * before it, so nothing spread in can land on top of the store's answer.
 */
export const ItCannotBeUsedToEnableAnInvalidForm: Story = {
  args: { submitDisabled: false },
  play: async ({ canvas, canvasElement }) => {
    const submit = canvas.getByRole("button", { name: "Create Todo" });

    // Nothing is filled in, so submitting fails validation and the store closes the form.
    await userEvent.click(submit);
    await waitFor(() => {
      expect(canvasElement.querySelectorAll("[data-slot=field-error]").length).toBeGreaterThan(0);
    });

    expect(submit).toBeDisabled();
  },
};

/**
 * A field that has to *do* something when it changes is still one line. `listeners` rides along
 * beside `validators` — the two are the same kind of field-level option, and both are handed
 * straight to the field underneath.
 *
 * Without it forwarded, this field alone would have to be written as a `form.AppField` with a
 * render prop around it, purely to reach a prop the wrapper had not passed on: three extra lines
 * and a closure, at every field with a side effect, in every form.
 */
export const AFieldCanActOnAChange: Story = {
  args: {},
  play: async ({ canvas }) => {
    expect(canvas.getByLabelText(/^Priority/)).toHaveTextContent("Normal");

    await choose(canvas.getByLabelText(/^List/), "Work");

    expect(canvas.getByLabelText(/^Priority/)).toHaveTextContent("High");
  },
};

/**
 * And the listener is the caller's, so the guard in it is too. This one checks whether the field
 * it is about to write to has been touched, which is the difference between a form that fills
 * something in for you and a form that undoes what you just chose.
 */
export const AListenerDoesNotOverwriteAChoice: Story = {
  args: {},
  play: async ({ canvas }) => {
    await choose(canvas.getByLabelText(/^Priority/), "Low");
    expect(canvas.getByLabelText(/^Priority/)).toHaveTextContent("Low");

    await choose(canvas.getByLabelText(/^List/), "Work");

    expect(canvas.getByLabelText(/^Priority/)).toHaveTextContent("Low");
  },
};
