/**
 * The half of `SidebarNavItem` a rendered story cannot check: a row is a link or a button, and the
 * props of one are a type error on the other — on both halves, where the button's handler is
 * `onPress` on device and `onClick` once compiled.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { SidebarNavItem as Compiled } from "../compiled/sidebar";
import { SidebarNavItem as Native } from "../registry/layout/sidebar";

const go = () => undefined;

export function SidebarNavItemTypeAssertions() {
  return (
    <>
      <Native href="/inbox" label="Inbox" active />
      <Native href="/inbox" label="Inbox" onPress={go} />
      <Native label="Sign out" onPress={go} />
      {/* @ts-expect-error a row with neither `href` nor `onPress` is neither a link nor a button */}
      <Native label="Nothing" />
      {/* @ts-expect-error a button is never the current page */}
      <Native label="Sign out" onPress={go} active />
      {/* @ts-expect-error and `active` alone does not make it a link */}
      <Native label="Inbox" active />

      <Compiled href="/inbox" label="Inbox" active />
      <Compiled href="/inbox" label="Inbox" onClick={go} />
      <Compiled label="Sign out" onClick={go} />
      {/* @ts-expect-error a row with neither `href` nor `onClick` is neither a link nor a button */}
      <Compiled label="Nothing" />
      {/* @ts-expect-error a button is never the current page */}
      <Compiled label="Sign out" onClick={go} active />
    </>
  );
}
