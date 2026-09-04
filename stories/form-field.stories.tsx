import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
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
import { Textarea } from "@/registry/new-york/ui/textarea";

const meta = {
  title: "Form/FormField",
  component: FormField,
  parameters: { layout: "centered" },
  args: { className: "w-[360px]" },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The control the shell wired, found the way a user finds it: through its label. */
const controlFor = (canvasElement: HTMLElement, name: string | RegExp) =>
  within(canvasElement).getByLabelText(name);

export const Default: Story = {
  args: {
    label: "Email",
    description: "We only use it to send the sign-in link.",
    control: <Input type="email" placeholder="you@example.com" />,
  },
  play: async ({ canvasElement }) => {
    // The whole point: the label reaches the control, and the shell minted the id for it.
    const input = controlFor(canvasElement, "Email");
    expect(input).toHaveAttribute("data-slot", "input");

    const label = canvasElement.querySelector<HTMLLabelElement>("[data-slot=form-field-label]");
    expect(label?.htmlFor).toBe(input.id);
    expect(input.id).not.toBe("");

    // And the description is not merely near the control — it describes it.
    expect(input).toHaveAccessibleDescription("We only use it to send the sign-in link.");
  },
};

/**
 * A caller that already owns the id keeps it. The shell only fills the gap — which is what makes
 * a `<Select>`, whose id belongs on its nested trigger, work at all.
 */
export const CallerOwnsTheId: Story = {
  args: {
    label: "Plan",
    htmlFor: "plan",
    control: (
      <Select>
        <SelectTrigger id="plan" className="w-full">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="team">Team</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  play: async ({ canvasElement }) => {
    const trigger = controlFor(canvasElement, "Plan");
    expect(trigger.id).toBe("plan");
  },
};

/**
 * The error is announced, not merely printed beside the field.
 *
 * This is the bug the hand-written stack keeps: three of the five source apps set `aria-invalid`
 * on the input and leave the error `<p>` unlinked, so a screen reader reaches the field, says
 * "Email, edit text", and never mentions that it was rejected.
 */
export const WithError: Story = {
  args: {
    label: "Email",
    description: "We only use it to send the sign-in link.",
    error: "That address is already registered.",
    control: <Input type="email" defaultValue="taken@example.com" />,
  },
  play: async ({ canvasElement }) => {
    const input = controlFor(canvasElement, "Email");

    // Marked invalid, which is also what draws the primitive's red ring — nothing else does.
    expect(input).toHaveAttribute("aria-invalid", "true");

    // Described by both messages, in the order they are on screen.
    expect(input).toHaveAccessibleDescription(
      "We only use it to send the sign-in link. That address is already registered.",
    );

    // And announced on arrival, because no form library is here to move the focus for us.
    const error = canvasElement.querySelector("[data-slot=form-field-error]");
    expect(error).toHaveAttribute("role", "alert");
  },
};

/** A falsy `error` is the shape a validator holds for a field that passed. It draws nothing. */
export const NoErrorLeavesNothingBehind: Story = {
  args: {
    label: "Email",
    error: undefined,
    control: <Input type="email" />,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-slot=form-field-error]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=form-field-description]")).toBeNull();
    // No action, so no label row wrapper either: the label is the row.
    expect(canvasElement.querySelector("[data-slot=form-field-label-row]")).toBeNull();
    expect(controlFor(canvasElement, "Email")).not.toHaveAttribute("aria-invalid");
  },
};

/**
 * `required` draws the asterisk and says so as `aria-required`. The asterisk itself is hidden
 * from the accessibility tree, so the field is still named "Password" and not "Password star".
 */
export const Required: Story = {
  args: {
    label: "Password",
    required: true,
    action: (
      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
        Forgot?
      </Button>
    ),
    control: <Input type="password" />,
  },
  play: async ({ canvasElement }) => {
    // The label's *text* carries the asterisk; its accessible *name* does not, which is the
    // whole trick — so this query is by prefix and the assertion below is exact.
    const input = controlFor(canvasElement, /^Password/);
    expect(input).toHaveAttribute("aria-required", "true");
    // Not the native attribute: that hands validation to a browser bubble drawn somewhere other
    // than where this field puts its error.
    expect(input).not.toHaveAttribute("required");
    expect(input).toHaveAccessibleName("Password");

    // `action` sits at the far end of the label row, past the label.
    const label = canvasElement.querySelector<HTMLElement>("[data-slot=form-field-label]");
    const action = canvasElement.querySelector<HTMLElement>("[data-slot=form-field-action]");
    expect(label).not.toBeNull();
    expect(action).not.toBeNull();
    if (!label || !action) return;
    expect(action.getBoundingClientRect().left).toBeGreaterThan(
      label.getBoundingClientRect().right,
    );
  },
};

/**
 * `horizontal` for the controls whose label is part of their hit target. The control comes
 * first, the label sits beside it, and both stay on one line.
 */
export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    label: "Email me about releases",
    description: "About one a month. Nothing else.",
    control: <Checkbox />,
    className: "w-[360px]",
  },
  play: async ({ canvasElement }) => {
    const box = controlFor(canvasElement, "Email me about releases");
    const label = canvasElement.querySelector<HTMLElement>("[data-slot=form-field-label]");
    expect(label).not.toBeNull();
    if (!label) return;

    const boxRect = box.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();

    // Beside, not above — the shape a stacked field gets wrong by putting a 16px box on a line
    // of its own above its own caption.
    expect(labelRect.left).toBeGreaterThan(boxRect.right);
    expect(labelRect.top).toBeLessThan(boxRect.bottom);

    // The description is held to the label's column, so its second line does not start under
    // the checkbox.
    const description = canvasElement.querySelector<HTMLElement>(
      "[data-slot=form-field-description]",
    );
    expect(description?.getBoundingClientRect().left).toBeGreaterThan(boxRect.right - 1);
  },
};

/**
 * `loading` swaps the control for a box of the same height and keeps the label and description,
 * which are literals the form already knows rather than data it is waiting for.
 *
 * The apps that hand-wrote this kept a whole second copy of every form — a parallel
 * `…FormFieldsLoading` maintained beside the real one, drifting from it. This is that, deleted.
 */
export const Loading: Story = {
  args: {
    label: "Email",
    description: "We only use it to send the sign-in link.",
    error: "This is not consulted while loading.",
    loading: true,
    control: <Input type="email" />,
  },
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector<HTMLElement>("[data-slot=form-field-skeleton]");
    expect(skeleton).not.toBeNull();
    expect(canvasElement.querySelector("[data-slot=input]")).toBeNull();

    // `loading` outranks `error`: a value that has not arrived is not one that came back wrong.
    expect(canvasElement.querySelector("[data-slot=form-field-error]")).toBeNull();

    // The label and the description are still on screen, and still real.
    expect(canvasElement.textContent).toContain("Email");
    expect(canvasElement.textContent).toContain("We only use it to send the sign-in link.");

    // No control to point at, so no dangling `for` claiming there is one.
    const label = canvasElement.querySelector<HTMLLabelElement>("[data-slot=form-field-label]");
    expect(label?.getAttribute("for")).toBeNull();
  },
};

/**
 * Why `loading` is a boolean *and* a sizing hint.
 *
 * A shell that is only told "loading" draws the box the default control rests at, which is right
 * for an input, a select and a date picker and wrong for everything taller. Three fields here:
 * one loading with no hint, one loading with `loadingClassName`, and the real thing. Only the
 * middle one lands where the textarea will, and the first is a 28px jump on arrival.
 *
 * `items-start` matters — stretched to a common height the assertion would prove nothing.
 */
export const LoadingIsTheHeightOfWhatItReplaces: Story = {
  args: { label: "Bio", control: <Input /> },
  render: (args) => (
    <div className="flex w-[720px] items-start gap-6">
      <FormField {...args} className="flex-1" control={<Textarea rows={4} />} loading />
      <FormField
        {...args}
        className="flex-1"
        control={<Textarea rows={4} />}
        loading
        loadingClassName="h-16"
      />
      <FormField {...args} className="flex-1" control={<Textarea rows={4} />} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fields = canvasElement.querySelectorAll<HTMLElement>("[data-slot=form-field]");
    const skeletons = canvasElement.querySelectorAll<HTMLElement>(
      "[data-slot=form-field-skeleton]",
    );
    const textarea = canvasElement.querySelector<HTMLElement>("[data-slot=textarea]");
    expect(fields).toHaveLength(3);
    expect(skeletons).toHaveLength(2);

    const bare = skeletons[0];
    const hinted = skeletons[1];
    const real = fields[2];
    if (!bare || !hinted || !textarea || !real) return;

    const target = textarea.getBoundingClientRect().height;
    expect(hinted.getBoundingClientRect().height).toBeCloseTo(target, 0);
    expect(bare.getBoundingClientRect().height).toBeLessThan(target);

    // And so the whole field lands where it will be, not only its control.
    expect(fields[1]?.getBoundingClientRect().height).toBeCloseTo(
      real.getBoundingClientRect().height,
      0,
    );
  },
};

/**
 * Rule 4 — the floors. A field lives in a 12-column form rail in one of the source apps, so one
 * wide control must not grow the field and push its neighbour off the row.
 */
export const WideControlKeepsItsFloor: Story = {
  args: { label: "Token", control: <Input /> },
  render: (args) => (
    <div className="w-[400px] border">
      <FormField
        {...args}
        className="w-auto"
        control={
          <Input defaultValue="a-single-very-long-unbroken-token-that-has-nowhere-to-wrap" />
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector<HTMLElement>("[data-slot=form-field]");
    expect(field).not.toBeNull();
    if (!field) return;
    expect(field.clientWidth).toBeLessThanOrEqual(400);
  },
};

/** The stack a real form is: several fields, one gap, nothing re-derived per field. */
export const AForm: Story = {
  args: { label: "Name", control: <Input /> },
  render: (args) => (
    <form className="grid w-[420px] gap-5">
      <FormField {...args} label="Name" required control={<Input />} />
      <FormField
        label="Email"
        required
        description="We only use it to send the sign-in link."
        error="That address is already registered."
        control={<Input type="email" defaultValue="taken@example.com" />}
      />
      <FormField label="Notes" control={<Textarea rows={3} />} />
      <FormField orientation="horizontal" label="Email me about releases" control={<Checkbox />} />
      <Button type="button" className="justify-self-end">
        Save
      </Button>
    </form>
  ),
};
