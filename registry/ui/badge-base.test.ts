import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { badgeRemoveLabel } from "./badge-base";

describe("badgeRemoveLabel", () => {
  it("names the ✕ after the badge's text", () => {
    expect(badgeRemoveLabel("Urgent")).toBe("Remove Urgent");
    expect(badgeRemoveLabel(3)).toBe("Remove 3");
  });

  // An icon beside the text is not part of the name; the words around it are.
  it("reads the text children and skips the elements", () => {
    expect(badgeRemoveLabel([createElement("svg", { key: "i" }), " Design"])).toBe("Remove Design");
  });

  it("falls back to `label` when the children hold no text", () => {
    expect(badgeRemoveLabel(createElement("svg"), "Starred")).toBe("Remove Starred");
  });

  // Never `Remove undefined`: a bare verb is a worse name than a word, and a better one than that.
  it("says only Remove when there is nothing to name", () => {
    expect(badgeRemoveLabel(createElement("svg"))).toBe("Remove");
  });
});
