import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { commandItemText, matchesEveryWord } from "./command-base";

describe("matchesEveryWord", () => {
  it("matches everything while the search is blank", () => {
    expect(matchesEveryWord("Calendar", "")).toBe(1);
    expect(matchesEveryWord("Calendar", "   ")).toBe(1);
  });

  // "back end" finds "Backend infrastructure": each word on its own, in any order, any case.
  it("wants every word, in any order, ignoring case", () => {
    expect(matchesEveryWord("Backend infrastructure", "INFRA back")).toBe(1);
    expect(matchesEveryWord("Backend infrastructure", "back front")).toBe(0);
  });

  it("searches the keywords as well as the value", () => {
    expect(matchesEveryWord("Carrot", "orange")).toBe(0);
    expect(matchesEveryWord("Carrot", "orange", ["orange", "root"])).toBe(1);
  });
});

describe("commandItemText", () => {
  it("joins the string and number children, however deep", () => {
    const row = [
      createElement("svg", { key: "icon" }),
      createElement("span", { key: "name" }, "Calendar ", createElement("b", null, 3)),
    ];
    expect(commandItemText(row)).toBe("Calendar 3");
  });

  it("is empty for a row of elements with no text", () => {
    expect(commandItemText(createElement("svg"))).toBe("");
  });
});
