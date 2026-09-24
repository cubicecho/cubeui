/**
 * The web file picker: a drop zone, or a button, over a hidden `<input type="file">`.
 *
 * Both are DOM-only, which is why this is a `.web.tsx`. The caller never sees a
 * `File` — it gets the decoded text — so the calling screen stays shared.
 */
import { type DragEvent, type ReactNode, useRef, useState } from "react";
import { Text } from "react-native";
import { buttonTextVariants, buttonVariants } from "@/components/ui/button";
import {
  acceptsFile,
  type FilePickerButtonProps,
  type FilePickerProps,
} from "@/components/ui/file-picker-base";
import { Upload } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type PickOptions = Pick<FilePickerProps, "onPick" | "onPickMany" | "accept" | "multiple">;

/**
 * The picking, apart from the look: the hidden input, what a click and a drop
 * do, and whether something is being dragged over. The zone and the button are
 * two faces on this one hook, so they cannot disagree about what a pick is.
 */
function useFilePick({ onPick, onPickMany, accept, multiple }: PickOptions) {
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

  const trigger = {
    type: "button" as const,
    onClick: () => inputRef.current?.click(),
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void take(e.dataTransfer.files);
    },
  };

  const input = (
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
  );

  return { trigger, input, dragging };
}

export function FilePicker({ label, hint, ...options }: FilePickerProps) {
  const { trigger, input, dragging } = useFilePick(options);

  return (
    <>
      <button
        {...trigger}
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
      {input}
    </>
  );
}

export function FilePickerButton({
  label,
  icon = <Upload />,
  variant,
  size,
  className,
  ...options
}: FilePickerButtonProps) {
  const { trigger, input, dragging } = useFilePick(options);
  // At an icon size the square has no room for words, so `label` is the name alone.
  const iconOnly = typeof size === "string" && size.startsWith("icon");
  let content: ReactNode = icon;
  if (!iconOnly) {
    content = (
      <>
        {icon}
        <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
      </>
    );
  }

  return (
    <>
      {/* `buttonVariants` on a plain `<button>` rather than `Button`: in an Expo web app `Button`
          is a `Pressable`, which drops the drag handlers a drop needs. */}
      <button
        {...trigger}
        aria-label={label}
        className={cn(
          buttonVariants({ variant, size }),
          dragging && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          className,
        )}
      >
        {content}
      </button>
      {input}
    </>
  );
}
