import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Section } from "@/components/section";
import { SectionHeading } from "@/components/section-heading";

/**
 * What `cubeui-reset.css` owes a DOM app: a compiled `<View>` or `<Text>` starts from the same
 * place as the `<div>` beside it, so a class the caller passes means on one what it means on the
 * other.
 */
const meta = { title: "Tokens/DOM reset" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * The line a shadcn app sets its default border colour with, as `* { @apply border-foreground/10 }`
 * compiles. Same layer as the reset and a lower specificity, which is the whole of the bug below:
 * the Storybook stylesheet has no such rule, so a story has to bring it to stand where a consumer
 * stands.
 */
const SHADCN_BASE = "@layer base { * { border-color: var(--border); } }";

/**
 * The reset wrote `border: 0 solid`, and the shorthand resets the colour too, to `currentColor`.
 * `.cube-rn-view` outranks the app's `*`, so a bare `border` passed through `className` drew in
 * the text colour on a cubeui root and in `--border` on the `<div>` beside it — a near-white line
 * on the dark theme (#206). The reset is longhand now and leaves the colour to the app.
 *
 * `text-foreground` on the wrapper is what makes this a test: with nothing naming an ink, the two
 * colours could agree by accident.
 */
export const BareBorderTakesTheAppsColour: Story = {
  render: () => (
    <div
      className="bg-background p-6 text-foreground"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <style>{SHADCN_BASE}</style>
      <div data-testid="plain" className="rounded-md border p-4">
        A div
      </div>
      <Section className="rounded-md border p-4" title="All sides" contentSlot={<p>A view</p>} />
      <Section className="border-t pt-4" title="Top" contentSlot={<p>A view</p>} />
      <Section title="Body" contentClassName="border-b pb-4" contentSlot={<p>A slot</p>} />
      <SectionHeading className="border-b pb-1">A text</SectionHeading>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByTestId("plain");
    const all = canvas.getByRole("region", { name: "All sides" });
    const top = canvas.getByRole("region", { name: "Top" });
    const slot = canvasElement.querySelector("[data-slot=section-content].border-b");
    const text = canvas.getByText("A text");
    if (!slot) throw new Error("the third section should render its content slot");

    const holds = async () => {
      const border = resolved("border", canvasElement);
      // Otherwise every assertion below passes with the bug in place.
      await expect(border).not.toBe(getComputedStyle(plain).color);

      await expect(getComputedStyle(plain).borderTopColor).toBe(border);
      await expect(getComputedStyle(all).borderTopColor).toBe(border);
      await expect(getComputedStyle(all).borderLeftColor).toBe(border);
      await expect(getComputedStyle(top).borderTopColor).toBe(border);
      await expect(getComputedStyle(slot).borderBottomColor).toBe(border);
      await expect(getComputedStyle(text).borderBottomColor).toBe(border);
    };
    await holds();
    await inDark(holds);

    // The rest of what the shorthand said is still said: a width only where a class asks for one,
    // and a solid line when it does.
    await expect(getComputedStyle(all).borderTopWidth).toBe("1px");
    await expect(getComputedStyle(all).borderTopStyle).toBe("solid");
    await expect(getComputedStyle(top).borderTopWidth).toBe("1px");
    await expect(getComputedStyle(top).borderBottomWidth).toBe("0px");
    await expect(getComputedStyle(text).borderBottomWidth).toBe("1px");
    await expect(getComputedStyle(text).borderTopWidth).toBe("0px");
  },
};

/**
 * A token as the browser resolves it, in the `rgb()` spelling `getComputedStyle` reports a colour
 * in — so an assertion compares like with like whichever notation the stylesheet emitted.
 */
function resolved(token: string, inside: Element) {
  const probe = document.createElement("span");
  probe.style.color = `var(--${token})`;
  inside.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}

/** Runs `check` with `<html>` dark, and puts the class back however it went. */
async function inDark(check: () => Promise<void>) {
  const html = document.documentElement;
  const had = html.classList.contains("dark");
  try {
    html.classList.add("dark");
    await check();
  } finally {
    html.classList.toggle("dark", had);
  }
}
