import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { Text } from "react-native";
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
import { Button as NativeButton } from "../registry/ui/button";
import {
  Dialog as WebDialog,
  DialogClose as WebDialogClose,
  DialogContent as WebDialogContent,
  DialogTitle as WebDialogTitle,
  DialogTrigger as WebDialogTrigger,
} from "../registry/ui/dialog";
import {
  Menu as WebMenu,
  MenuContent as WebMenuContent,
  MenuItem as WebMenuItem,
  MenuTrigger as WebMenuTrigger,
} from "../registry/ui/menu";
import {
  Popover as WebPopover,
  PopoverClose as WebPopoverClose,
  PopoverContent as WebPopoverContent,
  PopoverTrigger as WebPopoverTrigger,
} from "../registry/ui/popover";

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
 */
const meta = {
  title: "Button/asChild trigger",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

type ButtonLike = ComponentType<{ children?: ReactNode; variant?: "outline" | "ghost" }>;

function Popovers({
  Button,
  Popover,
  Trigger,
  Content,
  Close,
  name,
}: {
  Button: ButtonLike;
  Popover: ComponentType<{ children?: ReactNode }>;
  Trigger: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  Content: ComponentType<{ children?: ReactNode }>;
  Close: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  name: string;
}) {
  return (
    <Popover>
      <Trigger asChild>
        <Button variant="outline">{`${name} filters`}</Button>
      </Trigger>
      <Content>
        <Text className="text-popover-foreground">{`${name} pane`}</Text>
        <Close asChild>
          <Button variant="ghost">{`${name} done`}</Button>
        </Close>
      </Content>
    </Popover>
  );
}

function Dialogs({
  Button,
  Dialog,
  Trigger,
  Content,
  Title,
  Close,
  name,
}: {
  Button: ButtonLike;
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
        <Button variant="outline">{`${name} rename`}</Button>
      </Trigger>
      <Content aria-describedby={undefined}>
        <Title>{`${name} rename dialog`}</Title>
        <Close asChild>
          <Button variant="outline">{`${name} cancel`}</Button>
        </Close>
      </Content>
    </Dialog>
  );
}

function Menus({
  Button,
  Menu,
  Trigger,
  Content,
  Item,
  name,
}: {
  Button: ButtonLike;
  Menu: ComponentType<{ children?: ReactNode }>;
  Trigger: ComponentType<{ asChild?: boolean; children?: ReactNode }>;
  Content: ComponentType<{ children?: ReactNode; "aria-label"?: string }>;
  Item: ComponentType<{ label: string; onSelect?: () => void }>;
  name: string;
}) {
  return (
    <Menu>
      <Trigger asChild>
        <Button variant="outline">{`${name} actions`}</Button>
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

function All({ parts, name }: { parts: typeof EXPO_WEB; name: string }) {
  return (
    <div className="flex gap-4 bg-background p-6">
      <Popovers
        Button={parts.Button}
        Popover={parts.Popover}
        Trigger={parts.PopoverTrigger}
        Content={parts.PopoverContent}
        Close={parts.PopoverClose}
        name={name}
      />
      <Dialogs
        Button={parts.Button}
        Dialog={parts.Dialog}
        Trigger={parts.DialogTrigger}
        Content={parts.DialogContent}
        Title={parts.DialogTitle}
        Close={parts.DialogClose}
        name={name}
      />
      <Menus
        Button={parts.Button}
        Menu={parts.Menu}
        Trigger={parts.MenuTrigger}
        Content={parts.MenuContent}
        Item={parts.MenuItem}
        name={name}
      />
    </div>
  );
}

async function opensAndCloses(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);

  // Popover: the trigger opens it, `PopoverClose asChild` shuts it.
  const filters = canvas.getByRole("button", { name: `${name} filters` });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(filters);
  await waitFor(() => expect(filters).toHaveAttribute("aria-expanded", "true"));
  const pane = await body().findByText(`${name} pane`);
  // Waited for, because the pane fades in from `opacity: 0`.
  await waitFor(() => expect(pane).toBeVisible());
  await userEvent.click(body().getByRole("button", { name: `${name} done` }));
  await waitFor(() => expect(body().queryByText(`${name} pane`)).toBeNull());
  await expect(filters).toHaveAttribute("aria-expanded", "false");

  // The keyboard path: Enter on the focused trigger opens it too.
  filters.focus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(filters).toHaveAttribute("aria-expanded", "true"));
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByText(`${name} pane`)).toBeNull());

  // Dialog: the trigger opens it, `DialogClose asChild` shuts it.
  await userEvent.click(canvas.getByRole("button", { name: `${name} rename` }));
  const dialog = await body().findByRole("dialog", { name: `${name} rename dialog` });
  await userEvent.click(within(dialog).getByRole("button", { name: `${name} cancel` }));
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());

  // Menu: opened on pointerdown all along. Opened once, not opened and toggled shut again.
  const actions = canvas.getByRole("button", { name: `${name} actions` });
  await userEvent.click(actions);
  const menu = await body().findByRole("menu");
  await expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);
  await expect(actions).toHaveAttribute("aria-expanded", "true");
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
