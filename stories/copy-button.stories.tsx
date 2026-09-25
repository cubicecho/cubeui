import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import { CopyButton as Compiled } from "../compiled/copy-button";
import { CopyButton as Native } from "../registry/ui/copy-button";
import { COPIED_MS } from "../registry/ui/copy-button-base";
import { SideBySide } from "./side-by-side";

/**
 * The copy button on both web halves: react-native-web on the left, which is an Expo web build
 * (Storybook resolves `copy-button.web.tsx` the way Metro does), and the compiled DOM on the right.
 * Both write through `navigator.clipboard`, which the play test replaces with a spy — a headless
 * browser grants no clipboard permission, and a test should not write to the real one anyway.
 *
 * The device half — `expo-clipboard`'s `setStringAsync` — has no browser to run in, and is
 * typechecked, not played.
 */
const meta = { title: "Stage 0/CopyButton" } satisfies Meta;
export default meta;
type Story = StoryObj;

const URL = "https://router.local/mcp/notes";
const onCopied = fn();
const onError = fn();
const onSubmit = fn((event: { preventDefault: () => void }) => event.preventDefault());

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row items-center gap-2">
          <code className="text-sm">{URL}</code>
          <Native value={URL} label="Copy endpoint URL" onCopied={onCopied} onError={onError} />
        </div>
      }
      compiled={
        <form className="flex flex-row items-center gap-2" onSubmit={onSubmit}>
          <code className="text-sm">{URL}</code>
          <Compiled value={URL} label="Copy endpoint URL" onCopied={onCopied} onError={onError} />
        </form>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onCopied.mockClear();
    onError.mockClear();
    onSubmit.mockClear();
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    try {
      const [native, compiled] = canvas.getAllByRole("button", { name: "Copy endpoint URL" });
      if (!native || !compiled) throw new Error("both halves should render the button");

      // A press writes the value, says so, and turns the name to `Copied` — on both halves.
      for (const button of [native, compiled]) {
        await userEvent.click(button);
        await expect(writeText).toHaveBeenLastCalledWith(URL);
        await waitFor(() => expect(button).toHaveAccessibleName("Copied"));
      }
      await expect(onCopied).toHaveBeenCalledTimes(2);
      await expect(onError).not.toHaveBeenCalled();
      // Inside a form, and it did not submit it.
      await expect(onSubmit).not.toHaveBeenCalled();

      // And back to offering once the moment is over.
      await waitFor(
        () => expect(canvas.getAllByRole("button", { name: "Copy endpoint URL" })).toHaveLength(2),
        { timeout: COPIED_MS * 2 },
      );

      // A refused write never shows the tick; the caller hears it through `onError`.
      writeText.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
      for (const button of [native, compiled]) {
        await userEvent.click(button);
        await waitFor(() => expect(onError).toHaveBeenCalled());
        await expect(button).toHaveAccessibleName("Copy endpoint URL");
        onError.mockClear();
      }
      await expect(onCopied).toHaveBeenCalledTimes(2);
    } finally {
      writeText.mockRestore();
    }
  },
};
