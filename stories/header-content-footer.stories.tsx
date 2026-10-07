import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { HeaderContentFooter as Compiled } from "../compiled/header-content-footer";
import {
  HeaderContentFooter as Native,
  type ScrollHandle,
  type ScrollPosition,
} from "../registry/layout/header-content-footer";
import { SideBySide } from "./side-by-side";

/**
 * `HeaderContentFooter`'s `onScroll` and `scrollRef`. The body is a `<div>` on the web and a
 * `ScrollView` on device, and their scroll events and methods share no name, so the chassis
 * reports one shape of its own and takes one call to move it.
 */
const meta = {
  title: "RN Parity/HeaderContentFooter",
  component: Native,
} satisfies Meta<typeof Native>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = Array.from({ length: 30 }, (_, index) => `Message ${index + 1}`);

/** A scrolling body 200px tall, and under it what `onScroll` last reported. */
function Following({ half }: { half: "native" | "compiled" }) {
  const [position, setPosition] = useState<ScrollPosition>();
  const scrollRef = useRef<ScrollHandle>(null);
  const Chassis = half === "native" ? Native : Compiled;
  const atEnd =
    position !== undefined &&
    position.offset + position.viewportHeight >= position.contentHeight - 1;

  return (
    <div data-testid={`${half}-frame`} className="flex flex-col gap-2">
      <div style={{ height: 200 }} className="border">
        <Chassis
          scroll
          className="h-full"
          onScroll={setPosition}
          scrollRef={scrollRef}
          contentSlot={
            half === "native" ? (
              // In a view of their own, so the rows are one child of the slot whatever it is.
              <View>
                {rows.map((row) => (
                  <Text key={row} className="px-4 py-2 text-foreground text-sm">
                    {row}
                  </Text>
                ))}
              </View>
            ) : (
              <ul>
                {rows.map((row) => (
                  <li key={row} className="px-4 py-2 text-sm">
                    {row}
                  </li>
                ))}
              </ul>
            )
          }
        />
      </div>
      <output className="text-sm">
        {position === undefined ? "Not scrolled" : atEnd ? "At the end" : "Scrolled up"}
      </output>
      <button
        type="button"
        className="self-start rounded-md border px-3 py-1 text-sm"
        onClick={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        Jump to latest on {half}
      </button>
    </div>
  );
}

/**
 * A list that follows its newest row has to know whether the reader is still at the end (#240).
 * Each half is scrolled part of the way and then all of it, and says which it was from the three
 * numbers alone.
 */
export const OnScroll: Story = {
  args: { contentSlot: null },
  render: () => (
    <SideBySide native={<Following half="native" />} compiled={<Following half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    const bodies = {
      native: "[data-testid=header-content-footer-content]",
      compiled: "[data-slot=header-content-footer-content]",
    } as const;

    for (const half of ["native", "compiled"] as const) {
      const frame = within(canvasElement).getByTestId(`${half}-frame`);
      const body = frame.querySelector<HTMLElement>(bodies[half]);
      if (!body) {
        throw new Error(`the ${half} body should render`);
      }
      const status = within(frame).getByRole("status");
      await expect(status).toHaveTextContent("Not scrolled");

      body.scrollTop = 40;
      await waitFor(() => expect(status).toHaveTextContent("Scrolled up"));

      body.scrollTop = body.scrollHeight;
      await waitFor(() => expect(status).toHaveTextContent("At the end"));

      // And back to the end through the handle, which is the same call on both halves.
      body.scrollTop = 0;
      await waitFor(() => expect(status).toHaveTextContent("Scrolled up"));
      await userEvent.click(
        within(frame).getByRole("button", { name: `Jump to latest on ${half}` }),
      );
      await waitFor(() => expect(status).toHaveTextContent("At the end"));
    }
  },
};

/** A fixed row, then a pane that takes what is left, with `gap-4` on the slot between them. */
function Filling({ half }: { half: "native" | "compiled" }) {
  const Chassis = half === "native" ? Native : Compiled;
  return (
    <div style={{ height: 200 }} className="border">
      <Chassis
        className="h-full"
        contentClassName="gap-4"
        contentSlot={
          half === "native" ? (
            <>
              <View testID="native-row" className="h-10 bg-muted" />
              <View testID="native-pane" className="min-h-0 flex-1 bg-muted" />
            </>
          ) : (
            <>
              <div data-testid="compiled-row" className="h-10 bg-muted" />
              <div data-testid="compiled-pane" className="min-h-0 flex-1 bg-muted" />
            </>
          )
        }
      />
    </div>
  );
}

/**
 * A slot is a flex column on both halves (#241). `gap-4` on the body spaces its two children, and
 * the `flex-1` one takes the rest of the height — with no `flex flex-col` beside the gap and no
 * `h-full` in place of the `flex-1`, which is what the web half used to need.
 */
export const SlotIsAFlexColumn: Story = {
  args: { contentSlot: null },
  render: () => (
    <SideBySide native={<Filling half="native" />} compiled={<Filling half="compiled" />} />
  ),
  play: async ({ canvasElement }) => {
    for (const half of ["native", "compiled"] as const) {
      const scope = within(canvasElement);
      const row = scope.getByTestId(`${half}-row`).getBoundingClientRect();
      const pane = scope.getByTestId(`${half}-pane`).getBoundingClientRect();
      // `half` rides along so a failure names which half broke.
      await expect({
        half,
        gap: Math.round(pane.top - row.bottom),
        filled: pane.height > 100,
      }).toEqual({ half, gap: 16, filled: true });
    }
  },
};
