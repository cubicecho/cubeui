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

export function SidebarLayoutTypeAssertions() {
  return (
    <>
      <Native content="page" sidebar="rail" stackBelow="md" divider="line" />
      <Native content="page" sidebar="rail" sidebarHideBelow="md" />
      <Native
        content="page"
        sidebar="rail"
        sidebarHideBelow="md"
        divider="none"
        brand="App"
        nav="links"
        navLabel="Main"
        action="theme"
      />
      {/* @ts-expect-error the bar's slots need a breakpoint to be drawn under */}
      <Native content="page" sidebar="rail" brand="App" />
      {/* @ts-expect-error the bar's navigation landmark is always named */}
      <Native content="page" sidebar="rail" sidebarHideBelow="md" nav="links" />
      {/* @ts-expect-error a rail that hides does not stack */}
      <Native content="page" sidebar="rail" sidebarHideBelow="md" stackBelow="lg" />
      {/* @ts-expect-error with the rail gone, a rule would be a line down the edge of the screen */}
      <Native content="page" sidebar="rail" sidebarHideBelow="md" divider="line" />

      <Compiled
        content="page"
        sidebar="rail"
        sidebarHideBelow="lg"
        brand="App"
        nav="links"
        navLabel="Main"
      />
      {/* @ts-expect-error the bar's navigation landmark is always named */}
      <Compiled content="page" sidebar="rail" sidebarHideBelow="md" nav="links" />
      {/* @ts-expect-error a label with no navigation to name */}
      <Compiled content="page" sidebar="rail" sidebarHideBelow="md" navLabel="Main" />
    </>
  );
}
