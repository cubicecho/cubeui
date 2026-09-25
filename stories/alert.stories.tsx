import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";
import { Alert as Compiled } from "../compiled/alert";
import { Button as CompiledButton } from "../compiled/button";
import { Alert as Native } from "../registry/ui/alert";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * The alert on both halves, every variant. The play test is what says the role follows the
 * variant — only `destructive` interrupts — that the text on a tint is the foreground rather than
 * the variant's hue, and that the default glyph is the variant's, sized and coloured without the
 * caller's help. The contrast itself is the axe run every story gets.
 */
const meta = { title: "Stage 0/Alert" } satisfies Meta;
export default meta;
type Story = StoryObj;

type AlertComponent = typeof Native;

function Variants({ Alert, action }: { Alert: AlertComponent; action: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Alert title="Heads up" description="Sessions now last thirty days." />
      <Alert
        variant="info"
        title="Re-embedding · 1,204 of 5,880 turns"
        description="Recall uses the lexical view for turns with no vector yet."
      />
      <Alert
        variant="warning"
        title="Store this token securely"
        description="It will not be shown again."
      />
      <Alert
        variant="destructive"
        title="Last error"
        description="spawn npx ENOENT"
        action={action}
      />
      <Alert icon={null} description="No icon, just the line." />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Variants
          Alert={Native}
          action={
            <NativeButton size="sm" variant="outline" onPress={() => {}}>
              Retry
            </NativeButton>
          }
        />
      }
      compiled={
        <Variants
          Alert={Compiled as AlertComponent}
          action={
            <CompiledButton size="sm" variant="outline" onClick={() => {}}>
              Retry
            </CompiledButton>
          }
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Four polite notices and one interruption per half.
    await expect(canvas.getAllByRole("status")).toHaveLength(8);
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    for (const alert of canvas.getAllByRole("alert")) {
      await expect(alert).toHaveTextContent("Last error");
      await expect(within(alert).getByRole("button", { name: "Retry" })).toBeVisible();
    }

    const pair = (text: string) => {
      const [native, compiled] = canvas.getAllByText(text);
      if (!native || !compiled) throw new Error(`both halves should render "${text}"`);
      return [native, compiled] as const;
    };
    const colour = (el: Element) => getComputedStyle(el).color;

    // Every title is the foreground, on both halves, whatever the tint behind it.
    const [nativeHeadsUp, compiledHeadsUp] = pair("Heads up");
    const foreground = colour(nativeHeadsUp);
    await expect(colour(compiledHeadsUp)).toBe(foreground);
    for (const title of ["Store this token securely", "Last error"]) {
      const [native, compiled] = pair(title);
      await expect(colour(native)).toBe(foreground);
      await expect(colour(compiled)).toBe(foreground);
    }

    // The line under the title is muted only on the card; on a tint it is the foreground too.
    const [nativeSessions, compiledSessions] = pair("Sessions now last thirty days.");
    await expect(colour(nativeSessions)).toBe("rgb(115, 115, 115)");
    await expect(colour(compiledSessions)).toBe(colour(nativeSessions));
    for (const line of ["It will not be shown again.", "spawn npx ENOENT"]) {
      const [native, compiled] = pair(line);
      await expect(colour(native)).toBe(foreground);
      await expect(colour(compiled)).toBe(foreground);
    }

    // The default glyph: 16px, in the variant's ink, the same on both halves; `icon={null}` is none.
    const glyph = (text: string) => {
      const box = canvas.getAllByRole("status").filter((el) => el.textContent?.includes(text));
      return box.map((el) => el.querySelector("svg"));
    };
    const [nativeWarning, compiledWarning] = glyph("Store this token securely");
    if (!nativeWarning || !compiledWarning) throw new Error("a warning should draw its glyph");
    await expect(nativeWarning.getBoundingClientRect().width).toBe(16);
    await expect(compiledWarning.getBoundingClientRect().width).toBe(16);
    await expect(getComputedStyle(compiledWarning).stroke).toBe(
      getComputedStyle(nativeWarning).stroke,
    );
    await expect(getComputedStyle(nativeWarning).stroke).not.toBe(foreground);
    for (const svg of glyph("No icon, just the line.")) await expect(svg).toBeNull();
  },
};
