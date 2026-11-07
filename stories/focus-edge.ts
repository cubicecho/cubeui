import { expect, userEvent } from "storybook/test";

/** What `var(--<token>)` resolves to right now, in the colour syntax the browser reports. */
export function tokenColor(token: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** More than any story here puts between the top of the canvas and the pane. */
const MAX_TABS = 20;

/**
 * Holds a pane that is a tab stop so a keyboard can scroll it to `FOCUS_EDGE`: focused as a
 * mouse click leaves it, it shows nothing; tabbed to, it draws no ring and its edge turns `active`.
 *
 * The click is a script focus with `focusVisible: false`, not `userEvent.click`. The story's click
 * is synthetic, so Chromium counts the focus it moves as a script's and shows it; `focusVisible:
 * false` is the state a real click puts the pane in. TypeScript's `FocusOptions` does not have the
 * option yet.
 */
export async function expectFocusEdge(pane: HTMLElement, canvasElement: HTMLElement) {
  const rest = getComputedStyle(pane).borderTopColor;

  pane.focus({ focusVisible: false } as FocusOptions);
  await expect(pane).toHaveFocus();
  await expect(pane.matches(":focus-visible")).toBe(false);
  await expect(getComputedStyle(pane).outlineStyle).toBe("none");
  await expect(getComputedStyle(pane).borderTopColor).toBe(rest);

  await userEvent.click(canvasElement);
  for (let tabs = 0; tabs < MAX_TABS && document.activeElement !== pane; tabs++) {
    await userEvent.tab();
  }
  await expect(pane).toHaveFocus();
  await expect(pane.matches(":focus-visible")).toBe(true);
  const focused = getComputedStyle(pane);
  await expect(focused.outlineStyle).toBe("none");
  await expect(focused.borderTopWidth).not.toBe("0px");
  await expect(focused.borderTopColor).toBe(tokenColor("active"));
  await expect(focused.borderTopColor).not.toBe(rest);
}
