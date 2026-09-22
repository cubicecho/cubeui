/**
 * Copied from `registry/web/disclosure-row.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * This is level 4 of the plan: the item has a hand-written web half, so nothing was generated. The
 * same passes still ran over it, and for a file already written against the DOM they find nothing
 * to do beyond pointing its sibling imports at the web tree. That is deliberate — running one
 * pipeline over the whole output tree is what guarantees a hand-written half and a compiled one
 * speak the same prop vocabulary, instead of the two drifting where nobody is looking.
 */

import { ChevronRight } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from "./item";

/**
 * One row in a list of things you can open: a run, a task, an archived record.
 *
 * The row itself is `Item`, so a row that opens and a row that does not line up down to the
 * padding. What this adds is the opening, and it is here rather than left to each app because
 * the parts of a disclosure that go wrong are the small ones:
 *
 * - **The whole heading is one `<button>`**, so the row is reachable by keyboard and works with
 *   Space — not a chevron with a click handler, which is the version hand-written rows ship.
 * - `aria-expanded` on that button, so the state is announced rather than only drawn as a
 *   rotated chevron.
 * - The chevron turns off the same boolean, so there is one source of truth for open.
 * - **`action` sits outside the button.** A control nested inside a button is invalid HTML and,
 *   in practice, a delete button that cannot be clicked. Three pages of one app were laid out
 *   this way after finding that out.
 *
 * It is not a prop on `Item`: an `open`/`onOpenChange` pair there would turn every existing
 * caller's heading into a button, which is a different element and a different contract.
 *
 * Open is controlled, because in these apps a row is often opened from somewhere else — a deep
 * link to a run, a "show the failure" button further up the page. An uncontrolled default would
 * be a convenience worth adding, not the base case.
 */
export function DisclosureRow({
  open,
  onOpenChange,
  title,
  badges,
  meta,
  description,
  action,
  content,
  className,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Whatever the row is wearing: a status, a kind, a state. Drawn before the title. */
  badges?: ReactNode | undefined;
  /** The grey line of facts beside the title — a name, a time, a count. */
  meta?: ReactNode | undefined;
  /** Two clipped lines of what the thing said, drawn under the title whether open or not. */
  description?: ReactNode | undefined;
  /** Buttons, outside the disclosure: a row is opened by its heading and acted on by these. */
  action?: ReactNode | undefined;
  /** What the row opens onto. */
  content?: ReactNode | undefined;
  className?: string | undefined;
  contentClassName?: string | undefined;
}) {
  const contentId = useId();
  const isOpen = open && Boolean(content);

  return (
    <Item data-slot="disclosure-row" variant="outline" className={cn("items-start", className)}>
      <button
        type="button"
        // Only while it is open, because `aria-controls` pointing at an id that is not in the
        // document is a broken reference rather than a hint — and the body is unmounted when
        // closed, which is what keeps a list of two hundred rows cheap.
        aria-controls={isOpen ? contentId : undefined}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        // `bg-transparent` and `p-0` because a bare `<button>` is otherwise drawn in the user
        // agent's grey wherever Tailwind's preflight is not loaded — and the row is the surface.
        className="flex min-w-0 flex-1 items-start gap-2 rounded border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight
          aria-hidden
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <ItemContent className="min-w-0">
          <ItemTitle className="flex-wrap">
            {badges}
            <span className="truncate">{title}</span>
            {meta}
          </ItemTitle>
          {description ? <ItemDescription>{description}</ItemDescription> : null}
        </ItemContent>
      </button>

      {action ? <ItemActions className="gap-1">{action}</ItemActions> : null}

      {isOpen ? (
        <ItemFooter
          id={contentId}
          className={cn("min-w-0 flex-col items-stretch gap-2 border-t pt-3", contentClassName)}
        >
          {content}
        </ItemFooter>
      ) : null}
    </Item>
  );
}
