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
  title: "RN Parity/ListItem",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = "Augusta Ada King, Countess of Lovelace, who wrote the first published program";

const nativeAvatar = (
  <View className="size-8 items-center justify-center rounded-full bg-foreground/10">
    <Text className="font-medium text-foreground text-xs">AL</Text>
  </View>
);
const compiledAvatar = (
  <div className="flex size-8 items-center justify-center rounded-full bg-foreground/10">
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
            leadingSlot={nativeAvatar}
            title="Ada Lovelace"
            description="Last contact: 3 days ago"
            meta="12"
            onPress={openNative}
            actionSlot={
              <NativeButton size="sm" variant="outline" onPress={deleteNative} content="Delete" />
            }
          />
        </div>
      }
      compiled={
        <div className="compiled-root">
          <Compiled
            leadingSlot={compiledAvatar}
            title="Ada Lovelace"
            description="Last contact: 3 days ago"
            meta="12"
            onClick={openCompiled}
            actionSlot={
              <CompiledButton
                size="sm"
                variant="outline"
                onClick={deleteCompiled}
                content="Delete"
              />
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

const nativeTitle = (
  <View testID="composed-title" className="flex-row items-center gap-2">
    <Text className="font-medium text-foreground text-sm">Ada Lovelace</Text>
    <View testID="composed-badge" className="rounded-full bg-foreground/10 px-2 py-0.5">
      <Text className="text-foreground text-xs">Owner</Text>
    </View>
  </View>
);
const compiledTitle = (
  <div data-testid="composed-title" className="flex flex-row items-center gap-2">
    <span className="font-medium text-foreground text-sm">Ada Lovelace</span>
    <div data-testid="composed-badge" className="rounded-full bg-foreground/10 px-2 py-0.5">
      <span className="text-foreground text-xs">Owner</span>
    </div>
  </div>
);

/**
 * `title` and `description` are nodes, so an element has to be drawn as one (#287). A string
 * gets the row's `Text`; an element is placed as given, the way `meta` always was — inside a
 * `Text` it would lay out inline on device and lose its own styling.
 */
export const ComposedTitle: Story = {
  args: { title: "Ada Lovelace" },
  render: () => (
    <SideBySide
      native={<Native title={nativeTitle} description="ada@example.com" />}
      compiled={<Compiled title={compiledTitle} description="ada@example.com" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const section of sections) {
      // No title `Text` was wrapped around the element; the string description still has its own.
      await expect(
        section.querySelector('[data-slot="list-item-title"], [data-testid="list-item-title"]'),
      ).toBeNull();
      await expect(within(section).getByText("ada@example.com")).toBeInTheDocument();
      // The badge sits beside the name on the name's line, as the element laid it out.
      const name = within(section).getByText("Ada Lovelace").getBoundingClientRect();
      const badge = bounds(section, "composed-badge");
      await expect(badge.left).toBeGreaterThanOrEqual(name.right);
      await expect(badge.top).toBeLessThan(name.bottom);
    }
  },
};

/**
 * A row that goes somewhere is a link (#281): `href` for a URL no router owns, `linkSlot` for the
 * router's own link, which the middle is drawn inside. Either way it is an `<a href>` a middle
 * click opens, and the action beside it is still a control of its own.
 */
export const Link: Story = {
  args: { title: "Ada Lovelace" },
  render: () => (
    <SideBySide
      native={
        <div className="native-root flex flex-col gap-2">
          <Native title="Ada Lovelace" description="By href" href="#/people/ada" selected />
          <Native
            title="Grace Hopper"
            description="By the router's link"
            linkSlot={<a href="#/people/grace" />}
            actionSlot={<NativeButton size="sm" variant="outline" content="Delete" />}
          />
        </div>
      }
      compiled={
        <div className="compiled-root flex flex-col gap-2">
          <Compiled title="Ada Lovelace" description="By href" href="#/people/ada" selected />
          <Compiled
            title="Grace Hopper"
            description="By the router's link"
            linkSlot={<a href="#/people/grace" />}
            actionSlot={<CompiledButton size="sm" variant="outline" content="Delete" />}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const selector of [".native-root", ".compiled-root"]) {
      const root = canvasElement.querySelector<HTMLElement>(selector);
      if (!root) throw new Error(`${selector} should render`);
      const canvas = within(root);

      const ada = canvas.getByRole("link", { name: /Ada Lovelace/ });
      await expect(ada.tagName).toBe("A");
      await expect(ada).toHaveAttribute("href", "#/people/ada");
      await expect(ada).toHaveAttribute("aria-current", "page");

      const grace = canvas.getByRole("link", { name: /Grace Hopper/ });
      await expect(grace).toHaveAttribute("href", "#/people/grace");
      await expect(grace).not.toHaveAttribute("aria-current");
      // Laid out as the button row is: the title over its line, the action at the far end.
      const title = canvas.getByText("Grace Hopper").getBoundingClientRect();
      const line = canvas.getByText("By the router's link").getBoundingClientRect();
      await expect(line.top).toBeGreaterThanOrEqual(title.bottom - 1);
      const del = canvas.getByRole("button", { name: "Delete" });
      await expect(grace.contains(del)).toBe(false);
      await expect(del.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        grace.getBoundingClientRect().right,
      );
      await expect(canvas.queryByRole("button", { name: /Lovelace|Hopper/ })).toBeNull();
    }
  },
};
