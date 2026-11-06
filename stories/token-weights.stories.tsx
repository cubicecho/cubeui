import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import { expect, within } from "storybook/test";
import {
  fills,
  meanings,
  nestedCardChoice,
  palettes,
  rules,
  seriesSources,
  type TokenWeightsPalette,
} from "../dist/prototype/token-weights";

/**
 * PROTOTYPE: the proposed named-weight tokens, in every palette, from the values
 * `scripts/build-token-weights.mjs` emits. Each panel sets its palette's tokens as CSS variables on
 * itself and draws with `var()`, so it shows the colours React Native would draw whatever the
 * toolbar's theme. The checks beside each are the ones `token-weights.test.mjs` fails on.
 */
const meta = {
  title: "Tokens/Weights (prototype)",
  parameters: {
    layout: "fullscreen",
    // The ladder draws every weight as text on purpose, `-lightest` included, which is never text;
    // and the open dark-mode choice is a failing pair shown so it can be judged. The contrast that
    // matters is measured from the tokens and listed in each panel.
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const LEVELS = [
  ["lightest", "-lightest"],
  ["light", "-light"],
  ["medium", "-medium"],
  ["base", ""],
  ["heavy", "-heavy"],
] as const;

const v = (token: string) => `var(--${token})`;

/** A palette's tokens as CSS variables, set on the panel that draws with them. */
const variables = (palette: TokenWeightsPalette) =>
  Object.fromEntries(
    Object.entries(palette.tokens).map(([name, value]) => [`--${name}`, value]),
  ) as CSSProperties;

function Caption({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-xs" style={{ color: v("default-medium") }}>
      {children}
    </div>
  );
}

function Ladder({ palette }: { palette: TokenWeightsPalette }) {
  return (
    <section
      aria-label="Weights"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a table that scrolls sideways has to be reachable by keyboard.
      tabIndex={0}
      className="overflow-x-auto"
    >
      <table className="w-full border-separate text-sm" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="text-left font-normal text-xs uppercase tracking-wide">Colour</th>
            {LEVELS.map(([label]) => (
              <th key={label} className="text-left font-normal text-xs uppercase tracking-wide">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meanings.map((name) => (
            <tr key={name}>
              <th scope="row" className="pr-2 text-left font-medium">
                {name}
              </th>
              {LEVELS.map(([label, suffix]) => {
                const token = `${name}${suffix}`;
                return (
                  <td
                    key={label}
                    data-token={token}
                    className="rounded-md p-1.5"
                    style={{ border: `1px solid ${v("default-lightest")}`, minWidth: 92 }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-8 w-6 shrink-0 rounded"
                        style={{ background: v(token) }}
                      />
                      <span className="font-semibold text-base" style={{ color: v(token) }}>
                        Aa
                      </span>
                    </div>
                    <code
                      className="block truncate text-[10.5px]"
                      style={{ color: v("default-medium") }}
                    >
                      {palette.tokens[token]}
                    </code>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Fills() {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
    >
      {fills.map((fill) => (
        <div key={fill} className="flex gap-1.5">
          {[fill, `${fill}-heavy`].map((bg) => (
            <span
              key={bg}
              className="flex-1 rounded-md px-2 py-1.5 text-center font-medium text-sm"
              style={{ background: v(bg), color: v(`on-${fill}`) }}
            >
              {bg}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Row({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <div
      className="flex justify-between gap-2 rounded px-2 py-1.5 text-sm"
      style={{ background: v(fill) }}
    >
      {children}
    </div>
  );
}

function Alert({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <div
      data-testid={`alert-${tone}`}
      className="rounded-md px-2.5 py-1.5 text-sm"
      style={{
        background: v(`${tone}-lightest`),
        border: `1px solid ${v(`${tone}-light`)}`,
        color: v(tone),
      }}
    >
      {children}
    </div>
  );
}

/** Each surface and the common jobs on it, nested as the context would nest them. */
function InUse() {
  const card = (level: string) => ({
    background: v(level),
    border: `1px solid ${v("default-lightest")}`,
  });
  return (
    <div
      className="grid gap-2.5 rounded-lg p-3.5"
      style={{ background: v("surface-1"), border: `1px solid ${v("default-lightest")}` }}
    >
      <Caption>surface-1 · page</Caption>
      <p className="m-0">
        Body text in <code>fg-default</code>.{" "}
        <span data-testid="secondary" style={{ color: v("default-medium") }}>
          Secondary text in <code>fg-default-medium</code>.
        </span>
      </p>
      <div
        className="rounded-md px-2.5 py-1.5 text-sm"
        style={{ border: `1px solid ${v("default-medium")}` }}
      >
        <span style={{ color: v("default-medium") }}>Input edge: border-default-medium</span>
      </div>
      <div className="grid gap-2 rounded-lg p-3" style={card("surface-2")}>
        <Caption>surface-2 · card</Caption>
        <Row fill="hover">
          Row under the pointer <code className="text-xs">bg-hover</code>
        </Row>
        <Row fill="active-light">
          Chosen row <code className="text-xs">bg-active-light</code>
        </Row>
        <div className="grid gap-2 rounded-lg p-3" style={card("surface-3")}>
          <Caption>surface-3 · card in a card</Caption>
          <Alert tone="negative">Negative text on its tint, edged with negative-light</Alert>
          <Alert tone="info">Info text on its tint</Alert>
          <p className="m-0" style={{ color: v("active") }}>
            A link in fg-active
          </p>
        </div>
      </div>
      <div
        className="grid max-w-64 gap-0.5 rounded-lg p-2"
        style={{ ...card("surface-floating"), boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)" }}
      >
        <Caption>surface-floating · menu</Caption>
        <Row fill="hover">Highlighted item</Row>
        <div className="px-2 py-1.5 text-sm" style={{ color: v("negative") }}>
          Delete
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="tooltip"
          className="rounded px-2 py-1 text-xs"
          style={{ background: v("default"), color: v("on-default") }}
        >
          Tooltip: bg-default, fg-on-default
        </span>
        <span
          className="rounded-full px-1.5 font-semibold text-xs tabular-nums"
          style={{ background: v("default"), color: v("on-default") }}
        >
          12
        </span>
      </div>
    </div>
  );
}

const SERIES = seriesSources.map((source, i) => ({ token: `series-${i + 1}`, source }));

/** Three groups of six bars, and six lines of eight points: enough marks to judge the set by. */
const BARS = [
  { label: "Q1", heights: [62, 80, 45, 70, 88, 38] },
  { label: "Q2", heights: [74, 52, 83, 58, 40, 76] },
  { label: "Q3", heights: [48, 70, 60, 86, 66, 54] },
];
const LINES = SERIES.map((_, i) =>
  Array.from({ length: 8 }, (_, x) => 20 + ((i * 13 + x * (17 + i * 5)) % 60)),
);

function Series({ palette }: { palette: TokenWeightsPalette }) {
  const chartCard = {
    background: v("surface-2"),
    border: `1px solid ${v("default-lightest")}`,
  };
  return (
    <div className="grid gap-3">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
      >
        {SERIES.map(({ token, source }) => (
          <div
            key={token}
            className="flex items-center gap-2 rounded-md p-1.5"
            style={{ border: `1px solid ${v("default-lightest")}` }}
          >
            <span
              aria-hidden
              className="h-7 w-7 shrink-0 rounded"
              style={{ background: v(token) }}
            />
            <div className="min-w-0">
              <div className="font-medium text-sm">{token}</div>
              <code className="block truncate text-[10.5px]" style={{ color: v("default-medium") }}>
                {palette.tokens[token]} · {source}
              </code>
            </div>
          </div>
        ))}
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}
      >
        <div className="rounded-lg p-3" style={chartCard}>
          <Caption>Bars, on a card</Caption>
          <svg
            viewBox="0 0 240 100"
            className="mt-2 block w-full"
            role="img"
            aria-label="A sample bar chart in the six series colours"
          >
            {BARS.flatMap(({ label, heights }, g) =>
              heights.map((height, i) => (
                <rect
                  key={`${label}-${SERIES[i]?.token}`}
                  x={8 + g * 78 + i * 11}
                  y={96 - height}
                  width={9}
                  height={height}
                  rx={1.5}
                  style={{ fill: v(SERIES[i]?.token ?? "default") }}
                />
              )),
            )}
          </svg>
        </div>
        <div className="rounded-lg p-3" style={chartCard}>
          <Caption>Lines, on a card</Caption>
          <svg
            viewBox="0 0 240 100"
            className="mt-2 block w-full"
            role="img"
            aria-label="A sample line chart in the six series colours"
          >
            {LINES.map((points, i) => (
              <polyline
                key={SERIES[i]?.token}
                points={points.map((y, x) => `${8 + x * 32},${y + 8}`).join(" ")}
                style={{
                  fill: "none",
                  stroke: v(SERIES[i]?.token ?? "default"),
                  strokeWidth: 2,
                  strokeLinejoin: "round",
                }}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function Checks({ palette }: { palette: TokenWeightsPalette }) {
  const failing = palette.checks.filter((c) => c.ratio < c.floor);
  return (
    <div className="text-sm">
      <p className="m-0 mb-1.5">
        <b>
          {palette.checks.length - failing.length} of {palette.checks.length}
        </b>{" "}
        checks pass{failing.length > 0 ? "; these do not:" : "."}
      </p>
      {failing.length > 0 ? (
        <ul className="m-0 grid gap-1 pl-5">
          {failing.map((c) => (
            <li key={`${c.label} ${c.on}`}>
              {c.label} <span style={{ color: v("default-medium") }}>on {c.on}</span>{" "}
              <b style={{ color: v("negative") }}>{c.ratio}:1</b>{" "}
              <span style={{ color: v("default-medium") }}>needs {c.floor}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mt-4 mb-2 font-semibold text-xs uppercase tracking-wide"
      style={{ opacity: 0.7 }}
    >
      {children}
    </h3>
  );
}

function Panel({ palette }: { palette: TokenWeightsPalette }) {
  return (
    <section
      aria-label={palette.title}
      data-testid="palette"
      // The whole frame, so a dark palette is seen as a dark app is, not as a panel on a page.
      className="min-h-screen p-5"
      style={{ ...variables(palette), background: v("surface-1"), color: v("default") }}
    >
      <h2 className="m-0 mb-1 font-semibold text-lg">{palette.title}</h2>
      <p className="m-0 font-mono text-xs" style={{ color: v("default-medium") }}>
        lightest {rules.weights.lightest} · light {rules.weights.light} · medium{" "}
        {rules.weights.medium} · heavy {rules.heavy.apart}:1 from rest ({rules.heavy.greyApart}:1
        for a grey), chroma ×{rules.heavy.chroma} · surface-3 step {rules.surfaceStep.light} light,{" "}
        {rules.surfaceStep.dark} dark
      </p>
      <div
        className="mt-2 grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))" }}
      >
        <div className="min-w-0">
          <Heading>Weights</Heading>
          <Ladder palette={palette} />
          <Heading>Fills, at rest and under the pointer</Heading>
          <Fills />
          <Heading>Chart colours</Heading>
          <Series palette={palette} />
        </div>
        <div className="min-w-0">
          <Heading>In use</Heading>
          <InUse />
          <Heading>Contrast</Heading>
          <Checks palette={palette} />
        </div>
      </div>
    </section>
  );
}

const byId = (id: string) => {
  const palette = palettes.find((p) => p.id === id);
  if (palette === undefined) {
    throw new Error(`no ${id} palette in dist/prototype/token-weights.ts`);
  }
  return palette;
};

/** A token's value in the `rgb()` / `rgba()` spelling `getComputedStyle` reports. */
const computed = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
};

/** The panel draws its own palette, not the stylesheet's: a weight and a tint resolve to the data. */
const drawsItsPalette =
  (id: string): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const palette = byId(id);
    const canvas = within(canvasElement);
    const secondary = palette.tokens["default-medium"] ?? "";
    const negative = palette.tokens.negative ?? "";
    const onDefault = palette.tokens["on-default"] ?? "";
    await expect(getComputedStyle(canvas.getByTestId("secondary")).color).toBe(computed(secondary));
    await expect(getComputedStyle(canvas.getByTestId("alert-negative")).color).toBe(
      computed(negative),
    );
    await expect(getComputedStyle(canvas.getByTestId("tooltip")).color).toBe(computed(onDefault));
  };

// Each palette also sets the toolbar's theme to its own mode, so the frame around it matches.
export const DefaultLight: Story = {
  globals: { theme: "light" },
  render: () => <Panel palette={byId("default-light")} />,
  play: drawsItsPalette("default-light"),
};

export const DefaultDark: Story = {
  globals: { theme: "dark" },
  render: () => <Panel palette={byId("default-dark")} />,
  play: drawsItsPalette("default-dark"),
};

export const MonokaiDark: Story = {
  globals: { theme: "dark" },
  render: () => <Panel palette={byId("monokai-dark")} />,
  play: drawsItsPalette("monokai-dark"),
};

/**
 * The open choice. In dark palettes a card is already as light as status text on its tint allows:
 * a lighter nested card drops that text under 4.5:1, and a darker one passes but, in Monokai, goes
 * darker than the page.
 */
export const NestedCardChoice: Story = {
  render: () => (
    <div className="bg-background p-5 text-foreground">
      <section
        aria-label="Nested card choice"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a table that scrolls sideways has to be reachable by keyboard.
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table className="w-full min-w-160 border-collapse text-sm tabular-nums">
          <thead>
            <tr className="text-left text-foreground/60 text-xs">
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">Palette</th>
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">surface-3</th>
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">
                Card, nested card
              </th>
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">From card</th>
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">
                Worst status text on tint
              </th>
              <th className="border-foreground/10 border-b px-2.5 py-2 font-semibold">
                Darker than page
              </th>
            </tr>
          </thead>
          <tbody>
            {nestedCardChoice.map((row) => (
              <tr key={`${row.palette} ${row.step}`}>
                <td className="border-foreground/10 border-b px-2.5 py-2">{row.palette}</td>
                <td className="border-foreground/10 border-b px-2.5 py-2">
                  {row.step > 0 ? "Lighter" : "Darker"} ({row.step > 0 ? "+" : ""}
                  {row.step})
                </td>
                <td className="border-foreground/10 border-b px-2.5 py-2">
                  <span className="inline-flex items-center gap-1">
                    {[row.card, row.nested].map((colour) => (
                      <span
                        key={colour}
                        aria-hidden
                        className="inline-block size-5 rounded border border-foreground/10"
                        style={{ background: colour }}
                      />
                    ))}
                    <code className="text-xs">{row.nested}</code>
                  </span>
                </td>
                <td className="border-foreground/10 border-b px-2.5 py-2">{row.apart}:1</td>
                <td
                  className={`border-foreground/10 border-b px-2.5 py-2 ${row.worst < row.floor ? "font-semibold text-negative" : ""}`}
                >
                  {row.worst}:1
                </td>
                <td className="border-foreground/10 border-b px-2.5 py-2">
                  {row.belowPage ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  ),
};
