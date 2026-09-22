/**
 * The three things a list of rows can be before it is a list of rows — see `ui/button.tsx` for
 * the conversion rules.
 *
 * Every list screen in every one of these apps opens the same way — the request failed, or it has
 * not landed, or it landed empty, or draw the rows — and every one of them writes that ladder
 * out again. The rung that goes wrong is the last one, because it has two correct spellings:
 *
 * ```tsx
 * data?.roles.length === 0                        // read straight off the query
 * shown.length === 0 && !isPending && !isError    // already defaulted to []
 * ```
 *
 * Six screens in one app, in both spellings, and neither is a bug — which is exactly why nobody
 * ever consolidated them. Here the three rungs are exclusive by construction, and the screen says
 * what it is about to draw rather than the guard working it out again.
 *
 * It returns `null` once there are rows, so a screen reads as the ladder and then the list:
 *
 * ```tsx
 * <QueryState query={roles} what="your roles" count={shown.length} empty={<Empty … />} />
 * {shown.map(…)}
 * ```
 *
 * `query` is taken structurally rather than as a TanStack `UseQueryResult` — the same line
 * `Form` holds against form libraries. A shell that names one data library is a shell the next
 * app cannot install.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, TriangleAlert } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** What a list screen needs off its query, and nothing more. */
type QueryLike = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
};

export function QueryState({
  query,
  what,
  count,
  empty,
  rows = 3,
  className,
}: {
  query: QueryLike;
  /** What could not be fetched, in the reader's words: "your agents", "the archive". */
  what: string;
  /**
   * How many rows the screen is about to draw.
   *
   * Passed rather than derived, because the rows a screen draws are usually a filtered or paged
   * view of what came back: an empty *result* and an empty *view* are different states, and only
   * the screen knows which one it is showing.
   */
  count: number;
  /** What to say when there are none — whatever invites the first one. */
  empty?: ReactNode | undefined;
  /** How many placeholder rows stand in for the list while it loads. */
  rows?: number | undefined;
  className?: string | undefined;
}) {
  if (query.isError)
    return (
      <QueryError
        error={query.error}
        onRetry={() => query.refetch()}
        what={what}
        {...(className === undefined ? {} : { className })}
      />
    );
  if (query.isPending)
    return <RowSkeleton rows={rows} {...(className === undefined ? {} : { className })} />;
  if (count === 0) return <>{empty}</>;
  return null;
}

/**
 * A request that failed, said out loud.
 *
 * Its own export because a screen that draws one object rather than a list needs this rung and
 * neither of the others. It is also the rung most often left out entirely: with retries off, a
 * failed query stays failed, and a screen that renders a failure as an absence tells somebody
 * whose server has gone away that they have no data — which is an invitation to rebuild
 * something that is fine.
 */
export function QueryError({
  error,
  onRetry,
  what,
  className,
}: {
  error: Error | null;
  onRetry: () => void;
  what: string;
  className?: string | undefined;
}) {
  return (
    <Card
      testID="query-error"
      // No tinted ground behind it. The version this was lifted from washed the card with
      // `bg-destructive/5`, which drops both the red heading and the grey message under 4.5:1
      // against their own background — 4.36 and 4.33, caught by the story's axe run. The border
      // and the icon say "this failed" without moving the ground the words sit on.
      className={cn("gap-2 border-destructive/50 p-4", className)}
    >
      {/* `flex-row` is explicit because a column is Yoga's default, and the icon carries its own
          colour because native inherits none — the two standing conversion rules. */}
      <View className="flex-row items-center gap-2">
        <TriangleAlert className="h-4 w-4 text-destructive" aria-hidden />
        <Text className="font-medium text-destructive text-sm">Could not load {what}</Text>
      </View>
      <Text className="text-muted-foreground text-sm">
        {error?.message || "The server did not answer."}
      </Text>
      <View className="flex-row">
        <Button variant="outline" size="sm" onPress={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      </View>
    </Card>
  );
}

/**
 * What a list shows before its first answer.
 *
 * Drawn as the row it stands in for — a bordered `Card`, which is what these lists are lists of
 * on device — so the screen does not change shape underneath the reader when the answer lands.
 * The web half of `main` drew an outlined `Item` here; `Item` is a DOM-only primitive, and a
 * placeholder that matches the row is the point rather than which component draws it.
 *
 * The placeholders are `aria-hidden` under one `role="status"` saying "Loading", because three
 * cards' worth of placeholder text is three cards' worth of nothing to a screen reader. `main`
 * hung that status off an `sr-only` sibling in a fragment; a fragment has nothing to attach a
 * live region to on device, so the status is the wrapper itself and the announcement is its
 * `aria-label`. That wrapper is the one structural difference from the DOM version, which is why
 * it carries the `gap` the rows would otherwise have taken from their parent.
 *
 * Only ever on `isPending`: a cache-and-network client keeps rendering what it had while it
 * refetches, and putting this behind `isFetching` flashes a skeleton over a perfectly good list.
 */
export function RowSkeleton({
  rows = 3,
  className,
}: {
  rows?: number | undefined;
  className?: string | undefined;
}) {
  return (
    <View role="status" aria-label="Loading" className={cn("gap-2", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <Card
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholders, in a list with no identity
          key={index}
          testID="row-skeleton"
          aria-hidden
          className="gap-2 p-4"
        >
          {/* `animate-pulse` resolves to nothing on device and is kept for the same reason
              `page.tsx` keeps `container mx-auto`: the class is what the compiled web half needs,
              and dropping it here to tidy the native file would quietly regress the DOM. */}
          <View className="h-4 w-1/3 animate-pulse rounded-md bg-accent" />
          <View className="h-3 w-2/3 animate-pulse rounded-md bg-accent" />
        </Card>
      ))}
    </View>
  );
}
