import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as Compiled } from "../compiled/button";
import { ChevronDown as CompiledChevron, Plus as CompiledPlus } from "../compiled/icons";
import { Button as Native } from "../registry/ui/button";
import { ChevronDown as NativeChevron, Plus as NativePlus } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * `Button`'s inside is three props — `iconSlot`, `content`, `trailingSlot` — and no children
 * (#243). That is what lets `loading` put a spinner where the icon was and swap the label, on both
 * halves, with nothing rebuilt at the call site.
 */
const meta = { title: "RN Parity/Button" } satisfies Meta;

export default meta;
type Story = StoryObj;

const halves = ["native", "compiled"] as const;

/** The three parts, in the order they are drawn whatever order they were passed in. */
export const Parts: Story = {
  render: () => (
    <SideBySide
      native={
        <div data-testid="native">
          <Native
            variant="outline"
            trailingSlot={<NativeChevron />}
            content="New workspace"
            iconSlot={<NativePlus />}
          />
        </div>
      }
      compiled={
        <div data-testid="compiled">
          <Compiled
            variant="outline"
            trailingSlot={<CompiledChevron />}
            content="New workspace"
            iconSlot={<CompiledPlus />}
          />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      const frame = within(within(canvasElement).getByTestId(half));
      const button = frame.getByRole("button", { name: "New workspace" });
      const icon = button.querySelector(".lucide-plus")?.getBoundingClientRect();
      const label = within(button).getByText("New workspace").getBoundingClientRect();
      const trailing = button.querySelector(".lucide-chevron-down")?.getBoundingClientRect();
      if (!icon || !trailing) throw new Error(`the ${half} icons should render`);
      // `half` rides along so a failure names which half broke.
      await expect({
        half,
        inOrder: icon.right <= label.left && label.right <= trailing.left,
      }).toEqual({ half, inOrder: true });
    }
  },
};

const pressed = { native: fn(), compiled: fn() };

/**
 * `loading` (#243): disabled, `aria-busy`, a spinner where the icon was, and `loadingLabel` in
 * place of the label. The spinner is hidden, so the button's name is the label alone and not
 * "Loading Saving…".
 */
export const Loading: Story = {
  render: () => (
    <SideBySide
      native={
        <div data-testid="native" className="flex flex-row gap-2">
          <Native
            loading
            loadingLabel="Saving…"
            content="Save"
            iconSlot={<NativePlus />}
            onPress={pressed.native}
          />
          <Native loading variant="outline" content="Reload models" />
        </div>
      }
      compiled={
        <div data-testid="compiled" className="flex flex-row gap-2">
          <Compiled
            loading
            loadingLabel="Saving…"
            content="Save"
            iconSlot={<CompiledPlus />}
            onClick={pressed.compiled}
          />
          <Compiled loading variant="outline" content="Reload models" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of halves) {
      pressed[half].mockClear();
      const frame = within(within(canvasElement).getByTestId(half));
      const saving = frame.getByRole("button", { name: "Saving…" });
      await expect(saving).toHaveAttribute("aria-busy", "true");
      await expect(saving).toBeDisabled();
      // The spinner is drawn in the icon's place, and is not part of the name.
      await expect(saving.querySelector(".lucide-plus")).toBeNull();
      await expect(saving.querySelector("svg")).not.toBeNull();
      await expect(frame.queryByRole("status")).toBeNull();

      await userEvent.click(saving, { pointerEventsCheck: 0 });
      await expect(pressed[half]).not.toHaveBeenCalled();

      // With no `loadingLabel` the label stays, and with no icon the spinner goes before it.
      const reloading = frame.getByRole("button", { name: "Reload models" });
      const spinner = reloading.querySelector("svg");
      if (!spinner) throw new Error(`the ${half} spinner should render`);
      const label = within(reloading).getByText("Reload models").getBoundingClientRect();
      await expect(spinner.getBoundingClientRect().right).toBeLessThanOrEqual(label.left);
    }
  },
};
