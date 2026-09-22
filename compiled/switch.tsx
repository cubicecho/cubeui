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
 *
 * It takes radix's `Switch.Root` props whole, plus shadcn's `size`, because it
 * installs over a DOM app's shadcn switch at `components/ui/switch.tsx`:
 * `defaultChecked`, `name`, `value`, `required` and the `aria-*` props all
 * reach radix, which renders the hidden `<input>` a native form submit reads.
 */

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { SWITCH_THUMB_CLASS, SWITCH_TRACK_CLASS } from "@/components/ui/switch-base";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<ComponentPropsWithRef<typeof SwitchPrimitive.Root>, "className"> & {
  className?: string | undefined;
  /** shadcn's smaller track. Web only; the native switch is one size. */
  size?: "sm" | "default" | undefined;
};

function Switch({ className, size = "default", ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      {...props}
      className={cn(
        SWITCH_TRACK_CLASS,
        "peer group/switch inline-flex cursor-pointer shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:bg-primary data-[state=unchecked]:bg-input data-[size=sm]:h-4 data-[size=sm]:w-7",
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          SWITCH_THUMB_CLASS,
          "pointer-events-none block shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:h-3 group-data-[size=sm]/switch:w-3 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
