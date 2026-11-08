import { describe, expect, it } from "vitest";
import { hexToAccent, hexToHsl } from "./color";

describe("hexToAccent", () => {
  // Every spelling `ColorPicker` can hand `Card accentColor`. `#f80` drew no stripe at all
  // (`hsl(NaN, NaN%, NaN%)`), and `ff8800` came out a degree off, read from the wrong offsets.
  it.each(["#f80", "f80", "#ff8800", "ff8800"])("reads %s as orange", (hex) => {
    expect(hexToAccent(hex)).toBe("hsl(32, 100%, 50%)");
  });

  it("keeps the hue of a near-white pick and pulls its lightness into the mid range", () => {
    expect(hexToAccent("#fefefe")).toBe("hsl(0, 0%, 62%)");
    expect(hexToAccent("#0a0a0a")).toBe("hsl(0, 0%, 38%)");
  });

  it("is undefined for what is not a hex colour, rather than an hsl() of NaN", () => {
    expect(hexToAccent("orange")).toBeUndefined();
    expect(hexToAccent("#ff880")).toBeUndefined();
  });
});

describe("hexToHsl", () => {
  it("reads a short hex as each digit doubled", () => {
    expect(hexToHsl("#0f0")).toEqual(hexToHsl("#00ff00"));
    expect(hexToHsl("00f")).toEqual({ h: 240, s: 1, l: 0.5 });
  });
});
