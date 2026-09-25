/**
 * Compiled from `registry/ui/empty.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

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
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

// `className` is re-declared rather than inherited: nativewind types it as `className?: string`,
// which under `exactOptionalPropertyTypes` rejects the `cond ? "x" : undefined` call sites pass.
type ViewProps = Omit<React.ComponentPropsWithoutRef<"div">, "className"> & {
  className?: string | undefined;
};
type TextProps = Omit<React.ComponentPropsWithoutRef<"span">, "className"> & {
  className?: string | undefined;
};

const Empty = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div
    ref={ref as React.Ref<HTMLDivElement>}
    data-slot="empty"
    className={cn(
      "cube-rn-view",
      "w-full min-w-0 items-center justify-center gap-3 rounded-lg border-dashed border-border py-10",
      className,
    )}
    {...(props as React.ComponentPropsWithoutRef<"div">)}
  />
));
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div
    ref={ref as React.Ref<HTMLDivElement>}
    data-slot="empty-header"
    className={cn("cube-rn-view", "items-center", className)}
    {...(props as React.ComponentPropsWithoutRef<"div">)}
  />
));
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

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, variant, children, ...props }, ref) => {
    const box = cn(
      "mb-3 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
      EMPTY_MEDIA[variant ?? "default"],
      className,
    );
    if (variant === "icon") {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          data-slot="empty-icon"
          className={cn("cube-rn-view", box)}
          {...(props as React.ComponentPropsWithoutRef<"div">)}
        >
          <IconClassContext.Provider value="h-6 w-6 text-muted-foreground">
            {children}
          </IconClassContext.Provider>
        </div>
      );
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        data-slot="empty-icon"
        className={cn("cube-rn-view", box)}
        {...(props as React.ComponentPropsWithoutRef<"div">)}
      >
        {children}
      </div>
    );
  },
);
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<HTMLSpanElement, TextProps>(({ className, ...props }, ref) => (
  <span
    ref={ref as React.Ref<HTMLSpanElement>}
    data-slot="empty-title"
    className={cn("cube-rn-text", "font-medium text-sm text-foreground", className)}
    {...(props as React.ComponentPropsWithoutRef<"span">)}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      data-slot="empty-description"
      className={cn(
        "cube-rn-text",
        "text-center text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<"span">)}
    />
  ),
);
EmptyDescription.displayName = "EmptyDescription";

/** What to do about it: a button or two, under the words. */
const EmptyContent = React.forwardRef<HTMLDivElement, ViewProps>(({ className, ...props }, ref) => (
  <div
    ref={ref as React.Ref<HTMLDivElement>}
    data-slot="empty-content"
    className={cn("cube-rn-view", "w-full min-w-0 max-w-sm items-center gap-3", className)}
    {...(props as React.ComponentPropsWithoutRef<"div">)}
  />
));
EmptyContent.displayName = "EmptyContent";

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
