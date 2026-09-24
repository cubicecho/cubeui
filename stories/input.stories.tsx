import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Input as Compiled } from "../compiled/input";
import { Input as Native } from "../registry/ui/input";
import { SideBySide } from "./side-by-side";

/**
 * The keys an inline edit answers, on both halves: Enter commits through `onSubmitEditing`, Escape
 * puts it back through `onEscape`, and `onKeyPress` hears every key as `nativeEvent.key` first.
 */
const meta = { title: "Stage 0/Input" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onEscape = fn();
const onSubmitEditing = fn();
const onKeyPress = fn((event: { nativeEvent: { key: string } }) => event.nativeEvent.key);

export const Keys: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          aria-label="Native lane name"
          defaultValue="Backlog"
          onEscape={onEscape}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
        />
      }
      compiled={
        <Compiled
          aria-label="Compiled lane name"
          defaultValue="Backlog"
          onEscape={onEscape}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled lane name", "Native lane name"]) {
      await step(name, async () => {
        onEscape.mockClear();
        onSubmitEditing.mockClear();
        onKeyPress.mockClear();
        const input = canvas.getByRole("textbox", { name });

        await userEvent.click(input);
        await userEvent.keyboard("x");
        await expect(onKeyPress).toHaveLastReturnedWith("x");
        await expect(onEscape).not.toHaveBeenCalled();

        await userEvent.keyboard("{Escape}");
        await expect(onKeyPress).toHaveLastReturnedWith("Escape");
        await expect(onEscape).toHaveBeenCalledTimes(1);
        await expect(onSubmitEditing).not.toHaveBeenCalled();

        await userEvent.keyboard("{Enter}");
        await expect(onSubmitEditing).toHaveBeenCalledTimes(1);
        await expect(onEscape).toHaveBeenCalledTimes(1);
      });
    }
  },
};
