import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * `Card`, as installed beside it by `@cubeui/card-stories`: the static card, whose title is a
 * real heading, and the pressable one, which is a real button rather than a `div` with a click.
 */
const meta = {
  title: "cubeui/Card",
  component: Card,
  decorators: [
    (Story) => (
      <div className="w-[360px] bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <>
    <CardHeader>
      <CardTitle>Quarterly review</CardTitle>
      <CardDescription>Everything that shipped since June.</CardDescription>
    </CardHeader>
    <CardContent>
      <CardDescription>Twelve items, four of them still open.</CardDescription>
    </CardContent>
    <CardFooter>
      <CardDescription>Updated today</CardDescription>
    </CardFooter>
  </>
);

export const Default: Story = {
  render: (args) => <Card {...args}>{body}</Card>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Quarterly review" })).toBeInTheDocument();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

export const Pressable: Story = {
  args: { onClick: fn() },
  render: (args) => <Card {...args}>{body}</Card>,
  play: async ({ canvasElement, args }) => {
    const card = within(canvasElement).getByRole("button");
    await userEvent.click(card);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
