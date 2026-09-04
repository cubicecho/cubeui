import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ConfirmButton } from "@/registry/new-york/control/confirm-button";

const meta = {
  title: "Control/ConfirmButton",
  component: ConfirmButton,
  args: {
    label: "Delete lane",
    variant: "ghost",
    size: "icon",
    children: <Trash2 />,
    title: "Delete this lane?",
    description: "The lane takes its cards with it.",
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Nothing happens until they say so — and `onConfirm` fires once, from the confirm button. */
export const AsksBeforeItActs: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete lane" }));

    const dialog = await within(document.body).findByRole("alertdialog");
    // `waitFor`, because `findByRole("alertdialog")` waits for the node and not for the enter
    // animation: the content is in the tree a frame before `zoom-in-95` has finished with it.
    const said = await within(dialog).findByText("The lane takes its cards with it.");
    await waitFor(() => expect(said).toBeVisible());
    expect(args.onConfirm).not.toHaveBeenCalled();

    await userEvent.click(await within(dialog).findByRole("button", { name: "Delete" }));
    expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

/** Cancel is the way out, and it is the way out that does nothing. */
export const CancelDoesNothing: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete lane" }));
    const dialog = await within(document.body).findByRole("alertdialog");
    await userEvent.click(await within(dialog).findByRole("button", { name: "Cancel" }));

    expect(args.onConfirm).not.toHaveBeenCalled();
    // And on the way out too — a closing dialog stays mounted for its exit animation.
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).toBeNull());
  },
};

/**
 * The trigger is an `ActionButton`, so it keeps its accessible name and its tooltip rather than
 * being swallowed by `AlertDialogTrigger asChild` — which is why this holds `open` itself.
 */
export const TheTriggerIsStillAnActionButton: Story = {
  args: { hint: "Deleting a lane deletes its cards" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Delete lane" });
    await userEvent.hover(button);
    expect(await within(document.body).findByRole("tooltip")).toHaveTextContent(
      "Deleting a lane deletes its cards",
    );
  },
};

/** `disabled` reaches the trigger, and a control that will not act does not open the dialog. */
export const DisabledDoesNotAsk: Story = {
  args: { disabled: true, hint: "You cannot delete the last lane" },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete lane" }));
    expect(within(document.body).queryByRole("alertdialog")).toBeNull();
    expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/** `confirmLabel` is how the same dialog says Discard, Revoke or Remove. */
export const NamingTheVerb: Story = {
  args: {
    label: "Revoke key",
    title: "Revoke this API key?",
    description: "Anything using it stops working immediately, including the nightly sync.",
    confirmLabel: "Revoke",
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Revoke key" }));
    const dialog = await within(document.body).findByRole("alertdialog");
    const revoke = await within(dialog).findByRole("button", { name: "Revoke" });
    await waitFor(() => expect(revoke).toBeVisible());
  },
};
