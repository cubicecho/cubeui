import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text, View } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CardLayout } from "../../../registry/layout/card-layout";
import { DescriptionList, PropertyRow } from "../../../registry/layout/description-list";
import { DetailHeader } from "../../../registry/layout/detail-header";
import { DetailPage } from "../../../registry/layout/detail-page";
import { EmptyState } from "../../../registry/layout/empty-state";
import { List } from "../../../registry/layout/list";
import { ListItem } from "../../../registry/layout/list-item";
import { Page } from "../../../registry/layout/page";
import { PageLayout } from "../../../registry/layout/page-layout";
import { StatTile } from "../../../registry/layout/stat-tile";
import { Alert } from "../../../registry/ui/alert";
import { Badge } from "../../../registry/ui/badge.tsx";
import { Button } from "../../../registry/ui/button";
import { ColorDot } from "../../../registry/ui/color-dot";
import { ConfirmProvider, useConfirm } from "../../../registry/ui/confirm";
import { Ellipsis, Folder, Pencil, Trash2 } from "../../../registry/ui/icons";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../../registry/ui/menu.tsx";
import { Progress } from "../../../registry/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../registry/ui/tabs.tsx";
import { ToastProvider, useToast } from "../../../registry/ui/toast";
import { Initials, MobileShell, PHONE } from "./shell";

/**
 * A phone's list-and-detail as two screens: the projects as pressable rows, and a project's own
 * screen with a back button, its colour and status, a ⋯ menu whose Delete asks first, figures,
 * progress, tabs and its people. The detail is a `DetailPage`, so its loading and not-found
 * branches are one prop away.
 */
type Args = { open: string | null; detail: "ready" | "loading" | "missing" };

const meta = {
  title: "Examples/Mobile/Project",
  parameters: { layout: "fullscreen" },
  globals: PHONE,
  args: { open: null, detail: "ready" },
  argTypes: {
    open: {
      control: "select",
      options: [null, "beacon", "atlas", "cobalt"],
      description: "The project whose screen is open, or none for the list.",
    },
    detail: {
      control: "inline-radio",
      options: ["ready", "loading", "missing"],
      description: "Whether the open project has loaded, is loading, or was not found.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <ConfirmProvider>
        <MobileShell
          current="projects"
          screen={<Projects key={`${args.open}-${args.detail}`} {...args} />}
        />
      </ConfirmProvider>
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

type Project = {
  id: string;
  name: string;
  color: string;
  client: string;
  lead: string;
  open: number;
  done: number;
  overdue: number;
  ships: string;
  people: readonly string[];
  status: "on-track" | "at-risk" | "paused";
};

const PROJECTS: readonly Project[] = [
  {
    id: "beacon",
    name: "Beacon app",
    color: "#16a34a",
    client: "Harbor Coffee Co.",
    lead: "Inès Duval",
    open: 11,
    done: 18,
    overdue: 2,
    ships: "Nov 14",
    people: ["Inès Duval", "Theo Park", "Kofi Mensah", "Sana Iqbal"],
    status: "at-risk",
  },
  {
    id: "atlas",
    name: "Atlas website",
    color: "#2563eb",
    client: "Northfield Library",
    lead: "Mara Quinn",
    open: 9,
    done: 4,
    overdue: 0,
    ships: "Dec 2",
    people: ["Mara Quinn", "Kofi Mensah"],
    status: "on-track",
  },
  {
    id: "cobalt",
    name: "Cobalt rebrand",
    color: "#9333ea",
    client: "In-house",
    lead: "Mara Quinn",
    open: 4,
    done: 22,
    overdue: 0,
    ships: "—",
    people: ["Mara Quinn", "Sana Iqbal"],
    status: "paused",
  },
];

const STATUS = {
  "on-track": { label: "On track", variant: "positive-soft" },
  "at-risk": { label: "At risk", variant: "warning-soft" },
  paused: { label: "Paused", variant: "secondary" },
} as const;

function ProjectScreen({
  project,
  loading,
  onBack,
  onDelete,
}: {
  project: Project | null;
  loading: boolean;
  onBack: () => void;
  onDelete: () => void;
}) {
  const confirm = useConfirm();
  const [tab, setTab] = useState("overview");
  return (
    <Page
      contentSlot={
        <DetailPage<Project>
          entity={project}
          loading={loading}
          notFoundLabel="This project was archived or deleted."
          contentSlot={(p) => (
            <View className="gap-4">
              <DetailHeader
                onBack={onBack}
                backLabel="Back to projects"
                color={p.color}
                colorLabel={p.name}
                title={p.name}
                subtitle={`${p.client} · led by ${p.lead}`}
                badgeSlot={
                  <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
                }
                actionsSlot={
                  <Menu>
                    <MenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Actions for ${p.name}`}
                        iconSlot={<Ellipsis />}
                      />
                    </MenuTrigger>
                    <MenuContent aria-label={`Actions for ${p.name}`}>
                      <MenuItem iconSlot={<Pencil />} label="Rename…" onSelect={() => {}} />
                      <MenuItem iconSlot={<Folder />} label="Archive" onSelect={() => {}} />
                      <MenuSeparator />
                      <MenuItem
                        iconSlot={<Trash2 />}
                        label="Delete"
                        destructive
                        onSelect={async () => {
                          const ok = await confirm({
                            title: `Delete ${p.name}?`,
                            description: `Its ${p.open + p.done} tasks are deleted for all ${p.people.length} people on it.`,
                          });
                          if (ok) {
                            onDelete();
                          }
                        }}
                      />
                    </MenuContent>
                  </Menu>
                }
              />
              {p.overdue > 0 ? (
                <Alert
                  variant="warning"
                  title={`${p.overdue} tasks are overdue`}
                  description="The ship date moves if they are not done by Monday."
                />
              ) : null}
              <View className="flex-row gap-3">
                <StatTile className="flex-1" label="Open" value={p.open} />
                <StatTile className="flex-1" label="Done" value={p.done} />
                <StatTile
                  className="flex-1"
                  label="Overdue"
                  value={p.overdue}
                  {...(p.overdue > 0 ? { valueClassName: "text-negative" } : {})}
                />
              </View>
              <Progress
                value={p.done}
                max={p.open + p.done}
                label={`${p.name} progress`}
                valueLabel={`${p.done} of ${p.open + p.done} tasks done`}
              />
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList aria-label="Project">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="people">People</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <CardLayout
                    contentSlot={
                      <DescriptionList
                        contentSlot={[
                          <PropertyRow key="client" label="Client" value={p.client} />,
                          <PropertyRow key="lead" label="Lead" value={p.lead} />,
                          <PropertyRow key="ships" label="Ships" value={p.ships} />,
                        ]}
                      />
                    }
                  />
                </TabsContent>
                <TabsContent value="people">
                  <List
                    label="People on the project"
                    contentSlot={p.people.map((person) => (
                      <ListItem
                        key={person}
                        leadingSlot={<Initials name={person} />}
                        title={person}
                        meta={person === p.lead ? "Lead" : undefined}
                      />
                    ))}
                  />
                </TabsContent>
              </Tabs>
            </View>
          )}
        />
      }
    />
  );
}

function Projects({ open: initial, detail }: Args) {
  const toast = useToast();
  const [projects, setProjects] = useState<readonly Project[]>(PROJECTS);
  const [open, setOpen] = useState<string | null>(initial);

  if (open !== null) {
    const project = detail === "missing" ? null : (projects.find((p) => p.id === open) ?? null);
    return (
      <ProjectScreen
        project={project}
        loading={detail === "loading"}
        onBack={() => setOpen(null)}
        onDelete={() => {
          setProjects((all) => all.filter((p) => p.id !== open));
          setOpen(null);
          toast("Project deleted.", "info");
        }}
      />
    );
  }

  return (
    <PageLayout
      title="Projects"
      description={`${projects.length} active`}
      contentSlot={
        projects.length === 0 ? (
          <EmptyState
            iconSlot={<Folder />}
            title="No projects"
            description="Ask a lead to add you to one."
          />
        ) : (
          <List
            label="Projects"
            contentSlot={projects.map((p) => (
              <ListItem
                key={p.id}
                leadingSlot={<ColorDot color={p.color} />}
                title={p.name}
                description={`${p.client} · ${p.open} open`}
                meta={
                  p.status === "on-track" ? undefined : (
                    <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
                  )
                }
                onPress={() => setOpen(p.id)}
              />
            ))}
          />
        )
      }
      footerSlot={<Text className="text-foreground/60 text-xs">Synced a minute ago</Text>}
    />
  );
}

/** The list. Opens a project and goes back. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Beacon app/ }));
    await expect(await canvas.findByText("2 tasks are overdue")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Back to projects" }));
    await waitFor(() => expect(canvas.getByText("3 active")).toBeVisible());
  },
};

/** A project's own screen, with its warning, figures and tabs. */
export const Detail: Story = { args: { open: "beacon" } };

/** The project screen while it loads. */
export const DetailLoading: Story = { args: { open: "beacon", detail: "loading" } };

/** A link to a project that is gone. */
export const DetailNotFound: Story = { args: { open: "beacon", detail: "missing" } };
