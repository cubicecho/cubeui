/**
 * A callout: a tinted, bordered box with an icon, a title, a line under it and an optional action —
 * "this key will not be shown again", "the embedder fell back to hashing", "the last run failed".
 * One source for both platforms; `rn2web` compiles it for the DOM.
 *
 * It is here because nine projects drew it by hand, thirteen times, and no two agreed: an
 * `amber-500/50` border in one, `amber-200` in the next, `amber-400` in a third; `role="alert"`,
 * `role="status"`, `role="note"` or nothing; and the React Native copies needing `dark:` twins for
 * every colour because they tinted with the palette's 50s and 950s. None of them was shadcn's
 * `Alert`, so taking the name costs no call site anything.
 *
 * The parts are props, not children, as everywhere in this registry: `icon`, `title`,
 * `description`, `action`. A callout is one self-closing element whose props read as its parts.
 *
 * **The tint is the only thing the variant colours besides the icon.** The title and the line
 * under it are `text-foreground` on every tinted variant, because coloured text on a 10% tint of
 * the same colour is under 4.5:1 — `text-destructive` on `bg-destructive/10` is about 4.1, and the
 * muted grey the hand-written copies used under their titles is about 4.2 on the amber. The icon
 * carries the hue, and it is a graphic, so it needs 3:1 against the tint on both themes.
 * Only `default`, which sits on `bg-card`, keeps the muted line.
 *
 * `info` and `warning` are the palette's `sky-600` and `amber-700` rather than tokens, for the
 * reason `badge.tsx`'s header gives: the shadcn token set has one semantic colour, `destructive`,
 * and promoting the others is a later edit to `tokens/palette.mjs` that reaches no call site. One
 * shade gives the tint, the border and the icon, so it is the one whose icon clears 3:1 on its own
 * tint in light *and* dark: the 500s the copies used are 2.2 and 2.8:1 on white, `amber-600` misses on
 * the light tint and `sky-700` on the dark one.
 *
 * **The role is chosen by the variant, and only `destructive` is an `alert`.** `role="alert"` is
 * an assertive live region: a screen reader interrupts whatever it is saying to read it, and some
 * read it on page load. That is right for "saving failed" and wrong for "store this token
 * securely", which is most of what a callout says. So `destructive` is `alert`, and `default`,
 * `info` and `warning` are `status` — polite: read when it appears or changes, after the reader
 * finishes the sentence it is on. shadcn puts `role="alert"` on every variant; the copies here
 * that did the same were the embedder banners, which are exactly the static notice it is too loud
 * for.
 *
 * Native inherits nothing, so every `Text` names its colour and the border names its own, and the
 * default icon's ink reaches it through `IconClassContext`. On the web the icon's size comes from
 * `[&_svg]` on its box and its colour from `currentColor`, the way `Button` does it.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { CircleAlert, Info, TriangleAlert } from "@/components/ui/icons";
import { IconClassContext } from "@/components/ui/icons-base";
import { cn } from "@/lib/utils";

export type AlertVariant = "default" | "info" | "warning" | "destructive";

export type AlertProps = {
  /**
   * What kind of notice it is, which sets the tint, the icon and the role. `destructive` is an
   * error the reader has to hear now and is announced as an `alert`; the others are a `status`.
   */
  variant?: AlertVariant | undefined;
  /**
   * Before the title. A bare `<RefreshCw />`; the alert sizes it and gives it the variant's ink.
   * Left out, the variant's own glyph is drawn — `Info`, `TriangleAlert` or `CircleAlert`. `null`
   * draws no icon at all, and the text moves to the edge.
   */
  icon?: ReactNode | undefined;
  /** What happened, in a few words: "API key generated", "Last error". */
  title?: ReactNode | undefined;
  /** The line under the title: what it means, or what to do about it. A link may sit inside it. */
  description?: ReactNode | undefined;
  /** The far end: one button that deals with it — "Change the embedder", "Retry". */
  action?: ReactNode | undefined;
  className?: string | undefined;
};

/** The box: the tint and the border that names its colour, per variant. */
const ALERT_SURFACE = {
  default: "border border-border bg-card",
  info: "border border-sky-600/40 bg-sky-600/10",
  warning: "border border-amber-700/40 bg-amber-700/10",
  destructive: "border border-destructive/40 bg-destructive/10",
} satisfies Record<AlertVariant, string>;

/** The icon's colour, and the only place the variant's hue reaches something drawn. */
const ALERT_ICON_INK = {
  default: "text-foreground",
  info: "text-sky-600",
  warning: "text-amber-700",
  destructive: "text-destructive",
} satisfies Record<AlertVariant, string>;

/** The line under the title. Muted only on the card, where muted is still 4.5:1. */
const ALERT_DESCRIPTION_INK = {
  default: "text-muted-foreground",
  info: "text-foreground",
  warning: "text-foreground",
  destructive: "text-foreground",
} satisfies Record<AlertVariant, string>;

/** The variant's own glyph, for when the caller passes no `icon`. */
function defaultIcon(variant: AlertVariant): ReactNode {
  if (variant === "destructive") return <CircleAlert />;
  if (variant === "warning") return <TriangleAlert />;
  return <Info />;
}

export function Alert({
  variant = "default",
  icon,
  title,
  description,
  action,
  className,
}: AlertProps) {
  const glyph = icon === undefined ? defaultIcon(variant) : icon;
  const ink = ALERT_ICON_INK[variant];

  return (
    <View
      testID="alert"
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "w-full min-w-0 flex-row items-start gap-3 rounded-lg px-4 py-3",
        ALERT_SURFACE[variant],
        className,
      )}
    >
      {glyph ? (
        <View
          testID="alert-icon"
          aria-hidden
          className={cn(
            "mt-0.5 shrink-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            ink,
          )}
        >
          <IconClassContext.Provider value={cn("size-4 shrink-0", ink)}>
            {glyph}
          </IconClassContext.Provider>
        </View>
      ) : null}
      <View className="min-w-0 flex-1 gap-1">
        {title ? (
          <Text testID="alert-title" className="font-medium text-foreground text-sm">
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text
            testID="alert-description"
            className={cn("text-sm", ALERT_DESCRIPTION_INK[variant])}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <View testID="alert-action" className="shrink-0 self-center">
          {action}
        </View>
      ) : null}
    </View>
  );
}
