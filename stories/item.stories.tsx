import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pressable, Text } from "react-native";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  Item as CompiledItem,
  ItemActions as CompiledItemActions,
  ItemContent as CompiledItemContent,
  ItemDescription as CompiledItemDescription,
  ItemFooter as CompiledItemFooter,
  ItemGroup as CompiledItemGroup,
  ItemMedia as CompiledItemMedia,
  ItemSeparator as CompiledItemSeparator,
  ItemTitle as CompiledItemTitle,
} from "../compiled/item";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../registry/ui/item";
import { SideBySide } from "./side-by-side";

/**
 * shadcn's `Item` parts drawn by either half: the native source under react-native-web on the
 * left, the web half — shadcn's markup — on the right. The same call site, part for part.
 */
const meta = { title: "Stage 0/Item" } satisfies Meta;
export default meta;
type Story = StoryObj;

function slot(root: HTMLElement, name: string) {
  const el = root.querySelector<HTMLElement>(`[data-slot="${name}"], [data-testid="${name}"]`);
  if (!el) throw new Error(`${name} should render`);
  return el;
}

function rootOf(canvasElement: HTMLElement, selector: string) {
  const root = canvasElement.querySelector<HTMLElement>(selector);
  if (!root) throw new Error(`${selector} should render`);
  return root;
}

const archiveNative = fn();
const archiveCompiled = fn();

/** A bordered row: an initial in an icon tile, a title over a line, a button at the far end. */
export const Outline: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 360 }}>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <Text className="font-medium text-foreground text-xs">AL</Text>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Ada Lovelace</ItemTitle>
              <ItemDescription>Wrote the first published program.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <NativeButton size="sm" variant="outline" onPress={archiveNative}>
                Archive
              </NativeButton>
            </ItemActions>
          </Item>
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 360 }}>
          <CompiledItem variant="outline">
            <CompiledItemMedia variant="icon">
              <span className="font-medium text-foreground text-xs">AL</span>
            </CompiledItemMedia>
            <CompiledItemContent>
              <CompiledItemTitle>Ada Lovelace</CompiledItemTitle>
              <CompiledItemDescription>Wrote the first published program.</CompiledItemDescription>
            </CompiledItemContent>
            <CompiledItemActions>
              <CompiledButton size="sm" variant="outline" onClick={archiveCompiled}>
                Archive
              </CompiledButton>
            </CompiledItemActions>
          </CompiledItem>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const cases = [
      { selector: ".native-root", archive: archiveNative },
      { selector: ".compiled-root", archive: archiveCompiled },
    ];
    const boxes: Record<string, DOMRect>[] = [];
    for (const { selector, archive } of cases) {
      const root = rootOf(canvasElement, selector);
      const row = slot(root, "item").getBoundingClientRect();
      const media = slot(root, "item-media").getBoundingClientRect();
      const title = within(root).getByText("Ada Lovelace").getBoundingClientRect();
      const description = slot(root, "item-description").getBoundingClientRect();
      const actions = slot(root, "item-actions").getBoundingClientRect();

      // Media, then the title over the description, then the actions at the far end — one row.
      await expect(media.right).toBeLessThanOrEqual(title.left);
      await expect(description.top).toBeGreaterThanOrEqual(title.bottom - 1);
      await expect(actions.left).toBeGreaterThan(title.right);
      await expect(row.right - actions.right).toBeLessThanOrEqual(17);
      // The icon tile is shadcn's `size-8`.
      await expect(media.width).toBe(32);

      archive.mockClear();
      await userEvent.click(within(root).getByRole("button", { name: "Archive" }));
      await expect(archive).toHaveBeenCalledTimes(1);
      boxes.push({ row, title });
    }

    // The two halves draw the title alike, at the same inset from the row.
    const [native, compiled] = cases.map(({ selector }) =>
      within(rootOf(canvasElement, selector)).getByText("Ada Lovelace"),
    );
    if (!native || !compiled) throw new Error("both titles should render");
    await expect(getComputedStyle(compiled).fontSize).toBe(getComputedStyle(native).fontSize);
    await expect(getComputedStyle(compiled).fontWeight).toBe(getComputedStyle(native).fontWeight);
    await expect(getComputedStyle(compiled).color).toBe(getComputedStyle(native).color);
    const [n, c] = boxes;
    if (!n?.row || !n.title || !c?.row || !c.title) throw new Error("both rows should measure");
    await expect(Math.abs(n.title.left - n.row.left - (c.title.left - c.row.left))).toBeLessThan(1);
    await expect(Math.abs(n.row.height - c.row.height)).toBeLessThan(2);
  },
};

const openNative = fn();

/**
 * `asChild` hands the row to its one child — here a `Pressable`, so the whole row is the target.
 * On the web the same prop puts the row on an `<a>` or a `<button>`.
 */
export const AsChild: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 360 }}>
          <Item asChild variant="muted" size="sm">
            <Pressable role="button" onPress={openNative}>
              <ItemContent>
                <ItemTitle>Open the run</ItemTitle>
              </ItemContent>
            </Pressable>
          </Item>
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 360 }}>
          <CompiledItem asChild variant="muted" size="sm">
            <a href="#run">
              <CompiledItemContent>
                <CompiledItemTitle>Open the run</CompiledItemTitle>
              </CompiledItemContent>
            </a>
          </CompiledItem>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const native = within(rootOf(canvasElement, ".native-root"));
    const target = native.getByRole("button", { name: "Open the run" });
    // The row's classes reached the child: it is the padded, filled surface.
    await expect(getComputedStyle(target).paddingLeft).toBe("16px");
    await userEvent.click(target);
    await expect(openNative).toHaveBeenCalledTimes(1);

    const link = within(rootOf(canvasElement, ".compiled-root")).getByRole("link", {
      name: "Open the run",
    });
    await expect(link).toHaveAttribute("data-slot", "item");
    await expect(getComputedStyle(link).paddingLeft).toBe("16px");
  },
};

/** Rows in a group with a rule between them, and a footer line that takes the row's full width. */
export const GroupAndFooter: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="native-root" style={{ width: 360 }}>
          <ItemGroup>
            <Item>
              <ItemContent>
                <ItemTitle>First</ItemTitle>
              </ItemContent>
              <ItemFooter>Three files changed</ItemFooter>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemContent>
                <ItemTitle>Second</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 360 }}>
          <CompiledItemGroup>
            <CompiledItem>
              <CompiledItemContent>
                <CompiledItemTitle>First</CompiledItemTitle>
              </CompiledItemContent>
              <CompiledItemFooter>Three files changed</CompiledItemFooter>
            </CompiledItem>
            <CompiledItemSeparator />
            <CompiledItem>
              <CompiledItemContent>
                <CompiledItemTitle>Second</CompiledItemTitle>
              </CompiledItemContent>
            </CompiledItem>
          </CompiledItemGroup>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const selector of [".native-root", ".compiled-root"]) {
      const root = rootOf(canvasElement, selector);
      const first = root.querySelector<HTMLElement>('[data-slot="item"], [data-testid="item"]');
      if (!first) throw new Error("the rows should render");
      const footer = slot(root, "item-footer").getBoundingClientRect();
      const title = within(root).getByText("First").getBoundingClientRect();
      const inner = first.getBoundingClientRect();
      // The footer is its own line under the title, as wide as the row's content box.
      await expect(footer.top).toBeGreaterThanOrEqual(title.bottom);
      await expect(footer.width).toBeGreaterThan(inner.width - 40);

      // A decorative rule: one pixel, and nothing a screen reader stops on.
      const rule = slot(root, "item-separator");
      await expect(rule.getBoundingClientRect().height).toBe(1);
      await expect(within(root).queryByRole("separator")).toBeNull();
    }
  },
};
