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
 *
 * Every part also takes the props of the radix part (or element) it renders, as
 * shadcn's `popover` does — `side`, `sideOffset`, `onOpenAutoFocus`, `modal`, a
 * `PopoverAnchor` — so a DOM call site written against shadcn compiles and
 * behaves unchanged. Those extras are web only.
 */

import { Popover as PopoverPrimitive } from "radix-ui";
import type * as React from "react";
import type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverProps,
  PopoverSectionProps,
  PopoverTriggerProps,
} from "@/components/ui/popover-base";
import { cn } from "@/lib/utils";

/** The shared contract, widened to what the radix part (or element) underneath accepts. */
type Wide<Base, Radix> = Base & Omit<Radix, keyof Base>;

function Popover({
  open,
  onOpenChange,
  defaultOpen,
  ...props
}: Wide<PopoverProps, React.ComponentProps<typeof PopoverPrimitive.Root>>) {
  // Spread rather than passed: radix switches to uncontrolled on `open === undefined`,
  // but only if the prop is absent, and `exactOptionalPropertyTypes` is what makes the
  // difference expressible.
  return (
    <PopoverPrimitive.Root
      data-slot="popover"
      {...props}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
    />
  );
}

function PopoverTrigger({
  asChild,
  ...props
}: Wide<PopoverTriggerProps, React.ComponentProps<typeof PopoverPrimitive.Trigger>>) {
  return (
    <PopoverPrimitive.Trigger data-slot="popover-trigger" asChild={asChild ?? false} {...props} />
  );
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: Wide<PopoverContentProps, React.ComponentProps<typeof PopoverPrimitive.Content>>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  asChild,
  ...props
}: Wide<PopoverAnchorProps, React.ComponentProps<typeof PopoverPrimitive.Anchor>>) {
  return (
    <PopoverPrimitive.Anchor data-slot="popover-anchor" asChild={asChild ?? false} {...props} />
  );
}

function PopoverClose({
  asChild,
  className,
  ...props
}: Wide<PopoverCloseProps, React.ComponentProps<typeof PopoverPrimitive.Close>>) {
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      asChild={asChild ?? false}
      {...(className === undefined ? {} : { className })}
      {...props}
    />
  );
}

function PopoverHeader({
  className,
  ...props
}: Wide<PopoverSectionProps, React.ComponentProps<"div">>) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  );
}

function PopoverTitle({
  className,
  ...props
}: Wide<PopoverSectionProps, React.ComponentProps<"div">>) {
  return <div data-slot="popover-title" className={cn("font-medium", className)} {...props} />;
}

function PopoverDescription({
  className,
  ...props
}: Wide<PopoverSectionProps, React.ComponentProps<"p">>) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
