/**
 * The native file picker — a placeholder, not an implementation.
 *
 * **This half does not pick a file.** Reading one off web needs
 * `expo-document-picker` and a file-system read for the URI it returns, both of
 * which are app-level choices with their own permission flow — so rather than
 * ship a drop zone that silently opens nothing, this says so on screen and
 * neither `onPick` nor `onPickMany` is ever called. `multiple`, `accept`, `read`
 * and `directory` are taken so a shared call site typechecks, and do nothing
 * here; an implementation would hand the first two to `expo-document-picker` as
 * its `multiple` and `type`, can filter what comes back with `acceptsFile` the
 * way the web half does, fills `size` from the picker's asset, `bytes` as a
 * `Uint8Array` for `read="bytes"`, and `blob` from `fetch(uri).blob()` for
 * `read="none"`.
 * `directory` is web only: that picker has no folder mode. Replace
 * this file in your app once those are wired up; `file-picker-base.ts` is the
 * contract to implement, and `file-picker.web.tsx` is a working reference for
 * the shape.
 *
 * `FilePickerButton` is the same placeholder as a `Button`: drawn with the look
 * it was given, named by `label`, and disabled, with the reason as its `hint`:
 * read after the name and shown on a long press, since an icon-sized button has
 * no room to say it on screen.
 */
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import {
  FILE_PICKER_HINT_CLASS,
  FILE_PICKER_ICON_CLASS,
  FILE_PICKER_TITLE_CLASS,
  FILE_PICKER_ZONE_CLASS,
  type FilePickerButtonProps,
  type FilePickerProps,
} from "@/components/ui/file-picker-base";
import { Upload } from "@/components/ui/icons";

const UNAVAILABLE = "Picking a file is only available on the web app.";

/** The device's stand-in for the drop zone: it says picking a file is only available on the web. */
export function FilePicker({ label }: FilePickerProps) {
  return (
    <View className={FILE_PICKER_ZONE_CLASS}>
      <Upload className={FILE_PICKER_ICON_CLASS} />
      <Text className={FILE_PICKER_TITLE_CLASS}>{label}</Text>
      <Text className={FILE_PICKER_HINT_CLASS}>{UNAVAILABLE}</Text>
    </View>
  );
}

/** The device's stand-in for the picker button: drawn and named, and disabled. */
export function FilePickerButton({
  label,
  iconSlot = <Upload />,
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
      hint={UNAVAILABLE}
      iconSlot={iconSlot}
      content={iconOnly ? null : label}
    />
  );
}
