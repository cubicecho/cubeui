/**
 * An icon button that copies `value`, and says it worked by turning into a tick
 * for a moment. `copy-button.web.tsx` is the web counterpart and
 * `copy-button-base.ts` holds what they share, the timing included.
 *
 * The clipboard is `expo-clipboard`. React Native has none of its own, and the
 * compiler has no DOM translation for a native module, which is why the web half
 * is hand-written — the same `Button`, with `navigator.clipboard` as the writer.
 *
 * `setStringAsync` answers `false` rather than throwing when the platform refuses,
 * so that is turned into the error `onError` hears.
 */
import * as Clipboard from "expo-clipboard";
import { Button } from "@/components/ui/button";
import { type CopyButtonProps, useCopy } from "@/components/ui/copy-button-base";
import { Check, Copy } from "@/components/ui/icons";

export type { CopyButtonProps };

async function write(text: string) {
  if (!(await Clipboard.setStringAsync(text))) throw new Error("The clipboard refused the text");
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
      onPress={() => void copy()}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  );
}
