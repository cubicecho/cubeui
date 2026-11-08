import { EditorView, keymap, showTooltip } from "@codemirror/view";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { lazy, Suspense, useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { MarkdownCodeEditorProps } from "@/components/markdown-code-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { monoFamily } from "../mono-family";
import { tokenColor } from "../token-color";

// The documented way in: CodeMirror is its own chunk, and a skeleton holds the editor's place
// while it arrives.
const MarkdownCodeEditor = lazy(() => import("@/components/markdown-code-editor"));

const meta = {
  title: "Controls/MarkdownCodeEditor",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SOURCE = `# Release notes

What changed, in a sentence, with a [link](https://example.com).

- one
- two

\`\`\`ts
const answer = "forty-two";
\`\`\`
`;

const OTHER = "# Another file\n\nOpened from the tree.\n";

const onValueChange = fn();
const onSave = fn();
const onSend = fn();

/** The value held the way a screen holds it. */
function Held({
  initial = SOURCE,
  ...props
}: Partial<MarkdownCodeEditorProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-col gap-2">
      <Suspense fallback={<Skeleton className="min-h-64 w-full" />}>
        <MarkdownCodeEditor
          label="Notes"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
          onSave={onSave}
          {...props}
        />
      </Suspense>
      <div>
        <Button variant="outline" content="Open another file" onClick={() => setValue(OTHER)} />
      </div>
    </div>
  );
}

/** The document the editor holds, read from CodeMirror and not from the DOM it virtualises. */
const documentOf = (textbox: HTMLElement) => EditorView.findFromDOM(textbox)?.state.doc.toString();

/**
 * Loaded with `lazy()`, named, highlighted, and reporting what is typed.
 *
 * The run checks the name, the theme's colours and the highlighting, then an edit reaching the
 * caller and the save key handing over the source as it stands.
 */
export const Default: Story = {
  render: () => <Held />,
  play: async ({ canvas, canvasElement }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    await expect(textbox).toHaveAttribute("aria-multiline", "true");
    await expect(documentOf(textbox)).toBe(SOURCE);

    // The colours are the theme's: the editor's text is the page's foreground.
    const editor = canvasElement.querySelector<HTMLElement>(".cm-editor");
    const themed = getComputedStyle(canvas.getByRole("button", { name: "Open another file" }));
    await expect(editor && getComputedStyle(editor).color).toBe(themed.color);
    // And its type is `CodeBlock`'s: 12px on a 20px line, in the theme's monospace (#480).
    const content = canvasElement.querySelector<HTMLElement>(".cm-content");
    const type = content && getComputedStyle(content);
    await expect([type?.fontSize, type?.lineHeight]).toEqual(["12px", "20px"]);
    await expect(type?.fontFamily).toBe(monoFamily());
    // And the heading is drawn as one, which is the highlighting at work.
    const weights = () =>
      [...canvasElement.querySelectorAll<HTMLElement>(".cm-line span")]
        .filter((span) => span.textContent?.includes("Release notes"))
        .map((span) => getComputedStyle(span).fontWeight);
    await waitFor(() => expect(weights()).toContain("600"));

    // Typed the way CodeMirror hears typing. Simulated key events do not reach a contenteditable
    // the way a keyboard does, so the edit is dispatched as the input transaction a key makes.
    onValueChange.mockClear();
    const view = EditorView.findFromDOM(textbox);
    view?.focus();
    view?.dispatch({
      changes: { from: view.state.doc.length, insert: "- three" },
      userEvent: "input.type",
    });
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(`${SOURCE}- three`));
    await expect(documentOf(textbox)).toBe(`${SOURCE}- three`);

    onSave.mockClear();
    await userEvent.keyboard("{Control>}s{/Control}");
    await expect(onSave).toHaveBeenCalledWith(`${SOURCE}- three`);
  },
};

/**
 * The caret's line, focused, is drawn in `hover`, as anything focused is, and not in the chosen
 * tint: the link, code and quiet markup on it were 3.1–4.2:1 on the tint (#471), and they are
 * 4.5:1 or more on `hover` in every palette (`palette-contrast.test.mjs`). Unfocused, no line is
 * picked out.
 */
export const CursorLine: Story = {
  render: () => <Held />,
  play: async ({ canvas, canvasElement }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    const view = EditorView.findFromDOM(textbox);
    const linkLine = SOURCE.indexOf("What changed");
    view?.focus();
    view?.dispatch({ selection: { anchor: linkLine } });
    await waitFor(() => expect(view?.dom).toHaveClass("cm-focused"));
    const line = () => canvasElement.querySelector<HTMLElement>(".cm-activeLine");
    await waitFor(() => expect(line()).toHaveTextContent(/^What changed/));
    await expect(getComputedStyle(line() as HTMLElement).backgroundColor).toBe(tokenColor("hover"));
    // The address on it keeps its colour: the pair the palette test measures is the one drawn.
    const url = [...(line()?.querySelectorAll<HTMLElement>("span") ?? [])].find(
      (span) => span.textContent === "https://example.com",
    );
    await expect(url && getComputedStyle(url).color).toBe(tokenColor("info"));

    textbox.blur();
    await waitFor(() => expect(view?.dom).not.toHaveClass("cm-focused"));
    await expect(getComputedStyle(line() as HTMLElement).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

/**
 * Opening another file is handing the editor another `value`. It replaces the document and is
 * not reported back as an edit, which would mark the file just opened as changed.
 */
export const FollowsValue: Story = {
  render: () => <Held />,
  play: async ({ canvas }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    onValueChange.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Open another file" }));
    await waitFor(() => expect(documentOf(textbox)).toBe(OTHER));
    await expect(onValueChange).not.toHaveBeenCalled();
  },
};

/** Read-only shows the source, still selectable, and says so to a screen reader. */
export const ReadOnly: Story = {
  render: () => <Held readOnly />,
  play: async ({ canvas }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    await expect(textbox).toHaveAttribute("aria-readonly", "true");
    onValueChange.mockClear();
    EditorView.findFromDOM(textbox)?.focus();
    // Enter is a command in the editor's keymap, and a command is what read-only refuses.
    await userEvent.keyboard("{Enter}");
    await expect(documentOf(textbox)).toBe(SOURCE);
    await expect(onValueChange).not.toHaveBeenCalled();
  },
};

// Held outside the component: a new array each render would reconfigure the editor each render.
const SEND_ON_MOD_ENTER = [
  keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        onSend();
        return true;
      },
    },
  ]),
];

/**
 * An empty document shows its placeholder, and an app's own extension is in the editor.
 *
 * The run ends focused, so the a11y check reads the placeholder on the focused editor's line.
 */
export const EmptyWithAnExtension: Story = {
  render: () => <Held initial="" placeholder="Write Markdown…" extensions={SEND_ON_MOD_ENTER} />,
  play: async ({ canvas, canvasElement }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    await expect(canvas.getByText("Write Markdown…")).toBeVisible();
    onSend.mockClear();
    const view = EditorView.findFromDOM(textbox);
    view?.focus();
    // CodeMirror marks itself focused on a 10ms timer after the focus event. Without this wait the
    // a11y check measured whichever state won that race, and failed only when focus won (#436).
    await waitFor(() => expect(view?.dom).toHaveClass("cm-focused"));
    // The placeholder's line is not picked out: there is no text on it to be the current line of.
    const line = canvasElement.querySelector<HTMLElement>(".cm-activeLine");
    await expect(line && getComputedStyle(line).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await expect(onSend).toHaveBeenCalledTimes(1);
  },
};

/** A tooltip an app's extension shows at the start of the document, as a lint message would be. */
const LINT_TOOLTIP = [
  showTooltip.of({
    pos: 0,
    above: false,
    create: () => {
      const dom = document.createElement("div");
      dom.textContent = "Heading levels should go up one at a time";
      return { dom };
    },
  }),
];

/**
 * What an app's completion or lint extension draws is a floating surface (#486): a popover's
 * fill, edge and radius, and its `shadow-md`, since it floats over the text. It had no shadow.
 */
export const AnExtensionsPopover: Story = {
  render: () => <Held extensions={LINT_TOOLTIP} />,
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    const tooltip = await waitFor(() => {
      const found = canvasElement.ownerDocument.querySelector<HTMLElement>(".cm-tooltip");
      if (!found) {
        throw new Error("expected the extension's tooltip");
      }
      return found;
    });
    const style = getComputedStyle(tooltip);
    await expect(style.boxShadow).not.toBe("none");
    await expect(style.borderTopWidth).toBe("1px");
    await expect(style.borderTopLeftRadius).not.toBe("0px");
  },
};
