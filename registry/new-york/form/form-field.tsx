import type { ReactNode } from "react";
import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/registry/new-york/ui/label";
import { Skeleton } from "@/registry/new-york/ui/skeleton";

/** How the label sits against the control. */
const ORIENTATIONS = {
  /** Label above, control below. Every text input, textarea, select. */
  vertical: "grid grid-cols-[minmax(0,1fr)] gap-2",
  /** Control first, label beside it — a checkbox or a switch, whose label is its hit target. */
  horizontal: "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5",
} as const;

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
   */
  control: ReactNode;
  /**
   * What the control is called, as a real `<Label htmlFor>`. Most of why this component exists:
   * a placeholder is not a label — it leaves at the first keystroke, and a field wearing one is
   * a field a screen reader announces as "edit text".
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
   * The control's `id`, for the cases where the shell cannot reach it: a `<Select>`, whose id
   * belongs on the nested `<SelectTrigger>` rather than on the root this would clone. Left off,
   * the shell generates one — which is what makes the same field safe to render twice on a page.
   */
  htmlFor?: string;
  /**
   * `horizontal` puts the control first and the label beside it, for the controls whose label is
   * part of the hit target: a checkbox, a switch. Stacked, a 16px box sits on a line of its own
   * above its own caption, which is the shape every app that hand-wrote one worked around
   * differently.
   */
  orientation?: keyof typeof ORIENTATIONS;
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
 * Four lines of markup, rewritten per field, which is how the wiring rots. The `htmlFor`/`id`
 * pair is hand-assigned and drifts, or is dropped once a placeholder is standing in for the
 * label; the error is a paragraph beside the input that nothing points at, so a screen reader
 * reaches the field, says "Email, edit text", and never mentions that it was rejected;
 * `aria-invalid` is set on some inputs and not others, which shows, because the shadcn primitives
 * draw their red ring from that attribute and from nothing else.
 *
 * So this shell does the wiring and not only the spacing. It generates an id, points the label at
 * the control, and gives the control an `aria-describedby` reaching whichever of the description
 * and the error are on screen at the time.
 *
 * It stays presentational, and that is load-bearing: the source apps run react-hook-form,
 * TanStack Form and plain `useState` between them, so a field that bound to one of them would be
 * installable into a third of the projects it was written for. `error` is whatever the caller
 * already holds — `errors.email?.message`, a server response, a string — and the field never asks
 * where it came from.
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
  const element = isValidElement<Record<string, unknown>>(control) ? control : null;
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
    <Label
      data-slot="form-field-label"
      // No control to point at while one is being drawn for. A `for` naming an element that is
      // not there is worse than no `for`: it reads as wired and is not.
      htmlFor={loading ? undefined : controlId}
      className={labelClassName}
    >
      {required ? (
        // One child, so `Label`'s own `gap-2` — which is there for icons — is not spent between
        // a word and its asterisk.
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
    </Label>
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
        <p
          data-slot="form-field-description"
          id={descriptionId}
          className={cn("text-muted-foreground text-sm", descriptionClassName)}
        >
          {description}
        </p>
      ) : null}
      {shownError ? (
        // `role="alert"` where shadcn's own `FormMessage` has none, because `FormMessage` is
        // downstream of react-hook-form, which moves focus to the first invalid field on a failed
        // submit and gets the message announced that way. This shell is bound to no form library,
        // so nothing moves the focus, and without the alert a user who presses Save hears
        // nothing at all. The cost is that ten bad fields announce ten times; a silent rejection
        // is worse.
        <p
          data-slot="form-field-error"
          id={errorId}
          role="alert"
          className={cn("text-destructive text-sm", errorClassName)}
        >
          {shownError}
        </p>
      ) : null}
    </>
  );

  const hasMessages = Boolean(description || shownError);

  return (
    <div data-slot="form-field" className={cn("min-w-0", ORIENTATIONS[orientation], className)}>
      {orientation === "horizontal" ? (
        <>
          {body}
          {header}
          {/* Held to the second column, so the second line of a description starts under the
              label rather than under the checkbox. */}
          {hasMessages ? <div className="col-start-2 grid gap-1.5">{messages}</div> : null}
        </>
      ) : (
        <>
          {header}
          {body}
          {messages}
        </>
      )}
    </div>
  );
}
