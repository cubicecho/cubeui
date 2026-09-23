/**
 * Copied from `registry/ui/tabs.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web tabs: radix. `tabs.tsx` is the native counterpart and `tabs-base.ts`
 * holds the contract they share.
 *
 * Every part also takes the props of the radix part it renders, as shadcn's
 * `tabs` does, so a DOM call site ports unchanged.
 */

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import {
  TABS_LIST_CLASS,
  TABS_TRIGGER_CLASS,
  TABS_TRIGGER_TEXT_CLASS,
  type TabsContentProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
} from "@/components/ui/tabs-base";
import { cn } from "@/lib/utils";

/** The shared contract, widened to what the radix part underneath accepts. */
type Wide<Base, Radix> = Base & Omit<Radix, keyof Base>;

function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  ...props
}: Wide<TabsProps, React.ComponentProps<typeof TabsPrimitive.Root>>) {
  // Spread only when given, so an absent `value` leaves radix uncontrolled.
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(className)}
      {...props}
      {...(value === undefined ? {} : { value })}
      {...(onValueChange === undefined ? {} : { onValueChange })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
    />
  );
}

function TabsList({
  className,
  ...props
}: Wide<TabsListProps, React.ComponentProps<typeof TabsPrimitive.List>>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex text-muted-foreground", TABS_LIST_CLASS, className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  disabled,
  ...props
}: Wide<TabsTriggerProps, React.ComponentProps<typeof TabsPrimitive.Trigger>>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      {...(disabled === undefined ? {} : { disabled })}
      // An icon child takes the trigger's colour through `currentColor`, so only
      // its size is set here; device has no inheritance and uses a context.
      className={cn(
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "inline-flex whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        TABS_TRIGGER_CLASS,
        TABS_TRIGGER_TEXT_CLASS,
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: Wide<TabsContentProps, React.ComponentProps<typeof TabsPrimitive.Content>>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
