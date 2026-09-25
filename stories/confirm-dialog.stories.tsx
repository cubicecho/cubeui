import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  ConfirmProvider as CompiledProvider,
  useConfirm as useCompiledConfirm,
} from "../compiled/confirm";
import { ConfirmDialog as CompiledDialog } from "../compiled/confirm-dialog";
import {
  ConfirmProvider as NativeProvider,
  useConfirm as useNativeConfirm,
} from "../registry/ui/confirm";
import { ConfirmDialog as NativeDialog } from "../registry/ui/confirm-dialog";
import { SideBySide } from "./side-by-side";

/**
 * `requireText`, on both halves — issue #153. A delete big enough to ask for the thing's name:
 * the destructive button stays disabled until the box holds the name exactly, Enter confirms only
 * when it does, and the box is empty every time the dialog opens.
 *
 * The two halves' dialogs are modal, so they are opened one at a time rather than side by side.
 */
const meta = { title: "Stage 0/ConfirmDialog" } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

const onConfirm = fn();

function Folder({ Dialog, name }: { Dialog: typeof NativeDialog; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="self-start text-foreground" onClick={() => setOpen(true)}>
        {`${name} delete folder`}
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this folder?"
        description="Its notes go with it."
        confirmLabel="Delete"
        requireText="work"
        onConfirm={() => {
          onConfirm(name);
          setOpen(false);
        }}
      />
    </>
  );
}

const dialog = () => body().findByRole("alertdialog");
const box = async () =>
  within(await dialog()).findByRole("textbox", { name: "Type work to confirm" });
const deleteButton = async () => within(await dialog()).findByRole("button", { name: "Delete" });
const closed = () => waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());

/** Wrong text keeps it locked; the exact text unlocks it; the button confirms once. */
export const TypeTheName: Story = {
  render: () => (
    <SideBySide
      native={<Folder Dialog={NativeDialog} name="Native" />}
      compiled={<Folder Dialog={CompiledDialog} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"]) {
      const open = () =>
        userEvent.click(canvas.getByRole("button", { name: `${name} delete folder` }));

      await step(`${name}: the action is disabled until the name matches`, async () => {
        onConfirm.mockClear();
        await open();
        await expect(await deleteButton()).toBeDisabled();

        // Pressed anyway: the compiled button is `pointer-events-none` while disabled, and the
        // check that would refuse the click is the thing under test here.
        await userEvent.setup({ pointerEventsCheck: 0 }).click(await deleteButton());
        await expect(onConfirm).not.toHaveBeenCalled();

        // Near misses: case, a trailing space, a prefix.
        for (const wrong of ["Work", "work ", "wor"]) {
          await userEvent.clear(await box());
          await userEvent.type(await box(), wrong);
          await expect(await deleteButton()).toBeDisabled();
        }

        await userEvent.clear(await box());
        await userEvent.type(await box(), "work");
        await expect(await deleteButton()).toBeEnabled();
        await userEvent.click(await deleteButton());
        await expect(onConfirm).toHaveBeenCalledTimes(1);
        await expect(onConfirm).toHaveBeenCalledWith(name);
        await closed();
      });

      await step(`${name}: the box is empty when the dialog opens again`, async () => {
        await open();
        await expect(await box()).toHaveValue("");
        await expect(await deleteButton()).toBeDisabled();
        await userEvent.click(within(await dialog()).getByRole("button", { name: "Cancel" }));
        await closed();
      });

      await step(`${name}: Enter confirms only when the name matches`, async () => {
        onConfirm.mockClear();
        await open();
        await userEvent.type(await box(), "wrok{Enter}");
        await expect(onConfirm).not.toHaveBeenCalled();
        await expect(await dialog()).toBeInTheDocument();

        await userEvent.clear(await box());
        await userEvent.type(await box(), "work{Enter}");
        await expect(onConfirm).toHaveBeenCalledTimes(1);
        await closed();
      });
    }
  },
};

const onAnswer = fn();

function Prompt({ useConfirm, name }: { useConfirm: typeof useNativeConfirm; name: string }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      className="self-start text-foreground"
      onClick={async () => {
        onAnswer(
          await confirm({
            title: "Delete this folder?",
            description: "Its notes go with it.",
            requireText: "work",
            requireTextLabel: "Type work to delete it",
          }),
        );
      }}
    >
      {`${name} ask`}
    </button>
  );
}

/** `confirm()` passes `requireText` and its label through, and resolves once. */
export const ThroughConfirm: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeProvider>
          <Prompt useConfirm={useNativeConfirm} name="Native" />
        </NativeProvider>
      }
      compiled={
        <CompiledProvider>
          <Prompt useConfirm={useCompiledConfirm} name="Compiled" />
        </CompiledProvider>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"]) {
      await step(`${name}: locked until typed, then resolves true once`, async () => {
        onAnswer.mockClear();
        await userEvent.click(canvas.getByRole("button", { name: `${name} ask` }));
        const input = await within(await dialog()).findByRole("textbox", {
          name: "Type work to delete it",
        });
        await expect(await deleteButton()).toBeDisabled();
        await userEvent.type(input, "work");
        await userEvent.click(await deleteButton());
        await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(1));
        await expect(onAnswer).toHaveBeenCalledWith(true);
        await closed();
      });
    }
  },
};
