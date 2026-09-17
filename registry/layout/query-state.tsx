/**
 * Inline loading / error text for a query whose data may still render beside it.
 *
 * Deliberately not a spinner-over-the-whole-page: the case it exists for is a
 * list that already has last-fetch data on screen and is revalidating, where
 * blanking the page would be a regression. Renders the error (priority), else
 * the loading line, else nothing.
 */
import { Text } from "react-native";

export function QueryState({
  loading,
  error,
  loadingLabel = "Loading…",
  errorLabel = "Error",
}: {
  loading?: boolean | undefined;
  /**
   * Structurally typed rather than `Error`, so any client's failure shape fits
   * without a cast — TanStack Query, a fetch wrapper, a hand-rolled reducer.
   */
  error?: { message: string } | null | undefined;
  loadingLabel?: string;
  errorLabel?: string;
}) {
  if (error) {
    return (
      <Text className="text-sm text-destructive">
        {errorLabel}: {error.message}
      </Text>
    );
  }
  if (loading) {
    return <Text className="text-sm text-muted-foreground">{loadingLabel}</Text>;
  }
  return null;
}
