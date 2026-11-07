import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "react-native";
import { expect } from "storybook/test";
import { CardLayout as CompiledCardLayout } from "../compiled/card-layout";
import { Folder as CompiledFolder } from "../compiled/icons";
import { LoadState as CompiledLoadState } from "../compiled/load-state";
import { PageHeader as CompiledPageHeader } from "../compiled/page-header";
import { StatTile as CompiledStatTile } from "../compiled/stat-tile";
import { CardLayout as NativeCardLayout } from "../registry/layout/card-layout";
import { LoadState as NativeLoadState } from "../registry/layout/load-state";
import { PageHeader as NativePageHeader } from "../registry/layout/page-header";
import { StatTile as NativeStatTile } from "../registry/layout/stat-tile";
import { Folder as NativeFolder } from "../registry/ui/icons";
import { SideBySide } from "./side-by-side";

/**
 * The loading bars of the four components that have them, on both halves. Each bar is a
 * `Skeleton` (#449), so the pulse, its reduced-motion stop and its colour are the primitive's:
 * the bars used to be drawn by hand, and on device they never pulsed.
 */
const meta = { title: "RN Parity/Loading bars" } satisfies Meta;
export default meta;
type Story = StoryObj;

const pending = { isPending: true, isError: false, error: null, refetch: () => undefined };

/** Each component's wrapper, by the name the story gives it on both halves. */
const PARTS = ["card-layout", "page-header", "stat-tile", "load-state", "load-state-compact"];

export const InEachComponent: Story = {
  render: () => (
    <SideBySide
      native={
        <div className="flex flex-col gap-6">
          <div data-part="page-header">
            <NativePageHeader
              title="Projects"
              description="Everything this workspace builds."
              iconSlot={<NativeFolder />}
              loading
            />
          </div>
          <div data-part="card-layout">
            <NativeCardLayout title="Members" level={2} loading contentSlot={<Text>Ada</Text>} />
          </div>
          <div data-part="stat-tile" className="w-48">
            <NativeStatTile label="Embeddings" value="" loading />
          </div>
          <div data-part="load-state">
            <NativeLoadState query={pending} what="these projects" count={0} />
          </div>
          <div data-part="load-state-compact" className="w-48">
            <NativeLoadState query={pending} what="these projects" count={0} compact />
          </div>
        </div>
      }
      compiled={
        <div className="flex flex-col gap-6">
          <div data-part="page-header">
            <CompiledPageHeader
              title="Projects"
              description="Everything this workspace builds."
              iconSlot={<CompiledFolder />}
              loading
            />
          </div>
          <div data-part="card-layout">
            <CompiledCardLayout title="Members" level={2} loading contentSlot={<span>Ada</span>} />
          </div>
          <div data-part="stat-tile" className="w-48">
            <CompiledStatTile label="Embeddings" value="" loading />
          </div>
          <div data-part="load-state">
            <CompiledLoadState query={pending} what="these projects" count={0} />
          </div>
          <div data-part="load-state-compact" className="w-48">
            <CompiledLoadState query={pending} what="these projects" count={0} compact />
          </div>
        </div>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    for (const part of PARTS) {
      const [native, compiled] = Array.from(
        canvasElement.querySelectorAll(`[data-part="${part}"]`),
      );
      if (native === undefined || compiled === undefined) {
        throw new Error(`both halves should draw ${part}`);
      }
      // The React Native source's `@/components/ui/skeleton` resolves to `skeleton.web.tsx` here,
      // as it would in an Expo web app, so both halves draw shadcn's `data-slot`. The native
      // loop is the Skeleton story's to check, as far as a test runner lets it be watched.
      const bars = (half: Element) => half.querySelectorAll('[data-slot="skeleton"]').length;
      await expect(bars(native)).toBeGreaterThan(0);
      await expect(bars(compiled)).toBe(bars(native));
    }
  },
};
