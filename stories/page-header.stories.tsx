import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowLeft, Plus } from "lucide-react";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Input as CompiledInput } from "../compiled/input";
import { PageHeader as Compiled } from "../compiled/page-header";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import { PageHeader as Native, type PageHeaderSize } from "../registry/layout/page-header";
import { Button as NativeButton } from "../registry/ui/button";
import { Input as NativeInput } from "../registry/ui/input.tsx";
import { Tabs as NativeTabs, TabsContent, TabsList, TabsTrigger } from "../registry/ui/tabs.tsx";
import { SideBySide } from "./side-by-side";

/**
 * `PageHeader`'s title row has a floor, so a title with a tall action beside it and a title alone
 * sit at the same height. The row wraps, and what is checked here is that the floor centres its
 * one line on both halves, that under a back button it is no taller than the button, and that
 * `contentSlot` leaves its children at their own width.
 */
const meta = {
  title: "RN Parity/PageHeader",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The gap above and below `inner` inside `outer`, in pixels. */
function bands(outer: Element, inner: Element): { above: number; below: number } {
  const outerBox = outer.getBoundingClientRect();
  const innerBox = inner.getBoundingClientRect();
  return { above: innerBox.top - outerBox.top, below: outerBox.bottom - innerBox.bottom };
}

/** One part of a header, by its `data-slot` on the compiled half or its test id on the native. */
function part(scope: Element, slot: string): HTMLElement {
  const node = scope.querySelector<HTMLElement>(`[data-slot=${slot}], [data-testid=${slot}]`);
  if (node === null) {
    throw new Error(`No ${slot} in this header.`);
  }
  return node;
}

/**
 * A wrapping row packs its lines at the start under react-native-web, as Yoga does, so the title
 * sat at the top of its floor with an empty 28px band under it (#248).
 */
export const TitleOnly: Story = {
  args: { title: "Settings" },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    const pairs = [
      ["[data-testid=page-header-title-row]", "[data-testid=page-header-titles]"],
      ["[data-slot=page-header-title-row]", "[data-slot=page-header-titles]"],
    ] as const;

    for (const [rowSelector, titlesSelector] of pairs) {
      const row = canvasElement.querySelector(rowSelector);
      const titles = canvasElement.querySelector(titlesSelector);
      if (row === null || titles === null) {
        throw new Error(`No title row matches ${rowSelector}.`);
      }
      const { above, below } = bands(row, titles);
      await expect(above).toBeGreaterThan(0);
      await expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
    }
  },
};

/**
 * `size` apart from `level`: a page's `h1` drawn as small as a level-3 title, for a header that is
 * mostly controls. The rule still follows the level, so the page's header keeps its line.
 */
export const CompactTitleAtLevelOne: Story = {
  args: { title: "Chats", size: "sm" },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titles = canvas.getAllByRole("heading", { level: 1, name: "Chats" });
    await expect(titles).toHaveLength(2);

    for (const title of titles) {
      // A level-3 title's `text-base`, and the 40px row floor that goes with it.
      await expect(getComputedStyle(title).fontSize).toBe("16px");
      const header = title.closest<HTMLElement>(
        "[data-slot=page-header], [data-testid=page-header]",
      );
      const row = header?.querySelector<HTMLElement>(
        "[data-slot=page-header-title-row], [data-testid=page-header-title-row]",
      );
      if (!header || !row) {
        throw new Error("the title should be in its header's title row");
      }
      await expect(getComputedStyle(row).minHeight).toBe("40px");
      // Still the page's header: the rule under it is drawn.
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
    }
  },
};

const SIZES: PageHeaderSize[] = ["lg", "md", "sm"];

/** Each size's title, as the named type scale has it (#480): its size and its own line. */
const TITLE_TYPE: Record<PageHeaderSize, { fontSize: string; lineHeight: string }> = {
  lg: { fontSize: "24px", lineHeight: "32px" },
  md: { fontSize: "20px", lineHeight: "28px" },
  sm: { fontSize: "16px", lineHeight: "24px" },
};

/**
 * The three sizes are 24, 20 and 16px, four pixels apart (#483). At 20, 18 and 16px `md` and `sm`
 * were two pixels apart and read as one rank. A loading title's bar is the height of the line it
 * stands in for, so the header does not move when the name lands.
 */
export const ThreeTitleSizes: Story = {
  args: { title: "Workspaces" },
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col">
          {SIZES.flatMap((size) => [
            <Native key={size} size={size} title={`Native ${size}`} />,
            <div key={`${size}-loading`} data-loading={`native ${size}`}>
              <Native size={size} title="Loading" loading />
            </div>,
          ])}
        </div>
      }
      compiled={
        <div className="flex flex-col">
          {SIZES.flatMap((size) => [
            <Compiled key={size} size={size} title={`Compiled ${size}`} />,
            <div key={`${size}-loading`} data-loading={`compiled ${size}`}>
              <Compiled size={size} title="Loading" loading />
            </div>,
          ])}
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["Native", "Compiled"]) {
      for (const size of SIZES) {
        const title = canvas.getByRole("heading", { name: `${half} ${size}` });
        const { fontSize, lineHeight } = getComputedStyle(title);
        await expect({ size, fontSize, lineHeight }).toEqual({ size, ...TITLE_TYPE[size] });

        const loading = canvasElement.querySelector<HTMLElement>(
          `[data-loading="${half.toLowerCase()} ${size}"]`,
        );
        const bar = loading?.querySelector<HTMLElement>("[data-slot=skeleton], [aria-hidden=true]");
        if (!bar) {
          throw new Error(`the ${half} ${size} loading header should draw a bar`);
        }
        await expect({ size, bar: `${bar.getBoundingClientRect().height}px` }).toEqual({
          size,
          bar: lineHeight,
        });
      }
    }
  },
};

/** A detail page's headers at every size: a lone title, and the same title with a button. */
function DetailHeaders({ kit }: { kit: "native" | "compiled" }) {
  const [Header, Button] =
    kit === "native" ? [Native, NativeButton] : [Compiled, CompiledButton as typeof NativeButton];
  const back = (
    <Button variant="outline" size="icon-sm" aria-label="Back" iconSlot={<ArrowLeft />} />
  );
  return (
    <div className="flex flex-col">
      {SIZES.flatMap((size) => [
        <div key={`${size}-alone`} data-case={`${kit} ${size} alone`}>
          <Header size={size} title="Provider" backSlot={back} />
        </div>,
        <div key={`${size}-action`} data-case={`${kit} ${size} action`}>
          <Header
            size={size}
            title="Provider"
            backSlot={back}
            actionSlot={<Button size="sm" variant="info" iconSlot={<Plus />} content="New" />}
          />
        </div>,
      ])}
    </div>
  );
}

/**
 * Under a back button a lone title's row kept the floor it has without one, and centred the title
 * in it: an empty 26px band between the way back and the title at `lg` (#413). The row is now a
 * button's height, so the title sits one gap under the back button, and a header with an action
 * beside the title is as tall as one without.
 */
export const BackAndALoneTitle: Story = {
  args: { title: "Provider" },
  render: () => (
    <SideBySide
      native={<DetailHeaders kit="native" />}
      compiled={<DetailHeaders kit="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const cases = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-case]"));
    await expect(cases).toHaveLength(SIZES.length * 4);

    const heights = new Map<string, number>();
    for (const box of cases) {
      const header = part(box, "page-header");
      const back = part(box, "page-header-breadcrumbs").getBoundingClientRect();
      const row = part(box, "page-header-title-row").getBoundingClientRect();
      const title = part(box, "page-header-titles").getBoundingClientRect();
      const gap = Number.parseFloat(getComputedStyle(header).rowGap);

      // No band between the way back and the title: just the header's own gap.
      await expect(title.top - back.bottom).toBeCloseTo(gap, 0);
      // The title row is no taller than the back button's row.
      await expect(row.height).toBeLessThanOrEqual(back.height);
      heights.set(box.dataset.case ?? "", header.getBoundingClientRect().height);
    }

    // With an action or without, a detail page's body starts at the same place.
    for (const kit of ["native", "compiled"]) {
      for (const size of SIZES) {
        await expect(heights.get(`${kit} ${size} alone`)).toBe(
          heights.get(`${kit} ${size} action`),
        );
      }
    }
  },
};

/** A settings header: tabs under the title, and a search field on the line under them. */
function TabbedHeader({ kit }: { kit: "native" | "compiled" }) {
  const [Header, Root, List, Trigger, Panel, Field] =
    kit === "native"
      ? [Native, NativeTabs, TabsList, TabsTrigger, TabsContent, NativeInput]
      : [
          Compiled,
          CompiledTabs as typeof NativeTabs,
          CompiledTabsList as typeof TabsList,
          CompiledTabsTrigger as typeof TabsTrigger,
          CompiledTabsContent as typeof TabsContent,
          CompiledInput as typeof NativeInput,
        ];
  return (
    <Root defaultValue="general">
      <Header
        title="Settings"
        contentSlot={
          <>
            <List aria-label={`${kit} sections`}>
              <Trigger value="general">General</Trigger>
              <Trigger value="agents">Agents</Trigger>
            </List>
            <Field aria-label={`${kit} search`} placeholder="Search settings" />
          </>
        }
      />
      {["General", "Agents"].map((name) => (
        <Panel key={name} value={name.toLowerCase()}>
          {kit === "native" ? (
            <Text className="px-4 text-foreground">{name}</Text>
          ) : (
            <p className="px-4 text-foreground">{name}</p>
          )}
        </Panel>
      ))}
    </Root>
  );
}

/**
 * Tabs in `contentSlot` sit at their own width, at the start of the line, as they do everywhere
 * else. The slot stretched its children, so a tab list ran the header's width with its two tabs
 * centred in it (#414). A search field is `w-full` and still fills the line.
 */
export const TabsAtTheirOwnWidth: Story = {
  args: { title: "Settings" },
  render: () => (
    <SideBySide native={<TabbedHeader kit="native" />} compiled={<TabbedHeader kit="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const kit of ["native", "compiled"]) {
      const tabs = canvas.getByRole("tablist", { name: `${kit} sections` });
      const search = canvas.getByRole("textbox", { name: `${kit} search` });
      const header = tabs.closest<HTMLElement>(
        "[data-slot=page-header], [data-testid=page-header]",
      );
      if (header === null) {
        throw new Error("The tabs should be in their header.");
      }
      const line = part(header, "page-header-content").getBoundingClientRect();
      const list = tabs.getBoundingClientRect();

      await expect(list.left).toBeCloseTo(line.left, 0);
      // Two short tabs are far narrower than a 300-odd pixel line.
      await expect(list.width).toBeLessThan(line.width / 2);
      await expect(search.getBoundingClientRect().width).toBeCloseTo(line.width, 0);
    }
  },
};

/**
 * Slots of no elements are no slots (#483): `filters.map(…)` over no filters is `[]`, which drew
 * an empty row under the title and took the rule away with it. Here every optional slot is `[]`,
 * and the header is the title alone, ruled, on both halves.
 */
export const EmptyArraySlots: Story = {
  args: { title: "Servers", contentSlot: [], actionSlot: [], iconSlot: [], backSlot: [] },
  render: (args) => <SideBySide native={<Native {...args} />} compiled={<Compiled {...args} />} />,
  play: async ({ canvasElement }) => {
    for (const attribute of ["data-testid", "data-slot"]) {
      const header = canvasElement.querySelector(`[${attribute}=page-header]`);
      if (header === null) {
        throw new Error(`No header matches ${attribute}.`);
      }
      await expect(getComputedStyle(header).borderBottomWidth).toBe("1px");
      for (const part of ["page-header-content", "page-header-action", "page-header-breadcrumbs"]) {
        await expect(header.querySelector(`[${attribute}=${part}]`)).toBeNull();
      }
    }
  },
};
