import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Trash2 } from "lucide-react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { ActionButton } from "@/registry/new-york/control/action-button";
import { TooltipProvider } from "@/registry/new-york/ui/tooltip";

const meta = {
  title: "Control/ActionButton",
  component: ActionButton,
  args: {
    label: "Edit workspace",
    variant: "ghost",
    size: "icon",
    children: <Pencil />,
    onClick: fn(),
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The reason the component exists: an icon button whose only child is an SVG announces as
 * "button" without this. 78 of the 134 icon buttons across these projects do exactly that.
 */
export const ItHasAName: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Edit workspace" })).toBeVisible();
  },
};

/**
 * The one that is not obvious. `disabled` would set `pointer-events-none` and take the button
 * out of the tab order, so the tooltip saying *why* it is unavailable is the one thing nobody
 * can reach. `aria-disabled` keeps the control reachable and refuses the press in the handler.
 */
export const DisabledButStillReadable: Story = {
  args: { disabled: true, hint: "Empty the lane first" },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not the real attribute — that is what would mute it.
    expect(button).not.toBeDisabled();
    expect(button).toBeEnabled();

    // Reachable by keyboard, which a `disabled` button is not.
    button.focus();
    expect(button).toHaveFocus();

    // And it still refuses.
    let pressed = false;
    const onClick = () => {
      pressed = true;
    };
    button.addEventListener("click", onClick);
    await userEvent.click(button);
    button.removeEventListener("click", onClick);
    expect(pressed).toBe(true); // the DOM event fires — the *handler* is what declines
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** `hint` is what the tooltip says when there is more to say than the name. */
export const HintReplacesTheLabelInTheTooltip: Story = {
  args: { hint: "Rename this workspace and every alias pointing at it" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });
    await userEvent.hover(button);
    const tip = await within(document.body).findByRole("tooltip");
    expect(tip).toHaveTextContent("Rename this workspace and every alias pointing at it");
  },
};

/**
 * It renders its own `TooltipProvider`. shadcn's `Tooltip` throws without one, and a registry
 * component cannot assume the app it lands in has put one at the root — this story is that
 * assumption being absent.
 */
export const WorksWithNoProviderAbove: Story = {
  args: { label: "Delete workspace", variant: "ghost", size: "icon", children: <Trash2 /> },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Delete workspace" });
    await userEvent.hover(button);
    expect(await within(document.body).findByRole("tooltip")).toHaveTextContent("Delete workspace");
  },
};

/** Off, it is a named button and nothing else — for a row that already explains itself. */
export const WithoutTooltip: Story = {
  args: { tooltip: false, children: <Pencil />, label: "Edit workspace" },
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Edit workspace" })).toBeVisible();
    expect(within(document.body).queryByRole("tooltip")).toBeNull();
  },
};

/**
 * The bug this component had until it was surveyed against the other apps.
 *
 * A tooltip's text is in the DOM only while it is open, so a `hint` living only there is
 * readable by sight and by nothing else — the button announced "Empty the lane first" to a
 * mouse and "Edit workspace" to a screen reader. The hint is now also an always-mounted
 * `sr-only` span the button is described by, with no hover, focus or open state involved.
 */
export const TheHintIsReadableWithoutHovering: Story = {
  args: { disabled: true, hint: "Empty the lane first" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });

    // Nothing has been hovered or focused: the tooltip has never opened.
    expect(canvas.queryByRole("tooltip")).toBeNull();

    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    // `getByRole` will not find an `sr-only` node, and `getByText` skips it as not visible —
    // the point of the span is that it is in the accessibility tree and not the visual one.
    const description = document.getElementById(describedBy as string);
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent("Empty the lane first");
  },
};

/**
 * Opening the tooltip must not make the hint arrive twice. Radix points the trigger at its own
 * content while open, but `Slot` lets the child's props win, so the button keeps describing
 * itself with the span — one association, the same words, open or closed.
 */
export const OpeningTheTooltipDoesNotDoubleTheDescription: Story = {
  args: { hint: "Renames every alias pointing at it" },
  play: async ({ canvas, step }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });
    const closed = button.getAttribute("aria-describedby");

    await step("hover to open the tooltip", async () => {
      await userEvent.hover(button);
      // Portaled to the body, so it is out of the story canvas entirely. `findByRole` waits for
      // the node but not for `zoom-in-95` to finish, so visibility needs its own wait.
      const tooltip = await screen.findByRole("tooltip");
      await waitFor(() => expect(tooltip).toBeVisible());
    });

    // One id, not two, and the same one it had before the tooltip existed.
    expect(button.getAttribute("aria-describedby")).toBe(closed);
    expect(closed?.split(" ")).toHaveLength(1);
  },
};

/** A caller's own `aria-describedby` is kept, not overwritten by the hint's. */
export const ItKeepsACallersDescription: Story = {
  args: { hint: "Empty the lane first", "aria-describedby": "outside-note" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });
    const ids = button.getAttribute("aria-describedby")?.split(" ") ?? [];

    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe("outside-note");
    expect(document.getElementById(ids[1] as string)).toHaveTextContent("Empty the lane first");
  },
};

/**
 * With no hint the tooltip only repeats the name, so there is nothing to describe the button
 * with — pointing at it would have a screen reader read "Edit workspace, Edit workspace".
 */
export const NoHintMeansNoDescription: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Edit workspace" })).not.toHaveAttribute(
      "aria-describedby",
    );
  },
};

/** `tooltip={false}` drops the tooltip, not the explanation. */
export const WithoutTooltipTheHintSurvives: Story = {
  args: { tooltip: false, hint: "Empty the lane first", disabled: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });
    const describedBy = button.getAttribute("aria-describedby");

    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "Empty the lane first",
    );
  },
};

/**
 * The delay can be matched to the app's, because the button renders its own provider and a
 * nested provider *replaces* the one above it rather than merging with it.
 *
 * Without the prop there is no way to say this: `delayDuration` would fall into `...props`,
 * reach the `Button`, and arrive at the DOM as an unknown attribute React warns about — a
 * workaround that silently did nothing.
 */
export const TheDelayCanMatchTheApp: Story = {
  args: { label: "Delete workspace", children: <Trash2 />, delayDuration: 600 },
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Delete workspace" }));

    // Still shut immediately after the pointer arrives — which is the whole assertion, since
    // shadcn's provider default is `0` and this would otherwise already be open.
    expect(screen.queryByRole("tooltip")).toBeNull();

    await waitFor(() => expect(screen.getByRole("tooltip")).toBeVisible(), { timeout: 3000 });
  },
};

/**
 * And the limitation the prop exists for, pinned so it cannot be mistaken for a fix.
 *
 * A root provider does **not** reach these buttons. Radix exposes no way to ask whether a
 * provider is already above you, so the button can neither skip rendering its own nor read what
 * the outer one was set to — it takes shadcn's `0` and opens at once while every other control
 * under the same root waits. Saying the number twice is the only remedy there is.
 */
export const ARootProviderDoesNotReachIt: Story = {
  args: { label: "Delete workspace", children: <Trash2 /> },
  render: (args) => (
    <TooltipProvider delayDuration={3000}>
      <ActionButton {...args} />
    </TooltipProvider>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Delete workspace" }));

    // Open well inside the root's 3s, because the root's 3s never applied to it.
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeVisible(), { timeout: 400 });
  },
};

/**
 * Where these actually live: a row of icon buttons inside a real form, beside the fields they
 * act on. task_server's trigger editor is exactly this shape.
 */
function InAForm({
  onSubmit,
  ...props
}: React.ComponentProps<typeof ActionButton> & { onSubmit?: () => void }) {
  return (
    <form
      className="grid w-80 gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <label htmlFor="cron">Schedule</label>
      <input id="cron" defaultValue="0 9 * * 1" className="border px-2 py-1" />
      <div className="flex gap-2">
        <ActionButton {...props} />
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

/**
 * A `<button>` with no `type` is a submit button, so an untyped `ActionButton` inside a form both
 * does its own job and submits — the trash icon removes the row *and* saves the form, and nothing
 * at the call site says so.
 */
export const ItDoesNotSubmitTheFormAroundIt: Story = {
  args: { label: "Remove this schedule", children: <Trash2 />, onSubmit: fn() },
  render: ({ onSubmit, ...args }) => <InAForm {...args} onSubmit={onSubmit as () => void} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove this schedule" }));

    expect(args.onClick).toHaveBeenCalledOnce();
    expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/**
 * And the half that no `onClick` guard could have covered. Enter in a text field submits through
 * the **first submit button in tree order** — which, untyped, was the trash icon, so a stray
 * Enter in the cron box deleted the schedule. Implicit submission never goes through a click, so
 * the `disabled` handler that refuses the press did not stand in its way either.
 */
export const AStrayEnterDoesNotPressIt: Story = {
  args: { label: "Remove this schedule", children: <Trash2 />, disabled: true, onSubmit: fn() },
  render: ({ onSubmit, ...args }) => <InAForm {...args} onSubmit={onSubmit as () => void} />,
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText("Schedule"), "{Enter}");

    // The form still saves — through Save, which is what the person meant.
    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalledOnce();
    });
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** A caller who wants one of these to submit can still say so, and now has to. */
export const ACallerCanStillMakeItSubmit: Story = {
  args: { label: "Save the schedule", type: "submit", children: <Pencil />, onSubmit: fn() },
  render: ({ onSubmit, ...args }) => <InAForm {...args} onSubmit={onSubmit as () => void} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save the schedule" }));

    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalledOnce();
    });
  },
};
