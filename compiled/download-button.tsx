/**
 * Copied from `registry/ui/download-button.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

import {
  type DownloadButtonProps,
  type DownloadContent,
  type DownloadDestination,
  useDownload,
} from "@/components/ui/download-button-base";
/**
 * The web download button: the browser's own download, through an `<a download>`.
 * `download-button.tsx` is the native counterpart and `download-button-base.ts` holds what they
 * share.
 *
 * Hand-written rather than compiled because the native half writes through `expo-file-system`
 * and `expo-sharing`, which the compiler has no DOM translation for — and a DOM app should not
 * install an Expo module to click a link.
 */
import { Button } from "./button";
import { Download } from "./icons";

export type { DownloadButtonProps, DownloadContent, DownloadDestination };

/**
 * Saves `content` as `filename`, through the browser's downloads.
 *
 * The object URL is revoked on the next task rather than straight after the click: the click
 * only *starts* the download, and a URL revoked in the same breath is one some browsers have not
 * read yet, which saves an empty file.
 */
export async function downloadBlob(
  content: DownloadContent,
  filename: string,
  { mimeType = "text/plain" }: { mimeType?: string | undefined } = {},
): Promise<void> {
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DownloadButton({
  source,
  filename,
  mimeType,
  label = "Download",
  variant = "outline",
  size = "icon-sm",
  disabled,
  onDownloaded,
  onError,
  className,
}: DownloadButtonProps) {
  const { pending, download } = useDownload({ source, onDownloaded, onError });

  return (
    <Button
      data-slot="download-button"
      variant={variant}
      size={size}
      aria-label={label}
      loading={pending}
      disabled={disabled}
      className={className}
      onClick={() => void download((content) => downloadBlob(content, filename, { mimeType }))}
      iconSlot={<Download aria-hidden />}
    />
  );
}
