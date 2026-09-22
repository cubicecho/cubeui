/**
 * The contract `switch.tsx` (native) and `switch.web.tsx` (radix) both
 * implement. Its own module because Metro resolves `./switch` to
 * `switch.web.tsx` on web — the web file would otherwise import itself.
 *
 * Controlled or not, as radix's is. The web half takes radix's whole
 * `Switch.Root` surface on top of this — `name`, `value`, `required`, the
 * `aria-*` props, shadcn's `size` — because it installs over a DOM app's
 * shadcn switch; this is the part that means something on both platforms.
 */
export type SwitchProps = {
  checked?: boolean | undefined;
  /** Where an uncontrolled switch starts. Ignored once `checked` is passed. */
  defaultChecked?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** Web only: what a `<label htmlFor>` points at. */
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** See `checkbox-base.ts`: a bound field marks itself touched from this. */
  onBlur?: (() => void) | undefined;
  className?: string | undefined;
};

/** Shared between the two files so the track cannot drift between platforms. */
export const SWITCH_TRACK_CLASS =
  "h-5 w-9 shrink-0 flex-row items-center rounded-full border-2 border-transparent";
export const SWITCH_THUMB_CLASS = "h-4 w-4 rounded-full bg-background";
