import type { Meta, StoryObj } from "@storybook/react-vite";
import { lazy, type ReactNode, Suspense, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ActionButton } from "@/components/action-button";
import {
  SwitchField as BoundSwitchField,
  InputField,
  NumberField,
  SelectField,
  TextareaField,
  useAppForm,
} from "@/components/app-form";
import { CardLayout } from "@/components/card-layout";
import { CenteredLayout } from "@/components/centered-layout";
import { ColorField } from "@/components/color-field";
import { ConfirmButton } from "@/components/confirm-button";
import { DateField } from "@/components/date-field";
import { DatePicker, type DateRange, DateRangePicker } from "@/components/date-picker";
import { DescriptionList, PropertyRow } from "@/components/description-list";
import { DetailHeader, EditButton } from "@/components/detail-header";
import { DetailPage } from "@/components/detail-page";
import { DialogLayout } from "@/components/dialog-layout";
import { Disclosure } from "@/components/disclosure";
import { DisclosureRow } from "@/components/disclosure-row";
import { FieldRow } from "@/components/field-row";
import { FileTree } from "@/components/file-tree";
import { FormField } from "@/components/form-field";
import { HeaderContentFooter } from "@/components/header-content-footer";
import { ListItem } from "@/components/list-item";
import { Markdown } from "@/components/markdown";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MultiSelect } from "@/components/multi-select";
import { MultiSelectField } from "@/components/multi-select-field";
import { OptionSelect } from "@/components/option-select";
import { CardGrid, EmptyState, Page } from "@/components/page";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { PasswordField } from "@/components/password-field";
import { PasswordInput } from "@/components/password-input";
import { QueryError, QueryState, RowSkeleton } from "@/components/query-state";
import { RadioGroupField } from "@/components/radio-group-field";
import { RouteError } from "@/components/route-error";
import { Section } from "@/components/section";
import { SectionHeading } from "@/components/section-heading";
import { SettingRow } from "@/components/setting-row";
import { Sidebar, SidebarNavItem, SidebarSection } from "@/components/sidebar";
import { SidebarLayout, SplitLayout } from "@/components/split-layout";
import { StatTile } from "@/components/stat-tile";
import { TopBarLayout } from "@/components/top-bar-layout";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Code, CodeBlock } from "@/components/ui/code";
import { ColorBar } from "@/components/ui/color-bar";
import { ColorDot } from "@/components/ui/color-dot";
import { ColorPicker } from "@/components/ui/color-picker";
import { ColorField as HookColorField } from "@/components/ui/color-picker-field";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ConfirmProvider, useConfirm } from "@/components/ui/confirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { DateTimeInput } from "@/components/ui/date-time-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DownloadButton } from "@/components/ui/download-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FilePicker, FilePickerButton } from "@/components/ui/file-picker";
import { createAppForm, Form } from "@/components/ui/form";
import { FormElement } from "@/components/ui/form-element";
import {
  Calendar as CalendarIcon,
  Check,
  Copy,
  Download,
  FileText,
  Folder,
  Info,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tag,
  TriangleAlert,
  Upload,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { MultiSelectField as HookMultiSelectField } from "@/components/ui/multi-select-form-field";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedButton, SegmentedGroup } from "@/components/ui/segmented";
import { SegmentedField } from "@/components/ui/segmented-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { SwitchField } from "@/components/ui/switch-field";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ThemePicker } from "@/components/ui/theme-picker";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { readableTextColor } from "@/lib/readable-text-color";
import registry from "../../registry.web.json";
import { Gallery, type GallerySection, unaccountedItems } from "../gallery/gallery";

/**
 * Every item of the web registry on one page: the compiled DOM halves and the web-only tier, a
 * section each, in a handful of real states. It is the page for someone deciding what to build
 * on — the per-item stories prove one behaviour at a time, and none of them shows the set.
 *
 * `play` holds the page to the registry: an item added to `registry.web.json` and not drawn here,
 * or named in `NOT_SHOWN` with no reason to be, fails the run.
 */
const meta = {
  title: "Gallery/Web",
  parameters: {
    layout: "fullscreen",
    a11y: {
      config: {
        rules: [
          // A shell is a whole page with its own `main`, and this story draws several of them in
          // boxes, each inside a section. A real screen holds one, at the top level, where these
          // rules pass; each shell's own story is where that is checked.
          { id: "landmark-no-duplicate-main", enabled: false },
          { id: "landmark-main-is-top-level", enabled: false },
          { id: "landmark-unique", enabled: false },
        ],
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** The items with nothing to draw, and why. */
const NOT_SHOWN: Record<string, string> = {
  tokens: "The palette. Every class on this page is drawn from it.",
  utils: "`cn`, a function.",
  color: "Colour maths, functions only.",
  "readable-text-color": "A function; the tinted badge takes its ink from it.",
  format: "Functions that write a count, a size, a duration and a date as text.",
  "error-message": "A function; the form fields read their error text with it.",
  tree: "`buildTree`, a function; the file tree is drawn from what it returns.",
  "unsaved-changes-guard":
    "A hook and a question that stays closed until a page with edits is left. Its own story opens it.",
  control: "A bundle: it installs the controls shown here one by one.",
  "form-set": "A bundle: it installs the form items shown here one by one.",
  layout: "A bundle: it installs the shells shown here one by one.",
  primitive: "A bundle: it installs `empty`, `item` and `table`.",
  "badge-stories": "A story file a consumer installs beside `badge`.",
  "button-stories": "A story file a consumer installs beside `button`.",
  "card-stories": "A story file a consumer installs beside `card`.",
  "section-heading-stories": "A story file a consumer installs beside `section-heading`.",
  "segmented-stories": "A story file a consumer installs beside `segmented`.",
  "sidebar-stories": "A story file a consumer installs beside `sidebar`.",
  "theme-picker-stories": "A story file a consumer installs beside `theme-picker`.",
  "toggle-chip-stories": "A story file a consumer installs beside `toggle-chip`.",
};

const noop = () => {};

function Row({ content }: { content: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{content}</div>;
}

function Stack({ content }: { content: ReactNode }) {
  return <div className="flex max-w-xl flex-col gap-4">{content}</div>;
}

/** The box a full-screen shell is drawn in, so it fills this and not the page. */
function Frame({ content, height = "h-[480px]" }: { content: ReactNode; height?: string }) {
  return (
    <div className={`${height} flex flex-col overflow-hidden rounded-lg border border-border`}>
      {content}
    </div>
  );
}

const paragraphs = (count: number) =>
  Array.from({ length: count }, (_, index) => `Row ${index + 1}`).map((row) => (
    <p key={row} className="py-2 text-foreground text-sm">
      {row}
    </p>
  ));

const SERVERS = [
  { name: "atlas", transport: "http", tools: 12, status: "Running" },
  { name: "borealis", transport: "stdio", tools: 4, status: "Stopped" },
  { name: "cygnus", transport: "http", tools: 31, status: "Running" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const TAGS = [
  { value: "design", label: "Design", color: "#1d4ed8" },
  { value: "bug", label: "Bug", color: "#b91c1c" },
  { value: "docs", label: "Docs", color: "#15803d" },
  { value: "infra", label: "Infrastructure" },
];

const SWATCHES = ["#b91c1c", "#15803d", "#1d4ed8", "#7e22ce"];

const NOTES = `## Release notes

A **bold** claim, some \`inline code\` and a [link](https://cubicecho.github.io/cubeui/).

- [x] Compile the shells
- [ ] Port the call sites

| Item | Platforms |
| --- | --- |
| card | both |
| table | web |

\`\`\`ts
const answer = 42;
\`\`\`
`;

function Buttons() {
  return (
    <div className="flex flex-col gap-3">
      <Row
        content={
          <>
            <Button content="Save changes" />
            <Button variant="secondary" content="Secondary" />
            <Button variant="outline" content="Outline" />
            <Button variant="ghost" content="Ghost" />
            <Button variant="link" content="Link" />
            <Button variant="destructive" content="Delete" />
            <Button variant="destructive-outline" content="Remove" />
            <Button disabled content="Disabled" />
          </>
        }
      />
      <Row
        content={
          <>
            <Button size="xs" content="Extra small" />
            <Button size="sm" content="Small" />
            <Button content="Default" />
            <Button size="lg" content="Large" />
            <Button size="icon" aria-label="Add" iconSlot={<Plus />} />
            <Button iconSlot={<Download />} content="With an icon" />
          </>
        }
      />
    </div>
  );
}

function Badges() {
  return (
    <Row
      content={
        <>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="positive">Passed</Badge>
          <Badge variant="warning">Slow</Badge>
          <Badge backgroundColor="#1d4ed8" textColor={readableTextColor("#1d4ed8") ?? "#ffffff"}>
            Design
          </Badge>
          <Badge onRemove={noop}>Removable</Badge>
        </>
      }
    />
  );
}

const ICONS = {
  Calendar: CalendarIcon,
  Check,
  Copy,
  Download,
  FileText,
  Folder,
  Info,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tag,
  TriangleAlert,
  Upload,
};

function Icons() {
  return (
    <ul className="flex flex-wrap gap-4">
      {Object.entries(ICONS).map(([name, Icon]) => (
        <li key={name} className="flex w-24 flex-col items-center gap-1 text-foreground">
          <Icon className="size-5" />
          <span className="text-muted-foreground text-xs">{name}</span>
        </li>
      ))}
    </ul>
  );
}

function Cards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>atlas</CardTitle>
          <CardDescription>An HTTP server with twelve tools.</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline" content="Open" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm">Last seen four minutes ago.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm" content="Restart" />
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>borealis</CardTitle>
          <CardDescription>Stopped since Tuesday.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm">A card with no action and no footer.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Alerts() {
  return (
    <Stack
      content={
        <>
          <Alert title="Heads up" description="A default alert, for something worth a look." />
          <Alert variant="info" title="Syncing" description="Changes appear within a minute." />
          <Alert
            variant="warning"
            title="Storage is nearly full"
            description="Uploads stop at 100%."
            actionSlot={<Button size="sm" variant="outline" content="Manage" />}
          />
          <Alert
            variant="destructive"
            title="The import failed"
            description="Row 14 has no email address."
          />
        </>
      }
    />
  );
}

function Empties() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Folder />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>Make one to start a board.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button content="New project" />
      </EmptyContent>
    </Empty>
  );
}

function Items() {
  return (
    <ItemGroup className="max-w-xl">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Quarterly report</ItemTitle>
          <ItemDescription>Edited yesterday by Ada.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline" content="Archive" />
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="muted" size="sm">
        <ItemContent>
          <ItemTitle>A muted, small item</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function CodeSamples() {
  return (
    <Stack
      content={
        <>
          <p className="text-foreground text-sm">
            Run <Code>npx shadcn add @cubeui/button</Code> to install one item.
          </p>
          <CodeBlock
            content={
              '{\n  "registries": {\n    "@cubeui": "https://cubicecho.github.io/cubeui/r/{name}.json"\n  }\n}'
            }
            actionSlot={<CopyButton value="registries" label="Copy the snippet" />}
          />
        </>
      }
    />
  );
}

function Colors() {
  return (
    <Row
      content={
        <>
          <ColorDot color="#1d4ed8" label="Design" />
          <ColorDot color="#b91c1c" size="sm" label="Bug" />
          <div className="flex h-10 items-stretch gap-2 text-foreground text-sm">
            <ColorBar color="#15803d" label="Docs" />
            <span className="self-center">A row with a colour bar at its edge</span>
          </div>
        </>
      }
    />
  );
}

function Feedback() {
  return (
    <Stack
      content={
        <>
          <Row
            content={
              <>
                <Spinner label="Loading servers" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="size-10 rounded-full" />
              </>
            }
          />
          <Progress value={40} label="Upload" valueLabel="40%" />
          <Separator />
          <div className="flex h-6 items-center gap-3 text-foreground text-sm">
            <span>Left</span>
            <Separator orientation="vertical" />
            <span>Right</span>
          </div>
        </>
      }
    />
  );
}

function TabsSample() {
  return (
    <Tabs defaultValue="list">
      <TabsList aria-label="Project view">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="board">Board</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <p className="text-foreground text-sm">The list view.</p>
      </TabsContent>
      <TabsContent value="board">
        <p className="text-foreground text-sm">The board view.</p>
      </TabsContent>
      <TabsContent value="calendar">
        <p className="text-foreground text-sm">The calendar view.</p>
      </TabsContent>
    </Tabs>
  );
}

function TableSample() {
  return (
    <Table>
      <TableCaption>Servers in this workspace</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Transport</TableHead>
          <TableHead className="text-right">Tools</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SERVERS.map((server) => (
          <TableRow key={server.name}>
            <TableCell>{server.name}</TableCell>
            <TableCell>{server.transport}</TableCell>
            <TableCell className="text-right">{server.tools}</TableCell>
            <TableCell>{server.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Overlays() {
  const [autosave, setAutosave] = useState(true);
  return (
    <Row
      content={
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" content="Hover for a tooltip" />
              </TooltipTrigger>
              <TooltipContent>Shown on hover and on focus</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" content="Open the popover" />
            </PopoverTrigger>
            <PopoverContent aria-label="Filters">
              <PopoverHeader>
                <PopoverTitle>Filters</PopoverTitle>
                <PopoverDescription>Narrow the list to what you need.</PopoverDescription>
              </PopoverHeader>
              <PopoverClose asChild>
                <Button size="sm" content="Done" />
              </PopoverClose>
            </PopoverContent>
          </Popover>

          <Menu>
            <MenuTrigger asChild>
              <Button variant="outline" content="Open the menu" />
            </MenuTrigger>
            <MenuContent aria-label="Lane actions">
              <MenuItem iconSlot={<Pencil />} label="Rename" trailing="F2" onSelect={noop} />
              <MenuItem label="Move left" disabled onSelect={noop} />
              <MenuCheckboxItem label="Autosave" checked={autosave} onCheckedChange={setAutosave} />
              <MenuSeparator />
              <MenuItem label="Delete" destructive onSelect={noop} />
            </MenuContent>
          </Menu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" content="Open the dialog" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this board</DialogTitle>
                <DialogDescription>Anyone with the link can read it.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" content="Close the dialog" />
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    />
  );
}

function AskFirst() {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState("not asked");
  return (
    <Row
      content={
        <>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete this folder?",
                description: "Its notes go with it.",
              });
              setAnswer(ok ? "confirmed" : "cancelled");
            }}
            content="Ask with useConfirm"
          />
          <output aria-label="useConfirm answer" className="text-muted-foreground text-sm">
            {answer}
          </output>
        </>
      }
    />
  );
}

function Confirms() {
  const [open, setOpen] = useState(false);
  return (
    <Row
      content={
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" content="Open the alert dialog" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anything using it stops working at once.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction>Revoke</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            content="Open the confirm dialog"
          />
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete the workspace?"
            description="Type its name to confirm. This cannot be undone."
            requireText="acme"
            onConfirm={() => setOpen(false)}
          />

          <ConfirmProvider>
            <AskFirst />
          </ConfirmProvider>
        </>
      }
    />
  );
}

function ToastButtons() {
  const toast = useToast();
  return (
    <Row
      content={
        <>
          <Button
            variant="outline"
            onClick={() => toast("Saved.", "positive")}
            content="Show a positive toast"
          />
          <Button
            variant="outline"
            onClick={() => toast("The server did not answer.")}
            content="Show an error toast"
          />
        </>
      }
    />
  );
}

function CommandSample() {
  const [search, setSearch] = useState("");
  return (
    <div className="max-w-md rounded-lg border border-border">
      <Command label="Go to">
        <CommandInput value={search} onValueChange={setSearch} placeholder="Search…" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={noop}>Servers</CommandItem>
            <CommandItem onSelect={noop}>
              Settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={noop}>New project</CommandItem>
            <CommandItem disabled onSelect={noop}>
              Import
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function TextInputs() {
  return (
    <Stack
      content={
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gallery-name">Name</Label>
            <Input id="gallery-name" placeholder="Ada Lovelace" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gallery-locked">Disabled</Label>
            <Input id="gallery-locked" defaultValue="Cannot be changed" disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gallery-notes">Notes</Label>
            <Textarea id="gallery-notes" rows={3} placeholder="Anything worth keeping…" />
          </div>
          <SearchInput label="Search servers" placeholder="Search servers…" />
          <PasswordInput aria-label="Password" defaultValue="hunter2" />
        </>
      }
    />
  );
}

function Toggles() {
  const [notify, setNotify] = useState(true);
  const [plan, setPlan] = useState("team");
  return (
    <Stack
      content={
        <>
          <Row
            content={
              <>
                <Checkbox aria-label="Unchecked" />
                <Checkbox aria-label="Checked" defaultChecked />
                <Checkbox aria-label="Disabled" disabled />
                <Switch aria-label="Off" />
                <Switch aria-label="On" defaultChecked />
                <Switch aria-label="Small" size="sm" defaultChecked />
              </>
            }
          />
          <SwitchField
            id="gallery-notify"
            label="Email me when a run fails"
            checked={notify}
            onCheckedChange={setNotify}
          />
          <RadioGroup value={plan} onValueChange={setPlan} aria-label="Plan">
            <RadioGroupItem value="solo" label="Solo" description="One seat." />
            <RadioGroupItem value="team" label="Team" description="Up to ten seats." />
            <RadioGroupItem value="org" label="Organisation" disabled />
          </RadioGroup>
          <RadioGroup value={plan} onValueChange={setPlan} variant="card" aria-label="Plan cards">
            <RadioGroupItem value="solo" label="Solo" description="One seat." />
            <RadioGroupItem value="team" label="Team" description="Up to ten seats." />
          </RadioGroup>
        </>
      }
    />
  );
}

function Selects() {
  const [priority, setPriority] = useState("normal");
  const [tags, setTags] = useState<string[]>(["design", "docs"]);
  return (
    <Stack
      content={
        <>
          <Select defaultValue="http">
            <SelectTrigger aria-label="Transport" className="w-56">
              <SelectValue placeholder="Choose a transport" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Transport</SelectLabel>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="stdio">Standard I/O</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <OptionSelect
            aria-label="Priority"
            className="w-56"
            options={PRIORITIES}
            value={priority}
            onValueChange={setPriority}
          />
          <MultiSelect
            aria-label="Tags"
            options={TAGS}
            value={tags}
            onValueChange={setTags}
            placeholder="Choose tags"
          />
        </>
      }
    />
  );
}

function Choices() {
  const [view, setView] = useState("week");
  const [chips, setChips] = useState<readonly string[]>(["open"]);
  const toggle = (chip: string) =>
    setChips((all) => (all.includes(chip) ? all.filter((c) => c !== chip) : [...all, chip]));
  return (
    <Stack
      content={
        <>
          <SegmentedGroup value={view} onValueChange={setView} aria-label="Range">
            <SegmentedButton value="day">Day</SegmentedButton>
            <SegmentedButton value="week">Week</SegmentedButton>
            <SegmentedButton value="month">Month</SegmentedButton>
          </SegmentedGroup>
          <Row
            content={["open", "closed", "mine"].map((chip) => (
              <ToggleChip key={chip} selected={chips.includes(chip)} onClick={() => toggle(chip)}>
                {chip}
              </ToggleChip>
            ))}
          />
        </>
      }
    />
  );
}

function Dates() {
  const [day, setDay] = useState<Date | undefined>(new Date(2026, 8, 15));
  const [due, setDue] = useState<Date | null>(new Date(2026, 8, 15));
  const [range, setRange] = useState<DateRange | null>(null);
  const [at, setAt] = useState(new Date(2026, 8, 15, 9, 30));
  return (
    <div className="flex flex-wrap items-start gap-6">
      <Calendar
        mode="single"
        selected={day}
        onSelect={setDay}
        defaultMonth={new Date(2026, 8, 1)}
        className="rounded-lg border border-border"
      />
      <div className="flex w-72 flex-col gap-4">
        <DatePicker aria-label="Due" value={due} onValueChange={setDue} clearable />
        <DateRangePicker
          aria-label="Sprint"
          value={range}
          onValueChange={setRange}
          placeholder="Pick a range"
        />
        <DateTimeInput aria-label="Starts at" value={at} onChange={setAt} />
      </div>
    </div>
  );
}

function Pickers() {
  const [color, setColor] = useState("#1d4ed8");
  const [picked, setPicked] = useState("nothing yet");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  return (
    <Stack
      content={
        <>
          <ColorPicker
            aria-label="Label colour"
            value={color}
            onValueChange={setColor}
            swatches={SWATCHES}
          />
          <FilePicker
            label="Choose a file"
            hint="Plain text, read in the browser."
            accept=".txt,.md"
            onPick={(_text, name) => setPicked(name)}
          />
          <Row
            content={
              <>
                <FilePickerButton
                  label="Import"
                  variant="outline"
                  iconSlot={<Upload />}
                  onPick={(_text, name) => setPicked(name)}
                />
                <output aria-label="Picked file" className="text-muted-foreground text-sm">
                  {picked}
                </output>
              </>
            }
          />
          <ThemePicker aria-label="Theme" value={theme} onValueChange={setTheme} />
          <ThemePicker
            aria-label="Compact theme"
            variant="compact"
            value={theme}
            onValueChange={setTheme}
          />
        </>
      }
    />
  );
}

function ActionButtons() {
  return (
    <TooltipProvider>
      <Row
        content={
          <>
            <CopyButton value="sk-live-1234" label="Copy the API key" />
            <DownloadButton source="# Notes" filename="notes.md" label="Download notes.md" />
            <ActionButton label="Edit" variant="outline" size="icon" iconSlot={<Pencil />} />
            <ActionButton
              label="Refresh"
              hint="Fetches the list again"
              variant="outline"
              size="icon"
              iconSlot={<RefreshCw />}
            />
            <ConfirmButton
              label="Delete the lane"
              variant="destructive-outline"
              size="sm"
              title="Delete this lane?"
              description="Its cards move to the backlog."
              onConfirm={noop}
              content="Delete"
            />
          </>
        }
      />
    </TooltipProvider>
  );
}

function MarkdownEditing() {
  const [value, setValue] = useState("# Draft\n\nWrite **Markdown** here.");
  return <MarkdownEditor aria-label="Notes" value={value} onValueChange={setValue} rows={6} />;
}

// Its own chunk, as an app loads it: CodeMirror is most of the editor's weight.
const MarkdownCodeEditor = lazy(() => import("@/components/markdown-code-editor"));

function MarkdownCodeEditing() {
  const [value, setValue] = useState("# Draft\n\nWrite **Markdown** here, with a [link](#).\n");
  return (
    <Suspense fallback={<Skeleton className="min-h-64 w-full" />}>
      <MarkdownCodeEditor label="Document" value={value} onValueChange={setValue} />
    </Suspense>
  );
}

function Fields() {
  return (
    <FieldGroup className="max-w-xl">
      <Field>
        <FieldLabel htmlFor="gallery-field-email">Email</FieldLabel>
        <FieldContent>
          <Input id="gallery-field-email" defaultValue="ada@example.com" />
          <FieldDescription>Where receipts are sent.</FieldDescription>
        </FieldContent>
      </Field>
      <Field data-invalid="true">
        <FieldLabel htmlFor="gallery-field-slug">Slug</FieldLabel>
        <FieldContent>
          <Input id="gallery-field-slug" defaultValue="has spaces" aria-invalid />
          <FieldError>A slug has no spaces.</FieldError>
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

function FormFields() {
  return (
    <Stack
      content={
        <>
          <FormField
            label="Project name"
            description="Shown in the sidebar."
            required
            controlSlot={(props) => <Input {...props} defaultValue="Apollo" />}
          />
          <FormField
            label="Key"
            error="A key is three letters."
            controlSlot={(props) => <Input {...props} defaultValue="APOLLO" />}
          />
          <FormField label="Loading" loading controlSlot={(props) => <Input {...props} />} />
          <FieldRow
            contentSlot={
              <>
                <FormField label="First name" controlSlot={(props) => <Input {...props} />} />
                <FormField label="Last name" controlSlot={(props) => <Input {...props} />} />
              </>
            }
          />
        </>
      }
    />
  );
}

function AppFormSample() {
  const form = useAppForm({
    defaultValues: {
      title: "Write the release notes",
      notes: "",
      priority: "normal",
      estimate: 3,
      notify: true,
      color: "#1d4ed8",
      due: new Date(2026, 8, 15) as Date | null,
      tags: ["docs"] as readonly string[],
      password: "",
      plan: "team",
    },
    onSubmit: noop,
  });
  return (
    <form
      className="grid max-w-xl gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <InputField form={form} name="title" label="Title" required />
      <TextareaField form={form} name="notes" label="Notes" rows={3} />
      <FieldRow
        contentSlot={
          <>
            <SelectField form={form} name="priority" label="Priority" options={PRIORITIES} />
            <NumberField form={form} name="estimate" label="Estimate, in days" />
          </>
        }
      />
      <BoundSwitchField form={form} name="notify" label="Notify the team" />
      <ColorField form={form} name="color" label="Colour" swatches={SWATCHES} />
      <DateField form={form} name="due" label="Due" clearable />
      <MultiSelectField form={form} name="tags" label="Tags" options={TAGS} />
      <PasswordField form={form} name="password" label="Password" />
      <RadioGroupField
        form={form}
        name="plan"
        label="Plan"
        options={[
          { value: "solo", label: "Solo" },
          { value: "team", label: "Team" },
        ]}
      />
      <div>
        <Button type="submit" content="Save" />
      </div>
    </form>
  );
}

const { useAppForm: useHookForm } = createAppForm({
  DateTimeField,
  ColorField: HookColorField,
  MultiSelectField: HookMultiSelectField,
  SegmentedField,
});

const HOOK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];
const HOOK_TAGS = [
  { value: "home", label: "Home" },
  { value: "errand", label: "Errand" },
  { value: "work", label: "Work" },
];

function HookFormSample() {
  const form = useHookForm({
    defaultValues: {
      title: "",
      done: false,
      notify: true,
      due: new Date(2026, 8, 15) as Date | null,
      color: "#1d4ed8",
      priority: "normal",
      tags: ["home"] as string[],
    },
    onSubmit: noop,
  });
  return (
    <div className="max-w-xl">
      <form.AppForm>
        <Form className="flex flex-col gap-4">
          <form.AppField name="title">{(field) => <field.InputField label="Task" />}</form.AppField>
          <form.AppField name="done">
            {(field) => <field.CheckboxField label="Done" />}
          </form.AppField>
          <form.AppField name="notify">
            {(field) => <field.SwitchField label="Remind me" description="On the day." />}
          </form.AppField>
          <form.AppField name="due">
            {(field) => <field.DateTimeField label="Due date" mode="date" clearable />}
          </form.AppField>
          <form.AppField name="color">
            {(field) => <field.ColorField label="Task colour" swatches={SWATCHES} />}
          </form.AppField>
          <form.AppField name="priority">
            {(field) => <field.SegmentedField label="Priority" options={HOOK_PRIORITIES} />}
          </form.AppField>
          <form.AppField name="tags">
            {(field) => <field.MultiSelectField label="Task tags" options={HOOK_TAGS} />}
          </form.AppField>
          <form.SubmitButton createLabel="Add the task" />
        </Form>
      </form.AppForm>
    </div>
  );
}

function FormElementSample() {
  const [sent, setSent] = useState(false);
  return (
    <FormElement onSubmit={() => setSent(true)} className="flex max-w-xl items-end gap-3">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="gallery-invite">Invite by email</Label>
        <Input id="gallery-invite" placeholder="grace@example.com" />
      </div>
      <Button type="submit" content={sent ? "Invited" : "Invite"} />
    </FormElement>
  );
}

function Sections() {
  return (
    <Stack
      content={
        <>
          <SectionHeading level={3}>A section heading</SectionHeading>
          <SectionHeading level={3} variant="overline">
            An overline heading
          </SectionHeading>
          <Section
            level={3}
            title="Members"
            description="Who can open this workspace."
            actionSlot={<Button size="sm" variant="outline" content="Invite" />}
            contentSlot={<p className="text-foreground text-sm">Ada, Grace and Edsger.</p>}
          />
          <Section
            level={3}
            surface="card"
            title="Billing"
            description="A section drawn on a card."
            contentSlot={<p className="text-foreground text-sm">Team plan, ten seats.</p>}
          />
        </>
      }
    />
  );
}

function ListItems() {
  return (
    <div className="flex max-w-xl flex-col">
      <ListItem
        leadingSlot={<Folder className="size-4" />}
        title="Design system"
        description="14 notes"
        meta="2 days ago"
        onClick={noop}
      />
      <ListItem
        leadingSlot={<FileText className="size-4" />}
        title="Release checklist"
        description="A row that is not pressable"
        actionSlot={<Button size="sm" variant="outline" content="Open" />}
      />
    </div>
  );
}

const FILES = [
  { path: "references/api/endpoints.md", type: "file" as const, size: "4 KB" },
  { path: "references/forms.md", type: "file" as const, size: "1 KB" },
  { path: "scripts/build.sh", type: "file" as const, size: "256 B" },
  { path: "notes.md", type: "file" as const, size: "512 B" },
];

function FileTrees() {
  const [selected, setSelected] = useState("SKILL.md");
  return (
    <div className="max-w-xs">
      <FileTree
        label="Skill files"
        pinned={[{ path: "SKILL.md", type: "file", size: "2 KB" }]}
        entries={FILES}
        selected={selected}
        onSelect={setSelected}
        meta={(node) => node.entry?.size}
        actionSlot={(node) =>
          node.type === "file" ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Rename ${node.path}`}
              iconSlot={<Pencil />}
            />
          ) : null
        }
      />
    </div>
  );
}

function Disclosures() {
  const [open, setOpen] = useState(false);
  return (
    <Stack
      content={
        <>
          <Disclosure
            title="Advanced"
            description="Timeouts and retries."
            contentSlot={
              <p className="text-foreground text-sm">Retries: 3. Timeout: 30 seconds.</p>
            }
          />
          <Disclosure
            title="Open from the start"
            defaultOpen
            contentSlot={<p className="text-foreground text-sm">This one begins open.</p>}
          />
          <DisclosureRow
            open={open}
            onOpenChange={setOpen}
            title="atlas"
            badgesSlot={<Badge variant="secondary">http</Badge>}
            meta="12 tools"
            description="An HTTP server."
            contentSlot={<p className="text-foreground text-sm">search, fetch, summarise…</p>}
          />
        </>
      }
    />
  );
}

function Descriptions() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DescriptionList
        contentSlot={
          <>
            <PropertyRow label="Owner" value="Ada Lovelace" />
            <PropertyRow label="Created" value="15 September 2026" hint="By import" />
            <PropertyRow
              label="API key"
              value="sk-live-…1234"
              actionSlot={<CopyButton value="sk-live-1234" label="Copy the key" />}
            />
          </>
        }
      />
      <DescriptionList
        layout="stacked"
        contentSlot={
          <>
            <PropertyRow label="Region" value="eu-west-1" />
            <PropertyRow label="Plan" value="Team" />
          </>
        }
      />
    </div>
  );
}

function SettingRows() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <SettingRow
        title="Weekly digest"
        description="One email on Monday morning."
        actionSlot={({ titleId, descriptionId }) => (
          <Switch
            checked={on}
            onCheckedChange={setOn}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          />
        )}
      />
      <SettingRow
        title="Export"
        description="Everything in this workspace, as JSON."
        actionSlot={<Button size="sm" variant="outline" content="Export" />}
      />
    </div>
  );
}

function StatTiles() {
  const [selected, setSelected] = useState("open");
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatTile label="Servers" value="12" hint="3 stopped" iconSlot={<Settings />} />
      <StatTile label="Loading" value="0" loading />
      <StatTile
        label="Open"
        value="48"
        selected={selected === "open"}
        onClick={() => setSelected("open")}
      />
      <StatTile
        label="Closed"
        value="131"
        selected={selected === "closed"}
        onClick={() => setSelected("closed")}
      />
    </div>
  );
}

const idle = { isPending: false, isError: false, error: null, refetch: noop };

function QueryStates() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <RowSkeleton rows={3} />
      <QueryError error={new Error("The server did not answer.")} onRetry={noop} what="servers" />
      <QueryState
        query={idle}
        what="servers"
        count={0}
        emptySlot={<EmptyState compact title="No servers yet" />}
      />
    </div>
  );
}

function PageHeaders() {
  return (
    <Stack
      content={
        <>
          <PageHeader
            level={3}
            iconSlot={<Settings />}
            title="Settings"
            description="Everything about this workspace."
            actionSlot={<Button size="sm" content="Save" />}
          />
          <PageHeader level={3} title="Loading" loading />
        </>
      }
    />
  );
}

function CardLayouts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CardLayout
        level={3}
        title="Danger zone"
        description="These cannot be undone."
        contentSlot={
          <p className="text-foreground text-sm">Delete the workspace and all its data.</p>
        }
        footerActionsSlot={<Button variant="destructive" content="Delete" />}
      />
      <CardLayout
        level={3}
        title="Webhooks"
        actionSlot={<Button size="sm" variant="outline" content="Add" />}
        emptySlot={<EmptyState compact title="No webhooks yet" />}
      />
    </div>
  );
}

function DialogLayoutSample() {
  return (
    <DialogLayout
      triggerSlot={<Button variant="outline" content="Open the dialog layout" />}
      title="Edit the server"
      description="A long form scrolls between a title and a footer that stay put."
      contentSlot={
        <div className="flex flex-col gap-4">
          <FormField
            label="Server name"
            controlSlot={(props) => <Input {...props} defaultValue="atlas" />}
          />
          {paragraphs(20)}
        </div>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <Button onClick={close} content="Save the server" />
        </>
      )}
    />
  );
}

const PLACES = ["Servers", "Tools", "Settings"];

function SidebarSample({ label }: { label: string }) {
  return (
    <Sidebar
      label={label}
      headerSlot={<span className="font-semibold text-sidebar-foreground">Router</span>}
      contentSlot={
        <SidebarSection
          as="nav"
          label={`${label} places`}
          title="Workspace"
          level={3}
          contentSlot={PLACES.map((place) => (
            <SidebarNavItem
              key={place}
              href={`#${place.toLowerCase()}`}
              label={place}
              active={place === "Servers"}
              {...(place === "Tools" ? { count: 47 } : {})}
            />
          ))}
        />
      }
      footerSlot={<span className="text-sidebar-foreground text-sm">ada@example.com</span>}
    />
  );
}

type Server = (typeof SERVERS)[number];

const sections: GallerySection[] = [
  // Primitives
  { title: "Button", items: ["button"], content: <Buttons /> },
  { title: "Badge", items: ["badge"], content: <Badges /> },
  {
    title: "Icons",
    items: ["icons"],
    description: "A sample of the set. Each takes its size and colour from a class.",
    content: <Icons />,
  },
  { title: "Card", items: ["card"], content: <Cards /> },
  { title: "Alert", items: ["alert"], content: <Alerts /> },
  { title: "Empty", items: ["empty"], content: <Empties /> },
  { title: "Item", items: ["item"], content: <Items /> },
  { title: "Code", items: ["code"], content: <CodeSamples /> },
  { title: "Colour bar and dot", items: ["color-bar", "color-dot"], content: <Colors /> },
  {
    title: "Progress, skeleton, spinner, separator",
    items: ["progress", "skeleton", "spinner", "separator"],
    content: <Feedback />,
  },
  { title: "Tabs", items: ["tabs"], content: <TabsSample /> },
  { title: "Table", items: ["table"], content: <TableSample /> },
  {
    title: "Tooltip, popover, menu, dialog",
    items: ["tooltip", "popover", "menu", "dialog"],
    description: "Closed until pressed.",
    content: <Overlays />,
  },
  {
    title: "Alert dialog and confirm",
    items: ["alert-dialog", "confirm-dialog", "confirm"],
    description: "The primitive, the ready-made destructive question, and the hook that asks it.",
    content: <Confirms />,
  },
  {
    title: "Toast",
    items: ["toast"],
    content: (
      <ToastProvider>
        <ToastButtons />
      </ToastProvider>
    ),
  },
  { title: "Command", items: ["command"], content: <CommandSample /> },

  // Controls
  {
    title: "Input, textarea, label",
    items: ["input", "textarea", "label", "search-input", "password-input"],
    content: <TextInputs />,
  },
  {
    title: "Checkbox, switch, radio group",
    items: ["checkbox", "switch", "switch-field", "radio-group"],
    content: <Toggles />,
  },
  {
    title: "Select, option select, multi select",
    items: ["select", "option-select", "multi-select"],
    content: <Selects />,
  },
  {
    title: "Segmented and toggle chip",
    items: ["segmented", "toggle-chip"],
    content: <Choices />,
  },
  {
    title: "Calendar and date pickers",
    items: ["calendar", "date-picker", "date-time-input"],
    content: <Dates />,
  },
  {
    title: "Colour, file and theme pickers",
    items: ["color-picker", "file-picker", "theme-picker"],
    description: "The theme picker here is controlled, so choosing does not restyle the page.",
    content: <Pickers />,
  },
  {
    title: "Copy, download, action and confirm buttons",
    items: ["copy-button", "download-button", "action-button", "confirm-button"],
    content: <ActionButtons />,
  },
  { title: "Markdown", items: ["markdown"], content: <Markdown content={NOTES} /> },
  { title: "Markdown editor", items: ["markdown-editor"], content: <MarkdownEditing /> },
  {
    title: "Markdown code editor",
    items: ["markdown-code-editor"],
    description: "CodeMirror, loaded lazily, for the app whose job is editing Markdown files.",
    content: <MarkdownCodeEditing />,
  },

  // Forms
  { title: "Field", items: ["field"], content: <Fields /> },
  {
    title: "Form field and field row",
    items: ["form-field", "field-row"],
    content: <FormFields />,
  },
  {
    title: "App form and its bound fields",
    items: [
      "app-form",
      "color-field",
      "date-field",
      "multi-select-field",
      "password-field",
      "radio-group-field",
    ],
    description: "The web tier's form hook: every field bound to the form by name.",
    content: <AppFormSample />,
  },
  {
    title: "Form",
    items: [
      "form",
      "date-time-field",
      "color-picker-field",
      "segmented-field",
      "multi-select-form-field",
    ],
    description: "The hook both platforms share, with its fields on `field.*`.",
    content: <HookFormSample />,
  },
  { title: "Form element", items: ["form-element"], content: <FormElementSample /> },

  // Layout rows
  {
    title: "Section and section heading",
    items: ["section", "section-heading"],
    content: <Sections />,
  },
  { title: "List item", items: ["list-item"], content: <ListItems /> },
  { title: "File tree", items: ["file-tree"], content: <FileTrees /> },
  {
    title: "Disclosure and disclosure row",
    items: ["disclosure", "disclosure-row"],
    content: <Disclosures />,
  },
  { title: "Description list", items: ["description-list"], content: <Descriptions /> },
  { title: "Setting row", items: ["setting-row"], content: <SettingRows /> },
  { title: "Stat tile", items: ["stat-tile"], content: <StatTiles /> },
  { title: "Query state", items: ["query-state"], content: <QueryStates /> },
  {
    title: "Route error",
    items: ["route-error"],
    content: (
      <Frame
        height="h-[320px]"
        content={<RouteError error={new Error("Project not found")} reset={noop} />}
      />
    ),
  },
  { title: "Page header", items: ["page-header"], content: <PageHeaders /> },

  // Shells
  { title: "Card layout", items: ["card-layout"], content: <CardLayouts /> },
  {
    title: "Centered layout",
    items: ["centered-layout"],
    content: (
      <Frame
        content={
          <CenteredLayout
            className="h-full min-h-0"
            level={3}
            title="Sign in"
            description="Use your work email."
            contentSlot={
              <FormField
                label="Work email"
                controlSlot={(props) => <Input {...props} placeholder="ada@example.com" />}
              />
            }
            footerActionsSlot={<Button content="Continue" />}
          />
        }
      />
    ),
  },
  { title: "Dialog layout", items: ["dialog-layout"], content: <DialogLayoutSample /> },
  {
    title: "Header, content, footer",
    items: ["header-content-footer"],
    description: "The chrome stays and the middle scrolls.",
    content: (
      <Frame
        height="h-[320px]"
        content={
          <HeaderContentFooter
            className="h-full"
            headerSlot={
              <p className="p-3 font-medium text-foreground text-sm">A header that stays</p>
            }
            contentSlot={<div className="px-3">{paragraphs(20)}</div>}
            footerSlot={<p className="p-3 text-muted-foreground text-sm">A footer that stays</p>}
          />
        }
      />
    ),
  },
  {
    title: "Page layout",
    items: ["page-layout"],
    content: (
      <Frame
        content={
          <PageLayout
            className="h-full"
            level={3}
            title="Servers"
            description="Everything this workspace can reach."
            actionSlot={<Button size="sm" content="New server" />}
            contentSlot={<div className="px-1">{paragraphs(20)}</div>}
            footerSlot={<p className="text-muted-foreground text-sm">20 rows</p>}
          />
        }
      />
    ),
  },
  {
    title: "Page, detail page and detail header",
    items: ["page", "detail-page", "detail-header"],
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <Frame
          content={
            <Page
              contentSlot={
                <>
                  <PageHeader level={3} title="Projects" />
                  <CardGrid
                    contentSlot={SERVERS.map((server) => (
                      <Card key={server.name}>
                        <CardHeader>
                          <CardTitle>{server.name}</CardTitle>
                          <CardDescription>{server.status}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  />
                </>
              }
            />
          }
        />
        <Frame
          content={
            <DetailPage<Server>
              entity={SERVERS[0]}
              notFoundLabel="Server not found"
              contentSlot={(server) => (
                <>
                  <DetailHeader
                    onBack={noop}
                    backLabel="Back to servers"
                    color="#1d4ed8"
                    colorLabel="Blue"
                    title={server.name}
                    subtitle={`${server.tools} tools over ${server.transport}`}
                    badgeSlot={<Badge variant="secondary">{server.status}</Badge>}
                    actionsSlot={<EditButton onClick={noop} label="Edit the server" />}
                  />
                  <p className="text-foreground text-sm">The body of the detail page.</p>
                </>
              )}
            />
          }
        />
      </div>
    ),
  },
  {
    title: "Split layout",
    items: ["split-layout"],
    content: (
      <Frame
        height="h-[320px]"
        content={
          <SplitLayout
            className="h-full"
            firstWidth="sm"
            firstSlot={<div className="p-3">{paragraphs(4)}</div>}
            secondSlot={
              <p className="p-3 text-foreground text-sm">The second pane takes the rest.</p>
            }
          />
        }
      />
    ),
  },
  {
    title: "Sidebar and sidebar layout",
    items: ["sidebar"],
    content: (
      <Frame
        content={
          <SidebarLayout
            className="h-full"
            sidebarWidth="auto"
            sidebarSlot={<SidebarSample label="Gallery sidebar" />}
            contentSlot={<div className="p-4">{paragraphs(20)}</div>}
          />
        }
      />
    ),
  },
  {
    title: "Top bar layout",
    items: ["top-bar-layout"],
    content: (
      <Frame
        height="h-[320px]"
        content={
          <TopBarLayout
            className="h-full"
            brandSlot={<span className="font-semibold text-foreground">Router</span>}
            navLabel="Gallery top bar"
            navSlot={PLACES.map((place) => (
              <a
                key={place}
                href={`#${place.toLowerCase()}`}
                className="shrink-0 rounded-md px-3 py-1.5 text-foreground text-sm"
              >
                {place}
              </a>
            ))}
            actionSlot={<Button size="sm" variant="outline" content="Sign out" />}
            contentSlot={<div className="p-4">{paragraphs(20)}</div>}
          />
        }
      />
    ),
  },
];

export const Everything: Story = {
  render: () => (
    <Gallery
      layout="page"
      title="cubeui on the web"
      description="Every item a DOM app installs: the compiled halves and the web-only tier."
      sections={sections}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    // The page is the registry: nothing left out without a reason, nothing shown that is gone.
    await expect(unaccountedItems(registry.items, sections, NOT_SHOWN)).toEqual([]);
    await expect(canvasElement.querySelectorAll("section[data-gallery-items]")).toHaveLength(
      sections.length,
    );
    await expect(
      canvasElement.querySelectorAll("section[data-gallery-items] > div:first-child > h2"),
    ).toHaveLength(sections.length);

    // And it is live, not a picture: a control answers, and an overlay opens and closes.
    const week = canvas.getByRole("button", { name: "Week" });
    const month = canvas.getByRole("button", { name: "Month" });
    await userEvent.click(month);
    await expect(month).toHaveAttribute("aria-pressed", "true");
    await expect(week).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(canvas.getByRole("button", { name: "Open the dialog" }));
    const dialog = await body.findByRole("dialog", { name: "Share this board" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Close the dialog" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());

    // `play` runs for a reader too, and the presses above scroll to what they pressed.
    canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
  },
};
