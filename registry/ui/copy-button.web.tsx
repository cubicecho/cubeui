/**
 * The web copy button: the browser's clipboard as the writer, handed to the same
 * `copy-button-view.tsx` the native half uses. `copy-button.tsx` is that
 * counterpart and `copy-button-base.ts` holds the timing.
 *
 * Hand-written rather than compiled because the native half's clipboard is
 * `expo-clipboard`, which the compiler has no DOM translation for — and a DOM app
 * should not install an Expo module to reach `navigator.clipboard`.
 *
 * `navigator.clipboard` exists only in a secure context, so on a LAN address over
 * plain http it is `undefined` rather than a function that fails. The fallback is
 * the old hidden-textarea `execCommand("copy")`, which still works there and is
 * what kanban_server's settings page carried for exactly that case.
 */
import type { CopyButtonProps } from "@/components/ui/copy-button-base";
import { CopyButtonView } from "@/components/ui/copy-button-view";

export type { CopyButtonProps };

async function write(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (ok === false) {
    throw new Error("The clipboard refused the text");
  }
}

/** An icon button that copies `value` to the clipboard and shows a tick for a moment. */
export function CopyButton(props: CopyButtonProps) {
  return <CopyButtonView write={write} {...props} />;
}
