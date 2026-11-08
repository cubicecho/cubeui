import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  Card as Compiled,
  CardContent as CompiledContent,
  CardDescription as CompiledDescription,
  CardFooter as CompiledFooter,
  CardHeader as CompiledHeader,
  CardTitle as CompiledTitle,
} from "../compiled/card";
import {
  Card as Native,
  CardContent as NativeContent,
  CardDescription as NativeDescription,
  CardFooter as NativeFooter,
  CardHeader as NativeHeader,
  CardTitle as NativeTitle,
} from "../registry/ui/card";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

/**
 * The component the spike is really about: nested `View`/`Text`, a `forwardRef`, a container that
 * changes element on a prop, and semantics the source already states in `role`/`aria-level`.
 */
const meta = { title: "RN Parity/Card" } satisfies Meta;
export default meta;
type Story = StoryObj;

/**
 * The geometry check, and the one that decides the plan's open risk #1.
 *
 * A compiled `<div>` has none of react-native-web's per-component base class, so the question is
 * whether `cube-rn-reset.css` replaces enough of it that the same classes produce the same box.
 * Comparing the rendered rectangles is the only version of that question with an answer: the two
 * halves get the same width from the frame, so any difference in height is a difference in how
 * the two trees laid out.
 */
export const Static: Story = {
  render: () => {
    const body = (
      C: typeof Native | typeof Compiled,
      H: typeof NativeHeader | typeof CompiledHeader,
      T: typeof NativeTitle | typeof CompiledTitle,
      D: typeof NativeDescription | typeof CompiledDescription,
      Ct: typeof NativeContent | typeof CompiledContent,
      F: typeof NativeFooter | typeof CompiledFooter,
      probe: Record<string, string>,
    ) => (
      <C {...probe}>
        <H>
          <T>Quarterly review</T>
          <D>Everything that shipped since June.</D>
        </H>
        <Ct>
          <D>Twelve items, four of them still open.</D>
        </Ct>
        <F>
          <D>Updated today</D>
        </F>
      </C>
    );

    return (
      <SideBySide
        native={body(
          Native,
          NativeHeader,
          NativeTitle,
          NativeDescription,
          NativeContent,
          NativeFooter,
          // `data-testid` is not a React Native prop. react-native-web derives the attribute from
          // `testID`, which is the same rename the element map has to perform — so the two halves
          // are probed by the two spellings of one thing.
          { testID: "native-card" },
        )}
        compiled={body(
          Compiled,
          CompiledHeader,
          CompiledTitle,
          CompiledDescription,
          CompiledContent,
          CompiledFooter,
          { "data-testid": "compiled-card" },
        )}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The semantic claim: the source said `role="heading" aria-level={3}`, the compiled output
    // says `<h3>`, and the accessibility tree cannot tell the two apart. Finding both through the
    // same query is what "the compiler preserved the semantics" means operationally.
    const headings = canvas.getAllByRole("heading", { level: 3 });
    await expect(headings).toHaveLength(2);

    const native = canvas.getByTestId("native-card").getBoundingClientRect();
    const compiled = canvas.getByTestId("compiled-card").getBoundingClientRect();

    // A pixel of tolerance for sub-pixel rounding, not for a layout that nearly agrees.
    await expect(Math.abs(compiled.height - native.height)).toBeLessThanOrEqual(1);
    await expect(Math.abs(compiled.width - native.width)).toBeLessThanOrEqual(1);

    // A card sits in the page's flow, so its border and fill set it apart and it draws no shadow:
    // a shadow means something floats (#342).
    for (const id of ["native-card", "compiled-card"]) {
      const style = getComputedStyle(canvas.getByTestId(id));
      await expect(style.boxShadow).toBe("none");
      await expect(style.borderTopWidth).toBe("1px");
    }
  },
};

/**
 * The `role="button"` the source already carries, taken at its word — and the story that corrected
 * this spike's own assumption.
 *
 * It was written expecting react-native-web to render the `Pressable` as a focusable `<div>`, with
 * the compiled `<button>` as the improvement. It does not: given `role="button"` react-native-web
 * emits a real `<button>` too. That is the strongest evidence the spike produced, because it means
 * level-2 inference is not a new idea the compiler is gambling on — it is what the web target
 * already does with these components, and compiling only removes the runtime that was doing it.
 */
export const Pressable: Story = {
  render: () => (
    <SideBySide
      native={
        <Native onPress={() => {}} testID="native-card">
          <NativeHeader>
            <NativeTitle>Open the review</NativeTitle>
          </NativeHeader>
        </Native>
      }
      compiled={
        // `onClick`, not `onPress`. The compiled half speaks DOM prop names — see the compiler's
        // `renamePublicProps` — so this is the one place the two halves are not interchangeable.
        <Compiled onClick={() => {}} data-testid="compiled-card">
          <CompiledHeader>
            <CompiledTitle>Open the review</CompiledTitle>
          </CompiledHeader>
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button")).toHaveLength(2);

    // Both halves, not just the compiled one.
    await expect(canvas.getByTestId("native-card").tagName).toBe("BUTTON");
    await expect(canvas.getByTestId("compiled-card").tagName).toBe("BUTTON");

    // Down to `type`, which is not a React Native concept at all: a `<button>` inside a `<form>`
    // with no type submits it, and react-native-web sets it for the same reason the compiler does.
    await expect(canvas.getByTestId("compiled-card").getAttribute("type")).toBe("button");
    await expect(canvas.getByTestId("native-card").getAttribute("type")).toBe("button");
  },
};

/**
 * `ColorBar` through `Card`, which is the absolutely-positioned case — the one where the reset's
 * `position: relative` on the container is what keeps the bar inside the card instead of pinning
 * it to the viewport.
 */
export const Accent: Story = {
  render: () => (
    <SideBySide
      native={
        <Native accentColor="#3b82f6" accentLabel="Engineering" testID="native-card">
          <NativeHeader>
            <NativeTitle>Engineering</NativeTitle>
            <NativeDescription>Owned by the platform team.</NativeDescription>
          </NativeHeader>
        </Native>
      }
      compiled={
        <Compiled accentColor="#3b82f6" accentLabel="Engineering" data-testid="compiled-card">
          <CompiledHeader>
            <CompiledTitle>Engineering</CompiledTitle>
            <CompiledDescription>Owned by the platform team.</CompiledDescription>
          </CompiledHeader>
        </Compiled>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bars = canvas.getAllByRole("img", { name: "Engineering" });
    await expect(bars).toHaveLength(2);

    const [nativeBar, compiledBar] = bars;
    if (!nativeBar || !compiledBar) {
      throw new Error("both bars should render");
    }

    const inside = (bar: Element, card: Element) => {
      const b = bar.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      return b.left >= c.left - 1 && b.right <= c.right + 1 && b.height > 0;
    };

    await expect(inside(nativeBar, canvas.getByTestId("native-card"))).toBe(true);
    await expect(inside(compiledBar, canvas.getByTestId("compiled-card"))).toBe(true);
  },
};

/** The picks the old lightness clamp lost: yellow and cyan on the light page, navy on the dark. */
const PICKS = [
  ["Yellow", "#ffff00"],
  ["Cyan", "#00ffff"],
  ["Lime", "#00ff00"],
  ["Navy", "#000080"],
] as const;

/** A CSS colour as 8-bit sRGB, read back off a canvas so any notation the browser takes works. */
function srgb(color: string): [number, number, number] {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("no 2D canvas to read a colour with");
  }
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** WCAG contrast between two CSS colours. */
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const [r, g, b] = srgb(color).map((c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A stripe has to be seen, so it is 3:1 (WCAG 1.4.11) from the card it is drawn on and from the
 * page beyond the card's edge, in every theme, with no idea which is on. The old clamp, HSL
 * lightness 0.38–0.62, drew a yellow at 1.07:1 on the light page and a navy at 1.68:1 on the dark
 * one (#471). The stripe now keeps its hue and is moved into the band of luminance that is 3:1
 * from every page and card the tokens ship: a yellow is an olive, a navy a mid blue.
 */
export const AccentPicks: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-2">
          {PICKS.map(([name, hex]) => (
            <Native key={name} accentColor={hex} accentLabel={name}>
              <NativeHeader>
                <NativeTitle>{name}</NativeTitle>
              </NativeHeader>
            </Native>
          ))}
        </div>
      }
      compiled={
        <div className="flex flex-col gap-2">
          {PICKS.map(([name, hex]) => (
            <Compiled key={name} accentColor={hex} accentLabel={name}>
              <CompiledHeader>
                <CompiledTitle>{name}</CompiledTitle>
              </CompiledHeader>
            </Compiled>
          ))}
        </div>
      }
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const html = document.documentElement;
    const had = {
      dark: html.classList.contains("dark"),
      light: html.classList.contains("light"),
      palette: html.getAttribute("data-palette"),
    };
    const themes = [
      ["light", () => html.classList.add("light")],
      ["dark", () => html.classList.add("dark")],
      ["monokai", () => html.setAttribute("data-palette", "monokai")],
    ] as const;
    try {
      for (const [theme, apply] of themes) {
        html.classList.remove("dark", "light");
        html.removeAttribute("data-palette");
        apply();
        await step(`${theme}: every stripe is 3:1 from the page and the card`, async () => {
          const page = tokenColor("background");
          const card = tokenColor("secondary");
          for (const [name] of PICKS) {
            const bars = canvas.getAllByRole("img", { name });
            await expect(bars).toHaveLength(2);
            for (const bar of bars) {
              const stripe = getComputedStyle(bar).backgroundColor;
              await expect(contrast(stripe, page)).toBeGreaterThanOrEqual(3);
              await expect(contrast(stripe, card)).toBeGreaterThanOrEqual(3);
            }
          }
        });
      }
    } finally {
      html.classList.remove("dark", "light");
      html.removeAttribute("data-palette");
      html.classList.toggle("dark", had.dark);
      html.classList.toggle("light", had.light);
      if (had.palette !== null) {
        html.setAttribute("data-palette", had.palette);
      }
    }
  },
};
