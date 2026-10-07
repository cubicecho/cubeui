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
  title: "RN Parity/CardLayout",
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
 * The two titles, native first — after checking both are drawn at `CardTitle`'s own `text-base`,
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
    await expect(style.fontSize).toBe("16px");
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

/** `titleClassName` reaches the title on both halves, and wins over the card's own size (#249). */
export const TitleClassName: Story = {
  args: { ...args, titleClassName: "text-lg" },
  render: () => (
    <SideBySide
      native={<Native {...args} titleClassName="text-lg" />}
      compiled={<Compiled {...args} titleClassName="text-lg" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const headings = within(canvasElement).getAllByRole("heading", { level: 3, name: "Sign in" });
    await expect(headings).toHaveLength(2);
    for (const title of headings) {
      await expect(getComputedStyle(title).fontSize).toBe("18px");
    }
  },
};

const actionLabels = ["Copy MCP config", "Rename", "Delete"] as const;

/** Three buttons in `footerActionsSlot`, in a card as narrow as a phone. */
function NarrowCard({ half }: { half: "native" | "compiled" }) {
  const Card = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  return (
    <div data-testid={`${half}-frame`} style={{ width: 320 }}>
      <Card
        title="Journal"
        contentSlot={
          half === "native" ? (
            <Text className="text-sm text-foreground">Notes kept by the agent.</Text>
          ) : (
            <p className="text-sm">Notes kept by the agent.</p>
          )
        }
        footerActionsSlot={actionLabels.map((label) => (
          <Button key={label} variant="outline" size="sm" content={label} />
        ))}
      />
    </div>
  );
}

/**
 * `footerActionsSlot` in a 320px card (#159). The row used to hold its buttons on one line and run
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

const longTitle = "skills/ticket-workflow/references/checkpoint-template.md";
const headerWidths = [280, 390, 640] as const;

/** A file path as the title and two controls as the `actionSlot`, at one width. */
function LongTitleCard({ half, width }: { half: "native" | "compiled"; width: number }) {
  const Card = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  return (
    <div data-testid={`${half}-${width}`} style={{ width }}>
      <Card
        title={longTitle}
        actionSlot={
          <>
            <Button variant="outline" content="Preview" />
            <Button content="Save" />
          </>
        }
      />
    </div>
  );
}

function LongTitleCards({ half }: { half: "native" | "compiled" }) {
  return (
    <div className="flex flex-col gap-4">
      {headerWidths.map((width) => (
        <LongTitleCard key={width} half={half} width={width} />
      ))}
    </div>
  );
}

/**
 * A long `title` beside a two-control `actionSlot` (#211). The action used to be `CardAction`, an
 * absolute box that reserved no width, so the title ran underneath it. Now it is in the header's
 * flow: beside the title where both fit, the title truncating short of it, and under the title
 * where they do not. At three widths, on both halves, the two never share a pixel.
 */
export const LongTitleWithAction: Story = {
  args: { title: longTitle },
  render: () => (
    <SideBySide
      native={<LongTitleCards half="native" />}
      compiled={<LongTitleCards half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      for (const width of headerWidths) {
        const frame = within(canvasElement).getByTestId(`${half}-${width}`);
        const card = frame.firstElementChild;
        if (!card) throw new Error(`the ${half} card should render`);
        const box = card.getBoundingClientRect();
        const scope = within(frame);
        const title = scope.getByRole("heading", { name: longTitle }).getBoundingClientRect();
        const preview = scope.getByRole("button", { name: "Preview" }).getBoundingClientRect();
        const save = scope.getByRole("button", { name: "Save" }).getBoundingClientRect();
        const apart = (button: DOMRect) =>
          title.right <= button.left || title.bottom <= button.top || button.bottom <= title.top;
        // `half` and `width` ride along so a failure names which case broke.
        await expect({
          half,
          width,
          // No overlap: each control is wholly beside the title or wholly under it.
          apart: apart(preview) && apart(save),
          // Both shown: the title keeps a readable run, and everything is inside the card.
          titleShown: title.width >= 150,
          inside: [title, preview, save].every((r) => r.left >= box.left && r.right <= box.right),
          // The two controls stay on one line, in the order they were passed.
          together: Math.abs(preview.top - save.top) < 1 && preview.right <= save.left,
        }).toEqual({ half, width, apart: true, titleShown: true, inside: true, together: true });
      }
    }
  },
};

/** One small button as the `actionSlot`, at a phone's width, with and without a description. */
function SmallActionCards({ half }: { half: "native" | "compiled" }) {
  const Card = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  const add = <Button variant="outline" size="sm" content="Add" />;
  return (
    <div style={{ width: 390 }} className="flex flex-col gap-4">
      <div data-testid={`${half}-described`}>
        <Card
          title="Categories"
          description="Deleting one keeps its activities."
          actionSlot={add}
        />
      </div>
      <div data-testid={`${half}-titled`}>
        <Card title="Categories" actionSlot={add} />
      </div>
    </div>
  );
}

/**
 * The other side of #211: an action that fits does not move. One button stays where `CardAction`
 * put it — the header's top corner at its far end, 24px in from each edge — on both halves, with
 * a description under the title and without one.
 */
export const SmallActionStaysInCorner: Story = {
  args: { title: "Categories" },
  render: () => (
    <SideBySide
      native={<SmallActionCards half="native" />}
      compiled={<SmallActionCards half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      for (const form of ["described", "titled"] as const) {
        const frame = within(canvasElement).getByTestId(`${half}-${form}`);
        const card = frame.firstElementChild;
        if (!card) throw new Error(`the ${half} card should render`);
        const box = card.getBoundingClientRect();
        const button = within(frame).getByRole("button", { name: "Add" }).getBoundingClientRect();
        // The card's 1px border, then the header's `p-6`.
        await expect({
          half,
          form,
          fromTop: Math.round(button.top - box.top),
          fromEnd: Math.round(box.right - button.right),
        }).toEqual({ half, form, fromTop: 25, fromEnd: 25 });
        // Beside a title and a description the button is the shorter of the two, so being in
        // the flow costs the header nothing: the card is as tall as it was.
        if (form === "described") await expect(Math.round(box.height)).toBe(92);
      }
    }
  },
};

function HeaderlessCards({ half }: { half: "native" | "compiled" }) {
  const Card = half === "native" ? Native : Compiled;
  const Button = half === "native" ? NativeButton : CompiledButton;
  return (
    <div className="grid gap-4">
      <div data-testid={`${half}-body`}>
        <Card
          contentSlot={
            <div
              data-testid={`${half}-body-content`}
              className="h-10 border border-foreground/15"
            />
          }
        />
      </div>
      <div data-testid={`${half}-footer`}>
        <Card footerActionsSlot={<Button content="Save" />} />
      </div>
    </div>
  );
}

/**
 * #268: a card with no header. `CardContent` and `CardFooter` are `pt-0` because the header above
 * them brings the top padding, so with no header the first part of the card sat on its top edge.
 * It is 24px in on every side now, as it is at the start, the end and the bottom.
 */
export const Headerless: Story = {
  args: {},
  render: () => (
    <SideBySide
      native={<HeaderlessCards half="native" />}
      compiled={<HeaderlessCards half="compiled" />}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const half of ["native", "compiled"] as const) {
      const targets = {
        body: canvas.getByTestId(`${half}-body-content`),
        footer: within(canvas.getByTestId(`${half}-footer`)).getByRole("button", { name: "Save" }),
      };
      for (const [form, target] of Object.entries(targets)) {
        const card = canvas.getByTestId(`${half}-${form}`).firstElementChild;
        if (!card) throw new Error(`the ${half} card should render`);
        const box = card.getBoundingClientRect();
        const inner = target.getBoundingClientRect();
        // The card's 1px border, then `p-6`.
        await expect({
          half,
          form,
          fromTop: Math.round(inner.top - box.top),
          fromBottom: Math.round(box.bottom - inner.bottom),
        }).toEqual({ half, form, fromTop: 25, fromBottom: 25 });
      }
    }
  },
};
