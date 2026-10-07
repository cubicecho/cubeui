import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Textarea as Compiled } from "../compiled/textarea";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Textarea as Native,
  type TextareaHandle,
  type TextareaSelection,
} from "../registry/ui/textarea";
import { SideBySide } from "./side-by-side";

/**
 * What a chat composer needs of a `Textarea` (#237), on both halves: Enter sends through
 * `onSubmitEditing` while Shift+Enter is still a new line, Escape is `onEscape`, a ref puts
 * the caret back, and `maxRows` grows the box with the message.
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
      <NativeButton
        variant="outline"
        onPress={() => box.current?.focus()}
        content="Reply on native"
      />
    </div>
  );
}

function CompiledFocus() {
  const box = useRef<TextareaHandle>(null);
  return (
    <div className="flex flex-col gap-2">
      <Compiled ref={box} aria-label="Compiled reply" placeholder="Compiled reply" />
      <CompiledButton
        variant="outline"
        onClick={() => box.current?.focus()}
        content="Reply on compiled"
      />
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

/**
 * `maxRows` makes the box grow with its text, from `rows` to the cap, and shrink again when the
 * text goes: one line, then up to four, then scrolling.
 */
export const Grows: Story = {
  render: () => (
    <SideBySide
      native={<Native defaultValue="" rows={1} maxRows={4} placeholder="Native composer" />}
      compiled={
        <Compiled
          aria-label="Compiled composer"
          rows={1}
          maxRows={4}
          placeholder="Compiled composer"
        />
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const newLine = "{Shift>}{Enter}{/Shift}";

    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const box = canvas.getByPlaceholderText(`${half} composer`);
        const one = box.offsetHeight;

        await userEvent.click(box);
        await userEvent.keyboard(`a${newLine}b${newLine}c`);
        const three = box.offsetHeight;
        const line = (three - one) / 2;
        await expect(line).toBeGreaterThan(0);

        // Ten lines are as tall as four, and the rest is scrolled to.
        await userEvent.keyboard(`${newLine}d${newLine}e${newLine}f${newLine}g${newLine}h`);
        await expect(box.offsetHeight).toBe(one + 3 * line);
        await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

        await userEvent.clear(box);
        await expect(box.offsetHeight).toBe(one);
      });
    }
  },
};

/** The `@word` the caret is in or just after, which is what a mention menu completes. */
function mentionAt(text: string, caret: number): { from: number; query: string } | null {
  const match = /@(\w*)$/.exec(text.slice(0, caret));
  return match ? { from: match.index, query: match[1] ?? "" } : null;
}

function Mentions({ half, Box }: { half: string; Box: typeof Native }) {
  const [text, setText] = useState("");
  const [selection, setSelection] = useState<TextareaSelection>({ start: 0, end: 0 });
  const mention = selection.start === selection.end ? mentionAt(text, selection.start) : null;
  return (
    <div className="flex flex-col gap-2">
      <Box
        value={text}
        onChangeText={setText}
        selection={selection}
        onSelectionChange={setSelection}
        placeholder={`${half} note`}
        autoFocus
      />
      <output aria-label={`${half} caret`}>{`${selection.start}-${selection.end}`}</output>
      {mention ? (
        <button
          type="button"
          onClick={() => {
            const name = "@Alice ";
            setText(text.slice(0, mention.from) + name + text.slice(selection.start));
            const caret = mention.from + name.length;
            setSelection({ start: caret, end: caret });
          }}
        >
          {`${half}: complete @${mention.query}`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * `selection` and `onSelectionChange` (#277): a mention typed in the middle of a note is found by
 * where the caret is, and the caret is put after the name once it is inserted. `autoFocus` is on
 * both, so the one mounted last holds the focus.
 */
export const Selection: Story = {
  render: () => (
    <SideBySide
      native={<Mentions half="Native" Box={Native} />}
      compiled={<Mentions half="Compiled" Box={Compiled as unknown as typeof Native} />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByPlaceholderText("Compiled note")).toHaveFocus();

    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const box = canvas.getByPlaceholderText<HTMLTextAreaElement>(`${half} note`);
        const caret = canvas.getByLabelText(`${half} caret`);

        await userEvent.click(box);
        await userEvent.keyboard("ask  today");
        await waitFor(() => expect(caret).toHaveTextContent("10-10"));

        // Back to the gap in the middle, where the end of the text says nothing.
        await userEvent.keyboard(
          "{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}",
        );
        await waitFor(() => expect(caret).toHaveTextContent("4-4"));
        await userEvent.keyboard("@al");
        await waitFor(() => expect(caret).toHaveTextContent("7-7"));

        await userEvent.click(canvas.getByRole("button", { name: `${half}: complete @al` }));
        await expect(box).toHaveValue("ask @Alice  today");
        await waitFor(() => expect(box.selectionStart).toBe(11));
        await expect(box.selectionEnd).toBe(11);
      });
    }
  },
};
