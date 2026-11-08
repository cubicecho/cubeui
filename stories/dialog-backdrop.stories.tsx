import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "react-native";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import { Button } from "../registry/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../registry/ui/dialog.tsx";
import { holdOpen } from "../registry/ui/dialog-base";

/**
 * The device dialog's backdrop is a button named Close for a screen reader, because a press on it
 * closes the dialog. One that refuses the press — `ConfirmDialog`, `AlertDialog`, a
 * `dismissible={false}` `DialogLayout`, each passing `holdOpen` — was announced as Close all the
 * same, and then did nothing (#486). Now it is no button at all. The device half is imported by
 * its full name, as Vite would otherwise resolve `dialog.web.tsx`; react-native-web draws its
 * `Modal`. The web half's overlay was never a button.
 */
const meta = { title: "RN Parity/Dialog backdrop" } satisfies Meta;
export default meta;
type Story = StoryObj;

// react-native-web's `Modal` puts `aria-modal` on a box with no role, which axe refuses: the
// device dialog's under a browser, as `dialog-gap.stories.tsx` finds too, and not what these
// stories check.
const DEVICE_A11Y = {
  a11y: { config: { rules: [{ id: "aria-allowed-attr", enabled: false }] } },
};

function Question({ refuses }: { refuses: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" content="Ask" />
      </DialogTrigger>
      <DialogContent showCloseButton={false} {...(refuses ? { onInteractOutside: holdOpen } : {})}>
        <DialogTitle>Revoke this key?</DialogTitle>
        <Text className="text-foreground">The nightly sync stops working.</Text>
      </DialogContent>
    </Dialog>
  );
}

/** A backdrop that refuses the press is not announced, and a press on the overlay keeps it open. */
export const RefusedIsNotAButton: Story = {
  parameters: DEVICE_A11Y,
  render: () => <Question refuses />,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    // Named by its title, as radix's card is (#510).
    const card = await screen.findByRole("dialog", { name: "Revoke this key?" });
    await expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    const overlay = card.parentElement;
    if (!overlay) {
      throw new Error("expected the overlay around the card");
    }
    await userEvent.click(overlay);
    await expect(screen.getByRole("dialog")).toBe(card);
  },
};

/** One that closes is still the button it was, and its press still closes. */
export const ClosingIsAButton: Story = {
  parameters: DEVICE_A11Y,
  render: () => <Question refuses={false} />,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};
