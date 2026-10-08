/**
 * Compiled from `registry/ui/copy-button-view.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { type CopyButtonProps, useCopy } from "@/components/ui/copy-button-base";
/**
 * The copy button itself, with the clipboard left out: `copy-button.tsx` and
 * `copy-button.web.tsx` each hand it their own `write`. One component, so a prop
 * added here reaches both platforms, and the compiler turns this file into the
 * web one like any other.
 */
import { Button } from "./button";
import { Check, Copy } from "./icons";

type CopyButtonViewProps = CopyButtonProps & {
  /** Puts the text on the clipboard, and rejects when the platform refuses it. */
  write: (text: string) => Promise<void>;
};

/** The copy button, taking the platform's clipboard as `write`. */
export function CopyButtonView({
  write,
  value,
  label = "Copy",
  variant = "outline",
  size = "icon-sm",
  onCopied,
  onError,
  className,
}: CopyButtonViewProps) {
  const { copied, copy } = useCopy(write, { value, onCopied, onError });

  return (
    <Button
      data-slot="copy-button"
      variant={variant}
      size={size}
      aria-label={copied ? "Copied" : label}
      className={className}
      onClick={() => void copy()}
      iconSlot={copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    />
  );
}
