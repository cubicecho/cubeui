import type { Meta, StoryObj } from "@storybook/react-vite";
import { useContext, useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Clock as CompiledClock,
  Eye as CompiledEye,
  Pencil as CompiledPencil,
} from "../compiled/icons";
import {
  SegmentedButton as Compiled,
  SegmentedGroup as CompiledGroup,
} from "../compiled/segmented";
import {
  Clock as NativeClock,
  Eye as NativeEye,
  Pencil as NativePencil,
} from "../registry/ui/icons";
import { IconClassContext } from "../registry/ui/icons-base";
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

const VIEWS = ["Edit", "Preview", "History"] as const;
const NATIVE_ICONS = { Edit: NativePencil, Preview: NativeEye, History: NativeClock } as const;
const COMPILED_ICONS = {
  Edit: CompiledPencil,
  Preview: CompiledEye,
  History: CompiledClock,
} as const;

type LabelHideBelow = "always" | "sm";

/**
 * The call site issue #213 asks for: a group, and per pill an `icon` and a string — no
 * `className`, no `<span>` for the label, no size on the icon. `Raw` has no icon, which is the pill
 * a `labelHideBelow` has to leave alone.
 */
function NativeViews({ labelHideBelow }: { labelHideBelow?: LabelHideBelow }) {
  const [view, setView] = useState<string>("Edit");
  return (
    <NativeGroup
      aria-label="Native view"
      labelHideBelow={labelHideBelow}
      value={view}
      onValueChange={setView}
    >
      {VIEWS.map((label) => {
        const Icon = NATIVE_ICONS[label];
        return (
          <Native key={label} value={label} icon={<Icon />}>
            {label}
          </Native>
        );
      })}
      <Native value="Raw">Raw</Native>
    </NativeGroup>
  );
}

function CompiledViews({ labelHideBelow }: { labelHideBelow?: LabelHideBelow }) {
  const [view, setView] = useState<string>("Edit");
  return (
    <CompiledGroup
      aria-label="Compiled view"
      labelHideBelow={labelHideBelow}
      value={view}
      onValueChange={setView}
    >
      {VIEWS.map((label) => {
        const Icon = COMPILED_ICONS[label];
        return (
          <Compiled key={label} value={label} icon={<Icon />}>
            {label}
          </Compiled>
        );
      })}
      <Compiled value="Raw">Raw</Compiled>
    </CompiledGroup>
  );
}

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** The pill's icon, which is the only `<svg>` in it. */
function iconOf(pill: HTMLElement) {
  const svg = pill.querySelector("svg");
  if (!svg) throw new Error(`the ${pill.textContent} pill should draw its icon`);
  return svg;
}

/**
 * The fill a pointer over the pill would give it. `userEvent.hover` dispatches events and cannot
 * put an element in `:hover`, so the hovered fill is read from the stylesheet: the declaration
 * Tailwind generated for `hover:bg-hover`, which applies under `:hover` and nowhere else.
 */
function hoverFill() {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRule[];
    try {
      rules = Array.from(sheet.cssRules);
    } catch {
      continue;
    }
    for (const rule of rules) {
      const text = rule.cssText;
      const at = text.indexOf(".hover\\:bg-hover");
      if (at === -1) continue;
      const own = text.slice(at, at + 400);
      const fill = own.match(/background-color:\s*([^;}]+)/)?.[1]?.trim();
      if (own.includes(":hover") && fill) return fill;
    }
  }
  return undefined;
}

/**
 * An icon beside the label, at rest, hovered and chosen, on both halves.
 *
 * What the pill owns and a call site used to write: the row and its gap, the icon's size, and the
 * icon's colour — the label's, so a chosen pill's icon is `selection-foreground` with it. Hover is
 * the grey `accent` fill on a pill at rest and nothing on the chosen one; chosen is `selection`.
 */
export const IconAndLabel: Story = {
  render: () => <SideBySide native={<NativeViews />} compiled={<CompiledViews />} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const color = (el: Element) => getComputedStyle(el).color;
    const background = (el: Element) => getComputedStyle(el).backgroundColor;

    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("group", { name: `${half} view` }));
      const pill = (name: string) => group.getByRole("button", { name });
      const edit = pill("Edit");
      const preview = pill("Preview");
      const raw = pill("Raw");

      await step(`${half}: the icon is before the label, in a row, at 16px`, async () => {
        for (const name of VIEWS) {
          const target = pill(name);
          const icon = iconOf(target).getBoundingClientRect();
          const label = within(target).getByText(name);
          await expect(label).toBeVisible();
          await expect(icon.width).toBe(16);
          await expect(icon.height).toBe(16);
          // Beside it with the pill's own gap, not above it and not touching it.
          await expect(label.getBoundingClientRect().left - icon.right).toBe(6);
          // Named by the label it draws; nothing was handed an `aria-label`.
          await expect(target).not.toHaveAttribute("aria-label");
        }
        // An icon does not make the pill taller than the one without, which is unchanged: its
        // label and nothing else.
        await expect(edit.getBoundingClientRect().height).toBe(raw.getBoundingClientRect().height);
        await expect(raw.querySelector("svg")).toBeNull();
        await expect(raw.children).toHaveLength(1);
      });

      await step(`${half}: the icon takes the label's colour, at rest and chosen`, async () => {
        await expect(edit).toHaveAttribute("aria-pressed", "true");
        await expect(color(iconOf(edit))).toBe(color(within(edit).getByText("Edit")));
        await expect(color(iconOf(preview))).toBe(color(within(preview).getByText("Preview")));
        await expect(color(iconOf(edit))).not.toBe(color(iconOf(preview)));
      });

      await step(`${half}: at rest no fill, hovered grey, chosen the selection`, async () => {
        await expect(background(preview)).toBe(TRANSPARENT);
        await expect(background(edit)).not.toBe(TRANSPARENT);

        // The hovered fill is the `accent` token, on a pill at rest only: the chosen pill has no
        // hover rule, so a pointer over it does not turn it grey.
        await expect(hoverFill()).toBe("var(--hover)");
        await expect(preview.matches(".hover\\:bg-hover")).toBe(true);
        await expect(edit.matches(".hover\\:bg-hover")).toBe(false);
        const tokens = getComputedStyle(preview);
        await expect(tokens.getPropertyValue("--accent")).not.toBe(
          tokens.getPropertyValue("--selection"),
        );
      });

      await step(
        `${half}: a press moves the selection, and the icon's colour with it`,
        async () => {
          const chosen = color(iconOf(edit));
          const rest = color(iconOf(preview));
          await userEvent.click(preview);
          await expect(preview).toHaveAttribute("aria-pressed", "true");
          await expect(edit).toHaveAttribute("aria-pressed", "false");
          await waitFor(() => expect(color(iconOf(preview))).toBe(chosen));
          await expect(color(within(preview).getByText("Preview"))).toBe(chosen);
          await expect(color(iconOf(edit))).toBe(rest);
          await expect(background(edit)).toBe(TRANSPARENT);
        },
      );
    }

    // One source, two renderers: the same pill box on both halves.
    const [native, compiled] = canvas.getAllByRole("button", { name: "History" });
    if (!native || !compiled) throw new Error("both halves should render");
    await expect(compiled.getBoundingClientRect().width).toBe(native.getBoundingClientRect().width);
    await expect(compiled.getBoundingClientRect().height).toBe(
      native.getBoundingClientRect().height,
    );
  },
};

/**
 * `labelHideBelow="always"` on the group: every pill with an icon is the icon alone, and the
 * string child is its accessible name — found here by role and name, which is how a screen reader
 * finds it. The pill with no icon keeps its label, having nothing else to draw.
 *
 * The canvas-wide axe pass is the other half of the claim: a button with no name fails it.
 */
export const IconOnly: Story = {
  render: () => (
    <SideBySide
      native={<NativeViews labelHideBelow="always" />}
      compiled={<CompiledViews labelHideBelow="always" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("group", { name: `${half} view` }));
      const raw = group.getByRole("button", { name: "Raw" });

      for (const name of VIEWS) {
        const pill = group.getByRole("button", { name });
        // The label is the name and is not drawn: no box, so it takes no room beside the icon.
        await expect(pill).toHaveAttribute("aria-label", name);
        await expect(getComputedStyle(within(pill).getByText(name)).display).toBe("none");
        await expect(iconOf(pill)).toBeVisible();
        await expect(iconOf(pill).getBoundingClientRect().width).toBe(16);
        // Still the height of the labelled pill beside it.
        await expect(pill.getBoundingClientRect().height).toBe(raw.getBoundingClientRect().height);
      }

      // No icon, so nothing to fall back to: the label stays, and stays the name by itself.
      await expect(within(raw).getByText("Raw")).toBeVisible();
      await expect(raw).not.toHaveAttribute("aria-label");

      // An icon-only pill is still the same toggle.
      const preview = group.getByRole("button", { name: "Preview" });
      await userEvent.click(preview);
      await expect(preview).toHaveAttribute("aria-pressed", "true");
      await expect(group.getByRole("button", { name: "Edit" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  },
};

const responsive: Story = {
  render: () => (
    <SideBySide
      native={<NativeViews labelHideBelow="sm" />}
      compiled={<CompiledViews labelHideBelow="sm" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Tailwind's `sm` is 40rem; the label is drawn exactly when this matches.
    const wide = window.matchMedia("(min-width: 40rem)").matches;

    for (const half of ["Native", "Compiled"]) {
      const group = within(canvas.getByRole("group", { name: `${half} view` }));
      for (const name of VIEWS) {
        // Named the same at either width, so a test or a screen reader finds one pill.
        const pill = group.getByRole("button", { name });
        const label = within(pill).getByText(name);
        if (wide) await expect(label).toBeVisible();
        else await expect(getComputedStyle(label).display).toBe("none");
        await expect(iconOf(pill)).toBeVisible();
      }
      const raw = group.getByRole("button", { name: "Raw" });
      await expect(within(raw).getByText("Raw")).toBeVisible();
    }
  },
};

/** `labelHideBelow="sm"` from `sm` up: icon and label. The test runner's default width. */
export const LabelShownWhenWide: Story = {
  ...responsive,
  play: async (context) => {
    await expect(window.matchMedia("(min-width: 40rem)").matches).toBe(true);
    await responsive.play?.(context);
  },
};

/**
 * `labelHideBelow="sm"` under `sm`: the icons alone, by a media query in the stylesheet, so there
 * is no first frame with the labels drawn. `globals.viewport` is what the test runner resizes to.
 */
export const LabelHiddenWhenNarrow: Story = {
  ...responsive,
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async (context) => {
    await expect(window.matchMedia("(min-width: 40rem)").matches).toBe(false);
    await responsive.play?.(context);
  },
};

/** Stands in for a device icon, which is the only kind that reads the class it is handed. */
function ProbeIcon({ name }: { name: string }) {
  const inherited = useContext(IconClassContext);
  return <span data-testid={`icon-${name}`} data-class={inherited ?? ""} />;
}

/**
 * The device half of "the icon takes the active colour". On the web an `<svg>` inherits
 * `currentColor`, which `IconAndLabel` measures; on device nothing inherits, and the icon is
 * coloured by the class the pill publishes through `IconClassContext`. The web icon set ignores
 * that context, so a probe reads what a device icon would be given.
 */
export const IconColourOnDevice: Story = {
  render: () => (
    <div className="bg-background p-6">
      <NativeGroup aria-label="Probe view" value="edit" onValueChange={() => {}}>
        <Native value="edit" icon={<ProbeIcon name="edit" />}>
          Edit
        </Native>
        <Native value="preview" icon={<ProbeIcon name="preview" />}>
          Preview
        </Native>
      </NativeGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const classes = (name: string) =>
      (canvas.getByTestId(`icon-${name}`).getAttribute("data-class") ?? "").split(" ");

    // Sized by the pill, and coloured as its label is: chosen, and at rest.
    await expect(classes("edit")).toEqual(
      expect.arrayContaining(["size-4", "shrink-0", "text-active-foreground"]),
    );
    await expect(classes("edit")).not.toContain("text-foreground/60");
    await expect(classes("preview")).toEqual(
      expect.arrayContaining(["size-4", "shrink-0", "text-foreground/60"]),
    );
    await expect(classes("preview")).not.toContain("text-active-foreground");

    // In the pill's row, before the label, not inside the label's text element.
    const edit = canvas.getByRole("button", { name: "Edit" });
    await expect(canvas.getByTestId("icon-edit").parentElement).toBe(edit);
    await expect(edit.firstElementChild).toBe(canvas.getByTestId("icon-edit"));
  },
};
