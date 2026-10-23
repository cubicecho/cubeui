/**
 * The header row of a detail view: back button, optional colour dot, title,
 * badges, description, trailing actions.
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
import { cn, type SlotNode } from "@/lib/utils";

/**
 * How each heading level is drawn: `PageHeader`'s sizes, since a detail view's title is the page's
 * own name at level 1 and a pane's beside a list at 2 or 3. The size follows the level, so a caller
 * never sets both.
 */
const TITLE_SIZE = {
  1: "text-xl",
  2: "text-lg",
  3: "text-base",
} as const;

/** The heading levels a {@link DetailHeader} can be. */
export type DetailHeaderLevel = keyof typeof TITLE_SIZE;

type DetailHeaderProps = {
  onBack: () => void;
  /** Labels the back button for a screen reader — "Back to projects". */
  backLabel: string;
  /** Colour for the leading dot; omit to hide it. */
  color?: string | null | undefined;
  colorLabel?: string | undefined;
  title: string;
  /**
   * Which heading the title is: `1` (the default) for the page's own name, `2` or `3` for a detail
   * pane beside a list under a page title of its own. The size follows the level.
   */
  level?: DetailHeaderLevel | undefined;
  /** Small muted line under the title. */
  description?: ReactNode;
  /** What the record is wearing, next to the title — typically a `Badge`. */
  badgesSlot?: SlotNode;
  /** The header's far end: the record's actions. */
  actionSlot?: SlotNode;
  /** @deprecated Use `description`; this name goes in the next release. `description` wins. */
  subtitle?: ReactNode;
  /** @deprecated Use `badgesSlot`; this name goes in the next release. `badgesSlot` wins. */
  badgeSlot?: SlotNode;
  /** @deprecated Use `actionSlot`; this name goes in the next release. `actionSlot` wins. */
  actionsSlot?: SlotNode;
};

/**
 * The title, one arm per level: the compiler emits the tag from a *literal* `aria-level`, and a
 * level held in a variable would be a tag chosen at runtime, which it refuses.
 */
function Title({ level, children }: { level: DetailHeaderLevel; children: string }) {
  const className = cn(
    "min-w-0 shrink font-semibold text-foreground tracking-tight",
    TITLE_SIZE[level],
  );
  if (level === 1) {
    return (
      <Text role="heading" aria-level={1} className={className}>
        {children}
      </Text>
    );
  }
  if (level === 2) {
    return (
      <Text role="heading" aria-level={2} className={className}>
        {children}
      </Text>
    );
  }
  return (
    <Text role="heading" aria-level={3} className={className}>
      {children}
    </Text>
  );
}

/**
 * The header row of a detail view: back button, optional colour dot, title, badges, description and
 * actions. `subtitle`, `badgeSlot` and `actionsSlot` are the old names of the last three, kept for
 * one release; the new name wins when both are passed.
 */
export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  level = 1,
  description,
  badgesSlot,
  actionSlot,
  subtitle,
  badgeSlot,
  actionsSlot,
}: DetailHeaderProps) {
  const line = description ?? subtitle;
  const badges = badgesSlot ?? badgeSlot;
  const actions = actionSlot ?? actionsSlot;
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
          {/* `role`/`aria-level` because a heading has no native counterpart — and they are what
              a compiled web build reads to emit one. */}
          <Title level={level}>{title}</Title>
          {badges}
        </View>
        {line ? <Text className="text-sm text-foreground/60">{line}</Text> : null}
      </View>
      {actions}
    </View>
  );
}
