import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactElement, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../registry/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../registry/ui/dialog.tsx";
import { Archive, Pencil, Trash2 } from "../registry/ui/icons";
import { OverlayLayer } from "../registry/ui/overlay";
import { ToastProvider, useToast } from "../registry/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "../registry/ui/tooltip.tsx";

/**
 * What floats on device is drawn in an overlay layer, not where it was opened (#509, #500): a
 * tooltip inside a `ScrollView` was clipped by it and had only its trigger's width to wrap in, and
 * a toast raised while a `Modal` was open was drawn under it. These are the device halves under
 * react-native-web, imported by their full names, as Vite would otherwise resolve the `.web.tsx`
 * radix halves an Expo web app draws.
 *
 * A phone is still the check that counts: `measureInWindow` under a status bar, the layer inside
 * an Android dialog window, and VoiceOver reading the toast.
 */
const meta = { title: "RN Parity/Native overlays" } satisfies Meta;
export default meta;
type Story = StoryObj;

// react-native-web's `Modal` puts `aria-modal` on a box with no role, which axe refuses: the
// device dialog under a browser, as `dialog-backdrop.stories.tsx` finds too.
const DEVICE_A11Y = {
  a11y: { config: { rules: [{ id: "aria-allowed-attr", enabled: false }] } },
};

/** How long a press is held to count as a long one: react-native's 500ms, and some to spare. */
const LONG_PRESS_MS = 700;
/** How far the bubble keeps from the screen's edges, and the most it is wide. */
const EDGE_GAP = 8;
const MAX_BUBBLE = 320;
/** Rounding a centre measured in fractional pixels. */
const OFF_CENTRE = 1;

const PLACES = [
  { name: "Edit the lane's name and colour", icon: <Pencil /> },
  { name: "Archive the lane and every card in it", icon: <Archive /> },
  { name: "Delete the lane, once it is empty", icon: <Trash2 /> },
] as const;

/** An icon button under the device tooltip, which is the tree `Button` builds on device. */
function Place({ name, icon }: { name: string; icon: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={name} variant="outline" size="icon" tooltip={false} iconSlot={icon} />
      </TooltipTrigger>
      <TooltipContent side="bottom">{name}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A top bar whose places scroll sideways, as `AppBar`'s do on a phone. `OverlayHost` draws its
 * layer on device only, so the screen draws the layer a dialog draws, which is the same box.
 */
function TopBar() {
  return (
    <View testID="screen" className="relative h-64 w-[360px] bg-background">
      <ScrollView
        testID="places"
        horizontal
        className="h-14 grow-0 border-b border-foreground/10"
        contentContainerClassName="min-w-full items-center justify-between gap-2 px-2"
      >
        {PLACES.map((place) => (
          <Place key={place.name} {...place} />
        ))}
      </ScrollView>
      <Text className="p-4 text-foreground">The page under the bar.</Text>
      <OverlayLayer />
    </View>
  );
}

async function longPress(target: Element) {
  await userEvent.pointer({ keys: "[MouseLeft>]", target });
  await new Promise((resolve) => setTimeout(resolve, LONG_PRESS_MS));
  await userEvent.pointer({ keys: "[/MouseLeft]", target });
}

/**
 * Long-presses the place named `name` and checks its bubble: outside the scroller, below its
 * trigger and past the bottom of the bar, its own width up to 320px rather than its trigger's, and
 * 8px or more inside the screen. Returns the bubble's box and the trigger's.
 */
async function openPlace(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);
  const places = canvas.getByTestId("places");
  const screenBox = canvas.getByTestId("screen").getBoundingClientRect();
  const trigger = canvas.getByRole("button", { name });
  await longPress(trigger);
  const bubble = await canvas.findByRole("tooltip");
  await expect(bubble).toHaveTextContent(name);
  // Placed once it has been measured; until then it is drawn see-through.
  await waitFor(() => expect(getComputedStyle(bubble).opacity).toBe("1"));

  const tip = bubble.getBoundingClientRect();
  const button = trigger.getBoundingClientRect();
  const bar = places.getBoundingClientRect();
  await expect({
    insideScroller: places.contains(bubble),
    belowTheTrigger: tip.top >= button.bottom,
    pastTheBar: tip.bottom > bar.bottom,
    widerThanTrigger: tip.width > button.width,
    narrow: tip.width <= MAX_BUBBLE,
    onOneOrTwoLines: tip.height < tip.width,
    onScreen:
      tip.left >= screenBox.left + EDGE_GAP - OFF_CENTRE &&
      tip.right <= screenBox.right - EDGE_GAP + OFF_CENTRE,
  }).toEqual({
    insideScroller: false,
    belowTheTrigger: true,
    pastTheBar: true,
    widerThanTrigger: true,
    narrow: true,
    onOneOrTwoLines: true,
    onScreen: true,
  });
  return { tip, button, screenBox };
}

/**
 * A tooltip in a sideways `ScrollView` is drawn outside it, whole, its own width and centred on
 * its trigger. It was clipped to the bar's height and stood a word to a line, in the trigger's
 * 40px.
 */
export const TooltipLeavesItsScroller: Story = {
  parameters: { ...DEVICE_A11Y, layout: "fullscreen" },
  render: () => <TopBar />,
  play: async ({ canvasElement }) => {
    const { tip, button } = await openPlace(canvasElement, PLACES[1].name);
    const offCentre = Math.abs(tip.left + tip.width / 2 - (button.left + button.width / 2));
    await expect(offCentre).toBeLessThanOrEqual(OFF_CENTRE);
  },
};

/** The first place is 8px from the screen's start: its bubble slides along to stay 8px inside. */
export const TooltipStaysOnScreen: Story = {
  parameters: { ...DEVICE_A11Y, layout: "fullscreen" },
  render: () => <TopBar />,
  play: async ({ canvasElement }) => {
    const { tip, screenBox } = await openPlace(canvasElement, PLACES[0].name);
    await expect(Math.round(tip.left - screenBox.left)).toBe(EDGE_GAP);
  },
};

/** A dialog whose Save fails, saying so in a toast, which is what the dialog's caller raises. */
function RenameDialog() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" content="Rename" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename the lane</DialogTitle>
        <Button
          variant="positive"
          content="Save"
          onPress={() => toast("Could not rename the lane: the server is not answering.")}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * A toast raised while a device dialog is open is drawn over it, in the dialog's own layer: it is
 * the top thing at its centre, above the card and the scrim. A `Modal` is a window over the app's
 * tree, and the stack was drawn in the tree, so the toast stayed under the dialog until it closed.
 */
export const ToastOverADialog: Story = {
  parameters: DEVICE_A11Y,
  render: () => (
    <ToastProvider>
      <RenameDialog />
    </ToastProvider>
  ),
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    const card = await screen.findByRole("dialog", { name: "Rename the lane" });
    await userEvent.click(within(card).getByRole("button", { name: "Save" }));

    const toast = await screen.findByRole("alert");
    await expect(toast).toHaveTextContent("Could not rename the lane");
    // The dialog's `Modal` fades in, and the toast is drawn inside it, so it fades in with it.
    await waitFor(() => expect(toast).toBeVisible());
    const box = toast.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(hit !== null && toast.contains(hit)).toBe(true);

    // It can be dismissed there, and the dialog stays open.
    await userEvent.click(within(toast).getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    await expect(screen.getByRole("dialog", { name: "Rename the lane" })).toBe(card);
  },
};
