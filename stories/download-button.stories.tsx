import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import { DownloadButton as Compiled } from "../compiled/download-button";
import { DownloadButton as Native } from "../registry/ui/download-button";
import { SideBySide } from "./side-by-side";

/**
 * The download button on both web halves: react-native-web on the left, which is an Expo web
 * build (Storybook resolves `download-button.web.tsx` the way Metro does), and the compiled DOM on
 * the right. Both save through an `<a download>`, whose click the play test replaces with a spy —
 * a test should not drop files in the downloads folder.
 *
 * The device half — `expo-sharing` and `expo-file-system` — has no browser to run in, and is
 * typechecked, not played.
 */
const meta = { title: "RN Parity/DownloadButton" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onDownloaded = fn();
const onError = fn();

/** A fetch the test finishes by hand, so the pending state can be looked at. */
let finish: { resolve: (text: string) => void; reject: (error: Error) => void } | undefined;
const fetchNote = () =>
  new Promise<string>((resolve, reject) => {
    finish = { resolve, reject };
  });

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          label="Download note.md"
          filename="note.md"
          mimeType="text/markdown"
          source={fetchNote}
          onDownloaded={onDownloaded}
          onError={onError}
        />
      }
      compiled={
        <Compiled
          label="Download note.md"
          filename="note.md"
          mimeType="text/markdown"
          source={fetchNote}
          onDownloaded={onDownloaded}
          onError={onError}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onDownloaded.mockClear();
    onError.mockClear();
    const saved: string[] = [];
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(this.download);
    });

    try {
      const buttons = canvas.getAllByRole("button", { name: "Download note.md" });
      await expect(buttons).toHaveLength(2);

      for (const button of buttons) {
        // Pending: disabled, busy, and a spinner where the glyph was. Nothing is saved yet.
        await userEvent.click(button);
        await waitFor(() => expect(button).toBeDisabled());
        await expect(button).toHaveAttribute("aria-busy", "true");
        // `Button`'s own `loading`: the glyph gives way to a spinner the name does not read.
        await expect(button.querySelector(".lucide-download")).toBeNull();
        await expect(button.querySelector("svg")).not.toBeNull();
        await expect(saved).toHaveLength(0);

        // Done: the file is saved under its own name, and the button offers again.
        finish?.resolve("# A note");
        await waitFor(() => expect(button).toBeEnabled());
        await expect(saved).toEqual(["note.md"]);
        await expect(button.querySelector(".lucide-download")).not.toBeNull();
        saved.length = 0;

        // Failed: nothing is saved, the caller hears why, and the button offers again.
        await userEvent.click(button);
        await waitFor(() => expect(button).toBeDisabled());
        finish?.reject(new Error("401"));
        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(button).toBeEnabled());
        await expect(saved).toHaveLength(0);
        onError.mockClear();
      }
      await expect(onDownloaded).toHaveBeenCalledTimes(2);
    } finally {
      click.mockRestore();
    }
  },
};
