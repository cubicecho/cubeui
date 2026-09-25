import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentType, useState } from "react";
import { Text } from "react-native";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { InlineTextEdit as Compiled } from "../compiled/inline-text-edit";
import {
  MenuContent as CompiledContent,
  MenuItem as CompiledItem,
  Menu as CompiledMenu,
  MenuTrigger as CompiledTrigger,
} from "../compiled/menu";
import { InlineTextEdit as Native } from "../registry/ui/inline-text-edit";
import {
  MenuContent as NativeContent,
  MenuItem as NativeItem,
  Menu as NativeMenu,
  MenuTrigger as NativeTrigger,
} from "../registry/ui/menu.tsx";
import type {
  MenuContentProps,
  MenuItemProps,
  MenuProps,
  MenuTriggerProps,
} from "../registry/ui/menu-base";
import { SideBySide } from "./side-by-side";

/**
 * A rename in place, on both halves: min-agent's `RenameField`, telos's lane title and engrafo's
 * document title were each this by hand. Enter and blur commit, Escape puts the old value back,
 * the draft is trimmed, and an empty or unchanged one never reaches `onSave`.
 *
 * The native half's menu is imported by its full name because Vite would otherwise resolve
 * `menu.web.tsx`.
 */
const meta = { title: "Stage 0/InlineTextEdit" } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

const onSave = fn();

function Pressed({ Edit, name }: { Edit: typeof Native; name: string }) {
  const [value, setValue] = useState("Backlog");
  return (
    <div className="flex flex-col gap-2">
      <Edit
        value={value}
        label={`${name} lane name`}
        onSave={(next) => {
          onSave(next);
          setValue(next);
        }}
      />
      <button type="button" className="self-start text-foreground text-xs">
        {`${name} elsewhere`}
      </button>
    </div>
  );
}

/** Pressing the text starts the edit, and every way out of it. */
export const Pressing: Story = {
  render: () => (
    <SideBySide
      native={<Pressed Edit={Native} name="Native" />}
      compiled={<Pressed Edit={Compiled} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"]) {
      const label = `${name} lane name`;
      const box = () => canvas.getByRole("textbox", { name: label });
      const start = async (text: string) => {
        const half = canvas.getByRole("button", { name: `${name} elsewhere` })
          .parentElement as HTMLElement;
        // Named by its text. Described by what it edits too, where the platform has a description:
        // react-native-web drops `accessibilityHint`, which is read on device.
        const press = within(half).getByRole("button", { name: text });
        if (name === "Compiled") await expect(press).toHaveAttribute("aria-description", label);
        await userEvent.click(press);
        await waitFor(() => expect(document.activeElement).toBe(box()));
      };

      await step(`${name}: Enter commits the trimmed draft`, async () => {
        onSave.mockClear();
        await start("Backlog");
        await expect(box()).toHaveValue("Backlog");
        await userEvent.clear(box());
        await userEvent.type(box(), "  Doing  {Enter}");
        await expect(onSave).toHaveBeenCalledTimes(1);
        await expect(onSave).toHaveBeenCalledWith("Doing");
        await expect(canvas.queryByRole("textbox", { name: label })).toBeNull();
      });

      await step(`${name}: Escape puts the old value back`, async () => {
        onSave.mockClear();
        await start("Doing");
        await userEvent.type(box(), " later{Escape}");
        await expect(canvas.queryByRole("textbox", { name: label })).toBeNull();
        await expect(onSave).not.toHaveBeenCalled();
        await start("Doing");
        await expect(box()).toHaveValue("Doing");
        await userEvent.keyboard("{Escape}");
      });

      await step(`${name}: blur commits`, async () => {
        onSave.mockClear();
        await start("Doing");
        await userEvent.clear(box());
        await userEvent.type(box(), "Done");
        await userEvent.click(canvas.getByRole("button", { name: `${name} elsewhere` }));
        await expect(onSave).toHaveBeenCalledTimes(1);
        await expect(onSave).toHaveBeenCalledWith("Done");
      });

      await step(`${name}: an empty draft keeps the old value`, async () => {
        onSave.mockClear();
        await start("Done");
        await userEvent.clear(box());
        await userEvent.type(box(), "   {Enter}");
        await expect(onSave).not.toHaveBeenCalled();
        await start("Done");
        await userEvent.keyboard("{Escape}");
      });

      await step(`${name}: an unchanged draft is not saved`, async () => {
        onSave.mockClear();
        await start("Done");
        await userEvent.type(box(), " {Enter}");
        await expect(onSave).not.toHaveBeenCalled();
        await expect(canvas.queryByRole("textbox", { name: label })).toBeNull();
      });
    }
  },
};

type Parts = {
  Menu: ComponentType<MenuProps>;
  Trigger: ComponentType<MenuTriggerProps>;
  Content: ComponentType<MenuContentProps>;
  Item: ComponentType<MenuItemProps>;
};

const NATIVE: Parts = {
  Menu: NativeMenu,
  Trigger: NativeTrigger,
  Content: NativeContent,
  Item: NativeItem,
};

const COMPILED: Parts = {
  Menu: CompiledMenu,
  Trigger: CompiledTrigger,
  Content: CompiledContent,
  Item: CompiledItem,
};

const onRename = fn();

/**
 * telos's lane column: the title is a heading, and the edit starts from a Rename row in the lane's
 * menu, so the caller holds `editing` and the heading is not a button.
 */
function MenuRename({
  Edit,
  parts: { Menu, Trigger, Content, Item },
  name,
}: {
  Edit: typeof Native;
  parts: Parts;
  name: string;
}) {
  const [lane, setLane] = useState(`${name} inbox`);
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Edit
        value={lane}
        level={3}
        label={`Rename ${lane}`}
        editing={editing}
        onEditingChange={setEditing}
        className="font-medium"
        onSave={(next) => {
          onRename(next);
          setLane(next);
        }}
      />
      <Menu>
        <Trigger>
          {name === "Native" ? (
            <Text className="text-foreground">{`${name} lane actions`}</Text>
          ) : (
            `${name} lane actions`
          )}
        </Trigger>
        <Content aria-label={`${name} lane actions`}>
          <Item label="Rename" focusesElsewhere onSelect={() => setEditing(true)} />
        </Content>
      </Menu>
    </div>
  );
}

/** Started from a menu row: the box keeps the focus the row hands it, and Enter commits. */
export const FromAMenu: Story = {
  render: () => (
    <SideBySide
      native={<MenuRename Edit={Native} parts={NATIVE} name="Native" />}
      compiled={<MenuRename Edit={Compiled} parts={COMPILED} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"]) {
      await step(name, async () => {
        onRename.mockClear();
        const heading = canvas.getByRole("heading", { level: 3, name: `${name} inbox` });
        // The caller holds `editing`, so the heading is text, not a button.
        await expect(within(heading).queryByRole("button")).toBeNull();

        await userEvent.click(canvas.getByRole("button", { name: `${name} lane actions` }));
        const menu = await body().findByRole("menu");
        await userEvent.click(within(menu).getByRole("menuitem", { name: "Rename" }));
        await waitFor(() => expect(body().queryByRole("menu")).toBeNull());

        const box = await canvas.findByRole("textbox", { name: `Rename ${name} inbox` });
        await new Promise((resolve) => setTimeout(resolve, 100));
        await expect(document.activeElement).toBe(box);
        await userEvent.clear(box);
        await userEvent.type(box, `${name} today{Enter}`);
        await expect(onRename).toHaveBeenCalledTimes(1);
        await expect(onRename).toHaveBeenCalledWith(`${name} today`);
        await expect(
          canvas.getByRole("heading", { level: 3, name: `${name} today` }),
        ).toBeVisible();
      });
    }
  },
};
