/**
 * Copied from `registry/ui/copy-button.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

import { type CopyButtonProps, useCopy } from "@/components/ui/copy-button-base";
/**
 * The web copy button: the same `Button` and the same tick, with the browser's
 * clipboard as the writer. `copy-button.tsx` is the native counterpart and
 * `copy-button-base.ts` holds what they share.
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
import { Button } from "./button";
import { Check, Copy } from "./icons";

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
  if (!ok) throw new Error("The clipboard refused the text");
}

export function CopyButton({
  value,
  label = "Copy",
  variant = "ghost",
  size = "icon-sm",
  onCopied,
  onError,
  className,
}: CopyButtonProps) {
  const { copied, copy } = useCopy(write, { value, onCopied, onError });

  return (
    <Button
      data-slot="copy-button"
      variant={variant}
      size={size}
      aria-label={copied ? "Copied" : label}
      className={className}
      onClick={() => void copy()}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  );
}
