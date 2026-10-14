import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Trash2 } from "lucide-react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { Button, type ButtonProps } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * `Button` as an icon button: the name it must be given, and the `hint` that is its tooltip —
 * including why it is unavailable. `stories/web/published/` holds the
 * text button; these are the parts that came over from the icon-button component `Button`
 * replaced.
 */
const meta = {
  title: "Controls/Button/Icon, hint and tooltip",
  component: Subject,
  args: {
    "aria-label": "Edit workspace",
    variant: "outline",
    size: "icon",
    iconSlot: <Pencil />,
    onClick: fn(),
  },
} satisfies Meta<typeof Subject>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The args are an icon button's by default, and a story may still make it a text button. */
type SubjectProps = Omit<ButtonProps, "size" | "aria-label"> & {
  size?: ButtonProps["size"];
  "aria-label"?: string | undefined;
};

function Subject(props: SubjectProps) {
  return <Button {...(props as ButtonProps)} />;
}

/** It is still a button: one press, one `onClick`. */
export const Default: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Edit workspace" }));
    expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/**
 * Why an `icon*` size will not typecheck without `aria-label`: an icon button whose only child
 * is an SVG announces as "button" and nothing else.
 */
export const ItHasAName: Story = {
  play: async ({ canvas }) => {
    expect(canvas.getByRole("button", { name: "Edit workspace" })).toBeVisible();
  },
};

/**
 * A tooltip is only ever a `hint`. The name is not shown as one by default: a button that wants
 * its name on hover says so, and the rest stay as quiet as a text button.
 */
export const NoHintMeansNoTooltip: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });
    expect(button).not.toHaveAttribute("data-slot", "tooltip-trigger");

    await userEvent.hover(button);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.queryByRole("tooltip")).toBeNull();
  },
};

/**
 * The one that is not obvious. `disabled` would set `pointer-events-none` and take the button
 * out of the tab order, so the tooltip saying *why* it is unavailable is the one thing nobody
 * can reach. With a `hint`, `aria-disabled` keeps the control reachable and the press is refused
 * in the handler.
 */
export const DisabledButStillReadable: Story = {
  args: { disabled: true, hint: "Empty the lane first" },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not the real attribute — that is what would mute it.
    expect(button).not.toHaveAttribute("disabled");

    // Reachable by keyboard, which a `disabled` button is not.
    button.focus();
    expect(button).toHaveFocus();

    // And it still refuses.
    await userEvent.click(button);
    expect(args.onClick).not.toHaveBeenCalled();

    await userEvent.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Empty the lane first");
  },
};

/**
 * With no reason to give there is nothing to keep reachable, so `disabled` is the real
 * attribute, as it is on every other button.
 */
export const DisabledWithNoHintIsReallyDisabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });

    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** `hint` is what the tooltip says; the name stays the name. */
export const TheHintIsTheTooltip: Story = {
  args: { hint: "Rename this workspace and every alias pointing at it" },
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Edit workspace" }));
    const tip = await within(document.body).findByRole("tooltip");
    expect(tip).toHaveTextContent("Rename this workspace and every alias pointing at it");
  },
};

/** A text button with a `hint` gets the tooltip too; the label stays its name. */
export const ATextButtonCanHaveAHint: Story = {
  args: {
    size: "default",
    "aria-label": undefined,
    iconSlot: undefined,
    content: "Publish",
    disabled: true,
    hint: "Nothing has changed since the last publish",
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Publish" });
    expect(button).toHaveAttribute("aria-disabled", "true");

    await userEvent.hover(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Nothing has changed since the last publish",
    );
  },
};

/**
 * shadcn's `Tooltip` throws without a `TooltipProvider`, and a registry component cannot assume
 * the app it lands in has put one at the root — this story is that assumption being absent.
 */
export const WorksWithNoProviderAbove: Story = {
  args: { "aria-label": "Delete workspace", hint: "Deletes its lanes too", iconSlot: <Trash2 /> },
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Delete workspace" }));
    expect(await within(document.body).findByRole("tooltip")).toHaveTextContent(
      "Deletes its lanes too",
    );
  },
};

/**
 * And with one above, it is that provider's: the delay an app sets once at its root is the delay
 * every button's hint opens after, with nothing said twice.
 */
export const ARootProviderSetsTheDelay: Story = {
  args: { "aria-label": "Delete workspace", hint: "Deletes its lanes too", iconSlot: <Trash2 /> },
  render: (args) => (
    <TooltipProvider delayDuration={600}>
      <Subject {...args} />
    </TooltipProvider>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Delete workspace" }));

    // Still shut straight after the pointer arrives, which with no provider it would not be.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.queryByRole("tooltip")).toBeNull();

    await waitFor(() => expect(screen.getByRole("tooltip")).toBeVisible(), { timeout: 3000 });
  },
};

/** Off, the hint is still read and is no longer shown — for a row that already explains itself. */
export const WithoutTooltip: Story = {
  args: { tooltip: false, hint: "Renames every alias pointing at it" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Edit workspace" });

    await userEvent.hover(button);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(within(document.body).queryByRole("tooltip")).toBeNull();
  },
};

/**
 * A tooltip's text is in the DOM only while it is open, so a `hint` living only there is
 * readable by sight and by nothing else. The hint is also an always-mounted `sr-only` node the
 * button is described by, with no hover, focus or open state involved.
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
    // the point of the node is that it is in the accessibility tree and not the visual one.
    const description = document.getElementById(describedBy as string);
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent("Empty the lane first");
  },
};

/**
 * Opening the tooltip must not make the hint arrive twice. Radix points the trigger at its own
 * content while open, but `Slot` lets the child's props win, so the button keeps describing
 * itself with the hidden node — one association, the same words, open or closed.
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

/** With no hint there is nothing to describe the button with, so it points at nothing. */
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

/** Where icon buttons live: a row of them inside a real form, beside the fields they act on. */
function InAForm({ onSubmit, ...props }: SubjectProps & { onSubmit?: () => void }) {
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
        <Subject {...props} />
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

type FormStory = StoryObj<Meta<typeof InAForm>>;

/**
 * A `<button>` with no `type` is a submit button, so an untyped icon button inside a form would
 * both do its own job and submit — the trash icon removes the row *and* saves the form, and
 * nothing at the call site says so.
 */
export const ItDoesNotSubmitTheFormAroundIt: FormStory = {
  args: { "aria-label": "Remove this schedule", iconSlot: <Trash2 />, onSubmit: fn() },
  render: (args) => <InAForm {...args} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove this schedule" }));

    expect(args.onClick).toHaveBeenCalledOnce();
    expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/**
 * And the half that no `onClick` guard could have covered. Enter in a text field submits through
 * the **first submit button in tree order** — which, untyped, would be the trash icon, so a stray
 * Enter in the cron box would delete the schedule. Implicit submission never goes through a
 * click, so the handler that refuses a soft-disabled press would not stand in its way either.
 */
export const AStrayEnterDoesNotPressIt: FormStory = {
  args: {
    "aria-label": "Remove this schedule",
    iconSlot: <Trash2 />,
    disabled: true,
    hint: "The last schedule cannot be removed",
    onSubmit: fn(),
  },
  render: (args) => <InAForm {...args} />,
  play: async ({ canvas, args }) => {
    await userEvent.type(canvas.getByLabelText("Schedule"), "{Enter}");

    // The form still saves — through Save, which is what the person meant.
    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalledOnce();
    });
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** A caller who wants one of these to submit can still say so, and has to. */
export const ACallerCanStillMakeItSubmit: FormStory = {
  args: {
    "aria-label": "Save the schedule",
    type: "submit",
    iconSlot: <Pencil />,
    onSubmit: fn(),
  },
  render: (args) => <InAForm {...args} />,
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save the schedule" }));

    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalledOnce();
    });
  },
};
