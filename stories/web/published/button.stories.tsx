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
  title: "Controls/Button",
  component: Button,
  args: { content: "Save changes", onClick: fn() },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "destructive-outline",
        "positive",
        "positive-outline",
        "info",
        "info-outline",
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
 * `bg-neutral` that resolved to nothing — the app's stylesheet not defining `--primary`, or
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

/**
 * Every variant at once, which is where axe's colour-contrast rule earns its keep. The filled
 * ones on the first line, the outline of each under it, and the rest last.
 */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button {...args} content="Default" />
        <Button {...args} variant="positive" content="Positive" />
        <Button {...args} variant="info" content="Info" />
        <Button {...args} variant="destructive" content="Destructive" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button {...args} variant="outline" content="Outline" />
        <Button {...args} variant="positive-outline" content="Positive outline" />
        <Button {...args} variant="info-outline" content="Info outline" />
        <Button {...args} variant="destructive-outline" content="Destructive outline" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button {...args} variant="secondary" content="Secondary" />
        <Button {...args} variant="ghost" content="Ghost" />
        <Button {...args} variant="link" content="Link" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("button")).toHaveLength(11);
  },
};

/** The sizes, smallest to largest. `xs` is the one that sits in a list row. */
export const Sizes: Story = {
  render: (args) => (
    <>
      <Button {...args} size="xs" content="Extra small" />
      <Button {...args} size="sm" content="Small" />
      <Button {...args} content="Default" />
      <Button {...args} size="lg" content="Large" />
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

/**
 * Pressed, and the work is still running: the same dimming as disabled, `aria-busy` for a screen
 * reader, and the label swapped for `loadingLabel`. The spinner turning is the app's
 * `animate-spin`, which is the part a missing Tailwind scan would lose.
 */
export const Loading: Story = {
  args: { loading: true, loadingLabel: "Saving…" },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", { name: "Saving…" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button.querySelector("svg")).not.toBeNull();

    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
