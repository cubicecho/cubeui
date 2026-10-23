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
import { ArrowLeft } from "@/components/ui/icons";
import type { SlotNode } from "@/lib/utils";

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

/**
 * The header row of a detail view: back button, optional colour dot, title, badge, subtitle and
 * actions.
 */
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
    // Wraps rather than pushing the actions off a phone; `min-w-0` lets the title column shrink.
    <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
      <Button
        variant="outline"
        size="icon"
        onPress={onBack}
        aria-label={backLabel}
        iconSlot={<ArrowLeft className="h-4 w-4" />}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View className="min-w-0 flex-row items-center gap-2">
          {color ? <ColorDot color={color} {...(colorLabel ? { title: colorLabel } : {})} /> : null}
          {/* `role`/`aria-level` because an `<h1>` has no native counterpart — and they are what
              a compiled web build reads to emit one. The page's own name, so the page title's
              rank and size: PageHeader level 1's text-xl. */}
          <Text
            role="heading"
            aria-level={1}
            className="min-w-0 shrink font-semibold text-foreground text-xl tracking-tight"
          >
            {title}
          </Text>
          {badgeSlot}
        </View>
        {subtitle ? <Text className="text-sm text-foreground/60">{subtitle}</Text> : null}
      </View>
      {actionsSlot}
    </View>
  );
}
