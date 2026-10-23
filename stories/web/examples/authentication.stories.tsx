import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CheckboxField, InputField, useAppForm } from "@/components/app-form";
import { CenteredLayout } from "@/components/centered-layout";
import { PasswordField } from "@/components/password-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormElement } from "@/components/ui/form-element";
import { KeyRound, UserRound } from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { ToastProvider, useToast } from "@/components/ui/toast";

/**
 * Sign in, sign up and "check your email": each a page that is one card in the middle of the
 * screen, drawn instead of the app shell. The forms are bound fields, so an error waits until a
 * field is touched or the form is submitted, and a password the server refuses is an `Alert`
 * under the fields rather than an error on one of them.
 *
 * Sign in with any address and the password `correct horse` to see it succeed.
 */
type Screen = "sign-in" | "sign-up" | "check-email";
type Args = { screen: Screen };

const meta = {
  title: "Examples/Web/Authentication",
  parameters: { layout: "fullscreen" },
  args: { screen: "sign-in" },
  argTypes: {
    screen: {
      control: "inline-radio",
      options: ["sign-in", "sign-up", "check-email"],
      description: "Which of the three pages the flow starts on.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <Auth key={args.screen} {...args} />
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const PASSWORD = "correct horse";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** A text link in a sentence: `info`, as every link in the set is. */
function TextLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer bg-transparent p-0 font-medium text-info text-sm underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
    >
      {label}
    </button>
  );
}

function SignIn({ go }: { go: (screen: Screen) => void }) {
  const toast = useToast();
  const [refused, setRefused] = useState(false);
  const form = useAppForm({
    defaultValues: { email: "", password: "", remember: true },
    onSubmit: async ({ value }) => {
      setRefused(false);
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (value.password !== PASSWORD) {
        setRefused(true);
        return;
      }
      toast(`Signed in as ${value.email}.`, "positive");
    },
  });
  return (
    <CenteredLayout
      level={1}
      iconSlot={<KeyRound />}
      title="Sign in to Acme Studio"
      description="Use the email address your team invited."
      contentSlot={
        <FormElement
          id="sign-in"
          onSubmit={() => form.handleSubmit()}
          className="flex flex-col gap-4"
        >
          {refused ? (
            <Alert
              variant="destructive"
              title="That email and password do not match"
              description="Check both, or reset the password. Five more tries before the account locks for an hour."
            />
          ) : null}
          <InputField
            form={form}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.example"
            required
            validators={{
              onChange: ({ value }) =>
                value.trim() === ""
                  ? "Enter your email address."
                  : isEmail(value)
                    ? undefined
                    : "That does not look like an email address.",
            }}
          />
          <PasswordField
            form={form}
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            actionSlot={<TextLink label="Forgot it?" onClick={() => go("check-email")} />}
            validators={{
              onChange: ({ value }) => (value === "" ? "Enter your password." : undefined),
            }}
          />
          <CheckboxField form={form} name="remember" label="Keep me signed in on this device" />
        </FormElement>
      }
      footerSlot={
        <p className="text-foreground/60 text-sm">
          New here? <TextLink label="Create an account" onClick={() => go("sign-up")} />
        </p>
      }
      footerActionsSlot={
        <form.AppForm>
          <form.SubmitButton form="sign-in" content="Sign in" pendingLabel="Signing in…" />
        </form.AppForm>
      }
    />
  );
}

function SignUp({ go }: { go: (screen: Screen) => void }) {
  const form = useAppForm({
    defaultValues: { name: "", email: "", password: "", confirm: "", terms: false },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      go("check-email");
    },
  });
  return (
    <CenteredLayout
      level={1}
      iconSlot={<UserRound />}
      title="Create your account"
      description="Free for three people. No card needed."
      cardClassName="max-w-md"
      contentSlot={
        <FormElement
          id="sign-up"
          onSubmit={() => form.handleSubmit()}
          className="flex flex-col gap-4"
        >
          <Button variant="outline" content="Continue with single sign-on" />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-foreground/60 text-xs">or with an email address</span>
            <Separator className="flex-1" />
          </div>
          <InputField
            form={form}
            name="name"
            label="Your name"
            autoComplete="name"
            required
            validators={{
              onChange: ({ value }) => (value.trim() ? undefined : "Tell us what to call you."),
            }}
          />
          <InputField
            form={form}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            required
            validators={{
              onChange: ({ value }) =>
                isEmail(value) ? undefined : "Enter an address like you@company.example.",
            }}
          />
          <PasswordField
            form={form}
            name="password"
            label="Password"
            autoComplete="new-password"
            description="Twelve characters or more. A short sentence is easier to remember."
            required
            validators={{
              onChange: ({ value }) =>
                value.length < 12 ? `${12 - value.length} more characters.` : undefined,
            }}
            // The bound fields' validators have no `onChangeListenTo`, so the confirmation is
            // asked again from here once it has been typed into.
            listeners={{
              onChange: () => {
                if (form.state.fieldMeta.confirm?.isTouched) {
                  void form.validateField("confirm", "change");
                }
              },
            }}
          />
          <PasswordField
            form={form}
            name="confirm"
            label="Password, again"
            autoComplete="new-password"
            required
            validators={{
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue("password")
                  ? "The two passwords are different."
                  : undefined,
            }}
          />
          <CheckboxField
            form={form}
            name="terms"
            label="I agree to the terms of service"
            validators={{
              onChange: ({ value }) => (value ? undefined : "Agree to the terms to continue."),
            }}
          />
        </FormElement>
      }
      footerSlot={
        <p className="text-foreground/60 text-sm">
          Have an account? <TextLink label="Sign in" onClick={() => go("sign-in")} />
        </p>
      }
      footerActionsSlot={
        <form.AppForm>
          <form.SubmitButton
            form="sign-up"
            variant="info"
            content="Create account"
            pendingLabel="Creating…"
          />
        </form.AppForm>
      }
    />
  );
}

function CheckEmail({ go }: { go: (screen: Screen) => void }) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  return (
    <CenteredLayout
      level={1}
      title="Check your email"
      description="We sent a link to the address you gave. It works for 30 minutes."
      contentSlot={
        <p className="text-foreground text-sm">
          Nothing after a few minutes? Look in your spam folder, or send it again.
        </p>
      }
      footerActionsSlot={
        <>
          <Button variant="outline" content="Back to sign in" onClick={() => go("sign-in")} />
          <Button
            content="Send it again"
            loading={sending}
            loadingLabel="Sending…"
            onClick={() => {
              setSending(true);
              setTimeout(() => {
                setSending(false);
                toast("Sent. It can take a minute to arrive.", "info");
              }, 700);
            }}
          />
        </>
      }
    />
  );
}

function Auth({ screen: initial }: Args) {
  const [screen, setScreen] = useState<Screen>(initial);
  return screen === "sign-in" ? (
    <SignIn go={setScreen} />
  ) : screen === "sign-up" ? (
    <SignUp go={setScreen} />
  ) : (
    <CheckEmail go={setScreen} />
  );
}

/** The sign-in page, untouched: no field is red until it has been visited. */
export const SignInPage: Story = { name: "Sign in" };

/** A wrong password: the server's answer is an alert over the fields, not a field's error. */
export const SignInRefused: Story = {
  name: "Sign in, refused",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: /Email/ }), "mara@acme.example");
    await userEvent.type(canvas.getByLabelText(/^Password/), "hunter2");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent("That email and password do not match"),
    );
  },
};

/** Submitted empty: every field says what it needs. */
export const SignUpPage: Story = {
  name: "Sign up",
  args: { screen: "sign-up" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await expect(await canvas.findByText("Tell us what to call you.")).toBeVisible();
    await expect(canvas.getByText("Agree to the terms to continue.")).toBeVisible();
  },
};

/** After sign-up or a reset: the page that waits on the inbox. */
export const CheckEmailPage: Story = { name: "Check your email", args: { screen: "check-email" } };
