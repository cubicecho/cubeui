import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "react-native";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { ListItem as Compiled } from "../compiled/list-item";
import { ListItem as Native } from "../registry/layout/list-item";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * philotes' person row — an avatar, a name over the last contact, a count at the far end and a
 * delete button — drawn with either half. The pressable middle and the delete button are sibling
 * controls on both, which is what the press tests below hold.
 */
const meta = {
  title: "Layout/List Item",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = "Augusta Ada King, Countess of Lovelace, who wrote the first published program";

const nativeAvatar = (
  <View className="size-8 items-center justify-center rounded-full bg-muted">
    <Text className="font-medium text-foreground text-xs">AL</Text>
  </View>
);
const compiledAvatar = (
  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
    <span className="font-medium text-foreground text-xs">AL</span>
  </div>
);

function bounds(root: HTMLElement, slot: string) {
  const el = root.querySelector<HTMLElement>(`[data-slot="${slot}"], [data-testid="${slot}"]`);
  if (!el) throw new Error(`${slot} should render`);
  return el.getBoundingClientRect();
}

const openNative = fn();
const deleteNative = fn();
const openCompiled = fn();
const deleteCompiled = fn();

export const Pressable: Story = {
  args: { title: "Ada Lovelace" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root">
          <Native
            leading={nativeAvatar}
            title="Ada Lovelace"
            description="Last contact: 3 days ago"
            meta="12"
            onPress={openNative}
            action={
              <NativeButton size="sm" variant="ghost" onPress={deleteNative}>
                Delete
              </NativeButton>
            }
          />
        </div>
      }
      compiled={
        <div className="compiled-root">
          <Compiled
            leading={compiledAvatar}
            title="Ada Lovelace"
            description="Last contact: 3 days ago"
            meta="12"
            onClick={openCompiled}
            action={
              <CompiledButton size="sm" variant="ghost" onClick={deleteCompiled}>
                Delete
              </CompiledButton>
            }
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const cases = [
      { root: ".native-root", open: openNative, remove: deleteNative },
      { root: ".compiled-root", open: openCompiled, remove: deleteCompiled },
    ];

    for (const { root: selector, open, remove } of cases) {
      const root = canvasElement.querySelector<HTMLElement>(selector);
      if (!root) throw new Error(`${selector} should render`);
      open.mockClear();
      remove.mockClear();

      // Placement: leading, then the title, then meta and the action at the far end.
      const row = bounds(root, "list-item");
      const leading = bounds(root, "list-item-leading");
      const title = bounds(root, "list-item-title");
      const description = bounds(root, "list-item-description");
      const metaBox = bounds(root, "list-item-meta");
      const action = bounds(root, "list-item-action");
      await expect(leading.right).toBeLessThanOrEqual(title.left);
      await expect(metaBox.left).toBeGreaterThan(title.right);
      await expect(metaBox.right).toBeLessThanOrEqual(action.left);
      await expect(row.right - action.right).toBeLessThan(16);
      await expect(description.top).toBeGreaterThanOrEqual(title.bottom - 1);
      await expect(Math.abs(description.left - title.left)).toBeLessThan(1);

      // The middle is a button, named by its text; the action is a separate one beside it.
      const canvas = within(root);
      const body = canvas.getByRole("button", { name: /Ada Lovelace/ });
      const del = canvas.getByRole("button", { name: "Delete" });
      await expect(body.contains(del)).toBe(false);
      await expect(del.contains(body)).toBe(false);

      await userEvent.click(canvas.getByText("Ada Lovelace"));
      await expect(open).toHaveBeenCalledTimes(1);
      await expect(remove).not.toHaveBeenCalled();

      await userEvent.click(del);
      await expect(remove).toHaveBeenCalledTimes(1);
      await expect(open).toHaveBeenCalledTimes(1);
    }

    // The two halves draw the title alike.
    const nativeTitle = within(
      canvasElement.querySelector<HTMLElement>(".native-root") as HTMLElement,
    ).getByText("Ada Lovelace");
    const compiledTitle = within(
      canvasElement.querySelector<HTMLElement>(".compiled-root") as HTMLElement,
    ).getByText("Ada Lovelace");
    await expect(getComputedStyle(compiledTitle).fontSize).toBe(
      getComputedStyle(nativeTitle).fontSize,
    );
    await expect(getComputedStyle(compiledTitle).color).toBe(getComputedStyle(nativeTitle).color);
  },
};

/** No `onPress`: no button at all, and a long title keeps to one line rather than wrapping. */
export const LongTitle: Story = {
  args: { title: LONG },
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 260 }}>
          <Native title={LONG} meta="Mar 3" />
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 260 }}>
          <Compiled title={LONG} meta="Mar 3" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const selector of [".native-root", ".compiled-root"]) {
      const root = canvasElement.querySelector<HTMLElement>(selector);
      if (!root) throw new Error(`${selector} should render`);
      await expect(within(root).queryByRole("button")).toBeNull();

      const title = within(root).getByText(LONG);
      const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
      await expect(title.getBoundingClientRect().height).toBeLessThan(lineHeight * 1.5);
      await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);

      // Truncating the title is what keeps the meta on the row, inside the frame.
      const row = bounds(root, "list-item");
      const metaBox = bounds(root, "list-item-meta");
      await expect(metaBox.right).toBeLessThanOrEqual(row.right);
      await expect(metaBox.left).toBeGreaterThan(title.getBoundingClientRect().right - 1);
    }
  },
};
