import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui/button";

/**
 * `Button`, as the story a consuming app installs beside it with `@cubeui/button-stories`.
 *
 * Written to run in someone else's Storybook, under someone else's `index.css`, which is the whole
 * reason it ships: axe and the assertions below answer "does this still work with *our* tokens",
 * a question cubeui's own Storybook cannot. So nothing here asserts a colour — the consumer owns
 * those — only what has to hold whatever the palette is: the control is a real button, it clicks,
 * disabled means disabled, and the variant resolved to a painted surface rather than an undefined
 * token. See `stories/web/published/` in the README for the rules every file in here keeps.
 */
const meta = {
  title: "cubeui/Button",
  component: Button,
  args: { children: "Save changes", onClick: fn() },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "destructive-outline",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: { control: "select", options: ["default", "xs", "sm", "lg", "icon"] },
  },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2 bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The primary action. The background assertion is the token check that needs no palette: a
 * `bg-primary` that resolved to nothing — the app's stylesheet not defining `--primary`, or
 * Tailwind not scanning `components/ui` — paints transparent, and a white label on a transparent
 * button is invisible without failing anything else.
 */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save changes" });
    await expect(button.getAttribute("type")).toBe("button");
    await expect(getComputedStyle(button).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Every variant at once, which is where axe's colour-contrast rule earns its keep. */
export const Variants: Story = {
  render: (args) => (
    <>
      <Button {...args}>Default</Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="destructive-outline">
        Destructive outline
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("button")).toHaveLength(7);
  },
};

/** The sizes, smallest to largest. `xs` is the one that sits in a list row. */
export const Sizes: Story = {
  render: (args) => (
    <>
      <Button {...args} size="xs">
        Extra small
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args}>Default</Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const height = (name: string) =>
      canvas.getByRole("button", { name }).getBoundingClientRect().height;
    await expect(height("Extra small")).toBeLessThan(height("Small"));
    await expect(height("Small")).toBeLessThan(height("Default"));
    await expect(height("Default")).toBeLessThan(height("Large"));
  },
};

/**
 * Disabled is the state an app's token override most often breaks, and the one this issue was
 * opened over. The click has to go nowhere, and the dimming has to have been applied — an
 * `opacity-50` that Tailwind never generated leaves a disabled button looking live.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "Save changes" });
    await expect(button).toBeDisabled();
    await expect(getComputedStyle(button).opacity).toBe("0.5");

    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
