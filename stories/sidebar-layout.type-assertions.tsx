/**
 * The half of `SidebarLayout`'s `sidebarHideBelow` a rendered story cannot check: the bar's slots
 * exist only where there is a breakpoint for the bar to stand in under, its navigation landmark is
 * always named, and a rail that hides is never also told to stack or draw a rule.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { SidebarLayout as Compiled } from "../compiled/split-layout";
import { SidebarLayout as Native } from "../registry/layout/split-layout";

/** A slot takes an element, never a bare string: any one will do here. */
const node = <i />;

export function SidebarLayoutTypeAssertions() {
  return (
    <>
      <Native contentSlot={node} sidebarSlot={node} stackBelow="md" divider="line" />
      <Native contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" />
      <Native
        contentSlot={node}
        sidebarSlot={node}
        sidebarHideBelow="md"
        divider="none"
        brandSlot={node}
        navSlot={node}
        navLabel="Main"
        status="3/5 servers running"
        actionSlot={node}
      />
      {/* @ts-expect-error the bar's slots need a breakpoint to be drawn under */}
      <Native contentSlot={node} sidebarSlot={node} brandSlot={node} />
      {/* @ts-expect-error the bar's status needs a bar, and so a breakpoint */}
      <Native contentSlot={node} sidebarSlot={node} status="3/5 servers running" />
      {/* @ts-expect-error the bar's navigation landmark is always named */}
      <Native contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" navSlot={node} />
      {/* @ts-expect-error a rail that hides does not stack */}
      <Native contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" stackBelow="lg" />
      {/* @ts-expect-error with the rail gone, a rule would be a line down the edge of the screen */}
      <Native contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" divider="line" />

      <Compiled
        contentSlot={node}
        sidebarSlot={node}
        sidebarHideBelow="lg"
        brandSlot={node}
        navSlot={node}
        navLabel="Main"
        status="3/5 servers running"
      />
      {/* @ts-expect-error the bar's status needs a bar, and so a breakpoint */}
      <Compiled contentSlot={node} sidebarSlot={node} status="3/5 servers running" />
      {/* @ts-expect-error the bar's navigation landmark is always named */}
      <Compiled contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" navSlot={node} />
      {/* @ts-expect-error a label with no navigation to name */}
      <Compiled contentSlot={node} sidebarSlot={node} sidebarHideBelow="md" navLabel="Main" />
    </>
  );
}
