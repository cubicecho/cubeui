import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

/**
 * A DECISION AID, not a component: three ways to draw a chosen thing, side by side, so one can
 * be picked. Each column draws the same screen — a list with the open record, a table with rows
 * checked for a bulk action, a sidebar, tabs, a segmented control and checkboxes — with today's
 * tokens and real hover classes, so pointing at a chosen thing shows what the pointer does to it.
 * The content in the rows keeps the colours apps give it (badges, a colour dot, muted meta), which
 * is what decides whether a solid fill can work.
 */
const meta = {
  title: "Tokens/Selection (comparison)",
  parameters: {
    layout: "fullscreen",
    // Some options are shown failing on purpose: coloured content on a solid fill is the problem
    // being compared. The ratios are written beside them instead.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** How one option draws each kind of chosen thing. */
type Option = {
  name: string;
  summary: string;
  /** The open record in a list: the one current row. */
  currentRow: string;
  /** A row checked for a bulk action, many at once. */
  checkedRow: string;
  /** Text and icons on a chosen row, where the row sets them. */
  rowInk: string;
  /** Whether the content inside a chosen row is forced to the row's ink. */
  forceInk: boolean;
  sidebarCurrent: string;
  tab: string;
  pill: string;
  checkbox: string;
  verdict: string;
};

const SOLID = "bg-active text-active-foreground hover:bg-active/90";
const TINT = "bg-active/40 text-foreground hover:bg-active/60";
const REST = "hover:bg-hover";

const OPTIONS: Option[] = [
  {
    name: "A. Solid everywhere",
    summary: "Every chosen thing is solid active, /90 under the pointer.",
    currentRow: SOLID,
    checkedRow: SOLID,
    rowInk: "text-active-foreground",
    forceInk: false,
    sidebarCurrent: SOLID,
    tab: SOLID,
    pill: SOLID,
    checkbox: SOLID,
    verdict:
      "Coloured content in a chosen row fails: normal text 2.7–3.4:1, an info badge about 1:1. The pointer step is subtle (/90 is 1.15–1.24:1 from rest).",
  },
  {
    name: "A′. Solid, content follows the row",
    summary: "Solid everywhere; a chosen row forces everything inside it to its own ink.",
    currentRow: SOLID,
    checkedRow: SOLID,
    rowInk: "text-active-foreground",
    forceInk: true,
    sidebarCurrent: SOLID,
    tab: SOLID,
    pill: SOLID,
    checkbox: SOLID,
    verdict:
      "Readable (5.2–7:1), but badges and colour labels lose their colour while a row is chosen, including every row checked for a bulk action.",
  },
  {
    name: "B. Tinted rows, solid everything else",
    summary:
      "Rows (lists, tables, trees) are the /40 tint, /60 under the pointer; the sidebar and controls are solid.",
    currentRow: TINT,
    checkedRow: TINT,
    rowInk: "text-foreground",
    forceInk: false,
    sidebarCurrent: SOLID,
    tab: SOLID,
    pill: SOLID,
    checkbox: SOLID,
    verdict:
      "Content keeps its colours and reads on the tint; the pointer step is clear (/60 is about 1.4:1 from /40). Rows and controls look different on purpose.",
  },
  {
    name: "C. Tinted everywhere",
    summary: "Every chosen thing is the /40 tint, /60 under the pointer, controls included.",
    currentRow: TINT,
    checkedRow: TINT,
    rowInk: "text-foreground",
    forceInk: false,
    sidebarCurrent: TINT,
    tab: TINT,
    pill: TINT,
    checkbox: "bg-active/40 text-foreground hover:bg-active/60 border border-active",
    verdict:
      "One look and readable content everywhere, but a chosen control (a checked box, the active tab) is quieter and stands out less among its neighbours.",
  },
];

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-4 mb-1.5 font-semibold text-foreground/60 text-xs uppercase tracking-wide">
      {children}
    </h3>
  );
}

/** What apps put in a row: a title, muted meta, a soft badge and a colour dot. */
function RowContent({ option, chosen }: { option: Option; chosen: boolean }) {
  const forced = chosen && option.forceInk;
  return (
    <>
      <span
        aria-hidden
        className={`size-7 shrink-0 rounded-full ${forced ? "bg-active-foreground/20" : "bg-info/20"}`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-medium text-sm ${forced ? "" : chosen ? "" : "text-foreground"}`}
        >
          Quarterly report
        </span>
        <span className={`block truncate text-xs ${forced ? "" : "text-foreground/60"}`}>
          Edited 2 hours ago
        </span>
      </span>
      <span
        className={`rounded px-1.5 py-0.5 font-medium text-xs ${forced ? "border border-current" : "bg-info/10 text-info"}`}
      >
        Draft
      </span>
      <span className="flex items-center gap-1 text-xs">
        <span
          aria-hidden
          className={`size-2 rounded-full ${forced ? "bg-current" : "bg-positive"}`}
        />
        <span className={forced ? "" : "text-foreground/60"}>Finance</span>
      </span>
    </>
  );
}

function Row({
  option,
  chosen,
  className,
}: {
  option: Option;
  chosen: boolean;
  className: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${chosen ? `${className} ${option.rowInk}` : `${REST} text-foreground`}`}
    >
      <RowContent option={option} chosen={chosen} />
    </div>
  );
}

function Box({ checked, option }: { checked: boolean; option: Option }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] ${checked ? option.checkbox : "border border-foreground/50"}`}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

/** The hover classes as they look with the pointer on: the class's `hover:` value, applied. */
const pointerOn = (classes: string) =>
  classes
    .split(" ")
    .map((c) => (c.startsWith("hover:") ? c.slice("hover:".length) : c))
    .filter((c, i, all) => all.indexOf(c) === i)
    .join(" ");

function Column({ option }: { option: Option }) {
  return (
    <section
      aria-label={option.name}
      className="min-w-0 rounded-lg border border-foreground/10 p-4"
    >
      <h2 className="m-0 font-semibold text-base text-foreground">{option.name}</h2>
      <p className="m-0 mt-1 text-foreground/60 text-sm">{option.summary}</p>

      <Heading>List, with the open record</Heading>
      <div className="grid gap-0.5">
        <Row option={option} chosen={false} className="" />
        <Row option={option} chosen className={option.currentRow} />
        <Row option={option} chosen={false} className="" />
      </div>
      <p className="m-0 mt-1.5 text-foreground/60 text-xs">Pointer over the chosen row:</p>
      <Row option={option} chosen className={pointerOn(option.currentRow)} />

      <Heading>Table, two rows checked</Heading>
      <div className="grid gap-0.5">
        {[true, true, false].map((checked, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed demo of three rows
            key={i}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${checked ? `${option.checkedRow} ${option.rowInk}` : `${REST} text-foreground`}`}
          >
            <Box checked={checked} option={option} />
            <RowContent option={option} chosen={checked} />
          </div>
        ))}
      </div>

      <Heading>Sidebar</Heading>
      <div className="grid gap-0.5 text-sm">
        {["Inbox", "Projects", "Settings"].map((place) => (
          <div
            key={place}
            className={`rounded-md px-3 py-1.5 transition-colors ${place === "Projects" ? option.sidebarCurrent : `${REST} text-foreground`}`}
          >
            {place}
          </div>
        ))}
      </div>

      <Heading>Tabs</Heading>
      <div className="inline-flex gap-1 rounded-md bg-foreground/10 p-1 text-sm">
        {["Overview", "Activity", "Files"].map((tab) => (
          <span
            key={tab}
            className={`rounded px-3 py-1 transition-colors ${tab === "Activity" ? option.tab : `${REST} text-foreground`}`}
          >
            {tab}
          </span>
        ))}
      </div>

      <Heading>Segmented</Heading>
      <div className="inline-flex gap-1 rounded-full border border-foreground/50 p-1 text-sm">
        {["Day", "Week", "Month"].map((pill) => (
          <span
            key={pill}
            className={`rounded-full px-3 py-1 transition-colors ${pill === "Week" ? option.pill : `${REST} text-foreground`}`}
          >
            {pill}
          </span>
        ))}
      </div>

      <Heading>Checkboxes</Heading>
      <div className="flex gap-4 text-foreground text-sm">
        <span className="flex items-center gap-2">
          <Box checked option={option} /> Email me
        </span>
        <span className="flex items-center gap-2">
          <Box checked={false} option={option} /> Text me
        </span>
      </div>

      <p className="m-0 mt-4 rounded-md bg-foreground/10 p-2.5 text-foreground text-xs">
        {option.verdict}
      </p>
    </section>
  );
}

function Comparison() {
  return (
    <div className="min-h-screen bg-background p-5 text-foreground">
      <p className="m-0 mb-4 max-w-3xl text-foreground/60 text-sm">
        The same screen four ways. Point at a chosen row, the current sidebar place, the active tab
        or the chosen pill to see what the pointer does; each column also shows its chosen row with
        the pointer on. Rows keep the colours apps give their content, except in A′.
      </p>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
      >
        {OPTIONS.map((option) => (
          <Column key={option.name} option={option} />
        ))}
      </div>
    </div>
  );
}

export const Light: Story = {
  globals: { theme: "light" },
  render: () => <Comparison />,
};

export const Dark: Story = {
  globals: { theme: "dark" },
  render: () => <Comparison />,
};
