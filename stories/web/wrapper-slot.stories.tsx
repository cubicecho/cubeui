import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { InputField, useAppForm } from "@/components/app-form";
import { CardLayout } from "@/components/card-layout";
import { DialogLayout } from "@/components/dialog-layout";
import { Button } from "@/components/ui/button";
import { FormElement } from "@/components/ui/form-element";

/**
 * `wrapperSlot` on the shells with a footer: one `<form>` around the header, the body and the
 * footer, so the submit in `footerActionsSlot` is inside the form it submits.
 *
 * The case it exists for is a form of two fields. With one text field a browser submits on Enter
 * with no submit button at all; with two it submits only through a submit button the form owns,
 * so a `<form>` around the body alone — the submit left in the footer, outside it — ignored Enter.
 */

type FormProps = {
  onSubmit?: ((value: unknown) => void) | undefined;
  onCancel?: (() => void) | undefined;
  /** Enough rows to overflow the dialog, for the story that checks the body still scrolls. */
  tall?: boolean | undefined;
};

function useUserForm(onSubmit: FormProps["onSubmit"]) {
  return useAppForm({
    defaultValues: { name: "Ada", email: "ada@example.com" },
    onSubmit: ({ value }) => onSubmit?.(value),
  });
}

function InDialog({ onSubmit, onCancel, tall = false }: FormProps) {
  const form = useUserForm(onSubmit);
  return (
    <DialogLayout
      open
      title="Edit user"
      wrapperSlot={(parts, { className }) => (
        <form.AppForm>
          <FormElement onSubmit={() => form.handleSubmit()} className={className}>
            {parts}
          </FormElement>
        </form.AppForm>
      )}
      contentSlot={
        <div className="grid gap-4">
          <InputField form={form} name="name" label="Name" />
          <InputField form={form} name="email" label="Email" />
          {tall
            ? Array.from({ length: 40 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: filler rows that never reorder
                <p key={i}>Row {i + 1}</p>
              ))
            : null}
        </div>
      }
      footerActionsSlot={(close) => (
        <>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              close();
            }}
            content="Cancel"
          />
          <form.SubmitButton content="Save" />
        </>
      )}
    />
  );
}

function InCard({ onSubmit }: FormProps) {
  const form = useUserForm(onSubmit);
  return (
    <div className="w-[420px]">
      <CardLayout
        title="Profile"
        wrapperSlot={(parts, { className }) => (
          <form.AppForm>
            <FormElement onSubmit={() => form.handleSubmit()} className={className}>
              {parts}
            </FormElement>
          </form.AppForm>
        )}
        contentSlot={
          <div className="grid gap-4">
            <InputField form={form} name="name" label="Name" />
            <InputField form={form} name="email" label="Email" />
          </div>
        }
        footerActionsSlot={<form.SubmitButton content="Save" />}
      />
    </div>
  );
}

const meta = {
  title: "Layout/wrapperSlot",
  component: InDialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof InDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Enter in either of two fields submits, once, and so does Save — which is a real submit button
 * now, owned by the form, rather than one that calls the form from outside it.
 */
export const EnterSubmitsADialogForm: Story = {
  args: { onSubmit: fn(), onCancel: fn() },
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", { name: "Edit user" });
    const save = within(dialog).getByRole<HTMLButtonElement>("button", { name: "Save" });
    await expect(save.form).not.toBeNull();

    await userEvent.type(within(dialog).getByLabelText(/^Email/), "{Enter}");
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await userEvent.type(within(dialog).getByLabelText(/^Name/), "{Enter}");
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(2));

    await userEvent.click(save);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(3));
    expect(args.onSubmit).toHaveBeenLastCalledWith({ name: "Ada", email: "ada@example.com" });
  },
};

/** Cancel is in the form too, and a `Button` is `type="button"`: it closes and submits nothing. */
export const CancelInsideTheFormDoesNotSubmit: Story = {
  args: { onSubmit: fn(), onCancel: fn() },
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog", { name: "Edit user" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1));
    expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/**
 * The wrapper's `className` keeps the shape: the dialog stays inside the viewport, the body
 * scrolls, and the footer stays on screen under it.
 */
export const TheBodyStillScrolls: Story = {
  args: { tall: true },
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Edit user" });
    const save = within(dialog).getByRole("button", { name: "Save" });
    const body = within(dialog)
      .getByText("Row 1")
      .closest<HTMLElement>('[data-slot="header-content-footer-content"]');
    if (body === null) {
      throw new Error("expected the chassis body");
    }
    await expect({
      fitsTheViewport: dialog.getBoundingClientRect().bottom <= window.innerHeight,
      bodyScrolls: body.scrollHeight > body.clientHeight,
      saveOnScreen: save.getBoundingClientRect().bottom <= window.innerHeight,
    }).toEqual({ fitsTheViewport: true, bodyScrolls: true, saveOnScreen: true });
  },
};

/** The same on a card: two fields, Enter submits, through the form that owns Save. */
export const EnterSubmitsACardForm: Story = {
  args: { onSubmit: fn() },
  render: (args) => <InCard onSubmit={args.onSubmit} />,
  play: async ({ canvas, args }) => {
    const save = canvas.getByRole<HTMLButtonElement>("button", { name: "Save" });
    await expect(save.form).not.toBeNull();
    await userEvent.type(canvas.getByLabelText(/^Email/), "{Enter}");
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await userEvent.click(save);
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(2));
  },
};
