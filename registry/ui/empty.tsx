/**
 * shadcn's `Empty` parts on both platforms, drawn as cubeui's empty state — see `ui/button.tsx`
 * for the conversion rules.
 *
 * The names and the nesting are shadcn's, so a DOM call site ports unchanged:
 * `<Empty><EmptyHeader><EmptyMedia variant="icon"><Inbox /></EmptyMedia><EmptyTitle>…</EmptyTitle>
 * <EmptyDescription>…</EmptyDescription></EmptyHeader><EmptyContent>…</EmptyContent></Empty>`.
 * The drawing is not. It is `EmptyState`'s — the muted bubble, a `text-sm` title, `py-10` — because
 * `EmptyState` is built on these parts, and a project writing the compound form and a project
 * writing `<EmptyState icon={Inbox} … />` should get one empty state, not two that drift. What that
 * costs a shadcn call site is shadcn's look: the `text-lg` title, the `p-6 md:p-12`, the square
 * `size-10` icon tile, `flex-1` on the root and `max-w-sm` on the header. Pass a `className` for any
 * of them. `rounded-lg border-dashed` are kept, so the common `className="border"` still draws
 * shadcn's dashed outline.
 *
 * The spacing lives on the root's `gap-3` and on `EmptyMedia`'s `mb-3`, not on the header, so the
 * media reads the same whether it sits inside `EmptyHeader` (shadcn's examples) or beside it.
 *
 * `EmptyTitle` and `EmptyDescription` are `<Text>`, so a bare string inside them is safe on
 * device. The title is plain text; pass `role="heading"` and an `aria-level` when the empty state
 * *is* the screen, which is what `EmptyState`'s `level` does.
 *
 * Native inherits nothing, so the icon bubble publishes its ink and size through
 * `IconClassContext`; on the web the `<svg>` takes `currentColor` from the bubble and its size from
 * the `[&_svg]` class, the way `Alert` does it.
 */

import * as React from "react";
import { Text, View } from "react-native";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

// `className` is re-declared rather than inherited: nativewind types it as `className?: string`,
// which under `exactOptionalPropertyTypes` rejects the `cond ? "x" : undefined` call sites pass.
type ViewProps = Omit<React.ComponentProps<typeof View>, "className"> & {
  className?: string | undefined;
};
type TextProps = Omit<React.ComponentProps<typeof Text>, "className"> & {
  className?: string | undefined;
};

const Empty = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      testID="empty"
      className={cn(
        "w-full min-w-0 items-center justify-center gap-3 rounded-lg border-dashed border-border py-10",
        className,
      )}
      {...props}
    />
  ),
);
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} testID="empty-header" className={cn("items-center", className)} {...props} />
  ),
);
EmptyHeader.displayName = "EmptyHeader";

export type EmptyMediaVariant = "default" | "icon";

/** `icon` is the muted bubble `EmptyState` draws; `default` is a bare box for an avatar or image. */
const EMPTY_MEDIA = {
  default: "",
  icon: "rounded-full bg-muted p-3 text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
} satisfies Record<EmptyMediaVariant, string>;

type EmptyMediaProps = ViewProps & {
  /** `icon` draws the child glyph in a muted bubble, sized and inked; `default` leaves it alone. */
  variant?: EmptyMediaVariant | null | undefined;
};

const EmptyMedia = React.forwardRef<React.ElementRef<typeof View>, EmptyMediaProps>(
  ({ className, variant, children, ...props }, ref) => {
    const box = cn(
      "mb-3 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
      EMPTY_MEDIA[variant ?? "default"],
      className,
    );
    if (variant === "icon") {
      return (
        <View ref={ref} testID="empty-icon" className={box} {...props}>
          <IconClassContext.Provider value="h-6 w-6 text-muted-foreground">
            {children}
          </IconClassContext.Provider>
        </View>
      );
    }
    return (
      <View ref={ref} testID="empty-icon" className={box} {...props}>
        {children}
      </View>
    );
  },
);
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      testID="empty-title"
      className={cn("font-medium text-sm text-foreground", className)}
      {...props}
    />
  ),
);
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      testID="empty-description"
      className={cn(
        "text-center text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  ),
);
EmptyDescription.displayName = "EmptyDescription";

/** What to do about it: a button or two, under the words. */
const EmptyContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      testID="empty-content"
      className={cn("w-full min-w-0 max-w-sm items-center gap-3", className)}
      {...props}
    />
  ),
);
EmptyContent.displayName = "EmptyContent";

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
