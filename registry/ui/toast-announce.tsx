/**
 * Says a toast aloud on device. `toast-announce.web.tsx` is the web half.
 *
 * The stack is a polite live region, and Android reads a live region when what is in it changes,
 * so a toast is announced there by being drawn. iOS has no live regions: VoiceOver says nothing
 * until it is asked to (#500). A `status` waits for what is being said to finish, as `polite`
 * does on the web; an `alert` interrupts it.
 */
import { AccessibilityInfo, Platform } from "react-native";

/** Has VoiceOver say `message`, now when `interrupt`, or after what it is saying. */
export function announceToast(message: string, interrupt: boolean): void {
  if (Platform.OS !== "ios") {
    return;
  }
  if (interrupt) {
    AccessibilityInfo.announceForAccessibility(message);
    return;
  }
  AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
}
