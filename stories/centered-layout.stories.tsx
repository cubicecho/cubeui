import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Text } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { CenteredLayout as Compiled } from "../compiled/centered-layout";
import { CenteredLayout as Native } from "../registry/layout/centered-layout";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * The sign-in page: one card in the middle of a page of its own. What these stories hold both
 * halves to is the geometry every hand-written copy was reaching for — the card centred both ways
 * in its root, capped at `max-w-sm` however wide the root is, its title a heading, its footer
 * under its body — and the `<main>` the web root is.
 *
 * Two halves on one page are two unnamed `main` landmarks, which is the one thing axe would say about
 * this story that it would not say about an app, so those two rules are off here and nowhere else.
 */
const meta = {
  title: "Stage 0/Centered Layout",
  component: Native,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "landmark-no-duplicate-main", enabled: false },
          { id: "landmark-unique", enabled: false },
        ],
      },
    },
  },
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <Text className="text-foreground text-sm">Enter the router token to unlock this workspace.</Text>
);

/**
 * A frame wider than either cap. The test runner's viewport is phone-width, and split in two it is
 * narrower than `max-w-sm` — a card there fills its frame, and nothing would prove the cap.
 */
function Frame({ children }: { children: ReactNode }) {
  return <div style={{ width: 520 }}>{children}</div>;
}

/** Within a pixel: a centre computed from two rounded boxes can land on a half. */
function near(a: number, b: number) {
  return Math.abs(a - b) <= 1;
}

async function expectCentred(root: HTMLElement) {
  const card = root.firstElementChild;
  if (!card) throw new Error("the card should render inside the root");
  const outer = root.getBoundingClientRect();
  const inner = card.getBoundingClientRect();
  await expect(near(inner.left - outer.left, outer.right - inner.right)).toBe(true);
  await expect(near(inner.top - outer.top, outer.bottom - inner.bottom)).toBe(true);
  return inner;
}

function roots(canvasElement: HTMLElement) {
  const native = canvasElement.querySelector<HTMLElement>(".native-root");
  const compiled = canvasElement.querySelector<HTMLElement>(".compiled-root");
  if (!native || !compiled) throw new Error("both halves should render");
  return [native, compiled] as const;
}

export const Default: Story = {
  args: { title: "Authentication required", description: "Paste the token from settings.json." },
  render: (args) => (
    <SideBySide
      native={
        <Frame>
          <Native
            {...args}
            className="native-root"
            content={body}
            footerActions={<NativeButton>Unlock</NativeButton>}
          />
        </Frame>
      }
      compiled={
        <Frame>
          <Compiled
            {...args}
            className="compiled-root"
            content={body}
            footerActions={<CompiledButton onClick={() => {}}>Unlock</CompiledButton>}
          />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [nativeRoot, compiledRoot] = roots(canvasElement);

    // The page's root is its main landmark on both halves, and a `<main>` on the compiled one.
    await expect(canvas.getAllByRole("main")).toHaveLength(2);
    await expect(compiledRoot.tagName).toBe("MAIN");

    // Full height: the root is at least the viewport, which is what puts the card mid-screen.
    await expect(compiledRoot.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      window.innerHeight - 1,
    );

    for (const root of [nativeRoot, compiledRoot]) {
      const card = await expectCentred(root);
      // `max-w-sm` is 24rem; the frame less its padding is wider than that, so the cap is what
      // sized the card.
      await expect(root.getBoundingClientRect().width - 32).toBeGreaterThan(384);
      await expect(near(card.width, 384)).toBe(true);

      const heading = within(root).getByRole("heading", { name: "Authentication required" });
      const text = within(root).getByText(/Enter the router token/);
      const button = within(root).getByRole("button", { name: "Unlock" });
      // Title over body, body over footer.
      await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        text.getBoundingClientRect().top,
      );
      await expect(button.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        text.getBoundingClientRect().bottom,
      );
    }

    // Both halves draw the same card, the same distance from the edge.
    await expect(compiledRoot.firstElementChild?.getBoundingClientRect().height).toBe(
      nativeRoot.firstElementChild?.getBoundingClientRect().height,
    );
    await expect(getComputedStyle(compiledRoot).paddingTop).toBe(
      getComputedStyle(nativeRoot).paddingTop,
    );
  },
};

export const Wider: Story = {
  args: { title: "Sign in", cardClassName: "max-w-md" },
  render: (args) => (
    <SideBySide
      native={
        <Frame>
          <Native {...args} className="native-root" content={body} />
        </Frame>
      }
      compiled={
        <Frame>
          <Compiled {...args} className="compiled-root" content={body} />
        </Frame>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of roots(canvasElement)) {
      const card = await expectCentred(root);
      // `max-w-md` replaced the default cap rather than losing to it.
      await expect(near(card.width, 448)).toBe(true);
    }
  },
};
