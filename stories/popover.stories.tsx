import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  PopoverClose as CompiledClose,
  PopoverContent as CompiledContent,
  Popover as CompiledPopover,
  PopoverTrigger as CompiledTrigger,
} from "../compiled/popover";
import {
  PopoverClose as NativeClose,
  PopoverContent as NativeContent,
  Popover as NativePopover,
  PopoverTrigger as NativeTrigger,
} from "../registry/ui/popover.tsx";

/**
 * `PopoverClose` on both halves: a pane's Done button shuts the popover it sits in, with no `open`
 * held by the caller. Before it, every uncontrolled popover with a button in it had to become
 * controlled just so the button could set `open` back to `false`.
 *
 * The native half is imported by its full name because Vite would otherwise resolve
 * `popover.web.tsx`.
 */
const meta = { title: "RN Parity/Popover", parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj;

const body = () => within(document.body);

export const CloseShutsIt: Story = {
  render: () => (
    <div className="flex gap-6 bg-background p-6">
      <NativePopover>
        <NativeTrigger>
          <Text className="text-foreground">Native filters</Text>
        </NativeTrigger>
        <NativeContent>
          <Text className="text-foreground">Native pane</Text>
          <NativeClose>
            <Text className="text-foreground">Native done</Text>
          </NativeClose>
        </NativeContent>
      </NativePopover>
      <CompiledPopover>
        <CompiledTrigger>Compiled filters</CompiledTrigger>
        <CompiledContent aria-label="Compiled pane">
          <p>Compiled pane</p>
          <CompiledClose>Compiled done</CompiledClose>
        </CompiledContent>
      </CompiledPopover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Native filters" }));
    await userEvent.click(await body().findByRole("button", { name: "Native done" }));
    await waitFor(() => expect(body().queryByText("Native pane")).toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Compiled filters" }));
    await userEvent.click(await body().findByRole("button", { name: "Compiled done" }));
    await waitFor(() => expect(body().queryByText("Compiled pane")).toBeNull());
  },
};

/**
 * The web pane grows out of its trigger, as the menu does, not out of its own centre (#486):
 * radix hands it the edge it opened from as `--radix-popover-content-transform-origin`, and the
 * pane's zoom is drawn from there. Below its trigger, that is the pane's top edge.
 */
export const GrowsFromItsTrigger: Story = {
  render: () => (
    <CompiledPopover>
      <CompiledTrigger>Compiled filters</CompiledTrigger>
      <CompiledContent side="bottom" aria-label="Compiled pane">
        <p>Compiled pane</p>
      </CompiledContent>
    </CompiledPopover>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Compiled filters" }));
    const pane = await body().findByRole("dialog", { name: "Compiled pane" });
    await expect(pane).toHaveAttribute("data-side", "bottom");
    await expect(getComputedStyle(pane).transformOrigin.split(" ")[1]).toBe("0px");
  },
};
