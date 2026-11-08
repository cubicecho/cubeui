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
