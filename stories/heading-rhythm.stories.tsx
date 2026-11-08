import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { Text } from "react-native";
import { expect, screen, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  Card as CompiledCard,
  CardDescription as CompiledCardDescription,
  CardHeader as CompiledCardHeader,
  CardTitle as CompiledCardTitle,
} from "../compiled/card";
import { CardLayout as CompiledCardLayout } from "../compiled/card-layout";
import { Collapsible as CompiledCollapsible } from "../compiled/collapsible";
import { CollapsibleRow as CompiledCollapsibleRow } from "../compiled/collapsible-row";
import { DialogLayout as CompiledDialogLayout } from "../compiled/dialog-layout";
import { Pencil as CompiledPencil, Trash2 as CompiledTrash } from "../compiled/icons";
import {
  Item as CompiledItem,
  ItemActions as CompiledItemActions,
  ItemContent as CompiledItemContent,
  ItemDescription as CompiledItemDescription,
  ItemTitle as CompiledItemTitle,
} from "../compiled/item";
import { ListItem as CompiledListItem } from "../compiled/list-item";
import { Section as CompiledSection } from "../compiled/section";
import { SettingRow as CompiledSettingRow } from "../compiled/setting-row";
import { CardLayout as NativeCardLayout } from "../registry/layout/card-layout";
import { Collapsible as NativeCollapsible } from "../registry/layout/collapsible";
import { CollapsibleRow as NativeCollapsibleRow } from "../registry/layout/collapsible-row";
import { DialogLayout as NativeDialogLayout } from "../registry/layout/dialog-layout";
import { ListItem as NativeListItem } from "../registry/layout/list-item";
import { Section as NativeSection } from "../registry/layout/section";
import { SettingRow as NativeSettingRow } from "../registry/layout/setting-row";
import { Button as NativeButton } from "../registry/ui/button";
import {
  Card as NativeCard,
  CardDescription as NativeCardDescription,
  CardHeader as NativeCardHeader,
  CardTitle as NativeCardTitle,
} from "../registry/ui/card";
import { Pencil as NativePencil, Trash2 as NativeTrash } from "../registry/ui/icons";
import {
  Item as NativeItem,
  ItemActions as NativeItemActions,
  ItemContent as NativeItemContent,
  ItemDescription as NativeItemDescription,
  ItemTitle as NativeItemTitle,
} from "../registry/ui/item.tsx";
import { SideBySide } from "./side-by-side";

/**
 * The heading rhythm (#473): every block and row that has a title lays it out one way, on both
 * halves — a 14px semibold title, a 14px description at the `/60` step 4px under it, the action
 * level with the title's top, and 8px between two actions (4px between `icon-xs` buttons). The
 * classes are `HEADING_TITLE` and the rest in `registry/lib/utils.ts`; this story is what holds
 * the seven shells to them, and holds `Item`'s `default` size to shadcn's.
 *
 * `item.tsx` is imported by name because the harness resolves `.web.tsx` first.
 */
const meta = { title: "RN Parity/Heading rhythm" } satisfies Meta;
export default meta;
type Story = StoryObj;

type Half = "native" | "compiled";

/** The parts a specimen is drawn with. */
const NATIVE_PARTS = {
  Button: NativeButton,
  Card: NativeCard,
  CardHeader: NativeCardHeader,
  CardTitle: NativeCardTitle,
  CardDescription: NativeCardDescription,
  CardLayout: NativeCardLayout,
  Section: NativeSection,
  SettingRow: NativeSettingRow,
  Item: NativeItem,
  ItemContent: NativeItemContent,
  ItemTitle: NativeItemTitle,
  ItemDescription: NativeItemDescription,
  ItemActions: NativeItemActions,
  ListItem: NativeListItem,
  CollapsibleRow: NativeCollapsibleRow,
  Collapsible: NativeCollapsible,
  Pencil: NativePencil,
  Trash: NativeTrash,
};

/**
 * Each half's parts under one loose type: the two halves' props differ in ways that do not matter
 * here (`onPress` and `onClick`), and a union of the two is not something JSX can call.
 */
type Parts = Record<keyof typeof NATIVE_PARTS, ComponentType<Record<string, unknown>>>;

const PARTS: Record<Half, Parts> = {
  native: NATIVE_PARTS as unknown as Parts,
  compiled: {
    Button: CompiledButton,
    Card: CompiledCard,
    CardHeader: CompiledCardHeader,
    CardTitle: CompiledCardTitle,
    CardDescription: CompiledCardDescription,
    CardLayout: CompiledCardLayout,
    Section: CompiledSection,
    SettingRow: CompiledSettingRow,
    Item: CompiledItem,
    ItemContent: CompiledItemContent,
    ItemTitle: CompiledItemTitle,
    ItemDescription: CompiledItemDescription,
    ItemActions: CompiledItemActions,
    ListItem: CompiledListItem,
    CollapsibleRow: CompiledCollapsibleRow,
    Collapsible: CompiledCollapsible,
    Pencil: CompiledPencil,
    Trash: CompiledTrash,
  } as unknown as Parts,
};

/** The shells that take the rhythm, each drawn with a title, a description and two actions. */
const RHYTHM = [
  "card-layout",
  "section",
  "setting-row",
  "item-sm",
  "list-item",
  "collapsible-row",
  "collapsible",
] as const;

function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-specimen={name} className="flex flex-col">
      {children}
    </div>
  );
}

function Specimens({ half }: { half: Half }) {
  const P = PARTS[half];
  const actions = (
    <>
      <P.Button size="sm" variant="outline" content="One" />
      <P.Button size="sm" variant="outline" content="Two" />
    </>
  );
  const iconActions = (
    <>
      <P.Button size="icon-xs" variant="outline" aria-label="One" iconSlot={<P.Pencil />} />
      <P.Button size="icon-xs" variant="outline" aria-label="Two" iconSlot={<P.Trash />} />
    </>
  );
  return (
    <div className={`${half}-root flex flex-col gap-6`} style={{ width: 420 }}>
      <Specimen name="card">
        <P.Card>
          <P.CardHeader>
            <P.CardTitle>Title</P.CardTitle>
            <P.CardDescription>Description</P.CardDescription>
          </P.CardHeader>
        </P.Card>
      </Specimen>
      <Specimen name="card-layout">
        <P.CardLayout title="Title" description="Description" actionSlot={actions} />
      </Specimen>
      <Specimen name="section">
        <P.Section title="Title" description="Description" actionSlot={actions} />
      </Specimen>
      <Specimen name="setting-row">
        <P.SettingRow title="Title" description="Description" actionSlot={actions} />
      </Specimen>
      <Specimen name="item-sm">
        <P.Item size="sm">
          <P.ItemContent>
            <P.ItemTitle>Title</P.ItemTitle>
            <P.ItemDescription>Description</P.ItemDescription>
          </P.ItemContent>
          <P.ItemActions>{actions}</P.ItemActions>
        </P.Item>
      </Specimen>
      <Specimen name="list-item">
        <P.ListItem title="Title" description="Description" actionSlot={actions} />
      </Specimen>
      <Specimen name="collapsible-row">
        <P.CollapsibleRow
          open={false}
          onOpenChange={() => {}}
          title="Title"
          description="Description"
          actionSlot={actions}
        />
      </Specimen>
      <Specimen name="collapsible">
        <P.Collapsible title="Title" description="Description" actionSlot={actions} />
      </Specimen>
      <Specimen name="icon-xs">
        <P.ListItem title="Title" description="Description" actionSlot={iconActions} />
      </Specimen>
      <Specimen name="item-default">
        <P.Item>
          <P.ItemContent>
            <P.ItemTitle>Title</P.ItemTitle>
            <P.ItemDescription>Description</P.ItemDescription>
          </P.ItemContent>
          <P.ItemActions>{actions}</P.ItemActions>
        </P.Item>
      </Specimen>
    </div>
  );
}

function specimen(root: HTMLElement, name: string) {
  const el = root.querySelector<HTMLElement>(`[data-specimen="${name}"]`);
  if (!el) {
    throw new Error(`${name} should render`);
  }
  return el;
}

/** A specimen's title, description and actions, and the type they are drawn in. */
function measure(el: HTMLElement) {
  const box = within(el);
  const title = box.getByText("Title");
  const description = box.getByText("Description");
  const [one, two] = box.queryAllByRole("button", { name: /^(One|Two)$/ });
  const titleStyle = getComputedStyle(title);
  const descriptionStyle = getComputedStyle(description);
  const titleBox = title.getBoundingClientRect();
  const descriptionBox = description.getBoundingClientRect();
  return {
    titleSize: titleStyle.fontSize,
    titleWeight: titleStyle.fontWeight,
    titleLine: titleStyle.lineHeight,
    titleColor: titleStyle.color,
    descriptionSize: descriptionStyle.fontSize,
    descriptionWeight: descriptionStyle.fontWeight,
    descriptionLine: descriptionStyle.lineHeight,
    descriptionColor: descriptionStyle.color,
    gap: descriptionBox.top - titleBox.bottom,
    titleTop: titleBox.top,
    actionTop: one?.getBoundingClientRect().top,
    actionGap:
      one && two ? two.getBoundingClientRect().left - one.getBoundingClientRect().right : undefined,
  };
}

/**
 * The seven, on both halves: one title, one description, one gap, one action position and one
 * action gap. Rows get the same type as cards, so hierarchy is the title's weight and ink.
 */
export const OneRhythm: Story = {
  render: () => (
    <SideBySide native={<Specimens half="native" />} compiled={<Specimens half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    const roots = [".native-root", ".compiled-root"].map((selector) => {
      const root = canvasElement.querySelector<HTMLElement>(selector);
      if (!root) {
        throw new Error(`${selector} should render`);
      }
      return root;
    });
    const reference = measure(specimen(roots[0] as HTMLElement, "card"));
    await expect(reference.titleSize).toBe("14px");
    await expect(reference.titleWeight).toBe("600");
    await expect(reference.titleLine).toBe("20px");
    await expect(reference.descriptionSize).toBe("14px");
    await expect(reference.descriptionWeight).toBe("400");
    await expect(reference.descriptionLine).toBe("20px");
    // Quieter by ink, not by size.
    await expect(reference.descriptionColor).not.toBe(reference.titleColor);
    await expect(Math.abs(reference.gap - 4)).toBeLessThan(0.5);

    for (const root of roots) {
      for (const name of ["card", ...RHYTHM, "icon-xs"]) {
        const m = measure(specimen(root, name));
        const where = `${name} in ${root.className.split("-")[0]}`;
        await expect(m.titleSize, where).toBe(reference.titleSize);
        await expect(m.titleWeight, where).toBe(reference.titleWeight);
        await expect(m.titleLine, where).toBe(reference.titleLine);
        await expect(m.titleColor, where).toBe(reference.titleColor);
        await expect(m.descriptionSize, where).toBe(reference.descriptionSize);
        await expect(m.descriptionWeight, where).toBe(reference.descriptionWeight);
        await expect(m.descriptionLine, where).toBe(reference.descriptionLine);
        await expect(m.descriptionColor, where).toBe(reference.descriptionColor);
        await expect(Math.abs(m.gap - 4), where).toBeLessThan(0.5);
        if (name === "card") {
          continue;
        }
        // Level with the title's top, not centred on the two lines.
        await expect(Math.abs((m.actionTop ?? Number.NaN) - m.titleTop), where).toBeLessThan(0.5);
        const gap = name === "icon-xs" ? 4 : 8;
        await expect(Math.abs((m.actionGap ?? Number.NaN) - gap), where).toBeLessThan(0.5);
      }

      // `default` is shadcn's: its own line heights, its 16px of row, the action centred.
      const shadcn = measure(specimen(root, "item-default"));
      await expect(shadcn.titleLine).toBe("19.25px");
      await expect(shadcn.descriptionLine).toBe("21px");
      await expect(shadcn.actionTop).toBeGreaterThan(shadcn.titleTop + 0.5);
      await expect(Math.abs((shadcn.actionGap ?? Number.NaN) - 8)).toBeLessThan(0.5);
    }
  },
};

/** The space under a heading, and between the first two rows of the body under it. */
function bodySpacing(scope: HTMLElement, rows: [string, string]) {
  const box = within(scope);
  const heading = box.getByText("Description").getBoundingClientRect();
  const first = box.getByText(rows[0]).getBoundingClientRect();
  const second = box.getByText(rows[1]).getBoundingClientRect();
  return {
    underHeading: first.top - heading.bottom,
    betweenRows: Math.round(second.top - first.bottom),
  };
}

/** Two rows of a body, on one half: lines of text, so a row's box is its text's. */
function BodyRows({ half }: { half: Half }) {
  if (half === "native") {
    return (
      <>
        <Text className="text-foreground text-sm">First row</Text>
        <Text className="text-foreground text-sm">Second row</Text>
      </>
    );
  }
  return (
    <>
      <p className="text-foreground text-sm">First row</p>
      <p className="text-foreground text-sm">Second row</p>
    </>
  );
}

/**
 * A block's heading stands 24px over its body, past the 16px between the rows in it (#512): on a
 * card, on a `Section` with no card round it, and in a dialog (below). At 16px a card's 14px
 * heading over its 16px-apart rows was drawn like one more row.
 */
export const HeadingOverItsBody: Story = {
  render: () => (
    <SideBySide
      native={<BodySpecimens half="native" />}
      compiled={<BodySpecimens half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      for (const name of ["card-layout", "section"]) {
        const el = canvasElement.querySelector<HTMLElement>(
          `.${half}-root [data-specimen="${name}"]`,
        );
        if (!el) {
          throw new Error(`${name} should render on the ${half} half`);
        }
        const { underHeading, betweenRows } = bodySpacing(el, ["First row", "Second row"]);
        await expect({ half, name, underHeading: Math.round(underHeading), betweenRows }).toEqual({
          half,
          name,
          underHeading: 24,
          betweenRows: 16,
        });
      }
    }
  },
};

function BodySpecimens({ half }: { half: Half }) {
  const P = PARTS[half];
  return (
    <div className={`${half}-root flex flex-col gap-6`} style={{ width: 420 }}>
      <Specimen name="card-layout">
        <P.CardLayout
          title="Title"
          description="Description"
          contentSlot={<BodyRows half={half} />}
        />
      </Specimen>
      <Specimen name="section">
        <P.Section title="Title" description="Description" contentSlot={<BodyRows half={half} />} />
      </Specimen>
    </div>
  );
}

/**
 * The same 24px in a `DialogLayout`, whose header is over a body that scrolls, and the footer
 * still 16px under the body. One half per story, as two modal dialogs would hide each other.
 */
function dialogSpacing(half: Half): Story {
  const Dialog = half === "native" ? NativeDialogLayout : CompiledDialogLayout;
  const P = PARTS[half];
  return {
    render: () => (
      <Dialog
        open
        title="Title"
        description="Description"
        contentSlot={<BodyRows half={half} />}
        footerActionsSlot={<P.Button variant="positive" content="Save" />}
      />
    ),
    play: async () => {
      const dialog = await screen.findByRole("dialog", { name: "Title" });
      // Measured again until it holds: the web card zooms in as it opens, which scales every
      // distance in it until the animation ends. The callback only reads.
      await waitFor(() => {
        const save = within(dialog).getByRole("button", { name: "Save" }).getBoundingClientRect();
        const last = within(dialog).getByText("Second row").getBoundingClientRect();
        const { underHeading } = bodySpacing(dialog, ["First row", "Second row"]);
        // Within a pixel: the dialog's 22.5px title line leaves its parts on half pixels, and the
        // browser snaps each box its own way.
        return expect({
          underHeading: Math.abs(underHeading - 24) <= 1,
          overFooter: Math.abs(save.top - last.bottom - 16) <= 1,
        }).toEqual({ underHeading: true, overFooter: true });
      });
    },
  };
}

/** `DialogLayout` from the React Native source. */
export const NativeDialogHeadingOverItsBody: Story = dialogSpacing("native");

/** The compiled `DialogLayout`. */
export const CompiledDialogHeadingOverItsBody: Story = dialogSpacing("compiled");
