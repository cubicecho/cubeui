/**
 * The `<Page>` shell plus the loading / not-found guard a detail route repeats.
 *
 * `contentSlot` is a function so the entity is non-null inside it — the guard and
 * the narrowing are the same act, and a render prop is what makes the type
 * system agree. A detail route's body then never writes `entity!` or an
 * early return of its own.
 */
import { Text } from "react-native";
import { Page } from "@/components/page";
import type { SlotNode } from "@/lib/utils";

type DetailPageProps<T> = {
  /** The loaded entity, or null/undefined while loading or when missing. */
  entity: T | null | undefined;
  loading?: boolean;
  /** Shown when the entity is absent and not loading. */
  notFoundLabel: string;
  className?: string;
  /** Rendered only once the entity is present, so it is non-null inside. */
  contentSlot: (entity: T) => SlotNode;
};

/**
 * A `Page` that shows loading or not-found until the entity is there, then hands it to
 * `contentSlot`.
 */
export function DetailPage<T>({
  entity,
  loading,
  notFoundLabel,
  className,
  contentSlot,
}: DetailPageProps<T>) {
  return (
    <Page
      {...(className ? { className } : {})}
      contentSlot={
        entity ? (
          contentSlot(entity)
        ) : (
          <Text className="text-foreground/60">{loading ? "Loading…" : notFoundLabel}</Text>
        )
      }
    />
  );
}
