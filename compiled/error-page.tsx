/**
 * Compiled from `registry/layout/error-page.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * What shows when the tree below a route has thrown.
 *
 * Deliberately dependency-free beyond `ui/` and `lib/`: it must not rely on the
 * data client, the router, or theme state, since any of those could be what
 * failed.
 *
 * It is the whole screen and says everything an error boundary needs said, so
 * the boundary renders it and nothing around it: the root is `role="alert"`,
 * the raw message for a bug report is `details`, and a second way out (a
 * reload, a restart) is `actionSlot`.
 *
 * It is `@cubeui/empty`'s block with a red bubble, so an error page and an
 * empty or not-found screen are one shape at one set of sizes, its title
 * included: 16px at rank 1, like every empty block's.
 *
 * ```tsx
 * <ErrorPage
 *   error={error}
 *   reset={retry}
 *   describe={describeError}
 *   details
 *   actionSlot={<Button variant="outline" size="sm" onPress={reload} content="Reload" />}
 * />
 * ```
 */
import type { ReactNode } from "react";
import { describeError } from "@/lib/error-message";
import type { SlotNode } from "@/lib/utils";
import { Button } from "./button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { CircleAlert } from "./icons";

type ErrorPageProps = {
  /** What was thrown, as the boundary caught it: an `Error`, a string, anything at all. */
  error: unknown;
  /** What Try again calls: the boundary's reset, which draws the tree below it again. */
  reset: () => void;
  /**
   * Turns a thrown value into a line worth reading. Without it the line is
   * `describeError`'s (`@cubeui/error-message`), the same as `LoadError`'s: it
   * knows the two failures every networked app has. Extend it with the ones
   * yours has, handing the rest to `describeError`, rather than letting a
   * stack-trace message reach the screen. An empty answer hands the error on.
   */
  describe?: (error: unknown) => string;
  /**
   * The heading, and the screen's `h1`. The default fits a failed fetch and a
   * render crash alike, which is why it is not "Failed to load" — a boundary
   * catches both. 16px, as every empty block's title is at any rank.
   */
  title?: string;
  /**
   * The raw message, in a muted monospace block the user can select and paste
   * into a bug report. `true` shows `error.message`; a node replaces the block's
   * contents. Left out when it would say exactly what `describe` already said.
   * Selectable on device too (`selectable`), where text is not by default. The
   * block is bordered rather than filled: muted text on `bg-foreground/10` fails contrast.
   */
  details?: ReactNode | boolean;
  /** More buttons beside "Try again" — a reload is the usual one. */
  actionSlot?: SlotNode;
  /** @deprecated Use `actionSlot`; this name goes in the next release. `actionSlot` wins. */
  actionsSlot?: SlotNode;
};

/** What `details={true}` shows: the message as thrown, for whoever files the bug. */
function rawMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message || undefined;
  }
  if (typeof error === "string") {
    return error || undefined;
  }
  return undefined;
}

/**
 * The whole-screen message shown when the tree below a route has thrown. `actionsSlot` is the old
 * name of `actionSlot`, kept for one release; the new name wins when both are passed.
 */
export function ErrorPage({
  error,
  reset,
  describe,
  title = "Something went wrong",
  details,
  actionSlot,
  actionsSlot,
}: ErrorPageProps) {
  const actions = actionSlot ?? actionsSlot;
  const summary = describe?.(error) || describeError(error);
  const detail = details === true ? rawMessage(error) : details || undefined;
  // A plain `Error` is described by its own message, so the default block would print it twice.
  const shown = detail === summary ? undefined : detail;

  // `flex-1` and a side inset because it is the whole screen, with no page around it to give it
  // either; every other size is the empty block's.
  return (
    <Empty role="alert" data-slot="error-page" className="flex-1 px-4">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-negative/10">
          <CircleAlert className="text-negative" />
        </EmptyMedia>
        <EmptyTitle data-slot="error-page-title" level={1}>
          {title}
        </EmptyTitle>
        <EmptyDescription>{summary}</EmptyDescription>
      </EmptyHeader>
      {/* The details are as wide as the description's cap, so the text and the block under it are
          one column rather than two centred ones. */}
      <EmptyContent>
        {shown ? (
          <div
            data-slot="error-page-details"
            className="cube-rn-view w-full rounded-md border border-foreground/10 px-3 py-2"
          >
            {typeof shown === "string" ? (
              <span className="cube-rn-text font-mono text-xs text-foreground/60">{shown}</span>
            ) : (
              shown
            )}
          </div>
        ) : null}
        <div className="cube-rn-view flex-row flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} content="Try again" />
          {actions}
        </div>
      </EmptyContent>
    </Empty>
  );
}

/** @deprecated Use `ErrorPage`; this name goes in the next release. */
export const RouteError = ErrorPage;
