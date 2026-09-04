/**
 * The half of the field API that a rendered story cannot check: `name` is checked against the
 * form's values, and a validator's `value` is narrowed to the field it validates.
 *
 * This file is never rendered. It is a test that runs under `tsc --noEmit`, and every
 * `@ts-expect-error` in it fails the build if the error it expects stops happening — which is how
 * a type guarantee is asserted rather than described.
 */

import {
  InputField,
  SelectField,
  SwitchField,
  useAppForm,
} from "@/registry/new-york/form/app-form";

export function AppFormTypeAssertions() {
  const form = useAppForm({
    defaultValues: { title: "", count: 0, live: false, kind: "a", nested: { deep: "" } },
    onSubmit: ({ value }) => console.log(value),
  });

  return (
    <>
      <InputField form={form} name="title" label="Title" required placeholder="hi" />
      <InputField form={form} name="count" type="number" label="Count" />
      <InputField form={form} name="nested.deep" label="Deep" />
      <SwitchField form={form} name="live" label="Live" />
      <SelectField form={form} name="kind" label="Kind" options={[{ label: "A", value: "a" }]} />
      <InputField
        form={form}
        name="title"
        label="Described"
        description="From the schema."
        descriptionPlacement="popover"
      />
      <InputField
        form={form}
        name="count"
        label="Validated"
        validators={{
          // `value` is `number` here, narrowed from the form's values and the field name.
          onChange: ({ value }) => (value > 10 ? "Too many" : undefined),
        }}
      />
      <InputField
        form={form}
        name="title"
        label="Wrong validator"
        validators={{
          // @ts-expect-error `value` is a string on this field, so `.toFixed` is not on it
          onChange: ({ value }) => value.toFixed(2),
        }}
      />
      {/* @ts-expect-error a name that is not on the form is a type error */}
      <InputField form={form} name="naem" label="Typo" />
      {/* @ts-expect-error loadingClassName is a field prop; nonsense is not */}
      <InputField form={form} name="title" nonsenseProp="x" />
    </>
  );
}
