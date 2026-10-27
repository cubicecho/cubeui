import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DialogLayout } from "@/components/dialog-layout";
import { Disclosure } from "@/components/disclosure";
import { EmptyState } from "@/components/empty-state";
import { FileTree } from "@/components/file-tree";
import { StickyHeaderContentFooter } from "@/components/header-content-footer";
import { List } from "@/components/list";
import { ListItem } from "@/components/list-item";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PageHeader } from "@/components/page-header";
import { SplitLayout } from "@/components/split-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code";
import { ConfirmProvider, useConfirm } from "@/components/ui/confirm";
import { CopyButton } from "@/components/ui/copy-button";
import { DownloadButton } from "@/components/ui/download-button";
import {
  Ellipsis,
  FilePen,
  FileText,
  FolderPen,
  Pencil,
  Plus,
  Trash2,
} from "@/components/ui/icons";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { SearchInput } from "@/components/ui/search-input";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatAgo, formatBytes } from "@/lib/format";
import { AppShell, Avatar } from "./app-shell";
import { TODAY } from "./fixtures";

/**
 * A docs space as two panes: the folder tree with the open file selected, and the open file
 * drawn as a document with its header, its front matter and its history folded under it.
 *
 * Editing a doc opens the editor in a dialog with a Save, and renaming one is a dialog too —
 * nothing in the tree or the document becomes a field where it sits.
 */
type Args = { file: string; longTitle: boolean };

const meta = {
  title: "Examples/Web/Docs",
  parameters: { layout: "fullscreen" },
  args: { file: "handbook/onboarding.md", longTitle: false },
  argTypes: {
    file: {
      control: "select",
      options: [
        "README.md",
        "handbook/onboarding.md",
        "handbook/time-off.md",
        "engineering/deploys.md",
        "engineering/runbooks/database.md",
        "engineering/empty.md",
      ],
      description: "The doc open in the second pane.",
    },
    longTitle: {
      control: "boolean",
      description: "Give the open doc a title long enough to wrap the header.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <ConfirmProvider>
        <AppShell current="docs" page={<Docs key={args.file} {...args} />} />
      </ConfirmProvider>
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

type Doc = {
  path: string;
  type: "file";
  size: number;
  title: string;
  draft?: boolean;
  owner: string;
  updated: Date;
  text: string;
};

const ago = (minutes: number) => new Date(TODAY.getTime() - minutes * 60 * 1000);

const ONBOARDING = `Welcome to the studio. This page is the first week, in order.

## Before day one

- [x] Laptop ordered and shipped
- [x] Accounts: email, chat, the design files
- [ ] A buddy picked from the team

## Day one

Meet your buddy at 10. They walk you through **the board**, the docs space and where the
coffee is. Read [the deploy notes](engineering/deploys.md) before you push anything.

### Tools

| Tool | What for | Ask |
| --- | --- | --- |
| Acme Studio | Tasks and docs | Inès |
| The design files | Every screen we ship | Mara |
| CI | Builds and deploys | Theo |

## The first week

By Friday you should have shipped one small thing — a copy fix counts. The point is to have
been through review once, not to impress anybody.

> If something on this page is wrong, fix it. You are the last person who read it with fresh eyes.
`;

const DEPLOYS = `Every merge to \`main\` deploys to staging. Production is a tag.

## Cutting a release

\`\`\`bash
git switch main && git pull
npm run release -- --minor
git push --follow-tags
\`\`\`

The tag starts the production job. It waits for a second approval in CI before it runs.

## Rolling back

Re-run the previous tag's job. Do not revert on \`main\` and wait for a new tag; that is ten
minutes slower and takes a reviewer you may not have at 2 am.
`;

const DOCS: readonly Doc[] = [
  {
    path: "README.md",
    type: "file",
    size: 812,
    title: "Studio docs",
    owner: "Inès Duval",
    updated: ago(60 * 24 * 9),
    text: "Start with the [handbook](handbook/onboarding.md). Engineering notes are under `engineering/`.",
  },
  {
    path: "handbook/onboarding.md",
    type: "file",
    size: 2310,
    title: "Onboarding",
    owner: "Inès Duval",
    updated: ago(42),
    text: ONBOARDING,
  },
  {
    path: "handbook/time-off.md",
    type: "file",
    size: 1104,
    title: "Time off",
    draft: true,
    owner: "Sana Iqbal",
    updated: ago(60 * 26),
    text: "Book it in the calendar and tell your project lead. **Draft:** the carry-over rule is still being agreed.",
  },
  {
    path: "engineering/deploys.md",
    type: "file",
    size: 1880,
    title: "Deploys",
    owner: "Theo Park",
    updated: ago(60 * 5),
    text: DEPLOYS,
  },
  {
    path: "engineering/runbooks/database.md",
    type: "file",
    size: 4096,
    title: "Database runbook",
    owner: "Kofi Mensah",
    updated: ago(60 * 24 * 30),
    text: "## When the replica lags\n\nCheck the long-running queries first.",
  },
  {
    path: "engineering/empty.md",
    type: "file",
    size: 0,
    title: "Untitled",
    draft: true,
    owner: "Theo Park",
    updated: ago(5),
    text: "",
  },
];

const PINNED = DOCS.filter((doc) => doc.path === "README.md");
const ENTRIES = DOCS.filter((doc) => doc.path !== "README.md");

const LONG_TITLE =
  "Onboarding for designers, engineers and everyone in between: the first week, the first month";

function EditDialog({
  doc,
  open,
  onOpenChange,
  onSave,
}: {
  doc: Doc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(doc.text);
  const [saving, setSaving] = useState(false);
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={`Edit ${doc.title}`}
      description={doc.path}
      hasUnsavedChanges={text !== doc.text}
      contentSlot={
        <MarkdownEditor
          aria-label="Document source"
          value={text}
          onValueChange={setText}
          rows={14}
        />
      }
      footerSlot={
        <span className="text-foreground/60 text-xs">
          {text === doc.text ? "No changes" : `${text.length - doc.text.length} characters changed`}
        </span>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <Button
            variant="positive"
            content="Save"
            disabled={text === doc.text}
            loading={saving}
            loadingLabel="Saving…"
            onClick={() => {
              setSaving(true);
              setTimeout(() => {
                setSaving(false);
                onSave(text);
              }, 500);
            }}
          />
        </>
      )}
    />
  );
}

function Docs({ file, longTitle }: Args) {
  const toast = useToast();
  const confirm = useConfirm();
  const [docs, setDocs] = useState<readonly Doc[]>(DOCS);
  const [selected, setSelected] = useState(file);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const doc = docs.find((d) => d.path === selected);
  const title = doc && longTitle && doc.path === "handbook/onboarding.md" ? LONG_TITLE : doc?.title;

  const remove = async (path: string) => {
    const ok = await confirm({
      title: `Delete ${path}?`,
      description: "Links to it from other docs stop working, and its history goes with it.",
    });
    if (ok) {
      setDocs((all) => all.filter((d) => d.path !== path));
      toast("Doc deleted.", "info");
    }
  };

  const shownEntries = ENTRIES.filter(
    (entry) =>
      docs.some((d) => d.path === entry.path) &&
      entry.path.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <SplitLayout
        className="lg:h-full"
        firstWidth="sm"
        stackBelow="lg"
        divider="line"
        firstSlot={
          <StickyHeaderContentFooter
            headerSlot={
              <div className="flex items-center gap-2 p-3">
                <SearchInput
                  label="Filter docs"
                  placeholder="Filter docs"
                  value={query}
                  onChangeText={setQuery}
                />
                <Button variant="info" size="icon" aria-label="New doc" iconSlot={<Plus />} />
              </div>
            }
            contentClassName="px-2 pb-3"
            contentSlot={
              shownEntries.length === 0 ? (
                <EmptyState compact title="No doc's path has that in it." className="px-2" />
              ) : (
                <FileTree
                  label="Docs"
                  pinned={query === "" ? PINNED : []}
                  entries={shownEntries}
                  selected={selected}
                  onSelect={setSelected}
                  // A soft badge on the selected row sits on the `active` fill, where its words
                  // fall under 4.5:1; that row says "Draft" as the plain meta text instead.
                  meta={(node) =>
                    node.entry?.draft && node.path !== selected ? (
                      <Badge variant="warning-soft">Draft</Badge>
                    ) : node.entry?.draft ? (
                      "Draft"
                    ) : node.entry ? (
                      formatBytes(node.entry.size)
                    ) : null
                  }
                  actionSlot={(node) =>
                    node.entry ? (
                      <Menu>
                        <MenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            aria-label={`Actions for ${node.path}`}
                            iconSlot={<Ellipsis />}
                          />
                        </MenuTrigger>
                        <MenuContent align="end" aria-label={`Actions for ${node.path}`}>
                          <MenuItem iconSlot={<FilePen />} label="Rename…" onSelect={() => {}} />
                          <MenuItem iconSlot={<FolderPen />} label="Move to…" onSelect={() => {}} />
                          <MenuSeparator />
                          <MenuItem
                            iconSlot={<Trash2 />}
                            label="Delete"
                            destructive
                            onSelect={() => void remove(node.path)}
                          />
                        </MenuContent>
                      </Menu>
                    ) : null
                  }
                />
              )
            }
          />
        }
        secondSlot={
          doc ? (
            <StickyHeaderContentFooter
              width="prose"
              headerSlot={
                <PageHeader
                  level={2}
                  breadcrumbsSlot={
                    <span className="font-mono text-foreground/60 text-xs">{doc.path}</span>
                  }
                  iconSlot={<FileText />}
                  title={title}
                  description={`${doc.owner} · edited ${formatAgo(doc.updated, TODAY)}`}
                  actionSlot={
                    <>
                      {doc.draft ? <Badge variant="warning-soft">Draft</Badge> : null}
                      <CopyButton
                        value={`https://app.acme.example/docs/${doc.path}`}
                        label="Copy a link to this doc"
                      />
                      <DownloadButton
                        label={`Download ${doc.path}`}
                        filename={doc.path.split("/").pop() ?? "doc.md"}
                        mimeType="text/markdown"
                        source={doc.text}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        iconSlot={<Pencil />}
                        content="Edit"
                        onClick={() => setEditing(true)}
                      />
                    </>
                  }
                />
              }
              contentClassName="gap-6 py-6"
              contentSlot={
                <>
                  <Markdown
                    content={doc.text}
                    collapsible
                    emptySlot={
                      <EmptyState
                        iconSlot={<FileText />}
                        title="This doc is empty"
                        description="Edit it to write the first paragraph."
                        actionSlot={
                          <Button
                            variant="outline"
                            iconSlot={<Pencil />}
                            content="Edit"
                            onClick={() => setEditing(true)}
                          />
                        }
                      />
                    }
                  />
                  <div className="flex flex-col gap-3 border-foreground/10 border-t pt-4">
                    <Disclosure
                      title="Front matter"
                      description="What the docs space knows about this file."
                      contentClassName="pt-2"
                      contentSlot={
                        <CodeBlock
                          title="front matter"
                          language="yaml"
                          content={`title: ${doc.title}\nowner: ${doc.owner}\ndraft: ${doc.draft ? "true" : "false"}\nsize: ${doc.size}`}
                          actionSlot={<CopyButton value={doc.path} label="Copy the path" />}
                        />
                      }
                    />
                    <Disclosure
                      title="History (3)"
                      contentSlot={
                        <List
                          label="History"
                          contentSlot={[doc.owner, "Mara Quinn", "Theo Park"].map((name, index) => (
                            <ListItem
                              key={name}
                              leadingSlot={<Avatar name={name} size="sm" />}
                              title={index === 0 ? "Rewrote the first week" : "Fixed a broken link"}
                              description={name}
                              meta={formatAgo(ago(42 + index * 60 * 24 * 3), TODAY)}
                            />
                          ))}
                        />
                      }
                    />
                  </div>
                </>
              }
            />
          ) : (
            <EmptyState
              level={2}
              iconSlot={<FileText />}
              title="No doc open"
              description="Choose one from the tree."
            />
          )
        }
      />
      {doc ? (
        // Keyed by the doc, so the draft starts from the doc that is open.
        <EditDialog
          key={doc.path}
          doc={doc}
          open={editing}
          onOpenChange={setEditing}
          onSave={(text) => {
            setDocs((all) =>
              all.map((d) => (d.path === doc.path ? { ...d, text, size: text.length } : d)),
            );
            setEditing(false);
            toast("Saved.", "positive");
          }}
        />
      ) : null}
    </>
  );
}

/** A doc with headings that fold, a table, a task list and a quote. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^deploys\.md/ }));
    await expect(canvas.getByRole("heading", { name: "Deploys", level: 2 })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Front matter/ }));
    await expect(canvas.getByText(/owner: Theo Park/)).toBeVisible();
  },
};

/** A title long enough to wrap: the actions drop under it rather than squeezing it. */
export const LongTitle: Story = { args: { longTitle: true } };

/** A doc with nothing written yet. */
export const EmptyDoc: Story = { args: { file: "engineering/empty.md" } };
