import { EditorView, keymap } from "@codemirror/view";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { lazy, Suspense, useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { MarkdownCodeEditorProps } from "@/components/markdown-code-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

/** An empty document shows its placeholder, and an app's own extension is in the editor. */
export const EmptyWithAnExtension: Story = {
  render: () => <Held initial="" placeholder="Write Markdown…" extensions={SEND_ON_MOD_ENTER} />,
  play: async ({ canvas }) => {
    const textbox = await canvas.findByRole("textbox", { name: "Notes" }, { timeout: 10_000 });
    await expect(canvas.getByText("Write Markdown…")).toBeVisible();
    onSend.mockClear();
    EditorView.findFromDOM(textbox)?.focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await expect(onSend).toHaveBeenCalledTimes(1);
  },
};
