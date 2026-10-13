import { describe, expect, it } from "vitest";
import { numberText, parseNumber } from "./number-draft";

/**
 * A text box under a number field, which is what `TextInput` is on device: each key is appended to
 * what the box draws, and the field keeps the text as its draft and stores what it parses to.
 * Storybook's halves both resolve to the DOM `<input type="number">`, which hides a redrawn value
 * from the person typing, so this is where the device's behaviour is pinned.
 */
function box() {
  let draft: string | undefined;
  let stored: number | null = null;
  return {
    type(keys: string) {
      for (const key of keys) {
        draft = numberText(draft, stored) + key;
        stored = parseNumber(draft);
      }
      return { drawn: numberText(draft, stored), stored };
    },
    blur() {
      draft = undefined;
      return { drawn: numberText(draft, stored), stored };
    },
    replace(value: number | null) {
      stored = value;
      return { drawn: numberText(draft, stored), stored };
    },
  };
}

describe("parseNumber", () => {
  it("reads a finished number", () => {
    expect(parseNumber("0.5")).toBe(0.5);
    expect(parseNumber("-3")).toBe(-3);
    expect(parseNumber("1e2")).toBe(100);
    expect(parseNumber(" 7 ")).toBe(7);
  });

  it("reads a trailing point as the number before it", () => {
    expect(parseNumber("1.")).toBe(1);
    expect(parseNumber("0.")).toBe(0);
  });

  it("answers nothing, never zero or NaN, for what is not a number yet", () => {
    for (const text of ["", "  ", "-", ".", "1e", "-.", "abc"]) {
      expect(parseNumber(text)).toBeNull();
    }
  });

  it("refuses what is not finite", () => {
    expect(parseNumber("Infinity")).toBeNull();
    expect(parseNumber("-Infinity")).toBeNull();
    expect(parseNumber("1e999")).toBeNull();
  });
});

describe("numberText", () => {
  it("draws the stored number when nothing is being typed", () => {
    expect(numberText(undefined, 25)).toBe("25");
    expect(numberText(undefined, 0)).toBe("0");
    expect(numberText(undefined, null)).toBe("");
  });

  it("draws the draft while it means the stored number", () => {
    expect(numberText("1.", 1)).toBe("1.");
    expect(numberText("4.0", 4)).toBe("4.0");
    expect(numberText("-", null)).toBe("-");
  });

  it("drops a draft the stored number has moved away from", () => {
    expect(numberText("1.", 7)).toBe("7");
    expect(numberText("12", null)).toBe("");
  });
});

describe("a number typed into a text box (#321)", () => {
  it("keeps the point of 0.5", () => {
    const field = box();
    expect(field.type("0")).toEqual({ drawn: "0", stored: 0 });
    expect(field.type(".")).toEqual({ drawn: "0.", stored: 0 });
    expect(field.type("5")).toEqual({ drawn: "0.5", stored: 0.5 });
  });

  it("takes 4.05, whose middle state 4.0 parses to 4", () => {
    const field = box();
    expect(field.type("4.0")).toEqual({ drawn: "4.0", stored: 4 });
    expect(field.type("5")).toEqual({ drawn: "4.05", stored: 4.05 });
  });

  it("takes a digit after 1.", () => {
    const field = box();
    expect(field.type("1.")).toEqual({ drawn: "1.", stored: 1 });
    expect(field.type("5")).toEqual({ drawn: "1.5", stored: 1.5 });
  });

  it("holds nothing for a lone minus, and keeps it for the digit", () => {
    const field = box();
    expect(field.type("-")).toEqual({ drawn: "-", stored: null });
    expect(field.type("3")).toEqual({ drawn: "-3", stored: -3 });
  });

  it("holds nothing for 1e, and keeps it for the exponent", () => {
    const field = box();
    expect(field.type("1")).toEqual({ drawn: "1", stored: 1 });
    expect(field.type("e")).toEqual({ drawn: "1e", stored: null });
    expect(field.type("2")).toEqual({ drawn: "1e2", stored: 100 });
  });

  it("settles to the stored number on blur", () => {
    const field = box();
    field.type("1.");
    expect(field.blur()).toEqual({ drawn: "1", stored: 1 });
    field.type("e");
    expect(field.blur()).toEqual({ drawn: "", stored: null });
  });

  it("lets a value set from outside replace what was typed", () => {
    const field = box();
    field.type("1.");
    expect(field.replace(42)).toEqual({ drawn: "42", stored: 42 });
  });
});
