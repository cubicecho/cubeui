import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { ErrorPage as Compiled } from "../compiled/error-page";
import { RouteError as CompiledOld } from "../compiled/route-error";
import { ErrorPage as Native } from "../registry/layout/error-page";
import { RouteError as NativeOld } from "../registry/layout/route-error";
import { Button } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * An error boundary renders `ErrorPage` and nothing around it: the alert, the raw message for a
 * bug report and the second way out are all props. Both halves are asserted, because a consumer on
 * either registry should be able to delete its wrapper. The native half passes the Reload as
 * `actionSlot` and the compiled half as `actionsSlot`, its deprecated name, so both stay held.
 */
const meta = { title: "RN Parity/ErrorPage" } satisfies Meta;
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
          actionSlot={<Button variant="outline" size="sm" onPress={() => {}} content="Reload" />}
        />
      }
      compiled={
        <Compiled
          error={crash}
          reset={() => {}}
          describe={describe}
          details
          // The old name, kept working for one release.
          actionsSlot={
            <CompiledButton variant="outline" size="sm" onClick={() => {}} content="Reload" />
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
    if (!native || !compiled) {
      throw new Error("both halves should render");
    }
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
    await expect(canvasElement.querySelector("[data-slot=error-page-details]")).toBeNull();
  },
};

/**
 * The old name and its old item, kept for one release: `RouteError` from `route-error` draws what
 * `ErrorPage` draws, so an app moves its call sites across one at a time.
 */
export const OldName: Story = {
  render: () => (
    <SideBySide
      native={<NativeOld error={crash} reset={() => {}} describe={describe} />}
      compiled={<CompiledOld error={crash} reset={() => {}} describe={describe} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    await expect(canvas.getAllByText("Something went wrong")).toHaveLength(2);
  },
};
