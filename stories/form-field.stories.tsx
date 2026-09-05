import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { FormField, ticks } from "@/registry/new-york/form/form-field";
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

type FieldProps = ComponentProps<typeof FormField>;

/**
 * The control types a form in these apps actually reaches for.
 *
 * Every state story below renders the whole set rather than one `<Input>`, because a state that
 * reads right on a text input and wrong on a `<Textarea>` or a `<Checkbox>` is the state that
 * ships broken — and this shell has exactly two things that only one control type at a time gets
 * to be right about: the height of the loading box, and which side of the label the control sits
 * on. Seeing them side by side is how a wrong one is noticed.
 *
 * A radio group is deliberately not here. Its label is not a `<label for>` — a group of radios is
 * named by a `<legend>`, so its shell is shadcn's `FieldSet` and `FieldLegend`, not this.
 */
const TYPES = [
  {
    key: "text",
    label: "Name",
    description: "What the workspace is called in the switcher.",
    control: <Input placeholder="Acme Staging" />,
  },
  {
    key: "number",
    label: "Seats",
    description: "Billed monthly, prorated when you change it.",
    control: <Input type="number" defaultValue={3} min={1} />,
  },
  {
    key: "select",
    label: "Plan",
    description: "Change it whenever; the difference is prorated.",
    // The one type the shell cannot clone into: `Select`'s root renders no DOM, so the props go
    // on the trigger and the caller is the only one who knows that. Hence the function form.
    control: (props) => (
      <Select>
        <SelectTrigger {...props} className="w-full">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="team">Team</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    key: "textarea",
    label: "Notes",
    description: "Only your team sees these.",
    control: <Textarea rows={3} />,
    loadingClassName: "h-16",
  },
  {
    key: "checkbox",
    label: "Email me about releases",
    description: "About one a month. Nothing else.",
    orientation: "horizontal",
    control: <Checkbox />,
  },
  {
    key: "switch",
    label: "Public workspace",
    orientation: "horizontal",
    control: <Switch />,
    loadingClassName: "h-5 w-8 rounded-full",
  },
] satisfies Array<FieldProps & { key: string }>;

/**
 * One story's state, applied to every control type. The per-type props win over the story's, so
 * a story says `error="…"` once and the textarea and the checkbox both get it.
 */
const AllTypes = ({ control: _control, ...args }: FieldProps) => (
  <div className="grid w-[420px] gap-5">
    {TYPES.map(({ key, ...type }) => (
      <FormField key={key} {...args} {...type} />
    ))}
  </div>
);

export const Default: Story = {
  args: { label: "Name", control: <Input /> },
  render: (args) => <AllTypes {...args} />,
  play: async ({ canvasElement }) => {
    const fields = canvasElement.querySelectorAll<HTMLElement>("[data-slot=field]");
    expect(fields).toHaveLength(TYPES.length);

    const ids = new Set<string>();
    for (const [i, type] of TYPES.entries()) {
      // Found the way a user finds it: through the label. Which only works because the shell
      // wired the two together — that is the whole component.
      const control = controlFor(canvasElement, type.label);
      expect(control.id).not.toBe("");
      ids.add(control.id);

      const label = fields[i]?.querySelector<HTMLLabelElement>("[data-slot=field-label]");
      expect(label?.htmlFor).toBe(control.id);

      // And the description is not merely near the control — it describes it.
      if ("description" in type) {
        expect(control).toHaveAccessibleDescription(type.description);
      }
    }

    // Every field minted its own id, so the same form rendered twice on a page does not
    // cross-wire the second copy's labels to the first copy's controls.
    expect(ids.size).toBe(TYPES.length);
  },
};

/**
 * A caller that already owns the id keeps it. The shell only fills the gap, so a control another
 * element on the page points at keeps the name that reference uses.
 */
export const CallerOwnsTheId: Story = {
  args: {
    label: "Email",
    htmlFor: "account-email",
    control: <Input type="email" />,
  },
  play: async ({ canvasElement }) => {
    expect(controlFor(canvasElement, "Email").id).toBe("account-email");
  },
};

/**
 * The function form of `control`, and why it exists.
 *
 * `Select`'s root renders nothing — it is context, not an element — so a cloned `id`,
 * `aria-describedby` and `aria-invalid` land on a component that drops all three. The field
 * *looks* wired and is not, which is the worst way for this to fail: no warning, no visual
 * difference, and a screen reader that never mentions the error. Passing a function hands the
 * caller the props and lets them land on the trigger, where they belong.
 *
 * An `htmlFor` does not cover this. It points the label at the trigger and leaves the
 * description and the error describing nothing.
 */
export const ControlTheShellCannotReach: Story = {
  args: {
    label: "Plan",
    description: "Change it whenever; the difference is prorated.",
    error: "Your card was declined.",
    required: true,
    control: (props) => (
      <Select>
        <SelectTrigger {...props} className="w-full">
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
    const trigger = controlFor(canvasElement, /^Plan/);
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(trigger).toHaveAccessibleDescription(
      "Change it whenever; the difference is prorated. Your card was declined.",
    );
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
    label: "Name",
    error: "That name is already taken in this organisation.",
    control: <Input />,
  },
  render: (args) => <AllTypes {...args} />,
  play: async ({ canvasElement }) => {
    const fields = canvasElement.querySelectorAll<HTMLElement>("[data-slot=field]");

    for (const [i, type] of TYPES.entries()) {
      const control = controlFor(canvasElement, type.label);

      // Marked invalid, which is also what draws the primitive's red ring — nothing else does,
      // and a checkbox and a select take it as readily as an input.
      expect(control).toHaveAttribute("aria-invalid", "true");

      // Described by both messages, in the order they are on screen.
      const spoken = "description" in type ? `${type.description} ` : "";
      expect(control).toHaveAccessibleDescription(
        `${spoken}That name is already taken in this organisation.`,
      );

      // And announced on arrival, because no form library is here to move the focus for us.
      const error = fields[i]?.querySelector("[data-slot=field-error]");
      expect(error).toHaveAttribute("role", "alert");
    }
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
    expect(canvasElement.querySelector("[data-slot=field-error]")).toBeNull();
    expect(canvasElement.querySelector("[data-slot=field-description]")).toBeNull();
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
  args: { label: "Name", required: true, control: <Input /> },
  render: (args) => <AllTypes {...args} />,
  play: async ({ canvasElement }) => {
    for (const type of TYPES) {
      // The label's *text* carries the asterisk; its accessible *name* does not, which is the
      // whole trick — so this query is by prefix and the assertion below is exact.
      const control = controlFor(canvasElement, new RegExp(`^${type.label}`));
      expect(control).toHaveAttribute("aria-required", "true");
      expect(control).toHaveAccessibleName(type.label);
      // Not the native attribute: that hands validation to a browser bubble drawn somewhere
      // other than where this field puts its error.
      expect(control).not.toHaveAttribute("required");
    }
  },
};

/**
 * `action` is the label row's far end — "Forgot?", a character count, a reveal toggle. One field
 * here, because the assertion is about where it lands rather than about the control beside it.
 */
export const LabelAction: Story = {
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
    const label = canvasElement.querySelector<HTMLElement>("[data-slot=field-label]");
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
    const label = canvasElement.querySelector<HTMLElement>("[data-slot=field-label]");
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
    const description = canvasElement.querySelector<HTMLElement>("[data-slot=field-description]");
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
    label: "Name",
    loading: true,
    error: "This is not consulted while loading.",
    control: <Input />,
  },
  render: (args) => <AllTypes {...args} />,
  play: async ({ canvasElement }) => {
    const skeletons = canvasElement.querySelectorAll<HTMLElement>(
      "[data-slot=form-field-skeleton]",
    );
    expect(skeletons).toHaveLength(TYPES.length);

    // Every control type is gone, not only the ones that are inputs.
    for (const slot of ["input", "textarea", "select-trigger", "checkbox", "switch"]) {
      expect(canvasElement.querySelector(`[data-slot=${slot}]`)).toBeNull();
    }

    // `loading` outranks `error`: a value that has not arrived is not one that came back wrong.
    expect(canvasElement.querySelector("[data-slot=field-error]")).toBeNull();

    for (const type of TYPES) {
      // The labels and descriptions are still on screen, and still real — they are literals the
      // form already knows, not data anyone is waiting for.
      expect(canvasElement.textContent).toContain(type.label);
    }

    // No control to point at, so no dangling `for` claiming there is one.
    for (const label of canvasElement.querySelectorAll("[data-slot=field-label]")) {
      expect(label.getAttribute("for")).toBeNull();
    }
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
    const fields = canvasElement.querySelectorAll<HTMLElement>("[data-slot=field]");
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
    const field = canvasElement.querySelector<HTMLElement>("[data-slot=field]");
    expect(field).not.toBeNull();
    if (!field) return;
    expect(field.clientWidth).toBeLessThanOrEqual(400);
  },
};

/**
 * A real form, field for field: this is `auto-cal`'s `TodoForm` — title, description, a list
 * select, priority and duration side by side, a due date — with its TanStack `AppField` wrappers
 * peeled off, so what is left is the part this shell owns.
 *
 * Two things to read off it. The row of two is a plain `grid-cols-2` here; `auto-cal` has a
 * `FieldRow` for it, wrapping and all, and that is the next component this registry wants rather
 * than a prop on this one. And every field is the same call shape — label, control, done — which
 * is what the `field.InputField` / `field.SelectField` layer above narrows to one line.
 */
export const AForm: Story = {
  args: { label: "Title", control: <Input /> },
  render: () => (
    <form className="grid w-[480px] gap-4">
      <FormField label="Title" required control={<Input placeholder="What needs to be done?" />} />
      <FormField
        label="Description"
        description="Optional. Notes, links, anything you want beside it later."
        control={<Textarea rows={3} placeholder="Add any notes or details…" />}
      />
      <FormField
        label="List"
        required
        error="Pick a list — a todo with nowhere to go is never seen again."
        control={(props) => (
          <Select>
            <SelectTrigger {...props} className="w-full">
              <SelectValue placeholder="Choose a list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbox">Inbox</SelectItem>
              <SelectItem value="work">Work</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Priority"
          control={(props) => (
            <Select defaultValue="2">
              <SelectTrigger {...props} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          label="Duration"
          control={(props) => (
            <Select defaultValue="30">
              <SelectTrigger {...props} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <FormField label="Due date" control={<Input type="datetime-local" />} />
      <FormField
        orientation="horizontal"
        label="Schedule it automatically"
        description="Finds the next free block that fits the duration."
        control={<Switch defaultChecked />}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="button">Create Todo</Button>
      </div>
    </form>
  ),
  play: async ({ canvasElement }) => {
    // Seven fields, three of them selects, and every one of them wired — which is the assertion
    // the whole file exists to make, made once against a form the size a real one is.
    const fields = canvasElement.querySelectorAll<HTMLElement>("[data-slot=field]");
    expect(fields).toHaveLength(7);

    for (const field of fields) {
      const label = field.querySelector<HTMLLabelElement>("[data-slot=field-label]");
      expect(label).not.toBeNull();
      if (!label) return;
      const control = canvasElement.ownerDocument.getElementById(label.htmlFor);
      expect(control).not.toBeNull();
    }
  },
};

const SCHEMA_DESCRIPTION =
  "The canonical, human-readable name for this workspace. Shown in the sidebar, in search " +
  "results, and in every notification the workspace sends. Changing it does not change the slug.";

/**
 * The description a generated schema hands you.
 *
 * `task_server` reads these off GraphQL codegen output and a private project reads them off its
 * own field definitions: they are documentation, written for a schema browser, and printing
 * fifteen of them down a form buries the form. `descriptionPlacement="popover"` puts the
 * paragraph one click from the label instead of two lines under the control.
 */
export const DescriptionInAPopover: Story = {
  args: {
    label: "Display name",
    description: SCHEMA_DESCRIPTION,
    descriptionPlacement: "popover",
    control: <Input placeholder="Acme" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing is printed under the control: that is the whole point of the placement.
    expect(canvasElement.querySelector("[data-slot=field-description]")).toBeNull();

    const trigger = canvas.getByRole("button", { name: "About Display name" });
    await userEvent.click(trigger);

    const popover = await screen.findByRole("dialog");
    await waitFor(() => expect(popover).toBeVisible());
    expect(popover).toHaveTextContent(/canonical, human-readable name/);
  },
};

/**
 * The bug the placement would otherwise ship with. Radix unmounts popover content on close, so a
 * description living only in the popover is one a screen reader can never reach — the control
 * would announce its name and stop. The text is always in the DOM; only the visible copy moves.
 */
export const APopoverDescriptionIsStillAnnounced: Story = {
  args: {
    label: "Display name",
    description: SCHEMA_DESCRIPTION,
    descriptionPlacement: "popover",
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    // Exact, not a regex: the help trigger is named "About Display name", and a loose match
    // finds both. Two elements, two distinct accessible names — which is correct.
    const control = controlFor(canvasElement, "Display name");

    // Closed, never opened, never hovered.
    expect(canvasElement.querySelector("[data-state=open]")).toBeNull();
    expect(control).toHaveAccessibleDescription(SCHEMA_DESCRIPTION);
  },
};

/**
 * A help button inside a `<form>` defaults to `type="submit"`. Written by hand, this is the icon
 * that quietly submits the form the first time anyone asks what a field means.
 */
export const TheHelpTriggerDoesNotSubmit: Story = {
  args: {
    label: "Display name",
    description: SCHEMA_DESCRIPTION,
    descriptionPlacement: "popover",
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "About Display name" });
    expect(trigger).toHaveAttribute("type", "button");
  },
};

/** The placement is layout only: inline, the same sentence describes the control the same way. */
export const InlineAndPopoverDescribeTheControlAlike: Story = {
  args: {
    label: "Display name",
    description: SCHEMA_DESCRIPTION,
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const control = controlFor(canvasElement, "Display name");
    expect(canvasElement.querySelector("[data-slot=field-description]")).not.toBeNull();
    expect(control).toHaveAccessibleDescription(SCHEMA_DESCRIPTION);
  },
};

/**
 * A real one, from `task_server`'s `Agent` table. It is written once on the server, reaches the
 * GraphQL schema through drizzle-graphql's `describeColumn`, and codegen brings it back as a map
 * — so this string and the one an agent reads off the `/mcp` tool schema are the same string.
 */
const TICKED_DESCRIPTION =
  "Whether tool definitions are sent up front (`eager`) or loaded as the run asks for them " +
  "(`ondemand`). `inherit` takes the server's answer.";

/** The same sentence with the markers spent rather than printed. */
const TICKED_AS_READ =
  "Whether tool definitions are sent up front (eager) or loaded as the run asks for them " +
  "(ondemand). inherit takes the server's answer.";

/**
 * The problem, pinned first so the fix has something to be measured against.
 *
 * `description` is documented as the prop a form pours `schema.fields[k].description` into, and
 * that string is marked up for the other reader it has: a model, which has no way besides the
 * backticks of being told that `ondemand` is a value and not a word. Straight through, a person
 * reads the markers.
 */
export const BackticksArriveInTheDescription: Story = {
  args: {
    label: "Tool discovery",
    description: TICKED_DESCRIPTION,
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const description = canvasElement.querySelector("[data-slot=field-description]");

    expect(description?.textContent).toContain("`eager`");
    expect(description?.querySelector("code")).toBeNull();
  },
};

/**
 * And the adapter. `ticks` is the six lines every project that passes a schema description
 * through was otherwise writing for itself — the marker is spent on a `<code>` instead of being
 * printed, and the sentence is the sentence.
 */
export const TicksSpendsTheMarkers: Story = {
  args: {
    label: "Tool discovery",
    description: ticks(TICKED_DESCRIPTION),
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const description = canvasElement.querySelector("[data-slot=field-description]");
    const code = [...(description?.querySelectorAll("code") ?? [])].map((el) => el.textContent);

    expect(code).toEqual(["eager", "ondemand", "inherit"]);
    expect(description?.textContent).toBe(TICKED_AS_READ);
    expect(description?.textContent).not.toContain("`");

    // The three values are still part of the sentence the control is described by — they are
    // drawn differently, not moved out of the description.
    expect(controlFor(canvasElement, "Tool discovery")).toHaveAccessibleDescription(TICKED_AS_READ);
  },
};

/**
 * Nothing to spend, nothing spent. A description without backticks comes out as the string it
 * went in as, which is what makes it safe to wrap every one of them rather than the few known to
 * be marked up.
 */
export const APlainSentenceIsUnchanged: Story = {
  args: {
    label: "Display name",
    description: ticks(SCHEMA_DESCRIPTION),
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const description = canvasElement.querySelector("[data-slot=field-description]");

    expect(description?.querySelector("code")).toBeNull();
    expect(description?.textContent).toBe(SCHEMA_DESCRIPTION);
  },
};

/**
 * The one a naive split gets wrong. A lone backtick — a shell snippet someone half-quoted, a
 * sentence that ends mid-thought — has nothing closing it, and pairing it with the end of the
 * string would swallow the rest of the description into a `<code>`. A description is prose that
 * has to survive however it was written, so the stray marker stays the character it is.
 */
export const AnUnpairedBacktickIsLeftAlone: Story = {
  args: {
    label: "Command",
    description: ticks("Runs `pnpm build` in the workspace root. Escape a ` the shell would eat."),
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    const description = canvasElement.querySelector("[data-slot=field-description]");
    const code = [...(description?.querySelectorAll("code") ?? [])].map((el) => el.textContent);

    // The pair before it still became code; only the odd one out was left as text.
    expect(code).toEqual(["pnpm build"]);
    expect(description?.textContent).toBe(
      "Runs pnpm build in the workspace root. Escape a ` the shell would eat.",
    );
  },
};

/**
 * It composes with the placement, because it produces the same `ReactNode` the prop already took.
 * The popover's always-mounted `sr-only` copy carries the `<code>` spans too, so the control is
 * described by the whole sentence with the popover shut.
 */
export const TicksWorksBehindAPopover: Story = {
  args: {
    label: "Tool discovery",
    description: ticks(TICKED_DESCRIPTION),
    descriptionPlacement: "popover",
    control: <Input />,
  },
  play: async ({ canvasElement }) => {
    expect(controlFor(canvasElement, "Tool discovery")).toHaveAccessibleDescription(TICKED_AS_READ);

    const trigger = within(canvasElement).getByRole("button", { name: "About Tool discovery" });
    await userEvent.click(trigger);

    const popover = await screen.findByRole("dialog");
    await waitFor(() => expect(popover).toBeVisible());
    expect([...popover.querySelectorAll("code")].map((el) => el.textContent)).toEqual([
      "eager",
      "ondemand",
      "inherit",
    ]);
  },
};
