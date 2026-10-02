import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, spyOn, userEvent, within } from "storybook/test";
import { CodeBlock as Compiled } from "../compiled/code";
import { CopyButton as CompiledCopyButton } from "../compiled/copy-button";
import { CodeBlock as Native } from "../registry/ui/code";
import { CopyButton as NativeCopyButton } from "../registry/ui/copy-button";
import { SideBySide } from "./side-by-side";

/**
 * The code block on both web halves: the React Native source under react-native-web on the left,
 * the compiled DOM on the right. What the play tests hold is what the hand-drawn `<pre>`s each
 * decided by class and each decided differently — a long line scrolls or wraps by `wrap`, the
 * action has a column of its own instead of a remembered `pr-12`, `maxHeight` caps the block and
 * the block scrolls inside it, and every block wears one fill, one border and one padding.
 *
 * The device arm — the `ScrollView`s — has no browser to run in: `Platform.OS` is `web` under
 * react-native-web too, so both halves here draw the web arm. It is typechecked, not played.
 */
const meta = { title: "Stage 0/CodeBlock" } satisfies Meta;
export default meta;
type Story = StoryObj;

type CodeBlockComponent = typeof Native;
type CopyButtonComponent = typeof NativeCopyButton;

const TREE = `config/
├── settings.json        # port, auth token, auth enabled, idle timeout
├── registries.json      # { registries: [{ name, url }] }
└── servers/
    └── <name>.json      # one file per installed server`;

const COMMAND =
  'claude mcp add --transport http mcp-router https://router.local/mcp/workspaces/backend --header "Authorization: Bearer <YOUR_TOKEN>"';

const LOG = Array.from({ length: 40 }, (_, i) => `step ${i + 1}: ok`).join("\n");

const ENDPOINT = "https://router.local/mcp/notes";

/** A fixed, narrow column, so "too long for the block" is true at any viewport. */
function Frame({ content }: { content: ReactNode }) {
  return <div className="w-72">{content}</div>;
}

/** A part of the block on either half: `testID` is `data-testid` on one and `data-slot` on the other. */
function part(half: Element, name: string) {
  const found = half.querySelector<HTMLElement>(`[data-slot="${name}"], [data-testid="${name}"]`);
  if (!found) throw new Error(`no ${name} in this half`);
  return found;
}

function halvesOf(canvasElement: HTMLElement) {
  const halves = Array.from(canvasElement.querySelectorAll("section"));
  if (halves.length !== 2) throw new Error("both halves should render");
  return halves;
}

function both(
  render: (CodeBlock: CodeBlockComponent, CopyButton: CopyButtonComponent) => ReactNode,
) {
  return (
    <SideBySide
      native={<Frame content={render(Native, NativeCopyButton)} />}
      compiled={
        <Frame
          content={render(
            Compiled as CodeBlockComponent,
            CompiledCopyButton as CopyButtonComponent,
          )}
        />
      }
    />
  );
}

/** A long line runs on and the block scrolls sideways; the newlines and the indent are kept. */
export const Default: Story = {
  render: () => both((CodeBlock) => <CodeBlock content={`${TREE}\n\n${COMMAND}`} />),
  play: async ({ canvasElement }) => {
    const [, compiled] = halvesOf(canvasElement);

    for (const half of halvesOf(canvasElement)) {
      const root = part(half, "code-block");
      const content = part(half, "code-block-content");
      const text = content.firstElementChild as HTMLElement;

      // The text is the string as written, and it did not wrap: the box is what scrolls.
      await expect(text.textContent).toBe(`${TREE}\n\n${COMMAND}`);
      await expect(getComputedStyle(text).whiteSpace).toBe("pre");
      await expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);

      // Seven lines of text-xs, so the newlines were kept rather than collapsed.
      await expect(text.getBoundingClientRect().height).toBeGreaterThanOrEqual(7 * 16);

      // And the block itself stays the width of its column: the long line is inside it.
      const frame = root.parentElement as HTMLElement;
      await expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
        frame.getBoundingClientRect().width + 0.5,
      );

      // A region that scrolls is one a keyboard can reach.
      await expect(content).toHaveAttribute("tabindex", "0");

      // No action was passed, so nothing is drawn for it.
      await expect(
        half.querySelector('[data-slot="code-block-action"], [data-testid="code-block-action"]'),
      ).toBeNull();
    }

    // On the DOM it is a real `<pre>`.
    await expect(compiled?.querySelector("pre")).not.toBeNull();
  },
};

/** `wrap` breaks the same line instead, inside a word if it has to, and nothing scrolls. */
export const Wrap: Story = {
  render: () => both((CodeBlock) => <CodeBlock content={COMMAND} wrap />),
  play: async ({ canvasElement }) => {
    for (const half of halvesOf(canvasElement)) {
      const content = part(half, "code-block-content");
      const text = content.firstElementChild as HTMLElement;

      await expect(getComputedStyle(text).whiteSpace).toBe("pre-wrap");
      await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
      // One line in the string, several on screen.
      await expect(text.getBoundingClientRect().height).toBeGreaterThan(2 * 16);

      // It cannot scroll, so it is not a tab stop.
      await expect(content).not.toHaveAttribute("tabindex");
    }
  },
};

const onCopied = fn();

/** The action has a column of its own: the text ends where the button begins. */
export const WithAction: Story = {
  render: () =>
    both((CodeBlock, CopyButton) => (
      <CodeBlock
        content={`${TREE}\n\n${COMMAND}`}
        action={<CopyButton value={COMMAND} label="Copy snippet" onCopied={onCopied} />}
      />
    )),
  play: async ({ canvasElement }) => {
    onCopied.mockClear();
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    try {
      for (const half of halvesOf(canvasElement)) {
        const root = part(half, "code-block").getBoundingClientRect();
        const content = part(half, "code-block-content");
        const button = within(half as HTMLElement).getByRole("button", { name: "Copy snippet" });
        const box = button.getBoundingClientRect();

        // Beside the text, not over it — and inside the block, at its top.
        await expect(box.left).toBeGreaterThanOrEqual(content.getBoundingClientRect().right - 0.5);
        await expect(box.right).toBeLessThanOrEqual(root.right + 0.5);
        await expect(box.top - root.top).toBeLessThan(8);

        // The text still scrolls, in the room that is left.
        await expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);

        await userEvent.click(button);
        await expect(writeText).toHaveBeenLastCalledWith(COMMAND);
      }
      await expect(onCopied).toHaveBeenCalledTimes(2);
    } finally {
      writeText.mockRestore();
    }
  },
};

/** `maxHeight` caps the block, and the text scrolls inside it. */
export const MaxHeight: Story = {
  render: () => both((CodeBlock) => <CodeBlock content={LOG} wrap maxHeight="sm" />),
  play: async ({ canvasElement }) => {
    for (const half of halvesOf(canvasElement)) {
      const root = part(half, "code-block");
      const content = part(half, "code-block-content");

      // `sm` is ten rem, and forty lines are more than that.
      await expect(content.getBoundingClientRect().height).toBeLessThanOrEqual(160);
      await expect(root.getBoundingClientRect().height).toBeLessThanOrEqual(162);
      await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);

      // Wrapped, but capped: it scrolls, so it is a tab stop again.
      await expect(content).toHaveAttribute("tabindex", "0");
    }
  },
};

/**
 * A value to copy is the same block: one line, `wrap`, and a `CopyButton`. It is one line tall
 * with the button in it, and it wears the fill, border and padding every other block does.
 */
export const CopyableValue: Story = {
  render: () =>
    both((CodeBlock, CopyButton) => (
      <div className="flex flex-col gap-4">
        <CodeBlock
          content={ENDPOINT}
          wrap
          action={<CopyButton value={ENDPOINT} label="Copy endpoint URL" />}
        />
        <CodeBlock content={TREE} />
      </div>
    )),
  play: async ({ canvasElement }) => {
    const looks: string[] = [];

    for (const half of halvesOf(canvasElement)) {
      const roots = Array.from(
        half.querySelectorAll<HTMLElement>('[data-slot="code-block"], [data-testid="code-block"]'),
      );
      await expect(roots).toHaveLength(2);
      const value = roots[0] as HTMLElement;

      // One line of text, one line of block: the button did not make it taller.
      await expect(value.getBoundingClientRect().height).toBeLessThanOrEqual(44);
      await expect(within(value).getByText(ENDPOINT)).toBeVisible();

      // The button is the only tab stop in it.
      await expect(part(value, "code-block-content")).not.toHaveAttribute("tabindex");
      await expect(within(value).getByRole("button", { name: "Copy endpoint URL" })).toBeVisible();

      for (const root of roots) {
        const style = getComputedStyle(root);
        const padding = getComputedStyle(part(root, "code-block-content")).padding;
        await expect(style.borderTopWidth).toBe("1px");
        await expect(padding).toBe("12px");
        looks.push(
          [style.backgroundColor, style.borderTopColor, style.borderTopLeftRadius, padding].join(),
        );
      }
    }

    // Four blocks — a value and a snippet, on two halves — and one look between them.
    await expect(looks).toHaveLength(4);
    await expect(new Set(looks).size).toBe(1);
  },
};
