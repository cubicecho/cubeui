/**
 * The half of `SidebarNavItem` a rendered story cannot check: a row is a link, a link whose router
 * supplies the `href`, or a button, and the props of a button are a type error on a link — on both
 * halves, where the button's handler is `onPress` on device and `onClick` once compiled.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { createLink } from "@tanstack/react-router";
import { SidebarNavItem as Compiled } from "../compiled/sidebar";
import { SidebarNavItem as Native } from "../registry/layout/sidebar";

const go = () => undefined;

/** TanStack Router's own link, rendering the row — the case #129 is about. */
const CompiledLink = createLink(Compiled);
const NativeLink = createLink(Native);

export function SidebarNavItemTypeAssertions() {
  return (
    <>
      <Native href="/inbox" label="Inbox" active />
      <Native href="/inbox" label="Inbox" onPress={go} />
      <Native label="Sign out" onPress={go} />
      {/* A router's link row: `<Link href asChild>` hands it the `href` and the press handler. */}
      <Native label="Inbox" active />
      <Native label="Inbox" />
      {/* @ts-expect-error a button is never the current page */}
      <Native label="Sign out" onPress={go} active />

      <Compiled href="/inbox" label="Inbox" active />
      <Compiled href="/inbox" label="Inbox" onClick={go} />
      <Compiled label="Sign out" onClick={go} />
      <Compiled label="Inbox" active />
      {/* @ts-expect-error a button is never the current page */}
      <Compiled label="Sign out" onClick={go} active />

      {/* `createLink` supplies the `href` from `to`, so the destination is written once. */}
      <CompiledLink to="/" label="Documents" />
      <CompiledLink to="/settings" label="Settings" active />
      <NativeLink to="/" label="Documents" active={false} />
      {/* @ts-expect-error the row's own props are still checked through the router's link */}
      <CompiledLink to="/" />
    </>
  );
}
