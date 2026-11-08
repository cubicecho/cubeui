import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pressable, Text, View } from "react-native";
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
import { ListItem as CompiledListItem } from "../compiled/list-item";
import { ListItem as NativeListItem } from "../registry/layout/list-item";
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
} from "../registry/ui/item.tsx";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * shadcn's `Item` parts drawn by either half: the native source under react-native-web on the
 * left, the web half — shadcn's markup — on the right. The same call site, part for part. The
 * native file is imported as `item.tsx` by name because the harness resolves `.web.tsx` first, and
 * a bare `item` would put the web half on both sides.
 */
const meta = { title: "RN Parity/Item" } satisfies Meta;
export default meta;
type Story = StoryObj;

function slot(root: HTMLElement, name: string) {
  const el = root.querySelector<HTMLElement>(`[data-slot="${name}"], [data-testid="${name}"]`);
  if (!el) {
    throw new Error(`${name} should render`);
  }
  return el;
}

function rootOf(canvasElement: HTMLElement, selector: string) {
  const root = canvasElement.querySelector<HTMLElement>(selector);
  if (!root) {
    throw new Error(`${selector} should render`);
  }
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
              <Text className="font-semibold text-foreground text-xs">AL</Text>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Ada Lovelace</ItemTitle>
              <ItemDescription>Wrote the first published program.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <NativeButton size="sm" variant="outline" onPress={archiveNative} content="Archive" />
            </ItemActions>
          </Item>
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 360 }}>
          <CompiledItem variant="outline">
            <CompiledItemMedia variant="icon">
              <span className="font-semibold text-foreground text-xs">AL</span>
            </CompiledItemMedia>
            <CompiledItemContent>
              <CompiledItemTitle>Ada Lovelace</CompiledItemTitle>
              <CompiledItemDescription>Wrote the first published program.</CompiledItemDescription>
            </CompiledItemContent>
            <CompiledItemActions>
              <CompiledButton
                size="sm"
                variant="outline"
                onClick={archiveCompiled}
                content="Archive"
              />
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
    if (!native || !compiled) {
      throw new Error("both titles should render");
    }
    await expect(getComputedStyle(compiled).fontSize).toBe(getComputedStyle(native).fontSize);
    await expect(getComputedStyle(compiled).fontWeight).toBe(getComputedStyle(native).fontWeight);
    await expect(getComputedStyle(compiled).color).toBe(getComputedStyle(native).color);
    const [n, c] = boxes;
    if (!n?.row || !n.title || !c?.row || !c.title) {
      throw new Error("both rows should measure");
    }
    await expect(Math.abs(n.title.left - n.row.left - (c.title.left - c.row.left))).toBeLessThan(1);
    await expect(Math.abs(n.title.top - n.row.top - (c.title.top - c.row.top))).toBeLessThan(1);
    // The description is the same two clipped lines on both.
    const [nd, cd] = [".native-root", ".compiled-root"].map((selector) =>
      slot(rootOf(canvasElement, selector), "item-description").getBoundingClientRect(),
    );
    if (!nd || !cd) {
      throw new Error("both descriptions should measure");
    }
    await expect(Math.abs(nd.height - cd.height)).toBeLessThan(2);
    await expect(Math.abs(nd.width - cd.width)).toBeLessThan(2);
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
          <Item asChild selected size="sm">
            <Pressable role="button" aria-current onPress={openNative}>
              <ItemContent>
                <ItemTitle>Open the run</ItemTitle>
              </ItemContent>
            </Pressable>
          </Item>
        </div>
      }
      compiled={
        <div className="compiled-root" style={{ width: 360 }}>
          <CompiledItem asChild selected size="sm">
            <a href="#run" aria-current="page">
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
    // The row's classes reached the child: it is the padded, tinted surface, at `sm` with
    // `ListItem`'s 12px.
    await expect(getComputedStyle(target).paddingLeft).toBe("12px");
    await userEvent.click(target);
    await expect(openNative).toHaveBeenCalledTimes(1);

    const link = within(rootOf(canvasElement, ".compiled-root")).getByRole("link", {
      name: "Open the run",
    });
    await expect(link).toHaveAttribute("data-slot", "item");
    await expect(getComputedStyle(link).paddingLeft).toBe("12px");

    // `selected` is the `active` tint on both halves, and not the hover grey.
    await expect(link).toHaveAttribute("data-selected");
    const tint = getComputedStyle(link).backgroundColor;
    await expect(tint).toMatch(/\/ 0\.4\)$/);
    await expect(getComputedStyle(target).backgroundColor).toBe(tint);
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
      if (!first) {
        throw new Error("the rows should render");
      }
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

const nativeInitial = (
  <View className="size-8 items-center justify-center rounded-full bg-foreground/10">
    <Text className="font-semibold text-foreground text-xs">AL</Text>
  </View>
);
const compiledInitial = (
  <div className="flex size-8 items-center justify-center rounded-full bg-foreground/10">
    <span className="font-semibold text-foreground text-xs">AL</span>
  </div>
);

/** Where each of a row's parts sits, measured from the row's own corner. */
function layoutOf(row: HTMLElement) {
  const box = row.getBoundingClientRect();
  const at = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - box.left, top: r.top - box.top, right: box.right - r.right };
  };
  const title = within(row).getByText("Ada Lovelace");
  const description = within(row).getByText("Last contact: 3 days ago");
  const initial = within(row).getByText("AL").parentElement as Element;
  const button = within(row).getByRole("button", { name: "Archive" });
  return {
    height: box.height,
    initial: at(initial),
    title: at(title),
    description: at(description),
    button: at(button),
    titleSize: getComputedStyle(title).fontSize,
    titleLine: getComputedStyle(title).lineHeight,
    descriptionSize: getComputedStyle(description).fontSize,
    descriptionLine: getComputedStyle(description).lineHeight,
  };
}

/**
 * `size="sm"` is `ListItem`'s row (#475): `ListItem` is these parts at that size, so a row
 * composed from them by hand lines up with a `ListItem` beside it, part for part, on both halves.
 * `default` stays shadcn's.
 */
export const SmallIsListItem: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="native-root flex flex-col gap-2" style={{ width: 360 }}>
          <div className="list-item-row">
            <NativeListItem
              leadingSlot={nativeInitial}
              title="Ada Lovelace"
              description="Last contact: 3 days ago"
              actionSlot={<NativeButton size="sm" variant="outline" content="Archive" />}
            />
          </div>
          <div className="item-row">
            <Item size="sm">
              <ItemMedia>{nativeInitial}</ItemMedia>
              <ItemContent>
                <ItemTitle>Ada Lovelace</ItemTitle>
                <ItemDescription>Last contact: 3 days ago</ItemDescription>
              </ItemContent>
              <ItemActions>
                <NativeButton size="sm" variant="outline" content="Archive" />
              </ItemActions>
            </Item>
          </div>
        </div>
      }
      compiled={
        <div className="compiled-root flex flex-col gap-2" style={{ width: 360 }}>
          <div className="list-item-row">
            <CompiledListItem
              leadingSlot={compiledInitial}
              title="Ada Lovelace"
              description="Last contact: 3 days ago"
              actionSlot={<CompiledButton size="sm" variant="outline" content="Archive" />}
            />
          </div>
          <div className="item-row">
            <CompiledItem size="sm">
              <CompiledItemMedia>{compiledInitial}</CompiledItemMedia>
              <CompiledItemContent>
                <CompiledItemTitle>Ada Lovelace</CompiledItemTitle>
                <CompiledItemDescription>Last contact: 3 days ago</CompiledItemDescription>
              </CompiledItemContent>
              <CompiledItemActions>
                <CompiledButton size="sm" variant="outline" content="Archive" />
              </CompiledItemActions>
            </CompiledItem>
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const selector of [".native-root", ".compiled-root"]) {
      const root = rootOf(canvasElement, selector);
      const listItem = layoutOf(rootOf(root, ".list-item-row").firstElementChild as HTMLElement);
      const item = layoutOf(rootOf(root, ".item-row").firstElementChild as HTMLElement);
      await expect(item.titleSize).toBe(listItem.titleSize);
      await expect(item.titleLine).toBe(listItem.titleLine);
      await expect(item.descriptionSize).toBe(listItem.descriptionSize);
      await expect(item.descriptionLine).toBe(listItem.descriptionLine);
      await expect(Math.abs(item.height - listItem.height)).toBeLessThan(0.5);
      for (const part of ["initial", "title", "description", "button"] as const) {
        await expect(Math.abs(item[part].left - listItem[part].left)).toBeLessThan(0.5);
        await expect(Math.abs(item[part].top - listItem[part].top)).toBeLessThan(0.5);
      }
      await expect(Math.abs(item.button.right - listItem.button.right)).toBeLessThan(0.5);
    }
  },
};

/**
 * A link in a description is `info` at rest, as every link is, and not only under the pointer
 * (#484). On a chosen row it is `foreground`, as the line around it is: `info` on the `active`
 * tint is about 3.3:1. The underline marks it either way.
 *
 * The web half only: a descendant selector is the web's, and on device the link is the caller's
 * own `Text`, which carries its colour itself.
 */
export const LinkInDescription: Story = {
  render: () => (
    <div className="compiled-root flex flex-col gap-2" style={{ width: 360 }}>
      <CompiledItem size="sm">
        <CompiledItemContent>
          <CompiledItemTitle>Nightly backup</CompiledItemTitle>
          <CompiledItemDescription>
            Failed at 02:00. <a href="#logs">Read the logs</a>
          </CompiledItemDescription>
        </CompiledItemContent>
      </CompiledItem>
      <CompiledItem size="sm" selected>
        <CompiledItemContent>
          <CompiledItemTitle>Weekly backup</CompiledItemTitle>
          <CompiledItemDescription>
            Ran on Sunday. <a href="#report">Open the report</a>
          </CompiledItemDescription>
        </CompiledItemContent>
      </CompiledItem>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = within(rootOf(canvasElement, ".compiled-root"));
    const atRest = root.getByRole("link", { name: "Read the logs" });
    await expect(getComputedStyle(atRest).color).toBe(tokenColor("info"));
    await expect(getComputedStyle(atRest).textDecorationLine).toBe("underline");

    const onChosen = root.getByRole("link", { name: "Open the report" });
    await expect(getComputedStyle(onChosen).color).toBe(tokenColor("foreground"));
    await expect(getComputedStyle(onChosen).textDecorationLine).toBe("underline");
  },
};
