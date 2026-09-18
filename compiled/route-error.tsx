/**
 * Compiled from `registry/layout/route-error.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

import { Button } from "./button";
import { CircleAlert } from "./icons";

type RouteErrorProps = {
  error: unknown;
  reset: () => void;
  /**
   * Turns a thrown value into a line worth reading. The default recognises the
   * two failures every networked app has; extend it with the ones yours has
   * rather than letting a stack-trace message reach the screen.
   */
  describe?: (error: unknown) => string;
};

function friendlyMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("network")
    ) {
      return "Could not reach the server. Check your connection and try again.";
    }
    if (error.message.includes("Not authenticated")) {
      return "Your session has expired. Please sign in again.";
    }
    return error.message;
  }
  return "An unexpected error occurred.";
}

export function RouteError({ error, reset, describe = friendlyMessage }: RouteErrorProps) {
  return (
    <div className="cube-rn-view flex-1 items-center justify-center gap-4 px-8 py-20">
      <div className="cube-rn-view rounded-full bg-destructive/10 p-4">
        <CircleAlert className="h-7 w-7 text-destructive" />
      </div>
      <div className="cube-rn-view max-w-sm items-center">
        <span className="cube-rn-text font-semibold text-foreground">Failed to load</span>
        <span className="cube-rn-text mt-1 text-center text-sm text-muted-foreground">
          {describe(error)}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
