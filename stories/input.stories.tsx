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
const meta = { title: "RN Parity/Input" } satisfies Meta;
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

/**
 * `autoCapitalize` and `autoCorrect` (#244), on both halves: what a phone's keyboard is told about
 * a field holding an identifier. The DOM spells correction as a word and has the spelling
 * underline beside it, so both follow the one prop.
 */
export const TypedAsWritten: Story = {
  render: () => (
    <SideBySide
      native={<Native aria-label="Native model id" autoCapitalize="none" autoCorrect={false} />}
      compiled={
        <Compiled aria-label="Compiled model id" autoCapitalize="none" autoCorrect={false} />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Native model id", "Compiled model id"]) {
      const input = canvas.getByRole("textbox", { name });
      await expect(input).toHaveAttribute("autocapitalize", "none");
      await expect(input).toHaveAttribute("autocorrect", "off");
      await expect(input).toHaveAttribute("spellcheck", "false");
    }
  },
};

/**
 * `autoComplete` (#276), on both halves: what the field holds, said to the browser's autofill and
 * a password manager. `type="email"` alone does not say it, so a sign-in without this lost the
 * saved address.
 */
export const AutoComplete: Story = {
  render: () => (
    <SideBySide
      native={<Native aria-label="Native email" type="email" autoComplete="email" />}
      compiled={<Compiled aria-label="Compiled email" type="email" autoComplete="email" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Native email", "Compiled email"]) {
      await expect(canvas.getByRole("textbox", { name })).toHaveAttribute("autocomplete", "email");
    }
  },
};

const onClear = fn();

/**
 * `leadingSlot` and `trailingSlot`, on both halves: the icon sits inside the field at its start and
 * takes no press, the text starts past it, and a trailing button is pressable and stops the text
 * short of itself. Without either slot the root is the field, as it always was.
 */
export const Slots: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-3">
          <Native
            aria-label="Native search"
            placeholder="Search servers"
            leadingSlot={<NativeSearch />}
          />
          <Native
            aria-label="Native filter"
            defaultValue="mcp"
            leadingSlot={<NativeSearch />}
            trailingSlot={
              <NativeButton
                variant="outline"
                size="icon-xs"
                aria-label="Native clear"
                onPress={onClear}
                iconSlot={<NativeX />}
              />
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
            leadingSlot={<CompiledSearch />}
          />
          <Compiled
            aria-label="Compiled filter"
            defaultValue="mcp"
            leadingSlot={<CompiledSearch />}
            trailingSlot={
              <CompiledButton
                variant="outline"
                size="icon-xs"
                aria-label="Compiled clear"
                onClick={onClear}
                iconSlot={<CompiledX />}
              />
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
        if (!icon) {
          throw new Error("the leading icon should be drawn beside the field");
        }
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
        if (!slot) {
          throw new Error("the icon should sit in a slot");
        }
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

const LONG_PREFIX = "https://tasks.example.com/webhooks/";

function Addons({ Input, half }: { Input: typeof Native | typeof Compiled; half: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Input aria-label={`${half} webhook`} prefixText={LONG_PREFIX} defaultValue="deploy" />
      <Input aria-label={`${half} invalid`} prefixText="@" aria-invalid defaultValue="taken" />
      <Input
        aria-label={`${half} narrow`}
        prefixText={LONG_PREFIX}
        suffixText=".json"
        wrapperClassName="w-56"
      />
    </div>
  );
}

/**
 * `prefixText` and `suffixText` (#364), on both halves: the fixed text sits inside the field's one
 * border, the field draws none of its own, a press on the text puts the caret in the value, the
 * focus and invalid colours go round the whole box, the text is read with the field, and a narrow
 * box cuts the prefix from its start while the value keeps room.
 */
export const TextAddons: Story = {
  render: () => (
    <SideBySide
      native={<Addons Input={Native} half="Native" />}
      compiled={<Addons Input={Compiled} half="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const half of ["Compiled", "Native"]) {
      await step(half, async () => {
        const webhook = canvas.getByRole("textbox", { name: `${half} webhook` });
        const box = webhook.parentElement;
        const prefix = box?.querySelector<HTMLElement>("[id$='-prefix']");
        if (!box || !prefix) {
          throw new Error("the prefix should be drawn");
        }

        // One border, the box's: the field draws none, and the prefix is inside it, before it.
        await expect(getComputedStyle(box).borderTopWidth).toBe("1px");
        await expect(getComputedStyle(webhook).borderTopWidth).toBe("0px");
        const outer = box.getBoundingClientRect();
        const text = prefix.getBoundingClientRect();
        await expect(text.left).toBeGreaterThan(outer.left);
        await expect(text.right).toBeLessThanOrEqual(webhook.getBoundingClientRect().left + 1);

        // Read with the field.
        const described = (webhook.getAttribute("aria-describedby") ?? "")
          .split(" ")
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ");
        await expect(described).toContain(LONG_PREFIX);

        // A press on the prefix is a press in the field, and the box shows the focus.
        const resting = getComputedStyle(box).borderTopColor;
        await userEvent.click(prefix);
        await expect(webhook).toHaveFocus();
        await expect(getComputedStyle(box).borderTopColor).not.toBe(resting);
        await userEvent.tab();

        // The invalid colour goes round the box, not the field inside it.
        const invalid = canvas.getByRole("textbox", { name: `${half} invalid` });
        const invalidBox = invalid.parentElement as HTMLElement;
        await expect(getComputedStyle(invalidBox).borderTopColor).not.toBe(resting);

        // Narrow: the value keeps room, and the prefix is cut, from its start.
        const narrow = canvas.getByRole("textbox", { name: `${half} narrow` });
        await expect(narrow.getBoundingClientRect().width).toBeGreaterThanOrEqual(96);
        const cut = (narrow.parentElement as HTMLElement).querySelectorAll<HTMLElement>(
          "[id$='-prefix']",
        )[0];
        if (!cut) {
          throw new Error("the narrow box should draw its prefix");
        }
        await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
        await expect(getComputedStyle(cut).direction).toBe("rtl");
        await expect(narrow.parentElement).toHaveTextContent(".json");
      });
    }
  },
};
