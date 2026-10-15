import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Badge as Compiled } from "../compiled/badge";
import { Badge as Native } from "../registry/ui/badge";
import { SideBySide } from "./side-by-side";

/**
 * A removable badge on both halves: the ✕ is a button of its own, named `Remove <text>`, drawn in
 * the label's colour and inside the pill's height. The published story covers the web half's
 * extras — the form it must not submit, the `onClick` it must not fire.
 */
const meta = { title: "RN Parity/Badge" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onRemove = fn();

/**
 * `mono` sets the label in monospace at normal weight on both halves, on the label itself so the
 * native `Text` gets it, with any variant and beside the ✕ (#362).
 */
export const Mono: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Native variant="outline" mono>
            tool_name
          </Native>
          <Native variant="destructive" mono onRemove={() => {}}>
            0 */5 * * *
          </Native>
          <Native backgroundColor="#1d4ed8" textColor="#ffffff" mono>
            slug-id
          </Native>
          <Native>Plain</Native>
        </div>
      }
      compiled={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Compiled variant="outline" mono>
            tool_name
          </Compiled>
          <Compiled variant="destructive" mono onRemove={() => {}}>
            0 */5 * * *
          </Compiled>
          <Compiled backgroundColor="#1d4ed8" textColor="#ffffff" mono>
            slug-id
          </Compiled>
          <Compiled>Plain</Compiled>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const text of ["tool_name", "0 */5 * * *", "slug-id"]) {
      for (const el of canvas.getAllByText(text)) {
        const style = getComputedStyle(el);
        await expect(style.fontFamily).toMatch(/mono/i);
        await expect(style.fontWeight).toBe("400");
      }
    }
    for (const el of canvas.getAllByText("Plain")) {
      await expect(getComputedStyle(el).fontFamily).not.toMatch(/mono/i);
      await expect(getComputedStyle(el).fontWeight).toBe("600");
    }
  },
};

/**
 * `pulse` breathes a dot for something live (#366): an opacity loop on native, Tailwind's pulse
 * behind `motion-safe:` on the web, so a reader who asked for reduced motion gets a still dot. A
 * pill ignores it.
 */
export const Pulse: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row items-center gap-2">
          <Native variant="positive" label="Live" pulse />
          <Native variant="secondary" label="Ended" />
          <Native variant="positive" pulse>
            Running
          </Native>
        </div>
      }
      compiled={
        <div className="flex flex-row items-center gap-2">
          <Compiled variant="positive" label="Live" pulse />
          <Compiled variant="secondary" label="Ended" />
          <Compiled variant="positive" pulse>
            Running
          </Compiled>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [nativeLive, compiledLive] = canvas.getAllByRole("img", { name: "Live" });
    const [nativeEnded] = canvas.getAllByRole("img", { name: "Ended" });
    const [, compiledRunning] = canvas.getAllByText("Running");
    if (!nativeLive || !compiledLive || !nativeEnded || !compiledRunning) {
      throw new Error("both halves should draw both dots and the pill");
    }

    // The web dot runs the keyframe only where motion is welcome, and the pill does not run it.
    await expect(compiledLive.className).toContain("motion-safe:animate-pulse");
    await expect(getComputedStyle(compiledLive).animationName).toBe("pulse");
    await expect(getComputedStyle(compiledRunning).animationName).toBe("none");

    // The device dot fades on its own loop; a dot without `pulse` stays put.
    await waitFor(() => expect(Number(getComputedStyle(nativeLive).opacity)).toBeLessThan(0.9), {
      timeout: 2000,
    });
    await expect(getComputedStyle(nativeEnded).opacity).toBe("1");
  },
};

export const Removable: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Native onRemove={onRemove}>Urgent</Native>
          <Native backgroundColor="#1d4ed8" textColor="#ffffff" onRemove={onRemove}>
            Design
          </Native>
          <Native>Plain</Native>
          <Native variant="secondary" label="Paused" onRemove={onRemove} />
        </div>
      }
      compiled={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Compiled onRemove={onRemove}>Urgent</Compiled>
          <Compiled backgroundColor="#1d4ed8" textColor="#ffffff" onRemove={onRemove}>
            Design
          </Compiled>
          <Compiled>Plain</Compiled>
          <Compiled variant="secondary" label="Paused" onRemove={onRemove} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onRemove.mockClear();

    // Two removable pills per half, and no ✕ on either dot.
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
    const [nativeUrgent, compiledUrgent] = canvas.getAllByRole("button", { name: "Remove Urgent" });
    const [nativeDesign, compiledDesign] = canvas.getAllByRole("button", { name: "Remove Design" });
    if (!nativeUrgent || !compiledUrgent || !nativeDesign || !compiledDesign) {
      throw new Error("both halves should render both remove buttons");
    }

    await userEvent.click(nativeUrgent);
    await expect(onRemove).toHaveBeenCalledTimes(1);
    await userEvent.click(compiledUrgent);
    await expect(onRemove).toHaveBeenCalledTimes(2);

    // The glyph's stroke is the label's colour: the variant's ink where nothing overrides it, and
    // the caller's `textColor` where something does.
    const stroke = (button: HTMLElement) => {
      const svg = button.querySelector("svg");
      if (!svg) {
        throw new Error("the remove button should draw an icon");
      }
      return getComputedStyle(svg).stroke;
    };
    const [nativeUrgentText] = canvas.getAllByText("Urgent");
    if (!nativeUrgentText) {
      throw new Error("the native label should render");
    }
    await expect(stroke(nativeUrgent)).toBe(getComputedStyle(nativeUrgentText).color);
    await expect(stroke(compiledUrgent)).toBe(getComputedStyle(nativeUrgentText).color);
    await expect(stroke(nativeDesign)).toBe("rgb(255, 255, 255)");
    await expect(stroke(compiledDesign)).toBe("rgb(255, 255, 255)");

    // The ✕ is shorter than the label's line, so the pill is the height of one without it.
    const [nativePlain, compiledPlain] = canvas.getAllByText("Plain");
    const height = (el: Element | null | undefined) => el?.getBoundingClientRect().height;
    await expect(height(nativeUrgent.parentElement)).toBe(height(nativePlain?.parentElement));
    await expect(height(compiledUrgent.parentElement)).toBe(height(compiledPlain));
  },
};

/** A token as the browser resolves it, so an assertion compares like with like. */
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

/**
 * The `-soft` forms (#346): a tint, an edge and a dot in the hue, with the words in the
 * foreground — the hue on its own tint is under 4.5:1 for three of the four in the default light
 * palette. With no words, a soft badge is the solid dot, since a tint 8px wide is not there.
 */
export const Soft: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Native variant="destructive-soft">Failed</Native>
          <Native variant="positive-soft">Done</Native>
          <Native variant="warning-soft">Stale</Native>
          <Native variant="info-soft">Queued</Native>
          <Native variant="destructive-soft" label="Failing" />
        </div>
      }
      compiled={
        <div className="flex flex-row flex-wrap items-center gap-2">
          <Compiled variant="destructive-soft">Failed</Compiled>
          <Compiled variant="positive-soft">Done</Compiled>
          <Compiled variant="warning-soft">Stale</Compiled>
          <Compiled variant="info-soft">Queued</Compiled>
          <Compiled variant="destructive-soft" label="Failing" />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const half of sections) {
      const scope = within(half);
      const words = scope.getByText("Failed");
      const negative = resolved("negative", half);
      await expect(getComputedStyle(words).color).toBe(resolved("foreground", half));

      // The pill is the word's box on the web and its parent on device.
      const pill = words.closest("[data-slot='badge']") ?? (words.parentElement as HTMLElement);
      await expect(getComputedStyle(pill).backgroundColor).not.toBe(negative);
      const dot = pill.querySelector("[aria-hidden='true']") as HTMLElement;
      await expect(getComputedStyle(dot).backgroundColor).toBe(negative);

      const solid = scope.getByRole("img", { name: "Failing" });
      await expect(getComputedStyle(solid).backgroundColor).toBe(negative);
    }
  },
};
