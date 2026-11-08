import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, waitFor, within } from "storybook/test";
import { Checkbox as CompiledCheckbox } from "../compiled/checkbox";
import {
  RadioGroup as CompiledRadioGroup,
  RadioGroupItem as CompiledRadioItem,
} from "../compiled/radio-group";
import { StatTile as CompiledStatTile } from "../compiled/stat-tile";
import { Switch as CompiledSwitch } from "../compiled/switch";
import {
  Tabs as CompiledTabs,
  TabsContent as CompiledTabsContent,
  TabsList as CompiledTabsList,
  TabsTrigger as CompiledTabsTrigger,
} from "../compiled/tabs";
import { ToggleChip as CompiledToggleChip } from "../compiled/toggle-chip";
import { StatTile } from "../registry/layout/stat-tile";
import { Checkbox } from "../registry/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../registry/ui/radio-group";
import { Switch } from "../registry/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../registry/ui/tabs";
import { ToggleChip } from "../registry/ui/toggle-chip";
import { tintsUnderPointer } from "./pointer-tint";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * Every chosen thing is tinted: `bg-active/40` with `foreground` ink, and a step further,
 * `bg-active/60`, under the pointer and focused. A control whose edge is what says it is there —
 * a checkbox, a switch's track, a radio tile, a toggle chip, a stat tile — is edged in `active` as
 * well, because the tint is not 3:1 from the surface; a switch's thumb is `foreground`, as the
 * check in a box is. `palette-contrast.test.mjs` holds the ratios; this holds that the controls
 * draw them, on both halves.
 */
const meta = { title: "Tokens/Chosen state" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * A colour an icon was handed as an attribute, in the syntax the browser reports a computed colour
 * in. Not `tokenColor`: the value is whatever the icon was given, not a token's name.
 */
function resolved(value: string) {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

function Controls({ half, compiled }: { half: string; compiled: boolean }) {
  const noop = () => {};
  return (
    <section aria-label={half} className="flex flex-col items-start gap-4">
      {compiled ? (
        <>
          <CompiledCheckbox aria-label="Email me" checked />
          <CompiledSwitch aria-label="Notify" checked />
          <CompiledToggleChip selected>Mon</CompiledToggleChip>
          <CompiledTabs defaultValue="list">
            <CompiledTabsList>
              <CompiledTabsTrigger value="list">List</CompiledTabsTrigger>
              <CompiledTabsTrigger value="board">Board</CompiledTabsTrigger>
            </CompiledTabsList>
            <CompiledTabsContent value="list">The list.</CompiledTabsContent>
            <CompiledTabsContent value="board">The board.</CompiledTabsContent>
          </CompiledTabs>
          <CompiledRadioGroup aria-label="Tiles" value="dark" variant="card">
            <CompiledRadioItem value="light" label="Light" />
            <CompiledRadioItem value="dark" label="Dark" description="Always dark." />
          </CompiledRadioGroup>
          <CompiledRadioGroup aria-label="Segments" value="week" variant="segmented">
            <CompiledRadioItem value="day" label="Day" />
            <CompiledRadioItem value="week" label="Week" />
          </CompiledRadioGroup>
          <CompiledStatTile label="Open" value="12" selected onClick={noop} />
        </>
      ) : (
        <>
          <Checkbox accessibilityLabel="Email me" checked />
          <Switch accessibilityLabel="Notify" checked />
          <ToggleChip selected>Mon</ToggleChip>
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <Text className="text-foreground">The list.</Text>
            </TabsContent>
            <TabsContent value="board">
              <Text className="text-foreground">The board.</Text>
            </TabsContent>
          </Tabs>
          <RadioGroup aria-label="Tiles" value="dark" variant="card">
            <RadioGroupItem value="light" label="Light" />
            <RadioGroupItem value="dark" label="Dark" description="Always dark." />
          </RadioGroup>
          <RadioGroup aria-label="Segments" value="week" variant="segmented">
            <RadioGroupItem value="day" label="Day" />
            <RadioGroupItem value="week" label="Week" />
          </RadioGroup>
          <StatTile label="Open" value="12" selected onPress={noop} />
        </>
      )}
    </section>
  );
}

function Both(): ReactNode {
  return (
    <SideBySide
      native={<Controls half="Native" compiled={false} />}
      compiled={<Controls half="Compiled" compiled />}
    />
  );
}

/** Each chosen control at rest: the `/40` tint, `foreground` ink, and an `active` edge where it has one. */
export const TintedAtRest: Story = {
  render: () => <Both />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const style = (el: Element) => getComputedStyle(el);
    const rest = tokenColor("active", { opacity: 40 });
    const active = tokenColor("active");
    const foreground = tokenColor("foreground");

    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("region", { name: half }));

      await step(
        `${half}: a checked box is tinted and edged, its check in foreground`,
        async () => {
          const box = group.getByRole("checkbox", { name: "Email me" });
          await expect(style(box).backgroundColor).toBe(rest);
          await expect(style(box).borderTopColor).toBe(active);
          const check = box.querySelector("svg");
          if (!check) {
            throw new Error("a checked box draws its check");
          }
          // Native's icon is handed its colour as a stroke; the DOM's takes `currentColor`.
          const ink = check.getAttribute("stroke");
          await expect(
            ink === null || ink === "currentColor" ? style(check).color : resolved(ink),
          ).toBe(foreground);
        },
      );

      await step(`${half}: an on switch is tinted and edged, its thumb in foreground`, async () => {
        const track = group.getByRole("switch", { name: "Notify" });
        await expect(style(track).backgroundColor).toBe(rest);
        await expect(style(track).borderTopColor).toBe(active);
        const thumb = track.firstElementChild;
        if (!thumb) {
          throw new Error("a switch draws its thumb");
        }
        await expect(style(thumb).backgroundColor).toBe(foreground);
      });

      await step(`${half}: a chosen chip is tinted and edged, in foreground`, async () => {
        const chip = group.getByRole("button", { name: "Mon" });
        await expect(style(chip).backgroundColor).toBe(rest);
        await expect(style(chip).borderTopColor).toBe(active);
        await expect(style(within(chip).getByText("Mon")).color).toBe(foreground);
      });

      await step(`${half}: the active tab is tinted, in foreground`, async () => {
        const tab = group.getByRole("tab", { name: "List" });
        await expect(style(tab).backgroundColor).toBe(rest);
        await expect(style(within(tab).getByText("List")).color).toBe(foreground);
      });

      await step(
        `${half}: a chosen tile is tinted and edged, its description in foreground`,
        async () => {
          const tile = within(group.getByRole("radiogroup", { name: "Tiles" })).getByRole("radio", {
            name: "Dark",
          });
          await expect(style(tile).backgroundColor).toBe(rest);
          await expect(style(tile).borderTopColor).toBe(active);
          await expect(style(within(tile).getByText("Always dark.")).color).toBe(foreground);
        },
      );

      await step(`${half}: a chosen segment is tinted, in foreground`, async () => {
        const segment = within(group.getByRole("radiogroup", { name: "Segments" })).getByRole(
          "radio",
          { name: "Week" },
        );
        await expect(style(segment).backgroundColor).toBe(rest);
        await expect(style(within(segment).getByText("Week")).color).toBe(foreground);
      });

      await step(`${half}: a selected stat tile is tinted and edged`, async () => {
        const tile = group.getByRole("button", { name: /Open/ });
        await expect(tile).toHaveAttribute("aria-pressed", "true");
        await expect(style(tile).backgroundColor).toBe(rest);
        await expect(style(tile).borderTopColor).toBe(active);
      });
    }
  },
};

function Refused({ half, compiled }: { half: string; compiled: boolean }) {
  return (
    <section aria-label={half} className="flex flex-col items-start gap-4">
      {compiled ? (
        <>
          <CompiledCheckbox aria-label="Agree, unchecked" aria-invalid />
          <CompiledCheckbox aria-label="Agree, checked" aria-invalid checked />
          <CompiledSwitch aria-label="Notify, off" aria-invalid />
          <CompiledSwitch aria-label="Notify, on" aria-invalid checked />
        </>
      ) : (
        <>
          <Checkbox accessibilityLabel="Agree, unchecked" aria-invalid />
          <Checkbox accessibilityLabel="Agree, checked" aria-invalid checked />
          <Switch accessibilityLabel="Notify, off" aria-invalid />
          <Switch accessibilityLabel="Notify, on" aria-invalid checked />
        </>
      )}
    </section>
  );
}

/**
 * A refused box or switch is edged in `negative` whether or not it is chosen (#467). On the web a
 * checked one's `active` edge used to win, and on device `aria-invalid` was dropped. Focus still
 * shows, as a chosen thing's does: its fill takes the `/60` step and the edge stays `negative`,
 * because a box or a switch says it is focused with its fill, not its edge as a field does.
 */
export const RefusedOverChosen: Story = {
  render: () => (
    <SideBySide
      native={<Refused half="Native" compiled={false} />}
      compiled={<Refused half="Compiled" compiled />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const style = (el: Element) => getComputedStyle(el);
    const negative = tokenColor("negative");

    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("region", { name: half }));
      await step(`${half}: every refused box and switch is edged in negative`, async () => {
        for (const name of ["Agree, unchecked", "Agree, checked"]) {
          await expect(style(group.getByRole("checkbox", { name })).borderTopColor).toBe(negative);
        }
        for (const name of ["Notify, off", "Notify, on"]) {
          await expect(style(group.getByRole("switch", { name })).borderTopColor).toBe(negative);
        }
      });
    }

    await step(
      "Compiled: a focused refused switch keeps its edge and shows focus in its fill",
      async () => {
        const group = within(canvas.getByRole("region", { name: "Compiled" }));
        const on = group.getByRole("switch", { name: "Notify, on" });
        const rest = style(on).backgroundColor;
        on.focus();
        await expect(on.matches(":focus-visible")).toBe(true);
        // The track's colours transition. `tokenColor` inside the callback is what hung the
        // renderer here before it stopped changing the page (#497).
        await waitFor(() =>
          expect(style(on).backgroundColor).toBe(tokenColor("active", { opacity: 60 })),
        );
        await expect(style(on).backgroundColor).not.toBe(rest);
        await expect(style(on).borderTopColor).toBe(negative);
        on.blur();
      },
    );
  },
};

function DisabledChips({ half, compiled }: { half: string; compiled: boolean }) {
  const Chip = compiled ? CompiledToggleChip : ToggleChip;
  return (
    <section aria-label={half} className="flex flex-row gap-2">
      <Chip disabled>Off</Chip>
      <Chip disabled selected>
        On
      </Chip>
      <Chip>Live</Chip>
    </section>
  );
}

/**
 * A disabled chip stays as it is under the pointer, chosen or not, and on the web the pointer says
 * it cannot be pressed (#485). It kept its hover fill and the `cursor: pointer` every compiled
 * pressable has, so it looked pressable and did nothing. A live chip beside it still tints, so the
 * check is not passing because the rule could not be read.
 */
export const DisabledChipStaysPut: Story = {
  render: () => (
    <SideBySide
      native={<DisabledChips half="Native" compiled={false} />}
      compiled={<DisabledChips half="Compiled" compiled />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("region", { name: half }));
      await step(`${half}: a disabled chip neither tints nor takes the pointer`, async () => {
        for (const name of ["Off", "On"]) {
          const chip = group.getByRole("button", { name });
          await expect(tintsUnderPointer(chip)).toBe(false);
          await expect(getComputedStyle(chip).cursor).toBe("not-allowed");
        }
        await expect(tintsUnderPointer(group.getByRole("button", { name: "Live" }))).toBe(true);
      });
    }
  },
};
