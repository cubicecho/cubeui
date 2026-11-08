import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { tooltipVisibleMs } from "./tooltip-base";

describe("tooltipVisibleMs", () => {
  it("keeps a short name up for the least time", () => {
    expect(tooltipVisibleMs("Edit")).toBe(2500);
  });

  // A fixed 2.5s took a long hint away before it could be read (WCAG 2.2.1).
  it("keeps a long hint up longer", () => {
    const hint = "Empty the lane first: a lane with cards in it cannot be deleted.";
    expect(tooltipVisibleMs(hint)).toBeGreaterThan(2500);
    expect(tooltipVisibleMs(`${hint} ${hint}`)).toBeGreaterThan(tooltipVisibleMs(hint));
  });

  it("counts the text inside elements", () => {
    const words = "Servers, 2 failing, 5 queued, and a long name after them";
    const node = createElement("span", null, "Servers, ", createElement("b", null, words));
    expect(tooltipVisibleMs(node)).toBe(tooltipVisibleMs(`Servers, ${words}`));
  });
});
