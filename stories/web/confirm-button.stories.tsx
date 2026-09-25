import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";

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

/**
 * The dialog's buttons are drawn as buttons — #156. `AlertDialogAction` and `AlertDialogCancel` are
 * shadcn's `Button asChild`, and while `asChild` handed its classes to the icon-colour provider
 * instead of the radix part, both rendered as bare text and Delete did not look destructive. Each
 * is compared with a plain `Button` of its variant, drawn beside the trigger.
 */
export const TheDialogButtonsLookLikeButtons: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <ConfirmButton {...args} />
      <Button variant="destructive">Plain destructive</Button>
      <Button variant="outline">Plain outline</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete lane" }));
    const dialog = await within(document.body).findByRole("alertdialog");
    const confirm = await within(dialog).findByRole("button", { name: "Delete" });
    const cancel = await within(dialog).findByRole("button", { name: "Cancel" });

    // The dialog hides the page behind it from the accessibility tree, the plain buttons included.
    const plain = (name: string) => canvas.getByRole("button", { name, hidden: true });
    const look = (el: Element) => {
      const style = getComputedStyle(el);
      return {
        padding: style.padding,
        borderWidth: style.borderTopWidth,
        borderColor: style.borderTopColor,
        radius: style.borderTopLeftRadius,
        background: style.backgroundColor,
        color: style.color,
      };
    };
    // Waited for, because the content zooms and fades in, and a colour read mid-animation is not
    // the one it settles on.
    await waitFor(() => expect(look(confirm)).toEqual(look(plain("Plain destructive"))));
    expect(getComputedStyle(confirm).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await waitFor(() => expect(look(cancel)).toEqual(look(plain("Plain outline"))));
    expect(getComputedStyle(cancel).borderTopWidth).not.toBe("0px");
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

/**
 * The trigger is an `ActionButton`, so it inherits its `type="button"` — a "Delete" that asks
 * first no longer submits the form behind it while the question is still on screen.
 */
export const ItDoesNotSubmitTheFormAroundIt: Story = {
  args: { onSubmit: fn() },
  render: ({ onSubmit, ...args }) => (
    <form
      className="grid w-80 gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        (onSubmit as () => void)();
      }}
    >
      <label htmlFor="lane">Lane name</label>
      <input id="lane" defaultValue="Review" className="border px-2 py-1" />
      <ConfirmButton {...args} />
    </form>
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete lane" }));

    await within(document.body).findByRole("alertdialog");
    expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

const typeTheName = {
  label: "Delete folder",
  title: "Delete this folder?",
  description: "Its notes go with it.",
  requireText: "work",
  requireTextLabel: "Type work to delete it",
} as const;

/**
 * `requireText`: the confirm is disabled until the box holds the name exactly, and a wrong value
 * leaves it that way — case, a trailing space and a prefix all count as wrong.
 */
export const TypeTheName: Story = {
  args: typeTheName,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete folder" }));
    const dialog = await within(document.body).findByRole("alertdialog");
    const box = await within(dialog).findByRole("textbox", { name: "Type work to delete it" });
    const confirm = within(dialog).getByRole("button", { name: "Delete" });
    await expect(confirm).toBeDisabled();

    for (const wrong of ["Work", "work ", "wor"]) {
      await userEvent.clear(box);
      await userEvent.type(box, wrong);
      await expect(confirm).toBeDisabled();
    }
    expect(args.onConfirm).not.toHaveBeenCalled();

    await userEvent.clear(box);
    await userEvent.type(box, "work");
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(args.onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).toBeNull());
  },
};

/** Enter confirms only on a match, and closes the dialog as the button does. */
export const EnterConfirmsOnlyOnAMatch: Story = {
  args: typeTheName,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete folder" }));
    const dialog = await within(document.body).findByRole("alertdialog");
    const box = await within(dialog).findByRole("textbox", { name: "Type work to delete it" });

    await userEvent.type(box, "wrok{Enter}");
    expect(args.onConfirm).not.toHaveBeenCalled();
    expect(within(document.body).getByRole("alertdialog")).toBeInTheDocument();

    await userEvent.clear(box);
    await userEvent.type(box, "work{Enter}");
    expect(args.onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).toBeNull());
  },
};

/** The box is empty each time the dialog opens: the name is typed once per delete. */
export const EmptyOnEveryOpening: Story = {
  args: typeTheName,
  play: async ({ canvas }) => {
    const open = async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Delete folder" }));
      const dialog = await within(document.body).findByRole("alertdialog");
      return {
        dialog,
        box: await within(dialog).findByRole("textbox", { name: "Type work to delete it" }),
      };
    };

    const first = await open();
    await userEvent.type(first.box, "work");
    await userEvent.click(within(first.dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).toBeNull());

    const second = await open();
    await expect(second.box).toHaveValue("");
    await expect(within(second.dialog).getByRole("button", { name: "Delete" })).toBeDisabled();
  },
};
