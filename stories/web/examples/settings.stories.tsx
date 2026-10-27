import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { InputField, useAppForm } from "@/components/app-form";
import { CardLayout } from "@/components/card-layout";
import { Combobox } from "@/components/combobox";
import { ConfirmButton } from "@/components/confirm-button";
import { DescriptionList, PropertyRow } from "@/components/description-list";
import { DialogLayout } from "@/components/dialog-layout";
import { PageLayout } from "@/components/page-layout";
import { Section } from "@/components/section";
import { SettingRow } from "@/components/setting-row";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DownloadButton } from "@/components/ui/download-button";
import { FormElement } from "@/components/ui/form-element";
import { Pencil, Trash2 } from "@/components/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { SwitchField } from "@/components/ui/switch-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemePicker } from "@/components/ui/theme-picker";
import type { PalettePreference, ThemePreference } from "@/components/ui/theme-preference-base";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { AppShell } from "./app-shell";
import { PEOPLE } from "./fixtures";

/**
 * A workspace's settings, as tabs whose list sits in the page header: facts with a rename that
 * goes through a dialog, a plan chosen from cards, notification switches, the theme, and a
 * danger zone whose delete asks for the workspace's name.
 *
 * Every value here is changed through a control that always looks like one, or through a form
 * with a Save — nothing turns into a field where it sits.
 */
type Tab = "general" | "notifications" | "appearance";
type Args = { tab: Tab };

const meta = {
  title: "Examples/Web/Settings",
  parameters: { layout: "fullscreen" },
  args: { tab: "general" },
  argTypes: {
    tab: {
      control: "inline-radio",
      options: ["general", "notifications", "appearance"],
      description: "The tab the page opens on.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <AppShell current="settings" page={<Settings key={args.tab} {...args} />} />
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const WORKSPACE_URL = "https://app.acme.example/w/acme-studio";

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
      await new Promise((resolve) => setTimeout(resolve, 400));
      onRename(value.name.trim());
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Rename the workspace"
      description="Members see the new name at once. Its address does not change."
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <FormElement onSubmit={() => form.handleSubmit()}>
          <InputField
            form={form}
            name="name"
            label="Name"
            required
            autoFocus
            validators={{
              onChange: ({ value }) =>
                value.trim() === ""
                  ? "A workspace needs a name."
                  : value.length > 32
                    ? "Keep it to 32 characters."
                    : undefined,
            }}
          />
        </FormElement>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <form.AppForm>
            <form.SubmitButton variant="positive" requireChanges content="Rename" />
          </form.AppForm>
        </>
      )}
    />
  );
}

function GeneralTab() {
  const toast = useToast();
  const [name, setName] = useState("Acme Studio");
  const [renaming, setRenaming] = useState(false);
  const [plan, setPlan] = useState("team");
  const [savedPlan, setSavedPlan] = useState("team");
  return (
    <>
      <Section
        title="Workspace"
        surface="card"
        contentSlot={
          <DescriptionList
            contentSlot={[
              <PropertyRow
                key="name"
                label="Name"
                value={name}
                actionSlot={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Rename the workspace"
                    iconSlot={<Pencil />}
                    onClick={() => setRenaming(true)}
                  />
                }
              />,
              <PropertyRow
                key="url"
                label="Address"
                value={WORKSPACE_URL}
                valueClassName="font-mono break-all"
                actionSlot={<CopyButton value={WORKSPACE_URL} label="Copy the address" />}
              />,
              <PropertyRow
                key="owner"
                label="Owner"
                value={PEOPLE[2]?.name ?? ""}
                hint="Only the owner can delete the workspace."
              />,
              <PropertyRow
                key="created"
                label="Created"
                value={formatDate(new Date(2024, 2, 11))}
                hint="5 members · 3 projects"
              />,
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
          toast("Workspace renamed.", "positive");
        }}
      />

      <Section
        title="Plan"
        description="Billed monthly to the card ending 4242. Change it any time."
        surface="card"
        actionSlot={
          plan === savedPlan ? (
            <Badge variant="positive-soft">
              Current: {savedPlan === "team" ? "Team" : savedPlan}
            </Badge>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                content="Keep current"
                onClick={() => setPlan(savedPlan)}
              />
              <Button
                size="sm"
                variant="positive"
                content="Change plan"
                onClick={() => {
                  setSavedPlan(plan);
                  toast("Plan changed. The next invoice is prorated.", "positive");
                }}
              />
            </>
          )
        }
        contentSlot={
          <RadioGroup aria-label="Plan" variant="card" value={plan} onValueChange={setPlan}>
            <RadioGroupItem value="free" label="Free" description="3 members, 2 projects." />
            <RadioGroupItem value="team" label="Team" description="$8 a member, every feature." />
            <RadioGroupItem
              value="business"
              label="Business"
              description="Single sign-on and an audit log."
            />
          </RadioGroup>
        }
      />

      <CardLayout
        level={2}
        title="Danger zone"
        description="Actions on the whole workspace. The last two cannot be taken back."
        className="border-negative/40"
        contentClassName="gap-4"
        contentSlot={
          <>
            <SettingRow
              title="Export everything"
              description="Every project, task and doc, as one JSON file."
              actionSlot={
                <DownloadButton
                  label="Export the workspace"
                  filename="acme-studio.json"
                  mimeType="application/json"
                  source={() => JSON.stringify({ workspace: name, projects: 3 }, null, 2)}
                />
              }
            />
            <SettingRow
              title="Archive the workspace"
              description="Members can still read it, but nothing new can be added."
              actionSlot={
                <ConfirmButton
                  variant="destructive-outline"
                  size="sm"
                  content="Archive"
                  title="Archive Acme Studio?"
                  description="Every project goes read-only and the open tasks stop sending reminders."
                  confirmLabel="Archive"
                  onConfirm={() => toast("Workspace archived.", "info")}
                />
              }
            />
            <SettingRow
              title="Delete the workspace"
              description="Its 3 projects, 31 tasks and 12 docs are deleted for every member."
              actionSlot={
                <ConfirmButton
                  variant="destructive"
                  size="sm"
                  iconSlot={<Trash2 />}
                  content="Delete workspace"
                  title="Delete Acme Studio?"
                  description="Its 3 projects, 31 tasks and 12 docs are deleted for every member, and the address stops working."
                  requireText={name}
                  requireTextLabel={
                    <>
                      Type <strong>{name}</strong> to delete it
                    </>
                  }
                  onConfirm={() => toast("Workspace deleted.", "info")}
                />
              }
            />
          </>
        }
      />
    </>
  );
}

const DAYS = [
  { value: "mon", label: "Monday" },
  { value: "fri", label: "Friday" },
  { value: "sun", label: "Sunday" },
];

function NotificationsTab() {
  const [assigned, setAssigned] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [digest, setDigest] = useState(true);
  const [digestDay, setDigestDay] = useState("mon");
  const [push, setPush] = useState(false);
  return (
    <>
      <Section
        title="Email"
        description="Sent to mara@acme.example."
        surface="card"
        contentSlot={
          <>
            <SwitchField
              id="notify-assigned"
              label="A task is assigned to me"
              checked={assigned}
              onCheckedChange={setAssigned}
            />
            <SwitchField
              id="notify-mentions"
              label="Someone mentions me"
              description="In a comment, a task's description or a doc."
              checked={mentions}
              onCheckedChange={setMentions}
            />
            <SwitchField
              id="notify-billing"
              label="Billing receipts"
              description="Only the owner gets receipts. Ask Inès to forward them."
              checked={false}
              onCheckedChange={() => {}}
              disabled
            />
          </>
        }
      />
      <Section
        title="Digest"
        surface="card"
        contentSlot={
          <>
            <SettingRow
              title="Weekly digest"
              description="What changed in your projects, in one email."
              actionSlot={({ titleId, descriptionId }) => (
                <Switch
                  checked={digest}
                  onCheckedChange={setDigest}
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                />
              )}
            />
            <SettingRow
              title="Send it on"
              description="At 8 in the morning, in your time zone."
              actionSlot={({ titleId }) => (
                <Combobox
                  aria-labelledby={titleId}
                  className="w-40"
                  options={DAYS}
                  value={digestDay}
                  onValueChange={setDigestDay}
                  disabled={digest === false}
                />
              )}
            />
          </>
        }
      />
      <Section
        title="On this device"
        surface="card"
        contentSlot={
          <>
            {push ? null : (
              <Alert
                variant="info"
                title="Push is off in this browser"
                description="Turn it on to hear about mentions while the tab is in the background."
              />
            )}
            <SettingRow
              title="Push notifications"
              description="Mentions and assignments, as they happen."
              actionSlot={({ titleId, descriptionId }) => (
                <Switch
                  checked={push}
                  onCheckedChange={setPush}
                  aria-labelledby={titleId}
                  aria-describedby={descriptionId}
                />
              )}
            />
          </>
        }
      />
    </>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [palette, setPalette] = useState<PalettePreference>("default");
  const [density, setDensity] = useState("comfortable");
  return (
    <>
      <Section
        title="Theme"
        description="Stored for this browser only. Here it is held by the story, so the page does not repaint."
        surface="card"
        contentSlot={
          <ThemePicker
            value={theme}
            onValueChange={setTheme}
            palettes={["default", "monokai"]}
            palette={palette}
            onPaletteChange={setPalette}
          />
        }
      />
      <Section
        title="Density"
        surface="card"
        contentSlot={
          <SettingRow
            title="Row height"
            description="Compact fits more tasks on a screen."
            actionSlot={({ titleId }) => (
              <RadioGroup
                aria-labelledby={titleId}
                variant="segmented"
                value={density}
                onValueChange={setDensity}
                className="w-64"
              >
                <RadioGroupItem value="compact" label="Compact" />
                <RadioGroupItem value="comfortable" label="Comfortable" />
              </RadioGroup>
            )}
          />
        }
      />
    </>
  );
}

function Settings({ tab: initial }: Args) {
  const [tab, setTab] = useState<string>(initial);
  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full">
      <PageLayout
        title="Settings"
        description="Acme Studio, and how it reaches you."
        width="prose"
        headerContentSlot={
          <TabsList aria-label="Settings">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
        }
        contentSlot={
          <>
            <TabsContent value="general" className="mt-0">
              <div className="flex flex-col gap-4">
                <GeneralTab />
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <div className="flex flex-col gap-4">
                <NotificationsTab />
              </div>
            </TabsContent>
            <TabsContent value="appearance" className="mt-0">
              <div className="flex flex-col gap-4">
                <AppearanceTab />
              </div>
            </TabsContent>
          </>
        }
      />
    </Tabs>
  );
}

/** The workspace's facts, its plan and the danger zone. Renames it through the dialog. */
export const General: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Rename the workspace" }));
    const dialog = await body.findByRole("dialog", { name: "Rename the workspace" });
    const save = within(dialog).getByRole("button", { name: "Rename" });
    await expect(save).toBeDisabled();
    const field = within(dialog).getByRole("textbox", { name: /Name/ });
    await userEvent.clear(field);
    await userEvent.type(field, "Acme Design");
    await userEvent.click(save);
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByText("Acme Design")).toBeVisible();
  },
};

/** Switches, one of them disabled with the reason under it, and a row with a select. */
export const Notifications: Story = { args: { tab: "notifications" } };

/** The theme and palette picker, and a segmented density choice. */
export const Appearance: Story = { args: { tab: "appearance" } };
