import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";
import { FormField } from "@/registry/new-york/form/form-field";
import { Button } from "@/registry/new-york/ui/button";
import { Checkbox } from "@/registry/new-york/ui/checkbox";
import { Input } from "@/registry/new-york/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york/ui/select";
import { Switch } from "@/registry/new-york/ui/switch";
import { Textarea } from "@/registry/new-york/ui/textarea";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

/** Everything `FormField` draws, minus the two parts a bound field works out for itself. */
type FieldProps = Omit<ComponentProps<typeof FormField>, "control" | "error">;

/**
 * The keys above, as values, so a call site can spread control props and field props into one
 * flat list — `<field.InputField label="Title" placeholder="What needs to be done?" />` — and
 * still have both halves typed. The alternative is nesting one of them under a prop of its own,
 * which reads worse at every call site to save this list.
 *
 * A key added to `FormField` and forgotten here lands on the control instead, where React will
 * say so: `loadingClassName` is not an attribute of `<input>`.
 */
const FIELD_KEYS = new Set<string>([
  "label",
  "description",
  "required",
  "action",
  "loading",
  "htmlFor",
  "orientation",
  "className",
  "labelClassName",
  "descriptionClassName",
  "errorClassName",
  "loadingClassName",
]);

function splitProps<T>(props: FieldProps & T): [FieldProps, T] {
  const field: Record<string, unknown> = {};
  const control: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FIELD_KEYS.has(key)) {
      field[key] = value;
    } else {
      control[key] = value;
    }
  }
  return [field as FieldProps, control as T];
}

function messageOf(error: unknown): string | undefined {
  if (error == null) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/**
 * The field's first error, or nothing — and *when* is most of what this does.
 *
 * A form that reports every empty required field the moment it renders is a form that opens
 * covered in red, so a message waits until the field has been touched or the form has been
 * submitted at least once. That rule is the same for every field in every form here, which is
 * exactly why it belongs in one place: it is the thing each hand-written field decided
 * differently, and the reason two fields on one screen disagree about when they turn red.
 */
function useFieldError(): string | undefined {
  const field = useFieldContext();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isTouched = useStore(field.store, (state) => state.meta.isTouched);
  const attempts = useStore(field.form.store, (state) => state.submissionAttempts);

  if (!isTouched && attempts === 0) return undefined;
  return messageOf(errors[0]);
}

type InputFieldProps = FieldProps &
  Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur">;

/** A text input. `type="number"` writes a number back to the store, not a numeric string. */
export function InputField(props: InputFieldProps) {
  const [fieldProps, input] = splitProps(props);
  const field = useFieldContext<string | number | null>();
  const error = useFieldError();

  return (
    <FormField
      {...fieldProps}
      error={error}
      control={
        <Input
          {...input}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(event) => {
            const { value } = event.target;
            field.handleChange(
              input.type === "number" ? (value === "" ? null : Number(value)) : value,
            );
          }}
        />
      }
    />
  );
}

/**
 * The box a `<Textarea rows={n}>` rests at, as literal classes — a composed `h-[${…}px]` would
 * be a class name Tailwind never generated, because the scanner reads source text.
 *
 * Approximate on purpose: within a few pixels is all a skeleton needs to be, and a field wanting
 * exactness passes its own `loadingClassName`.
 */
const TEXTAREA_BOX: Record<number, string | undefined> = {
  2: "h-16",
  3: "h-20",
  4: "h-24",
  5: "h-30",
  6: "h-34",
};

type TextareaFieldProps = FieldProps &
  Omit<ComponentProps<typeof Textarea>, "id" | "value" | "onChange" | "onBlur">;

export function TextareaField(props: TextareaFieldProps) {
  const [fieldProps, textarea] = splitProps(props);
  const field = useFieldContext<string>();
  const error = useFieldError();

  return (
    <FormField
      // A textarea is taller than the box `FormField` draws by default, and the field is the one
      // that knows its own `rows` — so the loading skeleton is sized here rather than at the
      // twenty call sites that would each have to remember.
      loadingClassName={TEXTAREA_BOX[textarea.rows ?? 0] ?? "h-16"}
      {...fieldProps}
      error={error}
      control={
        <Textarea
          {...textarea}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      }
    />
  );
}

type SelectOption = { label: ReactNode; value: string };

type SelectFieldProps = FieldProps & {
  options: readonly SelectOption[];
  placeholder?: string;
  triggerClassName?: string;
};

/**
 * The one that needs `FormField`'s function form. `Select`'s root renders no DOM, so the id and
 * the aria attributes go on the trigger — which is the detail every hand-written select field in
 * these apps gets wrong, silently, leaving a trigger with no `aria-invalid` and an error message
 * nothing points at.
 */
export function SelectField({ options, placeholder, triggerClassName, ...rest }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const error = useFieldError();

  return (
    <FormField
      {...rest}
      error={error}
      control={(wired) => (
        <Select value={field.state.value ?? ""} onValueChange={field.handleChange}>
          <SelectTrigger
            {...wired}
            onBlur={field.handleBlur}
            className={triggerClassName ?? "w-full"}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

type CheckboxFieldProps = FieldProps &
  Omit<ComponentProps<typeof Checkbox>, "id" | "checked" | "onCheckedChange" | "onBlur">;

/** Horizontal by default: a 16px box on a line of its own above its caption is not a field. */
export function CheckboxField(props: CheckboxFieldProps) {
  const [fieldProps, checkbox] = splitProps(props);
  const field = useFieldContext<boolean>();
  const error = useFieldError();

  return (
    <FormField
      orientation="horizontal"
      {...fieldProps}
      error={error}
      control={
        <Checkbox
          {...checkbox}
          checked={field.state.value ?? false}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
        />
      }
    />
  );
}

type SwitchFieldProps = FieldProps &
  Omit<ComponentProps<typeof Switch>, "id" | "checked" | "onCheckedChange" | "onBlur">;

export function SwitchField(props: SwitchFieldProps) {
  const [fieldProps, control] = splitProps(props);
  const field = useFieldContext<boolean>();
  const error = useFieldError();

  return (
    <FormField
      orientation="horizontal"
      loadingClassName="h-5 w-8 rounded-full"
      {...fieldProps}
      error={error}
      control={
        <Switch
          {...control}
          checked={field.state.value ?? false}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
      }
    />
  );
}

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type" | "disabled" | "children"> & {
  children?: ReactNode;
  /** What it says mid-flight. The label is replaced, not appended to. */
  pendingLabel?: ReactNode;
};

/**
 * The submit, with the double-submit guard already in it.
 *
 * Every form in the source apps wrote `disabled={isSubmitting}` by hand and roughly half of them
 * forgot `canSubmit`, so an invalid form submitted anyway and failed at the server. Both come
 * off the form store, and there is one of these.
 */
export function SubmitButton({
  children = "Save",
  pendingLabel = "Saving…",
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" disabled={!canSubmit || isSubmitting} {...props}>
      {isSubmitting ? pendingLabel : children}
    </Button>
  );
}

/**
 * `useAppForm` — the hook a form calls, with these components hanging off its fields.
 *
 * ```tsx
 * const form = useAppForm({ defaultValues: { title: "" }, onSubmit: ({ value }) => save(value) });
 *
 * <form.AppField name="title">
 *   {(field) => <field.InputField label="Title" required />}
 * </form.AppField>
 * ```
 *
 * The point of the layer is that the call site above holds no id, no `aria-describedby`, no
 * "has this been touched yet" and no error plumbing — which is four lines per field, times every
 * field in every form.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    InputField,
    TextareaField,
    SelectField,
    CheckboxField,
    SwitchField,
  },
  formComponents: { SubmitButton },
});
