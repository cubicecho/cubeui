import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { DialogLayout } from "@/components/dialog-layout";
import { Button } from "@/components/ui/button";

/**
 * The first story under `stories/web/`, which exists because of what this file imports.
 *
 * `DialogLayout` is a web-only item and reaches `@/components/ui/alert-dialog` — one of the five
 * upstream shadcn primitives this registry does not ship and only vendors for the typechecker. The
 * rest of `stories/` belongs to the native tsconfig project, where that specifier resolves to
 * nothing; this directory belongs to `tsconfig.web.json`, where it resolves to `vendor/shadcn/`
 * exactly as a DOM consumer's own tree would. Storybook's glob already reaches in here, and the
 * vite config already loads the web project's aliases.
 */

/**
 * A dialog whose unsaved work is not in React state.
 *
 * `edits` is a ref, which is the case the function form of `hasUnsavedChanges` is for: the fact is
 * knowable at the click and there is nothing on screen that changes when it flips, so a boolean
 * would mean lifting it into state and re-rendering the dialog to maintain a value only the close
 * handler reads. `asked` counts how many times the prop was consulted, so a story can assert the
 * thunk is not called during a render.
 */
function Harness({
  unsaved = true,
  asFunction = true,
}: {
  unsaved?: boolean;
  asFunction?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [renders, setRenders] = useState(0);
  // A state counter and not a ref, so the number on screen is the current one. Incrementing state
  // from inside the thunk is safe precisely because of what is being asserted: the thunk runs in a
  // click handler and never in a render, so there is no loop to cause.
  const [asked, setAsked] = useState(0);

  const answer = () => {
    setAsked((n) => n + 1);
    return unsaved;
  };

  return (
    <div>
      <DialogLayout
        open={open}
        onOpenChange={setOpen}
        title="Edit card"
        content={
          <div>
            <p>Body</p>
            {/* A render the story can force, to prove the thunk is not consulted by one. */}
            <Button onClick={() => setRenders((n) => n + 1)}>Re-render</Button>
            <p data-testid="renders">{renders}</p>
          </div>
        }
        footerActions={(close) => (
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
        )}
        hasUnsavedChanges={asFunction ? answer : unsaved}
      />
      <p data-testid="open">{open ? "open" : "closed"}</p>
      <p data-testid="asked">{asked}</p>
    </div>
  );
}

const meta = {
  title: "Layout/DialogLayout",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The question, and the dialog still there behind it. */
const discardIsUp = async () => {
  await waitFor(() => {
    expect(screen.getByRole("alertdialog", { name: /discard/i })).toBeInTheDocument();
  });
};

/** Answer "keep editing", so the next door can be tried on the same dialog. */
const keepEditing = async () => {
  await userEvent.click(await screen.findByRole("button", { name: "Keep editing" }));
  await waitFor(() => {
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
};

/**
 * All four doors ask, and the answer comes from a function.
 *
 * The four are Escape, a click on the overlay, the close button, and the `footerActions` Cancel —
 * the fourth being the one people actually click, and the one a Cancel wired to the caller's own
 * `setOpen(false)` goes around entirely.
 */
export const AThunkHoldsAllFourDoors: Story = {
  args: { unsaved: true },
  play: async ({ canvas }) => {
    const dialog = await screen.findByRole("dialog", { name: "Edit card" });

    await userEvent.keyboard("{Escape}");
    await discardIsUp();
    await keepEditing();
    expect(canvas.getByTestId("open")).toHaveTextContent("open");

    await userEvent.click(within(dialog).getByRole("button", { name: /close/i }));
    await discardIsUp();
    await keepEditing();
    expect(canvas.getByTestId("open")).toHaveTextContent("open");

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await discardIsUp();
    await keepEditing();
    expect(canvas.getByTestId("open")).toHaveTextContent("open");

    // The overlay, which is the one door with no role and no name to query by: it is a bare
    // `<div>` and radix gives it only a `data-state`. It is drawn immediately before the content
    // in the portal, and a pointer-down on it is what the dismissable layer reads as an outside
    // interaction.
    const overlay = dialog.previousElementSibling;
    expect(overlay).not.toBeNull();
    await userEvent.click(overlay as Element);
    await discardIsUp();

    // And discarding actually leaves.
    await userEvent.click(await screen.findByRole("button", { name: "Discard" }));
    await waitFor(() => {
      expect(canvas.getByTestId("open")).toHaveTextContent("closed");
    });
  },
};

/**
 * The reason it is a function: it runs at the click and not in render.
 *
 * A boolean would have the caller maintain a value in render that only the close handler reads.
 * This asserts the shell does not consult the thunk on mount or on a re-render — so a caller can
 * read a store, or ask a child, without subscribing to either.
 */
export const TheThunkIsNotCalledOnRender: Story = {
  args: { unsaved: true },
  play: async ({ canvas }) => {
    expect(canvas.getByTestId("asked")).toHaveTextContent("0");

    // `screen` and not `canvas`: the body is inside the dialog, and the dialog is portalled out
    // of the story's own root.
    await userEvent.click(await screen.findByRole("button", { name: "Re-render" }));
    await waitFor(() => {
      expect(screen.getByTestId("renders")).toHaveTextContent("1");
    });
    expect(canvas.getByTestId("asked")).toHaveTextContent("0");

    await userEvent.keyboard("{Escape}");
    await discardIsUp();
    await keepEditing();

    // The close path asked, and it asked once.
    expect(canvas.getByTestId("asked")).toHaveTextContent("1");
  },
};

/** A thunk returning `false` is the same path as `false` and `undefined`: nothing asks. */
export const AThunkReturningFalseClosesStraightAway: Story = {
  args: { unsaved: false },
  play: async ({ canvas }) => {
    await screen.findByRole("dialog", { name: "Edit card" });
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(canvas.getByTestId("open")).toHaveTextContent("closed");
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  },
};

/** And the boolean form still works, unchanged, which is what makes this backwards compatible. */
export const TheBooleanFormStillAsks: Story = {
  args: { unsaved: true, asFunction: false },
  play: async ({ canvas }) => {
    await screen.findByRole("dialog", { name: "Edit card" });
    await userEvent.keyboard("{Escape}");
    await discardIsUp();
    expect(canvas.getByTestId("open")).toHaveTextContent("open");
    await keepEditing();
  },
};
