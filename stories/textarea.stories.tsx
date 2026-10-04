import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Textarea as Compiled } from "../compiled/textarea";
import { Button as NativeButton } from "../registry/ui/button";
import { Textarea as Native, type TextareaHandle } from "../registry/ui/textarea";
import { SideBySide } from "./side-by-side";

/**
 * What a chat composer needs of a `Textarea` (#237), on both halves: Enter sends through
 * `onSubmitEditing` while Shift+Enter is still a new line, Escape is `onEscape`, and a ref puts
 * the caret back.
 */
const meta = { title: "RN Parity/Textarea" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onSubmitEditing = fn();
const onEscape = fn();
const onKeyPress = fn((event: { nativeEvent: { key: string } }) => event.nativeEvent.key);

export const Keys: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          defaultValue=""
          placeholder="Native message"
          onSubmitEditing={onSubmitEditing}
          onEscape={onEscape}
          onKeyPress={onKeyPress}
        />
      }
      compiled={
        <Compiled
          aria-label="Compiled message"
          placeholder="Compiled message"
          onSubmitEditing={onSubmitEditing}
          onEscape={onEscape}
          onKeyPress={onKeyPress}
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        onSubmitEditing.mockClear();
        onEscape.mockClear();
        onKeyPress.mockClear();
        const box = canvas.getByPlaceholderText(`${half} message`);

        await userEvent.click(box);
        await userEvent.keyboard("one{Shift>}{Enter}{/Shift}two");
        await expect(box).toHaveValue("one\ntwo");
        await expect(onSubmitEditing).not.toHaveBeenCalled();

        await userEvent.keyboard("{Enter}");
        await expect(onKeyPress).toHaveLastReturnedWith("Enter");
        await expect(onSubmitEditing).toHaveBeenCalledTimes(1);
        // The Enter that sent it added no line of its own.
        await expect(box).toHaveValue("one\ntwo");

        await userEvent.keyboard("{Escape}");
        await expect(onEscape).toHaveBeenCalledTimes(1);
        await expect(onSubmitEditing).toHaveBeenCalledTimes(1);
      });
    }
  },
};

function NativeFocus() {
  const box = useRef<TextareaHandle>(null);
  return (
    <div className="flex flex-col gap-2">
      <Native ref={box} defaultValue="" placeholder="Native reply" />
      <NativeButton variant="outline" onPress={() => box.current?.focus()}>
        Reply on native
      </NativeButton>
    </div>
  );
}

function CompiledFocus() {
  const box = useRef<TextareaHandle>(null);
  return (
    <div className="flex flex-col gap-2">
      <Compiled ref={box} aria-label="Compiled reply" placeholder="Compiled reply" />
      <CompiledButton variant="outline" onClick={() => box.current?.focus()}>
        Reply on compiled
      </CompiledButton>
    </div>
  );
}

/** A ref on either half gives `focus()`: what puts the caret back in the box after a send. */
export const Focus: Story = {
  render: () => <SideBySide native={<NativeFocus />} compiled={<CompiledFocus />} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["native", "compiled"]) {
      await userEvent.click(canvas.getByRole("button", { name: `Reply on ${half}` }));
      const name = `${half[0]?.toUpperCase()}${half.slice(1)} reply`;
      await expect(canvas.getByPlaceholderText(name)).toHaveFocus();
    }
  },
};
