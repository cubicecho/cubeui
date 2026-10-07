import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactElement, ReactNode } from "react";
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
  title: "RN Parity/DescriptionList",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

type Row = ComponentType<{
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  actionSlot?: ReactElement;
  valueClassName?: string;
}>;

const nativeCopy = <NativeButton size="sm" variant="outline" content="Copy path" />;
const compiledCopy = <CompiledButton size="sm" variant="outline" content="Copy path" />;

/** The ragdown settings page the issue was filed from, drawn with either half's parts. */
function rows(PropertyRow: Row, copy: ReactElement) {
  return [
    <PropertyRow
      key="embedder"
      label="Embedder"
      value="bge-small"
      hint="Set with RAGDOWN_EMBEDDER"
    />,
    <PropertyRow key="docs" label="Docs folder" value="/data/notes" actionSlot={copy} />,
    <PropertyRow key="index" label="Index" value="1,204 chunks" hint="Synced 2 minutes ago" />,
  ];
}

export const Inline: Story = {
  render: () => (
    <SideBySide
      native={<Native className="native-root" contentSlot={rows(NativeRow, nativeCopy)} />}
      compiled={
        <Compiled className="compiled-root" contentSlot={rows(CompiledRow, compiledCopy)} />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const native = canvasElement.querySelector<HTMLElement>(".native-root");
    const compiled = canvasElement.querySelector<HTMLElement>(".compiled-root");
    if (!native || !compiled) {
      throw new Error("both halves should render");
    }

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
    if (!embedder || !docs) {
      throw new Error("the rows should have values");
    }
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
          <Native className="native-root" contentSlot={rows(NativeRow, nativeCopy)} />
        </div>
      }
      compiled={
        <div style={{ width: 240 }}>
          <Compiled className="compiled-root" contentSlot={rows(CompiledRow, compiledCopy)} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) {
        throw new Error(`${root} should render`);
      }
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
        <Native
          layout="stacked"
          className="native-root"
          contentSlot={rows(NativeRow, nativeCopy)}
        />
      }
      compiled={
        <Compiled
          layout="stacked"
          className="compiled-root"
          contentSlot={rows(CompiledRow, compiledCopy)}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) {
        throw new Error(`${root} should render`);
      }
      const term = within(list).getByText("Docs folder").getBoundingClientRect();
      const value = within(list).getByText("/data/notes").getBoundingClientRect();
      await expect(value.top).toBeGreaterThanOrEqual(term.bottom);
    }
  },
};

const LONG_PATH = "/var/lib/ragdown/workspaces/engineering-handbook/documents/2026/onboarding";

/**
 * Machine values: a path, a version, a port. A number is drawn through the same `Text` a string
 * is, so it takes the class too.
 */
function machineRows(PropertyRow: Row, path: string) {
  return [
    <PropertyRow
      key="docs"
      label="Docs folder"
      value={path}
      valueClassName="font-mono"
      hint="Set with RAGDOWN_DOCS_DIR"
    />,
    <PropertyRow key="port" label="Port" value={8787} valueClassName="font-mono" />,
    <PropertyRow key="embedder" label="Embedder" value="bge-small" />,
  ];
}

const isMonospace = (el: Element) => /mono/i.test(getComputedStyle(el).fontFamily);

/**
 * `valueClassName` reaches a string value's own text, so a path is monospace on both halves with
 * no `<code>` at the call site. The native half is the one that matters: a `Text` there inherits
 * nothing, so a class left on the wrapper around it never arrived.
 */
export const MonospaceValue: Story = {
  render: () => (
    <SideBySide
      native={
        <Native className="native-root" contentSlot={machineRows(NativeRow, "/data/notes")} />
      }
      compiled={
        <Compiled className="compiled-root" contentSlot={machineRows(CompiledRow, "/data/notes")} />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const sizes: string[] = [];
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) {
        throw new Error(`${root} should render`);
      }
      const path = within(list).getByText("/data/notes");
      await expect(isMonospace(path)).toBe(true);
      await expect(isMonospace(within(list).getByText("8787"))).toBe(true);

      // Only the font changed: the size and the colour are still the plain value's.
      const plain = within(list).getByText("bge-small");
      await expect(isMonospace(plain)).toBe(false);
      await expect(getComputedStyle(path).fontSize).toBe(getComputedStyle(plain).fontSize);
      await expect(getComputedStyle(path).color).toBe(getComputedStyle(plain).color);
      await expect(isMonospace(within(list).getByText("Docs folder"))).toBe(false);
      // Nor the hint, on either half: the class is on the text, not on the `<dd>` the hint is in.
      await expect(isMonospace(within(list).getByText("Set with RAGDOWN_DOCS_DIR"))).toBe(false);
      sizes.push(getComputedStyle(path).fontSize);
    }
    await expect(sizes[0]).toBe(sizes[1]);
  },
};

/**
 * A long path with no spaces in a narrow column: it breaks inside the row rather than widening
 * the list, in monospace as it did in the page font.
 */
export const MonospaceValueWhenNarrow: Story = {
  render: () => (
    <SideBySide
      native={
        <div style={{ width: 240 }}>
          <Native className="native-root" contentSlot={machineRows(NativeRow, LONG_PATH)} />
        </div>
      }
      compiled={
        <div style={{ width: 240 }}>
          <Compiled className="compiled-root" contentSlot={machineRows(CompiledRow, LONG_PATH)} />
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const root of [".native-root", ".compiled-root"]) {
      const list = canvasElement.querySelector<HTMLElement>(root);
      if (!list) {
        throw new Error(`${root} should render`);
      }
      const path = within(list).getByText(LONG_PATH);
      await expect(isMonospace(path)).toBe(true);

      const listBox = list.getBoundingClientRect();
      const pathBox = path.getBoundingClientRect();
      await expect(listBox.width).toBeLessThanOrEqual(240);
      await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
      await expect(pathBox.right).toBeLessThanOrEqual(listBox.right + 0.5);
      // More than one line of `text-sm`, so it wrapped rather than being clipped.
      await expect(pathBox.height).toBeGreaterThan(30);
    }
  },
};
