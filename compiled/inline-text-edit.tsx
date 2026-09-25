/**
 * Compiled from `registry/ui/inline-text-edit.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A line of text shown as text, becoming an input when it is edited — the rename of a lane, a
 * chat, a document title.
 *
 * `InlineNumberEdit`'s sibling, and it commits the same way: on submit and on blur, with no save
 * button. Escape puts the old value back. The draft is trimmed, an empty one is refused (the old
 * value stays) unless `allowEmpty`, and an unchanged one does not call `onSave` at all.
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
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

type InlineTextEditLevel = 1 | 2 | 3;

type InlineTextEditProps = {
  value: string;
  /** Called with the trimmed draft, and only when it differs from `value`. */
  onSave: (value: string) => void;
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

  // The draft starts from the value each time an edit opens, however it was opened: a caller's
  // `editing` flips outside this component, so this is where the opening is noticed.
  const [wasEditing, setWasEditing] = useState(editing);
  if (editing !== wasEditing) {
    setWasEditing(editing);
    if (editing) {
      setDraft(value);
      finished.current = false;
    }
  }

  function setEditing(next: boolean) {
    if (!controlled) setEditingState(next);
    onEditingChange?.(next);
  }

  function commit() {
    if (finished.current) return;
    finished.current = true;
    const next = draft.trim();
    // Refusing an empty title is keeping the old one, not holding the box open: an inline edit
    // with nowhere to show an error has nothing better to do.
    if ((next !== "" || allowEmpty) && next !== value) onSave(next);
    setEditing(false);
  }

  function cancel() {
    if (finished.current) return;
    finished.current = true;
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        value={draft}
        autoFocus
        aria-label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn("h-8 px-2 py-1 text-sm", inputClassName)}
        onChangeText={(next) => {
          finished.current = false;
          setDraft(next);
        }}
        onBlur={commit}
        onSubmitEditing={commit}
        onEscape={cancel}
      />
    );
  }

  const empty = value === "";
  const shownText = empty ? (placeholder ?? "") : value;
  // The press is named by its text; with no text to read, by what it edits.
  const accessibilityLabel = shownText === "" ? label : undefined;
  const text = (
    <span className={cn("cube-rn-text", TEXT_CLASS, empty && "text-muted-foreground", className)}>
      {shownText}
    </span>
  );

  // A caller holding `editing` starts the edit from its own control, so the text stays text.
  const shown = controlled ? (
    text
  ) : (
    <button
      type="button"
      className="cube-rn-view cube-rn-pressable min-h-5 min-w-8 self-start rounded-sm"
      aria-description={label}
      {...(accessibilityLabel ? { "aria-label": accessibilityLabel } : {})}
      disabled={disabled}
      onClick={() => setEditing(true)}
    >
      {text}
    </button>
  );

  if (level === 1) {
    return <h1 className="cube-rn-view">{shown}</h1>;
  }
  if (level === 2) {
    return <h2 className="cube-rn-view">{shown}</h2>;
  }
  if (level === 3) {
    return <h3 className="cube-rn-view">{shown}</h3>;
  }
  return shown;
}
