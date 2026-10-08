/**
 * An icon button that copies `value`, and says it worked by turning into a tick
 * for a moment. This half is only the clipboard: `copy-button-view.tsx` is the
 * button, `copy-button-base.ts` the timing, and `copy-button.web.tsx` the web
 * counterpart.
 *
 * The clipboard is `expo-clipboard`. React Native has none of its own, and the
 * compiler has no DOM translation for a native module, which is why the web half
 * is hand-written, with `navigator.clipboard` as the writer.
 *
 * `setStringAsync` answers `false` rather than throwing when the platform refuses,
 * so that is turned into the error `onError` hears.
 */
import * as Clipboard from "expo-clipboard";
import type { CopyButtonProps } from "@/components/ui/copy-button-base";
import { CopyButtonView } from "@/components/ui/copy-button-view";

export type { CopyButtonProps };

async function write(text: string) {
  const copied = await Clipboard.setStringAsync(text);
  if (copied === false) {
    throw new Error("The clipboard refused the text");
  }
}

/** An icon button that copies `value` to the clipboard and shows a tick for a moment. */
export function CopyButton(props: CopyButtonProps) {
  return <CopyButtonView write={write} {...props} />;
}
