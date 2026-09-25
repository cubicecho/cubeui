import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as C from "../compiled/alert-dialog";
import { Button as CompiledButton } from "../compiled/button";
import * as N from "../registry/ui/alert-dialog";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * shadcn's alert dialog, the two ways a web app gets it. On the left, an Expo web app: Vite
 * resolves `.web.tsx` first, as Metro does on web, so `registry/ui/alert-dialog` is the radix half
 * over the React Native `Button`, and it is written in the native vocabulary — `onPress`. On the
 * right, the compiled copy a DOM app installs, with `onClick`. The same composition on each, held
 * to the three things that make it an alert dialog: the role, no corner close, and an action that
 * runs once and then closes. The React Native half (the native `Dialog` underneath) runs on device
 * only, like every twinned item's.
 */
const meta = { title: "Stage 0/AlertDialog" } satisfies Meta;
export default meta;
type Story = StoryObj;

const nativeAct = fn();
const compiledAct = fn();

const body = () => within(document.body);
const closed = () => waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <N.AlertDialog>
          <N.AlertDialogTrigger asChild>
            <NativeButton variant="outline">Native revoke</NativeButton>
          </N.AlertDialogTrigger>
          <N.AlertDialogContent>
            <N.AlertDialogHeader>
              <N.AlertDialogTitle>Revoke this key?</N.AlertDialogTitle>
              <N.AlertDialogDescription>The nightly sync stops working.</N.AlertDialogDescription>
            </N.AlertDialogHeader>
            <N.AlertDialogFooter>
              <N.AlertDialogCancel>Cancel</N.AlertDialogCancel>
              <N.AlertDialogAction variant="destructive" onPress={nativeAct}>
                Revoke
              </N.AlertDialogAction>
            </N.AlertDialogFooter>
          </N.AlertDialogContent>
        </N.AlertDialog>
      }
      compiled={
        <C.AlertDialog>
          <C.AlertDialogTrigger asChild>
            <CompiledButton variant="outline">Compiled revoke</CompiledButton>
          </C.AlertDialogTrigger>
          <C.AlertDialogContent>
            <C.AlertDialogHeader>
              <C.AlertDialogTitle>Revoke this key?</C.AlertDialogTitle>
              <C.AlertDialogDescription>The nightly sync stops working.</C.AlertDialogDescription>
            </C.AlertDialogHeader>
            <C.AlertDialogFooter>
              <C.AlertDialogCancel>Cancel</C.AlertDialogCancel>
              <C.AlertDialogAction variant="destructive" onClick={compiledAct}>
                Revoke
              </C.AlertDialogAction>
            </C.AlertDialogFooter>
          </C.AlertDialogContent>
        </C.AlertDialog>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const [name, act] of [
      ["Compiled", compiledAct],
      ["Native", nativeAct],
    ] as const) {
      await step(
        `${name}: Cancel closes without acting, and there is no corner close`,
        async () => {
          act.mockClear();
          await userEvent.click(canvas.getByRole("button", { name: `${name} revoke` }));
          const open = await body().findByRole("alertdialog");
          await expect(within(open).getByText("Revoke this key?")).toBeInTheDocument();
          await expect(within(open).queryByRole("button", { name: "Close" })).toBeNull();
          await userEvent.click(within(open).getByRole("button", { name: "Cancel" }));
          await closed();
          await expect(act).not.toHaveBeenCalled();
        },
      );

      await step(`${name}: the action runs once, then closes`, async () => {
        await userEvent.click(canvas.getByRole("button", { name: `${name} revoke` }));
        const open = await body().findByRole("alertdialog");
        await userEvent.click(within(open).getByRole("button", { name: "Revoke" }));
        await expect(act).toHaveBeenCalledOnce();
        await closed();
      });
    }
  },
};
