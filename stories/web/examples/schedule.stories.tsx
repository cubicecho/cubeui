import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ComboboxField, InputField, SelectField, useAppForm } from "@/components/app-form";
import { CardLayout } from "@/components/card-layout";
import { ColorField } from "@/components/color-field";
import { DateField } from "@/components/date-field";
import { type DateRange, DateRangePicker } from "@/components/date-picker";
import { DialogLayout } from "@/components/dialog-layout";
import { EmptyState } from "@/components/empty-state";
import { FieldRow } from "@/components/field-row";
import { FormField } from "@/components/form-field";
import { PageLayout } from "@/components/page-layout";
import { Section } from "@/components/section";
import { SettingRow } from "@/components/setting-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorDot } from "@/components/ui/color-dot";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { FormElement } from "@/components/ui/form-element";
import { Clock, Plus, Search } from "@/components/ui/icons";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SegmentedButton, SegmentedGroup } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from "@/lib/format";
import { AppShell, Avatar } from "./app-shell";
import { PEOPLE, TODAY } from "./fixtures";

/**
 * A team schedule: a range and a view in the header, a month calendar with the team's calendars
 * beside it, and the week's events as cards with their colour on the edge, the people on them in
 * tooltips and the details in a popover. A palette (⌘K or Ctrl+K, or the Search button) jumps to
 * an event or an action, and New event opens a form with a date, a time and a colour.
 */
type Args = { empty: boolean };

const meta = {
  title: "Examples/Web/Schedule",
  parameters: { layout: "fullscreen" },
  args: { empty: false },
  argTypes: {
    empty: { control: "boolean", description: "A week with nothing booked in it." },
  },
  render: (args) => (
    <ToastProvider>
      <TooltipProvider delayDuration={200}>
        <AppShell current="schedule" page={<Schedule {...args} />} />
      </TooltipProvider>
    </ToastProvider>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

type CalendarId = "studio" | "launches" | "time-off";

const CALENDARS: readonly { id: CalendarId; name: string; color: string }[] = [
  { id: "studio", name: "Studio", color: "#2563eb" },
  { id: "launches", name: "Launches", color: "#dc2626" },
  { id: "time-off", name: "Time off", color: "#16a34a" },
];

type Event = {
  id: string;
  title: string;
  calendar: CalendarId;
  starts: Date;
  minutes: number;
  where: string;
  people: readonly string[];
  note?: string;
};

const at = (days: number, hours: number, minutes = 0) =>
  new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + days, hours, minutes);

const EVENTS: readonly Event[] = [
  {
    id: "e1",
    title: "Design review",
    calendar: "studio",
    starts: at(0, 10),
    minutes: 60,
    where: "Room 2, and the video link",
    people: ["mara", "ines", "sana"],
    note: "Bring the onboarding flow, both directions.",
  },
  {
    id: "e2",
    title: "Beacon app 1.4 goes out",
    calendar: "launches",
    starts: at(0, 15, 30),
    minutes: 30,
    where: "Release channel",
    people: ["theo", "kofi"],
  },
  {
    id: "e3",
    title: "Pairing: notifications",
    calendar: "studio",
    starts: at(0, 15),
    minutes: 90,
    where: "Theo's desk",
    people: ["theo", "kofi"],
    note: "Clashes with the release; one of them moves.",
  },
  {
    id: "e4",
    title: "Mara out",
    calendar: "time-off",
    starts: at(3, 0),
    minutes: 60 * 24,
    where: "—",
    people: ["mara"],
  },
  {
    id: "e5",
    title: "Weekly planning",
    calendar: "studio",
    starts: at(3, 9, 30),
    minutes: 45,
    where: "Room 1",
    people: ["ines", "mara", "theo", "kofi", "sana"],
  },
];

const timeOf = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const endOf = (event: Event) => new Date(event.starts.getTime() + event.minutes * 60 * 1000);

const overlaps = (a: Event, b: Event) =>
  a.id !== b.id && a.starts < endOf(b) && b.starts < endOf(a) && a.minutes < 60 * 24;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function NewEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const form = useAppForm({
    defaultValues: {
      title: "",
      calendar: "studio",
      starts: at(1, 10) as Date | null,
      ends: at(1, 11),
      color: "#2563eb",
      people: [] as string[],
      where: "",
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast(`“${value.title}” added to the schedule.`, "positive");
      onOpenChange(false);
      form.reset();
    },
  });
  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="New event"
      description="Everyone on it gets an invitation by email."
      hasUnsavedChanges={() => form.state.isDefaultValue === false}
      contentSlot={
        <FormElement onSubmit={() => form.handleSubmit()} className="flex flex-col gap-4">
          <InputField
            form={form}
            name="title"
            label="Title"
            required
            placeholder="Kick-off"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Name the event.") }}
          />
          <FieldRow
            contentSlot={
              <>
                <DateField
                  form={form}
                  name="starts"
                  label="Starts"
                  showTime
                  validators={{
                    onChange: ({ value }) => (value ? undefined : "Pick when it starts."),
                  }}
                />
                {/* No bound field holds a `DateTimeInput`, so this one is wired by hand. */}
                <form.Field name="ends">
                  {(field) => (
                    <FormField
                      label="Ends"
                      asGroup
                      controlSlot={(props, parts) => (
                        <DateTimeInput
                          {...props}
                          aria-labelledby={parts.labelId}
                          value={field.state.value}
                          onChange={(next) => field.handleChange(next)}
                        />
                      )}
                    />
                  )}
                </form.Field>
              </>
            }
          />
          <FieldRow
            contentSlot={
              <>
                <SelectField
                  form={form}
                  name="calendar"
                  label="Calendar"
                  options={CALENDARS.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                />
                <InputField form={form} name="where" label="Where" placeholder="Room 2" />
              </>
            }
          />
          <ComboboxField
            multiple
            form={form}
            name="people"
            label="People"
            options={PEOPLE.map((person) => ({
              value: person.id,
              label: person.name,
              meta: person.role,
            }))}
            placeholder="Just me"
          />
          <ColorField
            form={form}
            name="color"
            label="Colour"
            description="Overrides the calendar's."
          />
        </FormElement>
      }
      footerActionsSlot={(close) => (
        <>
          <Button variant="outline" onClick={close} content="Cancel" />
          <form.AppForm>
            <form.SubmitButton variant="info" content="Add event" pendingLabel="Adding…" />
          </form.AppForm>
        </>
      )}
    />
  );
}

function EventCard({ event, clash }: { event: Event; clash: boolean }) {
  const calendar = CALENDARS.find((c) => c.id === event.calendar);
  const allDay = event.minutes >= 60 * 24;
  return (
    <Card accentColor={calendar?.color} accentLabel={calendar?.name} className="pl-2">
      <CardHeader>
        <CardTitle level={3}>{event.title}</CardTitle>
        <CardDescription>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {allDay ? "All day" : `${timeOf(event.starts)} – ${timeOf(endOf(event))}`}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ul className="-space-x-1.5 m-0 flex list-none p-0" aria-label="People">
            {event.people.map((id) => {
              const person = PEOPLE.find((p) => p.id === id);
              return person ? (
                <li key={id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={person.name}
                        className="rounded-full ring-2 ring-secondary"
                      >
                        <Avatar name={person.name} size="sm" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {person.name} · {person.role}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ) : null;
            })}
          </ul>
          {clash ? <Badge variant="warning-soft">Clashes</Badge> : null}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" content="Details" />
          </PopoverTrigger>
          <PopoverContent align="end" aria-label={`${event.title} details`}>
            <PopoverHeader>
              <PopoverTitle>{event.title}</PopoverTitle>
              <PopoverDescription>
                {formatDate(event.starts)} · {calendar?.name}
              </PopoverDescription>
            </PopoverHeader>
            <p className="flex items-center gap-2 text-foreground text-sm">
              <MapPin className="size-4 text-foreground/60" aria-hidden />
              {event.where}
            </p>
            {event.note ? <p className="text-foreground/60 text-sm">{event.note}</p> : null}
            <div className="flex justify-end">
              <PopoverClose asChild>
                <Button size="sm" variant="outline" content="Done" />
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}

function Schedule({ empty }: Args) {
  const [range, setRange] = useState<DateRange | null>({ from: at(0, 0), to: at(6, 0) });
  const [view, setView] = useState("week");
  const [day, setDay] = useState<Date | undefined>(TODAY);
  const [shown, setShown] = useState<ReadonlySet<CalendarId>>(
    new Set(["studio", "launches", "time-off"]),
  );
  const [palette, setPalette] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const events = (empty ? [] : EVENTS).filter((event) => shown.has(event.calendar));
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => at(offset, 0));

  return (
    <>
      <PageLayout
        title="Schedule"
        description="The studio's week: reviews, launches and who is away."
        actionSlot={
          <>
            <Button
              size="sm"
              variant="outline"
              iconSlot={<Search />}
              content="Search"
              trailingSlot={
                <kbd className="rounded border border-foreground/10 px-1 font-mono text-[10px] text-foreground/60">
                  ⌘K
                </kbd>
              }
              onClick={() => setPalette(true)}
            />
            <Button
              size="sm"
              variant="info"
              iconSlot={<Plus />}
              content="New event"
              onClick={() => setCreating(true)}
            />
          </>
        }
        headerContentSlot={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              aria-label="Dates shown"
              className="w-72"
              value={range}
              onValueChange={setRange}
              numberOfMonths={2}
            />
            <SegmentedGroup aria-label="View" value={view} onValueChange={setView}>
              <SegmentedButton value="day">Day</SegmentedButton>
              <SegmentedButton value="week">Week</SegmentedButton>
              <SegmentedButton value="month">Month</SegmentedButton>
            </SegmentedGroup>
          </div>
        }
        contentSlot={
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <CardLayout
                contentSlot={
                  <Calendar
                    mode="single"
                    selected={day}
                    onSelect={setDay}
                    defaultMonth={TODAY}
                    modifiers={{ busy: events.map((event) => event.starts) }}
                    modifiersClassNames={{ busy: "font-bold underline decoration-info" }}
                  />
                }
              />
              <Section
                title="Calendars"
                surface="card"
                contentSlot={CALENDARS.map((calendar) => (
                  <SettingRow
                    key={calendar.id}
                    title={
                      <span className="flex items-center gap-2">
                        <ColorDot color={calendar.color} />
                        {calendar.name}
                      </span>
                    }
                    actionSlot={
                      <Switch
                        aria-label={`Show ${calendar.name}`}
                        checked={shown.has(calendar.id)}
                        onCheckedChange={(on) =>
                          setShown((all) => {
                            const next = new Set(all);
                            if (on) {
                              next.add(calendar.id);
                            } else {
                              next.delete(calendar.id);
                            }
                            return next;
                          })
                        }
                      />
                    }
                  />
                ))}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              {events.length === 0 ? (
                <EmptyState
                  iconSlot={<CalendarDays />}
                  title="Nothing booked this week"
                  description="A clear week. Add an event, or widen the dates."
                  actionSlot={
                    <Button
                      variant="info"
                      iconSlot={<Plus />}
                      content="New event"
                      onClick={() => setCreating(true)}
                    />
                  }
                />
              ) : (
                days
                  .map((date) => ({
                    date,
                    items: events
                      .filter((event) => sameDay(event.starts, date))
                      .toSorted((a, b) => a.starts.getTime() - b.starts.getTime()),
                  }))
                  .filter(({ items }) => items.length > 0)
                  .map(({ date, items }) => (
                    <Section
                      key={date.toISOString()}
                      title={
                        sameDay(date, TODAY) ? `Today · ${formatDate(date)}` : formatDate(date)
                      }
                      contentSlot={
                        <div className="grid gap-3 xl:grid-cols-2">
                          {items.map((event) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              clash={items.some((other) => overlaps(event, other))}
                            />
                          ))}
                        </div>
                      }
                    />
                  ))
              )}
            </div>
          </div>
        }
      />

      <CommandDialog
        open={palette}
        onOpenChange={setPalette}
        title="Search the schedule"
        description="Jump to an event or a day, or start something new."
      >
        <CommandInput placeholder="Search events and actions…" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Events">
            {EVENTS.map((event) => (
              <CommandItem
                key={event.id}
                value={event.title}
                keywords={event.people.map((id) => PEOPLE.find((p) => p.id === id)?.name ?? id)}
                onSelect={() => {
                  setDay(event.starts);
                  setPalette(false);
                }}
              >
                <ColorDot color={CALENDARS.find((c) => c.id === event.calendar)?.color ?? "#888"} />
                {event.title}
                <CommandShortcut>{formatDate(event.starts)}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="New event"
              onSelect={() => {
                setPalette(false);
                setCreating(true);
              }}
            >
              <Plus />
              New event
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="Go to today"
              onSelect={() => {
                setDay(TODAY);
                setPalette(false);
              }}
            >
              <CalendarDays />
              Go to today
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <NewEventDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

/** The week, with two events that clash. Opens the palette with the keyboard and searches it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await body.findByRole("dialog", { name: "Search the schedule" });
    await userEvent.type(within(dialog).getByRole("combobox"), "planning");
    await expect(within(dialog).getByRole("option", { name: /Weekly planning/ })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** The New event form, open. */
export const NewEvent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New event" }));
    await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "New event" });
  },
};

/** A week with nothing in it. */
export const EmptyWeek: Story = { args: { empty: true } };
