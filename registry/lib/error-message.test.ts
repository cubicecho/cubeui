import { describe, expect, it } from "vitest";
import { messageOf } from "./error-message";

describe("messageOf", () => {
  it("answers nothing for no error", () => {
    expect(messageOf(undefined)).toBeUndefined();
    expect(messageOf(null)).toBeUndefined();
  });

  it("hands a string back as it is, an empty one included", () => {
    expect(messageOf("Required")).toBe("Required");
    expect(messageOf("")).toBe("");
  });

  it("reads the message off an object, whatever type it holds", () => {
    expect(messageOf({ message: "Too short" })).toBe("Too short");
    expect(messageOf(new Error("Rejected"))).toBe("Rejected");
    expect(messageOf({ message: 404 })).toBe("404");
  });

  it("falls back to String for anything else", () => {
    expect(messageOf(false)).toBe("false");
    expect(messageOf(7)).toBe("7");
  });
});
