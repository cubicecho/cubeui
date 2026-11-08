import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { EmptyState as CompiledEmptyState } from "../compiled/empty-state";
import { ErrorPage as Compiled } from "../compiled/error-page";
import { Search as CompiledSearch } from "../compiled/icons";
import { LoadError as CompiledLoadError } from "../compiled/load-state";
import { RouteError as CompiledOld } from "../compiled/route-error";
import { EmptyState as NativeEmptyState } from "../registry/layout/empty-state";
import { ErrorPage as Native } from "../registry/layout/error-page";
import { LoadError as NativeLoadError } from "../registry/layout/load-state";
import { RouteError as NativeOld } from "../registry/layout/route-error";
import { Button } from "../registry/ui/button";
import { Search as NativeSearch } from "../registry/ui/icons";
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

/**
 * `Empty`'s block with a red bubble: the same 48px bubble and 24px glyph as an empty or not-found
 * screen, and the same 16px title, the screen's `h1` on both halves (#482). It drew its own
 * numbers before, and the title was 14px on device and 16px on the web.
 */
export const IsTheEmptyBlock: Story = {
  render: () => (
    <SideBySide
      native={
        <>
          <Native error={crash} reset={() => {}} describe={describe} />
          <div data-testid="native-empty">
            <NativeEmptyState iconSlot={<NativeSearch />} title="Project not found" level={2} />
          </div>
        </>
      }
      compiled={
        <>
          <Compiled error={crash} reset={() => {}} describe={describe} />
          <div data-testid="compiled-empty">
            <CompiledEmptyState iconSlot={<CompiledSearch />} title="Project not found" level={2} />
          </div>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titles = canvas.getAllByRole("heading", { level: 1, name: "Something went wrong" });
    await expect(titles).toHaveLength(2);
    for (const [i, half] of ["native", "compiled"].entries()) {
      const title = titles[i];
      const alert = title?.closest<HTMLElement>("[role=alert]");
      if (!title || !alert) {
        throw new Error("each half should draw its title inside its alert");
      }
      const empty = canvas.getByTestId(`${half}-empty`);
      const emptyTitle = within(empty).getByText("Project not found");
      await expect(getComputedStyle(title).fontSize).toBe("16px");
      await expect(getComputedStyle(title).fontSize).toBe(getComputedStyle(emptyTitle).fontSize);
      await expect(getComputedStyle(title).fontWeight).toBe(
        getComputedStyle(emptyTitle).fontWeight,
      );

      const bubble = alert.querySelector("svg")?.parentElement?.getBoundingClientRect();
      const emptyBubble = empty.querySelector("svg")?.parentElement?.getBoundingClientRect();
      await expect(bubble?.width).toBe(48);
      await expect(bubble?.width).toBe(emptyBubble?.width);
      await expect(alert.querySelector("svg")?.getBoundingClientRect().width).toBe(24);
      // From the bubble to the title, the empty block's step.
      const gap = (root: HTMLElement, text: HTMLElement) =>
        text.getBoundingClientRect().top -
        (root.querySelector("svg")?.parentElement?.getBoundingClientRect().bottom ?? 0);
      await expect(gap(alert, title)).toBe(gap(empty, emptyTitle));
    }
  },
};

/**
 * One describer: a failed fetch reads "Could not reach the server…" on `ErrorPage` and on
 * `LoadError` alike, rather than in the browser's words on one of them (#482).
 */
export const SaysWhatLoadErrorSays: Story = {
  render: () => (
    <SideBySide
      native={
        <>
          <Native error={new TypeError("Failed to fetch")} reset={() => {}} />
          <NativeLoadError
            error={new TypeError("Failed to fetch")}
            onRetry={() => {}}
            what="roles"
          />
        </>
      }
      compiled={
        <>
          <Compiled error={new TypeError("Failed to fetch")} reset={() => {}} />
          <CompiledLoadError
            error={new TypeError("Failed to fetch")}
            onRetry={() => {}}
            what="roles"
          />
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reach = "Could not reach the server. Check your connection and try again.";
    await expect(canvas.getAllByText(reach)).toHaveLength(4);
    await expect(canvas.queryByText("Failed to fetch")).toBeNull();
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
