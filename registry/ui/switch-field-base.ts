/**
 * The contract `switch-field.tsx` (native) and `switch-field.web.tsx` (DOM) both implement. Its own
 * module because Metro resolves `./switch-field` to `switch-field.web.tsx` on web — the web file
 * would otherwise import itself.
 */
export type SwitchFieldProps = {
  /** The switch's id. On web it is also what the caption's `<label htmlFor>` points at. */
  id: string;
  label: string;
  /**
   * A line under the caption: what the switch does, or why it cannot be changed. On web it is the
   * switch's description (`aria-describedby`), so the reason a switch is disabled is read with it.
   */
  description?: string | undefined;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The switch cannot be changed, and the caption is muted. `description` is where to say why. */
  disabled?: boolean | undefined;
  className?: string | undefined;
  labelClassName?: string | undefined;
};

/** The caption's type, shared so the two halves cannot drift on it. */
export const SWITCH_FIELD_LABEL_CLASS = "text-sm text-foreground/60";

/** The line under it. Not muted with the caption: it is what explains a disabled switch. */
export const SWITCH_FIELD_DESCRIPTION_CLASS = "font-normal text-foreground/60 text-xs";

/** The ids the caption and the description carry, from the switch's own. */
export const switchFieldIds = (id: string) => ({
  labelId: `${id}-label`,
  descriptionId: `${id}-description`,
});
