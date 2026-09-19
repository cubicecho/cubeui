/**
 * A small pill stating what something is or what state it is in — and, with no
 * label, the dot that stands for the same thing in a row too tight for words.
 *
 * This is the merge of two vocabularies. It keeps shadcn's four variant names
 * with shadcn's meanings, so a DOM call site ports over unchanged and
 * `variant="secondary"` still means what it meant there. It adds `success` and
 * `warning`, which the shadcn token set has no answer for at all: that set
 * carries exactly one semantic colour, `destructive`. The two additions are
 * palette colours chosen to sit beside it rather than tokens, because promoting
 * them to `--success` / `--warning` would put this repo's `:root` block out of
 * step with cubeui's while the two still have to agree. That promotion is a
 * later edit to `tokens/palette.mjs` and this file's class map; it does not
 * reach a single call site, which is why it can wait.
 *
 * The two shades are the 700s and not the friendlier 500s or 600s because white
 * on `green-600` is 3.22:1 and white on `amber-500` is 2.13:1 — both short of
 * the 4.5:1 that 12px text needs, and both caught by the axe run behind
 * `stories/accessible-state.stories.tsx` rather than by eye. The 700s clear it
 * at 4.95 and 5.03, which puts them beside `destructive`'s own 4.77. Brightening
 * either one back is what that story exists to stop.
 *
 * **No children collapses the pill into a dot.** Same variant, same meaning,
 * no room needed — a list row that cannot spare the width for "Overdue" shows
 * the amber dot instead, and both come from one prop. This does not overlap
 * `color-dot`: that one takes a literal colour string for a category whose hue
 * is user-chosen data, and this one takes a semantic variant. Same pixels,
 * different input.
 *
 * Colour is split across the container and the `<Text>` for the usual reason:
 * native does not inherit it. `children` is a `string` rather than a
 * `ReactNode` for the same reason — the text class has to land on a `<Text>`,
 * and there is nowhere to put it if the caller passes an element. shadcn's
 * `asChild` is not here either; see `button.tsx`'s header for why it goes the
 * other way round on native.
 */
import { cva } from "class-variance-authority";
import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

/**
 * `shape` is derived from whether a label was passed, not taken as a prop —
 * a dot is what a badge with nothing to say already is, and making it a second
 * axis would allow the two states that mean nothing: a dot with a label it
 * cannot show, and an empty pill.
 */
const badgeVariants = cva("shrink-0 self-start rounded-full border border-transparent", {
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border-border bg-transparent",
      success: "bg-green-700",
      warning: "bg-amber-700",
    },
    shape: {
      pill: "flex-row items-center justify-center gap-1 px-2 py-0.5",
      dot: "h-2 w-2",
    },
  },
  defaultVariants: { variant: "default", shape: "pill" },
});

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-white",
      outline: "text-foreground",
      success: "text-white",
      warning: "text-white",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeProps = {
  variant?: BadgeVariant;
  /**
   * Overrides the variant's background with a literal colour — for a badge
   * standing in for a user-chosen tag or category. Passing it also drops the
   * variant's label colour, since the caller's background is unknown and
   * `text-primary-foreground` would be a guess. Pair it with `readableTextColor`
   * when the label has to stay legible on an arbitrary hue.
   */
  backgroundColor?: string | undefined;
  className?: string | undefined;
  /**
   * What the dot stands for, exposed as its accessible name. Ignored in the
   * pill form, where the label is already the name.
   */
  label?: string | undefined;
  /** Absent — including an empty string — collapses the badge to a dot. */
  children?: string | undefined;
};

export function Badge({
  variant = "default",
  backgroundColor,
  className,
  label,
  children,
}: BadgeProps) {
  const shape = children ? "pill" : "dot";

  return (
    <View
      className={cn(badgeVariants({ variant, shape }), className)}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      // A dot carries meaning and no text, so it is named or it is decoration;
      // the same split `color-dot` makes, for the same reason.
      {...(shape === "dot"
        ? label
          ? ({ role: "img", "aria-label": label } as const)
          : ({ "aria-hidden": true } as const)
        : {})}
    >
      {children ? (
        <Text
          className={
            backgroundColor ? "text-xs font-medium text-foreground" : badgeTextVariants({ variant })
          }
        >
          {children}
        </Text>
      ) : null}
    </View>
  );
}
