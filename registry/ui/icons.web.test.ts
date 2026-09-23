import { Tag as TagSource } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { icon } from "./icons.web";

// An app's extra glyph is `icon(TagSource)` in an `app-icons.tsx` and an `app-icons.web.tsx` side
// by side. The web half has nothing to wrap, and must not start: a wrapper that pinned a colour
// would freeze the icon through its container's `hover:text-*`. A `.ts` with `createElement`, not
// a `.tsx`: rn2web copies every `.tsx` in `registry/ui` into `compiled/`, tests included.
describe("icon (web)", () => {
  it("hands the lucide glyph back unchanged", () => {
    expect(icon(TagSource)).toBe(TagSource);
  });

  it("renders an svg that takes className and inherits currentColor", () => {
    const Tag = icon(TagSource);
    const markup = renderToStaticMarkup(createElement(Tag, { className: "size-4" }));
    expect(markup).toMatch(/^<svg[^>]*class="[^"]*size-4/);
    expect(markup).toContain('stroke="currentColor"');
  });
});
