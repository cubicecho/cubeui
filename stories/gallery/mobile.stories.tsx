import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { Text, View } from "react-native";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ActionButton } from "../../registry/layout/action-button";
import { CardLayout } from "../../registry/layout/card-layout";
import { CenteredLayout } from "../../registry/layout/centered-layout";
import { ConfirmButton } from "../../registry/layout/confirm-button";
import { DescriptionList, PropertyRow } from "../../registry/layout/description-list";
import { DetailHeader, EditButton } from "../../registry/layout/detail-header";
import { DetailPage } from "../../registry/layout/detail-page";
import { DialogLayout } from "../../registry/layout/dialog-layout";
import { Disclosure } from "../../registry/layout/disclosure";
import { DisclosureRow } from "../../registry/layout/disclosure-row";
import { HeaderContentFooter } from "../../registry/layout/header-content-footer";
import { ListItem } from "../../registry/layout/list-item";
import { MultiSelect } from "../../registry/layout/multi-select";
import { OptionSelect } from "../../registry/layout/option-select";
import { CardGrid, EmptyState, Page } from "../../registry/layout/page";
import { PageHeader } from "../../registry/layout/page-header";
import { PageLayout } from "../../registry/layout/page-layout";
import { QueryError, QueryState, RowSkeleton } from "../../registry/layout/query-state";
import { RadioGroupField } from "../../registry/layout/radio-group-field";
import { RouteError } from "../../registry/layout/route-error";
import { Section } from "../../registry/layout/section";
import { SectionHeading } from "../../registry/layout/section-heading";
import { SettingRow } from "../../registry/layout/setting-row";
import { Sidebar, SidebarNavItem, SidebarSection } from "../../registry/layout/sidebar";
import { SidebarLayout, SplitLayout } from "../../registry/layout/split-layout";
import { StatTile } from "../../registry/layout/stat-tile";
import { TopBarLayout } from "../../registry/layout/top-bar-layout";
import { Alert } from "../../registry/ui/alert";
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
} from "../../registry/ui/alert-dialog.tsx";
import { Badge } from "../../registry/ui/badge.tsx";
import { Button } from "../../registry/ui/button";
import { Calendar } from "../../registry/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../registry/ui/card";
import { Checkbox } from "../../registry/ui/checkbox.tsx";
import { Code, CodeBlock } from "../../registry/ui/code";
import { ColorBar } from "../../registry/ui/color-bar";
import { ColorDot } from "../../registry/ui/color-dot";
import { ColorPicker } from "../../registry/ui/color-picker";
import { ColorField } from "../../registry/ui/color-picker-field";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../registry/ui/command.tsx";
import { ConfirmProvider, useConfirm } from "../../registry/ui/confirm";
import { ConfirmDialog } from "../../registry/ui/confirm-dialog";
import { DatePicker } from "../../registry/ui/date-picker";
import { DateTimeField } from "../../registry/ui/date-time-field";
import { DateTimeInput } from "../../registry/ui/date-time-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../registry/ui/dialog.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../registry/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../registry/ui/field";
import { FilePicker, FilePickerButton } from "../../registry/ui/file-picker.tsx";
import { createAppForm, Form } from "../../registry/ui/form";
import { FormDialog, FormDialogFooter } from "../../registry/ui/form-dialog";
import { FormElement } from "../../registry/ui/form-element.tsx";
import {
  CircleCheck,
  Download,
  FileText,
  Folder,
  Info,
  Pencil,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  TriangleAlert,
} from "../../registry/ui/icons";
import { Input } from "../../registry/ui/input.tsx";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../../registry/ui/item.tsx";
import { Label } from "../../registry/ui/label.tsx";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../registry/ui/menu.tsx";
import { PasswordInput } from "../../registry/ui/password-input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../registry/ui/popover.tsx";
import { Progress } from "../../registry/ui/progress";
import { RadioGroup, RadioGroupItem } from "../../registry/ui/radio-group";
import { SearchInput } from "../../registry/ui/search-input.tsx";
import { SegmentedButton, SegmentedGroup } from "../../registry/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../registry/ui/select.tsx";
import { Separator } from "../../registry/ui/separator";
import { Skeleton } from "../../registry/ui/skeleton.tsx";
import { Spinner } from "../../registry/ui/spinner.tsx";
import { Switch } from "../../registry/ui/switch.tsx";
import { SwitchField } from "../../registry/ui/switch-field.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../registry/ui/tabs.tsx";
import { Textarea } from "../../registry/ui/textarea.tsx";
import { ThemePicker } from "../../registry/ui/theme-picker";
import { ToastProvider, useToast } from "../../registry/ui/toast";
import { ToggleChip } from "../../registry/ui/toggle-chip";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/ui/tooltip.tsx";
import registry from "../../registry.json";
import { Gallery, type GallerySection, unaccountedItems } from "./gallery";

/**
 * Every React Native registry item on one page, each section a phone-width column, so someone
 * choosing what to build on can scroll the whole native registry instead of opening a story per
 * item. The sources are the ones under `registry/`, run through react-native-web.
 *
 * An item with a web half is imported by its full file name, because Vite would otherwise resolve
 * `<name>.web.tsx`. The `@/components/ui/…` imports inside a native source still resolve that way,
 * so a control nested in another item (the input inside a form field) may be its web half here.
 * Two items are left to resolve that way on purpose: `icons`, whose native source asks for an icon
 * file the installed lucide-react-native does not ship, and `calendar`, whose native day cells come
 * out of react-native-web as `aria-selected` on an element with no role.
 *
 * `play` fails when a registry item is neither under a section nor in `NOT_SHOWN` with a reason, so
 * the page cannot fall behind the registry without a red test.
 */
const meta = {
  title: "Gallery/Mobile",
  parameters: {
    layout: "fullscreen",
    a11y: {
      config: {
        // Each shell is a whole screen with its own banner and main, and here several of them sit
        // on one page, each inside the labelled section the gallery frame draws. A real screen
        // has one shell at the top level, so these five say nothing about the shells themselves.
        rules: [
          { id: "landmark-no-duplicate-banner", enabled: false },
          { id: "landmark-no-duplicate-main", enabled: false },
          { id: "landmark-unique", enabled: false },
          { id: "landmark-banner-is-top-level", enabled: false },
          { id: "landmark-main-is-top-level", enabled: false },
        ],
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** The registry items with no section, and why each cannot be drawn here. */
const NOT_SHOWN: Record<string, string> = {
  tokens:
    "The palette as CSS variables. Every section is drawn in it; there is no element to show.",
  utils: "The `cn` class-name helper. A function, not a component.",
  color: "Colour maths helpers. Functions, not components.",
  "readable-text-color": "Picks black or white text for a background. A function, not a component.",
  format: "Writes a count, a size, a duration and a date as text. Functions, not components.",
  "unsaved-changes-guard":
    "A hook and a question that stays closed until a page with edits is left. Its own story opens it.",
  "copy-button":
    "The native source imports expo-clipboard, which this repo only declares in types/, so it cannot run in a browser.",
  "download-button":
    "The native source imports expo-file-system and expo-sharing, which this repo only declares in types/, so it cannot run in a browser.",
};

const onButtonPress = fn();

const noop = () => {};

function Stack({ children }: { children: ReactNode }) {
  return <View className="flex-col gap-3">{children}</View>;
}

function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-2">{children}</View>;
}

function Caption({ children }: { children: string }) {
  return <Text className="text-muted-foreground text-xs">{children}</Text>;
}

/** The fixed-height box a full-screen shell is drawn in, so it does not take the page over. */
function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-lg border border-border">
      {children}
    </div>
  );
}

function Lines({ count }: { count: number }) {
  return (
    <View className="flex-col gap-2">
      {Array.from({ length: count }, (_, index) => `Line ${index + 1}`).map((line) => (
        <Text key={line} className="text-foreground text-sm">
          {line} of the screen's content.
        </Text>
      ))}
    </View>
  );
}

function Toggles() {
  const [agreed, setAgreed] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [digest, setDigest] = useState(false);
  return (
    <Stack>
      <Row>
        <Checkbox
          checked={agreed}
          onCheckedChange={setAgreed}
          accessibilityLabel="Agree to terms"
        />
        <Checkbox defaultChecked={false} accessibilityLabel="Subscribe to updates" />
        <Checkbox defaultChecked disabled accessibilityLabel="Locked option" />
      </Row>
      <Row>
        <Switch checked={alerts} onCheckedChange={setAlerts} accessibilityLabel="Alerts" />
        <Switch defaultChecked={false} accessibilityLabel="Sounds" />
        <Switch defaultChecked disabled accessibilityLabel="Locked setting" />
      </Row>
      <SwitchField
        id="gallery-mobile-digest"
        label="Weekly digest"
        checked={digest}
        onCheckedChange={setDigest}
      />
    </Stack>
  );
}

function Choices() {
  const [plan, setPlan] = useState("team");
  const [view, setView] = useState("list");
  return (
    <Stack>
      <RadioGroup value={plan} onValueChange={setPlan} aria-label="Plan">
        <RadioGroupItem value="solo" label="Solo" description="One person, one workspace." />
        <RadioGroupItem value="team" label="Team" description="Shared projects and roles." />
      </RadioGroup>
      <RadioGroup defaultValue="month" variant="segmented" aria-label="Billing period">
        <RadioGroupItem value="month" label="Monthly" />
        <RadioGroupItem value="year" label="Yearly" />
      </RadioGroup>
      <SegmentedGroup value={view} onValueChange={setView} aria-label="View">
        <SegmentedButton value="list">List</SegmentedButton>
        <SegmentedButton value="board">Board</SegmentedButton>
        <SegmentedButton value="table">Table</SegmentedButton>
      </SegmentedGroup>
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="archive" disabled>
            Archive
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Text className="text-foreground text-sm">Twelve open tasks, three due this week.</Text>
        </TabsContent>
        <TabsContent value="activity">
          <Text className="text-foreground text-sm">Nothing has changed since Monday.</Text>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

const LABEL_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "docs", label: "Docs" },
];

function Selects() {
  const [fruit, setFruit] = useState("apple");
  const [status, setStatus] = useState("open");
  const [labels, setLabels] = useState<string[]>(["bug"]);
  return (
    <Stack>
      <Select value={fruit} onValueChange={setFruit}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <OptionSelect
        aria-label="Status"
        value={status}
        onValueChange={setStatus}
        options={[
          { value: "open", label: "Open" },
          { value: "paused", label: "Paused" },
          { separator: true },
          { value: "closed", label: "Closed" },
        ]}
      />
      <MultiSelect
        aria-label="Labels"
        placeholder="Pick labels"
        options={LABEL_OPTIONS}
        value={labels}
        onValueChange={setLabels}
      />
    </Stack>
  );
}

const SAMPLE_DAY = new Date(2026, 2, 14, 9, 30);

function Dates() {
  const [day, setDay] = useState<Date | undefined>(SAMPLE_DAY);
  const [moment, setMoment] = useState(SAMPLE_DAY);
  const [due, setDue] = useState<Date | null>(SAMPLE_DAY);
  return (
    <Stack>
      <Calendar mode="single" selected={day} onSelect={setDay} defaultMonth={SAMPLE_DAY} />
      <DateTimeInput value={moment} onChange={setMoment} aria-label="Starts at" />
      <DatePicker value={due} onValueChange={setDue} aria-label="Due date" />
    </Stack>
  );
}

function ColourAndTheme() {
  const [colour, setColour] = useState("#2563eb");
  return (
    <Stack>
      <ColorPicker value={colour} onValueChange={setColour} aria-label="Label colour" />
      <ThemePicker variant="card" aria-label="Theme" />
      <ThemePicker variant="compact" aria-label="Theme, compact" />
    </Stack>
  );
}

function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>
        Open command list
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={search} onValueChange={setSearch} placeholder="Search actions…" />
        <CommandList>
          <CommandEmpty>No action matches.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => setOpen(false)}>New project</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>Invite a teammate</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function Overlays() {
  const [compact, setCompact] = useState(false);
  return (
    <Stack>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share project</DialogTitle>
            <DialogDescription>Anyone with the link can read it.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Open alert dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard the draft?</AlertDialogTitle>
            <AlertDialogDescription>What you wrote will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep writing</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Storage">
          <PopoverHeader>
            <PopoverTitle>Storage</PopoverTitle>
            <PopoverDescription>4.2 GB of 10 GB used.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="outline">Open menu</Button>
        </MenuTrigger>
        <MenuContent aria-label="Project actions">
          <MenuItem label="Rename" icon={<Pencil />} onSelect={noop} />
          <MenuCheckboxItem label="Compact rows" checked={compact} onCheckedChange={setCompact} />
          <MenuSeparator />
          <MenuItem label="Delete" icon={<Trash2 />} destructive onSelect={noop} />
        </MenuContent>
      </Menu>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Long-press for a tooltip</Button>
        </TooltipTrigger>
        <TooltipContent>Saved a minute ago</TooltipContent>
      </Tooltip>
      <CommandPalette />
    </Stack>
  );
}

function ConfirmAndToastButtons() {
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <Stack>
      <Button variant="outline" onPress={() => setOpen(true)}>
        Open confirm dialog
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive this project?"
        description="It can be restored from the archive."
        confirmLabel="Archive"
        onConfirm={() => setOpen(false)}
      />
      <Button
        variant="outline"
        onPress={async () => {
          const ok = await confirm({
            title: "Remove this teammate?",
            description: "They lose access straight away.",
            confirmLabel: "Remove",
          });
          toast(ok ? "Teammate removed" : "Nothing changed", ok ? "success" : "error");
        }}
      >
        Ask, then toast the answer
      </Button>
      <Button variant="outline" onPress={() => toast("Changes saved", "success")}>
        Show a toast
      </Button>
    </Stack>
  );
}

function ConfirmAndToast() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ConfirmAndToastButtons />
      </ConfirmProvider>
    </ToastProvider>
  );
}

const { useAppForm } = createAppForm({ DateTimeField, ColorField });

const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private", description: "Only people you invite." },
  { value: "team", label: "Team", description: "Everyone in the workspace." },
];

function ProjectForm() {
  const form = useAppForm({
    defaultValues: {
      name: "Quarterly review",
      notes: "",
      visibility: "team",
      pinned: false,
      notify: true,
      due: SAMPLE_DAY as Date | null,
      colour: "#16a34a" as string | null,
    },
    onSubmit: noop,
  });
  return (
    <form.AppForm>
      <Form className="flex flex-col gap-4">
        <form.AppField name="name">{(field) => <field.InputField label="Name" />}</form.AppField>
        <form.AppField name="notes">
          {(field) => <field.TextAreaField label="Notes" />}
        </form.AppField>
        <RadioGroupField
          form={form}
          name="visibility"
          label="Visibility"
          options={VISIBILITY_OPTIONS}
        />
        <form.AppField name="pinned">
          {(field) => <field.CheckboxField label="Pin to the top" />}
        </form.AppField>
        <form.AppField name="notify">
          {(field) => <field.SwitchField label="Notify the team" />}
        </form.AppField>
        <form.AppField name="due">
          {(field) => <field.DateTimeField label="Due" mode="date" />}
        </form.AppField>
        <form.AppField name="colour">
          {(field) => <field.ColorField label="Colour" />}
        </form.AppField>
        <form.SubmitButton createLabel="Save project" />
      </Form>
    </form.AppForm>
  );
}

function PlainFields() {
  return (
    <FormElement onSubmit={noop}>
      <FieldGroup>
        <Field>
          <FieldLabel>Workspace name</FieldLabel>
          <Input defaultValue="Acme" aria-label="Workspace name" />
          <FieldDescription>Shown in the sidebar and in invitations.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Billing email</FieldLabel>
          <Input defaultValue="billing@" aria-label="Billing email" />
          <FieldError errors={[{ message: "Enter a full email address." }]} />
        </Field>
      </FieldGroup>
    </FormElement>
  );
}

function RenameDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)}>
        Open form dialog
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Rename project"
        description="The new name shows everywhere straight away."
      >
        <Input defaultValue="Quarterly review" aria-label="Project name" />
        <FormDialogFooter onCancel={() => setOpen(false)}>
          <Button onPress={() => setOpen(false)}>Rename</Button>
        </FormDialogFooter>
      </FormDialog>
    </>
  );
}

function Rows() {
  const [open, setOpen] = useState(false);
  return (
    <Stack>
      <Section
        title="Notifications"
        description="What reaches your inbox."
        surface="card"
        content={
          <>
            <SettingRow
              title="Mentions"
              description="When someone names you."
              action={<Switch defaultChecked accessibilityLabel="Mentions" />}
            />
            <SettingRow
              title="Weekly summary"
              action={<Switch defaultChecked={false} accessibilityLabel="Weekly summary" />}
            />
          </>
        }
      />
      <DescriptionList
        content={
          <>
            <PropertyRow label="Owner" value="Dana Whitfield" />
            <PropertyRow label="Region" value="eu-west-1" hint="Set when created" />
            <PropertyRow label="Plan" value={<Badge variant="secondary" label="Team" />} />
          </>
        }
      />
      <Disclosure
        title="Advanced"
        description="Rarely needed."
        content={<Text className="text-foreground text-sm">Retention is ninety days.</Text>}
      />
      <DisclosureRow
        open={open}
        onOpenChange={setOpen}
        title="Deploy 482"
        meta="2 minutes ago"
        badges={<Badge variant="success" label="Passed" />}
        content={<Text className="text-foreground text-sm">All 214 checks passed.</Text>}
      />
    </Stack>
  );
}

const idleQuery = { isPending: false, isError: false, error: null, refetch: noop };
const pendingQuery = { ...idleQuery, isPending: true };

type Project = { name: string; owner: string };
const project: Project = { name: "Quarterly review", owner: "Dana Whitfield" };

const navLink = "rounded-md px-3 py-1.5 text-muted-foreground text-sm";

const sections: GallerySection[] = [
  {
    title: "Buttons",
    items: ["button", "action-button", "confirm-button"],
    description:
      "Every variant, then every size. The confirm button opens its question when pressed.",
    content: (
      <Stack>
        <Row>
          <Button onPress={onButtonPress}>Save changes</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="destructive-outline">Remove</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row>
          <Button size="icon-xs" variant="outline" aria-label="Add, extra small">
            <Plus />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Add, small">
            <Plus />
          </Button>
          <Button size="icon" variant="outline" aria-label="Add">
            <Plus />
          </Button>
          <Button size="icon-lg" variant="outline" aria-label="Add, large">
            <Plus />
          </Button>
        </Row>
        <Row>
          <ActionButton label="Download report" variant="outline" size="icon" onPress={noop}>
            <Download />
          </ActionButton>
          <ConfirmButton
            label="Delete project"
            variant="destructive-outline"
            title="Delete this project?"
            description="Its tasks go with it."
            confirmLabel="Delete"
            onConfirm={noop}
          >
            Delete project
          </ConfirmButton>
        </Row>
      </Stack>
    ),
  },
  {
    title: "Badges and chips",
    items: ["badge", "toggle-chip"],
    content: (
      <Stack>
        <Row>
          <Badge label="Default" />
          <Badge variant="secondary" label="Secondary" />
          <Badge variant="outline" label="Outline" />
          <Badge variant="success" label="Success" />
          <Badge variant="warning" label="Warning" />
          <Badge variant="destructive" label="Destructive" />
          <Badge variant="ghost" label="Ghost" />
          <Badge variant="secondary" label="Removable" onRemove={noop} />
        </Row>
        <Row>
          <ToggleChip selected onPress={noop}>
            Selected
          </ToggleChip>
          <ToggleChip selected={false} onPress={noop}>
            Not selected
          </ToggleChip>
          <ToggleChip selected={false} size="sm" onPress={noop}>
            Small
          </ToggleChip>
        </Row>
      </Stack>
    ),
  },
  {
    title: "Icons",
    items: ["icons"],
    description: "A sample of the set. Each takes its size and colour from className.",
    content: (
      <Row>
        <Search className="h-5 w-5 text-foreground" />
        <Settings className="h-5 w-5 text-foreground" />
        <Folder className="h-5 w-5 text-foreground" />
        <FileText className="h-5 w-5 text-foreground" />
        <Tag className="h-5 w-5 text-foreground" />
        <Info className="h-5 w-5 text-muted-foreground" />
        <CircleCheck className="h-5 w-5 text-primary" />
        <TriangleAlert className="h-5 w-5 text-destructive" />
      </Row>
    ),
  },
  {
    title: "Text, code and dividers",
    items: ["label", "code", "separator", "section-heading"],
    content: (
      <Stack>
        <SectionHeading level={3}>Section heading</SectionHeading>
        <SectionHeading variant="overline" level={3}>
          Overline heading
        </SectionHeading>
        <Label>A label</Label>
        <Separator />
        <Text className="text-foreground text-sm">
          Run <Code>npm test</Code> before you push.
        </Text>
        <CodeBlock content={"npx shadcn add @cubeui/button\nnpx shadcn add @cubeui/card"} />
      </Stack>
    ),
  },
  {
    title: "Colour marks",
    items: ["color-dot", "color-bar"],
    content: (
      <Stack>
        <Row>
          <ColorDot color="#2563eb" label="Blue" />
          <ColorDot color="#16a34a" label="Green" />
          <ColorDot color="#dc2626" label="Red" />
          <Caption>Dots</Caption>
        </Row>
        <View className="h-10 flex-row items-stretch gap-2">
          <ColorBar color="#2563eb" label="Blue" />
          <ColorBar color="#16a34a" label="Green" />
          <Caption>Bars</Caption>
        </View>
      </Stack>
    ),
  },
  {
    title: "Alerts",
    items: ["alert"],
    content: (
      <Stack>
        <Alert title="Heads up" description="Your trial ends in three days." />
        <Alert variant="info" title="New version" description="Reload to get the update." />
        <Alert variant="warning" title="Storage nearly full" description="92% of 10 GB used." />
        <Alert
          variant="destructive"
          title="Payment failed"
          description="Update your card to keep the workspace."
        />
      </Stack>
    ),
  },
  {
    title: "Progress and loading",
    items: ["progress", "spinner", "skeleton"],
    content: (
      <Stack>
        <Progress value={40} label="Upload" valueLabel="40%" />
        <Progress value={100} label="Import" valueLabel="Done" />
        <Row>
          <Spinner label="Loading projects" />
          <Caption>Spinner</Caption>
        </Row>
        <View className="flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </View>
      </Stack>
    ),
  },
  {
    title: "Card",
    items: ["card"],
    content: (
      <Stack>
        <Card>
          <CardHeader>
            <CardTitle>Quarterly review</CardTitle>
            <CardDescription>Due on Friday</CardDescription>
          </CardHeader>
          <CardContent>
            <Text className="text-card-foreground text-sm">Twelve open tasks, three overdue.</Text>
          </CardContent>
          <CardFooter>
            <Button size="sm">Open</Button>
          </CardFooter>
        </Card>
        <Card accentColor="#16a34a" accentLabel="Green">
          <CardHeader>
            <CardTitle>With an accent</CardTitle>
            <CardDescription>The bar carries the project's colour.</CardDescription>
          </CardHeader>
        </Card>
      </Stack>
    ),
  },
  {
    title: "Empty",
    items: ["empty"],
    content: (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Folder />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>Create one to start tracking work.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
  },
  {
    title: "List rows",
    items: ["item", "list-item"],
    content: (
      <Stack>
        <ItemGroup>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <FileText />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Launch plan</ItemTitle>
              <ItemDescription>Edited yesterday</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Open
              </Button>
            </ItemActions>
          </Item>
          <ItemSeparator />
          <Item variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>Muted and small</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
        <ListItem
          title="Dana Whitfield"
          description="Owner"
          leading={<ColorDot color="#2563eb" label="Blue" />}
          meta="2 projects"
        />
        <ListItem title="Pressable row" description="Opens the member" onPress={noop} />
      </Stack>
    ),
  },
  {
    title: "Text inputs",
    items: ["input", "search-input", "password-input", "textarea"],
    content: (
      <Stack>
        <Input placeholder="Project name" aria-label="Project name" />
        <SearchInput defaultValue="roadmap" label="Search projects" placeholder="Search…" />
        <PasswordInput defaultValue="hunter2" aria-label="Password" />
        <Textarea placeholder="Notes" rows={3} aria-label="Notes" />
      </Stack>
    ),
  },
  {
    title: "Checkbox and switch",
    items: ["checkbox", "switch", "switch-field"],
    description: "Checked, unchecked and disabled.",
    content: <Toggles />,
  },
  {
    title: "Radio, segmented and tabs",
    items: ["radio-group", "segmented", "tabs"],
    content: <Choices />,
  },
  {
    title: "Selects",
    items: ["select", "option-select", "multi-select"],
    description: "Each list opens from its trigger.",
    content: <Selects />,
  },
  {
    title: "Dates",
    items: ["calendar", "date-time-input", "date-picker"],
    content: <Dates />,
  },
  {
    title: "Colour and theme",
    items: ["color-picker", "theme-picker"],
    content: <ColourAndTheme />,
  },
  {
    title: "File picker",
    items: ["file-picker"],
    description: "On a phone the picker says where picking is available instead of opening one.",
    content: (
      <Stack>
        <FilePicker label="Drop a CSV here" onPick={noop} />
        <FilePickerButton label="Upload a file" variant="outline" onPick={noop} />
      </Stack>
    ),
  },
  {
    title: "Overlays",
    items: ["dialog", "alert-dialog", "popover", "menu", "tooltip", "command"],
    description: "Each stays closed until its trigger is pressed.",
    content: <Overlays />,
  },
  {
    title: "Confirm and toast",
    items: ["confirm-dialog", "confirm", "toast"],
    content: <ConfirmAndToast />,
  },
  {
    title: "Form",
    items: ["form", "radio-group-field", "date-time-field", "color-picker-field"],
    description: "One bound form, a field of each kind.",
    content: <ProjectForm />,
  },
  {
    title: "Fields without a form library",
    items: ["form-element", "field"],
    content: <PlainFields />,
  },
  {
    title: "Form dialog",
    items: ["form-dialog"],
    content: <RenameDialog />,
  },
  {
    title: "Sections and rows",
    items: ["section", "setting-row", "description-list", "disclosure", "disclosure-row"],
    content: <Rows />,
  },
  {
    title: "Stat tiles",
    items: ["stat-tile"],
    content: (
      <View className="flex-row flex-wrap gap-3">
        <StatTile label="Open tasks" value="12" hint="3 due this week" />
        <StatTile label="Overdue" value="3" selected onPress={noop} />
        <StatTile label="Members" value="" loading />
      </View>
    ),
  },
  {
    title: "Page and detail headers",
    items: ["page-header", "detail-header"],
    content: (
      <Stack>
        <PageHeader
          level={3}
          title="Projects"
          description="Everything your team is working on."
          action={<Button size="sm">New project</Button>}
        />
        <Separator />
        <DetailHeader
          onBack={noop}
          backLabel="Back to projects"
          color="#16a34a"
          colorLabel="Green"
          title="Quarterly review"
          subtitle="Due on Friday"
          badge={<Badge variant="success" label="On track" />}
          actions={<EditButton onPress={noop} />}
        />
      </Stack>
    ),
  },
  {
    title: "Query state and route error",
    items: ["query-state", "route-error"],
    description: "Loading, failed, empty, then the screen a route shows when it throws.",
    content: (
      <Stack>
        <RowSkeleton rows={2} />
        <QueryError
          error={new Error("The server did not answer.")}
          onRetry={noop}
          what="projects"
        />
        <QueryState
          query={idleQuery}
          what="projects"
          count={0}
          empty={<Text className="text-muted-foreground text-sm">No projects match.</Text>}
        />
        <QueryState query={pendingQuery} what="members" count={0} rows={1} compact />
        <RouteError error={new Error("Project not found.")} reset={noop} />
      </Stack>
    ),
  },
  {
    title: "Page",
    items: ["page"],
    description: "A scrolling screen: a header, a grid of cards, an empty state.",
    content: (
      <Screen>
        <Page>
          <PageHeader level={3} title="Projects" description="Two active." />
          <CardGrid>
            <Card>
              <CardHeader>
                <CardTitle>Quarterly review</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Launch plan</CardTitle>
              </CardHeader>
            </Card>
          </CardGrid>
          <EmptyState
            level={3}
            icon={Folder}
            title="Nothing archived"
            description="Archived projects show up here."
          />
        </Page>
      </Screen>
    ),
  },
  {
    title: "Page layout",
    items: ["page-layout"],
    content: (
      <Screen>
        <PageLayout
          title="Settings"
          description="For this workspace."
          action={<Button size="sm">Save</Button>}
          footer={<Caption>Last saved a minute ago</Caption>}
          content={<Lines count={6} />}
        />
      </Screen>
    ),
  },
  {
    title: "Detail page",
    items: ["detail-page"],
    description: "The record when it has loaded, a line of text when it has not.",
    content: (
      <Screen>
        <DetailPage<Project> entity={project} loading={false} notFoundLabel="Project not found.">
          {(found) => (
            <DescriptionList
              content={
                <>
                  <PropertyRow label="Name" value={found.name} />
                  <PropertyRow label="Owner" value={found.owner} />
                </>
              }
            />
          )}
        </DetailPage>
        <DetailPage<Project> entity={null} loading={false} notFoundLabel="Project not found.">
          {() => null}
        </DetailPage>
      </Screen>
    ),
  },
  {
    title: "Header, content, footer",
    items: ["header-content-footer"],
    description: "The header and footer stay put; the content scrolls between them.",
    content: (
      <Screen>
        <HeaderContentFooter
          header={<Text className="p-3 font-semibold text-foreground">Inbox</Text>}
          footer={
            <View className="p-3">
              <Button>Compose</Button>
            </View>
          }
          content={
            <View className="p-3">
              <Lines count={30} />
            </View>
          }
        />
      </Screen>
    ),
  },
  {
    title: "Card layout and centred layout",
    items: ["card-layout", "centered-layout"],
    description: "A card with named parts, then the same card centred on a screen.",
    content: (
      <Stack>
        <CardLayout
          level={3}
          title="Team"
          description="Three members."
          action={<Button size="sm">Invite</Button>}
          content={<Lines count={2} />}
          footer={<Caption>Seats are billed monthly</Caption>}
        />
        <Screen>
          <CenteredLayout
            level={3}
            title="Sign in"
            description="Use your work email."
            content={<Input placeholder="you@example.com" aria-label="Email" />}
            footerActions={<Button>Continue</Button>}
          />
        </Screen>
      </Stack>
    ),
  },
  {
    title: "Dialog layout",
    items: ["dialog-layout"],
    content: (
      <DialogLayout
        title="Invite a teammate"
        description="They get an email with a link."
        trigger={<Button variant="outline">Open dialog layout</Button>}
        content={<Input placeholder="name@example.com" aria-label="Teammate's email" />}
        footerActions={(close) => <Button onPress={close}>Send invite</Button>}
      />
    ),
  },
  {
    title: "Sidebar",
    items: ["sidebar"],
    content: (
      <Screen>
        <Sidebar
          label="Workspace"
          header={<Text className="font-semibold text-sidebar-foreground">Acme</Text>}
          footer={<Text className="text-sidebar-foreground text-xs">Signed in as Dana</Text>}
          content={
            <SidebarSection
              as="nav"
              label="Workspace pages"
              title="Workspace"
              content={
                <>
                  <SidebarNavItem label="Projects" icon={<Folder />} count={12} active href="#" />
                  <SidebarNavItem label="Documents" icon={<FileText />} href="#" />
                  <SidebarNavItem label="Settings" icon={<Settings />} href="#" />
                </>
              }
            />
          }
        />
      </Screen>
    ),
  },
  {
    title: "Split layout",
    items: ["split-layout"],
    description: "Two panes, then a screen with a sidebar, both stacked as they are on a phone.",
    content: (
      <Stack>
        <Screen>
          <SplitLayout
            className="h-full"
            stackBelow="xl"
            divider="line"
            first={
              <View className="p-3">
                <Lines count={3} />
              </View>
            }
            second={
              <View className="p-3">
                <Lines count={3} />
              </View>
            }
          />
        </Screen>
        <Screen>
          <SidebarLayout
            className="h-full"
            sidebarPosition="start"
            stackBelow="xl"
            divider="line"
            sidebar={<Text className="p-3 font-semibold text-foreground">Filters</Text>}
            content={
              <View className="p-3">
                <Lines count={4} />
              </View>
            }
          />
        </Screen>
      </Stack>
    ),
  },
  {
    title: "Top bar layout",
    items: ["top-bar-layout"],
    content: (
      <Screen>
        <TopBarLayout
          brand={<Text className="font-semibold text-foreground">Acme</Text>}
          navLabel="Site pages"
          nav={
            <>
              <Text role="link" className={navLink}>
                Projects
              </Text>
              <Text role="link" className={navLink}>
                Team
              </Text>
            </>
          }
          action={
            <Button size="sm" variant="outline">
              Sign out
            </Button>
          }
          content={
            <View className="p-3">
              <Lines count={5} />
            </View>
          }
        />
      </Screen>
    ),
  },
];

/**
 * The whole native registry. `play` checks the page against `registry.json`, that each section has
 * its heading, and that a button and an overlay still answer a press in the middle of it all.
 */
export const Everything: Story = {
  // A phone's viewport, not a narrow column in a wide one: a breakpoint class reads the window, so
  // at desktop width every shell here would lay itself out for a desktop inside 390px.
  globals: { viewport: { value: "mobile2", isRotated: false } },
  render: () => (
    <Gallery
      layout="phone"
      title="Mobile gallery"
      description="Every React Native item in the registry, at the width of a phone."
      sections={sections}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(unaccountedItems(registry.items, sections, NOT_SHOWN)).toEqual([]);

    // Counted by the frame's own marker: a specimen may draw an `h2` of its own.
    const drawn = canvasElement.querySelectorAll("section[data-gallery-items]");
    await expect(drawn).toHaveLength(sections.length);
    for (const section of Array.from(drawn)) {
      await expect(section.querySelector(":scope > div > h2")).not.toBeNull();
    }

    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(onButtonPress).toHaveBeenCalledTimes(1);

    // An overlay renders in a portal, outside the canvas.
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open confirm dialog" }));
    // Waited for: the dialog fades in from nothing, and is in the tree before it can be seen.
    const title = await page.findByText("Archive this project?");
    await waitFor(() => expect(title).toBeVisible());
    await userEvent.click(page.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(page.queryByText("Archive this project?")).toBeNull());

    // `play` runs for a reader too, and the presses above scroll to what they pressed.
    canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
  },
};
