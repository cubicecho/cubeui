/**
 * Compiled from `registry/ui/inline-number-edit.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A number shown as text, becoming an input when pressed.
 *
 * For a value that is read far more often than it is changed and does not
 * deserve a form — a quantity on a row, an estimate on a card. Commits on blur
 * and on submit; there is no explicit save, because a control the size of a
 * badge has nowhere to put one. Escape puts the old value back.
 *
 * `onSave` may return a promise, and then the edit is not over until it
 * settles — the contract `InlineTextEdit` has, and the same code. While it runs
 * the box keeps the draft and the focus, is read-only and busy, and turns a
 * `Spinner` beside it. If it rejects, the box stays open on the draft with the rejection's
 * message under it as a `FieldError`, so Enter tries again and Escape gives up.
 *
 * Note for a caller whose row is itself pressable: this is a `Pressable` inside
 * that row, so the row's own press fires too. Wrap it in a container that
 * swallows the press — that is the caller's business, not this component's,
 * because only the caller knows which press should win.
 */
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./field";
import { Input } from "./input";
import { Spinner } from "./spinner";

type InlineNumberEditProps = {
  value: number;
  min?: number;
  max?: number;
  /** Renders the value when not editing — e.g. `(n) => \`${n} min\``. */
  format?: (value: number) => string;
  /** Names the press target for a screen reader, since the text is a number, and the input. */
  "aria-label": string;
  /** A save the caller is running, shown on the number. One `onSave` returns is shown for you. */
  saving?: boolean;
  /**
   * Called with the clamped draft, and only when it differs from `value`. Return the save's promise
   * to hold the edit open until it settles.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: a sync save returns void; naming it beside the promise is the contract
  onSave: (value: number) => void | PromiseLike<unknown>;
};

/** Where a save is: running, or refused with what the rejection said (which may be nothing). */
type SaveState = { pending: true } | { pending: false; failed: boolean; message?: string };

const IDLE: SaveState = { pending: false, failed: false };

/** The words a rejection carries: an `Error`'s message, or a string thrown as one. */
function messageOf(reason: unknown): string | undefined {
  if (reason instanceof Error) return reason.message || undefined;
  return typeof reason === "string" && reason !== "" ? reason : undefined;
}

function isPromiseLike(result: unknown): result is PromiseLike<unknown> {
  return (
    typeof result === "object" &&
    result !== null &&
    typeof (result as { then?: unknown }).then === "function"
  );
}

export function InlineNumberEdit({
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  format = String,
  "aria-label": accessibilityLabel,
  saving,
  onSave,
}: InlineNumberEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  // Set once the edit is finished, so the blur that follows a submit does not finish it again.
  const finished = useRef(false);

  const [save, setSave] = useState<SaveState>(IDLE);
  // Which save is the live one; see `InlineTextEdit`.
  const attempt = useRef(0);
  useEffect(
    () => () => {
      attempt.current += 1;
    },
    [],
  );
  const errorId = useId();

  function close() {
    setSave(IDLE);
    setEditing(false);
  }

  function fail(reason: unknown) {
    finished.current = false;
    const message = messageOf(reason);
    setSave(
      message === undefined
        ? { pending: false, failed: true }
        : { pending: false, failed: true, message },
    );
  }

  function commit() {
    if (finished.current) return;
    finished.current = true;
    // An unparseable draft falls back to the floor rather than to `NaN`, and an
    // unchanged value is not saved at all — an inline edit that fires a mutation
    // every time it loses focus is a write amplifier.
    const parsed = Number(draft);
    const clamped = Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : min));
    if (clamped === value) {
      close();
      return;
    }
    const current = ++attempt.current;
    let result: unknown;
    try {
      result = onSave(clamped);
    } catch (reason) {
      fail(reason);
      return;
    }
    if (!isPromiseLike(result)) {
      close();
      return;
    }
    setSave({ pending: true });
    result.then(
      () => {
        if (current === attempt.current) close();
      },
      (reason: unknown) => {
        if (current === attempt.current) fail(reason);
      },
    );
  }

  function cancel() {
    if (finished.current) return;
    finished.current = true;
    attempt.current += 1;
    close();
  }

  if (editing) {
    const failed = !save.pending && save.failed;
    const message = !save.pending ? save.message : undefined;
    // One tree whatever the save is doing, so the spinner and the error arriving do not remount
    // the input.
    return (
      <div aria-busy={save.pending} className="cube-rn-view min-w-0 self-start gap-1">
        <div className="cube-rn-view flex-row items-center gap-1">
          <Input
            type="number"
            min={min}
            max={max}
            value={draft}
            autoFocus
            aria-label={accessibilityLabel}
            aria-invalid={failed || undefined}
            aria-describedby={message !== undefined ? errorId : undefined}
            readOnly={save.pending}
            className={`h-6 w-16 px-1 py-0 text-xs font-medium ${save.pending ? "text-muted-foreground" : ""}`}
            onChangeText={(next) => {
              finished.current = false;
              setDraft(next);
            }}
            onBlur={commit}
            onSubmitEditing={commit}
            onEscape={cancel}
          />
          {save.pending ? (
            <Spinner label="Saving" className="size-3 text-muted-foreground" />
          ) : null}
        </div>
        {message !== undefined ? (
          <FieldError id={errorId} className="text-xs">
            {message}
          </FieldError>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cube-rn-view cube-rn-pressable rounded px-0.5"
      aria-label={accessibilityLabel}
      disabled={saving}
      onClick={() => {
        setDraft(String(value));
        finished.current = false;
        setSave(IDLE);
        setEditing(true);
      }}
    >
      <span className={cn("cube-rn-text", `text-xs font-medium ${saving ? "opacity-50" : ""}`)}>
        {saving ? "…" : format(value)}
      </span>
    </button>
  );
}
