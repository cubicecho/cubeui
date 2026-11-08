import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Badge as CompiledBadge } from "../compiled/badge";
import { ColorDot as Compiled } from "../compiled/color-dot";
import { Badge as NativeBadge } from "../registry/ui/badge";
import { ColorDot as Native } from "../registry/ui/color-dot";
import { SideBySide } from "./side-by-side";

const meta = { title: "RN Parity/ColorDot" } satisfies Meta;
export default meta;
type Story = StoryObj;

const dots = (Dot: typeof Native) => (
  <div className="flex flex-row items-center gap-2">
    <Dot color="#7c3aed" label="Design" />
    <Dot color="#0d9488" size="sm" />
  </div>
);

/**
 * A named dot shows its name under the pointer on the web (#479): its colour is all a sighted
 * reader has otherwise, and two colours can be one to a reader with a colour-vision deficiency.
 * The name is not also its description, which would read it twice, and a dot with no name stays
 * decoration, with no tooltip.
 */
export const ANamedDotShowsItsName: Story = {
  render: () => <SideBySide native={dots(Native)} compiled={dots(Compiled)} />,
  play: async ({ canvasElement }) => {
    const sections = Array.from(canvasElement.querySelectorAll("section"));
    await expect(sections).toHaveLength(2);
    for (const half of sections) {
      const dot = within(half).getByRole("img", { name: "Design" });
      await userEvent.hover(dot);
      const tooltip = await screen.findByRole("tooltip");
      await expect(tooltip).toHaveTextContent("Design");
      await waitFor(() => expect(tooltip).toBeVisible());
      await expect(dot).not.toHaveAttribute("aria-describedby");
      await expect(dot).toHaveAccessibleDescription("");
      await userEvent.unhover(dot);
      await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());

      const plain = half.querySelector("[aria-hidden='true']");
      await expect(plain).not.toBeNull();
      await expect(plain).not.toHaveAttribute("data-slot", "tooltip-trigger");
    }
  },
};

/** A tag colour too dark for a dark page and one too light for a light one, as a user picks them. */
const NAVY = "#172554";
const YELLOW = "#fde047";

function Scale({ Dot, Badge }: { Dot: typeof Native; Badge: typeof NativeBadge }) {
  return (
    <div className="flex flex-col gap-2">
      {(["light", "dark"] as const).map((theme) => (
        <div
          key={theme}
          data-theme-panel={theme}
          className={`${theme} flex flex-row flex-wrap items-center gap-4 rounded-lg bg-background p-3 text-foreground`}
        >
          <Dot color={NAVY} label={`Navy ${theme}`} />
          <Dot color={YELLOW} label={`Yellow ${theme}`} />
          <Dot color="#0d9488" size="sm" label={`Small ${theme}`} />
          <Badge variant="positive" label={`Up ${theme}`} />
          <Badge variant="positive-soft">Live</Badge>
        </div>
      ))}
    </div>
  );
}

/** The red, green and blue of a computed `rgb()` colour, 0–255. */
function channels(colour: string): number[] {
  return (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
}

/** WCAG relative luminance of a computed `rgb()` colour. */
function luminance(colour: string): number {
  const [r = 0, g = 0, b = 0] = channels(colour).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The dot scale (#487), in light and dark: every dot is 8px or 10px — `ColorDot`'s `md` beside a
 * label, and the 8px of everything drawn inside something (`ColorDot`'s `sm`, the badge's dot and
 * the soft badge's). A hex is moved into the band that shows in every theme, as `ColorBar`'s is,
 * so the navy is not lost on the dark page and the yellow not on the light one.
 */
export const DotScale: Story = {
  render: () => (
    <SideBySide
      native={<Scale Dot={Native} Badge={NativeBadge} />}
      compiled={<Scale Dot={Compiled} Badge={CompiledBadge as typeof NativeBadge} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const size = (el: Element) => el.getBoundingClientRect().width;
    for (const theme of ["light", "dark"]) {
      for (const name of [`Navy ${theme}`, `Yellow ${theme}`]) {
        for (const dot of canvas.getAllByRole("img", { name })) {
          await expect(size(dot)).toBe(10);
          // In the band `hexToAccent` draws: 3:1 from the page and the card in every palette.
          const lit = luminance(getComputedStyle(dot).backgroundColor);
          await expect(lit).toBeGreaterThanOrEqual(0.18);
          await expect(lit).toBeLessThanOrEqual(0.27);
        }
      }
      for (const name of [`Small ${theme}`, `Up ${theme}`]) {
        for (const dot of canvas.getAllByRole("img", { name })) {
          await expect(size(dot)).toBe(8);
        }
      }
    }
    // The web badge holds its words itself; the native one holds them in a `Text`.
    for (const text of canvas.getAllByText("Live")) {
      const pill = text.matches("[data-slot=badge]") ? text : text.parentElement;
      const dot = pill?.querySelector("[aria-hidden='true']") ?? null;
      await expect(dot).not.toBeNull();
      await expect(size(dot as Element)).toBe(8);
    }
  },
};
