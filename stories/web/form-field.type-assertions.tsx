/**
 * What `FormField` hands the function form of `controlSlot` is exported by name (#361), so a helper
 * that passes the wiring on (a row of inputs where one carries the field's id and error) declares
 * it with the registry's own type, not a copy that drifts the next time the shell wires something.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`.
 */

import { type ControlProps, type FieldParts, FormField } from "@/components/form-field";

/** A control that takes the shell's wiring through a helper. */
function WiredInput({ wired, parts }: { wired: ControlProps; parts: FieldParts }) {
  return <input {...wired} data-label={parts.labelId} />;
}

export function FormFieldTypeAssertions() {
  return (
    <FormField
      label="Webhook"
      controlSlot={(props, parts) => <WiredInput wired={props} parts={parts} />}
    />
  );
}
