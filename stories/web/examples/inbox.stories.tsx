import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox as InboxIcon } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TextareaField, useAppForm } from "@/components/app-form";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState } from "@/components/empty-state";
import { HeaderContentFooter } from "@/components/header-content-footer";
import { List } from "@/components/list";
import { ListItem } from "@/components/list-item";
import { LoadState } from "@/components/load-state";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { SplitLayout } from "@/components/split-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code";
import { CopyButton } from "@/components/ui/copy-button";
import { FormElement } from "@/components/ui/form-element";
import { Archive, ArrowLeft, Trash2 } from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search-input";
import { Separator } from "@/components/ui/separator";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { formatAgo } from "@/lib/format";
import { AppShell, Avatar } from "./app-shell";
import { TODAY } from "./fixtures";

/**
 * An inbox as two panes: the messages as list rows, the chosen one tinted, and the message open
 * beside them with its header, its body, an attachment and a reply box. The detail pane is a
 * `PageLayout` that is always drawn, with a `LoadState` in its body: the title's bar while the
 * message loads, and the not-found block under the pane's title when it is gone.
 */
type Args = { detail: "ready" | "loading" | "missing" };

const meta = {
  title: "Examples/Web/Inbox",
  parameters: { layout: "fullscreen" },
  args: { detail: "ready" },
  argTypes: {
    detail: {
      control: "inline-radio",
      options: ["ready", "loading", "missing"],
      description: "Whether the open message has loaded, is loading, or was not found.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <AppShell current="inbox" page={<Inbox {...args} />} />
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

type Message = {
  id: string;
  from: string;
  subject: string;
  body: string;
  at: Date;
  unread: boolean;
  label?: "Client" | "Billing" | "Team";
  attachment?: string;
};

const ago = (minutes: number) => new Date(TODAY.getTime() - minutes * 60 * 1000);

const MESSAGES: readonly Message[] = [
  {
    id: "m1",
    from: "Harbor Coffee Co.",
    subject: "Feedback on the second round",
    body: "Thanks for turning this around so fast. The team loves the new menu layout.\n\nTwo things: the allergen icons are too small on a phone, and we'd like the seasonal section above the fold. Could we see those by Thursday?",
    at: ago(12),
    unread: true,
    label: "Client",
  },
  {
    id: "m2",
    from: "Theo Park",
    subject: "Staging is on the new build",
    body: "Staging now runs 1.4.0-rc.2. The webhook below is what the payment provider calls; paste it into their dashboard when you get a minute.",
    at: ago(95),
    unread: true,
    label: "Team",
    attachment: "https://staging.acme.example/hooks/payments/7f3c9a",
  },
  {
    id: "m3",
    from: "Billing",
    subject: "Your October invoice",
    body: "Your invoice for October is ready. Five seats on the Team plan, $40.00, charged to the card ending 4242 on November 1.",
    at: ago(60 * 7),
    unread: false,
    label: "Billing",
  },
  {
    id: "m4",
    from: "Sana Iqbal",
    subject:
      "Copy deck for the onboarding screens, with every empty state and error message we discussed on Tuesday",
    body: "Attached in the doc. I went with plain sentences everywhere and dropped the exclamation marks.",
    at: ago(60 * 26),
    unread: false,
    label: "Team",
  },
  {
    id: "m5",
    from: "Northfield Library",
    subject: "Kick-off next week?",
    body: "We'd love to get started on the new catalogue site. Does Tuesday morning work for a first call?",
    at: ago(60 * 24 * 3),
    unread: false,
    label: "Client",
  },
];

const LABEL_BADGE = { Client: "info-soft", Billing: "warning-soft", Team: "secondary" } as const;

function Reply({ to }: { to: string }) {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: { reply: "" },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast(`Reply sent to ${to}.`, "positive");
      form.reset();
    },
  });
  return (
    <FormElement onSubmit={() => form.handleSubmit()} className="flex flex-col gap-3">
      <TextareaField
        form={form}
        name="reply"
        label={`Reply to ${to}`}
        rows={4}
        placeholder="Write a reply…"
        validators={{
          onSubmit: ({ value }) => (value.trim() ? undefined : "Write something first."),
        }}
      />
      <div className="flex justify-end gap-2">
        <form.AppForm>
          <form.SubmitButton content="Send" pendingLabel="Sending…" />
        </form.AppForm>
      </div>
    </FormElement>
  );
}

function Inbox({ detail }: Args) {
  const toast = useToast();
  const [messages, setMessages] = useState<readonly Message[]>(MESSAGES);
  const [openId, setOpenId] = useState<string | null>("m2");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const shown = messages
    .filter((m) => (unreadOnly ? m.unread : true))
    .filter((m) => `${m.from} ${m.subject}`.toLowerCase().includes(query.trim().toLowerCase()));
  const open = detail === "missing" ? null : messages.find((m) => m.id === openId);
  // Not there until the stand-in query has answered.
  const message = detail === "loading" ? undefined : open;

  const choose = (id: string) => {
    setOpenId(id);
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  };
  const remove = (id: string) => {
    setMessages((all) => all.filter((m) => m.id !== id));
    setOpenId(null);
  };

  return (
    <SplitLayout
      className="lg:h-full"
      firstWidth="two-fifths"
      stackBelow="lg"
      divider="line"
      firstSlot={
        <HeaderContentFooter
          scroll
          className="h-full"
          headerSlot={
            <PageHeader
              title="Inbox"
              actionSlot={
                <ToggleChip
                  size="sm"
                  selected={unreadOnly}
                  onClick={() => setUnreadOnly(!unreadOnly)}
                >
                  Unread only
                </ToggleChip>
              }
              contentSlot={
                <SearchInput
                  label="Search messages"
                  placeholder="Search messages"
                  value={query}
                  onChangeText={setQuery}
                />
              }
            />
          }
          contentClassName="p-2"
          contentSlot={
            shown.length === 0 ? (
              <EmptyState
                iconSlot={<InboxIcon />}
                title={unreadOnly ? "All caught up" : "No messages match"}
                description={unreadOnly ? "Nothing unread." : "Try a sender's name."}
              />
            ) : (
              <List
                label="Messages"
                contentSlot={shown.map((m) => (
                  <ListItem
                    key={m.id}
                    selected={m.id === openId}
                    onClick={() => choose(m.id)}
                    leadingSlot={<Avatar name={m.from} />}
                    title={m.from}
                    titleClassName={m.unread ? "font-semibold" : "font-normal"}
                    description={m.subject}
                    meta={
                      <span className="flex items-center gap-2 text-foreground/60 text-xs [[aria-current]_&]:text-foreground">
                        {m.unread ? <Badge variant="info-soft" label="Unread" /> : null}
                        {formatAgo(m.at, TODAY, { style: "narrow" })}
                      </span>
                    }
                  />
                ))}
              />
            )
          }
        />
      }
      secondSlot={
        <PageLayout
          width="prose"
          backSlot={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Back to the inbox"
              iconSlot={<ArrowLeft />}
              onClick={() => setOpenId(null)}
            />
          }
          title={message?.subject ?? "Message"}
          loading={detail === "loading"}
          description={message ? `${message.from} · ${formatAgo(message.at, TODAY)}` : undefined}
          actionSlot={
            message ? (
              <div className="flex items-center gap-2">
                {message.label ? (
                  <Badge variant={LABEL_BADGE[message.label]}>{message.label}</Badge>
                ) : null}
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Archive"
                  hint="Archive: out of the inbox, still searchable"
                  iconSlot={<Archive />}
                  onClick={() => {
                    remove(message.id);
                    toast("Archived.", "info");
                  }}
                />
                <ConfirmButton
                  variant="destructive-outline"
                  size="icon-sm"
                  aria-label="Delete"
                  iconSlot={<Trash2 />}
                  title="Delete this message?"
                  description={`“${message.subject}” is deleted for you. ${message.from} still has their copy.`}
                  onConfirm={() => remove(message.id)}
                />
              </div>
            ) : null
          }
          contentSlot={
            <>
              <LoadState
                query={{
                  isPending: detail === "loading",
                  isError: false,
                  error: null,
                  refetch: () => {},
                }}
                what="this message"
                record={message}
                notFoundLabel="Message not found"
                description="It was moved or deleted. The rest of the inbox is beside it."
                level={2}
              />
              {message ? (
                <>
                  {message.body.split("\n\n").map((paragraph) => (
                    <p key={paragraph} className="text-foreground text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {message.attachment ? (
                    <CodeBlock
                      content={message.attachment}
                      wrap
                      actionSlot={
                        <CopyButton value={message.attachment} label="Copy the webhook URL" />
                      }
                    />
                  ) : null}
                  <Separator />
                  <Reply to={message.from} />
                </>
              ) : null}
            </>
          }
        />
      }
    />
  );
}

/** A message open beside the list. Opens another, which marks it read. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Harbor Coffee Co\./ }));
    await waitFor(() =>
      expect(canvas.getByRole("heading", { name: "Feedback on the second round" })).toBeVisible(),
    );
  },
};

/** The detail pane while the message loads: a bar where its subject will be, and no rows. */
export const LoadingMessage: Story = {
  args: { detail: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const headers = canvasElement.querySelectorAll('[data-slot="page-header"]');
    await expect(headers[headers.length - 1]).toHaveAttribute("aria-busy", "true");
    await expect(canvasElement.querySelector('[data-slot="row-skeleton"]')).toBeNull();
    await expect(canvas.getByRole("button", { name: "Back to the inbox" })).toBeVisible();
  },
};

/** A link to a message that is gone: the pane keeps its title and says what happened. */
export const MissingMessage: Story = {
  args: { detail: "missing" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Message" })).toBeVisible();
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Message not found" }),
    ).toBeVisible();
    await expect(canvas.getByText(/moved or deleted/)).toBeVisible();
  },
};
