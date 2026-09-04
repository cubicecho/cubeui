import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import { DisclosureRow } from "@/registry/new-york/layout/disclosure-row";
import { Badge } from "@/registry/new-york/ui/badge";
import { Button } from "@/registry/new-york/ui/button";

const meta = {
  title: "Layout/DisclosureRow",
  component: DisclosureRow,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DisclosureRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open is controlled, so a story that is about opening has to hold it. */
const Controlled = ({
  onOpenChange,
  ...props
}: Omit<Parameters<typeof DisclosureRow>[0], "open" | "onOpenChange"> & {
  onOpenChange?: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[560px]">
      <DisclosureRow
        {...props}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
      />
    </div>
  );
};

const detail: ReactNode = (
  <p className="text-muted-foreground text-sm">
    Read 4 files, wrote 2, and ran the tests. 146 passed.
  </p>
);

const args = {
  open: false,
  onOpenChange: fn(),
  title: "Rename the settings page",
  badges: <Badge variant="secondary">done</Badge>,
  meta: <span className="text-muted-foreground text-xs">local llama · 2 minutes ago</span>,
  content: detail,
};

export const Default: Story = {
  args,
  render: (props) => <Controlled {...props} />,
};

/**
 * The whole heading is the button — not the chevron. A row opened by a 16-pixel target is the
 * failure mode of every hand-written version of this, and it is the same failure by keyboard.
 */
export const TheHeadingIsTheButton: Story = {
  args,
  render: (props) => <Controlled {...props} />,
  play: async ({ canvas }) => {
    const header = canvas.getByRole("button", { name: /Rename the settings page/ });
    expect(header).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(canvas.getByText(/146 passed/)).toBeVisible();
  },
};

/** And by keyboard, which is what a real `<button>` buys and a `<div onClick>` does not. */
export const OpensWithTheKeyboard: Story = {
  args,
  render: (props) => <Controlled {...props} />,
  play: async ({ canvas }) => {
    const header = canvas.getByRole("button", { name: /Rename the settings page/ });
    header.focus();
    await userEvent.keyboard(" ");
    expect(header).toHaveAttribute("aria-expanded", "true");
  },
};

/**
 * The action sits outside the disclosure. A control nested inside a button is invalid HTML and, in
 * practice, a delete that cannot be clicked — so opening the row and acting on it are two
 * separate targets.
 */
export const WithAnAction: Story = {
  args: {
    ...args,
    action: (
      <Button variant="ghost" size="icon" onClick={fn()} aria-label="Delete this run">
        <Trash2 />
      </Button>
    ),
  },
  render: (props) => <Controlled {...props} />,
  play: async ({ canvas }) => {
    const remove = canvas.getByRole("button", { name: "Delete this run" });
    const header = canvas.getByRole("button", { name: /Rename the settings page/ });
    expect(header.contains(remove)).toBe(false);
    await userEvent.click(remove);
    expect(header).toHaveAttribute("aria-expanded", "false");
  },
};

/** A line that shows whether the row is open or shut — usually what the thing said about itself. */
export const WithADescription: Story = {
  args: {
    ...args,
    badges: <Badge variant="destructive">error</Badge>,
    description: "The endpoint refused the request: context length exceeded.",
  },
  render: (props) => <Controlled {...props} />,
};

/** A row with nothing to open still draws, and does not claim it controls anything. */
export const NothingToOpen: Story = {
  args: { ...args, content: undefined },
  render: (props) => <Controlled {...props} />,
  play: async ({ canvas }) => {
    const header = canvas.getByRole("button", { name: /Rename the settings page/ });
    await userEvent.click(header);
    expect(header).not.toHaveAttribute("aria-controls");
  },
};
