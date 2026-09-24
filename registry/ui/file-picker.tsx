/**
 * The native file picker — a placeholder, not an implementation.
 *
 * **This half does not pick a file.** Reading one off web needs
 * `expo-document-picker` and a file-system read for the URI it returns, both of
 * which are app-level choices with their own permission flow — so rather than
 * ship a drop zone that silently opens nothing, this says so on screen and
 * neither `onPick` nor `onPickMany` is ever called. `multiple` and `accept` are
 * taken so a shared call site typechecks, and do nothing here; an implementation
 * would hand them to `expo-document-picker` as its `multiple` and `type`, and can
 * filter what comes back with `acceptsFile` the way the web half does. Replace
 * this file in your app once those are wired up; `file-picker-base.ts` is the
 * contract to implement, and `file-picker.web.tsx` is a working reference for
 * the shape.
 *
 * `FilePickerButton` is the same placeholder as a `Button`: drawn with the look
 * it was given, named by `label`, and disabled, with the reason as its
 * accessibility hint. An icon-sized button has no room to say it on screen.
 */
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import type { FilePickerButtonProps, FilePickerProps } from "@/components/ui/file-picker-base";
import { Upload } from "@/components/ui/icons";

const UNAVAILABLE = "Picking a file is only available on the web app.";

export function FilePicker({ label }: FilePickerProps) {
  return (
    <View className="w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-12">
      <Upload className="h-8 w-8 text-muted-foreground" />
      <Text className="text-center text-sm font-medium text-foreground">{label}</Text>
      <Text className="text-center text-xs text-muted-foreground">{UNAVAILABLE}</Text>
    </View>
  );
}

export function FilePickerButton({
  label,
  icon = <Upload />,
  variant,
  size,
  className,
}: FilePickerButtonProps) {
  const iconOnly = typeof size === "string" && size.startsWith("icon");
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled
      aria-label={label}
      accessibilityHint={UNAVAILABLE}
    >
      {icon}
      {iconOnly ? null : label}
    </Button>
  );
}
