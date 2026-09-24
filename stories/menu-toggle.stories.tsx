import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, type ReactNode, useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  MenuCheckboxItem as CompiledCheckboxItem,
  MenuContent as CompiledContent,
  Menu as CompiledMenu,
  MenuRadioGroup as CompiledRadioGroup,
  MenuRadioItem as CompiledRadioItem,
  MenuSeparator as CompiledSeparator,
  MenuTrigger as CompiledTrigger,
} from "../compiled/menu";
import {
  MenuCheckboxItem as NativeCheckboxItem,
  MenuContent as NativeContent,
  Menu as NativeMenu,
  MenuRadioGroup as NativeRadioGroup,
  MenuRadioItem as NativeRadioItem,
  MenuSeparator as NativeSeparator,
  MenuTrigger as NativeTrigger,
} from "../registry/ui/menu.tsx";
import type {
  MenuCheckboxItemProps,
  MenuContentProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
  MenuTriggerProps,
} from "../registry/ui/menu-base";

/**
 * The toggle rows, issue #120: telos's label picker (attach labels to a todo — a checkbox list
 * that stays open between presses) and its label filter (one of N, which closes), on both halves.
 * Before these, each was a `Popover` of hand-built `role="checkbox"` rows with no arrow keys and
 * the row classes copied from `MenuItem`.
 *
 * A file of its own rather than more stories in `menu.stories.tsx`, which is `MenuItem`'s.
 */
const meta = { title: "Menu toggle rows", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj;

type Parts = {
  Menu: ComponentType<MenuProps>;
  Trigger: ComponentType<MenuTriggerProps>;
  Content: ComponentType<MenuContentProps>;
  CheckboxItem: ComponentType<MenuCheckboxItemProps>;
  RadioGroup: ComponentType<MenuRadioGroupProps>;
  RadioItem: ComponentType<MenuRadioItemProps>;
  Separator: ComponentType<MenuSeparatorProps>;
};

const NATIVE: Parts = {
  Menu: NativeMenu,
  Trigger: NativeTrigger,
  Content: NativeContent,
  CheckboxItem: NativeCheckboxItem,
  RadioGroup: NativeRadioGroup,
  RadioItem: NativeRadioItem,
  Separator: NativeSeparator,
};

const COMPILED: Parts = {
  Menu: CompiledMenu,
  Trigger: CompiledTrigger,
  Content: CompiledContent,
  CheckboxItem: CompiledCheckboxItem,
  RadioGroup: CompiledRadioGroup,
  RadioItem: CompiledRadioItem,
  Separator: CompiledSeparator,
};

const LABELS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "chore", label: "Chore", disabled: true },
];

function LabelMenu({
  parts: { Menu, Trigger, Content, CheckboxItem, RadioGroup, RadioItem, Separator },
  name,
  trigger,
  defaultOpen,
}: {
  parts: Parts;
  name: string;
  trigger: ReactNode;
  defaultOpen?: boolean;
}) {
  const [attached, setAttached] = useState<string[]>(["feature"]);
  const [filter, setFilter] = useState("all");
  const toggle = (value: string) => (on: boolean) =>
    setAttached((all) => (on ? [...all, value] : all.filter((v) => v !== value)));
  return (
    <div className="flex flex-col gap-2">
      <Menu {...(defaultOpen === undefined ? {} : { defaultOpen })}>
        <Trigger>{trigger}</Trigger>
        <Content aria-label={name}>
          {LABELS.map((l) => (
            <CheckboxItem
              key={l.value}
              label={l.label}
              trailing={l.value === "bug" ? "3" : undefined}
              disabled={l.disabled}
              checked={attached.includes(l.value)}
              onCheckedChange={toggle(l.value)}
            />
          ))}
          <Separator />
          <RadioGroup aria-label="Show" value={filter} onValueChange={setFilter}>
            <RadioItem value="all" label="All" />
            <RadioItem value="open" label="Open" />
            <RadioItem value="done" label="Done" />
          </RadioGroup>
        </Content>
      </Menu>
      <output aria-label={`${name} labels`}>{attached.join(",") || "none"}</output>
      <output aria-label={`${name} filter`}>{filter}</output>
    </div>
  );
}

const body = () => within(document.body);

function Compiled(props: { defaultOpen?: boolean }) {
  return <LabelMenu parts={COMPILED} name="Compiled labels" trigger="Compiled labels" {...props} />;
}

function Native(props: { defaultOpen?: boolean }) {
  return (
    <LabelMenu
      parts={NATIVE}
      name="Native labels"
      trigger={<Text className="text-foreground">Native labels</Text>}
      {...props}
    />
  );
}

/** Whether the row draws its ✓ — the glyph is the only `svg` in a row with no `icon`. */
const hasCheck = (row: HTMLElement) => row.querySelector("svg") !== null;

/**
 * The shared play: toggling keeps the menu open, the ✓ follows `checked`, a disabled row does
 * nothing, and a radio row is chosen and closes the menu.
 */
async function playToggles(canvasElement: HTMLElement, name: string, open: () => Promise<void>) {
  const canvas = within(canvasElement);
  // `hidden`: radix hides the page behind an open menu from the accessibility tree.
  const labels = () => canvas.getByRole("status", { name: `${name} labels`, hidden: true });
  const filter = () => canvas.getByRole("status", { name: `${name} filter`, hidden: true });

  await open();
  const menu = await body().findByRole("menu");
  const box = (label: string | RegExp) =>
    within(menu).getByRole("menuitemcheckbox", { name: label });
  await expect(within(menu).getAllByRole("menuitemcheckbox")).toHaveLength(3);

  await expect(box(/^Bug/)).toHaveAttribute("aria-checked", "false");
  await expect(box("Feature")).toHaveAttribute("aria-checked", "true");
  await expect(hasCheck(box(/^Bug/))).toBe(false);
  await expect(hasCheck(box("Feature"))).toBe(true);

  // Toggling on and off again, without the menu closing in between.
  await userEvent.click(box(/^Bug/));
  await waitFor(() => expect(box(/^Bug/)).toHaveAttribute("aria-checked", "true"));
  await expect(hasCheck(box(/^Bug/))).toBe(true);
  await expect(labels()).toHaveTextContent("feature,bug");
  await expect(body().getByRole("menu")).toBeInTheDocument();

  await userEvent.click(box("Feature"));
  await waitFor(() => expect(box("Feature")).toHaveAttribute("aria-checked", "false"));
  await expect(labels()).toHaveTextContent("bug");
  await expect(body().getByRole("menu")).toBeInTheDocument();

  const disabled = box("Chore");
  await expect(disabled).toHaveAttribute("aria-disabled", "true");

  // The radio rows: `All` is on, and choosing another closes the menu.
  const radio = (label: string) => within(menu).getByRole("menuitemradio", { name: label });
  await expect(within(menu).getAllByRole("menuitemradio")).toHaveLength(3);
  await expect(radio("All")).toHaveAttribute("aria-checked", "true");
  await expect(radio("Open")).toHaveAttribute("aria-checked", "false");
  await userEvent.click(radio("Open"));
  await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  await expect(filter()).toHaveTextContent("open");

  // Reopened, the menu shows what was chosen.
  await open();
  const again = await body().findByRole("menu");
  await expect(within(again).getByRole("menuitemradio", { name: "Open" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(within(again).getByRole("menuitemradio", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(within(again).getByRole("menuitemcheckbox", { name: /^Bug/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // Shut again, so the next story does not find this one's menu still in the body.
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
}

/** Pointer toggles and a radio choice on the web half. */
export const WebToggle: Story = {
  render: () => <Compiled />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Compiled labels" });
    await playToggles(canvasElement, "Compiled labels", () => userEvent.click(trigger));
  },
};

/** Space toggles a row and keeps the menu open; Enter on a radio row chooses and closes. */
export const WebToggleKeyboard: Story = {
  render: () => <Compiled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Compiled labels" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await body().findByRole("menu");
    const bug = within(menu).getByRole("menuitemcheckbox", { name: /^Bug/ });
    await waitFor(() => expect(document.activeElement).toBe(bug));

    await userEvent.keyboard(" ");
    await waitFor(() => expect(bug).toHaveAttribute("aria-checked", "true"));
    await expect(body().getByRole("menu")).toBeInTheDocument();
    await expect(document.activeElement).toBe(bug);

    // Down past Feature, skipping the disabled Chore, onto the radio rows.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect(document.activeElement).toBe(
      within(menu).getByRole("menuitemradio", { name: "Open" }),
    );
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("status", { name: "Compiled labels filter" })).toHaveTextContent(
      "open",
    );
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/** The same contract on the native half. */
export const NativeToggle: Story = {
  render: () => <Native />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Native labels" });
    await playToggles(canvasElement, "Native labels", () => userEvent.click(trigger));
  },
};

/** Open, so axe runs over the toggle rows. */
export const WebToggleOpen: Story = {
  parameters: {
    // As `Menu`'s `WebOpen`: radix hides the page behind the menu, and the focus trap is what
    // keeps its tab stops unreachable, which axe cannot see.
    a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
  },
  render: () => <Compiled defaultOpen />,
  play: async () => {
    await expect(await body().findByRole("menu")).toBeInTheDocument();
  },
};

/** The same, for the native half. */
export const NativeToggleOpen: Story = {
  parameters: {
    // As `Menu`'s `NativeOpen`: under Vite the native popover resolves to the radix half, whose
    // unnamed `role="dialog"` is a Storybook artefact.
    a11y: { config: { rules: [{ id: "aria-dialog-name", enabled: false }] } },
  },
  render: () => <Native defaultOpen />,
  play: async () => {
    await expect(await body().findByRole("menu", { name: "Native labels" })).toBeInTheDocument();
  },
};
