import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Card as CompiledCard, CardTitle as CompiledCardTitle } from "../compiled/card";
import { Checkbox as CompiledCheckbox } from "../compiled/checkbox";
import { Collapsible as CompiledCollapsible } from "../compiled/collapsible";
import { CollapsibleRow as CompiledCollapsibleRow } from "../compiled/collapsible-row";
import { ColorPicker as CompiledColorPicker } from "../compiled/color-picker";
import {
  Dialog as CompiledDialog,
  DialogClose as CompiledDialogClose,
  DialogContent as CompiledDialogContent,
  DialogTitle as CompiledDialogTitle,
  DialogTrigger as CompiledDialogTrigger,
} from "../compiled/dialog";
import { FilePicker as CompiledFilePicker } from "../compiled/file-picker";
import { FileTree as CompiledFileTree } from "../compiled/file-tree";
import { Input as CompiledInput } from "../compiled/input";
import { ListItem as CompiledListItem } from "../compiled/list-item";
import {
  RadioGroup as CompiledRadioGroup,
  RadioGroupItem as CompiledRadioItem,
} from "../compiled/radio-group";
import {
  SegmentedButton as CompiledSegmentedButton,
  SegmentedGroup as CompiledSegmentedGroup,
} from "../compiled/segmented";
import { Switch as CompiledSwitch } from "../compiled/switch";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import { Collapsible } from "../registry/layout/collapsible";
import { CollapsibleRow } from "../registry/layout/collapsible-row";
import { FileTree } from "../registry/layout/file-tree";
import { ListItem } from "../registry/layout/list-item";
import { Button } from "../registry/ui/button";
import { Card, CardTitle } from "../registry/ui/card";
import { Checkbox } from "../registry/ui/checkbox.tsx";
import { ColorPicker } from "../registry/ui/color-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../registry/ui/dialog.tsx";
import { Input } from "../registry/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "../registry/ui/radio-group";
import { SegmentedButton, SegmentedGroup } from "../registry/ui/segmented";
import { Switch } from "../registry/ui/switch.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../registry/ui/tabs.tsx";
import { tabTo } from "./focus-edge";
import { tintsUnderPointer } from "./pointer-tint";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * Nothing draws a focus ring: a focused thing looks as it does under the pointer (#469). Each story
 * tabs to the thing, as a keyboard does, holds that the browser's outline is off and that the look
 * is there, on both halves: react-native-web, which is the native source under Expo web, on the
 * left, and the compiled DOM on the right. Where a thing had a focus look and no hover look, the
 * stylesheet is read for the hover rule as well (`tintsUnderPointer`).
 */
const meta = { title: "Tokens/Focus looks" } satisfies Meta;
export default meta;
type Story = StoryObj;

const HALVES = ["Native", "Compiled"] as const;
type Half = (typeof HALVES)[number];

/** One half's controls, in a region named for it. */
function Region({ half, children }: { half: Half; children: ReactNode }) {
  return (
    <section aria-label={half} className="flex flex-col items-start gap-4">
      {children}
    </section>
  );
}

/** Both halves, each drawn by `draw` with whether it is the compiled one. */
function both(draw: (compiled: boolean) => ReactNode) {
  return (
    <SideBySide
      native={<Region half="Native">{draw(false)}</Region>}
      compiled={<Region half="Compiled">{draw(true)}</Region>}
    />
  );
}

/** The region of one half, to query inside. */
function halfOf(canvasElement: HTMLElement, half: Half) {
  return within(within(canvasElement).getByRole("region", { name: half }));
}

const style = (element: Element) => getComputedStyle(element);

/** Waits out a `transition-colors` for a fill to land on `colour`. Reads only, as #507 asks. */
async function expectFill(element: Element, colour: string) {
  await waitFor(() => expect(style(element).backgroundColor).toBe(colour));
}

/** The same, for an edge. */
async function expectEdge(element: Element, colour: string) {
  await waitFor(() => expect(style(element).borderTopColor).toBe(colour));
}

/** A part found by its `testID`, which is `data-testid` on one half and `data-slot` on the other. */
function part(scope: Element, name: string) {
  const found = scope.querySelector<HTMLElement>(`[data-slot="${name}"], [data-testid="${name}"]`);
  if (!found) {
    throw new Error(`no ${name} here`);
  }
  return found;
}

/**
 * Both pills of a `SegmentedButton` row draw no ring (#469). A pill that is not the current one
 * had no focus look at all, and now looks hovered; the current one takes the tint's `/60` step.
 */
export const SegmentedPill: Story = {
  render: () =>
    both((compiled) => {
      const Group = compiled ? CompiledSegmentedGroup : SegmentedGroup;
      const Pill = compiled ? CompiledSegmentedButton : SegmentedButton;
      return (
        <Group aria-label={compiled ? "Compiled view" : "Native view"} value="week">
          <Pill value="day">Day</Pill>
          <Pill value="week">Week</Pill>
        </Group>
      );
    }),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const day = region.getByRole("button", { name: "Day" });
        await tabTo(day, canvasElement);
        await expectFill(day, tokenColor("hover"));
        await expect(style(within(day).getByText("Day")).color).toBe(tokenColor("foreground"));

        const week = region.getByRole("button", { name: "Week" });
        await tabTo(week, canvasElement);
        await expectFill(week, tokenColor("active", { opacity: 60 }));
      });
    }
  },
};

/**
 * A swatch draws no ring (#469). With no colour yet the first swatch is the row's one stop, and
 * focused it is ringed in the `/60` grey; chosen, its gap fills with the tint's `/60` step. Each is
 * its look under the pointer too.
 */
export const ColorSwatch: Story = {
  render: () =>
    both((compiled) => {
      const Picker = compiled ? CompiledColorPicker : ColorPicker;
      return (
        <SwatchRow Picker={Picker as typeof ColorPicker} half={compiled ? "Compiled" : "Native"} />
      );
    }),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const first = region.getByRole("radio", { name: "#6366f1" });
        await tabTo(first, canvasElement);
        await expectEdge(first, tokenColor("foreground", { opacity: 60 }));
        await expect(tintsUnderPointer(first, "borderColor")).toBe(true);

        await userEvent.keyboard("{ArrowRight}");
        const chosen = region.getByRole("radio", { name: "#ec4899" });
        await waitFor(() => expect(chosen).toHaveAttribute("aria-checked", "true"));
        await expect(chosen).toHaveFocus();
        await expect(style(chosen).outlineStyle).toBe("none");
        await expectFill(chosen, tokenColor("active", { opacity: 60 }));
        await expect(tintsUnderPointer(chosen)).toBe(true);
      });
    }
  },
};

function SwatchRow({ Picker, half }: { Picker: typeof ColorPicker; half: Half }) {
  const [value, setValue] = useState("");
  return (
    <Picker
      aria-label={`${half} tag colour`}
      hexLabel={`${half} hex`}
      swatches={["#6366f1", "#ec4899", "#f59e0b"]}
      value={value}
      onValueChange={setValue}
    />
  );
}

/**
 * A pressable `Card` draws no ring and looks hovered under the pointer, focused and pressed (#469):
 * the classes `StatTile` carried for itself, on the card.
 */
export const PressableCard: Story = {
  render: () =>
    both((compiled) =>
      compiled ? (
        <CompiledCard aria-label="Open the report" onClick={() => {}} className="p-4">
          <CompiledCardTitle>Report</CompiledCardTitle>
        </CompiledCard>
      ) : (
        <Card aria-label="Open the report" onPress={() => {}} className="p-4">
          <CardTitle>Report</CardTitle>
        </Card>
      ),
    ),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const card = halfOf(canvasElement, half).getByRole("button", { name: "Open the report" });
        await expect(tintsUnderPointer(card)).toBe(true);
        await tabTo(card, canvasElement);
        await expectFill(card, tokenColor("hover"));
      });
    }
  },
};

/**
 * The native `Tabs` draw no ring (#469). The tab stop is the active tab, which focused takes the
 * tint's `/60` step; another, reached by an arrow, looks hovered, with its label in full ink.
 */
export const NativeTab: Story = {
  render: () =>
    both((compiled) =>
      compiled ? (
        <CompiledTabs defaultValue="one">
          <CompiledTabsList>
            <CompiledTabsTrigger value="one">One</CompiledTabsTrigger>
            <CompiledTabsTrigger value="two">Two</CompiledTabsTrigger>
          </CompiledTabsList>
          <CompiledTabsContent value="one">First pane</CompiledTabsContent>
          <CompiledTabsContent value="two">Second pane</CompiledTabsContent>
        </CompiledTabs>
      ) : (
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">
            <Text className="text-foreground">First pane</Text>
          </TabsContent>
          <TabsContent value="two">
            <Text className="text-foreground">Second pane</Text>
          </TabsContent>
        </Tabs>
      ),
    ),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const one = region.getByRole("tab", { name: "One" });
        await tabTo(one, canvasElement);
        await expectFill(one, tokenColor("active", { opacity: 60 }));

        // The keyboard focuses the next tab: a script focus after a key press is focus-visible.
        const two = region.getByRole("tab", { name: "Two" });
        two.focus();
        await expect(two.matches(":focus-visible")).toBe(true);
        await expect(style(two).outlineStyle).toBe("none");
        if (two.getAttribute("aria-selected") !== "true") {
          await expectFill(two, tokenColor("hover"));
          await expect(style(within(two).getByText("Two")).color).toBe(tokenColor("foreground"));
        }
      });
    }
  },
};

/** A row with a leading box, a pressed middle and an action, as a list of todos has. */
function Rows({ compiled }: { compiled: boolean }) {
  const Row = compiled ? CompiledListItem : ListItem;
  const Action = (compiled ? CompiledButton : Button) as typeof Button;
  const Opener = compiled ? CompiledCollapsibleRow : CollapsibleRow;
  const Tree = compiled ? CompiledFileTree : FileTree;
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full flex-col gap-4">
      <Row
        title="Water the plants"
        // The compiled half takes the DOM's name for a press.
        {...(compiled ? { onClick: () => {} } : { onPress: () => {} })}
        // `aria-label` on the compiled box: its copy of the device half's `accessibilityLabel`
        // does not reach the element.
        leadingSlot={
          compiled ? <CompiledCheckbox aria-label="Done" /> : <Checkbox accessibilityLabel="Done" />
        }
        actionSlot={<Action size="xs" variant="outline" content="Delete" />}
      />
      <Opener
        open={open}
        onOpenChange={setOpen}
        title="Run 12"
        contentSlot={<Text className="text-foreground">Output</Text>}
        actionSlot={<Action size="xs" variant="outline" content="Retry" />}
      />
      <Tree
        label="Files"
        entries={[{ path: "notes.md", type: "file" as const }]}
        onSelect={() => {}}
        actionSlot={() => <Action size="xs" variant="outline" content="Remove" />}
      />
    </div>
  );
}

/**
 * A row lights up only when its own pressed part is focused (#469). Focus on its action or on its
 * leading box shows that control's look alone: the row lit as well, in the same `hover`, and the
 * two could not be told apart. `ListItem`, `CollapsibleRow` and `FileTree` share the fill.
 */
export const RowAndItsAction: Story = {
  render: () => both((compiled) => <Rows compiled={compiled} />),
  play: async ({ canvasElement, step }) => {
    const rows = [
      ["list-item", "list-item-body", "Delete"],
      ["collapsible-row-heading", "collapsible-row-trigger", "Retry"],
      ["file-tree-row", "file-tree-file", "Remove"],
    ] as const;
    for (const half of HALVES) {
      const region = within(canvasElement).getByRole("region", { name: half });
      for (const [rowName, bodyName, actionName] of rows) {
        await step(`${half}: ${rowName}`, async () => {
          const row = part(region, rowName);
          const rest = style(row).backgroundColor;
          const body = part(row, bodyName);
          await tabTo(body, canvasElement);
          await expectFill(row, tokenColor("hover"));

          const action = within(row).getByRole("button", { name: actionName });
          await tabTo(action, canvasElement);
          await expectFill(action, tokenColor("hover"));
          await expect(style(row).backgroundColor).toBe(rest);
        });
      }
      await step(`${half}: a leading box lights only itself`, async () => {
        const row = part(region, "list-item");
        const rest = style(row).backgroundColor;
        const box = within(row).getByRole("checkbox", { name: "Done" });
        await tabTo(box, canvasElement);
        await expectFill(box, tokenColor("hover"));
        await expect(style(row).backgroundColor).toBe(rest);
      });
    }
  },
};

/**
 * An outline button's edge darkens with its fill when focused, as `secondary`'s does (#469), and a
 * coloured one's goes from its `/50` rest to the full colour. The fill alone was 1.1-1.5:1 from
 * rest. `palette-contrast.test.mjs` measures the change.
 */
export const OutlineButton: Story = {
  render: () =>
    both((compiled) => {
      const Action = (compiled ? CompiledButton : Button) as typeof Button;
      return (
        <div className="flex gap-2">
          <Action variant="outline" content="Cancel" />
          <Action variant="destructive-outline" content="Remove" />
        </div>
      );
    }),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const cancel = region.getByRole("button", { name: "Cancel" });
        await expect(style(cancel).borderTopColor).toBe(tokenColor("foreground", { opacity: 50 }));
        await tabTo(cancel, canvasElement);
        await expectEdge(cancel, tokenColor("foreground", { opacity: 60 }));
        await expectFill(cancel, tokenColor("hover"));

        const remove = region.getByRole("button", { name: "Remove" });
        await expect(style(remove).borderTopColor).toBe(tokenColor("negative", { opacity: 50 }));
        await tabTo(remove, canvasElement);
        await expectEdge(remove, tokenColor("negative"));
        await expectFill(remove, tokenColor("negative", { opacity: 10 }));
      });
    }
  },
};

/**
 * A focused off switch keeps its `/50` track, which is its 3:1, and is edged in `active` (#469): it
 * took `bg-hover` and all but vanished. An unchecked box and an off switch look the same under the
 * pointer as focused, where each had a focus look and no hover look. On both halves: the native
 * ones had no `focus-visible:` at all.
 */
export const OffSwitchAndEmptyBox: Story = {
  render: () =>
    both((compiled) =>
      compiled ? (
        <>
          <CompiledCheckbox aria-label="Email me" />
          <CompiledSwitch aria-label="Notify" />
        </>
      ) : (
        <>
          <Checkbox accessibilityLabel="Email me" />
          <Switch accessibilityLabel="Notify" />
        </>
      ),
    ),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const box = region.getByRole("checkbox", { name: "Email me" });
        await expect(tintsUnderPointer(box)).toBe(true);
        await tabTo(box, canvasElement);
        await expectFill(box, tokenColor("hover"));

        const off = region.getByRole("switch", { name: "Notify" });
        const track = tokenColor("foreground", { opacity: 50 });
        await expect(style(off).backgroundColor).toBe(track);
        await expect(tintsUnderPointer(off, "borderColor")).toBe(true);
        await tabTo(off, canvasElement);
        await expectEdge(off, tokenColor("active"));
        await expect(style(off).backgroundColor).toBe(track);
      });
    }
  },
};

/** Two dialogs on a half: one with nothing to type in, one with a field. */
function Dialogs({ compiled }: { compiled: boolean }) {
  const [Root, Trigger, Content, Title, Close, Action, Field] = compiled
    ? ([
        CompiledDialog,
        CompiledDialogTrigger,
        CompiledDialogContent,
        CompiledDialogTitle,
        CompiledDialogClose,
        CompiledButton,
        CompiledInput,
      ] as unknown as [
        typeof Dialog,
        typeof DialogTrigger,
        typeof DialogContent,
        typeof DialogTitle,
        typeof DialogClose,
        typeof Button,
        typeof Input,
      ])
    : ([Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose, Button, Input] as const);
  const half = compiled ? "Compiled" : "Native";
  return (
    <div className="flex gap-2">
      <Root>
        <Trigger asChild>
          <Action variant="outline" content={`${half}: publish`} />
        </Trigger>
        <Content showCloseButton={false} aria-describedby={undefined}>
          <Title>Publish the page?</Title>
          <Close asChild>
            <Action variant="positive" content="Publish" />
          </Close>
        </Content>
      </Root>
      <Root>
        <Trigger asChild>
          <Action variant="outline" content={`${half}: rename`} />
        </Trigger>
        <Content showCloseButton={false} aria-describedby={undefined}>
          <Title>Rename the page</Title>
          <Close asChild>
            <Action variant="outline" content="Cancel" />
          </Close>
          <Field aria-label="Name" />
        </Content>
      </Root>
    </div>
  );
}

/**
 * A dialog opened with nothing to type in focuses its own panel, which draws no ring and keeps its
 * edge, so its primary is not drawn focused, which looked hovered and read unfilled (#469). One
 * with a field focuses the field, even after a button. On both halves: under Expo web the
 * `Modal`'s own trap focused the backdrop's Close.
 */
export const DialogOnOpen: Story = {
  // react-native-web's `Modal` puts `aria-modal` on a box with no role, and its card is not named
  // by its title: the device dialog's under a browser, as `dialog-gap.stories.tsx` finds.
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "aria-allowed-attr", enabled: false },
          { id: "aria-dialog-name", enabled: false },
        ],
      },
    },
  },
  render: () => both((compiled) => <Dialogs compiled={compiled} />),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(`${half}: no field`, async () => {
        const trigger = within(canvasElement).getByRole("button", { name: `${half}: publish` });
        await tabTo(trigger, canvasElement);
        await userEvent.keyboard("{Enter}");
        const panel = await within(document.body).findByRole("dialog");
        const edge = style(panel).borderTopColor;
        await waitFor(() => expect(panel).toHaveFocus());
        await expect(style(panel).outlineStyle).toBe("none");
        await expect(style(panel).borderTopColor).toBe(edge);
        const publish = within(panel).getByRole("button", { name: "Publish" });
        await expect(style(publish).backgroundColor).toBe(tokenColor("positive"));
        await userEvent.click(publish);
        await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
      });
      await step(`${half}: a field`, async () => {
        const trigger = within(canvasElement).getByRole("button", { name: `${half}: rename` });
        await tabTo(trigger, canvasElement);
        await userEvent.keyboard("{Enter}");
        const panel = await within(document.body).findByRole("dialog");
        await waitFor(() =>
          expect(within(panel).getByRole("textbox", { name: "Name" })).toHaveFocus(),
        );
        await userEvent.click(within(panel).getByRole("button", { name: "Cancel" }));
        await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
      });
    }
  },
};

/** `Collapsible`'s header looks hovered under the pointer as it does focused (#469). */
export const CollapsibleHeader: Story = {
  render: () =>
    both((compiled) => {
      const Section = compiled ? CompiledCollapsible : Collapsible;
      return (
        <Section
          title="Show completed (3)"
          contentSlot={<Text className="text-foreground">Done things</Text>}
        />
      );
    }),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const trigger = halfOf(canvasElement, half).getByRole("button", {
          name: /Show completed/,
        });
        await expect(tintsUnderPointer(trigger)).toBe(true);
        await tabTo(trigger, canvasElement);
        await expectFill(trigger, tokenColor("hover"));
      });
    }
  },
};

/**
 * A radio row's fill reaches past its circle and its words, and is its look under the pointer as
 * focused (#469): it sat on the circle's edge, and had no hover look. The row lines up with what is
 * above it all the same.
 */
export const RadioRow: Story = {
  render: () =>
    both((compiled) => {
      const Group = compiled ? CompiledRadioGroup : RadioGroup;
      const Item = compiled ? CompiledRadioItem : RadioGroupItem;
      return (
        <div className="flex flex-col gap-2">
          <Text testID="radio-heading" className="text-foreground">
            Delivery
          </Text>
          <Group aria-label="Delivery" defaultValue="post">
            <Item value="post" label="Post" />
            <Item value="pickup" label="Pick up" />
          </Group>
        </div>
      );
    }),
  play: async ({ canvasElement, step }) => {
    for (const half of HALVES) {
      await step(half, async () => {
        const region = halfOf(canvasElement, half);
        const regionElement = within(canvasElement).getByRole("region", { name: half });
        const post = region.getByRole("radio", { name: "Post" });
        const pickup = region.getByRole("radio", { name: "Pick up" });
        await expect(tintsUnderPointer(pickup)).toBe(true);
        await tabTo(post, canvasElement);
        await expectFill(post, tokenColor("hover"));
        await expect(style(post).paddingLeft).toBe("8px");
        // The circle stands clear of the fill's edge, and lines up with the heading over the group.
        const circle = post.firstElementChild as HTMLElement;
        const heading = part(regionElement, "radio-heading");
        await expect(
          Math.abs(circle.getBoundingClientRect().left - heading.getBoundingClientRect().left),
        ).toBeLessThanOrEqual(1);
        await expect(
          circle.getBoundingClientRect().left - post.getBoundingClientRect().left,
        ).toBeGreaterThanOrEqual(8);
      });
    }
  },
};

/**
 * `FilePicker`'s zone looks the same under the pointer as focused: its edge darkens and it fills,
 * as an outline button does (#469). It changed its edge for one and filled for the other. The web
 * half only: on device the zone cannot pick and is not a button.
 */
export const FilePickerZone: Story = {
  render: () => (
    <div className="bg-background p-6">
      <CompiledFilePicker label="Import a board" hint="A .json export" onPick={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const zone = within(canvasElement).getByRole("button", { name: /Import a board/ });
    await expect(tintsUnderPointer(zone)).toBe(true);
    await expect(tintsUnderPointer(zone, "borderColor")).toBe(true);
    await tabTo(zone, canvasElement);
    await expectFill(zone, tokenColor("hover"));
    await expectEdge(zone, tokenColor("foreground", { opacity: 60 }));
  },
};
