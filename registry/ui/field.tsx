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
import { Text, View } from "react-native";
import { Label } from "@/components/ui/label";
import type { LabelProps } from "@/components/ui/label-base";
import { cn } from "@/lib/utils";

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
    <View role="group" className={cn(fieldVariants({ orientation }), className)}>
      {children}
    </View>
  );
}

function FieldLabel({ className, ...props }: LabelProps) {
  return <Label className={className} {...props} />;
}

function FieldDescription({ id, className, children }: SectionProps) {
  return (
    <Text id={id} className={cn("text-muted-foreground text-sm", className)}>
      {children}
    </Text>
  );
}

function FieldError({ id, className, children }: SectionProps) {
  if (!children) return null;
  return (
    <Text id={id} role="alert" className={cn("text-destructive text-sm font-medium", className)}>
      {children}
    </Text>
  );
}

function FieldGroup({ className, children }: SectionProps) {
  return <View className={cn("flex-col gap-4", className)}>{children}</View>;
}

/**
 * The label column of a horizontal field: label, description and error stacked
 * beside the control rather than under it, so a description's second line starts
 * under the label and not under the checkbox.
 */
function FieldContent({ id, className, children }: SectionProps) {
  return (
    <View id={id} className={cn("min-w-0 flex-1 flex-col gap-1.5", className)}>
      {children}
    </View>
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
    <Text id={id} className={cn("text-foreground text-sm font-medium", className)}>
      {children}
    </Text>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle };
