/**
 * Compiled from `registry/layout/query-state.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

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
      <span className="cube-rn-text text-sm text-destructive">
        {errorLabel}: {error.message}
      </span>
    );
  }
  if (loading) {
    return <span className="cube-rn-text text-sm text-muted-foreground">{loadingLabel}</span>;
  }
  return null;
}
