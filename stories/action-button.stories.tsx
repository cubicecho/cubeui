import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Trash2 } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";
import { ActionButton } from "@/registry/new-york/control/action-button";

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
