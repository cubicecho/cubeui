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
  NumberField,
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
      <NumberField form={form} name="count" label="Count" min={0} step={5} />
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
      <NumberField
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
      {/* @ts-expect-error `count` is a number, so the string fields will not take it */}
      <InputField form={form} name="count" label="Wrong type" />
      {/* @ts-expect-error and `title` is a string, so the number field will not take it */}
      <NumberField form={form} name="title" label="Wrong type" />
      {/* @ts-expect-error a boolean field is not a select either */}
      <SelectField form={form} name="live" label="Wrong type" options={[]} />
      {/* @ts-expect-error loadingClassName is a field prop; nonsense is not */}
      <InputField form={form} name="title" nonsenseProp="x" />
    </>
  );
}

/**
 * The workaround for a form value that contains itself, pinned.
 *
 * A store whose type is recursive — a step with branches, a branch with steps — makes
 * `DeepKeys<TFormData>` fail to terminate, and TypeScript reports the TS2589 at the *first field
 * in the form* rather than at the recursive value. Declaring that one value `unknown` stops the
 * walk, and this whole file failing to compile is what says so: if the shape stops working, or
 * stops being necessary, the note in `forms.md` is wrong and this is the build error saying it.
 */
interface DraftStep {
  id: string;
  branches: DraftBranch[];
}
interface DraftBranch {
  case: string;
  steps: DraftStep[];
}

interface FlowValues {
  name: string;
  live: boolean;
  /** `unknown`, not `DraftStep[]`: a step contains steps, and `DeepKeys` cannot walk that. */
  steps: unknown;
}

export function RecursiveValueAssertions() {
  // Annotated rather than `satisfies FlowValues`. `satisfies` checks the literal and then infers
  // from the literal, so the form's values would still be the recursive type and the error would
  // not move — the declaration only takes effect through the annotation.
  const defaults: FlowValues = { name: "", live: false, steps: [] as DraftStep[] };

  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => console.log(value),
  });

  return (
    <>
      {/* The rest of the store keeps its checked names — this is what `unknown` buys. */}
      <InputField form={form} name="name" label="Name" required />
      <SwitchField form={form} name="live" label="Live" />
      {/* @ts-expect-error and a typo is still a typo beside a recursive value */}
      <InputField form={form} name="nmae" label="Typo" />

      {/* The subtree keeps its real type at the one place it is edited, behind one cast. */}
      <form.Field name="steps">
        {(field) => <span>{(field.state.value as DraftStep[]).length} steps</span>}
      </form.Field>
    </>
  );
}
