import { fn } from "storybook/test";

/**
 * A save the play function settles by hand, for the inline edits' async `onSave`: `save` hands
 * back a promise, `calls` records what it was given, and `settle` resolves or rejects the one
 * outstanding — so a test can look at the pending state for as long as it likes.
 */
export function deferredSave<T>() {
  const calls = fn();
  let outstanding: { resolve: () => void; reject: (reason: unknown) => void } | null = null;
  return {
    calls,
    save(next: T) {
      calls(next);
      return new Promise<void>((resolve, reject) => {
        outstanding = { resolve, reject };
      });
    },
    settle(outcome: "resolve" | Error) {
      const current = outstanding;
      outstanding = null;
      if (!current) throw new Error("no save is outstanding");
      if (outcome === "resolve") current.resolve();
      else current.reject(outcome);
    },
  };
}
