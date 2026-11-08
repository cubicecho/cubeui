import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { placeTooltip, TOOLTIP_EDGE, TOOLTIP_GAP, tooltipVisibleMs } from "./tooltip-base";

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

describe("placeTooltip", () => {
  const room = { width: 390, height: 800 };
  const bubble = { width: 200, height: 40 };

  // The bubble is its own width, not the trigger's, and centred on it (#509).
  it("centres the bubble over the trigger", () => {
    const trigger = { x: 170, y: 400, width: 50, height: 40 };
    expect(placeTooltip(trigger, bubble, room, "top")).toEqual({
      x: 95,
      y: 400 - TOOLTIP_GAP - 40,
      side: "top",
    });
  });

  it("slides along to stay clear of the screen's edges", () => {
    const left = placeTooltip({ x: 0, y: 400, width: 44, height: 44 }, bubble, room, "bottom");
    expect(left.x).toBe(TOOLTIP_EDGE);
    const right = placeTooltip({ x: 346, y: 400, width: 44, height: 44 }, bubble, room, "bottom");
    expect(right.x).toBe(room.width - TOOLTIP_EDGE - bubble.width);
  });

  it("opens on the other side when its own has no room", () => {
    const atTop = { x: 170, y: 10, width: 44, height: 44 };
    expect(placeTooltip(atTop, bubble, room, "top")).toMatchObject({
      y: 10 + 44 + TOOLTIP_GAP,
      side: "bottom",
    });
    const atEnd = { x: 300, y: 400, width: 44, height: 44 };
    expect(placeTooltip(atEnd, bubble, room, "right").side).toBe("left");
  });

  it("keeps its side when neither has room, and stays on screen", () => {
    const tall = { width: 200, height: 790 };
    const placed = placeTooltip({ x: 170, y: 380, width: 44, height: 44 }, tall, room, "top");
    expect(placed.side).toBe("top");
    expect(placed.y).toBe(TOOLTIP_EDGE);
  });
});
