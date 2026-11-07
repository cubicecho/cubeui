import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, MouseEvent, ReactElement, ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as Compiled } from "../compiled/button";
import { Button as Native } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * A `Button` with a `linkSlot`, on both halves — issue #156, from when this was `asChild`. The
 * anchor has to come out looking like the plain `Button` beside it: same padding, border, radius
 * and background.
 *
 * It did not. The `Slot` was handed the icon-colour provider as its one child rather than the
 * caller's element, so the classes and the press were merged onto a context provider and dropped,
 * and the anchor rendered as bare text.
 */
const meta = { title: "RN Parity/Button/link" } satisfies Meta;
export default meta;
type Story = StoryObj;

type ButtonLike = ComponentType<{
  content?: ReactNode;
  linkSlot?: ReactElement;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  hint?: string;
}>;

function Pair({ Button, name }: { Button: ButtonLike; name: string }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      <Button variant="outline" content={`${name} plain`} />
      <Button
        variant="outline"
        // biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route
        linkSlot={<a href="#" />}
        content={`${name} link`}
      />
      <Button variant="destructive" content={`${name} plain destructive`} />
      <Button
        variant="destructive"
        // biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route
        linkSlot={<a href="#" />}
        content={`${name} destructive link`}
      />
    </div>
  );
}

const LOOK = [
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderTopLeftRadius",
  "backgroundColor",
  "color",
] as const;

function look(el: Element) {
  const style = getComputedStyle(el);
  return {
    ...Object.fromEntries(LOOK.map((key) => [key, style[key]])),
    // The edge's colour and style only once there is an edge: react-native-web gives every view
    // `border-style: solid`, and an `<a>` has `none`, which draw the same at zero width.
    ...(style.borderTopWidth === "0px"
      ? {}
      : { borderTopStyle: style.borderTopStyle, borderTopColor: style.borderTopColor }),
  };
}

async function linksLookLikeButtons(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement);
  for (const [plainName, linkName] of [
    [`${name} plain`, `${name} link`],
    [`${name} plain destructive`, `${name} destructive link`],
  ] as const) {
    const plain = canvas.getByRole("button", { name: plainName });
    const link = canvas.getByRole("link", { name: linkName });
    // Still the caller's element, with its own `href` — the classes arrived on it, not around it.
    await expect(link.tagName).toBe("A");
    await expect(link).toHaveAttribute("href", "#");
    await expect(look(link)).toEqual(look(plain));
  }
  // And it is not merely equal to an unstyled default: the outline has a border to draw, and the
  // destructive one a surface.
  const outline = getComputedStyle(canvas.getByRole("link", { name: `${name} link` }));
  await expect(outline.borderTopWidth).not.toBe("0px");
  const destructive = getComputedStyle(
    canvas.getByRole("link", { name: `${name} destructive link` }),
  );
  await expect(destructive.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
}

export const OverALink: Story = {
  render: () => (
    <SideBySide
      native={<Pair Button={Native as unknown as ButtonLike} name="Native" />}
      compiled={<Pair Button={Compiled as unknown as ButtonLike} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    await linksLookLikeButtons(canvasElement, "Native");
    await linksLookLikeButtons(canvasElement, "Compiled");
  },
};

// The press also stops the placeholder `href` from moving the page.
const stay = (event?: { preventDefault?: () => void }) => event?.preventDefault?.();
const pressed = { Native: fn(stay), Compiled: fn(stay) };

/**
 * A link button's press runs when the link is a DOM element. The native half handed a bare `<a>`
 * an `onPress`, which React drops with a warning, so the press never ran. The compiled half's
 * prop is `onClick`, as every compiled press is.
 */
export const PressReachesADomLink: Story = {
  render: () => (
    <SideBySide
      native={
        <Native
          // biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route
          linkSlot={<a href="#" />}
          onPress={pressed.Native}
          content="Native pressed link"
        />
      }
      compiled={
        <Compiled
          // biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route
          linkSlot={<a href="#" />}
          onClick={pressed.Compiled}
          content="Compiled pressed link"
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Native", "Compiled"] as const) {
      pressed[name].mockClear();
      await userEvent.click(canvas.getByRole("link", { name: `${name} pressed link` }));
      await expect(pressed[name]).toHaveBeenCalledTimes(1);
    }
  },
};

const navigated = fn();

type RouterLinkProps = {
  to: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onPress?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
};

/**
 * A stand-in for a router's link, built the way React Router's, TanStack Router's and
 * expo-router's are: an `<a>` that takes every prop it does not know, and navigates on a click
 * nobody cancelled. The native half hands a component `onPress`, the compiled half `onClick`.
 */
function RouterLink({ to, onClick, onPress, ...props }: RouterLinkProps) {
  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        onPress?.(event);
        if (event.defaultPrevented) {
          return;
        }
        event.preventDefault();
        navigated(to);
      }}
    />
  );
}

const FOLLOWED = "#followed";

function DisabledLinks({ Button, name }: { Button: ButtonLike; name: string }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      <Button disabled linkSlot={<a href={FOLLOWED} />} content={`${name} disabled link`} />
      <Button
        disabled
        hint="Publish the page first"
        linkSlot={<a href={FOLLOWED} />}
        content={`${name} hinted link`}
      />
      <Button
        disabled
        linkSlot={<RouterLink to="/docs" />}
        content={`${name} disabled router link`}
      />
    </div>
  );
}

/** Whether the browser would open the link in a new tab on a middle-button click. */
function middleClickOpens(link: HTMLElement) {
  return link.dispatchEvent(
    new globalThis.MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }),
  );
}

/**
 * A disabled link button is not followed (#410). It was handed `disabled` through `Slot`, which an
 * `<a>` ignores, so a click still navigated and the attribute was written on the link for nothing.
 * Now it is `aria-disabled`, its click and middle click are cancelled, and it leaves the tab order
 * unless a `hint` keeps it there to be asked why, as a hinted disabled button does. A router's
 * link is handed no `disabled` either, since one that passes its props to its `<a>` would write it.
 */
export const DisabledLinksAreNotFollowed: Story = {
  render: () => (
    <SideBySide
      native={<DisabledLinks Button={Native as unknown as ButtonLike} name="Native" />}
      compiled={<DisabledLinks Button={Compiled as unknown as ButtonLike} name="Compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stayPut = () =>
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    for (const name of ["Native", "Compiled"] as const) {
      navigated.mockClear();
      stayPut();

      const plain = canvas.getByRole("link", { name: `${name} disabled link` });
      await expect(plain).toHaveAttribute("aria-disabled", "true");
      await expect(plain).not.toHaveAttribute("disabled");
      await expect(plain).toHaveAttribute("tabindex", "-1");
      await userEvent.click(plain);
      await expect({ name, hash: window.location.hash }).toEqual({ name, hash: "" });
      await expect(middleClickOpens(plain)).toBe(false);

      const hinted = canvas.getByRole("link", { name: `${name} hinted link` });
      await expect(hinted).toHaveAttribute("aria-disabled", "true");
      await expect(hinted).not.toHaveAttribute("disabled");
      hinted.focus();
      await expect(hinted).toHaveFocus();
      await userEvent.click(hinted);
      await expect({ name, hash: window.location.hash }).toEqual({ name, hash: "" });

      const routed = canvas.getByRole("link", { name: `${name} disabled router link` });
      await expect(routed).toHaveAttribute("aria-disabled", "true");
      await expect(routed).not.toHaveAttribute("disabled");
      await expect(routed).toHaveAttribute("tabindex", "-1");
      await userEvent.click(routed);
      await expect(navigated).not.toHaveBeenCalled();
    }
    stayPut();
  },
};
