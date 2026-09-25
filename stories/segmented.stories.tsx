import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, within } from "storybook/test";
import {
  SegmentedButton as Compiled,
  SegmentedGroup as CompiledGroup,
} from "../compiled/segmented";
import { SegmentedButton as Native, SegmentedGroup as NativeGroup } from "../registry/ui/segmented";
import { SideBySide } from "./side-by-side";

/**
 * Variants and a selected state — the third of the spike's three, and the one that found a bug.
 *
 * The first version of this story asserted `aria-selected` on the React Native half, because that
 * is what `accessibilityState={{ selected }}` looks like it should produce. It produced nothing:
 * react-native-web forwards an allowlist of `aria-*` props and ignores `accessibilityState`, so
 * the active pill was styled and silent. `registry/ui/segmented.tsx` now passes `aria-pressed`
 * under a web guard, and this story is what holds that.
 */
const meta = { title: "Stage 0/Segmented" } satisfies Meta;
export default meta;
type Story = StoryObj;

const OPTIONS = ["Day", "Week", "Month"] as const;

/**
 * Pills that each pass `active`, the way every call site did before `SegmentedGroup` existed —
 * now inside a plain group, which is what proves the explicit `active` still wins and still works.
 */
export const Row: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeGroup variant="plain" aria-label="Native range">
          {OPTIONS.map((option) => (
            <Native key={option} active={option === "Week"} onPress={() => {}}>
              {option}
            </Native>
          ))}
        </NativeGroup>
      }
      compiled={
        <CompiledGroup variant="plain" aria-label="Compiled range">
          {OPTIONS.map((option) => (
            // `onClick` on this half; see the note in `card.stories.tsx`.
            <Compiled key={option} active={option === "Week"} onClick={() => {}}>
              {option}
            </Compiled>
          ))}
        </CompiledGroup>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Six buttons, three per half: the role survives on both.
    await expect(canvas.getAllByRole("button")).toHaveLength(6);

    const [nativeWeek, compiledWeek] = canvas.getAllByRole("button", { name: "Week" });
    if (!nativeWeek || !compiledWeek) throw new Error("both halves should render the active pill");

    // The state both halves have to expose, and the assertion that caught its absence.
    await expect(nativeWeek.getAttribute("aria-pressed")).toBe("true");
    await expect(compiledWeek.getAttribute("aria-pressed")).toBe("true");

    // And the inactive ones say so rather than saying nothing, which is the difference between
    // "this pill is not current" and "this pill has no state to report".
    const [nativeMonth] = canvas.getAllByRole("button", { name: "Month" });
    await expect(nativeMonth?.getAttribute("aria-pressed")).toBe("false");

    // The styling claim: whatever the element, the active pill is the one with the selection
    // background, on both halves and from the same class.
    const background = (el: Element) => getComputedStyle(el).backgroundColor;
    await expect(background(compiledWeek)).toBe(background(nativeWeek));

    const [nativeDay] = canvas.getAllByRole("button", { name: "Day" });
    if (!nativeDay) throw new Error("the inactive pill should render");
    await expect(background(nativeWeek)).not.toBe(background(nativeDay));

    // The row is a named group on both halves, so a screen reader says what the pills choose.
    await expect(canvas.getByRole("group", { name: "Native range" })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: "Compiled range" })).toBeInTheDocument();
  },
};

function NativeGrouped() {
  const [range, setRange] = useState<string>("Week");
  const [view, setView] = useState<string>("List");
  return (
    <>
      <NativeGroup aria-label="Native period" value={range} onValueChange={setRange}>
        {OPTIONS.map((option) => (
          <Native key={option} value={option}>
            {option}
          </Native>
        ))}
      </NativeGroup>
      <Text nativeID="native-view-heading" className="text-foreground">
        Native view
      </Text>
      <NativeGroup aria-labelledby="native-view-heading" value={view} onValueChange={setView}>
        <Native value="List">List</Native>
        <Native value="Board">Board</Native>
      </NativeGroup>
    </>
  );
}

function CompiledGrouped() {
  const [range, setRange] = useState<string>("Week");
  const [view, setView] = useState<string>("List");
  return (
    <>
      <CompiledGroup aria-label="Compiled period" value={range} onValueChange={setRange}>
        {OPTIONS.map((option) => (
          <Compiled key={option} value={option}>
            {option}
          </Compiled>
        ))}
      </CompiledGroup>
      <p id="compiled-view-heading">Compiled view</p>
      <CompiledGroup aria-labelledby="compiled-view-heading" value={view} onValueChange={setView}>
        <Compiled value="List">List</Compiled>
        <Compiled value="Board">Board</Compiled>
      </CompiledGroup>
    </>
  );
}

/**
 * `SegmentedGroup` holding the selection: each pill names its `value` and nothing else, the group
 * works out which one is pressed and hands a press to `onValueChange`. Named by `aria-label` in
 * the first row and by `aria-labelledby` pointed at a visible heading in the second, on both
 * halves. The axe pass over the canvas covers the framed variant's contrast.
 */
export const Group: Story = {
  render: () => <SideBySide native={<NativeGrouped />} compiled={<CompiledGrouped />} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const half of ["Native", "Compiled"]) {
      const period = canvas.getByRole("group", { name: `${half} period` });
      const view = canvas.getByRole("group", { name: `${half} view` });
      const pill = (group: HTMLElement, name: string) =>
        within(group).getByRole("button", { name });

      // The group's `value` decides which pill is pressed; no pill was told `active`.
      await expect(pill(period, "Week").getAttribute("aria-pressed")).toBe("true");
      await expect(pill(period, "Day").getAttribute("aria-pressed")).toBe("false");
      await expect(pill(view, "List").getAttribute("aria-pressed")).toBe("true");

      // A press goes to `onValueChange`, and the new value comes back down to the pills.
      await userEvent.click(pill(period, "Month"));
      await expect(pill(period, "Month").getAttribute("aria-pressed")).toBe("true");
      await expect(pill(period, "Week").getAttribute("aria-pressed")).toBe("false");

      await userEvent.click(pill(view, "Board"));
      await expect(pill(view, "Board").getAttribute("aria-pressed")).toBe("true");
      await expect(pill(view, "List").getAttribute("aria-pressed")).toBe("false");

      // Two groups, two selections: a press in one does not reach the other.
      await expect(pill(period, "Month").getAttribute("aria-pressed")).toBe("true");
    }
  },
};
