import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, type ReactNode, useState } from "react";
import { Pressable, Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  Dialog as CompiledDialog,
  DialogClose as CompiledDialogClose,
  DialogContent as CompiledDialogContent,
  DialogTitle as CompiledDialogTitle,
  DialogTrigger as CompiledDialogTrigger,
} from "../compiled/dialog";
import {
  Menu as CompiledMenu,
  MenuContent as CompiledMenuContent,
  MenuItem as CompiledMenuItem,
  MenuTrigger as CompiledMenuTrigger,
} from "../compiled/menu";
import {
  Popover as CompiledPopover,
  PopoverClose as CompiledPopoverClose,
  PopoverContent as CompiledPopoverContent,
  PopoverTrigger as CompiledPopoverTrigger,
} from "../compiled/popover";
import {
  AlertDialog as WebAlertDialog,
  AlertDialogCancel as WebAlertDialogCancel,
  AlertDialogContent as WebAlertDialogContent,
  AlertDialogTitle as WebAlertDialogTitle,
  AlertDialogTrigger as WebAlertDialogTrigger,
} from "../registry/ui/alert-dialog";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Dialog as WebDialog,
  DialogClose as WebDialogClose,
  DialogContent as WebDialogContent,
  DialogTitle as WebDialogTitle,
  DialogTrigger as WebDialogTrigger,
} from "../registry/ui/dialog";
import {
  Dialog as DeviceDialog,
  DialogClose as DeviceDialogClose,
  DialogContent as DeviceDialogContent,
  DialogTitle as DeviceDialogTitle,
  DialogTrigger as DeviceDialogTrigger,
} from "../registry/ui/dialog.tsx";
import {
  Menu as WebMenu,
  MenuContent as WebMenuContent,
  MenuItem as WebMenuItem,
  MenuTrigger as WebMenuTrigger,
} from "../registry/ui/menu";
import {
  Menu as DeviceMenu,
  MenuContent as DeviceMenuContent,
  MenuItem as DeviceMenuItem,
  MenuTrigger as DeviceMenuTrigger,
} from "../registry/ui/menu.tsx";
import {
  Popover as WebPopover,
  PopoverClose as WebPopoverClose,
  PopoverContent as WebPopoverContent,
  PopoverTrigger as WebPopoverTrigger,
} from "../registry/ui/popover";
import {
  Popover as DevicePopover,
  PopoverClose as DevicePopoverClose,
  PopoverContent as DevicePopoverContent,
  PopoverTrigger as DevicePopoverTrigger,
} from "../registry/ui/popover.tsx";

/**
 * A cubeui `Button` handed to a radix trigger with `asChild`, uncontrolled — issue #123.
 *
 * Two pairings, because two kinds of app reach this. An **Expo web** app installs the native
 * registry: its `popover`, `dialog` and `menu` resolve to the `.web.tsx` halves (radix), and its
 * `Button` is the React Native one, a `Pressable` under react-native-web. That is what the
 * `registry/ui/…` imports below get here too, since Vite resolves `.web.tsx` first and `button`
 * has no web half. A **DOM** app installs the compiled items, whose `Button` is a real `<button>`.
 *
 * Radix's popover and dialog triggers (and their closes) act on `onClick`, which `Slot` merges
 * onto the button. react-native-web's `Pressable` hands the DOM its own `onClick` and dropped the
 * merged one, so on Expo web those never opened. The menu opens on `pointerdown` and never had the
 * problem; it is here so the fix is seen not to double it.
 *
 * Every child has an `onPress` of its own, which has to run as well as the trigger's: radix's
 * `Slot` runs both, and the device halves replaced the child's with their own (#461). The device
 * halves are imported by their full names, `popover.tsx` and the rest, because Vite would
 * otherwise resolve the `.web.tsx` beside each.
 */
const meta = {
  title: "RN Parity/Button/asChild trigger",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

type ButtonLike = ComponentType<{
  content?: ReactNode;
  variant?: "outline" | "ghost";
  onPress?: () => void;
  onClick?: () => void;
}>;

/** A pairing's `Button`'s own press: `onPress` in React Native, `onClick` once compiled. */
type Press = (handler: () => void) => { onPress: () => void } | { onClick: () => void };
const ON_PRESS: Press = (handler) => ({ onPress: handler });
const ON_CLICK: Press = (handler) => ({ onClick: handler });

/** A child's press of its own, which records `what` so a play can see it ran. */
type Note = (what: string) => ReturnType<Press>;

function Popovers({
  Button,
  note,
  Popover,
  Trigger,
  Content,
  Close,
  name,
}: {
  Button: ButtonLike;
  note: Note;
  Popover: ComponentType<{ children?: ReactNode }>;
  Trigger: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  Content: ComponentType<{ children?: ReactNode }>;
  Close: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  name: string;
}) {
  return (
    <Popover>
      <Trigger asChild>
        <Button variant="outline" content={`${name} filters`} {...note("filters")} />
      </Trigger>
      <Content>
        <Text className="text-foreground">{`${name} pane`}</Text>
        <Close asChild>
          <Button variant="outline" content={`${name} done`} {...note("done")} />
        </Close>
      </Content>
    </Popover>
  );
}

function Dialogs({
  Button,
  note,
  Dialog,
  Trigger,
  Content,
  Title,
  Close,
  name,
}: {
  Button: ButtonLike;
  note: Note;
  Dialog: ComponentType<{ children?: ReactNode }>;
  Trigger: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  Content: ComponentType<{ children?: ReactNode; "aria-describedby"?: undefined }>;
  Title: ComponentType<{ children?: ReactNode }>;
  Close: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  name: string;
}) {
  return (
    <Dialog>
      <Trigger asChild>
        <Button variant="outline" content={`${name} rename`} {...note("rename")} />
      </Trigger>
      <Content aria-describedby={undefined}>
        <Title>{`${name} rename dialog`}</Title>
        <Close asChild>
          <Button variant="outline" content={`${name} cancel`} {...note("cancel")} />
        </Close>
      </Content>
    </Dialog>
  );
}

function Menus({
  Button,
  note,
  Menu,
  Trigger,
  Content,
  Item,
  name,
}: {
  Button: ButtonLike;
  note: Note;
  Menu: ComponentType<{ children?: ReactNode }>;
  Trigger: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  Content: ComponentType<{ children?: ReactNode; "aria-label"?: string }>;
  Item: ComponentType<{ label: string; onSelect?: () => void }>;
  name: string;
}) {
  return (
    <Menu>
      <Trigger asChild>
        <Button variant="outline" content={`${name} actions`} {...note("actions")} />
      </Trigger>
      <Content aria-label={`${name} actions`}>
        <Item label="Rename" />
        <Item label="Delete" />
      </Content>
    </Menu>
  );
}

// The two halves' parts are typed for their own platforms; the story only uses the props both
// share, so each is narrowed to that here rather than at every call.
const EXPO_WEB = {
  Button: NativeButton as unknown as ButtonLike,
  press: ON_PRESS,
  Popover: WebPopover as ComponentType<{ children?: ReactNode }>,
  PopoverTrigger: WebPopoverTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  PopoverContent: WebPopoverContent as ComponentType<{ children?: ReactNode }>,
  PopoverClose: WebPopoverClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Dialog: WebDialog as ComponentType<{ children?: ReactNode }>,
  DialogTrigger: WebDialogTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  DialogContent: WebDialogContent as unknown as ComponentType<{ children?: ReactNode }>,
  DialogTitle: WebDialogTitle as ComponentType<{ children?: ReactNode }>,
  DialogClose: WebDialogClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Menu: WebMenu as ComponentType<{ children?: ReactNode }>,
  MenuTrigger: WebMenuTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  MenuContent: WebMenuContent as ComponentType<{ children?: ReactNode; "aria-label"?: string }>,
  MenuItem: WebMenuItem as ComponentType<{ label: string }>,
};

const COMPILED = {
  Button: CompiledButton as unknown as ButtonLike,
  press: ON_CLICK,
  Popover: CompiledPopover as ComponentType<{ children?: ReactNode }>,
  PopoverTrigger: CompiledPopoverTrigger as ComponentType<{
    asChild?: boolean;
    children?: ReactNode;
  }>,
  PopoverContent: CompiledPopoverContent as ComponentType<{ children?: ReactNode }>,
  PopoverClose: CompiledPopoverClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Dialog: CompiledDialog as ComponentType<{ children?: ReactNode }>,
  DialogTrigger: CompiledDialogTrigger as ComponentType<{
    asChild?: boolean;
    children?: ReactNode;
  }>,
  DialogContent: CompiledDialogContent as unknown as ComponentType<{ children?: ReactNode }>,
  DialogTitle: CompiledDialogTitle as ComponentType<{ children?: ReactNode }>,
  DialogClose: CompiledDialogClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Menu: CompiledMenu as ComponentType<{ children?: ReactNode }>,
  MenuTrigger: CompiledMenuTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  MenuContent: CompiledMenuContent as ComponentType<{
    children?: ReactNode;
    "aria-label"?: string;
  }>,
  MenuItem: CompiledMenuItem as ComponentType<{ label: string }>,
};

/** A device: the React Native halves and `Button`, which clone the press onto an `asChild` child. */
const DEVICE = {
  Button: NativeButton as unknown as ButtonLike,
  press: ON_PRESS,
  Popover: DevicePopover as ComponentType<{ children?: ReactNode }>,
  PopoverTrigger: DevicePopoverTrigger as ComponentType<{
    asChild?: boolean;
    children?: ReactNode;
  }>,
  PopoverContent: DevicePopoverContent as ComponentType<{ children?: ReactNode }>,
  PopoverClose: DevicePopoverClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Dialog: DeviceDialog as ComponentType<{ children?: ReactNode }>,
  DialogTrigger: DeviceDialogTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  DialogContent: DeviceDialogContent as unknown as ComponentType<{ children?: ReactNode }>,
  DialogTitle: DeviceDialogTitle as ComponentType<{ children?: ReactNode }>,
  DialogClose: DeviceDialogClose as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  Menu: DeviceMenu as ComponentType<{ children?: ReactNode }>,
  MenuTrigger: DeviceMenuTrigger as ComponentType<{ asChild?: boolean; children?: ReactNode }>,
  MenuContent: DeviceMenuContent as ComponentType<{ children?: ReactNode; "aria-label"?: string }>,
  MenuItem: DeviceMenuItem as ComponentType<{ label: string }>,
};

function All({ parts, name }: { parts: typeof EXPO_WEB; name: string }) {
  const [ran, setRan] = useState<string[]>([]);
  const note: Note = (what) => parts.press(() => setRan((all) => [...all, what]));
  return (
    <div className="flex flex-wrap gap-4 bg-background p-6">
      <Popovers
        Button={parts.Button}
        note={note}
        Popover={parts.Popover}
        Trigger={parts.PopoverTrigger}
        Content={parts.PopoverContent}
        Close={parts.PopoverClose}
        name={name}
      />
      <Dialogs
        Button={parts.Button}
        note={note}
        Dialog={parts.Dialog}
        Trigger={parts.DialogTrigger}
        Content={parts.DialogContent}
        Title={parts.DialogTitle}
        Close={parts.DialogClose}
        name={name}
      />
      <Menus
        Button={parts.Button}
        note={note}
        Menu={parts.Menu}
        Trigger={parts.MenuTrigger}
        Content={parts.MenuContent}
        Item={parts.MenuItem}
        name={name}
      />
      <output aria-label={`${name} presses`}>{ran.join(", ") || "nothing"}</output>
    </div>
  );
}

/** Whether the child's own `onPress` for `what` has run, beside the trigger's. */
async function ranOwnPress(canvasElement: HTMLElement, name: string, what: string) {
  // `hidden`, because a modal dialog that is still open hides the page behind it.
  const presses = within(canvasElement).getByRole("status", {
    name: `${name} presses`,
    hidden: true,
  });
  await waitFor(() => expect(presses).toHaveTextContent(what));
}

async function opensAndCloses(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);

  // Popover: the trigger opens it, `PopoverClose asChild` shuts it.
  const filters = canvas.getByRole("button", { name: `${name} filters` });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(filters);
  await waitFor(() => expect(filters).toHaveAttribute("aria-expanded", "true"));
  await ranOwnPress(canvasElement, name, "filters");
  const pane = await body().findByText(`${name} pane`);
  // Waited for, because the pane fades in from `opacity: 0`.
  await waitFor(() => expect(pane).toBeVisible());
  await userEvent.click(body().getByRole("button", { name: `${name} done` }));
  await waitFor(() => expect(body().queryByText(`${name} pane`)).toBeNull());
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await ranOwnPress(canvasElement, name, "done");

  // The keyboard path: Enter on the focused trigger opens it too.
  filters.focus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(filters).toHaveAttribute("aria-expanded", "true"));
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByText(`${name} pane`)).toBeNull());

  // Dialog: the trigger opens it, `DialogClose asChild` shuts it.
  await userEvent.click(canvas.getByRole("button", { name: `${name} rename` }));
  const dialog = await body().findByRole("dialog", { name: `${name} rename dialog` });
  await ranOwnPress(canvasElement, name, "rename");
  await userEvent.click(within(dialog).getByRole("button", { name: `${name} cancel` }));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await ranOwnPress(canvasElement, name, "cancel");

  // Menu: opened on pointerdown all along. Opened once, not opened and toggled shut again.
  const actions = canvas.getByRole("button", { name: `${name} actions` });
  await userEvent.click(actions);
  const menu = await body().findByRole("menu");
  await expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);
  await expect(actions).toHaveAttribute("aria-expanded", "true");
  await ranOwnPress(canvasElement, name, "actions");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
}

/** An Expo web app: the radix halves over the React Native `Button`, under react-native-web. */
export const ExpoWeb: Story = {
  render: () => <All parts={EXPO_WEB} name="Expo" />,
  play: ({ canvasElement }) => opensAndCloses(canvasElement, "Expo"),
};

/** A DOM app: the compiled halves over the compiled `Button`, a real `<button>`. */
export const Compiled: Story = {
  render: () => <All parts={COMPILED} name="Compiled" />,
  play: ({ canvasElement }) => opensAndCloses(canvasElement, "Compiled"),
};

/**
 * A device: each trigger and close opens or shuts its sheet and runs the child's own `onPress`
 * too (#461). Before, the trigger's press replaced the child's, so a Done button that applied a
 * filter shut the pane and applied nothing.
 */
export const Device: Story = {
  render: () => <All parts={DEVICE} name="Device" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Device filters" }));
    await ranOwnPress(canvasElement, "Device", "filters");
    await userEvent.click(await body().findByRole("button", { name: "Device done" }));
    await waitFor(() => expect(body().queryByText("Device pane")).toBeNull());
    await ranOwnPress(canvasElement, "Device", "done");

    await userEvent.click(canvas.getByRole("button", { name: "Device rename" }));
    // The card is named by its title, as radix's is (#510).
    await body().findByRole("dialog", { name: "Device rename dialog" });
    await ranOwnPress(canvasElement, "Device", "rename");
    await userEvent.click(await body().findByRole("button", { name: "Device cancel" }));
    await waitFor(() => expect(body().queryByText("Device rename dialog")).toBeNull());
    await ranOwnPress(canvasElement, "Device", "cancel");

    await userEvent.click(canvas.getByRole("button", { name: "Device actions" }));
    await ranOwnPress(canvasElement, "Device", "actions");
    const menu = await body().findByRole("menu", { name: "Device actions" });
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Rename" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/**
 * A bare React Native `Pressable` as the child, not a `Button` — issue #339. Under react-native-web
 * a `Pressable` hands the DOM its own `onClick` and drops the one radix merged in, and unlike
 * `Button` it has nothing that calls that one from its press. So the trigger bridges it: the
 * merged click reaches the child through `onPress`, which the `Pressable` does call, from a click
 * and from Enter or Space.
 */
export const BarePressable: Story = {
  render: () => (
    <div className="flex gap-3">
      <WebPopover>
        <WebPopoverTrigger asChild>
          <Pressable role="button" aria-label="Pressable filters">
            <Text className="text-foreground">Filters</Text>
          </Pressable>
        </WebPopoverTrigger>
        <WebPopoverContent>
          <Text className="text-foreground">Pressable pane</Text>
          <WebPopoverClose asChild>
            <Pressable role="button" aria-label="Pressable done">
              <Text className="text-foreground">Done</Text>
            </Pressable>
          </WebPopoverClose>
        </WebPopoverContent>
      </WebPopover>
      <WebDialog>
        <WebDialogTrigger asChild>
          <Pressable role="button" aria-label="Pressable rename">
            <Text className="text-foreground">Rename</Text>
          </Pressable>
        </WebDialogTrigger>
        <WebDialogContent aria-describedby={undefined}>
          <WebDialogTitle>Pressable rename dialog</WebDialogTitle>
          <WebDialogClose asChild>
            <Pressable role="button" aria-label="Pressable cancel">
              <Text className="text-foreground">Cancel</Text>
            </Pressable>
          </WebDialogClose>
        </WebDialogContent>
      </WebDialog>
      <WebAlertDialog>
        <WebAlertDialogTrigger asChild>
          <Pressable role="button" aria-label="Pressable delete">
            <Text className="text-foreground">Delete</Text>
          </Pressable>
        </WebAlertDialogTrigger>
        <WebAlertDialogContent aria-describedby={undefined}>
          <WebAlertDialogTitle>Pressable delete dialog</WebAlertDialogTitle>
          <WebAlertDialogCancel>Keep it</WebAlertDialogCancel>
        </WebAlertDialogContent>
      </WebAlertDialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const filters = canvas.getByRole("button", { name: "Pressable filters" });
    await userEvent.click(filters);
    await waitFor(() => expect(body().getByText("Pressable pane")).toBeVisible());
    // Opened once: a press that reached radix twice would toggle it shut again.
    await expect(filters).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(body().getByRole("button", { name: "Pressable done" }));
    await waitFor(() => expect(body().queryByText("Pressable pane")).toBeNull());

    filters.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(filters).toHaveAttribute("aria-expanded", "true"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByText("Pressable pane")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Pressable rename" }));
    const dialog = await body().findByRole("dialog", { name: "Pressable rename dialog" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pressable cancel" }));
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Pressable delete" }));
    const alert = await body().findByRole("alertdialog", { name: "Pressable delete dialog" });
    await userEvent.click(within(alert).getByRole("button", { name: "Keep it" }));
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
  },
};
