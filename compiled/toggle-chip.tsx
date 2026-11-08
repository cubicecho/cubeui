/**
 * Compiled from `registry/ui/toggle-chip.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A small selectable pill — a filter chip, a day-of-week toggle, a swatch.
 *
 * Distinct from `segmented` in what the selection means: a segmented control is
 * one-of-N and its items are a closed set, a chip is on/off and stands alone.
 * Colour is split across the container and the `<Text>` for the usual reason:
 * native does not inherit it.
 *
 * **Takes the rest of a `Pressable`'s props and forwards a ref**, the same
 * contract `button.tsx` has. It did not, and the closed prop set is what a
 * caller hits first: a chip explaining why it is off wants a tooltip, and
 * `<TooltipTrigger asChild>` clones its child with a ref and a handful of
 * `aria-*` and pointer props. A component that declares neither drops all of
 * them — silently, since the props go nowhere rather than erroring — so the
 * tooltip never opens and the chip never gets the description. The same is
 * true of `onLongPress`, `testID`, and every other prop the platform has and
 * this file had not thought to list.
 */
import * as React from "react";
import { cn, touchTarget } from "@/lib/utils";

/**
 * Each size's drawn height, `h-7` and `h-9`, grown to a finger's 44pt by a `hitSlop` on device
 * (#470). Only the height: chips sit side by side, where a wider target would take a neighbour's.
 */
const DRAWN = { sm: { height: 28 }, default: { height: 36 } } as const;

/**
 * What the pointer, focus and a press add: a chosen chip a step further into the tint, an unchosen
 * one the hover fill. Only while the chip can be pressed, or a disabled chip lit up under the
 * pointer as if it could.
 */
const LIVE = {
  selected: "hover:bg-active/60 focus-visible:bg-active/60 active:bg-active/60",
  unselected: "hover:bg-hover focus-visible:bg-hover active:bg-hover",
} as const;

/**
 * A disabled chip's look. The pointer is the platform's "not allowed" on the web, where every
 * compiled pressable is otherwise `cursor: pointer`; a device has no cursor.
 */
const DISABLED = "cursor-not-allowed opacity-50";

export type ToggleChipProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children" | "className" | "style"
> & {
  selected?: boolean | undefined;
  /**
   * Replaces the chip's fill with a literal colour, chosen or not — for a chip whose own colour is
   * the content, such as a palette swatch. The edge still says whether it is chosen; the fill no
   * longer changes under the pointer or with focus. The label stays `text-foreground`, which is
   * measured against the chosen tint and not against the caller's colour: pair it with
   * `readableTextColor` if the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  size?: "sm" | "default" | undefined;
  // Re-declared rather than inherited, for the reason `button.tsx` gives:
  // nativewind types it as `className?: string`, which under
  // `exactOptionalPropertyTypes` rejects the `cond ? "x" : undefined` that call
  // sites pass.
  className?: string | undefined;
  children: React.ReactNode;
};

/** A small pill that is selected or not: a filter chip, a day-of-week toggle. */
const ToggleChip = React.forwardRef<HTMLButtonElement, ToggleChipProps>(
  (
    {
      selected = false,
      disabled = false,
      backgroundColor,
      size = "default",
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled}
      // The same two facts in the spelling the web understands. react-native-web does not read
      // `accessibilityState` — it forwards an allowlist of `aria-*` props and nothing else — so
      // without these the chip is styled but silent to a screen reader. `aria-pressed` and not
      // `aria-selected` because this is a `button`, where `aria-selected` is markup axe rejects.
      aria-pressed={selected}
      aria-disabled={disabled ?? false}
      className={cn(
        "cube-rn-view cube-rn-pressable",
        "items-center justify-center rounded-md border focus-visible:outline-none",
        // The button's `xs` and `sm` heights, so a chip sits flush beside a button or a
        // segmented control rather than 2px off it.
        size === "sm" ? "h-7 px-2" : "h-9 px-3",
        // A control's edge is /50, 3:1 on every surface: at /10 an unchosen chip was a faint box
        // beside the segmented frame. A chosen chip is the chosen tint, edged in `active` because
        // the tint is not 3:1 from the surface.
        selected ? "border-active bg-active/40" : "border-foreground/50 bg-background",
        disabled ? DISABLED : LIVE[selected ? "selected" : "unselected"],
        // The label colour on the container as well as on the `<Text>` below,
        // and that is not a duplicate. The `<Text>` is the only one native
        // reads, and it is only ever reached by a bare string; an element
        // child — an icon, a `<Badge>`, anything with its own markup — passes
        // through untouched and on web takes its colour by inheriting from
        // here.
        "text-foreground",
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      {...touchTarget(DRAWN[size])}
      {...(props as React.ComponentPropsWithoutRef<"button">)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <span
          className={cn(
            "cube-rn-text",
            "font-semibold text-foreground",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  ),
);
ToggleChip.displayName = "ToggleChip";

export { ToggleChip };
