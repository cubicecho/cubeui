import type { ReactNode } from "react";

/**
 * The frame the Stage 0 stories render in: the React Native component on the left, the compiled
 * DOM one on the right, in one story so a difference is visible rather than remembered.
 *
 * Plain DOM on purpose. A React Native wrapper would put react-native-web's stylesheet around the
 * compiled half too, which is the one thing that would make the comparison lie — the compiled
 * output exists precisely to be judged without it.
 */
export function SideBySide({ native, compiled }: { native: ReactNode; compiled: ReactNode }) {
  return (
    <div className="flex gap-6 bg-background p-6 text-foreground">
      <section className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          react native
        </p>
        {native}
      </section>
      <section className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          compiled
        </p>
        {compiled}
      </section>
    </div>
  );
}
