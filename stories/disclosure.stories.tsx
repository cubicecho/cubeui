import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Disclosure as Compiled } from "../compiled/disclosure";
import { Disclosure as Native } from "../registry/layout/disclosure";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * The disclosure on both halves: an uncontrolled "Raw output" block with an action beside its
 * header, and a controlled "Show completed" toggle whose title flips with the state it is handed.
 * The play test is what holds `DisclosureRow`'s guarantees here — one button, toggled by click,
 * Enter and Space, `aria-expanded` following it, the body mounted only while open, and the action
 * outside the button so pressing it leaves the section as it was.
 */
const meta = { title: "Stage 0/Disclosure" } satisfies Meta;
export default meta;
type Story = StoryObj;

type DisclosureComponent = typeof Native;

function Examples({
  Disclosure,
  action,
  body,
}: {
  Disclosure: DisclosureComponent;
  action: (onPress: () => void) => React.ReactNode;
  body: (text: string) => React.ReactNode;
}) {
  const [copied, setCopied] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <Disclosure
        title="Raw output"
        description={`Copied ${copied} times`}
        action={action(() => setCopied((n) => n + 1))}
        content={body('{ "exitCode": 0 }')}
      />
      <Disclosure
        title={`${showCompleted ? "Hide" : "Show"} completed (3)`}
        open={showCompleted}
        onOpenChange={setShowCompleted}
        content={body("Water the plants")}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Examples
          Disclosure={Native}
          action={(onPress) => (
            <NativeButton size="sm" variant="outline" onPress={onPress}>
              Copy
            </NativeButton>
          )}
          body={(text) => <Text className="font-mono text-foreground text-xs">{text}</Text>}
        />
      }
      compiled={
        <Examples
          Disclosure={Compiled as DisclosureComponent}
          action={(onPress) => (
            // `onClick` on this half; see the note in `card.stories.tsx`.
            <CompiledButton size="sm" variant="outline" onClick={onPress}>
              Copy
            </CompiledButton>
          )}
          body={(text) => <span className="font-mono text-foreground text-xs">{text}</span>}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const halves = Array.from(canvasElement.querySelectorAll("section"));
    await expect(halves).toHaveLength(2);

    for (const half of halves) {
      const scope = within(half as HTMLElement);
      const raw = scope.getByRole("button", { name: /Raw output/ });

      // Shut by default, and the body is not in the document rather than merely hidden.
      await expect(raw).toHaveAttribute("aria-expanded", "false");
      await expect(raw).not.toHaveAttribute("aria-controls");
      await expect(scope.queryByText('{ "exitCode": 0 }')).toBeNull();

      // A click opens it, and `aria-controls` names the body that is now there.
      await userEvent.click(raw);
      await expect(raw).toHaveAttribute("aria-expanded", "true");
      const body = scope.getByText('{ "exitCode": 0 }');
      const controlled = raw.getAttribute("aria-controls");
      await expect(controlled).toBeTruthy();
      await expect(body.closest(`[id="${controlled}"]`)).not.toBeNull();

      // The action is beside the button, not in it, and pressing it leaves the section open.
      const copy = scope.getByRole("button", { name: "Copy" });
      await expect(raw.contains(copy)).toBe(false);
      await userEvent.click(copy);
      await expect(scope.getByText("Copied 1 times")).toBeVisible();
      await expect(raw).toHaveAttribute("aria-expanded", "true");

      // The keyboard: Enter shuts it, Space opens it again.
      raw.focus();
      await userEvent.keyboard("{Enter}");
      await expect(raw).toHaveAttribute("aria-expanded", "false");
      await expect(scope.queryByText('{ "exitCode": 0 }')).toBeNull();
      await userEvent.keyboard(" ");
      await expect(raw).toHaveAttribute("aria-expanded", "true");
      await expect(scope.getByText('{ "exitCode": 0 }')).toBeVisible();

      // Controlled: the caller's state drives the title, the chevron and the body together.
      const completed = scope.getByRole("button", { name: /Show completed \(3\)/ });
      await expect(completed).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(completed);
      await expect(completed).toHaveAttribute("aria-expanded", "true");
      await expect(completed).toHaveTextContent("Hide completed (3)");
      await expect(scope.getByText("Water the plants")).toBeVisible();
    }

    // The chevron turns from the same boolean, the same way on both halves.
    const chevrons = canvas
      .getAllByRole("button", { name: /Raw output/ })
      .map((button) => button.querySelector("svg"));
    const [nativeChevron, compiledChevron] = chevrons;
    if (!nativeChevron || !compiledChevron) throw new Error("both halves should draw a chevron");
    await expect(getComputedStyle(nativeChevron).width).toBe("16px");
    await expect(getComputedStyle(compiledChevron).width).toBe("16px");
    // Turned, however each half says it: Tailwind's `rotate` property, or a `transform` where the
    // native half is styled by NativeWind. Waited for, since the web turns it with a transition.
    const turned = (svg: Element) => {
      const style = getComputedStyle(svg);
      return style.rotate === "90deg" || /^matrix\(0, 1, -1, 0/.test(style.transform);
    };
    await waitFor(() => expect(turned(nativeChevron)).toBe(true));
    await waitFor(() => expect(turned(compiledChevron)).toBe(true));
  },
};
