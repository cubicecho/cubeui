import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text, View } from "react-native";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DialogLayout } from "../../../registry/layout/dialog-layout";
import { Disclosure } from "../../../registry/layout/disclosure";
import { EmptyState } from "../../../registry/layout/empty-state";
import { List } from "../../../registry/layout/list";
import { ListItem } from "../../../registry/layout/list-item";
import { PageLayout } from "../../../registry/layout/page-layout";
import { QueryState } from "../../../registry/layout/query-state";
import { Badge } from "../../../registry/ui/badge.tsx";
import { Button } from "../../../registry/ui/button";
import { Checkbox } from "../../../registry/ui/checkbox.tsx";
import { ComboboxField } from "../../../registry/ui/combobox-field";
import { DateTimeField } from "../../../registry/ui/date-time-field";
import { createAppForm, Form } from "../../../registry/ui/form";
import { CircleCheck, Plus } from "../../../registry/ui/icons";
import { SearchInput } from "../../../registry/ui/search-input.tsx";
import { SegmentedButton, SegmentedGroup } from "../../../registry/ui/segmented";
import { SegmentedField } from "../../../registry/ui/segmented-field";
import { ToastProvider, useToast } from "../../../registry/ui/toast";
import { dayFrom, MobileShell, PHONE, TODAY } from "./shell";

/**
 * A phone's task list: the day's title with a New button, a filter and a search over the list,
 * each task a row with its checkbox outside the pressed area, the done ones folded under a
 * disclosure, and a dialog holding the native form for a new task or an edit.
 */
type Args = { state: "ready" | "loading" | "empty" | "error" };

const meta = {
  title: "Examples/Mobile/Tasks",
  parameters: { layout: "fullscreen" },
  globals: PHONE,
  args: { state: "ready" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["ready", "loading", "empty", "error"],
      description: "Where the day's tasks are: landed, on their way, empty, or failed.",
    },
  },
  render: (args) => (
    <ToastProvider>
      <MobileShell current="today" screen={<Today {...args} />} />
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const { useAppForm } = createAppForm({ DateTimeField, ComboboxField, SegmentedField });

type Priority = "low" | "normal" | "high";

type Task = {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  due: Date | null;
  done: boolean;
};

const PROJECTS = [
  { value: "home", label: "Home" },
  { value: "beacon", label: "Beacon app", group: "Work" },
  { value: "cobalt", label: "Cobalt rebrand", group: "Work" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const TASKS: readonly Task[] = [
  {
    id: "1",
    title: "Reply to Harbor Coffee about the menu",
    project: "beacon",
    priority: "high",
    due: dayFrom(0),
    done: false,
  },
  {
    id: "2",
    title: "Review Theo's notifications branch",
    project: "beacon",
    priority: "normal",
    due: dayFrom(0),
    done: false,
  },
  {
    id: "3",
    title: "Pick up the dry cleaning before the shop closes at six",
    project: "home",
    priority: "low",
    due: dayFrom(0),
    done: false,
  },
  {
    id: "4",
    title: "Send the hero illustration notes",
    project: "cobalt",
    priority: "normal",
    due: dayFrom(1),
    done: false,
  },
  { id: "5", title: "Book the dentist", project: "home", priority: "low", due: null, done: true },
  {
    id: "6",
    title: "Expenses for September",
    project: "beacon",
    priority: "normal",
    due: dayFrom(-2),
    done: true,
  },
];

const projectLabel = (value: string) => PROJECTS.find((p) => p.value === value)?.label ?? value;

const dueLabel = (due: Date | null) =>
  due === null
    ? "No date"
    : due.toDateString() === TODAY.toDateString()
      ? "Today"
      : due.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function TaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, "id" | "done">) => void;
}) {
  const form = useAppForm({
    defaultValues: {
      title: task?.title ?? "",
      notes: "",
      project: task?.project ?? "home",
      priority: (task?.priority ?? "normal") as string,
      due: (task ? task.due : TODAY) as Date | null,
      remind: false,
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      onSave({
        title: value.title.trim(),
        project: value.project,
        priority: value.priority as Priority,
        due: value.due,
      });
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <form.AppForm>
          <Form className="flex flex-col gap-4">
            <form.AppField
              name="title"
              validators={{
                onChange: ({ value }) => (value.trim() ? undefined : "What is the task?"),
              }}
            >
              {(field) => <field.InputField label="Task" placeholder="Call the plumber" />}
            </form.AppField>
            <form.AppField name="notes">
              {(field) => <field.TextAreaField label="Notes" />}
            </form.AppField>
            <form.AppField name="project">
              {(field) => <field.ComboboxField label="Project" options={PROJECTS} />}
            </form.AppField>
            <form.AppField name="priority">
              {(field) => <field.SegmentedField label="Priority" options={PRIORITIES} />}
            </form.AppField>
            <form.AppField name="due">
              {(field) => (
                <field.DateTimeField label="Due" mode="date" clearable placeholder="No date" />
              )}
            </form.AppField>
            <form.AppField name="remind">
              {(field) => (
                <field.SwitchField
                  label="Remind me"
                  description="At 9 in the morning on the day."
                />
              )}
            </form.AppField>
          </Form>
        </form.AppForm>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onPress={close} content="Cancel" />
          <form.AppForm>
            <form.SubmitButton isEdit={task !== null} createLabel="Add task" editLabel="Save" />
          </form.AppForm>
        </>
      )}
    />
  );
}

function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: (done: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <ListItem
      leadingSlot={
        <Checkbox
          checked={task.done}
          onCheckedChange={onToggle}
          accessibilityLabel={`${task.done ? "Reopen" : "Complete"} “${task.title}”`}
        />
      }
      title={task.title}
      titleClassName={task.done ? "line-through text-foreground/60" : undefined}
      description={`${projectLabel(task.project)} · ${dueLabel(task.due)}`}
      meta={
        task.priority === "high" && task.done === false ? (
          <Badge variant="destructive-soft">High</Badge>
        ) : null
      }
      onPress={onOpen}
    />
  );
}

function Today({ state }: Args) {
  const toast = useToast();
  const [tasks, setTasks] = useState<readonly Task[]>(state === "ready" ? TASKS : []);
  const [filter, setFilter] = useState<"all" | "today" | "work">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const matches = tasks
    .filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((task) =>
      filter === "today"
        ? task.due?.toDateString() === TODAY.toDateString()
        : filter === "work"
          ? task.project !== "home"
          : true,
    );
  const open_ = matches.filter((task) => task.done === false);
  const done = matches.filter((task) => task.done);

  const toggle = (id: string, next: boolean) =>
    setTasks((all) => all.map((task) => (task.id === id ? { ...task, done: next } : task)));
  const openTask = (task: Task | null) => {
    setEditing(task);
    setOpen(true);
  };

  return (
    <>
      <PageLayout
        title="Today"
        description={TODAY.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        actionSlot={
          <Button
            variant="info"
            size="icon"
            aria-label="New task"
            iconSlot={<Plus />}
            onPress={() => openTask(null)}
          />
        }
        headerContentSlot={
          <View className="gap-2">
            <SegmentedGroup aria-label="Show" value={filter} onValueChange={setFilter}>
              <SegmentedButton value="all">All</SegmentedButton>
              <SegmentedButton value="today">Due today</SegmentedButton>
              <SegmentedButton value="work">Work</SegmentedButton>
            </SegmentedGroup>
            <SearchInput
              label="Search tasks"
              placeholder="Search tasks"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        contentSlot={
          <>
            <QueryState
              query={{
                isPending: state === "loading",
                isError: state === "error",
                error: state === "error" ? new Error("No connection. Pull to try again.") : null,
                refetch: () => {},
              }}
              what="today's tasks"
              count={matches.length}
              rows={4}
              emptySlot={
                tasks.length === 0 ? (
                  <EmptyState
                    iconSlot={<CircleCheck />}
                    title="Nothing for today"
                    description="Add what you want to get done, and tick it off here."
                    actionSlot={
                      <Button
                        variant="info"
                        iconSlot={<Plus />}
                        content="New task"
                        onPress={() => openTask(null)}
                      />
                    }
                  />
                ) : (
                  <EmptyState compact title="No task matches that." />
                )
              }
            />
            {open_.length > 0 ? (
              <List
                label="Open tasks"
                contentSlot={open_.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={(next) => {
                      toggle(task.id, next);
                      if (next) {
                        toast("Done. Nice.", "positive");
                      }
                    }}
                    onOpen={() => openTask(task)}
                  />
                ))}
              />
            ) : matches.length > 0 ? (
              <Text className="py-2 text-foreground/60 text-sm">Everything here is done.</Text>
            ) : null}
            {done.length > 0 ? (
              <Disclosure
                title={`Completed (${done.length})`}
                contentSlot={
                  <List
                    label="Completed tasks"
                    contentSlot={done.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={(next) => toggle(task.id, next)}
                        onOpen={() => openTask(task)}
                      />
                    ))}
                  />
                }
              />
            ) : null}
          </>
        }
      />
      <TaskDialog
        key={editing?.id ?? "new"}
        task={editing}
        open={open}
        onOpenChange={setOpen}
        onSave={(saved) => {
          if (editing) {
            setTasks((all) =>
              all.map((task) => (task.id === editing.id ? { ...task, ...saved } : task)),
            );
            toast("Saved.", "positive");
          } else {
            setTasks((all) => [{ ...saved, id: String(Date.now()), done: false }, ...all]);
            toast("Task added.", "positive");
          }
          setOpen(false);
        }}
      />
    </>
  );
}

/** The day's list. Ticks one off, then opens New task and submits it empty. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("checkbox", { name: /Complete “Review Theo's notifications branch”/ }),
    );
    await expect(canvas.getByRole("button", { name: /Completed \(3\)/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "New task" }));
    const add = await body.findByRole("button", { name: "Add task" });
    await userEvent.click(add);
    await expect(await body.findByText("What is the task?")).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(body.queryByText("What is the task?")).toBeNull());
  },
};

/** The rows hold their place while the list loads. */
export const Loading: Story = { args: { state: "loading" } };

/** Nothing planned yet. */
export const Empty: Story = { args: { state: "empty" } };

/** The request failed. */
export const Failed: Story = { args: { state: "error" } };
