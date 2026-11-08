import { expect, screen, userEvent } from "storybook/test";

/** How long a hover is given to open a tooltip that should not open. */
const NO_TOOLTIP_MS = 200;

/**
 * Hovers `target` and fails if a tooltip opens, or if the button is described by one: a name
 * tooltip wired as the description is read as "Clear search, Clear search".
 *
 * A tooltip with no provider above it opens at once (`tooltip.web.tsx`), so the wait is only for
 * radix to mount the bubble.
 */
export async function expectNoTooltipOnHover(target: HTMLElement) {
  await userEvent.hover(target);
  await new Promise((resolve) => setTimeout(resolve, NO_TOOLTIP_MS));
  await expect(screen.queryByRole("tooltip")).toBeNull();
  await expect(target).toHaveAccessibleDescription("");
  await userEvent.unhover(target);
}
