/**
 * The `<Page>` shell plus the loading / not-found guard a detail route repeats.
 *
 * `children` is a function so the entity is non-null inside it — the guard and
 * the narrowing are the same act, and a render prop is what makes the type
 * system agree. A detail route's body then never writes `entity!` or an
 * early return of its own.
 */
import type { ReactNode } from "react";
import { Text } from "react-native";
import { Page } from "@/components/page";

type DetailPageProps<T> = {
  /** The loaded entity, or null/undefined while loading or when missing. */
  entity: T | null | undefined;
  loading?: boolean;
  /** Shown when the entity is absent and not loading. */
  notFoundLabel: string;
  className?: string;
  /** Rendered only once the entity is present, so it is non-null inside. */
  children: (entity: T) => ReactNode;
};

export function DetailPage<T>({
  entity,
  loading,
  notFoundLabel,
  className,
  children,
}: DetailPageProps<T>) {
  return (
    <Page {...(className ? { className } : {})}>
      {entity ? (
        children(entity)
      ) : (
        <Text className="text-muted-foreground">{loading ? "Loading…" : notFoundLabel}</Text>
      )}
    </Page>
  );
}
