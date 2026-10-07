import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import * as Compiled from "../compiled/unsaved-changes-guard";
import * as Native from "../registry/layout/unsaved-changes-guard";
import { SideBySide } from "./side-by-side";

/**
 * The three ways out of a page with unsaved edits, on both halves: the page's own Close button,
 * a router navigation, and closing the tab. The router here is a stand-in — a blocker is only a
 * `status`, a `proceed` and a `reset`, which is the point of the guard taking it structurally.
 *
 * The two halves' dialogs are modal, so they are opened one at a time rather than side by side.
 */
const meta = { title: "RN Parity/UnsavedChangesGuard" } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

const onClose = fn();
const onProceed = fn();
const onReset = fn();

/** An editor with one dirty flag, a Close button and a link the stand-in router blocks. */
function Editor({ half, name }: { half: typeof Native; name: string }) {
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const guard = half.useUnsavedChangesGuard({
    hasUnsavedChanges: dirty,
    blocker: {
      status: blocked ? "blocked" : "idle",
      proceed: () => {
        setBlocked(false);
        onProceed(name);
      },
      reset: () => {
        setBlocked(false);
        onReset(name);
      },
    },
  });

  return (
    <div className="flex flex-col items-start gap-2 text-foreground">
      <button type="button" onClick={() => setDirty((was) => was === false)}>
        {`${name} ${dirty ? "edited" : "clean"}`}
      </button>
      <button type="button" onClick={() => guard.leave(() => onClose(name))}>
        {`${name} close`}
      </button>
      <button type="button" onClick={() => setBlocked(true)}>
        {`${name} navigate`}
      </button>
      <half.UnsavedChangesDialog guard={guard} />
    </div>
  );
}

/** Whether the page would ask before the tab closes. */
function asksBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<Editor half={Native} name="native" />}
      compiled={<Editor half={Compiled} name="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gone = () =>
      waitFor(() => expect(body().queryByRole("alertdialog")).not.toBeInTheDocument());

    for (const name of ["native", "compiled"]) {
      onClose.mockClear();
      onProceed.mockClear();
      onReset.mockClear();
      const close = canvas.getByRole("button", { name: `${name} close` });

      // Nothing to lose: Close closes, and the tab closes without a question.
      await userEvent.click(close);
      await expect(onClose).toHaveBeenCalledTimes(1);
      await expect(asksBeforeUnload()).toBe(false);

      // Edited: Close asks first, and so does the tab.
      await userEvent.click(canvas.getByRole("button", { name: `${name} clean` }));
      await waitFor(() => expect(asksBeforeUnload()).toBe(true));
      await userEvent.click(close);
      const question = await body().findByRole("alertdialog", { name: "Discard your changes?" });
      await expect(onClose).toHaveBeenCalledTimes(1);

      // Keep editing drops it; Discard goes ahead.
      await userEvent.click(within(question).getByRole("button", { name: "Keep editing" }));
      await gone();
      await expect(onClose).toHaveBeenCalledTimes(1);
      await userEvent.click(close);
      await userEvent.click(await body().findByRole("button", { name: "Discard" }));
      await gone();
      await expect(onClose).toHaveBeenCalledTimes(2);

      // A blocked navigation asks the same question, and its answers are the router's.
      await userEvent.click(canvas.getByRole("button", { name: `${name} navigate` }));
      await userEvent.click(await body().findByRole("button", { name: "Keep editing" }));
      await gone();
      await expect(onReset).toHaveBeenCalledWith(name);
      await expect(onProceed).not.toHaveBeenCalled();

      await userEvent.click(canvas.getByRole("button", { name: `${name} navigate` }));
      await userEvent.click(await body().findByRole("button", { name: "Discard" }));
      await gone();
      await expect(onProceed).toHaveBeenCalledWith(name);
      await expect(onClose).toHaveBeenCalledTimes(2);

      // Clean again, so the other half starts from a tab that closes freely.
      await userEvent.click(canvas.getByRole("button", { name: `${name} edited` }));
      await waitFor(() => expect(asksBeforeUnload()).toBe(false));
    }
  },
};
