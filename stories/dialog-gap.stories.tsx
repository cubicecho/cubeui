import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, screen, waitFor } from "storybook/test";
import {
  Dialog as CompiledDialog,
  DialogContent as CompiledDialogContent,
  DialogTitle as CompiledDialogTitle,
} from "../compiled/dialog";
import { DialogLayout as CompiledDialogLayout } from "../compiled/dialog-layout";
import {
  Dialog as DeviceDialog,
  DialogContent as DeviceDialogContent,
  DialogTitle as DeviceDialogTitle,
} from "../registry/ui/dialog.tsx";

/**
 * A dialog keeps 16px clear of each side of the screen, on both halves and at every size (#472).
 * The web card was `max-w-[calc(100%-2rem)]`, the device's backdrop `p-6`, 24px, and a `full`
 * `DialogLayout` on the web left 32px past `sm`. The device half is imported by its full name, as
 * Vite would otherwise resolve `dialog.web.tsx`; react-native-web draws its `Modal`.
 */
const meta = { title: "RN Parity/Dialog side gap" } satisfies Meta;
export default meta;
type Story = StoryObj;

/** The one gap, in px. */
const GAP = 16;

async function expectGap(name: string) {
  // The device card is not named by its title, so each story has the one dialog and finds it so.
  const card = await screen.findByRole("dialog");
  const page = document.documentElement.clientWidth;
  // After the web card's zoom and slide in, which move it while they run.
  await waitFor(() => {
    const box = card.getBoundingClientRect();
    return expect({
      name,
      left: Math.round(box.left),
      right: Math.round(page - box.right),
    }).toEqual({ name, left: GAP, right: GAP });
  });
}

const phone = { viewport: { value: "mobile2", isRotated: false } };

export const OnDevice: Story = {
  globals: phone,
  // react-native-web's `Modal` puts `aria-modal` on a box with no role, which axe refuses: the
  // device dialog's under a browser, and not what this story measures.
  parameters: { a11y: { config: { rules: [{ id: "aria-allowed-attr", enabled: false }] } } },
  render: () => (
    <DeviceDialog open onOpenChange={() => {}}>
      <DeviceDialogContent>
        <DeviceDialogTitle>Device dialog</DeviceDialogTitle>
        <Text className="text-foreground">A phone-width card.</Text>
      </DeviceDialogContent>
    </DeviceDialog>
  ),
  play: () => expectGap("Device dialog"),
};

export const OnTheWeb: Story = {
  globals: phone,
  render: () => (
    <CompiledDialog open onOpenChange={() => {}}>
      <CompiledDialogContent aria-describedby={undefined}>
        <CompiledDialogTitle>Web dialog</CompiledDialogTitle>
        <p>A phone-width card.</p>
      </CompiledDialogContent>
    </CompiledDialog>
  ),
  play: () => expectGap("Web dialog"),
};

/** Past `sm`, a `full` dialog is the screen less the same gap, where it was 32px a side. */
export const FullPastSm: Story = {
  render: () => (
    <CompiledDialogLayout
      open
      onOpenChange={() => {}}
      size="full"
      title="Full dialog"
      contentSlot={<p>The whole screen, less the gap.</p>}
    />
  ),
  play: async () => {
    await expect(window.matchMedia("(min-width: 40rem)").matches).toBe(true);
    await expectGap("Full dialog");
  },
};
