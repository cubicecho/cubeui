import type { ReactNode } from "react";
import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/registry/new-york/ui/field";
import { Skeleton } from "@/registry/new-york/ui/skeleton";

/**
 * The box the absent control leaves behind while it is loading, per orientation: a `vertical`
 * field holds an `Input`, a `Select` trigger or a `DatePicker`, all of which rest at `h-9`; a
 * `horizontal` one holds the 16px box of a checkbox or the 18px pill of a switch.
 *
 * A skeleton that is not the height of what replaces it is a page that jumps when the data lands,
 * which is the whole reason to draw one.
 */
const LOADING_BOX = {
  vertical: "h-9 w-full rounded-md",
  horizontal: "size-4 rounded-[4px]",
} as const;

/**
 * What the shell wires onto the control, handed straight to the caller when `control` is a
 * function. The names are the DOM's, so the whole object spreads onto an element.
 */
type ControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  "aria-required": true | undefined;
};

type FormFieldProps = {
  /**
   * The control itself — one `<Input>`, `<Textarea>`, `<Checkbox>`, `<Switch>`.
   *
   * The one body in this set not called `content`, because it is the one body that is not merely
   * placed. The shell clones it to hand it the `id` the label points at, the `aria-describedby`
   * that reaches the description and the error, and the `aria-invalid` the shadcn primitives
   * already draw their red ring from. That contract — a single element that forwards its props
   * to a form control — is what the name carries. `content` would promise that any nodes fit,
   * and a `<div>` holding two inputs would take the `id` and leave the label pointing at a
   * wrapper, which is a label that does nothing and an axe failure that says so.
   *
   * **Pass a function when the element the props belong on is not the outermost one.** A
   * `<Select>` is the case that forces this: its root renders no DOM at all, so a clone of it
   * swallows every attribute and the field ends up wired to nothing — silently, which is the
   * worst way for an accessibility fix to fail. It is not hypothetical: `auto-cal`'s `SelectField`
   * routes through a `Slot`, which has the same blind spot, and every select in that app is a
   * trigger with no `aria-invalid` and an error message nothing points at. Given a function, the
   * shell calls it with the props instead of guessing, and the caller spreads them where they go:
   *
   * ```tsx
   * control={(props) => (
   *   <Select>
   *     <SelectTrigger {...props}>…</SelectTrigger>
   *     …
   *   </Select>
   * )}
   * ```
   */
  control: ReactNode | ((props: ControlProps) => ReactNode);
  /**
   * What the control is called, as a real `<FieldLabel htmlFor>`. Most of why this component
   * exists: a placeholder is not a label — it leaves at the first keystroke, and a field wearing
   * one is a field a screen reader announces as "edit text".
   */
  label?: ReactNode;
  /** One line under the control on what to put in it, or on what changing it costs. */
  description?: ReactNode;
  /**
   * What is wrong with the value, as a node or a string. Falsy — `undefined`, `""`, whatever a
   * validator holds for a field that passed — draws nothing and leaves the control unmarked, so
   * a call site passes `errors.email?.message` straight in rather than branching around it.
   */
  error?: ReactNode;
  /**
   * Whether a value is needed. Draws the asterisk, and says so to assistive technology as
   * `aria-required`; the asterisk itself is decoration and stays out of the accessibility tree,
   * so the label still reads "Email" rather than "Email star".
   *
   * It deliberately does not set the native `required` attribute, which hands validation to the
   * browser — whose bubble appears somewhere other than where this field puts its `error`, and
   * which blocks a submit the caller may have wanted to make.
   */
  required?: boolean;
  /** The label row's far end. "Forgot password?", a character count, a reveal toggle. */
  action?: ReactNode;
  /**
   * Whether the value is still being fetched. On, a skeleton stands in for the control and
   * `error` is not consulted — a value that has not arrived is not a value that came back wrong.
   * The same ordering `CardLayout` makes between `loading` and `empty`, one level down.
   *
   * The label and the description are still drawn, and drawn for real: they are literals the
   * form already knows, not data being waited on, so a field that hides them while loading is a
   * field whose label rail appears out of nowhere when the values land — which is the reflow the
   * skeleton was drawn to prevent.
   *
   * That is the part a hand-written loading state gets wrong. One app builds a whole second copy
   * of every form out of skeleton twins, so each form exists twice and the two drift; another
   * writes `{loading ? <Skeleton className="h-[42px]" /> : <input …/>}` inline, once, in one
   * field, and nowhere else. Here it is a boolean on the field that already knows its own box.
   */
  loading?: boolean;
  /**
   * The control's `id`, for a caller that already owns one — something else on the page points
   * at this control, or a form library minted it. Left off, the shell generates one, which is
   * what makes the same field safe to render twice on a page. A control the shell cannot reach
   * wants the function form of `control`, not this: an `htmlFor` alone points the label at the
   * right element and leaves the description and the error pointing at nothing.
   */
  htmlFor?: string;
  /**
   * `horizontal` puts the control first and the label beside it, for the controls whose label is
   * part of the hit target: a checkbox, a switch. Stacked, a 16px box sits on a line of its own
   * above its own caption, which is the shape every app that hand-wrote one worked around
   * differently.
   *
   * These are `Field`'s own words and its own arrangement. Its third, `responsive`, is not
   * offered here: it switches on `@md/field-group`, so it silently behaves as `vertical` unless
   * the caller also wrapped the form in a `FieldGroup` — a prop that depends on an ancestor the
   * shell cannot see is a prop that does nothing most of the time it is passed.
   */
  orientation?: keyof typeof LOADING_BOX;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  /** Sizes the loading box for a control that is not input-height — a `<Textarea rows={6}>`. */
  loadingClassName?: string;
};

/**
 * One form field: the label, the control it names, a description, and the error.
 *
 * The spacing, the typography and the two arrangements are shadcn's `Field` — this composes
 * `Field`, `FieldLabel`, `FieldContent`, `FieldDescription` and `FieldError` rather than drawing
 * a second set of them, so a project that already styles `[data-slot=field-label]` styles this,
 * and the message rail here is the one shadcn's own forms use.
 *
 * **What it adds is the wiring, which is the part that was actually duplicated.** `Field` places
 * a label and a control next to each other; it does not introduce them. The `htmlFor`/`id` pair
 * is still hand-assigned at every call site, and it drifts, or it is dropped once a placeholder
 * is standing in for the label; the error is still a node beside the input that nothing points
 * at, so a screen reader reaches the field, says "Email, edit text", and never mentions that it
 * was rejected; `aria-invalid` is set on some inputs and not others, which shows, because the
 * shadcn primitives draw their red ring from that attribute and from nothing else.
 *
 * So this shell generates an id, points the label at the control, and gives the control an
 * `aria-describedby` reaching whichever of the description and the error are on screen at the
 * time. It also adds the two things `Field` has no opinion about: a `loading` skeleton the height
 * of the control it stands in for, and a `required` marker that is decoration to the eye and
 * `aria-required` to everything else.
 *
 * It stays presentational, and that is load-bearing. Every project installing this runs TanStack
 * Form, but the binding belongs one layer up — `auto-cal`'s `InputField`, `TextAreaField` and
 * `SelectField` each read `useFieldContext()`, work out whether the field has been touched yet,
 * and hand this a string. Keeping that layer thin is only possible because this one takes `error`
 * as a node and never asks where it came from; a field that read the form store itself would have
 * to answer "touched or submitted?" for every call site at once, and that answer differs per
 * form. (`FieldError` also takes an `errors` array; this shell takes the node, because a node is
 * what the layer above already has.)
 */
export function FormField({
  control,
  label,
  description,
  error,
  required = false,
  action,
  loading = false,
  htmlFor,
  orientation = "vertical",
  className,
  labelClassName,
  descriptionClassName,
  errorClassName,
  loadingClassName,
}: FormFieldProps) {
  const reactId = useId();

  // A control keeps an `id` it arrived with: a caller that set one is a caller referencing it
  // from somewhere this shell cannot see.
  const renderControl = typeof control === "function" ? control : null;
  const element =
    !renderControl && isValidElement<Record<string, unknown>>(control) ? control : null;
  const givenId = typeof element?.props.id === "string" ? element.props.id : undefined;
  const controlId = htmlFor ?? givenId ?? reactId;

  // Suppressed while loading, so the field does not report a stale rejection of a value that is
  // on its way. It is also what keeps the message rail honest: `error` is the only part of the
  // field that is data rather than a literal.
  const shownError = loading ? null : error;

  // Derived from the control's id rather than minted separately, so that when something points
  // at the wrong element the three of them still read as one field in the DOM.
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = shownError ? `${controlId}-error` : undefined;

  const wired = element
    ? cloneElement(element, {
        id: controlId,
        // Appended, not replaced: a control already described by something outside this field —
        // a shared unit hint, a password policy — keeps it and gains these.
        "aria-describedby":
          [element.props["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ") ||
          undefined,
        // The caller's answer wins where it gave one, so a control a form library has already
        // marked keeps its mark and this only fills the gap.
        "aria-invalid": element.props["aria-invalid"] ?? (shownError ? true : undefined),
        "aria-required": element.props["aria-required"] ?? (required || undefined),
      })
    : renderControl
      ? renderControl({
          id: controlId,
          "aria-describedby": [descriptionId, errorId].filter(Boolean).join(" ") || undefined,
          "aria-invalid": shownError ? true : undefined,
          "aria-required": required || undefined,
        })
      : control;

  const body = loading ? (
    <Skeleton
      data-slot="form-field-skeleton"
      aria-hidden
      className={cn(LOADING_BOX[orientation], loadingClassName)}
    />
  ) : (
    wired
  );

  const labelNode = label ? (
    <FieldLabel
      // No control to point at while one is being drawn for. A `for` naming an element that is
      // not there is worse than no `for`: it reads as wired and is not.
      htmlFor={loading ? undefined : controlId}
      className={labelClassName}
    >
      {required ? (
        // One child, so `FieldLabel`'s own `gap-2` — which is there for icons — is not spent
        // between a word and its asterisk.
        <span className="min-w-0">
          {label}
          <span
            data-slot="form-field-required"
            aria-hidden="true"
            className="ml-0.5 text-destructive"
          >
            *
          </span>
        </span>
      ) : (
        label
      )}
    </FieldLabel>
  ) : null;

  // Only drawn when there is a second thing on the row. A label on its own is the row.
  const header = action ? (
    <div data-slot="form-field-label-row" className="flex min-w-0 items-center gap-2">
      {labelNode}
      <div data-slot="form-field-action" className="ml-auto shrink-0">
        {action}
      </div>
    </div>
  ) : (
    labelNode
  );

  const messages = (
    <>
      {description ? (
        <FieldDescription id={descriptionId} className={descriptionClassName}>
          {description}
        </FieldDescription>
      ) : null}
      {/* `FieldError` is already the `role="alert"` this shell used to draw by hand. Announcing
          matters more here than in shadcn's own forms: those sit downstream of react-hook-form,
          which moves focus to the first invalid field on a failed submit and gets the message
          read that way, and nothing in this shell moves focus. */}
      {shownError ? (
        <FieldError id={errorId} className={errorClassName}>
          {shownError}
        </FieldError>
      ) : null}
    </>
  );

  return (
    <Field
      orientation={orientation}
      // `Field` turns the whole field destructive from this attribute, which is the primitive's
      // own error state rather than one invented here.
      data-invalid={shownError ? true : undefined}
      className={cn("min-w-0", className)}
    >
      {orientation === "horizontal" ? (
        <>
          {body}
          {/* The label and its messages share a column beside the control, so the second line of
              a description starts under the label rather than under the checkbox. `Field`'s
              horizontal arrangement is written around this element being here. */}
          <FieldContent>
            {header}
            {messages}
          </FieldContent>
        </>
      ) : (
        <>
          {header}
          {body}
          {messages}
        </>
      )}
    </Field>
  );
}
