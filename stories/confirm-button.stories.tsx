import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ConfirmButton as Compiled } from "../compiled/confirm-button";
import { Trash2 as CompiledTrash } from "../compiled/icons";
import { ConfirmButton as Native } from "../registry/layout/confirm-button";
import { Trash2 as NativeTrash } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * The confirm button on both halves: react-native-web on the left, the compiled DOM on the right.
 * `stories/web/confirm-button.stories.tsx` holds the web half to everything it promised while it
 * was hand-written over radix's `AlertDialog`; these hold the two halves to each other on the
 * parts that are the component's reason to exist — it asks before it acts, a disabled one does
 * not ask, and a big delete waits for its name.
 *
 * The dialogs are modal, so each half is opened and closed in turn rather than side by side.
 */
const meta = { title: "Stage 0/ConfirmButton" } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);
const dialog = () => body().findByRole("alertdialog");
const closed = () => waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());

const nativeConfirm = fn();
const compiledConfirm = fn();
const HALVES = [
  ["Compiled", compiledConfirm],
  ["Native", nativeConfirm],
] as const;

const lane = {
  title: "Delete this lane?",
  description: "The lane takes its cards with it.",
} as const;

export const AsksBeforeItActs: Story = {
  render: () => (
    <SideBySide
      native={
        <Native label="Native delete lane" {...lane} onConfirm={nativeConfirm}>
          <NativeTrash />
        </Native>
      }
      compiled={
        <Compiled label="Compiled delete lane" {...lane} onConfirm={compiledConfirm}>
          <CompiledTrash />
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const [name, onConfirm] of HALVES) {
      await step(`${name}: Cancel does nothing, and there is no corner close`, async () => {
        onConfirm.mockClear();
        await userEvent.click(canvas.getByRole("button", { name: `${name} delete lane` }));
        const open = await dialog();
        await expect(
          await within(open).findByText("The lane takes its cards with it."),
        ).toBeInTheDocument();
        await expect(within(open).queryByRole("button", { name: "Close" })).toBeNull();
        await userEvent.click(within(open).getByRole("button", { name: "Cancel" }));
        await closed();
        await expect(onConfirm).not.toHaveBeenCalled();
      });

      await step(`${name}: Delete confirms once and closes`, async () => {
        await userEvent.click(canvas.getByRole("button", { name: `${name} delete lane` }));
        await userEvent.click(within(await dialog()).getByRole("button", { name: "Delete" }));
        await expect(onConfirm).toHaveBeenCalledOnce();
        await closed();
      });
    }
  },
};

export const DisabledDoesNotAsk: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          label="Native delete lane"
          hint="You cannot delete the last lane"
          disabled
          {...lane}
          onConfirm={nativeConfirm}
        >
          <NativeTrash />
        </Native>
      }
      compiled={
        <Compiled
          label="Compiled delete lane"
          hint="You cannot delete the last lane"
          disabled
          {...lane}
          onConfirm={compiledConfirm}
        >
          <CompiledTrash />
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, onConfirm] of HALVES) {
      onConfirm.mockClear();
      await userEvent.click(canvas.getByRole("button", { name: `${name} delete lane` }));
      await expect(body().queryByRole("alertdialog")).toBeNull();
      await expect(onConfirm).not.toHaveBeenCalled();
    }
  },
};

const folder = {
  title: "Delete this folder?",
  description: "Its notes go with it.",
  requireText: "work",
  requireTextLabel: "Type work to delete it",
} as const;

export const TypeTheName: Story = {
  render: () => (
    <SideBySide
      native={
        <Native label="Native delete folder" {...folder} onConfirm={nativeConfirm}>
          <NativeTrash />
        </Native>
      }
      compiled={
        <Compiled label="Compiled delete folder" {...folder} onConfirm={compiledConfirm}>
          <CompiledTrash />
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const [name, onConfirm] of HALVES) {
      const open = async () => {
        await userEvent.click(canvas.getByRole("button", { name: `${name} delete folder` }));
        const it = await dialog();
        return {
          box: await within(it).findByRole("textbox", { name: "Type work to delete it" }),
          confirm: within(it).getByRole("button", { name: "Delete" }),
          cancel: within(it).getByRole("button", { name: "Cancel" }),
        };
      };

      await step(`${name}: locked until the name matches, Enter included`, async () => {
        onConfirm.mockClear();
        const { box, confirm } = await open();
        await expect(confirm).toBeDisabled();
        await userEvent.type(box, "wrok{Enter}");
        await expect(onConfirm).not.toHaveBeenCalled();
        await expect(confirm).toBeDisabled();
        await userEvent.clear(box);
        await userEvent.type(box, "work{Enter}");
        await expect(onConfirm).toHaveBeenCalledOnce();
        await closed();
      });

      await step(`${name}: the box is empty on the next opening`, async () => {
        const { box, confirm, cancel } = await open();
        await expect(box).toHaveValue("");
        await expect(confirm).toBeDisabled();
        await userEvent.click(cancel);
        await closed();
      });
    }
  },
};
