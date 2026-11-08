import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  EmptyContent as CompiledContent,
  EmptyDescription as CompiledDescription,
  Empty as CompiledEmpty,
  EmptyHeader as CompiledHeader,
  EmptyMedia as CompiledMedia,
  EmptyTitle as CompiledTitle,
} from "../compiled/empty";
import { EmptyState as CompiledEmptyState } from "../compiled/empty-state";
import { Search as CompiledSearch } from "../compiled/icons";
import { EmptyState as NativeEmptyState } from "../registry/layout/empty-state";
import { Button as NativeButton } from "../registry/ui/button";
import {
  EmptyContent as NativeContent,
  EmptyDescription as NativeDescription,
  Empty as NativeEmpty,
  EmptyHeader as NativeHeader,
  EmptyMedia as NativeMedia,
  EmptyTitle as NativeTitle,
} from "../registry/ui/empty";
// The web icon set, as an Expo web build draws it, and as the items here draw their own icons.
import { Search as NativeSearch } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * shadcn's `Empty` parts on both halves. The play tests say the compound form draws what
 * `EmptyState` draws — the 48-pixel muted bubble with a 24-pixel glyph, a 16-pixel title, a muted
 * line — and that `EmptyState` is those parts, box for box.
 */
const meta = { title: "RN Parity/Empty" } satisfies Meta;
export default meta;
type Story = StoryObj;

const onCreate = fn();

/** shadcn's own example, written the shadcn way, on both halves. */
export const Compound: Story = {
  render: () => (
    <SideBySide
      native={
        <NativeEmpty>
          <NativeHeader>
            <NativeMedia variant="icon">
              <NativeSearch />
            </NativeMedia>
            <NativeTitle>No projects yet</NativeTitle>
            <NativeDescription>Make one to start a board.</NativeDescription>
          </NativeHeader>
          <NativeContent>
            <NativeButton variant="info" onPress={onCreate} content="New project" />
          </NativeContent>
        </NativeEmpty>
      }
      compiled={
        <CompiledEmpty>
          <CompiledHeader>
            <CompiledMedia variant="icon">
              <CompiledSearch />
            </CompiledMedia>
            <CompiledTitle>No projects yet</CompiledTitle>
            <CompiledDescription>Make one to start a board.</CompiledDescription>
          </CompiledHeader>
          <CompiledContent>
            <CompiledButton variant="info" onClick={onCreate} content="New project" />
          </CompiledContent>
        </CompiledEmpty>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titles = canvas.getAllByText("No projects yet");
    await expect(titles).toHaveLength(2);
    // Plain text unless the caller makes it a heading.
    await expect(canvas.queryAllByRole("heading")).toHaveLength(0);
    const [native, compiled] = titles;
    if (!native || !compiled) {
      throw new Error("both halves should render");
    }

    await expect(getComputedStyle(compiled).fontSize).toBe("16px");
    await expect(getComputedStyle(native).fontSize).toBe("16px");
    await expect(getComputedStyle(compiled).fontWeight).toBe(getComputedStyle(native).fontWeight);
    await expect(getComputedStyle(compiled).color).toBe(getComputedStyle(native).color);

    const lines = canvas.getAllByText("Make one to start a board.");
    const [nativeLine, compiledLine] = lines;
    if (!nativeLine || !compiledLine) {
      throw new Error("both halves should render the line");
    }
    await expect(getComputedStyle(compiledLine).color).toBe(getComputedStyle(nativeLine).color);

    for (const title of titles) {
      // The bubble is the title's sibling in the header: round, 48 pixels, a 24-pixel glyph.
      const glyph = title.parentElement?.querySelector("svg");
      const bubble = glyph?.parentElement;
      if (!glyph || !bubble) {
        throw new Error("the icon should sit in its bubble");
      }
      await expect(bubble.getBoundingClientRect().width).toBe(48);
      await expect(bubble.getBoundingClientRect().height).toBe(48);
      await expect(glyph.getBoundingClientRect().width).toBe(24);
    }
    await expect(
      canvasElement.querySelector('[data-slot="empty-icon"]')?.getBoundingClientRect().width,
    ).toBe(48);

    onCreate.mockClear();
    for (const button of canvas.getAllByRole("button", { name: "New project" })) {
      await userEvent.click(button);
    }
    await expect(onCreate).toHaveBeenCalledTimes(2);
  },
};

const words = {
  title: "Project not found",
  description: "It may have been deleted, or the link is wrong.",
};

/**
 * `EmptyState` above the same parts written out by hand, per half: the two stack to the pixel,
 * because the one is built on the other.
 */
export const IsEmptyState: Story = {
  render: () => (
    <SideBySide
      native={
        <>
          <div data-testid="native-shell">
            <NativeEmptyState icon={NativeSearch} level={1} {...words} />
          </div>
          <div data-testid="native-parts">
            <NativeEmpty>
              <NativeHeader>
                <NativeMedia variant="icon">
                  <NativeSearch />
                </NativeMedia>
                <NativeTitle role="heading" aria-level={1}>
                  {words.title}
                </NativeTitle>
                <NativeDescription>{words.description}</NativeDescription>
              </NativeHeader>
            </NativeEmpty>
          </div>
        </>
      }
      compiled={
        <>
          <div data-testid="compiled-shell">
            <CompiledEmptyState icon={CompiledSearch} level={1} {...words} />
          </div>
          <div data-testid="compiled-parts">
            <CompiledEmpty>
              <CompiledHeader>
                <CompiledMedia variant="icon">
                  <CompiledSearch />
                </CompiledMedia>
                <CompiledTitle role="heading" aria-level={1}>
                  {words.title}
                </CompiledTitle>
                <CompiledDescription>{words.description}</CompiledDescription>
              </CompiledHeader>
            </CompiledEmpty>
          </div>
        </>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("heading", { level: 1, name: "Project not found" }),
    ).toHaveLength(4);

    for (const half of ["native", "compiled"]) {
      const shell = canvas.getByTestId(`${half}-shell`);
      const parts = canvas.getByTestId(`${half}-parts`);
      await expect(shell.getBoundingClientRect().height).toBe(parts.getBoundingClientRect().height);
      const glyph = (root: HTMLElement) => root.querySelector("svg")?.getBoundingClientRect();
      const title = (root: HTMLElement) =>
        within(root).getByText("Project not found").getBoundingClientRect();
      const offset = shell.getBoundingClientRect().top - parts.getBoundingClientRect().top;
      await expect((glyph(shell)?.top ?? 0) - offset).toBe(glyph(parts)?.top);
      await expect(title(shell).top - offset).toBe(title(parts).top);
      await expect(title(shell).left).toBe(title(parts).left);
    }
  },
};

const longTitle = "Nothing has been shared with this workspace by anyone on your team yet";

/**
 * Long words on a narrow column (#482): a title that wraps stays centred over the bubble, the line
 * under it starts 4px below it rather than touching, and the line is capped at 384px however wide
 * the page is. A link in the line is `info`, at rest and not only under the pointer.
 */
export const LongWords: Story = {
  render: () => (
    <SideBySide
      native={
        <div data-testid="native" className="w-[560px] max-w-full">
          <NativeEmpty>
            <NativeHeader>
              <NativeMedia variant="icon">
                <NativeSearch />
              </NativeMedia>
              <NativeTitle>{longTitle}</NativeTitle>
              <NativeDescription>
                When someone shares a document, a board or a folder with the whole workspace, it
                shows up here for everyone to open.
              </NativeDescription>
            </NativeHeader>
          </NativeEmpty>
        </div>
      }
      compiled={
        <div data-testid="compiled" className="w-[560px] max-w-full">
          <CompiledEmpty>
            <CompiledHeader>
              <CompiledMedia variant="icon">
                <CompiledSearch />
              </CompiledMedia>
              <CompiledTitle>{longTitle}</CompiledTitle>
              <CompiledDescription>
                When someone shares a document, a board or a folder with the whole workspace, it
                shows up here for everyone to open. <a href="#sharing">How sharing works</a>
              </CompiledDescription>
            </CompiledHeader>
          </CompiledEmpty>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const DESCRIPTION_CAP = 384;
    const TITLE_TO_LINE = 4;
    for (const half of ["native", "compiled"]) {
      const root = canvas.getByTestId(half);
      const title = within(root).getByText(longTitle);
      // A `testID` is `data-testid` under react-native-web and `data-slot` once compiled.
      const slot = half === "native" ? "data-testid" : "data-slot";
      const line = root.querySelector<HTMLElement>(`[${slot}=empty-description]`);
      if (!line) {
        throw new Error("the description should carry its data-slot");
      }
      await expect(getComputedStyle(title).textAlign).toBe("center");
      await expect(line.getBoundingClientRect().width).toBeLessThanOrEqual(DESCRIPTION_CAP);
      await expect(line.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(
        TITLE_TO_LINE,
      );
    }
    const link = canvas.getByRole("link", { name: "How sharing works" });
    const probe = document.createElement("span");
    probe.className = "text-info";
    canvasElement.append(probe);
    await expect(getComputedStyle(link).color).toBe(getComputedStyle(probe).color);
    probe.remove();
  },
};
