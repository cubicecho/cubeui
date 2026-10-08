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
 * A button whose reason can always be read, including when it cannot be pressed.
 *
 * `disabled` here is `aria-disabled`: the button keeps its focus, its hover and its tooltip, and
 * the press is refused in the handler. A truly disabled button fires no hover and leaves the tab
 * order, so the `hint` saying why it is refused could not be reached. Under react-native-web the
 * press is refused and the hint is read, but the button is not announced as unavailable.
 *
 * On the web `hint` is also rendered into an always-mounted `sr-only` span the button points at
 * with `aria-describedby`, because Radix unmounts a closed tooltip. On device a string `hint` is
 * the accessibility hint.
 *
 * The button renders its own `TooltipProvider`, since an installed component cannot assume the
 * app has one. A nested provider replaces the outer one's timing, so `delayDuration` and
 * `skipDelayDuration` are props here. On the web it is `type="button"` unless the caller says
 * otherwise, and a disabled one would still submit on Enter without it.
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
    />
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
  if (tooltip === false) {
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
