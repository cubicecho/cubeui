/**
 * The half of `SidebarSection as="nav"` a rendered story cannot check: `label` names the landmark,
 * so it is a type error on a section that is not one — on both halves.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { SidebarSection as Compiled } from "../compiled/sidebar";
import { SidebarSection as Native } from "../registry/layout/sidebar";

export function SidebarSectionTypeAssertions() {
  return (
    <>
      <Native as="nav" title="Projects" />
      <Native as="nav" label="Main" />
      <Native title="Recent" />
      {/* @ts-expect-error a `label` with no landmark to name is a name nothing reads */}
      <Native title="Recent" label="Recent" />
      {/* @ts-expect-error `nav` is the one landmark a section can be */}
      <Native as="aside" title="Recent" />

      <Compiled as="nav" title="Projects" />
      <Compiled as="nav" label="Main" />
      {/* @ts-expect-error a `label` with no landmark to name is a name nothing reads */}
      <Compiled title="Recent" label="Recent" />
    </>
  );
}
