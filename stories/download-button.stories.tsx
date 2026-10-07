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

const mintUrl = fn(async () => "https://bucket.example/original.mp4?signature=abc");

/**
 * Issue #272: a file the server hands out as a URL — a presigned bucket link, a 100 MB original —
 * should not be fetched into a `Blob` to be saved. With `href` the page fetches nothing: the
 * anchor that is clicked points at the URL itself and the browser streams it to disk. The
 * function form is asked on the press, which is when a link that expires has to be minted.
 */
export const FromAUrl: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          label="Download the original"
          filename="original.mp4"
          href={mintUrl}
          onDownloaded={onDownloaded}
          onError={onError}
        />
      }
      compiled={
        <Compiled
          label="Download the original"
          filename="original.mp4"
          href="/files/original.mp4"
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
    mintUrl.mockClear();
    const saved: [href: string, download: string][] = [];
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push([this.getAttribute("href") ?? "", this.download]);
    });
    const fetched = spyOn(window, "fetch");
    const objectUrl = spyOn(URL, "createObjectURL");

    try {
      const [minted, fixed] = canvas.getAllByRole("button", { name: "Download the original" });
      if (!minted || !fixed) {
        throw new Error("both halves should render the button");
      }

      // Nothing is asked of the server until the press.
      await expect(mintUrl).not.toHaveBeenCalled();
      await userEvent.click(minted);
      await waitFor(() => expect(onDownloaded).toHaveBeenCalledTimes(1));
      await expect(mintUrl).toHaveBeenCalledTimes(1);

      await userEvent.click(fixed);
      await waitFor(() => expect(onDownloaded).toHaveBeenCalledTimes(2));

      await expect(saved).toEqual([
        ["https://bucket.example/original.mp4?signature=abc", "original.mp4"],
        ["/files/original.mp4", "original.mp4"],
      ]);
      // The browser's download, not the page's: no fetch and no `Blob` in between.
      await expect(fetched).not.toHaveBeenCalled();
      await expect(objectUrl).not.toHaveBeenCalled();
      await expect(onError).not.toHaveBeenCalled();
    } finally {
      click.mockRestore();
      fetched.mockRestore();
      objectUrl.mockRestore();
    }
  },
};
