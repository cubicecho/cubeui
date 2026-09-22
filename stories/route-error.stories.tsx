import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { RouteError as Compiled } from "../compiled/route-error";
import { RouteError as Native } from "../registry/layout/route-error";
import { Button } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * An error boundary renders `RouteError` and nothing around it: the alert, the raw message for a
 * bug report and the second way out are all props. Both halves are asserted, because a consumer on
 * either registry should be able to delete its wrapper.
 */
const meta = { title: "Stage 0/RouteError" } satisfies Meta;
export default meta;
type Story = StoryObj;

const crash = new TypeError("Cannot read properties of undefined (reading 'title')");
const describe = () => "This is a bug, not something you did. Your data is untouched.";

export const Details: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          error={crash}
          reset={() => {}}
          describe={describe}
          details
          actions={
            <Button variant="ghost" size="sm" onPress={() => {}}>
              Reload
            </Button>
          }
        />
      }
      compiled={
        <Compiled
          error={crash}
          reset={() => {}}
          describe={describe}
          details
          actions={
            <CompiledButton variant="ghost" size="sm" onClick={() => {}}>
              Reload
            </CompiledButton>
          }
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The root is the alert, so the consumer no longer wraps it in one.
    const alerts = canvas.getAllByRole("alert");
    await expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      const a = within(alert);
      await expect(a.getByText("Something went wrong")).toBeVisible();
      await expect(a.getByText(crash.message)).toBeVisible();
      await expect(a.getByRole("button", { name: "Try again" })).toBeVisible();
      await expect(a.getByRole("button", { name: "Reload" })).toBeVisible();
    }
    // The raw message is monospace on both halves.
    const [native, compiled] = canvas.getAllByText(crash.message);
    if (!native || !compiled) throw new Error("both halves should render");
    await expect(getComputedStyle(compiled).fontFamily).toBe(getComputedStyle(native).fontFamily);
  },
};

/** A plain `Error` is described by its own message; `details` does not print it a second time. */
export const NoRepeat: Story = {
  render: () => (
    <SideBySide
      native={<Native error={new Error("Row 12 is locked.")} reset={() => {}} details />}
      compiled={
        <Compiled
          error={new Error("Row 12 is locked.")}
          reset={() => {}}
          title="Could not save"
          details
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText("Row 12 is locked.")).toHaveLength(2);
    await expect(canvas.getByText("Could not save")).toBeVisible();
    await expect(canvasElement.querySelector("[data-slot=route-error-details]")).toBeNull();
  },
};
