import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { FormDialog } from "@/registry/new-york/form/form-dialog";
import { Button } from "@/registry/new-york/ui/button";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import { Skeleton } from "@/registry/new-york/ui/skeleton";

const meta = {
  title: "Form/FormDialog",
  component: FormDialog,
  parameters: { layout: "centered" },
  args: { onSubmit: fn() },
} satisfies Meta<typeof FormDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain fields, not the field shell — this component knows nothing about their internals. */
const Fields = ({ count = 2 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <div key={n} className="grid gap-1.5">
        <Label htmlFor={`field-${n}`}>Field {n}</Label>
        <Input id={`field-${n}`} name={`field-${n}`} />
      </div>
    ))}
  </>
);

const LoadingFields = ({ count = 2 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
      <div key={n} className="grid gap-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
  </>
);

const open = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: /new workspace/i }));
  // Radix portals the content out of the canvas, so everything after this reads the document.
  const dialog = await waitFor(() => within(document.body).getByRole("dialog"));
  // The dialog zooms and fades in, and a rectangle read part-way through that is a rectangle of
  // nothing. The endless ones are skipped or this never returns — the submit button's spinner is
  // one, and waiting on it hangs the run rather than failing it. `.finished` rejects on a
  // cancelled animation, which is not a failure here either.
  await Promise.all(
    dialog
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
      .map((a) => a.finished.catch(() => {})),
  );
  return dialog;
};

const parts = () => {
  const form = document.querySelector<HTMLFormElement>("[data-slot=form-dialog-form]");
  const save = within(document.body).getByRole("button", { name: "Save" }) as HTMLButtonElement;
  const cancel = within(document.body).getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
  return { form, save, cancel };
};

const args = {
  trigger: <Button>New workspace</Button>,
  title: "New workspace",
  description: "A workspace exposes the servers you choose at its own URL.",
  content: <Fields />,
};

/**
 * The claim this component is built on: the submit button sits in the footer, *outside* the
 * scrolling body, and still owns the form.
 *
 * It has to be outside — the body scrolls and the chrome does not, which is the whole point of
 * the dialog shell underneath — so nesting is off the table and the two are associated by
 * `form={id}` instead. This story asserts both halves: the button is not inside the form
 * element, and the form element is nonetheless its form owner.
 */
export const Default: Story = {
  args,
  play: async ({ args: storyArgs, canvasElement }) => {
    await open(canvasElement);
    const { form, save } = parts();

    expect(form).not.toBeNull();
    expect(form?.contains(save)).toBe(false);
    expect(save.form).toBe(form);

    await userEvent.click(save);
    expect(storyArgs.onSubmit).toHaveBeenCalledTimes(1);
  },
};

/**
 * Enter in a field saves, once.
 *
 * The shell it replaces wired its footer with `onClick` and no `<form>` at all, so Enter in a
 * text field did nothing — every one of its seven dialogs needed the mouse. Two fields here
 * rather than one, because a browser will submit a single-field form with no submit button at
 * all: with one field the pass would prove nothing.
 *
 * Once, not twice, is the other half — a form that fires its submit handler on both the Enter
 * and the button it activates has bought the double-submit bug back at the keyboard.
 */
export const EnterSubmitsOnce: Story = {
  args,
  play: async ({ args: storyArgs, canvasElement }) => {
    await open(canvasElement);
    const field = within(document.body).getByLabelText("Field 1");

    await userEvent.type(field, "Acme backend{Enter}");
    expect(storyArgs.onSubmit).toHaveBeenCalledTimes(1);
  },
};

/**
 * A save in flight refuses the next one.
 *
 * Six of the seven dialogs this replaces wrote this guard out by hand and the seventh did not,
 * which is a difference nobody chose. Here the button is inert *and* the submit handler refuses,
 * because the two catch different things — the disabled attribute stops the pointer, the handler
 * stops the keyboard and anything that reaches the form by id.
 */
export const PendingRefusesASecondSave: Story = {
  args: { ...args, pending: true },
  play: async ({ args: storyArgs, canvasElement }) => {
    await open(canvasElement);
    const { save, cancel } = parts();
    const field = within(document.body).getByLabelText("Field 1");

    expect(save).toBeDisabled();
    // Cancel stays live: a dialog you cannot leave for the length of a slow request is worse
    // than the double submit this is guarding against.
    expect(cancel).not.toBeDisabled();

    await userEvent.type(field, "{Enter}");
    expect(storyArgs.onSubmit).not.toHaveBeenCalled();
  },
};

/**
 * A record still in flight, which is not a save in flight.
 *
 * The dialogs that got this wrong dropped the footer while loading and drew it again when the
 * data landed, so the dialog changed height under the reader — the one reflow a field-for-field
 * skeleton cannot fix from inside the body. Here the footer is the same row it always is, inert:
 * this story asserts it is present, that Save refuses, and that nothing is spinning, because
 * nothing is on its way out yet.
 */
export const LoadingKeepsTheFooter: Story = {
  args: { ...args, loading: true, content: <LoadingFields /> },
  play: async ({ args: storyArgs, canvasElement }) => {
    await open(canvasElement);
    const { form, save } = parts();

    expect(document.querySelector("[data-slot=dialog-footer]")).not.toBeNull();
    expect(save).toBeDisabled();
    expect(save.querySelector("svg")).toBeNull();
    expect(form).toHaveAttribute("aria-busy", "true");

    // The button being inert is the half a reader sees; this is the other half. A submit that
    // arrives without going through the button — a `requestSubmit()` on the form's id, an
    // autofill — is refused by the handler, which is why the guard is written there as well.
    if (form) fireEvent.submit(form);
    expect(storyArgs.onSubmit).not.toHaveBeenCalled();
  },
};

/**
 * The form-level error is announced, and it stays on screen.
 *
 * The apps this replaces sent it to a toast in the far corner, which is gone before the eye
 * gets there, or wrote it above the buttons inside the body, where a long form scrolls it out
 * of view. It goes in the footer instead: a live region beside the button that caused it, and
 * this story scrolls the body to the end to show it does not go anywhere.
 *
 * The footer's start takes the aside too, stacked above it, because a form can be refusing to
 * save and still offering to delete.
 */
export const ErrorIsAnnouncedAndStays: Story = {
  args: {
    ...args,
    content: <Fields count={20} />,
    error: "A workspace called “Acme backend” already exists.",
    footer: (
      <Button variant="ghost" className="text-destructive">
        Delete workspace
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    const alert = within(document.body).getByRole("alert");
    const aside = within(document.body).getByRole("button", { name: "Delete workspace" });

    expect(alert).toHaveTextContent("already exists");
    // Announced by being a live region, and in the chrome rather than the body.
    const footerRow = document.querySelector("[data-slot=hcf-footer]");
    expect(footerRow?.contains(alert)).toBe(true);
    // Stacked, error on top.
    expect(alert.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      aside.getBoundingClientRect().top,
    );

    const body = document.querySelector<HTMLElement>("[data-slot=hcf-content]");
    expect(body).not.toBeNull();
    if (!body) return;

    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const before = alert.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
    expect(alert.getBoundingClientRect().top).toBe(before);
  },
};

/**
 * `canSubmit` is the caller's validity, not the shell's — nothing here inspects a field. It
 * refuses on exactly the same path `pending` and `loading` do.
 */
export const CanSubmitGatesTheSave: Story = {
  args: { ...args, canSubmit: false, submitLabel: "Create workspace" },
  play: async ({ args: storyArgs, canvasElement }) => {
    await open(canvasElement);
    const create = within(document.body).getByRole("button", { name: "Create workspace" });
    const field = within(document.body).getByLabelText("Field 1");

    expect(create).toBeDisabled();
    await userEvent.type(field, "{Enter}");
    expect(storyArgs.onSubmit).not.toHaveBeenCalled();
  },
};
