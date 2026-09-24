import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, type ReactNode, useContext, useState } from "react";
import { Text } from "react-native";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { Pencil, Trash2 } from "../compiled/icons";
import {
  MenuContent as CompiledContent,
  MenuItem as CompiledItem,
  Menu as CompiledMenu,
  MenuSeparator as CompiledSeparator,
  MenuTrigger as CompiledTrigger,
} from "../compiled/menu";
import { IconClassContext } from "../registry/ui/icons-base";
import {
  MenuContent as NativeContent,
  MenuItem as NativeItem,
  Menu as NativeMenu,
  MenuSeparator as NativeSeparator,
  MenuTrigger as NativeTrigger,
} from "../registry/ui/menu.tsx";
import type {
  MenuContentProps,
  MenuItemProps,
  MenuProps,
  MenuSeparatorProps,
  MenuTriggerProps,
} from "../registry/ui/menu-base";

/**
 * telos's lane menu — rename, move left, move right, delete — on both halves, which is what issue
 * #114 was: a popover of hand-built `role="menuitem"` rows with no menu around them, no arrow keys
 * and no focus back on the trigger, and an `onSelect` on every row that had to close the popover
 * itself.
 *
 * The native half is imported by its full name because Vite would otherwise resolve
 * `menu.web.tsx`. Its icons are probes rather than ones from `@cubeui/icons`: here that module is
 * the web half, which ignores `IconClassContext` by design, so the probe reads the context and
 * reports it.
 */
const meta = { title: "Menu", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj;

type Parts = {
  Menu: ComponentType<MenuProps>;
  Trigger: ComponentType<MenuTriggerProps>;
  Content: ComponentType<MenuContentProps>;
  Item: ComponentType<MenuItemProps>;
  Separator: ComponentType<MenuSeparatorProps>;
};

const NATIVE: Parts = {
  Menu: NativeMenu,
  Trigger: NativeTrigger,
  Content: NativeContent,
  Item: NativeItem,
  Separator: NativeSeparator,
};

const COMPILED: Parts = {
  Menu: CompiledMenu,
  Trigger: CompiledTrigger,
  Content: CompiledContent,
  Item: CompiledItem,
  Separator: CompiledSeparator,
};

function ProbeIcon({ name }: { name: string }) {
  const inherited = useContext(IconClassContext);
  return <span data-testid={`icon-${name}`} data-class={inherited ?? ""} />;
}

function LaneMenu({
  parts: { Menu, Trigger, Content, Item, Separator },
  name,
  trigger,
  icons,
  defaultOpen,
}: {
  parts: Parts;
  name: string;
  trigger: ReactNode;
  icons: { rename: ReactNode; remove: ReactNode };
  defaultOpen?: boolean;
}) {
  const [chosen, setChosen] = useState<string[]>([]);
  const choose = (what: string) => () => setChosen((all) => [...all, what]);
  return (
    <div className="flex flex-col gap-2">
      <Menu defaultOpen={defaultOpen}>
        <Trigger>{trigger}</Trigger>
        <Content aria-label={name}>
          <Item icon={icons.rename} label="Rename" trailing="F2" onSelect={choose("rename")} />
          <Item label="Move left" disabled onSelect={choose("left")} />
          <Item label="Move right" onSelect={choose("right")} />
          <Separator />
          <Item icon={icons.remove} label="Delete" destructive onSelect={choose("delete")} />
        </Content>
      </Menu>
      <output aria-label={`${name} chosen`}>{chosen.join(",") || "nothing"}</output>
    </div>
  );
}

const body = () => within(document.body);

function Compiled(props: { defaultOpen?: boolean }) {
  return (
    <LaneMenu
      parts={COMPILED}
      name="Compiled lane actions"
      trigger="Compiled lane actions"
      icons={{ rename: <Pencil />, remove: <Trash2 /> }}
      {...props}
    />
  );
}

function Native(props: { defaultOpen?: boolean }) {
  return (
    <LaneMenu
      parts={NATIVE}
      name="Native lane actions"
      trigger={<Text className="text-foreground">Native lane actions</Text>}
      icons={{ rename: <ProbeIcon name="rename" />, remove: <ProbeIcon name="delete" /> }}
      {...props}
    />
  );
}

/** Arrow keys, typeahead and Enter — radix's, on the web half — and focus back on the trigger. */
export const WebKeyboard: Story = {
  render: () => <Compiled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Compiled lane actions" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");

    const menu = await body().findByRole("menu");
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
    const item = (name: string | RegExp) => within(menu).getByRole("menuitem", { name });

    await waitFor(() => expect(document.activeElement).toBe(item(/^Rename/)));
    // Down skips the disabled row rather than stopping on it.
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(item("Move right"));
    await userEvent.keyboard("{ArrowDown}");
    await expect(document.activeElement).toBe(item("Delete"));
    await userEvent.keyboard("{ArrowUp}");
    await expect(document.activeElement).toBe(item("Move right"));
    // Typeahead on the label.
    await userEvent.keyboard("r");
    await waitFor(() => expect(document.activeElement).toBe(item(/^Rename/)));

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(
      canvas.getByRole("status", { name: "Compiled lane actions chosen" }),
    ).toHaveTextContent("rename");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/** A pointer choice closes the menu; a disabled row does nothing; a destructive row says so. */
export const WebSelect: Story = {
  render: () => <Compiled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `hidden`: while the menu is open radix hides the rest of the page from the accessibility
    // tree, as a modal menu should, and the readout is part of the rest.
    const chosen = () =>
      canvas.getByRole("status", { name: "Compiled lane actions chosen", hidden: true });
    await userEvent.click(canvas.getByRole("button", { name: "Compiled lane actions" }));
    const menu = await body().findByRole("menu");

    // `fireEvent` because the row is `pointer-events: none`, which `userEvent` refuses to click
    // through — this is a click that arrives anyway, and it still must not select.
    const disabled = within(menu).getByRole("menuitem", { name: "Move left" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabled);
    await expect(chosen()).toHaveTextContent("nothing");
    await expect(body().getByRole("menu")).toBeInTheDocument();

    const remove = within(menu).getByRole("menuitem", { name: "Delete" });
    const rename = within(menu).getByRole("menuitem", { name: "Rename F2" });
    await expect(remove).toHaveAttribute("data-variant", "destructive");
    await expect(getComputedStyle(remove).color).not.toBe(getComputedStyle(rename).color);

    await userEvent.click(remove);
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(chosen()).toHaveTextContent("delete");
  },
};

/** Roles, closing on select, the disabled row and the destructive colour on the native half. */
export const NativeSelect: Story = {
  render: () => <Native />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = () => canvas.getByRole("status", { name: "Native lane actions chosen" });
    const trigger = canvas.getByRole("button", { name: "Native lane actions" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);

    const menu = await body().findByRole("menu", { name: "Native lane actions" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);

    const disabled = within(menu).getByRole("menuitem", { name: "Move left" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabled);
    await expect(chosen()).toHaveTextContent("nothing");
    await expect(body().getByRole("menu")).toBeInTheDocument();

    // The row's ink reaches the icon through the context, and the label through its own class.
    await expect(body().getByTestId("icon-delete").dataset.class).toContain("text-destructive");
    await expect(body().getByTestId("icon-rename").dataset.class).toContain(
      "text-popover-foreground",
    );
    const ink = (label: string) => getComputedStyle(within(menu).getByText(label)).color;
    await expect(ink("Delete")).not.toBe(ink("Rename"));

    await userEvent.click(within(menu).getByRole("menuitem", { name: "Move right" }));
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(chosen()).toHaveTextContent("right");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/** Open, so the axe run every story gets is run over the menu and not only the trigger. */
export const WebOpen: Story = {
  parameters: {
    // Radix's, and every modal overlay's: the page behind the menu is `aria-hidden` and the
    // trigger in it still has a tab stop. The focus trap is what keeps it unreachable, which axe
    // cannot see. Everything else axe checks still runs over the open menu.
    a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
  },
  render: () => <Compiled defaultOpen />,
  play: async () => {
    await expect(await body().findByRole("menu")).toBeInTheDocument();
  },
};

/** The same, for the native half. */
export const NativeOpen: Story = {
  parameters: {
    // A Storybook artefact: under Vite the native source's `@/components/ui/popover` resolves to
    // the radix half, whose unnamed `role="dialog"` wraps the menu here. On device that layer is
    // a `Modal`, and an Expo web app resolves `menu` itself to `menu.web.tsx`, so this pairing
    // is never shipped. The menu inside it is named, and the rest of axe still runs.
    a11y: { config: { rules: [{ id: "aria-dialog-name", enabled: false }] } },
  },
  render: () => <Native defaultOpen />,
  play: async () => {
    await expect(
      await body().findByRole("menu", { name: "Native lane actions" }),
    ).toBeInTheDocument();
  },
};
