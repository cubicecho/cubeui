import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListTodo } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  ComboboxField,
  InputField,
  SelectField,
  TextareaField,
  useAppForm,
} from "@/components/app-form";
import { Combobox } from "@/components/combobox";
import { DateField } from "@/components/date-field";
import { DialogLayout } from "@/components/dialog-layout";
import { EmptyState } from "@/components/empty-state";
import { FieldRow } from "@/components/field-row";
import { PageLayout } from "@/components/page-layout";
import { QueryState } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorDot } from "@/components/ui/color-dot";
import { ConfirmProvider, useConfirm } from "@/components/ui/confirm";
import { FormElement } from "@/components/ui/form-element";
import {
  ArrowDownWideNarrow,
  Check,
  Copy,
  Ellipsis,
  Pencil,
  Plus,
  Trash2,
} from "@/components/ui/icons";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { SearchInput } from "@/components/ui/search-input";
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
import { ToggleChip } from "@/components/ui/toggle-chip";
import { formatDate } from "@/lib/format";
import { AppShell, Avatar } from "./app-shell";
import {
  type DataState,
  LABELS,
  PEOPLE,
  PRIORITY_LABELS,
  PROJECTS,
  type Priority,
  personName,
  projectName,
  queryFor,
  STATUS_BADGE,
  STATUS_LABELS,
  TASKS,
  type Task,
  type TaskStatus,
  TODAY,
} from "./fixtures";

/**
 * A task list: a filter bar over a table, rows chosen in bulk with checkboxes, a ⋯ menu on each
 * row whose Delete asks first, and a dialog that creates or edits a task through a bound form,
 * with its validation and its discard guard.
 *
 * Nothing on a row is edited where it sits — Edit opens the same dialog New does.
 */
type Args = { state: DataState };

const meta = {
  title: "Examples/Web/Tasks",
  parameters: { layout: "fullscreen" },
  args: { state: "ready" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["ready", "loading", "empty", "error"],
      description: "Where the task list is: landed, on its way, empty, or failed.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <ConfirmProvider>
        <AppShell current="tasks" page={<Tasks {...args} />} />
      </ConfirmProvider>
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const STATUS_OPTIONS = [
  { value: "all", label: "Every status" },
  { separator: true as const },
  ...(Object.keys(STATUS_LABELS) as TaskStatus[]).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  })),
];

const ASSIGNEE_OPTIONS = [
  { value: "anyone", label: "Anyone" },
  { value: "nobody", label: "Unassigned" },
  { separator: true as const },
  ...PEOPLE.map((person) => ({ value: person.id, label: person.name })),
];

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

type Sort = "due" | "priority" | "title";

const SORTS: Record<Sort, (a: Task, b: Task) => number> = {
  due: (a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity),
  priority: (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  title: (a, b) => a.title.localeCompare(b.title),
};

type Draft = {
  title: string;
  description: string;
  project: string;
  status: string;
  priority: string;
  assignee: string | null;
  due: Date | null;
  labels: string[];
};

const blankDraft: Draft = {
  title: "",
  description: "",
  project: "beacon",
  status: "todo",
  priority: "medium",
  assignee: null,
  due: null,
  labels: [],
};

const draftOf = (task: Task): Draft => ({
  title: task.title,
  description: "",
  project: task.project,
  status: task.status,
  priority: task.priority,
  assignee: task.assignee,
  due: task.due,
  labels: [...task.labels],
});

/** The one dialog for a new task and an edit: the same fields, a different title and verb. */
function TaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: Draft) => void;
}) {
  const isEdit = task !== null;
  const form = useAppForm({
    defaultValues: task ? draftOf(task) : blankDraft,
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSave(value);
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? `Edit ${task.id}` : "New task"}
      description={
        isEdit ? "Changes are seen by everyone on the project." : "It lands in the project's To do."
      }
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <FormElement onSubmit={() => form.handleSubmit()} className="flex flex-col gap-4">
          <InputField
            form={form}
            name="title"
            label="Title"
            required
            placeholder="What needs doing?"
            validators={{
              onChange: ({ value }) =>
                value.trim().length < 4
                  ? "Give the task a title of four letters or more."
                  : undefined,
            }}
          />
          <TextareaField
            form={form}
            name="description"
            label="Description"
            description="Markdown is fine. Link the doc or the thread it came from."
            rows={4}
          />
          <FieldRow
            perRow={3}
            contentSlot={
              <>
                <SelectField
                  form={form}
                  name="project"
                  label="Project"
                  options={PROJECTS.map((project) => ({
                    value: project.id,
                    label: project.name,
                    color: project.color,
                  }))}
                />
                <SelectField
                  form={form}
                  name="status"
                  label="Status"
                  options={STATUS_OPTIONS.filter(
                    (option) => "value" in option && option.value !== "all",
                  )}
                />
                <SelectField
                  form={form}
                  name="priority"
                  label="Priority"
                  options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => ({
                    value,
                    label: PRIORITY_LABELS[value],
                  }))}
                />
              </>
            }
          />
          <FieldRow
            contentSlot={
              <>
                <SelectField
                  form={form}
                  name="assignee"
                  label="Assignee"
                  clearable
                  emptyLabel="Unassigned"
                  options={PEOPLE.map((person) => ({ value: person.id, label: person.name }))}
                />
                <DateField form={form} name="due" label="Due" clearable />
              </>
            }
          />
          <ComboboxField
            multiple
            form={form}
            name="labels"
            label="Labels"
            options={LABELS}
            placeholder="No labels"
          />
        </FormElement>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <form.AppForm>
            {isEdit ? (
              <form.SubmitButton variant="positive" requireChanges content="Save changes" />
            ) : (
              <form.SubmitButton variant="info" content="Create task" pendingLabel="Creating…" />
            )}
          </form.AppForm>
        </>
      )}
    />
  );
}

function RowMenu({
  task,
  onEdit,
  onDone,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={`Actions for ${task.id}`}
          iconSlot={<Ellipsis />}
        />
      </MenuTrigger>
      <MenuContent align="end" aria-label={`Actions for ${task.id}`}>
        <MenuItem iconSlot={<Pencil />} label="Edit" trailing="E" onSelect={onEdit} />
        <MenuItem iconSlot={<Copy />} label="Duplicate" onSelect={() => {}} />
        <MenuItem
          iconSlot={<Check />}
          label="Mark as done"
          disabled={task.status === "done"}
          onSelect={onDone}
        />
        <MenuSeparator />
        <MenuItem iconSlot={<Trash2 />} label="Delete" destructive onSelect={onDelete} />
      </MenuContent>
    </Menu>
  );
}

function Tasks({ state }: Args) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tasks, setTasks] = useState<readonly Task[]>(state === "ready" ? TASKS : []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("anyone");
  const [labels, setLabels] = useState<readonly string[]>([]);
  const [sort, setSort] = useState<Sort>("due");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = tasks
    .filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((task) => status === "all" || task.status === status)
    .filter((task) =>
      assignee === "anyone"
        ? true
        : assignee === "nobody"
          ? task.assignee === null
          : task.assignee === assignee,
    )
    .filter((task) => labels.every((label) => task.labels.includes(label)))
    .toSorted(SORTS[sort]);

  const filtering = query !== "" || status !== "all" || assignee !== "anyone" || labels.length > 0;
  const reset = () => {
    setQuery("");
    setStatus("all");
    setAssignee("anyone");
    setLabels([]);
  };
  const toggleLabel = (label: string) =>
    setLabels((all) => (all.includes(label) ? all.filter((l) => l !== label) : [...all, label]));

  const allChosen = filtered.length > 0 && filtered.every((task) => chosen.has(task.id));
  const someChosen = filtered.some((task) => chosen.has(task.id));
  const choose = (id: string, on: boolean) =>
    setChosen((all) => {
      const next = new Set(all);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const remove = async (ids: readonly string[]) => {
    const one = ids.length === 1 ? tasks.find((task) => task.id === ids[0]) : undefined;
    const ok = await confirm({
      title: one ? `Delete ${one.id}?` : `Delete ${ids.length} tasks?`,
      description: one
        ? `“${one.title}” and its comments go with it. Anyone watching it stops getting updates.`
        : "Their comments and attachments go with them. Anyone watching them stops getting updates.",
    });
    if (ok) {
      setTasks((all) => all.filter((task) => ids.includes(task.id) === false));
      setChosen(new Set());
      toast(ids.length === 1 ? "Task deleted." : `${ids.length} tasks deleted.`, "info");
    }
  };
  const markDone = (ids: readonly string[]) => {
    setTasks((all) =>
      all.map((task) => (ids.includes(task.id) ? { ...task, status: "done" as const } : task)),
    );
    setChosen(new Set());
  };

  return (
    <>
      <PageLayout
        title="Tasks"
        description="Everything open across the studio's projects."
        actionSlot={
          <Button
            variant="info"
            size="sm"
            iconSlot={<Plus />}
            content="New task"
            onClick={openNew}
          />
        }
        headerContentSlot={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              label="Search tasks"
              placeholder="Search tasks"
              value={query}
              onChangeText={setQuery}
              wrapperClassName="w-full sm:w-64"
            />
            <Combobox
              aria-label="Status"
              className="w-40"
              options={STATUS_OPTIONS}
              value={status}
              onValueChange={setStatus}
            />
            <Combobox
              aria-label="Assignee"
              className="w-44"
              searchable
              searchPlaceholder="Find a person…"
              options={ASSIGNEE_OPTIONS}
              value={assignee}
              onValueChange={setAssignee}
            />
            <fieldset className="m-0 flex min-w-0 items-center gap-1.5 border-0 p-0">
              <legend className="sr-only">Labels</legend>
              {LABELS.map((label) => (
                <ToggleChip
                  key={label.value}
                  size="sm"
                  selected={labels.includes(label.value)}
                  onClick={() => toggleLabel(label.value)}
                >
                  {label.label}
                </ToggleChip>
              ))}
            </fieldset>
            {filtering ? (
              <Button variant="outline" size="sm" content="Reset" onClick={reset} />
            ) : null}
          </div>
        }
        contentSlot={
          <>
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
              <p className="text-foreground/60 text-sm" aria-live="polite">
                {chosen.size > 0
                  ? `${chosen.size} selected`
                  : `${filtered.length} of ${tasks.length} tasks`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {chosen.size > 0 ? (
                  <>
                    <Button
                      size="sm"
                      variant="positive-outline"
                      iconSlot={<Check />}
                      content="Mark done"
                      onClick={() => markDone([...chosen])}
                    />
                    <Button
                      size="sm"
                      variant="destructive-outline"
                      iconSlot={<Trash2 />}
                      content="Delete"
                      onClick={() => void remove([...chosen])}
                    />
                  </>
                ) : null}
                <Menu>
                  <MenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      iconSlot={<ArrowDownWideNarrow />}
                      content="Sort"
                    />
                  </MenuTrigger>
                  <MenuContent align="end">
                    <MenuRadioGroup
                      aria-label="Sort by"
                      value={sort}
                      onValueChange={(next) => setSort(next as Sort)}
                    >
                      <MenuRadioItem value="due" label="Due date" />
                      <MenuRadioItem value="priority" label="Priority" />
                      <MenuRadioItem value="title" label="Title" />
                    </MenuRadioGroup>
                  </MenuContent>
                </Menu>
              </div>
            </div>
            <QueryState
              query={queryFor(state)}
              what="your tasks"
              count={filtered.length}
              rows={6}
              emptySlot={
                tasks.length === 0 ? (
                  <EmptyState
                    iconSlot={<ListTodo />}
                    title="No tasks yet"
                    description="A task is one thing someone on the team will do. Start with the next one."
                    actionSlot={
                      <Button
                        variant="info"
                        iconSlot={<Plus />}
                        content="New task"
                        onClick={openNew}
                      />
                    }
                  />
                ) : (
                  <EmptyState
                    iconSlot={<ListTodo />}
                    title="No tasks match"
                    description="Nothing open fits every filter you have on."
                    actionSlot={
                      <Button variant="outline" content="Reset the filters" onClick={reset} />
                    }
                  />
                )
              }
            />
            {filtered.length > 0 ? (
              <Table>
                <TableCaption className="sr-only">Tasks</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select every task shown"
                        checked={allChosen ? true : someChosen ? "indeterminate" : false}
                        onCheckedChange={(on) =>
                          setChosen(
                            on === true ? new Set(filtered.map((task) => task.id)) : new Set(),
                          )
                        }
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((task) => {
                    const overdue =
                      task.status !== "done" &&
                      task.due !== null &&
                      task.due.getTime() < TODAY.getTime();
                    return (
                      <TableRow
                        key={task.id}
                        data-state={chosen.has(task.id) ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            aria-label={`Select ${task.id}`}
                            checked={chosen.has(task.id)}
                            onCheckedChange={(on) => choose(task.id, on === true)}
                          />
                        </TableCell>
                        <TableHead className="max-w-96 font-normal">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-foreground">{task.title}</span>
                          </span>
                          <span className="flex flex-wrap items-center gap-1.5 pt-1 text-foreground/60 text-xs in-data-[state=selected]:text-foreground">
                            <span className="font-mono">{task.id}</span>
                            <span>· {projectName(task.project)}</span>
                            {task.labels.map((value) => {
                              const label = LABELS.find((l) => l.value === value);
                              return label ? (
                                <span key={value} className="inline-flex items-center gap-1">
                                  <ColorDot color={label.color} size="sm" />
                                  {label.label}
                                </span>
                              ) : null;
                            })}
                          </span>
                        </TableHead>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[task.status]}>
                            {STATUS_LABELS[task.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.priority === "urgent" ? (
                            <Badge variant="destructive">Urgent</Badge>
                          ) : (
                            <span className="text-foreground text-sm">
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <Avatar name={personName(task.assignee)} size="sm" />
                            {personName(task.assignee)}
                          </span>
                        </TableCell>
                        <TableCell
                          className={
                            overdue ? "whitespace-nowrap text-negative" : "whitespace-nowrap"
                          }
                        >
                          {task.due ? formatDate(task.due) : "—"}
                          {overdue ? <span className="sr-only"> (overdue)</span> : null}
                        </TableCell>
                        <TableCell>
                          <RowMenu
                            task={task}
                            onEdit={() => {
                              setEditing(task);
                              setDialogOpen(true);
                            }}
                            onDone={() => markDone([task.id])}
                            onDelete={() => void remove([task.id])}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
          </>
        }
      />
      <TaskDialog
        // A new key per task, so the form's defaults are the task being edited, not the last one.
        key={editing?.id ?? "new"}
        task={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(draft) => {
          if (editing) {
            setTasks((all) =>
              all.map((task) =>
                task.id === editing.id
                  ? {
                      ...task,
                      ...draft,
                      status: draft.status as TaskStatus,
                      priority: draft.priority as Priority,
                    }
                  : task,
              ),
            );
            toast(`Saved ${editing.id}.`, "positive");
          } else {
            setTasks((all) => [
              {
                ...draft,
                id: `T-${1043 + all.length}`,
                status: draft.status as TaskStatus,
                priority: draft.priority as Priority,
              },
              ...all,
            ]);
            toast("Task created.", "positive");
          }
          setDialogOpen(false);
        }}
      />
    </>
  );
}

/** The list with every filter off. Opens New task, submits it empty, and reads the error. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "New task" }));
    const dialog = await body.findByRole("dialog", { name: "New task" });
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Title/ }), "Ab");
    await userEvent.tab();
    await expect(
      await within(dialog).findByText("Give the task a title of four letters or more."),
    ).toBeVisible();
    // Escape asks before throwing the typing away; keep editing, then discard.
    await userEvent.keyboard("{Escape}");
    await userEvent.click(await body.findByRole("button", { name: /Keep editing/ }));
    await expect(dialog).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(await body.findByRole("button", { name: /Discard/ }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** Two rows chosen, and the bulk actions that appear for them. */
export const BulkSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select T-1042" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select T-1039" }));
    await expect(canvas.getByText("2 selected")).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Select every task shown" })).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  },
};

/** Filters that match nothing: the empty state offers to take them off. */
export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search tasks" }), "zeppelin");
    await expect(await canvas.findByText("No tasks match")).toBeVisible();
  },
};

/** A project with no tasks at all. */
export const Empty: Story = { args: { state: "empty" } };

/** The rows hold their place while the list loads. */
export const Loading: Story = { args: { state: "loading" } };
