import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { DialogLayout } from "@/components/dialog-layout";
import { Button } from "@/components/ui/button";
import { ToastProvider, useToast } from "@/components/ui/toast";

/**
 * A toast raised while a dialog is open (#477).
 *
 * A modal dialog marks the rest of the page `aria-hidden`, turns off the pointer outside itself and
 * draws a scrim over it, so a toast drawn in the page under it was never announced, could not be
 * pressed, and sat under the scrim. The stack is a live region from its first render, which radix
 * leaves out of what it hides, and it is drawn above dialogs; a press on it is not a press beside
 * the dialog, so the dialog stays open and its discard question is not asked.
 */
const meta = {
  title: "Behaviours/Toasts over dialogs",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function ArchiveInADialog() {
  const toast = useToast();
  const [undone, setUndone] = useState(0);
  return (
    <DialogLayout
      open
      title="Edit card"
      // An outside press on a dialog with unsaved work asks whether to discard it, which is how a
      // press on the toast read as one would show.
      hasUnsavedChanges
      contentSlot={
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            content="Archive the checklist"
            onClick={() =>
              toast("Archived the checklist.", "positive", {
                actionSlot: (
                  <Button
                    variant="outline"
                    size="sm"
                    content="Undo"
                    onClick={() => setUndone((n) => n + 1)}
                  />
                ),
              })
            }
          />
          <p data-testid="undone">{undone}</p>
        </div>
      }
      footerActionsSlot={<Button variant="positive" content="Save" />}
    />
  );
}

/** Whether the element under the middle of `element` is it or inside it: nothing is drawn over it. */
function drawnOnTop(element: HTMLElement) {
  const box = element.getBoundingClientRect();
  const hit = element.ownerDocument.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  return hit !== null && element.contains(hit);
}

export const AnnouncedAndPressable: Story = {
  render: () => (
    <ToastProvider>
      <ArchiveInADialog />
    </ToastProvider>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Edit card" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Archive the checklist" }));

    // `getByRole` skips anything inside an `aria-hidden` subtree, so finding it is the proof that
    // assistive technology can too.
    const toast = await screen.findByRole("status");
    await expect(toast).toHaveTextContent("Archived the checklist.");
    await expect(toast.closest("[aria-hidden=true]")).toBeNull();
    await expect(toast.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");

    const undo = within(toast).getByRole("button", { name: "Undo" });
    const dismiss = within(toast).getByRole("button", { name: "Dismiss" });
    await expect({ undo: drawnOnTop(undo), dismiss: drawnOnTop(dismiss) }).toEqual({
      undo: true,
      dismiss: true,
    });

    // `userEvent` refuses an element that inherits `pointer-events: none`, which is what radix sets
    // on the body while a modal is open.
    await userEvent.click(undo);
    await expect(within(dialog).getByTestId("undone")).toHaveTextContent("1");
    await userEvent.click(dismiss);
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());

    // The dialog is still open, and did not ask whether to throw away what was typed in it.
    await expect(screen.getByRole("dialog", { name: "Edit card" })).toBeInTheDocument();
    await expect(screen.queryByRole("alertdialog")).toBeNull();
  },
};

/**
 * F8 reaches the newest toast from inside a dialog (#500). The dialog's focus trap keeps Tab from
 * ever leaving the card, and sent a focus that did straight back, so an Undo raised while it was
 * open could be clicked but not reached by keyboard. Focus now stays on the toast it was moved to,
 * Enter presses it, and when the toast goes focus is back where it was in the dialog.
 */
export const ReachedByKeyboard: Story = {
  render: () => (
    <ToastProvider>
      <ArchiveInADialog />
    </ToastProvider>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Edit card" });
    const archive = within(dialog).getByRole("button", { name: "Archive the checklist" });
    archive.focus();
    await userEvent.keyboard("{Enter}");
    const toast = await screen.findByRole("status");
    // Named for the key, so a screen reader can find the stack and learn how to reach it.
    await expect(screen.getByRole("region", { name: "Notifications (F8)" })).toContainElement(
      toast,
    );

    await userEvent.keyboard("{F8}");
    const undo = within(toast).getByRole("button", { name: "Undo" });
    await expect(undo).toHaveFocus();
    // Not handed back to the card on the next turn of the trap.
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(undo).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(within(dialog).getByTestId("undone")).toHaveTextContent("1");

    // Tab goes on to the ✕, still in the toast, and pressing it gives focus back to the dialog.
    await userEvent.tab();
    await expect(within(toast).getByRole("button", { name: "Dismiss" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    await expect(archive).toHaveFocus();
    await expect(screen.queryByRole("alertdialog")).toBeNull();
  },
};
