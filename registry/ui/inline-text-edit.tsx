/**
 * A line of text shown as text, becoming an input when it is edited — the rename of a lane, a
 * chat, a document title.
 *
 * `InlineNumberEdit`'s sibling, and it commits the same way: on submit and on blur, with no save
 * button. Escape puts the old value back. The draft is trimmed, an empty one is refused (the old
 * value stays) unless `allowEmpty`, and an unchanged one does not call `onSave` at all.
 *
 * `onSave` may return a promise, and then the edit is not over until it settles. While it runs the
 * box keeps the draft and the focus, is read-only and busy, and turns a `Spinner` beside it — read
 * only rather than disabled, because disabling a focused input drops its focus, and a box that
 * fails wants the caret back where it was. Enter, blur and Escape are not heard until it settles.
 * If it rejects, the box stays open on the draft with the rejection's message under it as a
 * `FieldError` — the alert a form field shows, which the box points at with `aria-describedby`
 * and `aria-invalid` — so the user can press Enter again, or Escape out of it. A save that returns
 * nothing ends the edit at once, as it always did.
 *
 * Who starts the edit is who owns `editing`. Left to the component, pressing the text starts it.
 * Passed in, the start is the caller's — a Rename row in a menu, a pencil button — and the text is
 * only text, because a heading that is also a button is a heading a screen reader no longer finds.
 * A menu row that starts it wants `focusesElsewhere`, or the menu takes focus back from the input
 * after it closes and the blur ends the edit before anything is typed.
 *
 * Note for a caller whose row is itself pressable: as with `InlineNumberEdit`, the row's own press
 * fires too, and which press wins is the caller's call.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type InlineTextEditLevel = 1 | 2 | 3;

type InlineTextEditProps = {
  value: string;
  /**
   * Called with the trimmed draft, and only when it differs from `value`. Return the save's promise
   * to hold the edit open until it settles: pending while it runs, and on a rejection the draft
   * stays with the `Error`'s message under it.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: a sync save returns void; naming it beside the promise is the contract
  onSave: (value: string) => void | PromiseLike<unknown>;
  /**
   * The input's accessible name — "Lane name", or `Rename ${lane.name}` — and, when pressing the
   * text starts the edit, what that press is described as. The press itself is named by the text.
   */
  label: string;
  /** The input's placeholder, and what is shown in its place while `value` is empty. */
  placeholder?: string | undefined;
  /** Let an empty draft through as `""`. Off, an empty draft keeps the old value. */
  allowEmpty?: boolean | undefined;
  /** Draw the text as a heading of this rank. */
  level?: InlineTextEditLevel | undefined;
  /** Held by the caller, whose own control starts the edit. Omit to let a press on the text do it. */
  editing?: boolean | undefined;
  /** Told when the edit starts and ends. Alone, it tells without taking over. */
  onEditingChange?: ((editing: boolean) => void) | undefined;
  /** No press starts an edit. An edit already open is left to finish. */
  disabled?: boolean | undefined;
  maxLength?: number | undefined;
  /** The text's, when it is not being edited. */
  className?: string | undefined;
  inputClassName?: string | undefined;
};

const TEXT_CLASS = "text-sm text-foreground";

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

export function InlineTextEdit({
  value,
  onSave,
  label,
  placeholder,
  allowEmpty = false,
  level,
  editing: editingProp,
  onEditingChange,
  disabled = false,
  maxLength,
  className,
  inputClassName,
}: InlineTextEditProps) {
  const [editingState, setEditingState] = useState(false);
  const controlled = editingProp !== undefined;
  const editing = controlled ? editingProp : editingState;

  const [draft, setDraft] = useState(value);
  // Set once the edit is finished — by submit, blur or Escape — so the blur that follows a submit,
  // or the unmount that follows an Escape, does not finish it a second time with a stale draft.
  const finished = useRef(false);

  const [save, setSave] = useState<SaveState>(IDLE);
  // Which save is the live one. Bumped by each save, by Escape and by unmounting, so a promise that
  // settles after the edit it belonged to has ended changes nothing.
  const attempt = useRef(0);
  useEffect(
    () => () => {
      attempt.current += 1;
    },
    [],
  );
  const errorId = useId();

  // The draft starts from the value each time an edit opens, however it was opened: a caller's
  // `editing` flips outside this component, so this is where the opening is noticed.
  const [wasEditing, setWasEditing] = useState(editing);
  if (editing !== wasEditing) {
    setWasEditing(editing);
    if (editing) {
      setDraft(value);
      finished.current = false;
      setSave(IDLE);
    }
  }

  function setEditing(next: boolean) {
    if (!controlled) setEditingState(next);
    onEditingChange?.(next);
  }

  function fail(reason: unknown) {
    // Open again: the next Enter, blur or Escape is heard.
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
    const next = draft.trim();
    // Refusing an empty title is keeping the old one, not holding the box open: the old value is
    // a better answer to an empty draft than an error the caller never wrote.
    if ((next === "" && !allowEmpty) || next === value) {
      setSave(IDLE);
      setEditing(false);
      return;
    }
    const current = ++attempt.current;
    let result: unknown;
    try {
      result = onSave(next);
    } catch (reason) {
      fail(reason);
      return;
    }
    if (!isPromiseLike(result)) {
      setSave(IDLE);
      setEditing(false);
      return;
    }
    setSave({ pending: true });
    result.then(
      () => {
        if (current !== attempt.current) return;
        setSave(IDLE);
        setEditing(false);
      },
      (reason: unknown) => {
        if (current !== attempt.current) return;
        fail(reason);
      },
    );
  }

  function cancel() {
    if (finished.current) return;
    finished.current = true;
    attempt.current += 1;
    setDraft(value);
    setSave(IDLE);
    setEditing(false);
  }

  if (editing) {
    const failed = !save.pending && save.failed;
    const message = !save.pending ? save.message : undefined;
    // One tree whatever the save is doing, so the spinner and the error arriving do not remount the
    // input and lose the caret.
    return (
      <View aria-busy={save.pending} className="w-full min-w-0 gap-1">
        <View className="flex-row items-center gap-2">
          <Input
            value={draft}
            autoFocus
            aria-label={label}
            aria-invalid={failed || undefined}
            aria-describedby={message !== undefined ? errorId : undefined}
            readOnly={save.pending}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(
              "h-8 min-w-0 flex-1 px-2 py-1 text-sm",
              save.pending && "text-muted-foreground",
              inputClassName,
            )}
            onChangeText={(next) => {
              finished.current = false;
              setDraft(next);
            }}
            onBlur={commit}
            onSubmitEditing={commit}
            onEscape={cancel}
          />
          {save.pending ? <Spinner label="Saving" className="text-muted-foreground" /> : null}
        </View>
        {message !== undefined ? <FieldError id={errorId}>{message}</FieldError> : null}
      </View>
    );
  }

  const empty = value === "";
  const shownText = empty ? (placeholder ?? "") : value;
  // The press is named by its text; with no text to read, by what it edits.
  const accessibilityLabel = shownText === "" ? label : undefined;
  const text = (
    <Text className={cn(TEXT_CLASS, empty && "text-muted-foreground", className)}>{shownText}</Text>
  );

  // A caller holding `editing` starts the edit from its own control, so the text stays text.
  const shown = controlled ? (
    text
  ) : (
    <Pressable
      role="button"
      className="min-h-5 min-w-8 self-start rounded-sm"
      accessibilityHint={label}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      disabled={disabled}
      onPress={() => setEditing(true)}
    >
      {text}
    </Pressable>
  );

  if (level === 1) {
    return (
      <View role="heading" aria-level={1}>
        {shown}
      </View>
    );
  }
  if (level === 2) {
    return (
      <View role="heading" aria-level={2}>
        {shown}
      </View>
    );
  }
  if (level === 3) {
    return (
      <View role="heading" aria-level={3}>
        {shown}
      </View>
    );
  }
  return shown;
}
