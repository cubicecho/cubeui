/**
 * Copied from `registry/ui/tooltip.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web tooltip: radix, shown on hover and focus. `tooltip.tsx` is the
 * native counterpart and `tooltip-base.ts` holds the contract they share.
 *
 * Every part also takes the props of the radix part it renders, as shadcn's
 * `tooltip` does — `open`/`onOpenChange`/`delayDuration` on `Tooltip`,
 * `sideOffset`/`align` on the content — so a DOM call site ports unchanged.
 */

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type * as React from "react";
import {
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_TEXT_CLASS,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
} from "@/components/ui/tooltip-base";
import { cn } from "@/lib/utils";

/** The shared contract, widened to what the radix part underneath accepts. */
type Wide<Base, Radix> = Base & Omit<Radix, keyof Base>;

// `delayDuration` defaults to shadcn's `0`, not Radix's 700ms. `ActionButton` renders its own
// provider and documents shadcn's default; left to Radix, every icon button waited 700ms.
function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration,
  ...props
}: Wide<TooltipProviderProps, React.ComponentProps<typeof TooltipPrimitive.Provider>>) {
  return (
    <TooltipPrimitive.Provider
      {...props}
      delayDuration={delayDuration}
      {...(skipDelayDuration === undefined ? {} : { skipDelayDuration })}
    />
  );
}

function Tooltip(props: Wide<TooltipProps, React.ComponentProps<typeof TooltipPrimitive.Root>>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  asChild,
  className,
  ...props
}: Wide<TooltipTriggerProps, React.ComponentProps<typeof TooltipPrimitive.Trigger>>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      asChild={asChild ?? false}
      {...(className === undefined ? {} : { className })}
      {...props}
    />
  );
}

function TooltipContent({
  side = "top",
  sideOffset = 4,
  className,
  children,
  ...props
}: Wide<TooltipContentProps, React.ComponentProps<typeof TooltipPrimitive.Content>>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          TOOLTIP_CONTENT_CLASS,
          TOOLTIP_TEXT_CLASS,
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
