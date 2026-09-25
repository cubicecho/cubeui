import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Search as CompiledSearch, X as CompiledX } from "../compiled/icons";
import { Input as Compiled } from "../compiled/input";
import { Button as NativeButton } from "../registry/ui/button";
import { Search as NativeSearch, X as NativeX } from "../registry/ui/icons";
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

const onClear = fn();

/**
 * `leading` and `trailing`, on both halves: the icon sits inside the field at its start and takes
 * no press, the text starts past it, and a trailing button is pressable and stops the text short
 * of itself. Without either slot the root is the field, as it always was.
 */
export const Slots: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-3">
          <Native
            aria-label="Native search"
            placeholder="Search servers"
            leading={<NativeSearch />}
          />
          <Native
            aria-label="Native filter"
            defaultValue="mcp"
            leading={<NativeSearch />}
            trailing={
              <NativeButton
                variant="ghost"
                size="icon-xs"
                aria-label="Native clear"
                onPress={onClear}
              >
                <NativeX />
              </NativeButton>
            }
            wrapperClassName="w-64"
          />
          <Native aria-label="Native plain" />
        </div>
      }
      compiled={
        <div className="flex flex-col gap-3">
          <Compiled
            aria-label="Compiled search"
            placeholder="Search servers"
            leading={<CompiledSearch />}
          />
          <Compiled
            aria-label="Compiled filter"
            defaultValue="mcp"
            leading={<CompiledSearch />}
            trailing={
              <CompiledButton
                variant="ghost"
                size="icon-xs"
                aria-label="Compiled clear"
                onClick={onClear}
              >
                <CompiledX />
              </CompiledButton>
            }
            wrapperClassName="w-64"
          />
          <Compiled aria-label="Compiled plain" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const search = canvas.getByRole("textbox", { name: `${half} search` });
        const box = search.getBoundingClientRect();
        const icon = search.parentElement?.querySelector("svg");
        if (!icon) throw new Error("the leading icon should be drawn beside the field");
        const glyph = icon.getBoundingClientRect();

        // The icon is inside the field, at its start, at 16px, and the text starts past it.
        await expect(glyph.width).toBe(16);
        await expect(glyph.left).toBeGreaterThan(box.left);
        await expect(glyph.top).toBeGreaterThan(box.top);
        await expect(glyph.bottom).toBeLessThan(box.bottom);
        await expect(
          Number.parseFloat(getComputedStyle(search).paddingLeft),
        ).toBeGreaterThanOrEqual(glyph.right - box.left);

        // It takes no press: a click on it is a click on the field underneath.
        const slot = icon.parentElement;
        if (!slot) throw new Error("the icon should sit in a slot");
        await expect(getComputedStyle(slot).pointerEvents).toBe("none");

        // The trailing button is pressable, inside the field's far end, and the text stops short.
        onClear.mockClear();
        const filter = canvas.getByRole("textbox", { name: `${half} filter` });
        const clear = canvas.getByRole("button", { name: `${half} clear` });
        await userEvent.click(clear);
        await expect(onClear).toHaveBeenCalledTimes(1);
        const end = filter.getBoundingClientRect();
        const button = clear.getBoundingClientRect();
        await expect(button.right).toBeLessThanOrEqual(end.right);
        await expect(button.left).toBeGreaterThan(end.left + end.width / 2);
        await expect(
          Number.parseFloat(getComputedStyle(filter).paddingRight),
        ).toBeGreaterThanOrEqual(end.right - button.left);
        await expect(end.width).toBe(256);

        // No slot, no wrapper: the plain field sits beside the slotted ones' boxes, not in one.
        const plain = canvas.getByRole("textbox", { name: `${half} plain` });
        await expect(plain.parentElement).toBe(search.parentElement?.parentElement);
      });
    }
  },
};
