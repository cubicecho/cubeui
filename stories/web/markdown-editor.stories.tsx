import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import { FormField } from "@/components/form-field";
import { MarkdownEditor, type MarkdownEditorView } from "@/components/markdown-editor";

const meta = {
  title: "Controls/MarkdownEditor",
  component: MarkdownEditor,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Long enough that its rendering is taller than a pane's floor, so "the panes end together" is
// the textarea growing to the preview's height and not the two floors happening to match.
const SOURCE = `# My skill

What it does, in a sentence.

## When to use it

- one
- two
- three

## Steps

1. Read the request
2. Do the work
3. Say what was done

> A note for whoever edits this next.
`;

const onValueChange = fn();
const onViewChange = fn();

/** The value held the way a screen holds it. The component keeps no copy of its own. */
function Held({
  initial = SOURCE,
  defaultView,
}: {
  initial?: string;
  defaultView?: MarkdownEditorView;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MarkdownEditor
      aria-label="Skill body"
      placeholder="# My skill"
      emptySlot={<p className="m-0 text-foreground/60">Nothing to preview yet.</p>}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
      defaultView={defaultView}
    />
  );
}

const parts = (canvasElement: HTMLElement) => ({
  source: canvasElement.querySelector<HTMLTextAreaElement>("textarea"),
  preview: canvasElement.querySelector<HTMLElement>("[data-slot=markdown-editor-preview]"),
});

const shown = (element: HTMLElement | null) =>
  element !== null && element.getBoundingClientRect().width > 0;

/**
 * The editor with nothing but a value: it starts split and holds the view itself.
 *
 * The run walks all three views and checks the thing that makes this an editor rather than a
 * toggle between two components — the textarea is the same element throughout, so what was typed,
 * and the browser's undo history for it, survive a look at the preview.
 */
export const Default: Story = {
  args: { value: SOURCE, onValueChange },
  render: () => <Held />,
  play: async ({ canvas, canvasElement }) => {
    // Side by side needs the room: this is the test runner's default width.
    await expect(window.matchMedia("(min-width: 64rem)").matches).toBe(true);

    const toggle = canvas.getByRole("group", { name: "Editor view" });
    await expect(toggle).toBeVisible();
    const edit = canvas.getByRole("button", { name: "Edit" });
    const split = canvas.getByRole("button", { name: "Split" });
    const preview = canvas.getByRole("button", { name: "Preview" });
    await expect(split).toHaveAttribute("aria-pressed", "true");
    await expect(edit).toHaveAttribute("aria-pressed", "false");

    // Split: the source and its rendering on one line, ending together.
    const source = canvas.getByRole("textbox", { name: "Skill body" });
    const first = parts(canvasElement);
    await expect(first.source).toBe(source);
    await expect(shown(first.preview)).toBe(true);
    const left = source.getBoundingClientRect();
    const right = (first.preview as HTMLElement).getBoundingClientRect();
    await expect(right.left).toBeGreaterThan(left.right);
    await expect(right.top).toBeCloseTo(left.top, 0);
    await expect(left.height).toBeCloseTo(right.height, 0);
    await expect(canvas.getByRole("heading", { name: "My skill", level: 1 })).toBeVisible();

    // Typing is drawn as it is typed.
    await userEvent.type(source, "\n## Added");
    await expect(onValueChange).toHaveBeenLastCalledWith(`${SOURCE}\n## Added`);
    await expect(canvas.getByRole("heading", { name: "Added", level: 2 })).toBeVisible();

    // Preview: the document alone. The textarea is hidden, not gone.
    await userEvent.click(preview);
    await expect(preview).toHaveAttribute("aria-pressed", "true");
    const second = parts(canvasElement);
    await expect(second.source).toBe(source);
    await expect(shown(second.source)).toBe(false);
    await expect(shown(second.preview)).toBe(true);
    await expect(canvas.getByRole("heading", { name: "Added", level: 2 })).toBeVisible();

    // Edit: the source alone, the same element, holding what was typed.
    await userEvent.click(edit);
    const third = parts(canvasElement);
    await expect(third.source).toBe(source);
    await expect(shown(third.source)).toBe(true);
    await expect(third.preview).toBeNull();
    await expect(source).toHaveValue(`${SOURCE}\n## Added`);
  },
};

/** The view held by the caller — in the URL, in a preference. The component only reports. */
export const HeldView: Story = {
  args: { value: SOURCE, onValueChange },
  render: function Render() {
    const [view, setView] = useState<MarkdownEditorView>("edit");
    return (
      <div className="flex flex-col gap-2">
        <p className="text-foreground/60 text-sm">
          The screen holds: <span data-testid="held">{view}</span>
        </p>
        <MarkdownEditor
          aria-label="Skill body"
          value={SOURCE}
          onValueChange={onValueChange}
          view={view}
          onViewChange={(next) => {
            onViewChange(next);
            setView(next);
          }}
        />
      </div>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    onViewChange.mockClear();
    await expect(canvas.getByRole("button", { name: "Edit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(parts(canvasElement).preview).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Preview" }));
    await expect(onViewChange).toHaveBeenCalledTimes(1);
    await expect(onViewChange).toHaveBeenCalledWith("preview");
    await expect(canvas.getByTestId("held")).toHaveTextContent("preview");
    await expect(shown(parts(canvasElement).preview)).toBe(true);
  },
};

/**
 * A caller that passes `view` and ignores the report: the view does not move. What is drawn is
 * what the caller said, the same contract a controlled input has.
 */
export const ViewTheCallerDoesNotMove: Story = {
  args: { "aria-label": "Skill body", value: SOURCE, onValueChange, view: "edit", onViewChange },
  play: async ({ canvas, canvasElement }) => {
    onViewChange.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Split" }));
    await expect(onViewChange).toHaveBeenCalledTimes(1);
    await expect(onViewChange).toHaveBeenCalledWith("split");
    await expect(canvas.getByRole("button", { name: "Edit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(parts(canvasElement).preview).toBeNull();
  },
};

/**
 * Under `lg`, `split` is one pane — the source. Two columns do not fit, and stacking them would
 * put the preview a screen below the line being typed. Preview is still one press away.
 */
export const NarrowScreen: Story = {
  args: { value: SOURCE, onValueChange },
  render: () => <Held />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    await expect(window.matchMedia("(min-width: 64rem)").matches).toBe(false);
    await expect(canvas.getByRole("button", { name: "Split" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const split = parts(canvasElement);
    await expect(shown(split.source)).toBe(true);
    await expect(shown(split.preview)).toBe(false);
    // One pane, the whole width, and nothing left over where the other would have been.
    const editor = canvasElement.querySelector<HTMLElement>("[data-slot=markdown-editor]");
    await expect(split.source?.getBoundingClientRect().width).toBeCloseTo(
      editor?.getBoundingClientRect().width ?? 0,
      0,
    );

    await userEvent.click(canvas.getByRole("button", { name: "Preview" }));
    const preview = parts(canvasElement);
    await expect(shown(preview.source)).toBe(false);
    await expect(shown(preview.preview)).toBe(true);
  },
};

/** Nothing written yet: the placeholder on one side, and a line saying so on the other. */
export const Blank: Story = {
  args: { value: "", onValueChange },
  render: () => <Held initial="" />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByPlaceholderText("# My skill")).toHaveValue("");
    await expect(parts(canvasElement).preview).toHaveTextContent("Nothing to preview yet.");
  },
};

/**
 * As a field of a form. `FormField` hands its `controlSlot` an id and the description's id, and the
 * editor passes both to the textarea — so the label names the source, and a click on it lands there.
 */
export const InAFormField: Story = {
  args: { value: SOURCE, onValueChange },
  render: function Render() {
    const [value, setValue] = useState(SOURCE);
    return (
      <FormField
        label="Instructions"
        description="Markdown. What the skill does and when to use it."
        controlSlot={<MarkdownEditor value={value} onValueChange={setValue} defaultView="edit" />}
      />
    );
  },
  play: async ({ canvas }) => {
    const source = canvas.getByRole("textbox", { name: "Instructions" });
    await expect(source.tagName).toBe("TEXTAREA");
    await expect(source).toHaveAccessibleDescription(
      "Markdown. What the skill does and when to use it.",
    );
    await userEvent.click(canvas.getByText("Instructions"));
    await expect(source).toHaveFocus();
  },
};
