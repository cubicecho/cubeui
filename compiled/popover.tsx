/**
 * Copied from `registry/ui/popover.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web popover: radix, anchored to its trigger. `popover.tsx` is the native
 * counterpart and `popover-base.ts` holds the contract they share.
 */

import { Popover as PopoverPrimitive } from "radix-ui";
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from "@/components/ui/popover-base";
import { cn } from "@/lib/utils";

function Popover({ open, onOpenChange, children }: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </PopoverPrimitive.Root>
  );
}

function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger asChild={asChild ?? false}>{children}</PopoverPrimitive.Trigger>;
}

function PopoverContent({ className, align = "center", children }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={4}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
