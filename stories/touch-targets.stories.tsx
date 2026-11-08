import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect } from "react";
import { Platform, View } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CollapsibleRow as CompiledCollapsibleRow } from "../compiled/collapsible-row";
import { ListItem as CompiledListItem } from "../compiled/list-item";
import { Collapsible } from "../registry/layout/collapsible";
import { CollapsibleRow } from "../registry/layout/collapsible-row";
import { FileTree } from "../registry/layout/file-tree";
import { ListItem } from "../registry/layout/list-item";
import { AppBarItem, SidebarItem } from "../registry/layout/sidebar";
import { AppBarEdgeContext } from "../registry/layout/split-layout";
import { Badge } from "../registry/ui/badge.tsx";
import { Button } from "../registry/ui/button";
import { Checkbox } from "../registry/ui/checkbox.tsx";
import { CopyButtonView } from "../registry/ui/copy-button-view";
import { DescriptionHint } from "../registry/ui/description-hint";
import { Form, useAppForm } from "../registry/ui/form";
import { FileText, Folder, Library, Server, Settings } from "../registry/ui/icons";
import { RadioGroup, RadioGroupItem } from "../registry/ui/radio-group";
import { SegmentedButton, SegmentedGroup } from "../registry/ui/segmented";
import { Switch } from "../registry/ui/switch.tsx";
import { Tabs, TabsList, TabsTrigger } from "../registry/ui/tabs.tsx";
import { ToastProvider, useToast } from "../registry/ui/toast";
import { ToggleChip } from "../registry/ui/toggle-chip";

/**
 * A finger's 44pt (#470). On device every control is 44pt or more each way: a row by being that
 * tall, a small control by a `hitSlop` around the size it is drawn at, so its look does not grow.
 * The web keeps its drawn sizes.
 *
 * A device has no browser to run in, and `Platform.OS` is `web` under react-native-web, so the
 * device story turns it to `ios` while it renders — `touchTarget` and `touchRowClass` read it as a
 * control is drawn — and measures each pressable's box with the `hitSlop` its `Pressable` was
 * handed, read off the React tree, since react-native-web draws no `hitSlop`. What it cannot hold
 * is that a device delivers the touch: a `hitSlop` stops at a `ScrollView`'s or an
 * `overflow-hidden` box's edge, and on Android at the parent's. That needs a phone.
 */
const meta = { title: "RN Parity/Touch targets" } satisfies Meta;
export default meta;
type Story = StoryObj;

const TOUCH = 44;
/** `icon-xs` reaches 4px a side and no further, short of a neighbour 4px away: 36 by 44. */
const ICON_XS_WIDTH = 36;
/** A web `ListItem` with one line of title: the 20px line and `Item`'s `py-2`. */
const WEB_ROW_HEIGHT = 36;
/** Sub-pixel layout leaves a measured box a hair off its class. */
const SLACK = 0.5;

type Insets = { top: number; bottom: number; left: number; right: number };
const NONE: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

type Fiber = {
  memoizedProps?: unknown;
  elementType?: { displayName?: string } | null;
  type?: { displayName?: string } | null;
  return?: Fiber | null;
};

function insets(value: unknown): Insets {
  if (typeof value === "number") {
    return { top: value, bottom: value, left: value, right: value };
  }
  if (value === null || typeof value !== "object") {
    return NONE;
  }
  return { ...NONE, ...(value as Partial<Insets>) };
}

/**
 * The `hitSlop` the element's own `Pressable` was handed: up the React tree from the DOM node to
 * the nearest component given one, stopping at the `Pressable` itself so an ancestor's is not read.
 */
function hitSlopOf(element: Element): Insets {
  const key = Object.keys(element).find((name) => name.startsWith("__reactFiber$"));
  let fiber = key ? (element as unknown as Record<string, Fiber>)[key] : undefined;
  while (fiber) {
    const props = fiber.memoizedProps;
    if (props !== null && typeof props === "object" && "hitSlop" in props) {
      return insets((props as { hitSlop: unknown }).hitSlop);
    }
    const name = fiber.elementType?.displayName ?? fiber.type?.displayName;
    if (name === "Pressable") {
      return NONE;
    }
    fiber = fiber.return ?? undefined;
  }
  return NONE;
}

/**
 * The element's box and its `hitSlop` together reach `width` by `height`. A `width` of `null` is a
 * control with words in it, which sits beside others and is as wide as its label: only its height
 * is grown.
 */
async function expectReach(element: Element, width: number | null = TOUCH, height = TOUCH) {
  const box = element.getBoundingClientRect();
  const slop = hitSlopOf(element);
  const name = element.getAttribute("aria-label") ?? element.textContent ?? element.tagName;
  if (width !== null) {
    await expect(box.width + slop.left + slop.right, `${name}: width`).toBeGreaterThanOrEqual(
      width - SLACK,
    );
  }
  await expect(box.height + slop.top + slop.bottom, `${name}: height`).toBeGreaterThanOrEqual(
    height - SLACK,
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function RaiseOnMount() {
  const toast = useToast();
  useEffect(() => {
    toast("Saved.", "positive");
  }, [toast]);
  return null;
}

function BoundCheckbox() {
  const form = useAppForm({ defaultValues: { done: false }, onSubmit: () => {} });
  return (
    <form.AppForm>
      <Form>
        <form.AppField name="done">{(field) => <field.CheckboxField label="Done" />}</form.AppField>
      </Form>
    </form.AppForm>
  );
}

const write = () => Promise.resolve();

/**
 * Every small control and every row, drawn as a device draws them. Each pressable reaches 44 by 44
 * with its `hitSlop`; `icon-xs` reaches 36 by 44, its documented exception. A tab is 44pt tall
 * itself, in a list that grows to hold it. The bottom bar's places share the bar, and a bound
 * checkbox's caption presses its box.
 */
export const OnDevice: Story = {
  beforeEach: () => {
    const platform = Platform as { OS: string };
    const before = platform.OS;
    platform.OS = "ios";
    return () => {
      platform.OS = before;
    };
  },
  render: () => (
    <ToastProvider>
      <RaiseOnMount />
      <div
        className="bg-background p-4"
        style={{ display: "flex", flexDirection: "column", gap: 24, width: 390 }}
      >
        <Section title="Controls">
          <Checkbox accessibilityLabel="Box" />
          <Switch accessibilityLabel="Wi-Fi" checked={false} onCheckedChange={() => {}} />
          <ToggleChip>Chip</ToggleChip>
          <ToggleChip size="sm">Small chip</ToggleChip>
          <SegmentedGroup aria-label="Range" value="day" onValueChange={() => {}}>
            <SegmentedButton value="day">Day</SegmentedButton>
            <SegmentedButton value="week">Week</SegmentedButton>
          </SegmentedGroup>
          <SegmentedGroup aria-label="Plain" variant="plain" value="all" onValueChange={() => {}}>
            <SegmentedButton value="all">All</SegmentedButton>
            <SegmentedButton value="open">Open</SegmentedButton>
          </SegmentedGroup>
        </Section>
        <Section title="Radio groups">
          <RadioGroup aria-label="Rows" value="a" onValueChange={() => {}}>
            <RadioGroupItem value="a" label="Row option" />
            <RadioGroupItem value="b" label="Other row" />
          </RadioGroup>
          <RadioGroup aria-label="Bare" value="a" onValueChange={() => {}}>
            <RadioGroupItem value="a" aria-label="Bare option" />
          </RadioGroup>
          <RadioGroup aria-label="Theme" variant="segmented" value="light" onValueChange={() => {}}>
            <RadioGroupItem value="light" label="Light" />
            <RadioGroupItem value="dark" label="Dark" />
          </RadioGroup>
        </Section>
        <Section title="Buttons">
          <Button content="Default" />
          <Button size="sm" content="Small" />
          <Button size="xs" content="Extra small" />
          <Button size="lg" content="Large" />
          <Button size="icon" aria-label="Icon" iconSlot={<Settings />} />
          <Button size="icon-sm" aria-label="Icon small" iconSlot={<Settings />} />
          <Button size="icon-xs" aria-label="Icon extra small" iconSlot={<Settings />} />
          <Button size="icon-lg" aria-label="Icon large" iconSlot={<Settings />} />
          <CopyButtonView write={write} value="token" />
          <DescriptionHint label="Due" fallbackName="About this field" description="When." />
          <Badge onRemove={() => {}} removeLabel="Remove tag">
            Tag
          </Badge>
        </Section>
        <Section title="Tabs">
          <Tabs defaultValue="list">
            <TabsList aria-label="View">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        </Section>
        <Section title="Bars">
          <AppBarItem label="Home" iconSlot={<Library />} active />
          <AppBarEdgeContext.Provider value="bottom">
            <View
              testID="bottom-bar"
              className="w-full flex-row items-center justify-around gap-1 px-4"
            >
              <AppBarItem label="Inbox" iconSlot={<FileText />} active />
              <AppBarItem label="Files" iconSlot={<Folder />} />
              <AppBarItem label="Servers" iconSlot={<Server />} />
            </View>
          </AppBarEdgeContext.Provider>
        </Section>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SidebarItem label="Documents" onPress={() => {}} />
          <ListItem title="Ada Lovelace" onPress={() => {}} />
          <CollapsibleRow title="Run 41" open={false} onOpenChange={() => {}} />
          <Collapsible title="Completed (3)" contentSlot={<View />} />
          <FileTree
            label="Files"
            entries={[
              { path: "notes.md", type: "file" },
              { path: "docs", type: "dir" },
            ]}
            onSelect={() => {}}
          />
          <BoundCheckbox />
        </div>
      </div>
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);

    for (const name of ["Box", "Bare option"]) {
      await expectReach(canvas.getByRole(name === "Box" ? "checkbox" : "radio", { name }));
    }
    await expectReach(canvas.getByRole("switch", { name: "Wi-Fi" }));
    for (const name of ["Chip", "Small chip", "Day", "Week", "All", "Open"]) {
      await expectReach(canvas.getByRole("button", { name }), null);
    }
    for (const name of ["Row option", "Other row", "Light", "Dark"]) {
      await expectReach(canvas.getByRole("radio", { name }));
    }
    for (const name of ["Default", "Small", "Extra small", "Large"]) {
      await expectReach(canvas.getByRole("button", { name }), null);
    }
    for (const name of ["Icon", "Icon small", "Icon large", "Copy", "Remove tag"]) {
      await expectReach(canvas.getByRole("button", { name }));
    }
    for (const name of ["Icon extra small", "About Due"]) {
      await expectReach(canvas.getByRole("button", { name }), ICON_XS_WIDTH);
    }
    await expectReach(await page.findByRole("button", { name: "Dismiss" }));

    // A tab is 44pt itself, inside its list (#521): the list's scroller clips a touch at its edge,
    // so a `hitSlop` there would reach nothing, and the list grows to hold the tab instead.
    const tablist = canvas.getByRole("tablist", { name: "View" }).getBoundingClientRect();
    for (const name of ["List", "Board"]) {
      const tab = canvas.getByRole("tab", { name });
      await expect(hitSlopOf(tab)).toEqual(NONE);
      await expectReach(tab, null);
      const box = tab.getBoundingClientRect();
      await expect(box.top, `${name}: top`).toBeGreaterThanOrEqual(tablist.top);
      await expect(box.bottom, `${name}: bottom`).toBeLessThanOrEqual(tablist.bottom);
    }

    // The bar's places: 44pt in the top bar, and each its whole share along the bottom.
    await expectReach(canvas.getByRole("link", { name: "Home" }));
    const bar = canvas.getByTestId("bottom-bar").getBoundingClientRect();
    const places = ["Inbox", "Files", "Servers"].map((name) => canvas.getByRole("link", { name }));
    const share = bar.width / places.length;
    for (const place of places) {
      await expectReach(place);
      await expect(place.getBoundingClientRect().width).toBeGreaterThan(share - TOUCH / 2);
    }
    // The look inside each stays the 36pt square, an `icon-sm` action's (#483).
    for (const look of canvas.getAllByTestId("app-bar-item-look")) {
      await expect(Math.round(look.getBoundingClientRect().width)).toBe(36);
    }

    // Rows stack too close for a `hitSlop`: each is 44pt tall itself.
    await expectReach(canvas.getByRole("button", { name: "Documents" }));
    for (const id of [
      "list-item-body",
      "collapsible-row-trigger",
      "collapsible-trigger",
      "file-tree-file",
      "file-tree-folder",
    ]) {
      await expectReach(canvas.getByTestId(id));
    }

    // A bound checkbox's caption presses its box, as a `<label htmlFor>` does on the web.
    const box = canvas.getByRole("checkbox", { name: "Done" });
    await expect(box).toHaveAttribute("aria-checked", "false");
    await userEvent.click(canvas.getByTestId("field-label-press"));
    await waitFor(() => expect(box).toHaveAttribute("aria-checked", "true"));
  },
};

const noop = () => {};
const leading = <View className="size-4 rounded-full bg-foreground/10" />;
const action = <Button size="icon-xs" aria-label="Edit" iconSlot={<Settings />} />;

/**
 * On each half: a title alone, then a leading slot and an action, then a row that opens. The
 * compiled `ListItem` is pressed through `onClick`, the web's word.
 */
const WEB_ROWS: ReactNode[] = [
  <ListItem key="native-plain" title="Ada Lovelace" onPress={noop} />,
  <ListItem
    key="native-lead"
    title="Grace Hopper"
    onPress={noop}
    leadingSlot={leading}
    actionSlot={action}
  />,
  <CompiledListItem key="compiled-plain" title="Ada Lovelace" onClick={noop} />,
  <CompiledListItem
    key="compiled-lead"
    title="Grace Hopper"
    onClick={noop}
    leadingSlot={leading}
    actionSlot={action}
  />,
  <CollapsibleRow key="native-opens" title="Run 41" open={false} onOpenChange={noop} />,
  <CompiledCollapsibleRow key="compiled-opens" title="Run 41" open={false} onOpenChange={noop} />,
];

/**
 * A row lights as a whole, so it is pressed as a whole (#470): the pressed part reaches the row's
 * top and bottom, and its start and end where no leading slot or action holds them. It was inset by
 * the row's own padding, and a 54px row was a 38px target. The row is drawn as it was: a line of
 * title is still a 36px row on the web.
 */
export const RowsPressWhereTheyLight: Story = {
  render: () => (
    <div
      className="bg-background p-4"
      style={{ display: "flex", flexDirection: "column", gap: 8, width: 390 }}
    >
      {WEB_ROWS}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const slots = Array.from(canvasElement.querySelectorAll("[data-testid], [data-slot]"));
    const named = (name: string) =>
      slots.filter(
        (node) =>
          node.getAttribute("data-testid") === name || node.getAttribute("data-slot") === name,
      );
    const bodies = [...named("list-item-body"), ...named("collapsible-row-trigger")];
    const lit = [...named("list-item"), ...named("collapsible-row-heading")];
    await expect(bodies).toHaveLength(WEB_ROWS.length);

    for (const [index, body] of bodies.entries()) {
      const row = lit[index]?.getBoundingClientRect();
      const press = body.getBoundingClientRect();
      if (!row) {
        throw new Error("each pressed part should have its row");
      }
      await expect(Math.abs(press.top - row.top), `row ${index}: top`).toBeLessThan(SLACK);
      await expect(Math.abs(press.bottom - row.bottom), `row ${index}: bottom`).toBeLessThan(SLACK);
    }
    // Nothing at either end: out to both ends as well, and the row is the height it always was.
    for (const index of [0, 2, 4, 5]) {
      const row = lit[index]?.getBoundingClientRect();
      const press = bodies[index]?.getBoundingClientRect();
      if (!row || !press) {
        throw new Error("the plain row should be there");
      }
      await expect(Math.abs(press.left - row.left), `row ${index}: start`).toBeLessThan(SLACK);
      await expect(Math.abs(press.right - row.right), `row ${index}: end`).toBeLessThan(SLACK);
      await expect(Math.round(row.height), `row ${index}: height`).toBe(WEB_ROW_HEIGHT);
    }
  },
};
