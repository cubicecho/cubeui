import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { expect, within } from "storybook/test";
import { Button as CompiledButton } from "../compiled/button";
import {
  DescriptionList as Compiled,
  PropertyRow as CompiledRow,
} from "../compiled/description-list";
import {
  DescriptionList as Native,
  PropertyRow as NativeRow,
} from "../registry/layout/description-list";
import { Button as NativeButton } from "../registry/ui/button";
import { SideBySide } from "./side-by-side";

/**
 * One source, two sets of semantics. The native half is a list of list items, which is what
 * VoiceOver and TalkBack count; the compiled half is a `<dl>` of `<div>`-grouped `<dt>`/`<dd>`
 * pairs with neither list role left on it — the compiler drops them, because a role on a `<dl>`
 * or one of its groups is what axe's `definition-list` rule fails. The a11y addon runs as an error
 * on every story here, so each one is also that audit.
 */
const meta = {
  title: "Layout/Description List",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

type Row = ComponentType<{
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}>;

const nativeCopy = (
  <NativeButton size="sm" variant="outline">
    Copy path
  </NativeButton>
);
const compiledCopy = (
  <CompiledButton size="sm" variant="outline">
    Copy path
  </CompiledButton>
);

/** The ragdown settings page the issue was filed from, drawn with either half's parts. */
function rows(PropertyRow: Row, copy: ReactNode) {
  return [
    <PropertyRow
      key="embedder"
      label="Embedder"
      value="bge-small"
      hint="Set with RAGDOWN_EMBEDDER"
    />,
    <PropertyRow key="docs" label="Docs folder" value="/data/notes" action={copy} />,
    <PropertyRow key="index" label="Index" value="1,204 chunks" hint="Synced 2 minutes ago" />,
  ];
}

export const Inline: Story = {
  render: () => (
    <SideBySide
      native={<Native className="native-root" content={rows(NativeRow, nativeCopy)} />}
      compiled={<Compiled className="compiled-root" content={rows(CompiledRow, compiledCopy)} />}
    />
  ),
  play: async ({ canvasElement }) => {
    const native = canvasElement.querySelector<HTMLElement>(".native-root");
    const compiled = canvasElement.querySelector<HTMLElement>(".compiled-root");
    if (!native || !compiled) throw new Error("both halves should render");

    // Device: a list of three items. (react-native-web draws `role="list"` as a `<ul>`.)
    await expect(native.getAttribute("role") ?? native.tagName).toMatch(/^(list|UL)$/);
    await expect(within(native).getAllByRole("listitem")).toHaveLength(3);

    // Web: a `<dl>`, each row a role-less `<div>` of one `<dt>` and one `<dd>`.
    await expect(compiled.tagName).toBe("DL");
    await expect(compiled.hasAttribute("role")).toBe(false);
    const groups = Array.from(compiled.children);
    await expect(groups).toHaveLength(3);
    for (const group of groups) {
      await expect(group.tagName).toBe("DIV");
      await expect(group.hasAttribute("role")).toBe(false);
      await expect(Array.from(group.children).map((c) => c.tagName)).toEqual(["DT", "DD"]);
    }
    const web = within(compiled);
    await expect(web.getAllByRole("term").map((t) => t.textContent)).toEqual([
      "Embedder",
      "Docs folder",
      "Index",
    ]);

    // The hint and the action belong to the value: both are inside its `<dd>`.
    const [embedder, docs] = web.getAllByRole("definition");
    if (!embedder || !docs) throw new Error("the rows should have values");
    await expect(embedder.textContent).toBe("bge-smallSet with RAGDOWN_EMBEDDER");
    await expect(within(docs).getByRole("button", { name: "Copy path" })).toBeTruthy();

    // Inline and wide enough: the label sits beside the value, on the same line.
    const term = web.getByText("Embedder");
    const value = web.getByText("bge-small");
    const termBox = term.getBoundingClientRect();
    const valueBox = value.getBoundingClientRect();
    await expect(valueBox.left).toBeGreaterThan(termBox.right);
    await expect(Math.abs(valueBox.top - termBox.top)).toBeLessThan(4);

    // And the two halves draw it alike.
    const nativeTerm = within(native).getByText("Embedder");
    await expect(getComputedStyle(term).color).toBe(getComputedStyle(nativeTerm).color);
    await expect(getComputedStyle(term).fontSize).toBe(getComputedStyle(nativeTerm).fontSize);
    await expect(nativeTerm.getBoundingClientRect().width).toBe(termBox.width);
  },
};

/** `inline` in a column too narrow for a label beside its value reads as `stacked`, with no prop. */
export const InlineWhenNarrow: Story = {
  render: () => (
    <SideBySide
      native={
        <div style={{ width: 240 }}>
          <Native className="native-root" content={rows(NativeRow, nativeCopy)} />
        </div>
      }
      compiled={
        <div style={{ width: 240 }}>
          <Compiled className="compiled-root" content={rows(CompiledRow, compiledCopy)} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) throw new Error(`${root} should render`);
      const term = within(list).getByText("Embedder").getBoundingClientRect();
      const value = within(list).getByText("bge-small").getBoundingClientRect();
      await expect(value.top).toBeGreaterThanOrEqual(term.bottom);
      await expect(Math.abs(value.left - term.left)).toBeLessThan(1);
    }
  },
};

export const Stacked: Story = {
  render: () => (
    <SideBySide
      native={
        <Native layout="stacked" className="native-root" content={rows(NativeRow, nativeCopy)} />
      }
      compiled={
        <Compiled
          layout="stacked"
          className="compiled-root"
          content={rows(CompiledRow, compiledCopy)}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) throw new Error(`${root} should render`);
      const term = within(list).getByText("Docs folder").getBoundingClientRect();
      const value = within(list).getByText("/data/notes").getBoundingClientRect();
      await expect(value.top).toBeGreaterThanOrEqual(term.bottom);
    }
  },
};
