import type { ReactNode } from "react";
import { Children } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardLayoutProps = {
  /** The body. */
  children?: ReactNode;
  /** A string, a heading, whatever names the card. Absent, no header row is drawn. */
  title?: ReactNode;
  /** One line on what the card holds, or what changing it costs. */
  description?: ReactNode;
  /** Sits before the title, sized to the text. An icon, a status dot, an avatar. */
  icon?: ReactNode;
  /** The header's far end: an add button, a menu, a switch. */
  action?: ReactNode;
  /** Shown instead of `children` when there is nothing in them — an empty list, no results. */
  empty?: ReactNode;
  /** The footer's start. A timestamp, a note, a destructive action held away from the rest. */
  footer?: ReactNode;
  /** The footer's end. The buttons. Given alone, the footer is simply right-aligned. */
  footerActions?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
};

/**
 * A card with its slots already placed.
 *
 * The shape is the one every card in these apps arrives at on its own — an icon and a title, a
 * line of description under it, an action at the far end of the header, a body, and a footer
 * that holds the buttons — and writing it out each time is how they drift: some put the action
 * beside the title and some under it, some give the description a `text-sm` and some a `text-xs`,
 * and a card with nothing to show says so in a different voice on every screen.
 *
 * Every slot is a node rather than a child, so a card is one element at the call site and the
 * question "where does this go?" has one answer per prop. `empty` is the exception worth naming:
 * it is not a slot the caller places, it is what the body says when `children` come back empty,
 * which is what a list rendered from a `map` does the moment its data is.
 */
export function CardLayout({
  children,
  title,
  description,
  icon,
  action,
  empty,
  footer,
  footerActions,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: CardLayoutProps) {
  // `Children.count` rather than a truth test: `{items.map(…)}` on an empty array is an empty
  // array, not null, and it is the shape a card is nearly always handed.
  const isEmpty = Children.count(children) === 0;
  const body = isEmpty && empty ? empty : children;

  const hasHeader = Boolean(title || description || action);
  const hasFooter = Boolean(footer || footerActions);

  return (
    <Card data-slot="card-layout" className={className}>
      {hasHeader ? (
        <CardHeader className={headerClassName}>
          {title ? (
            <CardTitle className="flex min-w-0 items-center gap-2">
              {icon ? (
                // Sized here rather than by the caller, so an icon passed as `<Plus />` and one
                // passed as `<Plus className="size-4" />` land at the same size.
                <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>
              ) : null}
              <span className="min-w-0 truncate">{title}</span>
            </CardTitle>
          ) : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
          {/* CardAction places itself in the header grid's second column; it needs no wrapper. */}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}

      {body ? (
        <CardContent className={cn("min-w-0", contentClassName)}>{body}</CardContent>
      ) : null}

      {hasFooter ? (
        <CardFooter
          className={cn(footer && footerActions && "justify-between", !footer && "justify-end", footerClassName)}
        >
          {footer}
          {footerActions ? <div className="flex items-center gap-2">{footerActions}</div> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
