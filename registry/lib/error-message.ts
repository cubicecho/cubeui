/**
 * The words an error is shown in: `messageOf` for a form field's error, and `describeError` for a
 * failure — a request that failed, a screen that threw. Two functions because the two read
 * differently: a validator's message is written for the reader and shown as it is, and a thrown
 * one is the transport's wording, which is turned into a line the reader can act on.
 */

/**
 * The text a validator's error shows, or nothing when there is no error.
 *
 * A validator may yield a string, a `{ message }`, or something else entirely: a standard-schema
 * issue, a thrown value. This narrows and then falls back to `String`, because showing the wrong
 * text beats showing none.
 */
export function messageOf(error: unknown): string | undefined {
  if (error == null) {
    return undefined;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

/** What a failure says when the error has nothing to say. */
const UNEXPECTED = "An unexpected error occurred.";

// Chrome's "Failed to fetch", Firefox's "NetworkError when attempting to fetch resource.", React
// Native's "Network request failed" and Safari's "Load failed": four spellings of one failure.
const NETWORK_FAILURE = /failed to fetch|network|^load failed$/i;

/** The error's own `message` when it has one as text, and `""` when it has none. */
function ownMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string") {
      return message;
    }
  }
  return "";
}

/**
 * A failed request or a thrown value as one line worth reading, never empty. What `LoadError` and
 * `ErrorPage` say under their heading unless they are handed a `describe`, so the same failure
 * reads the same on both.
 *
 * It knows the two failures every networked app has — the server could not be reached, and the
 * session has expired — and otherwise shows the error's own message, then a fallback. An app with
 * failures of its own writes a `describe` that answers those and hands the rest on:
 *
 * ```ts
 * const describe = (error: unknown) =>
 *   isQuotaError(error) ? "You are out of space." : describeError(error);
 * ```
 */
export function describeError(error: unknown): string {
  const message = ownMessage(error);
  if (NETWORK_FAILURE.test(message)) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (message.includes("Not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }
  return message || UNEXPECTED;
}
