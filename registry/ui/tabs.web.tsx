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
      className={cn("inline-flex text-foreground/60", TABS_LIST_CLASS, className)}
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
        "inline-flex whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-foreground/60 hover:bg-hover hover:text-foreground data-[state=inactive]:focus-visible:bg-hover data-[state=inactive]:focus-visible:text-foreground data-[state=active]:focus-visible:bg-active/90 data-[state=active]:bg-active data-[state=active]:text-active-foreground",
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
      className={cn("mt-2 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
