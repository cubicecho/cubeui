import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Badge } from "@/components/ui/badge";

/**
 * `Badge`, as installed beside it by `@cubeui/badge-stories`. Same rules as the button's: nothing
 * here asserts a colour, since the consumer's tokens own those — axe's contrast pass over every
 * variant is the colour check, and it is the consumer's palette it runs against.
 */
const meta = {
  title: "cubeui/Badge",
  component: Badge,
  args: { children: "Active" },
  decorators: [
    (Story) => (
      <div className="flex flex-row flex-wrap items-center gap-2 bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Active")).toBeInTheDocument();
  },
};

/** Every variant with a label, for the contrast pass. */
export const Variants: Story = {
  render: () => (
    <>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Warning")).toBeInTheDocument();
  },
};

/**
 * No label collapses the pill to a dot, which is named when it means something and hidden when
 * it does not — never an unnamed node in the accessibility tree.
 */
export const Dots: Story = {
  render: () => (
    <>
      <Badge variant="warning" label="Paused" />
      <Badge variant="secondary" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Paused" })).toBeInTheDocument();
    await expect(canvas.queryAllByRole("img")).toHaveLength(1);
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  },
};

const onSubmit = fn((event: React.FormEvent) => event.preventDefault());

/**
 * `onRemove` draws a trailing ✕: a real button, named after the badge's text, that fires only
 * `onRemove` — not the badge's own `onClick`, and not the submit of a form around it. The glyph is
 * the label's colour whatever set it: a variant, or `textColor` over a caller's `backgroundColor`.
 */
export const Removable: Story = {
  args: { children: "Urgent", onRemove: fn(), onClick: fn() },
  render: (args) => (
    <form onSubmit={onSubmit} className="flex flex-row flex-wrap items-center gap-2">
      <Badge {...args} />
      <Badge variant="destructive" onRemove={args.onRemove}>
        Blocked
      </Badge>
      <Badge
        backgroundColor="#1d4ed8"
        textColor="#ffffff"
        onRemove={args.onRemove}
        removeLabel="Take off the Design label"
      >
        Design
      </Badge>
      <Badge>Plain</Badge>
      <Badge variant="secondary" label="Paused" onRemove={args.onRemove} />
    </form>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    onSubmit.mockClear();

    // Named `Remove <text>` by default, and by `removeLabel` when one is passed.
    const urgent = canvas.getByRole("button", { name: "Remove Urgent" });
    const design = canvas.getByRole("button", { name: "Take off the Design label" });
    await expect(canvas.getByRole("button", { name: "Remove Blocked" })).toBeInTheDocument();
    await expect(urgent).toHaveAttribute("type", "button");

    // The dot has no room for a ✕, so it draws none: three buttons for the three pills that asked.
    await expect(canvas.getAllByRole("button")).toHaveLength(3);

    // Pressing it, by pointer or by key, fires `onRemove` and nothing else the badge or the form
    // around it does.
    await userEvent.click(urgent);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    urgent.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onRemove).toHaveBeenCalledTimes(2);
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(onSubmit).not.toHaveBeenCalled();

    // The glyph takes the label's colour — the variant's ink, and the caller's `textColor`.
    const ink = (button: HTMLElement) => {
      const svg = button.querySelector("svg");
      if (!svg) throw new Error("the remove button should draw an icon");
      return getComputedStyle(svg).color;
    };
    const pill = (button: HTMLElement) => {
      if (!button.parentElement) throw new Error("the remove button should sit in the pill");
      return button.parentElement;
    };
    await expect(ink(urgent)).toBe(getComputedStyle(pill(urgent)).color);
    await expect(ink(design)).toBe("rgb(255, 255, 255)");

    // And the ✕ does not make the pill any taller than one without it.
    const plain = canvas.getByText("Plain");
    await expect(pill(urgent).getBoundingClientRect().height).toBe(
      plain.getBoundingClientRect().height,
    );
  },
};

/**
 * `asChild` hands the badge to its one child — a tag that links to its search, say. It renders
 * (it used to throw: the ✕'s empty slot was a second child, and `Slot` takes exactly one), the
 * child stays the caller's `<a>`, and it is drawn as the plain badge beside it is. `onRemove` is
 * ignored under `asChild` rather than breaking it.
 */
export const AsChild: Story = {
  render: () => (
    <>
      <Badge variant="secondary">plain</Badge>
      <Badge variant="secondary" asChild>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route */}
        <a href="#">#tag</a>
      </Badge>
      <Badge variant="secondary" asChild onRemove={fn()}>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route */}
        <a href="#">#removable</a>
      </Badge>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "#tag" });
    await expect(link.tagName).toBe("A");
    await expect(link).toHaveAttribute("href", "#");
    await expect(link).toHaveAttribute("data-slot", "badge");

    const look = (el: Element) => {
      const style = getComputedStyle(el);
      return {
        display: style.display,
        padding: style.padding,
        radius: style.borderTopLeftRadius,
        background: style.backgroundColor,
        color: style.color,
        fontSize: style.fontSize,
      };
    };
    await expect(look(link)).toEqual(look(canvas.getByText("plain")));
    await expect(getComputedStyle(link).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    // No ✕ under `asChild`: its one child is the whole badge.
    await expect(canvas.getByRole("link", { name: "#removable" })).toBeInTheDocument();
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
  },
};
