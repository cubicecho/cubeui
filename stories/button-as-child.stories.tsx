import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { expect, within } from "storybook/test";
import { Button as Compiled } from "../compiled/button";
import { Button as Native } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * `<Button asChild>` over a link, on both halves — issue #156. The anchor has to come out looking
 * like the plain `Button` beside it: same padding, border, radius and background.
 *
 * It did not. The `Slot` was handed the icon-colour provider as its one child rather than the
 * caller's element, so the classes and the press were merged onto a context provider and dropped,
 * and the anchor rendered as bare text. shadcn's `AlertDialogAction` and `AlertDialogCancel` are
 * `Button asChild`, so every alert dialog — `ConfirmButton`'s included — lost its buttons' look.
 */
const meta = { title: "Stage 0/Button asChild" } satisfies Meta;
export default meta;
type Story = StoryObj;

type ButtonLike = ComponentType<{
  children?: ReactNode;
  asChild?: boolean;
  variant?: "default" | "outline" | "destructive";
}>;

function Pair({ Button, name }: { Button: ButtonLike; name: string }) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      <Button variant="outline">{`${name} plain`}</Button>
      <Button variant="outline" asChild>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route */}
        <a href="#">{`${name} link`}</a>
      </Button>
      <Button variant="destructive">{`${name} plain destructive`}</Button>
      <Button variant="destructive" asChild>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is a placeholder for a route */}
        <a href="#">{`${name} destructive link`}</a>
      </Button>
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
