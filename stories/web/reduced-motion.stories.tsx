import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { CardLayout } from "@/components/card-layout";
import { HeaderContentFooter, type ScrollHandle } from "@/components/header-content-footer";
import { LoadState } from "@/components/load-state";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/**
 * What the components do when the reader's system asks for reduced motion (#441).
 *
 * These run twice. The `storybook` test project has no preference, and is the control: the
 * dialog zooms, the skeleton pulses. The `reduced-motion` project, which runs only this tag, has
 * Playwright emulate `prefers-reduced-motion: reduce`, and the same play functions check the
 * movement is gone while the fade, the spinner and the dialog's unmount are not.
 */
const meta = {
  title: "Tokens/Reduced motion",
  tags: ["reduced-motion"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The element's open animation, held at its first frame so its start can be read. */
function firstFrame(element: HTMLElement) {
  const enter = element
    .getAnimations()
    .find((animation) => (animation as CSSAnimation).animationName === "enter");
  if (enter === undefined) {
    throw new Error("no `enter` animation on the element");
  }
  enter.pause();
  enter.currentTime = 0;
  const style = getComputedStyle(element);
  const frame = { identity: new DOMMatrix(style.transform).isIdentity, opacity: style.opacity };
  enter.play();
  return frame;
}

/**
 * The dialog fades in either way, and zooms only when motion is allowed. Closed, it still leaves
 * the page: radix waits for the exit animation to end, which is why the central rule keeps the
 * fade rather than setting `animation: none`.
 */
export const DialogFadesWithoutMoving: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" content="Open" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename project</DialogTitle>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog", { name: "Rename project" });

    await expect(firstFrame(dialog)).toEqual({ identity: reduced(), opacity: "0" });

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/** A skeleton and a live dot hold still; the spinner keeps turning, because it is the message. */
export const LoopsStopButTheSpinnerTurns: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Skeleton data-testid="skeleton" className="h-4 w-48" />
      <Badge variant="positive" label="Live" pulse />
      <Spinner label="Saving" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pulse = reduced() ? "none" : "pulse";

    await expect(getComputedStyle(canvas.getByTestId("skeleton")).animationName).toBe(pulse);
    await expect(getComputedStyle(canvas.getByRole("img", { name: "Live" })).animationName).toBe(
      pulse,
    );
    const spinner = canvas.getByRole("status", { name: "Saving" });
    await expect(spinner).toBeVisible();
    await expect(getComputedStyle(spinner).animationName).toBe("spin");
  },
};

/**
 * The shells' loading bars are `Skeleton` (#449), so they pulse and hold still by the same rule
 * rather than each carrying its own copy of it.
 */
export const ShellLoadingBarsFollowSkeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <PageHeader title="Projects" description="Everything this workspace builds." loading />
      <CardLayout title="Members" level={2} loading contentSlot={<span>Ada</span>} />
      <StatTile label="Embeddings" value="" loading />
      <LoadState
        query={{ isPending: true, isError: false, error: null, refetch: () => undefined }}
        what="these projects"
        count={0}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pulse = reduced() ? "none" : "pulse";
    const bars = canvasElement.querySelectorAll('[data-slot="skeleton"]');
    // Two in the header, three in the card, one in the tile, two in each of three rows.
    await expect(bars).toHaveLength(12);
    for (const bar of bars) {
      await expect(getComputedStyle(bar).animationName).toBe(pulse);
    }
  },
};

function Log() {
  const scrollRef = useRef<ScrollHandle>(null);
  return (
    <div className="flex h-60 flex-col gap-2">
      <Button
        variant="outline"
        content="Jump to the end"
        onClick={() => scrollRef.current?.scrollToEnd()}
      />
      <HeaderContentFooter
        scroll
        className="min-h-0 flex-1 border border-foreground/10"
        scrollRef={scrollRef}
        contentSlot={
          <ul>
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
              <li key={n} className="px-3 py-2 text-sm">
                Line {n}
              </li>
            ))}
          </ul>
        }
      />
    </div>
  );
}

/**
 * `scrollToEnd()` glides when motion is allowed and jumps when it is not, so under reduced motion
 * the body is at its end as soon as the call returns. Only that half is asserted: a glide's
 * progress is the browser's to pace.
 */
export const ScrollJumpsInsteadOfGliding: Story = {
  render: () => <Log />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = canvasElement.querySelector<HTMLElement>(
      "[data-slot=header-content-footer-content]",
    );
    if (body === null) {
      throw new Error("no scrolling body");
    }
    await userEvent.click(canvas.getByRole("button", { name: "Jump to the end" }));
    if (reduced()) {
      await expect(body.scrollTop + body.clientHeight).toBeGreaterThanOrEqual(
        body.scrollHeight - 1,
      );
    }
    await waitFor(() =>
      expect(body.scrollTop + body.clientHeight).toBeGreaterThanOrEqual(body.scrollHeight - 1),
    );
  },
};
