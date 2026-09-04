import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";
import { PasswordInput } from "@/registry/new-york/control/password-input";

function Harness({
  initial = "",
  ...props
}: Partial<React.ComponentProps<typeof PasswordInput>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="w-72">
      <PasswordInput
        aria-label="Token"
        placeholder="Bearer token"
        {...props}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}

function SubmitCounter() {
  const [submits, setSubmits] = useState(0);
  return (
    <form
      className="w-72 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((n) => n + 1);
      }}
    >
      <PasswordInput aria-label="Token" />
      <output data-testid="submits">{submits}</output>
    </form>
  );
}

const meta = {
  title: "Control/PasswordInput",
  component: Harness,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

/** The masking is the `type`, so the reveal is a real change of input, not a CSS trick. */
export const RevealingShowsTheValue: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByLabelText("Token");
    await userEvent.type(box, "hunter2");
    expect(box).toHaveAttribute("type", "password");

    await userEvent.click(canvas.getByRole("button", { name: "Show password" }));
    expect(box).toHaveAttribute("type", "text");

    await userEvent.click(canvas.getByRole("button", { name: "Hide password" }));
    expect(box).toHaveAttribute("type", "password");
  },
};

/**
 * The button is `type="button"`. Written without it — which is how it is written by hand, because
 * it works fine outside a form — reading the password submits the login.
 */
export const RevealingDoesNotSubmit: Story = {
  render: () => <SubmitCounter />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show password" }));
    expect(canvas.getByTestId("submits")).toHaveTextContent("0");
  },
};

/** An icon-only button with no name is a screen reader saying "button". */
export const TheButtonIsNamedForWhatItWillDo: Story = {
  play: async ({ canvas }) => {
    const reveal = canvas.getByRole("button", { name: "Show password" });
    await userEvent.click(reveal);
    expect(reveal).toHaveAccessibleName("Hide password");
  },
};

/** Off, there is no button — and nothing reserving room for one. */
export const WithoutTheReveal: Story = {
  args: { revealable: false },
  play: async ({ canvas }) => {
    expect(canvas.queryByRole("button")).toBeNull();
    expect(canvas.getByLabelText("Token")).toHaveAttribute("type", "password");
  },
};

export const Disabled: Story = { args: { disabled: true, initial: "hunter2" } };
