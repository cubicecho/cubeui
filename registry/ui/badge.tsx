/**
 * A small pill stating what something is or what state it is in — and, with no
 * label, the dot that stands for the same thing in a row too tight for words.
 * `badge.web.tsx` is the web counterpart and `badge-base.ts` holds the contract
 * and the class maps they share.
 *
 * This is the merge of two vocabularies. It keeps shadcn's variant names with
 * shadcn's meanings, so a DOM call site ports over unchanged and
 * `variant="secondary"` still means what it meant there. It adds `success` and
 * `warning`, which the shadcn token set has no answer for at all: that set
 * carries exactly one semantic colour, `destructive`. The two additions are
 * palette colours chosen to sit beside it rather than tokens, because promoting
 * them to `--success` / `--warning` would put this repo's `:root` block out of
 * step with cubeui's while the two still have to agree. That promotion is a
 * later edit to `tokens/palette.mjs` and the class maps; it does not reach a
 * single call site, which is why it can wait.
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
 * native does not inherit it. So each string or number among the children is
 * wrapped in its own `<Text>` carrying the label class, and an element — an
 * icon — is rendered as it is. shadcn's `asChild` is web only; see `button.tsx`'s
 * header for why it goes the other way round on native.
 */
import { Children } from "react";
import { Text, View } from "react-native";
import {
  type BadgeProps,
  type BadgeVariant,
  badgeContainerVariants,
  badgeHasLabel,
  badgeTextFallback,
  badgeTextVariants,
  badgeVariants,
} from "@/components/ui/badge-base";
import { cn } from "@/lib/utils";

export type { BadgeProps, BadgeVariant };

export function Badge({
  variant = "default",
  backgroundColor,
  textColor,
  className,
  label,
  children,
}: BadgeProps) {
  const shape = badgeHasLabel(children) ? "pill" : "dot";
  const textClass = backgroundColor ? badgeTextFallback : badgeTextVariants({ variant });

  return (
    <View
      // Yoga stretches a child across a column and has no fit-content to stop it, so on native the
      // badge pins itself to the start. In a centred row, pass `className="self-center"`.
      className={cn("self-start", badgeContainerVariants({ variant, shape }), className)}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
      // A dot carries meaning and no text, so it is named or it is decoration;
      // the same split `color-dot` makes, for the same reason.
      {...(shape === "dot"
        ? label
          ? ({ role: "img", "aria-label": label } as const)
          : ({ "aria-hidden": true } as const)
        : {})}
    >
      {shape === "pill"
        ? Children.map(children, (child) =>
            typeof child === "string" || typeof child === "number" ? (
              <Text className={textClass} {...(textColor ? { style: { color: textColor } } : {})}>
                {child}
              </Text>
            ) : (
              child
            ),
          )
        : null}
    </View>
  );
}

export { badgeVariants };
