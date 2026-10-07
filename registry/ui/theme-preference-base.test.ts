import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { palettes } from "../../dist/cubeui-theme";
import {
  DARK_ONLY_PALETTES,
  PALETTE_PREFERENCES,
  PALETTE_STORAGE_KEY,
  THEME_PRE_PAINT_SCRIPT,
  THEME_STORAGE_KEY,
  themePrePaintScript,
} from "./theme-preference-base";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("THEME_PRE_PAINT_SCRIPT", () => {
  // The skill's copy is what a static `index.html` pastes. A change to the rule that misses it
  // paints one theme before React mounts and the hook repaints the other.
  it("is what the skill tells an index.html to paste", () => {
    const pasted = read("skill/controls.md").match(/<script>(.*)<\/script>/);
    expect(pasted?.[1]).toBe(THEME_PRE_PAINT_SCRIPT);
  });

  it("reads the keys the hooks write", () => {
    expect(THEME_PRE_PAINT_SCRIPT).toContain(`getItem("${THEME_STORAGE_KEY}")`);
    expect(THEME_PRE_PAINT_SCRIPT).toContain(`getItem("${PALETTE_STORAGE_KEY}")`);
  });

  it("parses as a script", () => {
    expect(() => new Function(THEME_PRE_PAINT_SCRIPT)).not.toThrow();
  });
});

/** The script run against a page that holds `items`, giving back what storage holds after. */
function prePaint(script: string, items: Record<string, string>) {
  const store = new Map(Object.entries(items));
  const classes = new Set<string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  const document = {
    documentElement: {
      classList: {
        toggle: (name: string, on: boolean) => void (on ? classes.add(name) : classes.delete(name)),
      },
      setAttribute: (name: string, value: string) => void classes.add(`${name}=${value}`),
    },
  };
  new Function("localStorage", "document", "matchMedia", script)(localStorage, document, () => ({
    matches: false,
  }));
  return { stored: Object.fromEntries(store), painted: [...classes].sort() };
}

// Issue #266: an app that had its own theme key lost every reader's choice on adopting the picker.
describe("themePrePaintScript with legacy keys", () => {
  const script = themePrePaintScript({
    legacyKeys: { theme: ["app-theme", "app-theme-v0"], palette: ["app-palette"] },
  });

  it("is the plain script when there is nothing to migrate", () => {
    expect(themePrePaintScript()).toBe(THEME_PRE_PAINT_SCRIPT);
    expect(themePrePaintScript({ legacyKeys: { theme: [] } })).toBe(THEME_PRE_PAINT_SCRIPT);
  });

  it("paints the old choice on the first load, and moves it to our key", () => {
    expect(prePaint(script, { "app-theme": "dark", "app-palette": "monokai" })).toEqual({
      stored: { [THEME_STORAGE_KEY]: "dark", [PALETTE_STORAGE_KEY]: "monokai" },
      painted: ["dark", "data-palette=monokai"],
    });
  });

  it("takes the first old key that holds one of our values", () => {
    expect(prePaint(script, { "app-theme": "sepia", "app-theme-v0": "light" })).toEqual({
      stored: { "app-theme": "sepia", [THEME_STORAGE_KEY]: "light" },
      painted: ["light"],
    });
  });

  it("leaves a choice already made under our key alone", () => {
    const items = { "app-theme": "dark", [THEME_STORAGE_KEY]: "light" };
    expect(prePaint(script, items)).toEqual({ stored: items, painted: ["light"] });
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

// The palette names are written twice: in the tokens, which the stylesheets and `cubeui-theme`
// are built from, and here, where the hooks and the picker can import them on a DOM app that has
// no `@cubeui/tokens`.
describe("the palettes the hooks offer", () => {
  it("are the tokens' palettes, after the default", () => {
    expect(PALETTE_PREFERENCES).toEqual(["default", ...Object.keys(palettes)]);
  });

  it("are dark-only where the tokens have no light set", () => {
    expect([...DARK_ONLY_PALETTES]).toEqual(
      Object.entries(palettes)
        .filter(([, modes]) => !("light" in modes))
        .map(([name]) => name),
    );
  });

  it("are read by both stylesheets", () => {
    for (const name of Object.keys(palettes)) {
      expect(read("dist/tokens.web.css")).toContain(`[data-palette="${name}"]`);
      expect(read("dist/tokens.native.css")).toContain(`[data-palette="${name}"]`);
    }
  });
});
