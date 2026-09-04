import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DialogLayout } from "@/registry/new-york/layout/dialog-layout";
import { Button } from "@/registry/new-york/ui/button";

const meta = {
  title: "Layout/DialogLayout",
  component: DialogLayout,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DialogLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Fields = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 py-2">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <div key={n} className="grid gap-1.5">
        <label className="font-medium text-sm" htmlFor={`f${n}`}>
          Field {n}
        </label>
        <input
          id={`f${n}`}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
          placeholder="…"
        />
      </div>
    ))}
  </div>
);

const openIt = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: /new workspace|open/i }));
  // Radix portals the content outside the canvas, so assertions read from the document.
  const dialog = await waitFor(() => within(document.body).getByRole("dialog"));
  // The dialog zooms and fades in, and a rectangle measured part-way through that is a rectangle
  // of a transform still in motion — `LongFormKeepsItsTitle` compares two of them for equality
  // and was reading 59.988 against 61.447. Endless animations are skipped, or this never
  // returns; `.finished` rejects on a cancelled one, which is not a failure here either.
  await Promise.all(
    dialog
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      .map((a) => a.finished.catch(() => {})),
  );
  return dialog;
};

export const Default: Story = {
  args: {
    trigger: <Button>New workspace</Button>,
    title: "New workspace",
    description: "A workspace exposes the servers you choose at its own URL.",
    footerActions: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </>
    ),
    content: <Fields />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
  },
};

/**
 * The reason this component exists rather than a snippet.
 *
 * Every hand-written dialog in the source apps caps itself with `max-h-[85vh] overflow-y-auto`
 * on the content, which scrolls the *whole* dialog: on a long form the title leaves the screen
 * first and Save is somewhere past the end of the fields. Here the body scrolls and the chrome
 * does not, and this story asserts exactly that — scroll the body to the end and the title is
 * still where it was.
 */
export const LongFormKeepsItsTitle: Story = {
  args: {
    trigger: <Button>New workspace</Button>,
    title: "New workspace",
    description: "Twenty fields, and the title does not go anywhere.",
    footerActions: <Button>Save</Button>,
    content: <Fields count={20} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);

    // The dialog composes HeaderContentFooter (conventions rule 7), so the scrolling body is the
    // chassis's slot — there is no dialog-specific one, which is the point of composing.
    const body = document.querySelector<HTMLElement>("[data-slot=header-content-footer-content]");
    const title = within(document.body).getByRole("heading", { name: "New workspace" });
    expect(body).not.toBeNull();
    if (!body) return;

    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);

    const titleTop = title.getBoundingClientRect().top;
    const footer = within(document.body).getByRole("button", { name: "Save" });
    const footerTop = footer.getBoundingClientRect().top;

    body.scrollTop = body.scrollHeight;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));

    // Both ends of the chrome stayed put while the middle moved.
    expect(title.getBoundingClientRect().top).toBe(titleTop);
    expect(footer.getBoundingClientRect().top).toBe(footerTop);
  },
};

/**
 * `hideTitle` takes the title off the screen and keeps it for assistive technology. A design
 * with no room for a heading uses this; nothing ever drops the title.
 */
export const HiddenTitle: Story = {
  args: {
    trigger: <Button>Open</Button>,
    title: "Command palette",
    hideTitle: true,
    content: <Fields count={2} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
    // Still announced: findable by its accessible name even though it is visually gone.
    const dialog = within(document.body).getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Command palette");
    expect(within(document.body).getByText("Command palette")).toHaveClass("sr-only");
  },
};

/** Sizes are a literal class map (rule 3), so every one of them is a class Tailwind generated. */
export const Sizes: Story = {
  args: { title: "Sized", content: <Fields count={2} /> },
  render: (args) => (
    <div className="flex gap-2">
      {(["sm", "md", "lg"] as const).map((size) => (
        <DialogLayout {...args} key={size} size={size} trigger={<Button>{size}</Button>} />
      ))}
    </div>
  ),
};

/**
 * No description. The shell spreads an explicit `aria-describedby: undefined` in that case,
 * because Radix warns when nothing describes the content and an unset prop is how you say the
 * absence is deliberate.
 */
export const NoDescription: Story = {
  args: {
    trigger: <Button>Open</Button>,
    title: "Rename board",
    footerActions: <Button>Rename</Button>,
    content: <Fields count={1} />,
  },
  play: async ({ canvasElement }) => {
    await openIt(canvasElement);
    const dialog = within(document.body).getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-describedby");
  },
};
