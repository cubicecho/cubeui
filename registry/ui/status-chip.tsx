/**
 * A small pill stating the state a record is in — active, completed, archived,
 * failed, draft. The `tone` is what the colour means; the text is the app's own
 * word for it.
 *
 * The pill splits into a container class and a text class for the usual reason:
 * native does not inherit colour, so the `text-*` half has to sit on the
 * `<Text>` itself. That is also why this is a component rather than the two
 * class maps it wraps — getting the pairing right at each call site is the
 * thing that drifts.
 */
import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * `neutral` and `info` come from the theme; the other three do not.
 *
 * shadcn's token set has exactly one semantic colour (`destructive`), so
 * success and warning are palette colours picked to sit beside it. An app that
 * adds its own tokens should override these two lines and nothing else.
 */
const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted",
  info: "bg-primary/10",
  success: "bg-green-500/10",
  warning: "bg-amber-500/10",
  danger: "bg-destructive/10",
};

const TONE_TEXT_CLASS: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  info: "text-primary",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-destructive",
};

export function StatusChip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: string;
}) {
  return (
    <View className={cn("self-start rounded-full px-2 py-0.5", TONE_CLASS[tone], className)}>
      <Text className={cn("text-[11px] font-medium capitalize", TONE_TEXT_CLASS[tone])}>
        {children}
      </Text>
    </View>
  );
}
