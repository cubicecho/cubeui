import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text, View } from "react-native";
import { expect, waitFor, within } from "storybook/test";
import { HeaderContentFooter as Compiled } from "../compiled/header-content-footer";
import {
  HeaderContentFooter as Native,
  type ScrollPosition,
} from "../registry/layout/header-content-footer";
import { SideBySide } from "./side-by-side";

/**
 * `HeaderContentFooter`'s `onScroll`. The body is a `<div>` on the web and a `ScrollView` on
 * device, and their scroll events share no field, so the chassis reports one shape of its own.
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
          content={
            half === "native" ? (
              // In a view of their own: the slot is a block box on the web, where a `Text` is inline.
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
    </div>
  );
}

/**
 * A list that follows its newest row has to know whether the reader is still at the end (#240).
 * Each half is scrolled part of the way and then all of it, and says which it was from the three
 * numbers alone.
 */
export const OnScroll: Story = {
  args: { content: null },
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
      if (!body) throw new Error(`the ${half} body should render`);
      const status = within(frame).getByRole("status");
      await expect(status).toHaveTextContent("Not scrolled");

      body.scrollTop = 40;
      await waitFor(() => expect(status).toHaveTextContent("Scrolled up"));

      body.scrollTop = body.scrollHeight;
      await waitFor(() => expect(status).toHaveTextContent("At the end"));
    }
  },
};
