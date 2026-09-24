/**
 * Copied from `registry/ui/file-picker.web.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

/**
 * The web file picker: a drop zone over a hidden `<input type="file">`.
 *
 * Both are DOM-only, which is why this is a `.web.tsx`. The caller never sees a
 * `File` — it gets the decoded text — so the calling screen stays shared.
 */
import { useRef, useState } from "react";
import type { FilePickerProps } from "@/components/ui/file-picker-base";
import { cn } from "@/lib/utils";
import { Upload } from "./icons";

export function FilePicker({ onPick, accept, label, hint }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function read(file: File) {
    onPick(await file.text(), file.name);
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
          const file = e.dataTransfer.files?.[0];
          if (file) void read(file);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span className="cube-rn-text font-medium text-sm">{label}</span>
        {hint ? <span className="cube-rn-text text-xs text-muted-foreground">{hint}</span> : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        {...(accept ? { accept } : {})}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void read(file);
          // Allow re-selecting the same file after a reset.
          e.target.value = "";
        }}
      />
    </>
  );
}
