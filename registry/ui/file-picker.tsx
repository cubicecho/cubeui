/**
 * The native file picker — a placeholder, not an implementation.
 *
 * **This half does not pick a file.** Reading one off web needs
 * `expo-document-picker` and a file-system read for the URI it returns, both of
 * which are app-level choices with their own permission flow — so rather than
 * ship a drop zone that silently opens nothing, this says so on screen and
 * `onPick` is never called. Replace this file in your app once those are wired
 * up; `file-picker-base.ts` is the contract to implement, and
 * `file-picker.web.tsx` is a working reference for the shape.
 */
import { Text, View } from "react-native";
import type { FilePickerProps } from "@/components/ui/file-picker-base";
import { Upload } from "@/components/ui/icons";

export function FilePicker({ label }: FilePickerProps) {
  return (
    <View className="w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-12">
      <Upload className="h-8 w-8 text-muted-foreground" />
      <Text className="text-center text-sm font-medium text-foreground">{label}</Text>
      <Text className="text-center text-xs text-muted-foreground">
        Picking a file is only available on the web app.
      </Text>
    </View>
  );
}
