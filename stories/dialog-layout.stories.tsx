import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DialogLayout } from "@/registry/new-york/layout/dialog-layout";
import { Button } from "@/registry/new-york/ui/button";

const meta = {
  title: "Layout/DialogLayout",
  component: DialogLayout,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DialogLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Fields = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 py-2">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <div key={n} className="grid gap-1.5">
        <label className="font-medium text-sm" htmlFor={`f${n}`}>
          Field {n}
        </label>
        <input
          id={`f${n}`}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          placeholder="…"
        />
      </div>
    ))}
  </div>
);

const openIt = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: /new workspace|open/i }));
  // Radix portals the content outside the canvas, so assertions read from the document.
  const dialog = await waitFor(() => within(document.body).getByRole("dialog"));
  // The dialog zooms and fades in, and a rectangle measured part-way through that is a rectangle
  // of a transform still in motion — `LongFormKeepsItsTitle` compares two of them for equality
  // and was reading 59.988 against 61.447. Endless animations are skipped, or this never
  // returns; `.finished` rejects on a cancelled one, which is not a failure here either.
  await Promise.all(
    dialog
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      .map((a) => a.finished.catch(() => {})),
  );
  return dialog;
};

export const Default: Story = {
  args: {
    trigger: <Button>New workspace</Button>,
    title: "New workspace",
    description: "A workspace exposes the servers you choose at its own URL.",
    footerActions: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </>
    ),
    content: <Fields />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
  },
};

/**
 * The reason this component exists rather than a snippet.
 *
 * Every hand-written dialog in the source apps caps itself with `max-h-[85vh] overflow-y-auto`
 * on the content, which scrolls the *whole* dialog: on a long form the title leaves the screen
 * first and Save is somewhere past the end of the fields. Here the body scrolls and the chrome
 * does not, and this story asserts exactly that — scroll the body to the end and the title is
 * still where it was.
 */
export const LongFormKeepsItsTitle: Story = {
  args: {
    trigger: <Button>New workspace</Button>,
    title: "New workspace",
    description: "Twenty fields, and the title does not go anywhere.",
    footerActions: <Button>Save</Button>,
    content: <Fields count={20} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);

    // The dialog composes HeaderContentFooter (conventions rule 7), so the scrolling body is the
    // chassis's slot — there is no dialog-specific one, which is the point of composing.
    const body = document.querySelector<HTMLElement>("[data-slot=header-content-footer-content]");
    const title = within(document.body).getByRole("heading", { name: "New workspace" });
    expect(body).not.toBeNull();
    if (!body) return;

    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);

    const titleTop = title.getBoundingClientRect().top;
    const footer = within(document.body).getByRole("button", { name: "Save" });
    const footerTop = footer.getBoundingClientRect().top;

    body.scrollTop = body.scrollHeight;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));

    // Both ends of the chrome stayed put while the middle moved.
    expect(title.getBoundingClientRect().top).toBe(titleTop);
    expect(footer.getBoundingClientRect().top).toBe(footerTop);
  },
};

/**
 * `hideTitle` takes the title off the screen and keeps it for assistive technology. A design
 * with no room for a heading uses this; nothing ever drops the title.
 */
export const HiddenTitle: Story = {
  args: {
    trigger: <Button>Open</Button>,
    title: "Command palette",
    hideTitle: true,
    content: <Fields count={2} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
    // Still announced: findable by its accessible name even though it is visually gone.
    const dialog = within(document.body).getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Command palette");
    expect(within(document.body).getByText("Command palette")).toHaveClass("sr-only");
  },
};

/** Sizes are a literal class map (rule 3), so every one of them is a class Tailwind generated. */
export const Sizes: Story = {
  args: { title: "Sized", content: <Fields count={2} /> },
  render: (args) => (
    <div className="flex gap-2">
      {(["sm", "md", "lg"] as const).map((size) => (
        <DialogLayout {...args} key={size} size={size} trigger={<Button>{size}</Button>} />
      ))}
    </div>
  ),
};

/**
 * No description. The shell spreads an explicit `aria-describedby: undefined` in that case,
 * because Radix warns when nothing describes the content and an unset prop is how you say the
 * absence is deliberate.
 */
export const NoDescription: Story = {
  args: {
    trigger: <Button>Open</Button>,
    title: "Rename board",
    footerActions: <Button>Rename</Button>,
    content: <Fields count={1} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
    const dialog = within(document.body).getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-describedby");
  },
};

/** Radix fades the question in, and a rectangle part-way through that is not yet visible. */
const settle = async (el: Element) => {
  await Promise.all(
    el
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      .map((a) => a.finished.catch(() => {})),
  );
};

/**
 * While the question is up, the dialog behind it is deliberately out of the accessibility tree —
 * so it is found as an element, which is the thing being asserted anyway: the work is still
 * there.
 */
const dialogElement = () => document.body.querySelector('[data-slot="dialog-content"]');

const askToClose = async (canvasElement: HTMLElement) => {
  const dialog = await openIt(canvasElement);
  await userEvent.keyboard("{Escape}");
  const question = await waitFor(() => within(document.body).getByRole("alertdialog"));
  await settle(question);
  return { dialog, question };
};

/**
 * The defect this closes. Three projects wrote a `FormDialog` and kanban_server wrote the guard
 * as a hook — six of its seven dialogs called it, and the seventh did not. Here the guard is a
 * prop, so Escape asks instead of throwing the work away, and the dialog is still there behind
 * the question.
 */
export const UnsavedChangesAskFirst: Story = {
  args: {
    trigger: <Button>New workspace</Button>,
    title: "New workspace",
    hasUnsavedChanges: true,
    content: <Fields />,
    footerActions: <Button>Save</Button>,
  },
  play: async ({ canvasElement }) => {
    const { question } = await askToClose(canvasElement);

    expect(within(question).getByText("Discard your changes?")).toBeVisible();
    expect(dialogElement()).not.toBeNull();
  },
};

/** Keeping the changes puts you back in the form, with the fields as you left them. */
export const KeepEditingReturnsToTheForm: Story = {
  args: { ...UnsavedChangesAskFirst.args },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    await userEvent.type(within(dialog).getByLabelText("Field 1"), "half a thought");
    await userEvent.keyboard("{Escape}");

    const question = await waitFor(() => within(document.body).getByRole("alertdialog"));
    await userEvent.click(within(question).getByRole("button", { name: "Keep editing" }));

    await waitFor(() => {
      expect(within(document.body).queryByRole("alertdialog")).toBeNull();
    });
    expect(within(document.body).getByRole("dialog")).toBeVisible();
    expect(within(dialog).getByLabelText("Field 1")).toHaveValue("half a thought");
  },
};

/** Discarding closes both. */
export const DiscardingClosesIt: Story = {
  args: { ...UnsavedChangesAskFirst.args },
  play: async ({ canvasElement }) => {
    const { question } = await askToClose(canvasElement);
    await userEvent.click(within(question).getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(dialogElement()).toBeNull();
    });
  },
};

/** The close button is guarded on the same terms Escape is — every path Radix owns. */
export const TheCloseButtonAsksToo: Story = {
  args: { ...UnsavedChangesAskFirst.args },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: /close/i }));

    const question = await waitFor(() => within(document.body).getByRole("alertdialog"));
    await settle(question);
    expect(within(question).getByText("Discard your changes?")).toBeVisible();
    expect(dialogElement()).not.toBeNull();
  },
};

/** With nothing unsaved, the guard is not in the way — Escape closes as it always did. */
export const NothingUnsavedClosesStraightAway: Story = {
  args: { ...UnsavedChangesAskFirst.args, hasUnsavedChanges: false },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(dialogElement()).toBeNull();
    });
    expect(within(document.body).queryByRole("alertdialog")).toBeNull();
  },
};

/** The copy is defaulted, not fixed — a dialog that knows what is lost can say so. */
export const TheQuestionCanBeReworded: Story = {
  args: {
    ...UnsavedChangesAskFirst.args,
    discardTitle: "Leave without publishing?",
    discardDescription: "The draft and its three attachments are not saved anywhere yet.",
    discardLabel: "Leave",
    keepLabel: "Go back",
  },
  play: async ({ canvasElement }) => {
    const { question } = await askToClose(canvasElement);

    expect(within(question).getByText("Leave without publishing?")).toBeVisible();
    expect(within(question).getByRole("button", { name: "Go back" })).toBeVisible();
  },
};

/**
 * The fourth door, and the one people actually click.
 *
 * `hasUnsavedChanges` covers Escape, the overlay and the close button, because all three go
 * through Radix's `onOpenChange` and the shell owns that. A Cancel in `footerActions` does not:
 * it calls the caller's own `setOpen(false)` and never touches the shell, so the guard the
 * feature was built for closes three doors out of four.
 *
 * The function form of `footerActions` hands back the shell's own close — the same one the other
 * three go through — so wiring Cancel to it guards Cancel too.
 */
export const ACancelFromTheFooterIsGuardedToo: Story = {
  args: {
    ...UnsavedChangesAskFirst.args,
    footerActions: (close) => (
      <>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button>Save</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    const question = await waitFor(() => within(document.body).getByRole("alertdialog"));
    await settle(question);
    expect(within(question).getByText("Discard your changes?")).toBeVisible();
    // Still open behind the question, with what was typed still in it.
    expect(dialogElement()).not.toBeNull();
  },
};

/** And discarding from there closes both, the same as discarding from any other door. */
export const DiscardingFromCancelClosesIt: Story = {
  args: { ...ACancelFromTheFooterIsGuardedToo.args },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    const question = await waitFor(() => within(document.body).getByRole("alertdialog"));
    await userEvent.click(within(question).getByRole("button", { name: "Discard" }));

    await waitFor(() => {
      expect(dialogElement()).toBeNull();
    });
  },
};

/** With nothing unsaved it is a plain close, and no question is asked on the way. */
export const CancelWithNothingUnsavedJustCloses: Story = {
  args: { ...ACancelFromTheFooterIsGuardedToo.args, hasUnsavedChanges: false },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(dialogElement()).toBeNull();
    });
    expect(within(document.body).queryByRole("alertdialog")).toBeNull();
  },
};

/**
 * The prop is still a node, which is what every call site that does not need the close keeps
 * passing — and a function that returns nothing leaves no empty footer behind.
 */
export const AFooterThatRendersNothingIsNoFooter: Story = {
  args: { ...UnsavedChangesAskFirst.args, hasUnsavedChanges: false, footerActions: () => null },
  play: async ({ canvasElement }) => {
    const dialog = await openIt(canvasElement);
    expect(dialog.querySelector("[data-slot=dialog-footer]")).toBeNull();
  },
};
