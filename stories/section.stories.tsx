import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text, View } from "react-native";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import { Section as Compiled } from "../compiled/section";
import { Section as Native } from "../registry/layout/section";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * `section` was a web-only item until a React Native app wrote its own. These stories are what say
 * the one source still gives the DOM what the hand-written `<section>` + `<h2>` did: a heading of
 * the right rank, and a region named by it.
 */
const meta = {
  title: "RN Parity/Section",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = <Text className="text-foreground text-sm">Work 25 minutes, rest 5.</Text>;

export const Default: Story = {
  args: { title: "Pomodoro", description: "How long a focus block runs.", divider: true },
  render: (args) => (
    <SideBySide
      native={<Native {...args} contentSlot={body} />}
      compiled={<Compiled {...args} contentSlot={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both halves are a level-2 heading named by the title — the rank is a prop now, and a rank
    // known only at runtime is `role="heading"` + `aria-level` rather than an `<h2>`.
    const headings = canvas.getAllByRole("heading", { level: 2, name: "Pomodoro" });
    await expect(headings).toHaveLength(2);
    const [native, compiled] = headings;
    if (!native || !compiled) throw new Error("both halves should render");

    // The compiled root is a `<section>` named by its title, which is what makes it a landmark.
    const region = canvas.getByRole("region", { name: "Pomodoro" });
    await expect(region.tagName).toBe("SECTION");

    const nativeStyle = getComputedStyle(native);
    const compiledStyle = getComputedStyle(compiled);
    await expect(nativeStyle.color).toMatch(/\/ 0\.6\)$/);
    await expect(compiledStyle.color).toBe(nativeStyle.color);
    await expect(compiledStyle.fontSize).toBe(nativeStyle.fontSize);
    await expect(compiledStyle.textTransform).toBe("uppercase");
    await expect(compiledStyle.letterSpacing).toBe(nativeStyle.letterSpacing);
  },
};

export const Level: Story = {
  args: { title: "Breaks", level: 3 },
  render: (args) => (
    <SideBySide
      native={<Native {...args} contentSlot={body} />}
      compiled={<Compiled {...args} contentSlot={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 3, name: "Breaks" })).toHaveLength(2);
    await expect(canvas.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  },
};

export const CardSurface: Story = {
  args: { title: "Danger zone", surface: "card" },
  render: (args) => (
    <SideBySide
      native={<Native {...args} className="native-root" contentSlot={body} />}
      compiled={<Compiled {...args} className="compiled-root" contentSlot={body} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const native = canvasElement.querySelector(".native-root");
    const compiled = canvasElement.querySelector(".compiled-root");
    if (!native || !compiled) throw new Error("both halves should render");

    const nativeStyle = getComputedStyle(native);
    const compiledStyle = getComputedStyle(compiled);
    await expect(compiledStyle.borderTopWidth).toBe("1px");
    await expect(compiledStyle.borderTopWidth).toBe(nativeStyle.borderTopWidth);
    await expect(compiledStyle.paddingTop).toBe(nativeStyle.paddingTop);
    await expect(compiledStyle.backgroundColor).toBe(nativeStyle.backgroundColor);
  },
};

const toolbarLabels = ["New file", "New folder", "Add files", "Add folder", "Export"] as const;
const toolbarDescription = "Files live under the skill's folder; you can also edit them on disk.";

/**
 * One half's phone-width column: a section whose `actionSlot` is a five-button toolbar, twice —
 * once as a fragment, which the shell rows and wraps, and once as the caller's own wrapping row,
 * which is what an app that already wrote `flex flex-wrap` hands it.
 */
function WideActionSections({ half }: { half: "native" | "compiled" }) {
  const Section = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  const buttons = toolbarLabels.map((label) => (
    <Button key={label} variant="outline" size="sm" content={label} />
  ));
  const row =
    half === "native" ? (
      <View className="flex-row flex-wrap items-center gap-2">{buttons}</View>
    ) : (
      <div className="flex flex-wrap items-center gap-2">{buttons}</div>
    );
  return (
    <div style={{ width: 390 }} className="flex flex-col gap-8">
      <div data-testid={`${half}-fragment`}>
        <Section
          title="Files"
          description={toolbarDescription}
          actionSlot={buttons}
          contentSlot={body}
        />
      </div>
      {/* A second title, because two regions with one name are one landmark too many. */}
      <div data-testid={`${half}-row`}>
        <Section
          title="Assets"
          description={toolbarDescription}
          actionSlot={row}
          contentSlot={body}
        />
      </div>
    </div>
  );
}

/**
 * A five-button `actionSlot` at 390px (#211). The heading row used not to wrap, and the action
 * never shrinks, so the text column was left with what remained — the description at one character
 * a line. Now the text keeps its floor and an action that does not fit beside it drops under it, at
 * the start, where its own buttons wrap inside the section. Held on both halves, and for both
 * ways a caller hands over a toolbar.
 */
export const WideActionNarrow: Story = {
  args: { title: "Files" },
  render: () => (
    <SideBySide
      native={<WideActionSections half="native" />}
      compiled={<WideActionSections half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      for (const form of ["fragment", "row"] as const) {
        const frame = within(canvasElement).getByTestId(`${half}-${form}`);
        const box = frame.getBoundingClientRect();
        const description = within(frame).getByText(toolbarDescription).getBoundingClientRect();
        const buttons = toolbarLabels.map((name) =>
          within(frame).getByRole("button", { name }).getBoundingClientRect(),
        );
        const [first] = buttons;
        if (!first) throw new Error("expected five buttons");
        // `half` and `form` ride along so a failure names which case broke.
        await expect({
          half,
          form,
          // Readable: the description has the whole line, not what the toolbar left over.
          readable: description.width > box.width - 2,
          // Dropped: the toolbar starts under the text, at the section's start.
          dropped: first.top >= description.bottom && Math.abs(first.left - box.left) < 1,
          // Contained: no button runs out of the section, either side.
          contained: buttons.every((b) => b.left >= box.left - 1 && b.right <= box.right + 1),
        }).toEqual({ half, form, readable: true, dropped: true, contained: true });
      }
    }
  },
};

/** One half's phone-width section with a single small button as its `actionSlot`. */
function SmallActionSection({ half }: { half: "native" | "compiled" }) {
  const Section = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  return (
    <div data-testid={`${half}-small`} style={{ width: 390 }}>
      <Section
        title="Files"
        description={toolbarDescription}
        actionSlot={<Button variant="outline" size="sm" content="Export" />}
        contentSlot={body}
      />
    </div>
  );
}

/**
 * The other side of #211: an action that fits does not move. One button at 390px stays at the
 * heading row's far end, centred on the text beside it, exactly where it sat before the row
 * learned to wrap.
 */
export const SmallActionStaysBeside: Story = {
  args: { title: "Files" },
  render: () => (
    <SideBySide
      native={<SmallActionSection half="native" />}
      compiled={<SmallActionSection half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      const frame = within(canvasElement).getByTestId(`${half}-small`);
      const box = frame.getBoundingClientRect();
      const title = within(frame).getByRole("heading", { name: "Files" }).getBoundingClientRect();
      const description = within(frame).getByText(toolbarDescription).getBoundingClientRect();
      const button = within(frame).getByRole("button", { name: "Export" }).getBoundingClientRect();
      const textMiddle = (title.top + description.bottom) / 2;
      const buttonMiddle = (button.top + button.bottom) / 2;
      await expect({
        half,
        // At the far end, flush with the section's edge.
        atEnd: Math.abs(button.right - box.right) < 1,
        // Beside the text, past its end, with the row's 8px gap between them.
        beside: Math.abs(button.left - description.right - 8) < 1,
        // Centred on the text block, as `items-center` always had it.
        centred: Math.abs(buttonMiddle - textMiddle) < 1,
      }).toEqual({ half, atEnd: true, beside: true, centred: true });
    }
  },
};
