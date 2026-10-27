import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { InputField, SelectField, TextareaField, useAppForm } from "@/components/app-form";
import { CardLayout } from "@/components/card-layout";
import { ColorField } from "@/components/color-field";
import { DescriptionList, PropertyRow } from "@/components/description-list";
import { DialogLayout } from "@/components/dialog-layout";
import { EmptyState } from "@/components/empty-state";
import { List } from "@/components/list";
import { ListItem } from "@/components/list-item";
import { PageLayout } from "@/components/page-layout";
import { QueryError, QueryState } from "@/components/query-state";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { DownloadButton } from "@/components/ui/download-button";
import { FormElement } from "@/components/ui/form-element";
import { CircleCheck, Clock, Folder, Plus, TriangleAlert } from "@/components/ui/icons";
import { Progress } from "@/components/ui/progress";
import { SegmentedButton, SegmentedGroup } from "@/components/ui/segmented";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatAgo, formatDate } from "@/lib/format";
import { AppShell, Avatar } from "./app-shell";
import {
  type DataState,
  PEOPLE,
  PROJECTS,
  personName,
  projectName,
  queryFor,
  STATUS_BADGE,
  STATUS_LABELS,
  TASKS,
  type Task,
  TODAY,
} from "./fixtures";

/**
 * A team dashboard: the app shell, a page header with its actions, a row of stat tiles that
 * filter the table under them, the project's facts on a card and the team beside it.
 *
 * The `state` control flips the page through the ladder a dashboard climbs — loading, failed,
 * empty — so each rung can be reviewed where it actually sits rather than in isolation.
 */
type Args = { state: DataState };

const meta = {
  title: "Examples/Web/Dashboard",
  parameters: { layout: "fullscreen" },
  args: { state: "ready" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["ready", "loading", "empty", "error"],
      description: "Where the dashboard's data is: landed, on its way, empty, or failed.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <AppShell current="dashboard" page={<Dashboard {...args} />} />
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

type Filter = "open" | "overdue" | "review" | "done";

const isOverdue = (task: Task) =>
  task.status !== "done" && task.due !== null && task.due.getTime() < TODAY.getTime();

const FILTERS: Record<Filter, (task: Task) => boolean> = {
  open: (task) => task.status !== "done",
  overdue: isOverdue,
  review: (task) => task.status === "review",
  done: (task) => task.status === "done",
};

const FILTER_LABELS: Record<Filter, string> = {
  open: "Open tasks",
  overdue: "Overdue",
  review: "In review",
  done: "Done this week",
};

type Period = "7d" | "30d" | "90d";

function NewProjectDialog() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const form = useAppForm({
    defaultValues: { name: "", lead: "mara", color: "#2563eb", summary: "" },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast(`Created “${value.name}”.`, "positive");
      setOpen(false);
      form.reset();
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={setOpen}
      triggerSlot={<Button size="sm" variant="info" iconSlot={<Plus />} content="New project" />}
      title="New project"
      description="A project groups tasks, docs and a schedule under one name."
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <FormElement onSubmit={() => form.handleSubmit()} className="flex flex-col gap-4">
          <InputField
            form={form}
            name="name"
            label="Name"
            required
            placeholder="Delta launch"
            validators={{
              onChange: ({ value }) => (value.trim() ? undefined : "A project needs a name."),
            }}
          />
          <SelectField
            form={form}
            name="lead"
            label="Lead"
            options={PEOPLE.map((person) => ({ value: person.id, label: person.name }))}
          />
          <ColorField form={form} name="color" label="Colour" />
          <TextareaField
            form={form}
            name="summary"
            label="Summary"
            description="One or two sentences. Shown on the project's card."
            rows={3}
          />
        </FormElement>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <form.AppForm>
            <form.SubmitButton variant="info" content="Create project" pendingLabel="Creating…" />
          </form.AppForm>
        </>
      )}
    />
  );
}

function TaskTable({ tasks, caption }: { tasks: readonly Task[]; caption: string }) {
  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="text-right">Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableHead className="max-w-80 font-normal">
              <span className="block truncate text-foreground">{task.title}</span>
              <span className="text-foreground/60 text-xs">
                <span className="font-mono">{task.id}</span> · {projectName(task.project)}
              </span>
            </TableHead>
            <TableCell>
              <Badge variant={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</Badge>
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                <Avatar name={personName(task.assignee)} size="sm" />
                {personName(task.assignee)}
              </span>
            </TableCell>
            <TableCell
              className={isOverdue(task) ? "text-right text-negative" : "text-right tabular-nums"}
            >
              {task.due ? formatDate(task.due) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Dashboard({ state }: Args) {
  const [filter, setFilter] = useState<Filter>("open");
  const [period, setPeriod] = useState<Period>("7d");
  const query = queryFor(state);
  const tasks = state === "ready" ? TASKS : [];
  const shown = tasks.filter(FILTERS[filter]);
  const loading = state === "loading";
  const count = (which: Filter) => (state === "ready" ? TASKS.filter(FILTERS[which]).length : 0);
  const project = PROJECTS[1];

  return (
    <PageLayout
      title="Dashboard"
      description="How the studio's work stands this week."
      actionSlot={
        <>
          <DownloadButton
            label="Export the report"
            filename="acme-weekly.csv"
            mimeType="text/csv"
            source={() =>
              ["id,title,status", ...TASKS.map((t) => `${t.id},"${t.title}",${t.status}`)].join(
                "\n",
              )
            }
          />
          <NewProjectDialog />
        </>
      }
      headerContentSlot={
        <SegmentedGroup aria-label="Period" value={period} onValueChange={setPeriod}>
          <SegmentedButton value="7d">7 days</SegmentedButton>
          <SegmentedButton value="30d">30 days</SegmentedButton>
          <SegmentedButton value="90d">90 days</SegmentedButton>
        </SegmentedGroup>
      }
      contentSlot={
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {(Object.keys(FILTERS) as Filter[]).map((which) => (
              <StatTile
                key={which}
                label={FILTER_LABELS[which]}
                value={state === "error" ? "—" : count(which)}
                loading={loading}
                selected={filter === which}
                onClick={() => setFilter(which)}
                iconSlot={
                  which === "overdue" ? (
                    <TriangleAlert />
                  ) : which === "done" ? (
                    <CircleCheck />
                  ) : (
                    <Clock />
                  )
                }
                hint={
                  which === "open"
                    ? "Across 3 projects"
                    : which === "overdue"
                      ? "Due before today"
                      : which === "review"
                        ? "Waiting on a reviewer"
                        : "Since Monday"
                }
                {...(which === "overdue" && count(which) > 0
                  ? { valueClassName: "text-negative" }
                  : {})}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <CardLayout
              level={2}
              className="lg:col-span-2"
              title={FILTER_LABELS[filter]}
              description={
                state === "ready"
                  ? `${shown.length} of ${tasks.length} tasks, newest first.`
                  : undefined
              }
              actionSlot={
                <Button
                  size="sm"
                  variant="outline"
                  linkSlot={<a href="#tasks" />}
                  content="View all"
                />
              }
              contentSlot={
                <>
                  <QueryState
                    query={query}
                    what="this week's tasks"
                    count={shown.length}
                    rows={4}
                    emptySlot={
                      tasks.length === 0 ? (
                        <EmptyState
                          iconSlot={<Folder />}
                          title="No tasks yet"
                          description="Tasks you create in any project show up here."
                          actionSlot={
                            <Button
                              variant="info"
                              iconSlot={<Plus />}
                              linkSlot={<a href="#tasks" />}
                              content="New task"
                            />
                          }
                        />
                      ) : (
                        <EmptyState compact title="Nothing matches this tile." />
                      )
                    }
                  />
                  {shown.length > 0 ? (
                    <TaskTable tasks={shown} caption={FILTER_LABELS[filter]} />
                  ) : null}
                </>
              }
            />

            <CardLayout
              level={2}
              title={project?.name ?? ""}
              description="The project with the most open work."
              loading={loading}
              contentClassName="gap-4"
              emptySlot={
                <QueryError
                  compact
                  error={query.error}
                  onRetry={query.refetch}
                  what="the project"
                />
              }
              contentSlot={
                state === "ready" || state === "empty" ? (
                  <>
                    <DescriptionList
                      contentSlot={[
                        <PropertyRow key="lead" label="Lead" value="Inès Duval" />,
                        <PropertyRow
                          key="status"
                          label="Status"
                          value={<Badge variant="warning-soft">At risk</Badge>}
                          hint="2 tasks overdue"
                        />,
                        <PropertyRow
                          key="due"
                          label="Ships"
                          value={formatDate(new Date(2026, 10, 14))}
                          hint="In 3 weeks"
                        />,
                        <PropertyRow
                          key="repo"
                          label="Repository"
                          value="acme/beacon-app"
                          valueClassName="font-mono"
                          actionSlot={
                            <CopyButton value="acme/beacon-app" label="Copy the repository" />
                          }
                        />,
                      ]}
                    />
                    <Progress
                      value={62}
                      label="Beacon app progress"
                      valueLabel="62% of tasks done"
                    />
                  </>
                ) : null
              }
            />
          </div>

          <CardLayout
            level={2}
            title="Team"
            description="Who did what, most recent first."
            loading={loading}
            // The card's empty rung reads its `contentSlot`, so the list is left out rather than
            // handed no rows: a `List` element is never empty, even when it draws nothing.
            emptySlot={
              state === "error" ? (
                <QueryError compact error={query.error} onRetry={query.refetch} what="the team" />
              ) : (
                <EmptyState compact title="Nobody has closed anything this week." />
              )
            }
            contentSlot={
              state === "ready" ? (
                <List
                  label="Team activity"
                  contentSlot={PEOPLE.map((person, index) => (
                    <ListItem
                      key={person.id}
                      leadingSlot={<Avatar name={person.name} />}
                      title={person.name}
                      description={`${person.role} · closed ${5 - index} tasks`}
                      meta={formatAgo(
                        new Date(TODAY.getTime() - (index + 1) * 47 * 60 * 1000),
                        TODAY,
                      )}
                    />
                  ))}
                />
              ) : null
            }
          />
        </>
      }
    />
  );
}

/** Every tile has numbers; the table follows the tile that is pressed. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overdue = canvas.getByRole("button", { name: /Overdue/ });
    await userEvent.click(overdue);
    await expect(overdue).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("heading", { name: "Overdue" })).toBeVisible();
    await userEvent.unhover(overdue);
  },
};

/** The figures and the cards hold their places while the data is on its way. */
export const Loading: Story = { args: { state: "loading" } };

/** A workspace with nothing in it yet: the table's card says how to start. */
export const Empty: Story = {
  args: { state: "empty" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("No tasks yet")).toBeVisible();
  },
};

/** The request failed: the table says so, and offers to try again. */
export const Failed: Story = {
  args: { state: "error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Could not load this week's tasks/)).toBeVisible();
    await userEvent.click(canvas.getAllByRole("button", { name: /Try again/ })[0] as HTMLElement);
  },
};
