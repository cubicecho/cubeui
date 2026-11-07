import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { CardLayout } from "@/components/card-layout";
import { DialogLayout } from "@/components/dialog-layout";
import { Badge } from "@/components/ui/badge";
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
        contentSlot={
          <div>
            <p>Body</p>
            {/* A render the story can force, to prove the thunk is not consulted by one. */}
            <Button onClick={() => setRenders((n) => n + 1)} content="Re-render" />
            <p data-testid="renders">{renders}</p>
          </div>
        }
        footerActionsSlot={(close) => <Button variant="outline" onClick={close} content="Cancel" />}
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
 * The four are Escape, a click on the overlay, the close button, and the `footerActionsSlot` Cancel
 * — the fourth being the one people actually click, and the one a Cancel wired to the caller's own
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

const actionLabels = ["Copy MCP config", "Rename", "Delete"] as const;

/**
 * Three `footerActionsSlot` in a 320px dialog (#159). The row wraps rather than running its first
 * button out past the dialog's left edge, and the wrapped line stays against the right edge. The
 * same row as `CardLayout`'s, whose story holds the native half; this one holds the dialog's.
 */
export const NarrowFooterActionsWrap: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Journal"
      className="sm:max-w-[320px]"
      contentSlot={<p>Notes kept by the agent.</p>}
      footerActionsSlot={actionLabels.map((label) => (
        <Button key={label} variant="outline" size="sm" content={label} />
      ))}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Journal" });
    const box = dialog.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(320);
    const buttons = actionLabels.map((name) =>
      within(dialog).getByRole("button", { name }).getBoundingClientRect(),
    );
    const [first, , last] = buttons;
    if (!first || !last) {
      throw new Error("expected three buttons");
    }
    await expect({
      inside: buttons.every((b) => b.left >= box.left && b.right <= box.right),
      wrapped: last.top >= first.bottom,
      endAligned: box.right - last.right < box.width / 4,
    }).toEqual({ inside: true, wrapped: true, endAligned: true });
  },
};

/**
 * Two elements in `footerSlot` beside `footerActionsSlot`, on a screen past `sm`, where the footer
 * is `justify-between`. The shell groups them at the start, `gap-2` apart — the row `CardLayout`
 * draws — rather than letting the footer spread the second one to its middle.
 */
export const GroupedFooterStart: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Project settings"
      contentSlot={<p>Names, owners and the rest.</p>}
      footerSlot={
        <>
          <span className="text-foreground/60 text-sm">Synced an hour ago</span>
          <Button variant="destructive-outline" size="sm" content="Archive" />
        </>
      }
      footerActionsSlot={<Button size="sm" variant="positive" content="Save" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Project settings" });
    const note = within(dialog).getByText("Synced an hour ago").getBoundingClientRect();
    const archive = within(dialog).getByRole("button", { name: "Archive" }).getBoundingClientRect();
    const save = within(dialog).getByRole("button", { name: "Save" }).getBoundingClientRect();
    await expect({
      sameRow: Math.abs(note.top + note.height / 2 - (archive.top + archive.height / 2)) < 2,
      gap: Math.round(archive.left - note.right),
      split: save.left - archive.right > 8,
    }).toEqual({ sameRow: true, gap: 8, split: true });
  },
};

/**
 * Waits out the open animation, which scales and slides the dialog while it runs. A looping one —
 * a skeleton's pulse — never finishes, so only those that end are waited for.
 */
async function settled(dialog: HTMLElement) {
  const ending = dialog
    .getAnimations({ subtree: true })
    .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
  await Promise.all(ending.map((animation) => animation.finished));
}

/**
 * The parts, where they stand: the title names the dialog and the description is under it, the
 * header is above the body and the body above the footer, and the title stops short of the close
 * button rather than running under it.
 */
export const PartsInTheirPlaces: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="A title long enough to reach the corner the close button sits in"
      description="What the dialog is for."
      contentSlot={<p>The body.</p>}
      footerActionsSlot={<Button variant="positive" content="Save" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", {
      name: "A title long enough to reach the corner the close button sits in",
    });
    await settled(dialog);
    const title = within(dialog)
      .getByText(/^A title long enough/)
      .getBoundingClientRect();
    const description = within(dialog).getByText("What the dialog is for.").getBoundingClientRect();
    const body = within(dialog).getByText("The body.").getBoundingClientRect();
    const save = within(dialog).getByRole("button", { name: "Save" }).getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: /close/i }).getBoundingClientRect();
    await expect({
      descriptionUnderTitle: description.top >= title.bottom,
      bodyUnderHeader: body.top >= description.bottom,
      footerUnderBody: save.top >= body.bottom,
      clearOfClose: title.right <= close.left,
    }).toEqual({
      descriptionUnderTitle: true,
      bodyUnderHeader: true,
      footerUnderBody: true,
      clearOfClose: true,
    });
  },
};

/**
 * The description describes the dialog, through radix's own link to it, so a screen reader reads
 * it after the name on opening.
 */
export const TheDescriptionDescribesIt: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Described"
      description="What the dialog is for."
      contentSlot={<p>The body.</p>}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Described" });
    await expect(dialog).toHaveAccessibleDescription("What the dialog is for.");
  },
};

/** With no description, nothing describes the dialog, and radix is told so rather than warning. */
export const NoDescriptionDescribesNothing: Story = {
  args: { unsaved: false },
  render: () => <DialogLayout open title="Undescribed" contentSlot={<p>The body.</p>} />,
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Undescribed" });
    await expect(dialog).not.toHaveAttribute("aria-describedby");
  },
};

/** `hideTitle` takes the title off the screen and leaves it naming the dialog. */
export const AHiddenTitleStillNamesIt: Story = {
  args: { unsaved: false },
  render: () => <DialogLayout open hideTitle title="Pick a colour" contentSlot={<p>Swatches</p>} />,
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Pick a colour" });
    const title = within(dialog).getByText("Pick a colour").getBoundingClientRect();
    await expect(title.width * title.height).toBeLessThanOrEqual(1);
  },
};

const rows = Array.from({ length: 60 }, (_, index) => `Row ${index + 1}`);

/** Every element in the dialog, the dialog included, that scrolls its own content. */
function scrollersIn(dialog: HTMLElement) {
  return [dialog, ...dialog.querySelectorAll<HTMLElement>("*")].filter((element) => {
    const { overflowY } = getComputedStyle(element);
    const scrolls = overflowY === "auto" || overflowY === "scroll";
    return scrolls && element.scrollHeight > element.clientHeight + 1;
  });
}

/**
 * A body taller than the screen. The dialog stays inside the viewport, the body is the one part
 * that scrolls, and the title and the footer stay where they are while it does.
 */
export const OnlyTheBodyScrolls: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Long list"
      contentSlot={
        <ul>
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      }
      footerActionsSlot={<Button variant="positive" content="Save" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Long list" });
    await settled(dialog);
    const scrollers = scrollersIn(dialog);
    const [body] = scrollers;
    if (scrollers.length !== 1 || !body) {
      throw new Error(`expected one scrolling part, found ${scrollers.length}`);
    }
    const title = within(dialog).getByText("Long list");
    const save = within(dialog).getByRole("button", { name: "Save" });
    const titleTop = title.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
    await expect({
      fitsTheViewport: dialog.getBoundingClientRect().bottom <= window.innerHeight,
      bodyHoldsTheRows: body.contains(within(dialog).getByText("Row 1")),
      titleOutside: body.contains(title),
      saveOutside: body.contains(save),
      titleStayed: title.getBoundingClientRect().top === titleTop,
      saveOnScreen: save.getBoundingClientRect().bottom <= window.innerHeight,
    }).toEqual({
      fitsTheViewport: true,
      bodyHoldsTheRows: true,
      titleOutside: false,
      saveOutside: false,
      titleStayed: true,
      saveOnScreen: true,
    });
  },
};

/**
 * Below `sm` the footer stacks: the actions over the start group, and the start group's elements
 * one over another. Past `sm` the same footer is one row, which `GroupedFooterStart` holds.
 */
export const TheFooterStacksOnAPhone: Story = {
  args: { unsaved: false },
  globals: { viewport: { value: "mobile2", isRotated: false } },
  render: () => (
    <DialogLayout
      open
      title="Project settings"
      contentSlot={<p>Names, owners and the rest.</p>}
      footerSlot={
        <>
          <span className="text-foreground/60 text-sm">Synced an hour ago</span>
          <Button variant="destructive-outline" size="sm" content="Archive" />
        </>
      }
      footerActionsSlot={<Button size="sm" variant="positive" content="Save" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Project settings" });
    await settled(dialog);
    const note = within(dialog).getByText("Synced an hour ago").getBoundingClientRect();
    const archive = within(dialog).getByRole("button", { name: "Archive" }).getBoundingClientRect();
    const save = within(dialog).getByRole("button", { name: "Save" }).getBoundingClientRect();
    await expect({
      actionsOnTop: save.bottom <= Math.min(note.top, archive.top),
      startStacked: archive.bottom <= note.top || note.bottom <= archive.top,
    }).toEqual({ actionsOnTop: true, startStacked: true });
  },
};

/**
 * A dialog is a `CardLayout` on the dialog's panel, so it takes the card's icon and header action:
 * the icon before the title, the action at the header's far end and clear of the close button.
 */
export const IconAndHeaderAction: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="New label"
      iconSlot={<Plus />}
      actionSlot={<Badge variant="info">Draft</Badge>}
      contentSlot={<p>Labels group the cards on a board.</p>}
      footerActionsSlot={<Button variant="info" content="Create" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "New label" });
    await settled(dialog);
    const title = within(dialog).getByText("New label").getBoundingClientRect();
    const icon = dialog.querySelector("svg.lucide-plus")?.getBoundingClientRect();
    const badge = within(dialog).getByText("Draft").getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: /close/i }).getBoundingClientRect();
    if (icon === undefined) {
      throw new Error("expected the icon");
    }
    await expect({
      iconBeforeTitle: icon.right <= title.left,
      actionAfterTitle: badge.left >= title.right,
      actionClearOfClose: badge.right <= close.left,
    }).toEqual({ iconBeforeTitle: true, actionAfterTitle: true, actionClearOfClose: true });
  },
};

/**
 * `actionPlacement="inline"` on a dialog (#416): a title too long for a small dialog keeps the
 * badge on its line and is cut short instead, and the badge stays clear of the close button.
 */
export const InlineActionTruncatesTheTitle: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      size="sm"
      title="skills/ticket-workflow/references/checkpoint-template.md"
      actionSlot={<Badge variant="info">Draft</Badge>}
      actionPlacement="inline"
      contentSlot={<p>The file's contents.</p>}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: /checkpoint-template/ });
    await settled(dialog);
    const heading = within(dialog).getByRole("heading", { name: /checkpoint-template/ });
    const title = heading.getBoundingClientRect();
    const badge = within(dialog).getByText("Draft").getBoundingClientRect();
    const close = within(dialog).getByRole("button", { name: /close/i }).getBoundingClientRect();
    await expect({
      onTheTitlesLine: badge.top < title.bottom && title.top < badge.bottom,
      afterTitle: badge.left >= title.right,
      clearOfClose: badge.right <= close.left,
      truncated: heading.scrollWidth > heading.clientWidth,
    }).toEqual({ onTheTitlesLine: true, afterTitle: true, clearOfClose: true, truncated: true });
  },
};

/** `loading` stands a skeleton in for the body, and keeps the title and the footer. */
export const Loading: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      loading
      title="Members"
      contentSlot={<p>Ada, Grace and Edsger.</p>}
      emptySlot={<p>No members yet.</p>}
      footerActionsSlot={<Button variant="positive" content="Save" />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Members" });
    await settled(dialog);
    await expect(dialog.querySelector("[data-slot=card-layout-skeleton]")).not.toBeNull();
    await expect(within(dialog).queryByText("Ada, Grace and Edsger.")).toBeNull();
    await expect(within(dialog).queryByText("No members yet.")).toBeNull();
    await expect(within(dialog).getByRole("button", { name: "Save" })).toBeVisible();
  },
};

const NO_MEMBERS: string[] = [];

/** `emptySlot` is what an empty body says, by the card's rule: here an empty `map`. */
export const Empty: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Members"
      contentSlot={NO_MEMBERS.map((name) => <p key={name}>{name}</p>)}
      emptySlot={<p>No members yet.</p>}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Members" });
    await settled(dialog);
    await expect(within(dialog).getByText("No members yet.")).toBeVisible();
  },
};

/**
 * Only the dialog's own card is drawn on the panel. A `CardLayout` in the body is a card again:
 * its own surface, and a `CardTitle` heading rather than a second title naming the dialog.
 */
export const ACardInTheBodyIsACard: Story = {
  args: { unsaved: false },
  render: () => (
    <DialogLayout
      open
      title="Invite"
      contentSlot={<CardLayout title="Pending" contentSlot={<p>Two invitations.</p>} />}
    />
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Invite" });
    await settled(dialog);
    const cards = dialog.querySelectorAll("[data-slot=card-layout]");
    await expect(cards).toHaveLength(1);
    await expect(within(dialog).getByRole("heading", { level: 3, name: "Pending" })).toBeVisible();
    await expect(within(dialog).getAllByRole("heading", { level: 2 })).toHaveLength(1);
  },
};
