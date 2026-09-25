/**
 * Compiled from `registry/layout/action-button.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * A button whose reason can always be read — including when it cannot be pressed. One source for
 * both platforms; `rn2web` compiles it for the DOM, where it is a `<button>` that takes `onClick`
 * and the rest of `<button>`'s props, as `Button` does.
 *
 * Two bugs, and the second is the one worth the file.
 *
 * **It has a name.** See {@link ActionButtonProps.label}.
 *
 * **Its reason survives being disabled.** These apps are full of `title="Empty the lane first"`
 * on controls disabled for exactly that reason, and shadcn's `Button` sets
 * `disabled:pointer-events-none`: the browser never fires the hover, so the one explanation a
 * person needed is the one they cannot get. A `disabled` button is also out of the tab order
 * entirely, so a keyboard user cannot reach the answer by any route at all — the control is
 * simultaneously refusing and mute.
 *
 * So `disabled` here is `aria-disabled` instead. The control keeps its focus ring, its hover and
 * its tooltip, the press is refused in the handler, and assistive technology reads it as
 * unavailable either way. Pass `hint` and the tooltip says why.
 *
 * The device has the same bug in another shape. The native tooltip opens on a long press, and a
 * `Pressable` given `disabled` hears no press of any length — so there too the reason was the one
 * thing a refused button could not say. `aria-disabled` is the device's spelling as well: TalkBack
 * and VoiceOver announce the button as unavailable, and the long press still arrives.
 *
 * The one place that falls short is react-native-web, an Expo app's web build: its `Pressable`
 * writes `aria-disabled` from its own `disabled` over the one it is handed, so there the press is
 * refused and the hint is read, but the button is not announced as unavailable. Passing
 * `disabled` would fix the announcement and bring back the bug, and the compiled half — a real
 * `<button>`, which is what a DOM app installs — has no such override.
 *
 * **Its reason is not only visual.** A tooltip's text exists in the DOM only while the tooltip
 * is open — Radix unmounts the content on close — so a `hint` that lives only there is a thing
 * you can see and cannot hear: the button announces "Delete workspace" and stops, and the
 * sentence explaining that it is refused, or what it takes with it, is never read. It is worst
 * in exactly the case the prop is for, because a person who cannot see the button is the one
 * who cannot hover it either.
 *
 * So on the web `hint` is also rendered into an `sr-only` span that is always mounted, and the
 * button points at it with `aria-describedby`. That covers the closed tooltip and one more case:
 * Radix closes a tooltip when its trigger is scrolled into view by focus, which is precisely how
 * a keyboard user arrives at one. On device a string `hint` is the button's accessibility hint,
 * which is the platform's own "read after the name"; a hint that is a node rather than a string
 * is only the tooltip there, because a node's text cannot be read back out into one.
 *
 * The description wins over the one Radix sets while open — `Slot` lets the child's props
 * override the trigger's — so the hint is announced once, from the same text, open or closed.
 *
 * **The provider.** shadcn's `Tooltip` needs a `TooltipProvider` above it and throws without
 * one, so this renders its own — a component installed from a registry cannot assume the app it
 * lands in has already put one at the root. Radix nests providers happily. On device the
 * provider is nothing, and the long press is the only delay there is.
 *
 * What nesting does *not* do is merge. A provider replaces the one above it for everything below,
 * so an app whose root is `<TooltipProvider delayDuration={300}>` gets 300ms everywhere except on
 * these buttons, which take shadcn's provider default of `0` and open the instant the pointer
 * crosses them. On a toolbar of them that reads as a flicker while every other control on the
 * screen waits. `skipDelayDuration` is lost the same way: grouping spans one provider, and this
 * one contains a single button, so moving along a row re-waits at each.
 *
 * Both are therefore props here, forwarded to the provider this renders. `delayDuration={300}`
 * matches an app's root; a wrapper that passes it once is how a project says it in one place.
 *
 * There is no inheriting the root's value automatically: Radix exposes no way to ask whether a
 * provider is already above you, so the button cannot render one only when it is needed, and
 * cannot read what the outer one was set to. Leaving these unset keeps shadcn's `0` rather than
 * finding the app's number.
 *
 * **It is `type="button"` on the web unless you say otherwise.** A `<button>` with no type is a
 * submit button, and these live inside forms by the dozen — a row of icon buttons beside the
 * fields they act on. Untyped, the trash icon beside a cron box both removes the row *and*
 * submits the form, and a stray Enter in that box submits through the first submit button in
 * tree order, which is the trash. Neither is visible in review: the call site reads as a button
 * with an `onClick`. `Button` is what types it: its compiled half is `type="button"` before the
 * caller's props, so a caller's `type` still wins.
 *
 * `disabled` makes it worse rather than better. The click path is refused in the handler, and
 * implicit submission never goes through a click — so a disabled `ActionButton` was still a live
 * submit button for the Enter key.
 *
 * A caller who wants one of these to submit can still say `type="submit"`, and now has to. On
 * device there is no form to submit and no `type` to pass.
 */
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type ActionButtonProps = Omit<ComponentProps<typeof Button>, "aria-label"> & {
  /**
   * The accessible name, and the tooltip when there is nothing more to say.
   *
   * Not optional, and that is the whole point of the component. Of the 134 icon-sized buttons
   * across these projects, 78 have no accessible name at all — they are a `<Trash2 />` inside a
   * `<Button size="icon">` and nothing else, which a screen reader announces as "button". Some
   * carry a `title`, which is a hint shown on hover, not a name: it is not read in place of one,
   * it never appears on a touch device, and it is the single most common way an icon button is
   * *believed* to be labelled. Making this a required prop is what stops the next one arriving
   * the same way, because the type is checked and a code review is not.
   */
  label: string;
  /**
   * Why it is unavailable, or what it will do — shown in the tooltip instead of `label`, and
   * read after the name whether or not the tooltip is open.
   *
   * This is the prop `disabled` exists for. See the component note. On device only a string is
   * read after the name; a node is shown in the tooltip and not read.
   */
  hint?: ReactNode | undefined;
  side?: ComponentProps<typeof TooltipContent>["side"] | undefined;
  /** Off, the button keeps its accessible name and drops the tooltip. */
  tooltip?: boolean | undefined;
  /**
   * How long the pointer must rest before the tooltip opens, in milliseconds. Web only: on
   * device the tooltip opens on a long press, which the platform times.
   *
   * Here rather than on the app's root provider because this component renders its own, and a
   * nested provider *replaces* the one above it rather than merging with it. See the component
   * note: an app with a root delay has to repeat it here, and there is no way for the button to
   * read it.
   */
  delayDuration?: ComponentProps<typeof TooltipProvider>["delayDuration"] | undefined;
  /**
   * How long after one tooltip closes that the next opens with no delay — what makes a row of
   * these feel like one control rather than several. Grouping only spans a single provider, so
   * it groups the buttons under this one, which is one button. Web only.
   */
  skipDelayDuration?: ComponentProps<typeof TooltipProvider>["skipDelayDuration"] | undefined;
  /**
   * More ids to describe the button with, kept ahead of the hint's own. Web only — a device
   * describes a control with its accessibility hint, which is what `hint` becomes there.
   */
  "aria-describedby"?: string | undefined;
};

export function ActionButton({
  label,
  hint,
  side = "top",
  tooltip = true,
  delayDuration,
  skipDelayDuration,
  disabled,
  className,
  onClick: onPress,
  children,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ActionButtonProps) {
  const hintId = useId();
  // Destructured rather than left in `props`, which is spread after this and would drop the id.
  // Only pointed at when there is a hint: with none the tooltip repeats the name, and describing
  // the button with its own name has it read as "Delete workspace, Delete workspace".
  const describedBy = hint ? [ariaDescribedBy, hintId].filter(Boolean).join(" ") : ariaDescribedBy;

  const button = (
    <Button
      aria-label={label}
      // Not `disabled`: on the web the attribute is what removes the hover and the tab stop, and
      // on device the prop is what swallows the long press — with them, the explanation.
      // `opacity-50` is what `disabled` would have drawn.
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      className={cn(disabled && "opacity-50", className)}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onPress?.(event);
      }}
      {...props}
    >
      {children}
    </Button>
  );

  // Outside the trigger, not inside the button: `TooltipTrigger asChild` takes exactly one
  // child, and text inside the button would be dead weight anyway — `aria-label` already
  // overrides the content for the name. Web only: `aria-describedby` is how the web reads it, and
  // the device has the accessibility hint instead.
  const description = hint ? (
    <span id={hintId} className="cube-rn-text sr-only text-foreground">
      {hint}
    </span>
  ) : null;

  // `tooltip={false}` drops the tooltip, not the explanation: the hint is still the reason the
  // control is the way it is, and it is still the only place a screen reader can get it.
  if (!tooltip) {
    return (
      <>
        {button}
        {description}
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={side}>{hint ?? label}</TooltipContent>
      </Tooltip>
      {description}
    </TooltipProvider>
  );
}
