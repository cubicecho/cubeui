import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { InlineNumberEdit as Compiled } from "../compiled/inline-number-edit";
import { InlineNumberEdit as Native } from "../registry/ui/inline-number-edit";
import { deferredSave } from "./deferred-save";
import { SideBySide } from "./side-by-side";

/**
 * A number edited in place, on both halves: pressed, it becomes an input; Enter and blur commit
 * the clamped draft, and Escape puts the old value back. `InlineTextEdit`'s async contract holds
 * here too — a save that returns a promise keeps the box open until it settles.
 */
const meta = { title: "Stage 0/InlineNumberEdit" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * The compiler spells `accessibilityLabel` the DOM's way, so the compiled half is named by
 * `aria-label`. One adapter per half keeps the rest of the story the same.
 */
type EditProps = Omit<ComponentProps<typeof Native>, "accessibilityLabel"> & { label: string };
type Edit = (props: EditProps) => ReturnType<typeof Native>;
const NativeEdit: Edit = ({ label, ...props }) => <Native accessibilityLabel={label} {...props} />;
const CompiledEdit: Edit = ({ label, ...props }) => <Compiled aria-label={label} {...props} />;

const onSave = fn();

function Sync({ Edit, name }: { Edit: Edit; name: string }) {
  const [value, setValue] = useState(30);
  return (
    <Edit
      value={value}
      max={120}
      format={(n) => `${n} min`}
      label={`${name} estimate`}
      onSave={(next) => {
        onSave(next);
        setValue(next);
      }}
    />
  );
}

/** A save that returns nothing ends the edit at once, as it always has. */
export const Saving: Story = {
  render: () => (
    <SideBySide
      native={<Sync Edit={NativeEdit} name="Native" />}
      compiled={<Sync Edit={CompiledEdit} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"]) {
      const label = `${name} estimate`;
      const box = () => canvas.getByRole("spinbutton", { name: label });

      await step(`${name}: Enter commits the clamped draft`, async () => {
        onSave.mockClear();
        await userEvent.click(canvas.getByRole("button", { name: label }));
        await waitFor(() => expect(document.activeElement).toBe(box()));
        await userEvent.clear(box());
        await userEvent.type(box(), "500{Enter}");
        await expect(onSave).toHaveBeenCalledTimes(1);
        await expect(onSave).toHaveBeenCalledWith(120);
        await expect(canvas.queryByRole("spinbutton", { name: label })).toBeNull();
        await expect(canvas.getByRole("button", { name: label })).toHaveTextContent("120 min");
      });

      await step(`${name}: Escape puts the old value back`, async () => {
        onSave.mockClear();
        await userEvent.click(canvas.getByRole("button", { name: label }));
        await waitFor(() => expect(document.activeElement).toBe(box()));
        await userEvent.clear(box());
        await userEvent.type(box(), "5{Escape}");
        await expect(canvas.queryByRole("spinbutton", { name: label })).toBeNull();
        await expect(onSave).not.toHaveBeenCalled();
        await expect(canvas.getByRole("button", { name: label })).toHaveTextContent("120 min");
      });
    }
  },
};

const asyncSaves = { Native: deferredSave<number>(), Compiled: deferredSave<number>() };

function Slow({ Edit, name }: { Edit: Edit; name: "Native" | "Compiled" }) {
  const [value, setValue] = useState(30);
  const saves = asyncSaves[name];
  return (
    <div className="flex flex-col gap-2">
      <Edit
        value={value}
        format={(n) => `${n} min`}
        label={`${name} slow estimate`}
        onSave={(next) => saves.save(next).then(() => setValue(next))}
      />
    </div>
  );
}

/**
 * `onSave` returns a promise: pending while it runs, and on a rejection the draft stays with the
 * error under it until Escape.
 */
export const AsyncSave: Story = {
  render: () => (
    <SideBySide
      native={<Slow Edit={NativeEdit} name="Native" />}
      compiled={<Slow Edit={CompiledEdit} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    for (const name of ["Compiled", "Native"] as const) {
      const saves = asyncSaves[name];
      const label = `${name} slow estimate`;
      const box = () => canvas.getByRole("spinbutton", { name: label });
      const start = async () => {
        await userEvent.click(canvas.getByRole("button", { name: label }));
        await waitFor(() => expect(document.activeElement).toBe(box()));
      };

      await step(`${name}: a slow save shows pending, then the number`, async () => {
        saves.calls.mockClear();
        await start();
        await userEvent.clear(box());
        await userEvent.type(box(), "45{Enter}");
        await expect(saves.calls).toHaveBeenCalledWith(45);
        await expect(box()).toHaveValue(45);
        await expect(box()).toHaveAttribute("readonly");
        await expect(document.activeElement).toBe(box());
        await expect(box().closest("[aria-busy='true']")).not.toBeNull();
        const busy = box().closest("[aria-busy='true']") as HTMLElement;
        await expect(within(busy).getByRole("status", { name: "Saving" })).toBeVisible();

        saves.settle("resolve");
        await waitFor(() => expect(canvas.queryByRole("spinbutton", { name: label })).toBeNull());
        await expect(canvas.getByRole("button", { name: label })).toHaveTextContent("45 min");
      });

      await step(`${name}: a failed save keeps the draft and shows the error`, async () => {
        saves.calls.mockClear();
        await start();
        await userEvent.clear(box());
        await userEvent.type(box(), "60{Enter}");
        saves.settle(new Error("Estimate is locked"));

        await waitFor(() => expect(box()).not.toHaveAttribute("readonly"));
        await expect(box()).toHaveValue(60);
        await expect(box()).toHaveAttribute("aria-invalid", "true");
        await expect(box()).toHaveAccessibleDescription("Estimate is locked");
        const busy = box().parentElement?.parentElement as HTMLElement;
        await expect(within(busy).getByRole("alert")).toHaveTextContent("Estimate is locked");
        await waitFor(() => expect(document.activeElement).toBe(box()));
      });

      await step(`${name}: Escape after a failure puts the old value back`, async () => {
        await userEvent.keyboard("{Escape}");
        await expect(canvas.queryByRole("spinbutton", { name: label })).toBeNull();
        await expect(canvas.queryByRole("alert")).toBeNull();
        await expect(canvas.getByRole("button", { name: label })).toHaveTextContent("45 min");
        await expect(saves.calls).toHaveBeenCalledTimes(1);
      });
    }
  },
};
