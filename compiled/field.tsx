/**
 * Compiled from `registry/ui/field.tsx` by `scripts/rn2web`.
 * Do not edit — edit the source and re-run `npm run compile`.
 *
 * The prose below is the source's own, carried across untouched, which is the property that makes
 * a compiled registry worth having: this is the same component, not a second one to keep in step
 * by hand. Where a comment names a React Native component it is describing the source; the
 * element map in `scripts/rn2web/tables.mjs` says what that became here.
 */

/**
 * Field chrome — the label/description/error furniture around a control.
 *
 * Shared, with no `.web.tsx`: none of it does anything a `<div>` did that a
 * `View` cannot. The one thing lost in the conversion is the
 * `group-data-[disabled=true]/field:` variant `FieldLabel` used to carry —
 * `data-*` attributes and group variants are DOM-only, and a compiled web build
 * is where that would come back, not a hand-written override.
 */
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type { LabelProps } from "@/components/ui/label-base";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type SectionProps = {
  /**
   * `ui/form.tsx` wires `aria-describedby` from the control to the description
   * and the error, so both need to carry one. React Native takes `id` as a
   * cross-platform prop and react-native-web renders it as the DOM attribute.
   */
  id?: string | undefined;
  className?: string | undefined;
  children?: ReactNode;
};

const fieldVariants = cva("w-full gap-2", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

function Field({
  className,
  orientation = "vertical",
  children,
}: SectionProps & VariantProps<typeof fieldVariants>) {
  return (
    // The `role` is hand-written because a `<fieldset>` has no native counterpart.
    <div role="group" className={cn("cube-rn-view", fieldVariants({ orientation }), className)}>
      {children}
    </div>
  );
}

function FieldLabel({ className, ...props }: LabelProps) {
  return <Label className={className} {...props} />;
}

function FieldDescription({ id, className, children }: SectionProps) {
  return (
    <span id={id} className={cn("cube-rn-text", "text-muted-foreground text-sm", className)}>
      {children}
    </span>
  );
}

function FieldError({ id, className, children }: SectionProps) {
  if (!children) return null;
  return (
    <span
      id={id}
      role="alert"
      className={cn("cube-rn-text", "text-destructive text-sm font-medium", className)}
    >
      {children}
    </span>
  );
}

function FieldGroup({ className, children }: SectionProps) {
  return <div className={cn("cube-rn-view", "flex-col gap-4", className)}>{children}</div>;
}

/**
 * The label column of a horizontal field: label, description and error stacked
 * beside the control rather than under it, so a description's second line starts
 * under the label and not under the checkbox.
 */
function FieldContent({ id, className, children }: SectionProps) {
  return (
    <div id={id} className={cn("cube-rn-view", "min-w-0 flex-1 flex-col gap-1.5", className)}>
      {children}
    </div>
  );
}

/**
 * A field's name where a `<label>` would be wrong — a radio group or a checkbox
 * set, where the name belongs to the group and each control has its own label.
 * Same type as `FieldLabel`, no `htmlFor`: the group is named by
 * `aria-labelledby` pointing at this `id`.
 */
function FieldTitle({ id, className, children }: SectionProps) {
  return (
    <span id={id} className={cn("cube-rn-text", "text-foreground text-sm font-medium", className)}>
      {children}
    </span>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle };
