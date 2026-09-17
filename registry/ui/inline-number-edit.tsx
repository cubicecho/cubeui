/**
 * A number shown as text, becoming an input when pressed.
 *
 * For a value that is read far more often than it is changed and does not
 * deserve a form — a quantity on a row, an estimate on a card. Commits on blur
 * and on submit; there is no explicit save, because a control the size of a
 * badge has nowhere to put one.
 *
 * Note for a caller whose row is itself pressable: this is a `Pressable` inside
 * that row, so the row's own press fires too. Wrap it in a container that
 * swallows the press — that is the caller's business, not this component's,
 * because only the caller knows which press should win.
 */
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { Input } from "@/components/ui/input";

type InlineNumberEditProps = {
  value: number;
  min?: number;
  max?: number;
  /** Renders the value when not editing — e.g. `(n) => \`${n} min\``. */
  format?: (value: number) => string;
  /** Labels the press target for a screen reader, since the text is a number. */
  accessibilityLabel: string;
  saving?: boolean;
  onSave: (value: number) => void;
};

export function InlineNumberEdit({
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  format = String,
  accessibilityLabel,
  saving,
  onSave,
}: InlineNumberEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    // An unparseable draft falls back to the floor rather than to `NaN`, and an
    // unchanged value is not saved at all — an inline edit that fires a mutation
    // every time it loses focus is a write amplifier.
    const parsed = Number(draft);
    const clamped = Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : min));
    if (clamped !== value) onSave(clamped);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        type="number"
        min={min}
        max={max}
        value={draft}
        autoFocus
        className="h-6 w-16 px-1 py-0 text-xs font-medium"
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
      />
    );
  }

  return (
    <Pressable
      className="rounded px-0.5"
      accessibilityLabel={accessibilityLabel}
      disabled={saving}
      onPress={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      <Text className={`text-xs font-medium ${saving ? "opacity-50" : ""}`}>
        {saving ? "…" : format(value)}
      </Text>
    </Pressable>
  );
}
