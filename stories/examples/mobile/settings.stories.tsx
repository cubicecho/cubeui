import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ConfirmButton } from "../../../registry/layout/confirm-button";
import { DescriptionList, PropertyRow } from "../../../registry/layout/description-list";
import { DialogLayout } from "../../../registry/layout/dialog-layout";
import { PageLayout } from "../../../registry/layout/page-layout";
import { Section } from "../../../registry/layout/section";
import { SettingRow } from "../../../registry/layout/setting-row";
import { Button } from "../../../registry/ui/button";
import { createAppForm, Form } from "../../../registry/ui/form";
import { Pencil } from "../../../registry/ui/icons";
import { RadioGroup, RadioGroupItem } from "../../../registry/ui/radio-group";
import { Switch } from "../../../registry/ui/switch.tsx";
import { SwitchField } from "../../../registry/ui/switch-field.tsx";
import { ThemePicker } from "../../../registry/ui/theme-picker";
import type { ThemePreference } from "../../../registry/ui/theme-preference-base";
import { ToastProvider, useToast } from "../../../registry/ui/toast";
import { MobileShell, PHONE } from "./shell";

/**
 * A phone's settings screen: the account's facts with a rename through a dialog form, sections of
 * switches and setting rows on cards, the theme as a compact segmented control, a text size as
 * radios, and the account's destructive actions behind confirms.
 */
const meta = {
  title: "Examples/Mobile/Settings",
  parameters: { layout: "fullscreen" },
  globals: PHONE,
  render: () => (
    <ToastProvider>
      <MobileShell current="settings" screen={<Settings />} />
    </ToastProvider>
  ),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const { useAppForm } = createAppForm({});

function RenameDialog({
  name,
  open,
  onOpenChange,
  onRename,
}: {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (name: string) => void;
}) {
  const form = useAppForm({
    defaultValues: { name },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      onRename(value.name.trim());
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Your name"
      description="Shown to the people you share a project with."
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <form.AppForm>
          <Form>
            <form.AppField
              name="name"
              validators={{
                onChange: ({ value }) => (value.trim() ? undefined : "Your name cannot be empty."),
              }}
            >
              {(field) => <field.InputField label="Name" autoComplete="name" />}
            </form.AppField>
          </Form>
        </form.AppForm>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onPress={close} content="Cancel" />
          <form.AppForm>
            <form.SubmitButton isEdit editLabel="Save" />
          </form.AppForm>
        </>
      )}
    />
  );
}

function Settings() {
  const toast = useToast();
  const [name, setName] = useState("Mara Quinn");
  const [renaming, setRenaming] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [badge, setBadge] = useState(true);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [size, setSize] = useState("default");

  return (
    <PageLayout
      title="Settings"
      contentSlot={
        <>
          <Section
            title="Account"
            surface="card"
            contentSlot={
              <DescriptionList
                layout="stacked"
                contentSlot={[
                  <PropertyRow
                    key="name"
                    label="Name"
                    value={name}
                    actionSlot={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Change your name"
                        iconSlot={<Pencil />}
                        onPress={() => setRenaming(true)}
                      />
                    }
                  />,
                  <PropertyRow key="email" label="Email" value="mara@acme.example" />,
                  <PropertyRow key="plan" label="Plan" value="Team" hint="Renews on Nov 1" />,
                ]}
              />
            }
          />
          <RenameDialog
            key={name}
            name={name}
            open={renaming}
            onOpenChange={setRenaming}
            onRename={(next) => {
              setName(next);
              setRenaming(false);
              toast("Name changed.", "positive");
            }}
          />

          <Section
            title="Notifications"
            surface="card"
            contentSlot={
              <>
                <SwitchField
                  id="mobile-reminders"
                  label="Reminders"
                  description="On the morning a task is due."
                  checked={reminders}
                  onCheckedChange={setReminders}
                />
                <SwitchField
                  id="mobile-sounds"
                  label="Sounds"
                  description="Turned off by the system's Focus mode."
                  checked={sounds}
                  onCheckedChange={setSounds}
                  disabled
                />
                <SettingRow
                  title="Count on the app icon"
                  description="How many tasks are due today."
                  actionSlot={({ titleId }) => (
                    <Switch
                      checked={badge}
                      onCheckedChange={setBadge}
                      aria-labelledby={titleId}
                      accessibilityLabel="Count on the app icon"
                    />
                  )}
                />
              </>
            }
          />

          <Section
            title="Appearance"
            surface="card"
            contentSlot={
              <>
                <SettingRow
                  title="Theme"
                  actionSlot={
                    <ThemePicker variant="compact" value={theme} onValueChange={setTheme} />
                  }
                />
                <RadioGroup aria-label="Text size" value={size} onValueChange={setSize}>
                  <RadioGroupItem
                    value="default"
                    label="Default"
                    description="The system's size."
                  />
                  <RadioGroupItem
                    value="large"
                    label="Large"
                    description="One step up, everywhere."
                  />
                </RadioGroup>
              </>
            }
          />

          <Section
            title="Account actions"
            surface="card"
            contentSlot={
              <>
                <SettingRow
                  description="Sign out on every phone and browser except this one."
                  actionSlot={
                    <ConfirmButton
                      variant="destructive-outline"
                      size="sm"
                      content="Sign out everywhere else"
                      title="Sign out of 3 other devices?"
                      description="Your laptop, tablet and work browser will ask you to sign in again."
                      confirmLabel="Sign out"
                      onConfirm={() => toast("Signed out of 3 devices.", "info")}
                    />
                  }
                />
                <SettingRow
                  description="Your tasks and projects are deleted. Shared projects stay with their teams."
                  actionSlot={
                    <ConfirmButton
                      variant="destructive"
                      size="sm"
                      content="Delete account"
                      title="Delete your account?"
                      description="Your 46 tasks and 3 private projects are deleted for good. Shared projects stay with their teams."
                      requireText="delete my account"
                      onConfirm={() => toast("Account deleted.", "info")}
                    />
                  }
                />
              </>
            }
          />
          <Text className="pb-4 text-center text-foreground/60 text-xs">Acme Tasks 4.2.0</Text>
        </>
      }
    />
  );
}

/** The whole screen. Changes the name through its dialog. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Change your name" }));
    const field = await body.findByLabelText("Name");
    await userEvent.clear(field);
    await userEvent.type(field, "Mara Q.");
    await userEvent.click(body.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(canvas.getByText("Mara Q.")).toBeVisible());
  },
};
