import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import { useAppForm } from "@/registry/new-york/form/app-form";
import { ColorField } from "@/registry/new-york/form/color-field";
import { PasswordField } from "@/registry/new-york/form/password-field";
import { RadioGroupField } from "@/registry/new-york/form/radio-group-field";
import { Button } from "@/registry/new-york/ui/button";

const SWATCHES = ["#6366f1", "#ec4899", "#f59e0b", "#10b981"] as const;

const VISIBILITY = [
  { value: "private", label: "Private", description: "Only you can open it." },
  { value: "team", label: "Team", description: "Everyone in the workspace can open it." },
  { value: "public", label: "Public", description: "Anyone with the link.", disabled: true },
];

type Values = { name: string; color: string; visibility: string; token: string };

/** The three fields this batch adds, over one form. */
function TagForm({
  loading = false,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit?: (value: Values) => void;
}) {
  const form = useAppForm({
    defaultValues: { name: "", color: "", visibility: "private", token: "" } as Values,
    onSubmit: ({ value }) => onSubmit?.(value),
  });

  return (
    <form
      className="grid w-[520px] gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => <field.InputField label="Name" loading={loading} />}
      </form.AppField>
      <ColorField
        form={form}
        name="color"
        label="Colour"
        description="Shown on the tag itself."
        swatches={SWATCHES}
        loading={loading}
      />
      <RadioGroupField
        form={form}
        name="visibility"
        label="Visibility"
        required
        options={VISIBILITY}
        loading={loading}
      />
      <PasswordField
        form={form}
        name="token"
        label="Share token"
        autoComplete="off"
        loading={loading}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}

const meta = {
  title: "Form/BoundFields",
  component: TagForm,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TagForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

/**
 * Every one of them is named, including the radio group — which is the one HTML would not let a
 * `<label for>` reach.
 */
export const EveryFieldIsLabelled: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole("textbox", { name: "Name" })).toBeVisible();
    expect(canvas.getByRole("button", { name: /Colour/ })).toBeVisible();
    expect(canvas.getByRole("radiogroup", { name: /Visibility/ })).toBeVisible();
    expect(canvas.getByLabelText("Share token")).toBeVisible();
  },
};

/** The asterisk is decoration; `aria-required` is the part that is said out loud. */
export const TheGroupCarriesRequired: Story = {
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup", { name: /Visibility/ });
    expect(group).toHaveAttribute("aria-required", "true");
    expect(group).toHaveAccessibleName("Visibility");
  },
};

/** A per-option sentence is announced with that option, not with the group. */
export const AnOptionCarriesItsOwnDescription: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole("radio", { name: "Team" })).toHaveAccessibleDescription(
      "Everyone in the workspace can open it.",
    );
    expect(canvas.getByRole("radio", { name: "Private" })).toBeChecked();
  },
};

/** The whole option is the hit target, because each label is a real `<label for>`. */
export const ClickingTheLabelChoosesTheOption: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Team"));
    expect(canvas.getByRole("radio", { name: "Team" })).toBeChecked();
    expect(canvas.getByRole("radio", { name: "Public" })).toBeDisabled();
  },
};

/** The popover fields are still controls the field shell reached — the id landed on the trigger. */
export const TheColourFieldIsARealControl: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /Colour/ });
    expect(trigger).toHaveAccessibleDescription("Shown on the tag itself.");

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: "#f59e0b" }));
    await waitFor(() => expect(trigger).toHaveTextContent("#f59e0b"));
  },
};

/** The reveal reaches the input the label points at, not the wrapper that positions the eye. */
export const ThePasswordFieldReveals: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByLabelText("Share token");
    await userEvent.type(box, "s3cret");
    expect(box).toHaveAttribute("type", "password");

    await userEvent.click(canvas.getByRole("button", { name: "Show password" }));
    expect(box).toHaveAttribute("type", "text");
  },
};

/** What the form ends up holding — a hex string, a choice, and a secret. */
export const SubmittingCarriesEveryValue: Story = {
  args: { onSubmit: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "Urgent");
    await userEvent.click(canvas.getByText("Team"));
    await userEvent.type(canvas.getByLabelText("Share token"), "s3cret");

    await userEvent.click(canvas.getByRole("button", { name: /Colour/ }));
    await userEvent.click(await screen.findByRole("button", { name: "#10b981" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({
        name: "Urgent",
        color: "#10b981",
        visibility: "team",
        token: "s3cret",
      }),
    );
  },
};

/** Four skeletons, and the labels stay — they are literals, not data being waited on. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    expect(canvas.getAllByText(/Name|Colour|Visibility|Share token/)).toHaveLength(4);
    expect(canvas.queryByRole("radiogroup")).toBeNull();
  },
};
