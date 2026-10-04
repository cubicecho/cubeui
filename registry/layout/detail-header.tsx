/**
 * The header row of a detail view: back button, optional colour dot, title,
 * badge, subtitle, trailing actions.
 *
 * Distinct from `PageHeader` in `layout/page-header` by the back affordance and the
 * leading dot — a detail view is reached *from* somewhere, and a list page is
 * not.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/color-dot";
import { ArrowLeft, Pencil } from "@/components/ui/icons";
import type { SlotNode } from "@/lib/utils";

/** The outline "Edit" action a detail header usually carries. */
export function EditButton({ onPress, label = "Edit" }: { onPress: () => void; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onPress={onPress}
      iconSlot={<Pencil className="mr-1.5 h-3.5 w-3.5" />}
      content={label}
    />
  );
}

type DetailHeaderProps = {
  onBack: () => void;
  /** Labels the back button for a screen reader — "Back to projects". */
  backLabel: string;
  /** Colour for the leading dot; omit to hide it. */
  color?: string | null | undefined;
  colorLabel?: string | undefined;
  title: string;
  /** Small muted line under the title. */
  subtitle?: ReactNode;
  /** Rendered next to the title — typically a `Badge`. */
  badgeSlot?: SlotNode;
  /** Trailing actions. */
  actionsSlot?: SlotNode;
};

export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  subtitle,
  badgeSlot,
  actionsSlot,
}: DetailHeaderProps) {
  return (
    <View className="flex-row items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onPress={onBack}
        aria-label={backLabel}
        iconSlot={<ArrowLeft className="h-4 w-4" />}
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          {color ? <ColorDot color={color} {...(colorLabel ? { title: colorLabel } : {})} /> : null}
          {/* `role`/`aria-level` because an `<h2>` has no native counterpart —
              and they are what a compiled web build reads to emit one. */}
          <Text role="heading" aria-level={2} className="text-2xl font-bold text-foreground">
            {title}
          </Text>
          {badgeSlot}
        </View>
        {subtitle ? <Text className="mt-0.5 text-sm text-foreground/60">{subtitle}</Text> : null}
      </View>
      {actionsSlot}
    </View>
  );
}
