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
 */

import { Tabs as TabsPrimitive } from "radix-ui";
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

function Tabs({ defaultValue, className, children }: TabsProps) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className={cn(className)}>
      {children}
    </TabsPrimitive.Root>
  );
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex text-muted-foreground", TABS_LIST_CLASS, className)}
    >
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "inline-flex whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        TABS_TRIGGER_CLASS,
        TABS_TRIGGER_TEXT_CLASS,
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ value, className, children }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
