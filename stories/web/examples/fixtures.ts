/**
 * The fictional workspace every web example draws: one studio, a few projects, their people and
 * their tasks. Names are generic and invented; nothing here is anybody's data.
 */

export type Project = {
  id: string;
  name: string;
  color: string;
  open: number;
  status?: string;
};

export const PROJECTS: readonly Project[] = [
  { id: "atlas", name: "Atlas website", color: "#2563eb", open: 9 },
  { id: "beacon", name: "Beacon app", color: "#16a34a", open: 11, status: "2 overdue" },
  { id: "cobalt", name: "Cobalt rebrand", color: "#9333ea", open: 4 },
];

export type Person = { id: string; name: string; email: string; role: string };

export const PEOPLE: readonly Person[] = [
  { id: "mara", name: "Mara Quinn", email: "mara@acme.example", role: "Design lead" },
  { id: "theo", name: "Theo Park", email: "theo@acme.example", role: "Engineer" },
  { id: "ines", name: "Inès Duval", email: "ines@acme.example", role: "Product" },
  { id: "kofi", name: "Kofi Mensah", email: "kofi@acme.example", role: "Engineer" },
  { id: "sana", name: "Sana Iqbal", email: "sana@acme.example", role: "Copywriter" },
];

export const personName = (id: string | null) =>
  PEOPLE.find((person) => person.id === id)?.name ?? "Unassigned";

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  due: Date | null;
  labels: readonly string[];
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "In review",
  done: "Done",
};

/** A status's badge: done reads as positive, review as worth a look, the rest as plain. */
export const STATUS_BADGE = {
  backlog: "outline",
  todo: "secondary",
  "in-progress": "info-soft",
  review: "warning-soft",
  done: "positive-soft",
} as const satisfies Record<TaskStatus, string>;

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const LABELS = [
  { value: "bug", label: "Bug", color: "#dc2626" },
  { value: "feature", label: "Feature", color: "#2563eb" },
  { value: "docs", label: "Docs", color: "#16a34a" },
  { value: "design", label: "Design", color: "#9333ea" },
] as const;

/** "Today" for every example, fixed so a screenshot taken next month says the same thing. */
export const TODAY = new Date(2026, 9, 23);

const day = (offset: number) =>
  new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset);

export const TASKS: readonly Task[] = [
  {
    id: "T-1042",
    title: "Write the empty states for the onboarding flow",
    project: "beacon",
    status: "in-progress",
    priority: "high",
    assignee: "sana",
    due: day(1),
    labels: ["docs", "design"],
  },
  {
    id: "T-1041",
    title: "Fix the date picker closing on the first click in Safari",
    project: "beacon",
    status: "review",
    priority: "urgent",
    assignee: "theo",
    due: day(-1),
    labels: ["bug"],
  },
  {
    id: "T-1039",
    title: "Hero illustration, second round",
    project: "cobalt",
    status: "todo",
    priority: "medium",
    assignee: "mara",
    due: day(4),
    labels: ["design"],
  },
  {
    id: "T-1037",
    title: "Move the pricing page to the new grid",
    project: "atlas",
    status: "todo",
    priority: "medium",
    assignee: "kofi",
    due: day(6),
    labels: ["feature"],
  },
  {
    id: "T-1035",
    title: "Audit colour contrast on the marketing pages",
    project: "atlas",
    status: "backlog",
    priority: "low",
    assignee: null,
    due: null,
    labels: ["design", "docs"],
  },
  {
    id: "T-1031",
    title:
      "Push notifications for comments on a task, with a per-project mute that is remembered across devices",
    project: "beacon",
    status: "in-progress",
    priority: "high",
    assignee: "kofi",
    due: day(-3),
    labels: ["feature"],
  },
  {
    id: "T-1028",
    title: "Brand guidelines PDF",
    project: "cobalt",
    status: "done",
    priority: "medium",
    assignee: "ines",
    due: day(-5),
    labels: ["docs"],
  },
  {
    id: "T-1024",
    title: "Sign-in rate limit returns the wrong status code",
    project: "atlas",
    status: "done",
    priority: "high",
    assignee: "theo",
    due: day(-8),
    labels: ["bug"],
  },
];

export const projectName = (id: string) =>
  PROJECTS.find((project) => project.id === id)?.name ?? id;

/** A query that has landed, in the shape `QueryState` reads. */
export const settledQuery = { isPending: false, isError: false, error: null, refetch: () => {} };

/** The states every list example can be flipped between from the controls panel. */
export type DataState = "ready" | "loading" | "empty" | "error";

/** The query a state stands for. */
export const queryFor = (state: DataState) => ({
  isPending: state === "loading",
  isError: state === "error",
  error: state === "error" ? new Error("The server did not answer in time.") : null,
  refetch: () => new Promise((resolve) => setTimeout(resolve, 600)),
});
