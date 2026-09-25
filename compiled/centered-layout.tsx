/**
 * Compiled from `registry/layout/centered-layout.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * The page that is one card in the middle of the screen — a sign-in, a token gate, a "check your
 * email" — written once here and compiled for the web by `scripts/rn2web`.
 *
 * Every app here that has a sign-in wrote this out by hand: a full-height box, centred both ways,
 * a little padding so the card never touches the edge of a phone, and a card capped at `max-w-sm`.
 * The card is `CardLayout`, not a second copy of it, so every slot a card takes is taken here with
 * the same name and the same placement.
 *
 * The root is a different element on each platform, written as a `Platform.OS` branch the compiler
 * folds, the way `HeaderContentFooter`'s body is:
 *
 * - on the web it is a `<main>` at least as tall as the viewport (`min-h-svh`, not `min-h-screen`,
 *   so a phone browser's collapsing toolbar does not push the card off centre);
 * - on device it is a `ScrollView` that fills the screen (`flex-1`) and centres its content
 *   container, because the card on these screens holds a form: when the keyboard comes up, a
 *   plain view would leave the submit button under it with no way to reach it. The scroll view
 *   takes the keyboard's inset on iOS and keeps a tap on the button from being spent dismissing
 *   the keyboard. Android resizes the window for the keyboard itself.
 */
import type { ReactNode } from "react";
import { CardLayout, type CardLayoutProps } from "@/components/card-layout";
import { cn } from "@/lib/utils";

export type CenteredLayoutProps = Omit<CardLayoutProps, "className"> & {
  /** The body of the card: the form, the message. */
  content?: ReactNode | undefined;
  /**
   * The root — the full-height box the card is centred in. A background, or a different padding.
   * On device it styles the scroll view's content container, which is the box that fills the
   * screen and does the centring.
   */
  className?: string | undefined;
  /**
   * The card. It is `w-full max-w-sm`; pass `max-w-md` here for a wider one, which replaces the
   * cap rather than competing with it.
   */
  cardClassName?: string | undefined;
};

/** The box both roots centre in, and the padding that keeps the card off the screen's edge. */
const CENTRE = "items-center justify-center p-4";

/** The card's width: all of a phone, a sign-in card's width anywhere wider. */
const CARD = "w-full max-w-sm";

/**
 * A single card, centred both ways on a page of its own.
 *
 * Takes every slot `CardLayout` takes — `title`, `description`, `icon`, `action`, `content`,
 * `footer`, `footerActions` and the rest — and hands them to it unchanged. `className` is the page
 * around the card; `cardClassName` is the card.
 */
export function CenteredLayout({ className, cardClassName, ...card }: CenteredLayoutProps) {
  const body = <CardLayout {...card} className={cn(CARD, cardClassName)} />;
  return (
    <main
      data-slot="centered-layout"
      className={cn("cube-rn-view", "min-h-svh w-full", CENTRE, className)}
    >
      {body}
    </main>
  );
}
