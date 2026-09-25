import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { CardLayout as Compiled } from "../compiled/card-layout";
import { CardLayout as Native } from "../registry/layout/card-layout";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * `CardLayout`'s `level`. A card under a page title keeps `CardTitle`'s `<h3>`; a card that *is*
 * the page — a sign-in, a token gate — passes `level={1}` so the page has an `<h1>`, at the same
 * size. The rank is semantics only, as on `EmptyState` and `Section`.
 */
const meta = {
  title: "Stage 0/CardLayout",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  title: "Sign in",
  description: "Use the account your team invited.",
};

function render(props: { level?: 1 | 2 | 3 }) {
  return (
    <SideBySide
      native={<Native {...args} {...props} />}
      compiled={<Compiled {...args} {...props} />}
    />
  );
}

/**
 * The two titles, native first — after checking both are drawn at `CardTitle`'s own `text-2xl`,
 * whatever the rank. The rank says where the card sits, not how big its title looks.
 */
async function titles(canvasElement: HTMLElement, level: 1 | 2 | 3) {
  const headings = within(canvasElement).getAllByRole("heading", { level, name: "Sign in" });
  const [native, compiled] = headings;
  if (headings.length !== 2 || !native || !compiled) {
    throw new Error(`expected a level-${level} heading on both halves`);
  }
  for (const title of [native, compiled]) {
    const style = getComputedStyle(title);
    await expect(style.fontSize).toBe("24px");
    await expect(style.fontWeight).toBe("600");
  }
  return { native, compiled };
}

/** No `level`: a level-3 heading on both halves, as it always was — the compiled one a real `<h3>`. */
export const Default: Story = {
  args,
  render: () => render({}),
  play: async ({ canvasElement }) => {
    const { compiled } = await titles(canvasElement, 3);
    await expect(compiled.tagName).toBe("H3");
    await expect(within(canvasElement).queryAllByRole("heading", { level: 1 })).toHaveLength(0);
  },
};

/**
 * `level={1}`: the card is the page, so its title is the page's `h1` — a real `<h1>` on the
 * compiled half — drawn at exactly the size the default `h3` is.
 */
export const PageHeading: Story = {
  args: { ...args, level: 1 },
  render: () => render({ level: 1 }),
  play: async ({ canvasElement }) => {
    const { compiled } = await titles(canvasElement, 1);
    await expect(compiled.tagName).toBe("H1");
  },
};

/** Any rank from 1 to 3, on both halves. */
export const Level: Story = {
  args: { ...args, level: 2 },
  render: () => render({ level: 2 }),
  play: async ({ canvasElement }) => {
    const { compiled } = await titles(canvasElement, 2);
    await expect(compiled.tagName).toBe("H2");
  },
};

const actionLabels = ["Copy MCP config", "Rename", "Delete"] as const;

/** Three buttons in `footerActions`, in a card as narrow as a phone. */
function NarrowCard({ half }: { half: "native" | "compiled" }) {
  const Card = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  return (
    <div data-testid={`${half}-frame`} style={{ width: 320 }}>
      <Card
        title="Journal"
        content={
          half === "native" ? (
            <Text className="text-sm text-foreground">Notes kept by the agent.</Text>
          ) : (
            <p className="text-sm">Notes kept by the agent.</p>
          )
        }
        footerActions={
          <>
            {actionLabels.map((label) => (
              <Button key={label} variant="outline" size="sm">
                {label}
              </Button>
            ))}
          </>
        }
      />
    </div>
  );
}

/**
 * `footerActions` in a 320px card (#159). The row used to hold its buttons on one line and run
 * the first one out past the card's left edge; now it shrinks to the footer and wraps, and the
 * line that wraps stays against the right edge. Held on both halves.
 */
export const NarrowFooterActions: Story = {
  args: { title: "Journal" },
  render: () => (
    <SideBySide native={<NarrowCard half="native" />} compiled={<NarrowCard half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      const frame = within(canvasElement).getByTestId(`${half}-frame`);
      const card = frame.firstElementChild;
      if (!card) throw new Error(`the ${half} card should render`);
      const box = card.getBoundingClientRect();
      const buttons = actionLabels.map((name) =>
        within(frame).getByRole("button", { name }).getBoundingClientRect(),
      );
      const [first, , last] = buttons;
      if (!first || !last) throw new Error("expected three buttons");
      // `half` rides along in each value so a failure names which half broke.
      await expect({
        half,
        // Inside the card, left and right.
        inside: buttons.every((b) => b.left >= box.left && b.right <= box.right),
        // Wrapped: the last button is on a line below the first.
        wrapped: last.top >= first.bottom,
        // Right-aligned: the wrapped line ends near the card's right edge, not at its left.
        endAligned: box.right - last.right < box.width / 4,
      }).toEqual({ half, inside: true, wrapped: true, endAligned: true });
    }
  },
};
