import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { ActionButton as Compiled } from "../compiled/action-button";
import { Pencil as CompiledPencil, Trash2 as CompiledTrash } from "../compiled/icons";
import { ActionButton as Native } from "../registry/layout/action-button";
import { Pencil as NativePencil, Trash2 as NativeTrash } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * The action button on both halves: react-native-web on the left, which is an Expo web build
 * (Storybook resolves `tooltip.web.tsx` the way Metro does, so the tooltip is radix there too),
 * and the compiled DOM on the right. `stories/web/action-button.stories.tsx` holds the web half
 * to everything it promised before it had a native source; these hold the two halves to each
 * other on the parts that are the component's reason to exist — a name, a refused press that
 * still explains itself, and a hint read without the tooltip open.
 *
 * The device's long press and accessibility hint have no browser to run in, and are
 * typechecked, not played.
 */
const meta = { title: "Stage 0/ActionButton" } satisfies Meta;
export default meta;
type Story = StoryObj;

/** The compiled half speaks DOM prop names — `onClick` — so each half is handed its own. */
type Row = (props: { press: () => void; disabled?: boolean }) => ReactNode;

const NativeRow: Row = ({ press, disabled = false }) => (
  <div className="flex flex-row gap-2">
    <Native label="Edit workspace" variant="ghost" size="icon" onPress={press}>
      <NativePencil />
    </Native>
    <Native
      label="Delete lane"
      hint="Empty the lane first"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onPress={press}
    >
      <NativeTrash />
    </Native>
  </div>
);

const CompiledRow: Row = ({ press, disabled = false }) => (
  <div className="flex flex-row gap-2">
    <Compiled label="Edit workspace" variant="ghost" size="icon" onClick={press}>
      <CompiledPencil />
    </Compiled>
    <Compiled
      label="Delete lane"
      hint="Empty the lane first"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={press}
    >
      <CompiledTrash />
    </Compiled>
  </div>
);

const nativePress = fn();
const compiledPress = fn();

export const Default: Story = {
  render: () => (
    <SideBySide
      native={<NativeRow press={nativePress} />}
      compiled={<CompiledRow press={compiledPress} />}
    />
  ),
  play: async ({ canvasElement }) => {
    nativePress.mockClear();
    compiledPress.mockClear();
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);

    for (const [half, press] of [
      [halves[0], nativePress],
      [halves[1], compiledPress],
    ] as const) {
      const scope = within(half as HTMLElement);

      // An icon and nothing else, and still a named button.
      const edit = scope.getByRole("button", { name: "Edit workspace" });
      await expect(edit).not.toHaveAttribute("aria-describedby");

      // With no hint the tooltip is the name.
      await userEvent.hover(edit);
      const tip = await screen.findByRole("tooltip");
      await expect(tip).toHaveTextContent("Edit workspace");
      await userEvent.unhover(edit);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());

      await userEvent.click(edit);
      await expect(press).toHaveBeenCalledOnce();
    }
  },
};

export const DisabledButStillReadable: Story = {
  render: () => (
    <SideBySide
      native={<NativeRow press={nativePress} disabled />}
      compiled={<CompiledRow press={compiledPress} disabled />}
    />
  ),
  play: async ({ canvasElement }) => {
    nativePress.mockClear();
    compiledPress.mockClear();
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);

    for (const [half, press] of [
      [halves[0], nativePress],
      [halves[1], compiledPress],
    ] as const) {
      const scope = within(half as HTMLElement);
      const remove = scope.getByRole("button", { name: "Delete lane" });

      // Not the attribute that would mute it. And unavailable to assistive technology on the
      // compiled half — react-native-web's `Pressable` writes its own `aria-disabled` from
      // `disabled` over the one it is handed, so under Expo web the refusal is not announced.
      await expect(remove).not.toHaveAttribute("disabled");
      if (half === halves[1]) await expect(remove).toHaveAttribute("aria-disabled", "true");

      // Reachable by keyboard, and the press is refused.
      remove.focus();
      await expect(remove).toHaveFocus();
      await userEvent.click(remove);
      await expect(press).not.toHaveBeenCalled();

      // The reason is read with no tooltip open: an always-mounted description.
      const describedBy = remove.getAttribute("aria-describedby");
      await expect(describedBy).toBeTruthy();
      await expect(document.getElementById(describedBy as string)).toHaveTextContent(
        "Empty the lane first",
      );

      // And the tooltip says it too, on a control a `disabled` button would never have let hover.
      await userEvent.hover(remove);
      const tip = await screen.findByRole("tooltip");
      await expect(tip).toHaveTextContent("Empty the lane first");
      await userEvent.unhover(remove);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    }
  },
};
