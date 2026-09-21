/**
 * Copied from `registry/ui/switch.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web switch: radix. `switch.tsx` is the native counterpart and
 * `switch-base.ts` holds the contract they share.
 */

import { Switch as SwitchPrimitive } from "radix-ui";
import {
  SWITCH_THUMB_CLASS,
  SWITCH_TRACK_CLASS,
  type SwitchProps,
} from "@/components/ui/switch-base";
import { cn } from "@/lib/utils";

function Switch({ checked, onCheckedChange, id, disabled, onBlur, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      onBlur={onBlur}
      className={cn(
        SWITCH_TRACK_CLASS,
        "peer inline-flex cursor-pointer shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          SWITCH_THUMB_CLASS,
          "pointer-events-none block shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
