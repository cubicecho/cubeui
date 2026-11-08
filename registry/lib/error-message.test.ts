import { describe, expect, it } from "vitest";
import { describeError, messageOf } from "./error-message";

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

describe("describeError", () => {
  it("says the server could not be reached, in each runtime's spelling of it", () => {
    const reach = "Could not reach the server. Check your connection and try again.";
    expect(describeError(new TypeError("Failed to fetch"))).toBe(reach);
    expect(describeError(new TypeError("NetworkError when attempting to fetch resource."))).toBe(
      reach,
    );
    expect(describeError(new TypeError("Network request failed"))).toBe(reach);
    expect(describeError(new TypeError("Load failed"))).toBe(reach);
    expect(describeError("Failed to fetch")).toBe(reach);
  });

  it("says an expired session is one", () => {
    expect(describeError(new Error("Not authenticated"))).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("shows any other message as it is", () => {
    expect(describeError(new Error("Row 12 is locked."))).toBe("Row 12 is locked.");
    expect(describeError({ message: "Received status code 500" })).toBe("Received status code 500");
  });

  it("is never empty", () => {
    for (const error of [undefined, null, "", new Error(""), { message: 404 }, 7]) {
      expect(describeError(error)).toBe("An unexpected error occurred.");
    }
  });
});
