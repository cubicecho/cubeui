import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { SearchInput as Compiled } from "../compiled/search-input";
import { SearchInput as Native } from "../registry/ui/search-input";
import { SideBySide } from "./side-by-side";

/**
 * The search box on both halves: a `searchbox` named "Search" or the caller's `label`, a Search
 * icon inside it, and a "Clear search" button that is there only while the box holds text, empties
 * it through the same handlers typing does, and hands focus back.
 */
const meta = { title: "Stage 0/SearchInput" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onNativeText = fn();
const onCompiledText = fn();
const onCompiledChange = fn((event: { target: { value: string } }) => event.target.value);

function NativeHarness() {
  const [query, setQuery] = useState("");
  return (
    <Native
      label="Native servers"
      placeholder="Search servers"
      value={query}
      onChangeText={(text) => {
        setQuery(text);
        onNativeText(text);
      }}
    />
  );
}

export const Default: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-3">
          <Native />
          <NativeHarness />
          <Native label="Native uncontrolled" defaultValue="mcp" />
        </div>
      }
      compiled={
        <div className="flex flex-col gap-3">
          <Compiled />
          {/* Uncontrolled, both handlers: the ✕ has to reach `onChange` without a real keystroke. */}
          <Compiled
            label="Compiled servers"
            placeholder="Search servers"
            onChangeText={onCompiledText}
            onChange={onCompiledChange}
          />
          <Compiled label="Compiled uncontrolled" defaultValue="mcp" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("both halves are named searchboxes with the icon inside", async () => {
      await expect(canvas.getAllByRole("searchbox", { name: "Search" })).toHaveLength(2);
      for (const box of canvas.getAllByRole("searchbox")) {
        const icon = box.parentElement?.querySelector("svg");
        if (!icon) throw new Error("every search box should draw its icon");
        await expect(icon.getBoundingClientRect().left).toBeGreaterThan(
          box.getBoundingClientRect().left,
        );
      }
      // Empty boxes carry no clear button; the prefilled ones do.
      await expect(canvas.getAllByRole("button", { name: "Clear search" })).toHaveLength(2);
    });

    for (const [half, onText] of [
      ["Native", onNativeText],
      ["Compiled", onCompiledText],
    ] as const) {
      await step(`${half}: typing shows the ✕, and the ✕ clears and refocuses`, async () => {
        onText.mockClear();
        onCompiledChange.mockClear();
        const box = canvas.getByRole("searchbox", { name: `${half} servers` });
        const clearButtons = () => canvas.queryAllByRole("button", { name: "Clear search" });
        const before = clearButtons().length;

        await userEvent.type(box, "mcp");
        await expect(onText).toHaveBeenLastCalledWith("mcp");
        await expect(clearButtons()).toHaveLength(before + 1);

        const clear = clearButtons().find((b) => box.parentElement?.contains(b));
        if (!clear) throw new Error("the ✕ should be inside this box");
        await userEvent.click(clear);
        await expect(onText).toHaveBeenLastCalledWith("");
        await expect(box).toHaveValue("");
        await expect(box).toHaveFocus();
        await expect(clearButtons()).toHaveLength(before);
        if (half === "Compiled") await expect(onCompiledChange).toHaveLastReturnedWith("");
      });
    }

    await step("an uncontrolled box clears too", async () => {
      for (const half of ["Native", "Compiled"]) {
        const box = canvas.getByRole("searchbox", { name: `${half} uncontrolled` });
        const clear = box.parentElement?.querySelector("button");
        if (!clear) throw new Error("a prefilled box should show its ✕");
        await userEvent.click(clear);
        await expect(box).toHaveValue("");
        await expect(box.parentElement?.querySelector("button")).toBeNull();
      }
    });

    await step("the browser's own ✕ is hidden, so there is one", async () => {
      // Chromium will not compute a style for this pseudo-element, so find the rule that hides it
      // and check the box is one it applies to.
      const box = canvas.getByRole("searchbox", { name: "Compiled servers" });
      const pseudo = "::-webkit-search-cancel-button";
      const hides = Array.from(document.styleSheets).flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      });
      const rule = hides.find(
        (r): r is CSSStyleRule =>
          r instanceof CSSStyleRule &&
          r.selectorText.includes(pseudo) &&
          r.style.getPropertyValue("appearance") === "none" &&
          r.selectorText.split(",").some((s) => {
            const host = s.trim().replace(pseudo, "");
            return host !== "" && box.matches(host);
          }),
      );
      await expect(rule).toBeDefined();
    });
  },
};
