/**
 * An inline monospace span. `<code>` has no native counterpart and it appeared
 * inline inside a sentence, so this has to be a `Text` — a `View` cannot be
 * nested in one.
 */

import type { ReactNode } from "react";
import { Text } from "react-native";
import { cn } from "@/lib/utils";

export function Code({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Text
      className={cn("rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground", className)}
    >
      {children}
    </Text>
  );
}
