import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactElement, useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge as CompiledBadge } from "../compiled/badge";
import { Button as CompiledButton } from "../compiled/button";
import { CollapsibleRow as Compiled } from "../compiled/collapsible-row";
import { DisclosureRow as CompiledOld } from "../compiled/disclosure-row";
import { CollapsibleRow as Native } from "../registry/layout/collapsible-row";
import { DisclosureRow as NativeOld } from "../registry/layout/disclosure-row";
import { Badge as NativeBadge } from "../registry/ui/badge";
import { Button as NativeButton } from "../registry/ui/button";
import { isTurned } from "./chevron";
import { SideBySide } from "./side-by-side";

/**
 * The list row that opens, on both halves: the native source under react-native-web on the left,
 * the compiled web half on the right. The play test holds its guarantees on each — the heading is
 * one button, toggled by click and by Space, `aria-expanded` follows it, the body is Item's footer
 * and is mounted only while open, and the action sits outside the button.
 */
const meta = { title: "RN Parity/CollapsibleRow" } satisfies Meta;
export default meta;
type Story = StoryObj;

type CollapsibleRowComponent = typeof Native;

function Example({
  CollapsibleRow,
  badge,
  action,
  body,
}: {
  CollapsibleRow: CollapsibleRowComponent;
  badge: ReactElement;
  action: (onPress: () => void) => ReactElement;
  body: (text: string) => ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(0);
  return (
    <div style={{ width: 420 }}>
      <CollapsibleRow
        open={open}
        onOpenChange={setOpen}
        badgesSlot={badge}
        title="Rename the settings page"
        meta={`local llama · deleted ${deleted}`}
        description="Read 4 files and wrote 2."
        actionSlot={action(() => setDeleted((n) => n + 1))}
        contentSlot={body("146 passed.")}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Example
          CollapsibleRow={Native}
          badge={<NativeBadge variant="secondary">done</NativeBadge>}
          action={(onPress) => (
            <NativeButton size="sm" variant="outline" onPress={onPress} content="Delete" />
          )}
          body={(text) => <Text className="text-foreground/60 text-sm">{text}</Text>}
        />
      }
      compiled={
        <Example
          CollapsibleRow={Compiled as CollapsibleRowComponent}
          badge={<CompiledBadge variant="secondary">done</CompiledBadge>}
          action={(onPress) => (
            // `onClick` on this half; see the note in `card.stories.tsx`.
            <CompiledButton size="sm" variant="outline" onClick={onPress} content="Delete" />
          )}
          body={(text) => <p className="text-foreground/60 text-sm">{text}</p>}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);
    const rows: DOMRect[] = [];

    for (const [index, half] of halves.entries()) {
      const scope = within(half as HTMLElement);
      const header = scope.getByRole("button", { name: /Rename the settings page/ });
      // The row is what the example's frame holds. Asked that way, and not by its slot, because
      // under Storybook a native layout's `@/components/ui/*` import resolves to the web twin, so
      // a part drawn with one does not turn its `testID` into `data-testid` — it does on a device
      // and under react-native-web proper. The compiled half says `data-slot="collapsible-row"`.
      const row = half.querySelector<HTMLElement>('div[style*="width: 420px"]')?.firstElementChild;
      if (row instanceof HTMLElement === false) {
        throw new Error("the row should render");
      }
      await expect(row.contains(header)).toBe(true);
      if (index === 1) {
        await expect(row).toHaveAttribute("data-slot", "collapsible-row");
      }

      // Shut: no body, and no `aria-controls` pointing at one.
      await expect(header).toHaveAttribute("aria-expanded", "false");
      await expect(header).not.toHaveAttribute("aria-controls");
      await expect(scope.queryByText("146 passed.")).toBeNull();
      const chevron = header.querySelector("svg");
      if (!chevron) {
        throw new Error("the heading should draw a chevron");
      }
      await expect(isTurned(chevron)).toBe(false);

      // The badge, the title and the meta are one line, in that order, inside the button.
      const badge = scope.getByText("done").getBoundingClientRect();
      const title = scope.getByText("Rename the settings page").getBoundingClientRect();
      await expect(badge.right).toBeLessThanOrEqual(title.left);
      await expect(header.contains(scope.getByText(/local llama/))).toBe(true);
      await expect(
        scope.getByText("Read 4 files and wrote 2.").getBoundingClientRect().top,
      ).toBeGreaterThanOrEqual(title.bottom - 1);

      // A click opens it, and the body is part of the row, named by `aria-controls` on the web.
      await userEvent.click(header);
      await expect(header).toHaveAttribute("aria-expanded", "true");
      await waitFor(() => expect(isTurned(chevron)).toBe(true));
      const body = scope.getByText("146 passed.");
      await expect(body).toBeVisible();
      await expect(row.contains(body)).toBe(true);
      await expect(header.contains(body)).toBe(false);
      const controlled = header.getAttribute("aria-controls");
      await expect(controlled).toBeTruthy();
      // The id is the body's `nativeID`, which the compiled half always turns into `id` here (see
      // above for why the native half may not under Storybook).
      if (index === 1) {
        await expect(body.closest(`[id="${controlled}"]`)).not.toBeNull();
      }
      // The body is its own line under the heading, and stays inside the row.
      const bodyBox = body.getBoundingClientRect();
      await expect(bodyBox.top).toBeGreaterThanOrEqual(title.bottom);
      await expect(bodyBox.width).toBeLessThanOrEqual(row.getBoundingClientRect().width);

      // The action is beside the button, not in it, and pressing it leaves the row open.
      const remove = scope.getByRole("button", { name: "Delete" });
      await expect(header.contains(remove)).toBe(false);
      await userEvent.click(remove);
      await expect(scope.getByText(/deleted 1/)).toBeVisible();
      await expect(header).toHaveAttribute("aria-expanded", "true");

      // Space shuts it again.
      header.focus();
      await userEvent.keyboard(" ");
      await expect(header).toHaveAttribute("aria-expanded", "false");
      await expect(header).not.toHaveAttribute("aria-controls");
      await expect(scope.queryByText("146 passed.")).toBeNull();
      rows.push(row.getBoundingClientRect());
    }

    // Shut, the two halves draw the row at the same height.
    const [native, compiled] = rows;
    if (!native || !compiled) {
      throw new Error("both rows should measure");
    }
    await expect(Math.abs(native.height - compiled.height)).toBeLessThan(3);
  },
};

/** The old name with the state a caller holds, on whichever half it is handed. */
function OldRow({ Row, body }: { Row: typeof NativeOld; body: ReactElement }) {
  const [open, setOpen] = useState(false);
  return (
    <Row open={open} onOpenChange={setOpen} title="Rename the settings page" contentSlot={body} />
  );
}

/**
 * The old name and its old item, kept for one release: `DisclosureRow` from `disclosure-row` opens
 * as `CollapsibleRow` does, so an app moves its call sites across one at a time.
 */
export const OldName: Story = {
  render: () => (
    <SideBySide
      native={
        <OldRow Row={NativeOld} body={<Text className="text-foreground">146 passed.</Text>} />
      }
      compiled={<OldRow Row={CompiledOld as typeof NativeOld} body={<p>146 passed.</p>} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole("button", { name: /Rename the settings page/ })) {
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-expanded", "true");
    }
    await expect(canvas.getAllByText("146 passed.")).toHaveLength(2);
  },
};
