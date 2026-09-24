/**
 * The web file picker: a drop zone over a hidden `<input type="file">`.
 *
 * Both are DOM-only, which is why this is a `.web.tsx`. The caller never sees a
 * `File` — it gets the decoded text — so the calling screen stays shared.
 */
import { useRef, useState } from "react";
import { Text } from "react-native";
import { acceptsFile, type FilePickerProps } from "@/components/ui/file-picker-base";
import { Upload } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function FilePicker({ onPick, onPickMany, accept, multiple, label, hint }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function take(list: FileList | null | undefined) {
    // Copied before the first `await`: the input's `FileList` is emptied when its
    // value is reset, and a drop's is gone once the event returns. `accept` is
    // only advisory on the dialog and not applied to a drop at all, so it is
    // applied here, to both.
    const allowed = Array.from(list ?? []).filter((file) => acceptsFile(accept, file));
    const files = multiple ? allowed : allowed.slice(0, 1);
    if (files.length === 0) return;
    const picked = await Promise.all(
      files.map(async (file) => ({ text: await file.text(), name: file.name })),
    );
    if (onPickMany) onPickMany(picked);
    else for (const file of picked) onPick?.(file.text, file.name);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void take(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <Text className="font-medium text-sm">{label}</Text>
        {hint ? <Text className="text-xs text-muted-foreground">{hint}</Text> : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        {...(accept ? { accept } : {})}
        {...(multiple ? { multiple: true } : {})}
        className="hidden"
        onChange={(e) => {
          void take(e.target.files);
          // Allow re-selecting the same file after a reset.
          e.target.value = "";
        }}
      />
    </>
  );
}
