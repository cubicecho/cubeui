import { expect, userEvent } from "storybook/test";
import { tokenColor } from "./token-color";

/** What a 1px inset line in `var(--<token>)` computes to, in the syntax the browser reports. */
function insetLine(token: string) {
  const probe = document.createElement("span");
  probe.style.boxShadow = `inset 0 0 0 1px var(--${token})`;
  document.body.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

/** The pane's focus line, as a border or, where a border would take room, as an inset shadow. */
type Edge = "border" | "inset";

/** What the pane's edge looks like right now, read the way it is drawn. */
function edgeOf(pane: HTMLElement, edge: Edge) {
  const style = getComputedStyle(pane);
  return edge === "border" ? style.borderTopColor : style.boxShadow;
}

/** More than any story here puts between the top of the canvas and what it tabs to. */
const MAX_TABS = 40;

/**
 * Tabs from the top of the canvas until `target` has focus, as a keyboard reaches it, and holds
 * that it is focus-visible and draws no ring: nothing in the registry does, and a focused thing
 * shows it in its own look, which the caller checks.
 */
export async function tabTo(target: HTMLElement, canvasElement: HTMLElement) {
  await userEvent.click(canvasElement);
  for (let tabs = 0; tabs < MAX_TABS && document.activeElement !== target; tabs++) {
    await userEvent.tab();
  }
  await expect(target).toHaveFocus();
  await expect(target.matches(":focus-visible")).toBe(true);
  await expect(getComputedStyle(target).outlineStyle).toBe("none");
}

/**
 * Holds a pane that is a tab stop so a keyboard can scroll it to `FOCUS_EDGE`: focused as a
 * mouse click leaves it, it shows nothing; tabbed to, it draws no ring and its edge turns `active`.
 * `inset` reads the line as a page body draws it, as a shadow that takes no room.
 *
 * The click is a script focus with `focusVisible: false`, not `userEvent.click`. The story's click
 * is synthetic, so Chromium counts the focus it moves as a script's and shows it; `focusVisible:
 * false` is the state a real click puts the pane in. TypeScript's `FocusOptions` does not have the
 * option yet.
 */
export async function expectFocusEdge(
  pane: HTMLElement,
  canvasElement: HTMLElement,
  edge: Edge = "border",
) {
  const rest = edgeOf(pane, edge);

  pane.focus({ focusVisible: false } as FocusOptions);
  await expect(pane).toHaveFocus();
  await expect(pane.matches(":focus-visible")).toBe(false);
  await expect(getComputedStyle(pane).outlineStyle).toBe("none");
  await expect(edgeOf(pane, edge)).toBe(rest);

  await tabTo(pane, canvasElement);
  await expect(edgeOf(pane, edge)).not.toBe(rest);
  if (edge === "border") {
    await expect(getComputedStyle(pane).borderTopWidth).not.toBe("0px");
    await expect(edgeOf(pane, edge)).toBe(tokenColor("active"));
  } else {
    // Tailwind stacks its ring layers, transparent, ahead of the shadow: the line is the last.
    await expect(
      edgeOf(pane, edge)
        .split(/,\s*(?![^(]*\))/)
        .at(-1),
    ).toBe(insetLine("active"));
  }
}
