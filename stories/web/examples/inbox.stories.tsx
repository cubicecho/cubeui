import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Inbox as InboxIcon } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TextareaField, useAppForm } from "@/components/app-form";
import { ConfirmButton } from "@/components/confirm-button";
import { DetailHeader } from "@/components/detail-header";
import { DetailPage } from "@/components/detail-page";
import { EmptyState } from "@/components/empty-state";
import { StickyHeaderContentFooter } from "@/components/header-content-footer";
import { List } from "@/components/list";
import { ListItem } from "@/components/list-item";
import { PageHeader } from "@/components/page-header";
import { SplitLayout } from "@/components/split-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code";
import { CopyButton } from "@/components/ui/copy-button";
import { FormElement } from "@/components/ui/form-element";
import { Trash2 } from "@/components/ui/icons";
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
 * `DetailPage`, so it has a loading and a not-found branch of its own.
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
        <StickyHeaderContentFooter
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
        <StickyHeaderContentFooter
          width="prose"
          contentClassName="py-4"
          contentSlot={
            <DetailPage<Message>
              entity={open}
              loading={detail === "loading"}
              notFoundLabel="That message was moved or deleted."
              contentSlot={(message) => (
                <div className="flex flex-col gap-4">
                  <DetailHeader
                    onBack={() => setOpenId(null)}
                    backLabel="Back to the inbox"
                    title={message.subject}
                    subtitle={`${message.from} · ${formatAgo(message.at, TODAY)}`}
                    badgeSlot={
                      message.label ? (
                        <Badge variant={LABEL_BADGE[message.label]}>{message.label}</Badge>
                      ) : null
                    }
                    actionsSlot={
                      <div className="flex gap-2">
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
                    }
                  />
                  <Separator />
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
                </div>
              )}
            />
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

/** The detail pane while the message loads. */
export const LoadingMessage: Story = { args: { detail: "loading" } };

/** A link to a message that is gone. */
export const MissingMessage: Story = { args: { detail: "missing" } };
