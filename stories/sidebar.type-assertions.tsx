/**
 * The half of `SidebarNavItem` a rendered story cannot check: a row is a link, a link whose router
 * supplies the `href`, or a button, and the props of a button are a type error on a link — on both
 * halves, where the button's handler is `onPress` on device and `onClick` once compiled.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening.
 */

import { createLink } from "@tanstack/react-router";
import { SidebarNavItem as Compiled, BarNavItem as CompiledBar } from "../compiled/sidebar";
import { SidebarNavItem as Native, BarNavItem as NativeBar } from "../registry/layout/sidebar";

const go = () => undefined;

/** TanStack Router's own link, rendering the row — the case #129 is about. */
const CompiledLink = createLink(Compiled);
const NativeLink = createLink(Native);

/** The bar's item binds the same way, so one array of places feeds both. */
const CompiledBarLink = createLink(CompiledBar);
const NativeBarLink = createLink(NativeBar);

/** One place, written once, spread into the row and into the bar's item. */
const place = { label: "Skills", icon: "icon", count: 12, status: { label: "MCP on" } };

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

      {/* The bar's item takes the row's props: the same object feeds both. */}
      <Native href="/skills" active {...place} />
      <NativeBar href="/skills" active {...place} />
      <Compiled href="/skills" active {...place} />
      <CompiledBar href="/skills" active {...place} />
      {/* A router's link hands it the `href`, as it does the row. */}
      <NativeBar label="Skills" icon="icon" />
      <NativeBarLink to="/" label="Skills" icon="icon" active={false} />
      <CompiledBarLink to="/" label="Skills" icon="icon" count="99+" />
      {/* @ts-expect-error an icon-only link has no name unless it is given one */}
      <NativeBar href="/skills" icon="icon" />
      {/* @ts-expect-error an icon-only link has no name unless it is given one */}
      <CompiledBar href="/skills" icon="icon" />
      {/* @ts-expect-error the icon is all that is drawn, so there is always one */}
      <NativeBar href="/skills" label="Skills" />
      {/* @ts-expect-error the icon is all that is drawn, so there is always one */}
      <CompiledBar href="/skills" label="Skills" />
      {/* @ts-expect-error a status is words to read, not a node */}
      <NativeBar href="/skills" label="Skills" icon="icon" status="MCP on" />
      {/* @ts-expect-error the item's own props are still checked through the router's link */}
      <CompiledBarLink to="/" label="Skills" />
    </>
  );
}
