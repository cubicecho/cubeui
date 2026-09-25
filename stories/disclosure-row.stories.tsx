import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, within } from "storybook/test";
import { Badge as CompiledBadge } from "../compiled/badge";
import { Button as CompiledButton } from "../compiled/button";
import { DisclosureRow as Compiled } from "../compiled/disclosure-row";
import { DisclosureRow as Native } from "../registry/layout/disclosure-row";
import { Badge as NativeBadge } from "../registry/ui/badge";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * The list row that opens, on both halves: the native source under react-native-web on the left,
 * the compiled web half on the right. The play test holds its guarantees on each — the heading is
 * one button, toggled by click and by Space, `aria-expanded` follows it, the body is Item's footer
 * and is mounted only while open, and the action sits outside the button.
 */
const meta = { title: "Stage 0/DisclosureRow" } satisfies Meta;
export default meta;
type Story = StoryObj;

type DisclosureRowComponent = typeof Native;

function Example({
  DisclosureRow,
  badge,
  action,
  body,
}: {
  DisclosureRow: DisclosureRowComponent;
  badge: ReactNode;
  action: (onPress: () => void) => ReactNode;
  body: (text: string) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(0);
  return (
    <div style={{ width: 420 }}>
      <DisclosureRow
        open={open}
        onOpenChange={setOpen}
        badges={badge}
        title="Rename the settings page"
        meta={`local llama · deleted ${deleted}`}
        description="Read 4 files and wrote 2."
        action={action(() => setDeleted((n) => n + 1))}
        content={body("146 passed.")}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Example
          DisclosureRow={Native}
          badge={<NativeBadge variant="secondary">done</NativeBadge>}
          action={(onPress) => (
            <NativeButton size="sm" variant="ghost" onPress={onPress}>
              Delete
            </NativeButton>
          )}
          body={(text) => <Text className="text-muted-foreground text-sm">{text}</Text>}
        />
      }
      compiled={
        <Example
          DisclosureRow={Compiled as DisclosureRowComponent}
          badge={<CompiledBadge variant="secondary">done</CompiledBadge>}
          action={(onPress) => (
            // `onClick` on this half; see the note in `card.stories.tsx`.
            <CompiledButton size="sm" variant="ghost" onClick={onPress}>
              Delete
            </CompiledButton>
          )}
          body={(text) => <p className="text-muted-foreground text-sm">{text}</p>}
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
      // The row is the button's parent `Item`. Asked that way because under Storybook a native
      // layout's `@/components/ui/*` import resolves to the web twin, so the native half's `Item`
      // is the DOM one here and its `testID` does not become `data-testid` — it does on a device
      // and under react-native-web proper. The compiled half says `data-slot="disclosure-row"`.
      const row = header.parentElement;
      if (!row) throw new Error("the row should render");
      if (index === 1) await expect(row).toHaveAttribute("data-slot", "disclosure-row");

      // Shut: no body, and no `aria-controls` pointing at one.
      await expect(header).toHaveAttribute("aria-expanded", "false");
      await expect(header).not.toHaveAttribute("aria-controls");
      await expect(scope.queryByText("146 passed.")).toBeNull();

      // The badge, the title and the meta are one line, in that order, inside the button.
      const badge = scope.getByText("done").getBoundingClientRect();
      const title = scope.getByText("Rename the settings page").getBoundingClientRect();
      await expect(badge.right).toBeLessThanOrEqual(title.left);
      await expect(header.contains(scope.getByText(/local llama/))).toBe(true);
      await expect(
        scope.getByText("Read 4 files and wrote 2.").getBoundingClientRect().top,
      ).toBeGreaterThanOrEqual(title.bottom - 1);

      // A click opens it, and the body is the row's footer, named by `aria-controls` on the web.
      await userEvent.click(header);
      await expect(header).toHaveAttribute("aria-expanded", "true");
      const body = scope.getByText("146 passed.");
      await expect(body).toBeVisible();
      const footer = body.closest('[data-slot="item-footer"], [data-testid="item-footer"]');
      await expect(footer).not.toBeNull();
      await expect(row.contains(footer)).toBe(true);
      const controlled = header.getAttribute("aria-controls");
      await expect(controlled).toBeTruthy();
      // The id is the footer's `nativeID`, which only the compiled half turns into `id` here (see
      // above: the native half's `ItemFooter` is the DOM one under Storybook).
      if (index === 1) await expect(body.closest(`[id="${controlled}"]`)).not.toBeNull();
      // The footer is its own line under the heading, and stays inside the row.
      const footerBox = (footer as HTMLElement).getBoundingClientRect();
      await expect(footerBox.top).toBeGreaterThanOrEqual(title.bottom);
      await expect(footerBox.width).toBeLessThanOrEqual(row.getBoundingClientRect().width);

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
      await expect(scope.queryByText("146 passed.")).toBeNull();
      rows.push(row.getBoundingClientRect());
    }

    // Shut, the two halves draw the row at the same height.
    const [native, compiled] = rows;
    if (!native || !compiled) throw new Error("both rows should measure");
    await expect(Math.abs(native.height - compiled.height)).toBeLessThan(3);
  },
};
