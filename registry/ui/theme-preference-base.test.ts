import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_PRE_PAINT_SCRIPT, THEME_STORAGE_KEY } from "./theme-preference-base";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("THEME_PRE_PAINT_SCRIPT", () => {
  // The skill's copy is what a static `index.html` pastes. A change to the rule that misses it
  // paints one theme before React mounts and the hook repaints the other.
  it("is what the skill tells an index.html to paste", () => {
    const pasted = read("registry/skill/controls.md").match(/<script>(.*)<\/script>/);
    expect(pasted?.[1]).toBe(THEME_PRE_PAINT_SCRIPT);
  });

  it("reads the key the hooks write", () => {
    expect(THEME_PRE_PAINT_SCRIPT).toContain(`localStorage.getItem("${THEME_STORAGE_KEY}")`);
  });

  it("parses as a script", () => {
    expect(() => new Function(THEME_PRE_PAINT_SCRIPT)).not.toThrow();
  });
});

// The class the web hook puts on `<html>` is only worth something if both stylesheets read it.
describe("the classes the web hook sets", () => {
  it("are read by the DOM registry's tokens", () => {
    expect(read("dist/tokens.web.css")).toMatch(/^\.dark\s*\{/m);
  });

  it("override the media query in the Expo web tokens, both ways", () => {
    const css = read("dist/tokens.native.css");
    expect(css).toContain(":is(html.dark)");
    expect(css).toContain(":is(html.light)");
  });
});
