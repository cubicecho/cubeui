import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Badge as CompiledBadge } from "../compiled/badge";
import { ColorDot as Compiled } from "../compiled/color-dot";
import { Badge as NativeBadge } from "../registry/ui/badge.tsx";
import { ColorDot as Native } from "../registry/ui/color-dot";
import { checkPicksInEachTheme, contrast, PICKS } from "./accent-picks";
import { SideBySide } from "./side-by-side";
import { tokenColor } from "./token-color";

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

/**
 * The dot scale (#487), in light and dark: every dot is 8px or 10px — `ColorDot`'s `md` beside a
 * label, and the 8px of everything drawn inside something (`ColorDot`'s `sm`, the badge's dot and
 * the soft badge's). A hex is made 3:1 from the page and card it is drawn on, as `ColorBar`'s is,
 * so the navy is not lost on a dark page and the yellow not on a light one. `Picks In Each Theme`
 * puts the page in each theme.
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
          const panel = dot.closest("[data-theme-panel]") ?? document.body;
          const drawn = getComputedStyle(dot).backgroundColor;
          for (const surface of ["background", "secondary"]) {
            const behind = tokenColor(surface, { inside: panel });
            await expect(contrast(drawn, behind)).toBeGreaterThanOrEqual(3);
          }
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

/**
 * A picked colour in light, dark and Monokai (#504): each dot is 3:1 from that theme's page and
 * card, keeps the hue it was picked in, and is drawn as picked wherever the pick already shows. A
 * yellow, a cyan and a lime are drawn as they are on a dark page, and a navy on a light one.
 */
export const PicksInEachTheme: Story = {
  render: () => {
    const picks = (Dot: typeof Native) => (
      <div className="flex flex-row items-center gap-3 rounded-lg bg-background p-3">
        {PICKS.map(([name, hex]) => (
          <Dot key={name} color={hex} label={name} />
        ))}
      </div>
    );
    return <SideBySide native={picks(Native)} compiled={picks(Compiled)} />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (const [name] of PICKS) {
      await expect(canvas.getAllByRole("img", { name })).toHaveLength(2);
    }
    await checkPicksInEachTheme(step, (name) => canvas.getAllByRole("img", { name }));
  },
};
